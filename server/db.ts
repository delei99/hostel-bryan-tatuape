import { and, desc, eq, gt, lt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, InsertGuest, guests, rooms, bookings, InsertBooking, roomPhotos, InsertRoomPhoto, RoomPhoto, blockedDates, InsertBlockedDate, BlockedDate, auditLogs, InsertAuditLog, AuditLog, failedUnblockAttempts, InsertFailedUnblockAttempt, FailedUnblockAttempt, blockingExceptions, InsertBlockingException, BlockingException } from "../drizzle/schema";
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
  
  // Converter datas para formato YYYY-MM-DD para comparação
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const checkInStr = formatDate(checkInDate);
  const checkOutStr = formatDate(checkOutDate);
  
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
        // Verificar conflito de datas (comparar como strings)
        and(
          lt(bookings.checkInDate, checkOutStr),
          gt(bookings.checkOutDate, checkInStr)
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
export async function createBooking(bookingData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { guests } = await import("../drizzle/schema");
  const guestResult = await db.insert(guests).values({
    firstName: bookingData.firstName,
    lastName: bookingData.lastName,
    email: bookingData.email,
    phone: bookingData.phone,
    cpf: bookingData.cpf,
    nationality: bookingData.nationality,
  });
  
  // Extrair guestId com suporte a diferentes formatos de retorno do Drizzle
  let guestId: number;
  if ((guestResult as any).insertId) {
    guestId = Number((guestResult as any).insertId);
  } else if (Array.isArray(guestResult) && (guestResult[0] as any)?.insertId) {
    guestId = Number((guestResult[0] as any).insertId);
  } else if ((guestResult as any)[0]?.insertId) {
    guestId = Number((guestResult as any)[0].insertId);
  } else {
    console.error('[createBooking] guestResult:', guestResult);
    throw new Error("Failed to create guest: could not extract insertId");
  }
  if (!guestId || isNaN(guestId)) throw new Error("Failed to create guest: invalid guestId");
  
  const bookingToInsert = {
    guestId,
    roomId: bookingData.roomId,
    checkInDate: bookingData.checkInDate,
    checkOutDate: bookingData.checkOutDate,
    numberOfGuests: bookingData.numberOfGuests,
    dailyType: bookingData.dailyType,
    subtotal: bookingData.subtotal,
    totalPrice: bookingData.totalPrice,
    checkInTime: bookingData.checkInTime,
    checkOutTime: bookingData.checkOutTime,
    discountPercentage: bookingData.discountPercentage || 0,
    discountAmount: bookingData.discountAmount || 0,
    cleaningFee: bookingData.cleaningFee || 700,
    specialRequests: bookingData.specialRequests,
  };
  
  const result = await db.insert(bookings).values(bookingToInsert);
  
  // Extrair bookingId com suporte a diferentes formatos de retorno do Drizzle
  let bookingId: number;
  if ((result as any).insertId) {
    bookingId = Number((result as any).insertId);
  } else if (Array.isArray(result) && (result[0] as any)?.insertId) {
    bookingId = Number((result[0] as any).insertId);
  } else if ((result as any)[0]?.insertId) {
    bookingId = Number((result as any)[0].insertId);
  } else {
    console.error('[createBooking] bookingResult:', result);
    throw new Error("Failed to create booking: could not extract insertId");
  }
  if (!bookingId || isNaN(bookingId)) throw new Error("Failed to create booking: invalid bookingId");
  
  // Bloquear automaticamente as datas da reserva
  try {
    // Usar timezone local para evitar problemas de conversão
    const [checkInYear, checkInMonth, checkInDay] = bookingData.checkInDate.split('-').map(Number);
    const [checkOutYear, checkOutMonth, checkOutDay] = bookingData.checkOutDate.split('-').map(Number);
    
    // Criar timestamps em timezone local (sem UTC)
    const startDate = new Date(checkInYear, checkInMonth - 1, checkInDay, 0, 0, 0, 0);
    const endDate = new Date(checkOutYear, checkOutMonth - 1, checkOutDay, 23, 59, 59, 999);
    
    await createBlockedDate({
      roomId: bookingData.roomId,
      startDate,
      endDate,
      reason: `Reserva automática - Hóspede: ${bookingData.firstName} ${bookingData.lastName}`,
    });
  } catch (error) {
    console.error("[Booking] Erro ao bloquear datas automaticamente:", error);
    // Não falhar a reserva se o bloqueio automático falhar
  }
  
  // Gerar código de confirmação único (formato: YYYYMMDD-XXXXX)
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const confirmationCode = `${dateStr}-${randomStr}`;
  
  // Atualizar booking com o código de confirmação
  await db.update(bookings).set({ confirmationCode }).where(eq(bookings.id, bookingId));
  
  // Retornar dados completos da reserva com confirmationCode
  return {
    id: bookingId,
    guestId,
    confirmationCode,
    roomId: bookingData.roomId,
    checkInDate: bookingData.checkInDate,
    checkOutDate: bookingData.checkOutDate,
    numberOfGuests: bookingData.numberOfGuests,
    dailyType: bookingData.dailyType,
    subtotal: bookingData.subtotal,
    totalPrice: bookingData.totalPrice,
    checkInTime: bookingData.checkInTime,
    checkOutTime: bookingData.checkOutTime,
    discountPercentage: bookingData.discountPercentage || 0,
    discountAmount: bookingData.discountAmount || 0,
    cleaningFee: bookingData.cleaningFee || 700,
    specialRequests: bookingData.specialRequests,
  };
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


// Audit Log functions
export async function createAuditLog(data: InsertAuditLog): Promise<AuditLog | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Remover campos undefined para evitar erros de inserção
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  ) as InsertAuditLog;
  
  try {
    const result = await db.insert(auditLogs).values(cleanData);
    const insertId = (result as any).insertId;
    if (!insertId) return null;
    
    const rows = await db.select().from(auditLogs).where(eq(auditLogs.id, Number(insertId)));
    return rows[0] || null;
  } catch (error) {
    console.error("[AuditLog] Error creating audit log:", error);
    return null;
  }
}

