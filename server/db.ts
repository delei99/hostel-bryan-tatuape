import { and, desc, eq, gt, lt, or, inArray, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, InsertGuest, guests, rooms, bookings, InsertBooking, roomPhotos, InsertRoomPhoto, RoomPhoto, blockedDates, InsertBlockedDate, BlockedDate, auditLogs, InsertAuditLog, AuditLog, failedUnblockAttempts, InsertFailedUnblockAttempt, FailedUnblockAttempt, blockingExceptions, InsertBlockingException, BlockingException, homeImages, InsertHomeImage, HomeImage, monthlyRevenueHistory, InsertMonthlyRevenueHistory, MonthlyRevenueHistory } from "../drizzle/schema";
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
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.openId, user.openId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(users).values(user);
    } else {
      await db
        .update(users)
        .set(user)
        .where(eq(users.openId, user.openId));
    }
  } catch (error) {
    console.error("[Database] Error upserting user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.openId, openId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error getting user by openId:", error);
    return null;
  }
}

export async function createGuest(guest: InsertGuest) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(guests).values(guest);
    return result;
  } catch (error) {
    console.error("[Database] Error creating guest:", error);
    throw error;
  }
}

export async function getGuestById(id: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(guests)
      .where(eq(guests.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error getting guest by id:", error);
    return null;
  }
}

export async function getAllGuests() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(guests);
    return result;
  } catch (error) {
    console.error("[Database] Error getting all guests:", error);
    return [];
  }
}

export async function createRoom(room: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(rooms).values(room);
    return result;
  } catch (error) {
    console.error("[Database] Error creating room:", error);
    throw error;
  }
}

export async function getRoomById(id: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error getting room by id:", error);
    return null;
  }
}

export async function getAllRooms() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(rooms);
    return result;
  } catch (error) {
    console.error("[Database] Error getting all rooms:", error);
    return [];
  }
}

export async function updateRoom(id: number, updates: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db
      .update(rooms)
      .set(updates)
      .where(eq(rooms.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Error updating room:", error);
    throw error;
  }
}

export async function deleteRoom(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db
      .delete(rooms)
      .where(eq(rooms.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Error deleting room:", error);
    throw error;
  }
}

export async function createBooking(booking: InsertBooking) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(bookings).values(booking);
    return result;
  } catch (error) {
    console.error("[Database] Error creating booking:", error);
    throw error;
  }
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select({
        booking: {
          id: bookings.id,
          guestId: bookings.guestId,
          roomId: bookings.roomId,
          checkInDate: bookings.checkInDate,
          checkOutDate: bookings.checkOutDate,
          checkInTime: bookings.checkInTime,
          checkOutTime: bookings.checkOutTime,
          numberOfGuests: bookings.numberOfGuests,
          specialRequests: bookings.specialRequests,
          status: bookings.status,
          confirmationCode: bookings.confirmationCode,
          createdAt: bookings.createdAt,
          updatedAt: bookings.updatedAt,
          paymentAtBooking: bookings.paymentAtBooking,
          paymentAtCheckIn: bookings.paymentAtCheckIn,
          isExtension: bookings.isExtension,
          parentBookingId: bookings.parentBookingId,
          extensionCleaningFee: bookings.extensionCleaningFee,
        },
        guest: {
          id: guests.id,
          firstName: guests.firstName,
          lastName: guests.lastName,
          email: guests.email,
          phone: guests.phone,
          cpf: guests.cpf,
          nationality: guests.nationality,
          dateOfBirth: guests.dateOfBirth,
        },
        room: {
          id: rooms.id,
          name: rooms.name,
          type: rooms.type,
          capacity: rooms.capacity,
          pricePerNight: rooms.pricePerNight,
          cleaningFee: rooms.cleaningFee,
          discount7Days: rooms.discount7Days,
          discount15Days: rooms.discount15Days,
          discount30Days: rooms.discount30Days,
          singleGuestDiscountType: rooms.singleGuestDiscountType,
          singleGuestDiscountValue: rooms.singleGuestDiscountValue,
          description: rooms.description,
          amenities: rooms.amenities,
          imageUrl: rooms.imageUrl,
          additionalImages: rooms.additionalImages,
          status: rooms.status,
        },
      })
      .from(bookings)
      .innerJoin(guests, eq(bookings.guestId, guests.id))
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(eq(bookings.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error getting booking by id:", error);
    return null;
  }
}

export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        booking: {
          id: bookings.id,
          guestId: bookings.guestId,
          roomId: bookings.roomId,
          checkInDate: bookings.checkInDate,
          checkOutDate: bookings.checkOutDate,
          checkInTime: bookings.checkInTime,
          checkOutTime: bookings.checkOutTime,
          numberOfGuests: bookings.numberOfGuests,
          specialRequests: bookings.specialRequests,
          status: bookings.status,
          confirmationCode: bookings.confirmationCode,
          createdAt: bookings.createdAt,
          updatedAt: bookings.updatedAt,
          paymentAtBooking: bookings.paymentAtBooking,
          paymentAtCheckIn: bookings.paymentAtCheckIn,
          isExtension: bookings.isExtension,
          parentBookingId: bookings.parentBookingId,
          extensionCleaningFee: bookings.extensionCleaningFee,
        },
        guest: {
          id: guests.id,
          firstName: guests.firstName,
          lastName: guests.lastName,
          email: guests.email,
          phone: guests.phone,
          cpf: guests.cpf,
          nationality: guests.nationality,
        },
        room: {
          id: rooms.id,
          name: rooms.name,
          type: rooms.type,
          capacity: rooms.capacity,
          pricePerNight: rooms.pricePerNight,
          cleaningFee: rooms.cleaningFee,
          discount7Days: rooms.discount7Days,
          discount15Days: rooms.discount15Days,
          discount30Days: rooms.discount30Days,
          singleGuestDiscountType: rooms.singleGuestDiscountType,
          singleGuestDiscountValue: rooms.singleGuestDiscountValue,
          description: rooms.description,
          amenities: rooms.amenities,
          imageUrl: rooms.imageUrl,
          additionalImages: rooms.additionalImages,
          status: rooms.status,
        },
      })
      .from(bookings)
      .innerJoin(guests, eq(bookings.guestId, guests.id))
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .orderBy(desc(bookings.createdAt));

    return result;
  } catch (error) {
    console.error("[Database] Error getting all bookings:", error);
    return [];
  }
}

