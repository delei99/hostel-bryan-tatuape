import { and, desc, eq, gt, lt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, InsertGuest, guests, rooms, bookings, InsertBooking, roomPhotos, InsertRoomPhoto, RoomPhoto, blockedDates, InsertBlockedDate, BlockedDate } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Query helpers para quartos
 */
export async function getAllRooms() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rooms);
}

export async function getRoomById(roomId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRoomAvailability(roomId: number, checkInDate: Date, checkOutDate: Date) {
  const db = await getDb();
  if (!db) return { available: false, bookedDates: [] };
  
  // Buscar reservas confirmadas que conflitem com as datas
  const conflictingBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.roomId, roomId),
        or(
          eq(bookings.status, "confirmed"),
          eq(bookings.status, "checked_in")
        ),
        // Verificar conflito de datas
        and(
          lt(bookings.checkInDate, checkOutDate),
          gt(bookings.checkOutDate, checkInDate)
        )
      )
    );

  return {
    available: conflictingBookings.length === 0,
    bookedDates: conflictingBookings.map(b => ({
      checkIn: b.checkInDate,
      checkOut: b.checkOutDate
    }))
  };
}

/**
 * Query helpers para hóspedes
 */
export async function createOrUpdateGuest(guestData: InsertGuest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se o hóspede já existe pelo email
  const existing = await db
    .select()
    .from(guests)
    .where(eq(guests.email, guestData.email))
    .limit(1);
  
  if (existing.length > 0) {
    // Atualizar hóspede existente
    await db
      .update(guests)
      .set(guestData)
      .where(eq(guests.id, existing[0].id));
    return existing[0].id;
  } else {
    // Criar novo hóspede
    const result = await db.insert(guests).values(guestData);
    return result[0].insertId;
  }
}

/**
 * Query helpers para reservas
 */
export async function createBooking(bookingData: InsertBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bookings).values(bookingData);
  return result[0].insertId;
}

export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select({
      booking: bookings,
      guest: guests,
      room: rooms
    })
    .from(bookings)
    .innerJoin(guests, eq(bookings.guestId, guests.id))
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .orderBy(desc(bookings.createdAt));
}

export async function getBookingById(bookingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select({
      booking: bookings,
      guest: guests,
      room: rooms
    })
    .from(bookings)
    .innerJoin(guests, eq(bookings.guestId, guests.id))
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBookingStatus(bookingId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(bookings)
    .set({ status: status as any })
    .where(eq(bookings.id, bookingId));
}

export async function getBookingsByGuestEmail(email: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select({
      booking: bookings,
      guest: guests,
      room: rooms
    })
    .from(bookings)
    .innerJoin(guests, eq(bookings.guestId, guests.id))
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(eq(guests.email, email))
    .orderBy(desc(bookings.createdAt));
}

// Funções para gerenciar fotos dos quartos
export async function addRoomPhoto(photo: InsertRoomPhoto) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add room photo: database not available");
    return null;
  }

  try {
    const result = await db.insert(roomPhotos).values(photo);
    return result;
  } catch (error) {
    console.error("[Database] Failed to add room photo:", error);
    throw error;
  }
}

export async function getRoomPhotos(roomId: number): Promise<RoomPhoto[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return db
      .select()
      .from(roomPhotos)
      .where(eq(roomPhotos.roomId, roomId))
      .orderBy(roomPhotos.displayOrder);
  } catch (error) {
    console.error("[Database] Failed to get room photos:", error);
    return [];
  }
}

export async function deleteRoomPhoto(photoId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete room photo: database not available");
    return false;
  }

  try {
    await db.delete(roomPhotos).where(eq(roomPhotos.id, photoId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete room photo:", error);
    return false;
  }
}

export async function updateRoomPhoto(photoId: number, updates: Partial<InsertRoomPhoto>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update room photo: database not available");
    return null;
  }

  try {
    const result = await db
      .update(roomPhotos)
      .set(updates)
      .where(eq(roomPhotos.id, photoId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to update room photo:", error);
    throw error;
  }
}


/**
 * Query helpers para bloqueio de datas
 */
export async function createBlockedDate(blockedDateData: InsertBlockedDate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(blockedDates).values(blockedDateData);
  return result[0].insertId;
}

export async function getBlockedDates(roomId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(blockedDates)
    .where(
      and(
        eq(blockedDates.roomId, roomId),
        lt(blockedDates.startDate, endDate),
        gt(blockedDates.endDate, startDate)
      )
    );
}

export async function deleteBlockedDate(blockedDateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(blockedDates).where(eq(blockedDates.id, blockedDateId));
}

export async function getAllBlockedDates(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(blockedDates)
    .where(eq(blockedDates.roomId, roomId))
    .orderBy(desc(blockedDates.startDate));
}