export async function getAuditLogs(filters?: { userId?: number; roomId?: number; action?: 'block' | 'unblock'; limit?: number; offset?: number }): Promise<AuditLog[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [];
  
  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }
  if (filters?.roomId) {
    conditions.push(eq(auditLogs.roomId, filters.roomId));
  }
  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }
  
  let query: any = db.select().from(auditLogs);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  query = query.orderBy(desc(auditLogs.createdAt));
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.offset(filters.offset);
  }
  
  return await query;
}

export async function getAuditLogsByRoom(roomId: number, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
  return getAuditLogs({ roomId, limit, offset });
}

export async function getAuditLogsByUser(userId: number, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
  return getAuditLogs({ userId, limit, offset });
}


/**
 * Funções para gerenciar tentativas falhadas de desbloqueio
 */
export async function recordFailedUnblockAttempt(data: InsertFailedUnblockAttempt): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(failedUnblockAttempts).values(data);
}

export async function getRecentFailedAttempts(ipAddress: string, minutes: number = 5): Promise<FailedUnblockAttempt[]> {
  const db = await getDb();
  if (!db) return [];
  
  const fiveMinutesAgo = new Date(Date.now() - minutes * 60 * 1000);
  
  return db
    .select()
    .from(failedUnblockAttempts)
    .where(
      and(
        eq(failedUnblockAttempts.ipAddress, ipAddress),
        gt(failedUnblockAttempts.createdAt, fiveMinutesAgo)
      )
    )
    .orderBy(desc(failedUnblockAttempts.createdAt));
}

export async function getFailedAttemptsByUser(userId: number, minutes: number = 5): Promise<FailedUnblockAttempt[]> {
  const db = await getDb();
  if (!db) return [];
  
  const fiveMinutesAgo = new Date(Date.now() - minutes * 60 * 1000);
  
  return db
    .select()
    .from(failedUnblockAttempts)
    .where(
      and(
        eq(failedUnblockAttempts.userId, userId),
        gt(failedUnblockAttempts.createdAt, fiveMinutesAgo)
      )
    )
    .orderBy(desc(failedUnblockAttempts.createdAt));
}

export async function cleanupOldFailedAttempts(hoursOld: number = 24): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
  
  await db.delete(failedUnblockAttempts).where(lt(failedUnblockAttempts.createdAt, cutoffTime));
}


// Blocking Exceptions functions
export async function createBlockingException(data: InsertBlockingException): Promise<BlockingException | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db.insert(blockingExceptions).values(data);
    const insertId = (result as any).insertId;
    if (!insertId) return null;
    
    const rows = await db.select().from(blockingExceptions).where(eq(blockingExceptions.id, Number(insertId)));
    return rows[0] || null;
  } catch (error) {
    console.error("[BlockingException] Error creating exception:", error);
    return null;
  }
}

export async function deleteBlockingException(exceptionId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.delete(blockingExceptions).where(eq(blockingExceptions.id, exceptionId));
    return true;
  } catch (error) {
    console.error("[BlockingException] Error deleting exception:", error);
    return false;
  }
}

export async function getBlockingExceptionsByBlockedDate(blockedDateId: number): Promise<BlockingException[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(blockingExceptions).where(eq(blockingExceptions.blockedDateId, blockedDateId));
}

export async function isDateExcepted(blockedDateId: number, date: Date): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Converter Date para formato YYYY-MM-DD para comparação (usar UTC)
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  // Criar Date UTC para comparação
  const exceptionDate = new Date(Date.UTC(year, parseInt(month) - 1, parseInt(day), 0, 0, 0, 0));
  
  const exceptions = await db
    .select()
    .from(blockingExceptions)
    .where(and(
      eq(blockingExceptions.blockedDateId, blockedDateId),
      eq(blockingExceptions.exceptionDate, exceptionDate)
    ));
  
  return exceptions.length > 0;
}


// Missing functions for routers.ts
export async function getBlockedDateById(blockedDateId: number): Promise<BlockedDate | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(blockedDates).where(eq(blockedDates.id, blockedDateId));
  return result[0] || null;
}

export async function recordFailedAttempt(data: { ipAddress: string; userAgent: string; blockedDateId: number }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(failedUnblockAttempts).values({
      userId: null, // Anonymous attempt
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      blockedDateId: data.blockedDateId,
      reason: "Senha incorreta",
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[FailedAttempt] Error recording attempt:", error);
  }
}

export async function checkSuspiciousActivity(ipAddress: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const attempts = await db
    .select()
    .from(failedUnblockAttempts)
    .where(and(
      eq(failedUnblockAttempts.ipAddress, ipAddress),
      gt(failedUnblockAttempts.createdAt, fiveMinutesAgo)
    ));
  
  return attempts.length >= 3;
}