export async function updateBooking(id: number, updates: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Error updating booking:", error);
    throw error;
  }
}

export async function deleteBooking(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db
      .delete(bookings)
      .where(eq(bookings.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Error deleting booking:", error);
    throw error;
  }
}

export async function getBlockedDates(roomId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(blockedDates)
      .where(eq(blockedDates.roomId, roomId));

    return result;
  } catch (error) {
    console.error("[Database] Error getting blocked dates:", error);
    return [];
  }
}

export async function blockDate(roomId: number, date: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(blockedDates).values({
      roomId,
      date,
    });
    return result;
  } catch (error) {
    console.error("[Database] Error blocking date:", error);
    throw error;
  }
}

export async function unblockDate(roomId: number, date: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db
      .delete(blockedDates)
      .where(and(eq(blockedDates.roomId, roomId), eq(blockedDates.date, date)));
    return result;
  } catch (error) {
    console.error("[Database] Error unblocking date:", error);
    throw error;
  }
}

export async function getAuditLogs(roomId?: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db.select().from(auditLogs);
    if (roomId) {
      query = query.where(eq(auditLogs.roomId, roomId));
    }
    const result = await query.orderBy(desc(auditLogs.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Error getting audit logs:", error);
    return [];
  }
}

export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(auditLogs).values(log);
    return result;
  } catch (error) {
    console.error("[Database] Error creating audit log:", error);
    throw error;
  }
}

export async function getFailedUnblockAttempts(roomId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(failedUnblockAttempts)
      .where(eq(failedUnblockAttempts.roomId, roomId))
      .orderBy(desc(failedUnblockAttempts.createdAt));

    return result;
  } catch (error) {
    console.error("[Database] Error getting failed unblock attempts:", error);
    return [];
  }
}

export async function recordFailedUnblockAttempt(attempt: InsertFailedUnblockAttempt) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(failedUnblockAttempts).values(attempt);
    return result;
  } catch (error) {
    console.error("[Database] Error recording failed unblock attempt:", error);
    throw error;
  }
}

export async function getBlockingExceptions(roomId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(blockingExceptions)
      .where(eq(blockingExceptions.roomId, roomId));

    return result;
  } catch (error) {
    console.error("[Database] Error getting blocking exceptions:", error);
    return [];
  }
}

export async function createBlockingException(exception: InsertBlockingException) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(blockingExceptions).values(exception);
    return result;
  } catch (error) {
    console.error("[Database] Error creating blocking exception:", error);
    throw error;
  }
}

export async function deleteBlockingException(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db
      .delete(blockingExceptions)
      .where(eq(blockingExceptions.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Error deleting blocking exception:", error);
    throw error;
  }
}

export async function getRoomPhotos(roomId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(roomPhotos)
      .where(eq(roomPhotos.roomId, roomId));

    return result;
  } catch (error) {
    console.error("[Database] Error getting room photos:", error);
    return [];
  }
}

export async function createRoomPhoto(photo: InsertRoomPhoto) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(roomPhotos).values(photo);
    return result;
  } catch (error) {
    console.error("[Database] Error creating room photo:", error);
    throw error;
  }
}

export async function deleteRoomPhoto(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db
      .delete(roomPhotos)
      .where(eq(roomPhotos.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Error deleting room photo:", error);
    throw error;
  }
}

export async function getHomeImages() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(homeImages);
    return result;
  } catch (error) {
    console.error("[Database] Error getting home images:", error);
    return [];
  }
}

export async function createHomeImage(image: InsertHomeImage) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(homeImages).values(image);
    return result;
  } catch (error) {
    console.error("[Database] Error creating home image:", error);
    throw error;
  }
}

export async function deleteHomeImage(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db
      .delete(homeImages)
      .where(eq(homeImages.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Error deleting home image:", error);
    throw error;
  }
}

export async function getMonthlyRevenueHistory(roomId?: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db.select().from(monthlyRevenueHistory);
    if (roomId) {
      query = query.where(eq(monthlyRevenueHistory.roomId, roomId));
    }
    const result = await query.orderBy(desc(monthlyRevenueHistory.month));
    return result;
  } catch (error) {
    console.error("[Database] Error getting monthly revenue history:", error);
    return [];
  }
}

export async function createMonthlyRevenueHistory(revenue: InsertMonthlyRevenueHistory) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(monthlyRevenueHistory).values(revenue);
    return result;
  } catch (error) {
    console.error("[Database] Error creating monthly revenue history:", error);
    throw error;
  }
}

export async function extendBooking(
  originalBookingId: number,
  newCheckOutDate: string,
  numberOfGuests: number,
  roomId: number,
  guestId: number,
  checkInTime: string,
  checkOutTime: string,
  chargeCleaningFee: boolean,
  pricePerNight: number,
  cleaningFee: number,
  singleGuestDiscountType: string,
  singleGuestDiscountValue: number
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Get original booking
    const originalBooking = await getBookingById(originalBookingId);
    if (!originalBooking) {
      throw new Error("Original booking not found");
    }

    // Calculate days for extension
    const checkOutDate = new Date(originalBooking.booking.checkOutDate);
    const newCheckOut = new Date(newCheckOutDate);
    const nights = Math.ceil((newCheckOut.getTime() - checkOutDate.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      throw new Error("Extension must be at least 1 day");
    }

    // Calculate price for extension
    let subtotal = nights * pricePerNight;

    // Apply single guest discount if applicable
    let discount = 0;
    if (numberOfGuests === 1) {
      if (singleGuestDiscountType === "percentage") {
        discount = Math.floor(subtotal * singleGuestDiscountValue / 100);
      } else {
        discount = singleGuestDiscountValue;
      }
    }

    const extensionFee = chargeCleaningFee ? cleaningFee : 0;
    const total = subtotal - discount + extensionFee;

    // Create new booking for extension
    const extensionBooking = await createBooking({
      guestId,
      roomId,
      checkInDate: originalBooking.booking.checkOutDate,
      checkOutDate: newCheckOutDate,
      checkInTime,
      checkOutTime,
      numberOfGuests,
      specialRequests: `Extensão da reserva #${originalBooking.booking.confirmationCode}`,
      status: "pending",
      confirmationCode: `EXT-${Date.now()}`,
      paymentAtBooking: 0,
      paymentAtCheckIn: total,
      isExtension: 1,
      parentBookingId: originalBookingId,
      extensionCleaningFee: extensionFee,
    });

    // Block dates for extension
    for (let i = 0; i < nights; i++) {
      const date = new Date(checkOutDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      await blockDate(roomId, dateStr);
    }

    return extensionBooking;
  } catch (error) {
    console.error("[Database] Error extending booking:", error);
    throw error;
  }
}

/**
 * Buscar hóspedes por nome, CPF ou Passaporte (para autocomplete)
 */
export async function searchGuestsByName(name: string) {
  const db = await getDb();
  if (!db) return [];

  try {
    const searchTerm = `%${name}%`;
    const cleanedCPF = name.replace(/[^0-9]/g, '');
    
    // Construir array de condições de busca
    const conditions: any[] = [
      like(guests.firstName, searchTerm),
      like(guests.lastName, searchTerm),
      like(sql`CONCAT(${guests.firstName}, ' ', ${guests.lastName})`, searchTerm),
      like(guests.documentNumberPassport, searchTerm),
    ];
    
    // Adicionar busca por CPF se tiver pelo menos 3 dígitos
    if (cleanedCPF.length >= 3) {
      conditions.push(like(guests.cpf, `%${cleanedCPF}%`));
    }
    
    const results = await db
      .select({
        id: guests.id,
        firstName: guests.firstName,
        lastName: guests.lastName,
        email: guests.email,
        phone: guests.phone,
        cpf: guests.cpf,
        nationality: guests.nationality,
      })
      .from(guests)
      .where(or(...conditions))
      .limit(10);

    return results.map(guest => ({
      ...guest,
      fullName: `${guest.firstName} ${guest.lastName}`,
    }));
  } catch (error) {
    console.error("[Database] Error searching guests by name:", error);
    return [];
  }
}
