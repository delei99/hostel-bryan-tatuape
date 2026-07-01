import { and, desc, eq, gt, lt, or, inArray } from "drizzle-orm";
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
  
  // Buscar o preço vigente do quarto do banco de dados
  const roomResult = await db.select().from(rooms).where(eq(rooms.id, bookingData.roomId)).limit(1);
  const room = roomResult.length > 0 ? roomResult[0] : null;
  
  if (!room) {
    throw new Error(`Room with id ${bookingData.roomId} not found`);
  }
  
  // Calcular preço usando o preço vigente do quarto
  const checkInDate = new Date(bookingData.checkInDate);
  const checkOutDate = new Date(bookingData.checkOutDate);
  const numberOfNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calcular subtotal com o preço atual do quarto
  const currentRoomPrice = room.pricePerNight || 80; // Preço padrão de 80 se não houver
  const baseSubtotal = currentRoomPrice * numberOfNights;
  
  // Aplicar desconto por duração ou por número de hóspedes
  const numberOfGuests = parseInt(bookingData.numberOfGuests) || 1;
  let discountAmount = 0;
  let discountPercentage = 0;
  
  // Desconto por duração tem prioridade
  if (numberOfNights >= 30) {
    discountPercentage = room.discount30Days || 45;
    discountAmount = Math.round(baseSubtotal * discountPercentage / 100);
  } else if (numberOfNights >= 15) {
    discountPercentage = room.discount15Days || 16;
    discountAmount = Math.round(baseSubtotal * discountPercentage / 100);
  } else if (numberOfNights >= 7) {
    discountPercentage = room.discount7Days || 8;
    discountAmount = Math.round(baseSubtotal * discountPercentage / 100);
  } else if (numberOfGuests === 1) {
    // Desconto de 11% para 1 pessoa só se não houver desconto por duração
    discountPercentage = 11;
    discountAmount = Math.round(baseSubtotal * 0.11);
  }
  
  const subtotal = baseSubtotal - discountAmount;
  const cleaningFee = bookingData.cleaningFee || 700;
  const finalTotalPrice = subtotal + cleaningFee;
  const paymentAtBooking = bookingData.paymentAtBooking || 0;
  const paymentAtCheckIn = bookingData.paymentAtCheckIn || (finalTotalPrice - paymentAtBooking);
  
  const bookingToInsert = {
    guestId,
    roomId: bookingData.roomId,
    checkInDate: bookingData.checkInDate,
    checkOutDate: bookingData.checkOutDate,
    numberOfGuests: bookingData.numberOfGuests,
    dailyType: bookingData.dailyType,
    discountPercentage: discountPercentage,
    discountAmount: discountAmount,
    cleaningFee: cleaningFee,
    subtotal: subtotal,
    totalPrice: finalTotalPrice,
    specialRequests: bookingData.specialRequests,
    checkInTime: bookingData.checkInTime,
    checkOutTime: bookingData.checkOutTime,
    documentType: bookingData.documentType || "rg",
    documentNumber: bookingData.documentNumber || "",
    paymentAtBooking: paymentAtBooking,
    paymentAtCheckIn: paymentAtCheckIn,
  };
  
  console.log("[createBooking] bookingToInsert totalPrice:", bookingToInsert.totalPrice);
  
  // Usar query SQL raw para ter controle total dos parâmetros
  const { sql } = await import('drizzle-orm');
  const result = await db.execute(sql`
    INSERT INTO bookings (
      guestId, roomId, checkInDate, checkOutDate, numberOfGuests, dailyType,
      discountPercentage, discountAmount, cleaningFee, subtotal, totalPrice,
      specialRequests, checkInTime, checkOutTime, documentType, documentNumber,
      paymentAtBooking, paymentAtCheckIn
    ) VALUES (
      ${bookingToInsert.guestId},
      ${bookingToInsert.roomId},
      ${bookingToInsert.checkInDate},
      ${bookingToInsert.checkOutDate},
      ${bookingToInsert.numberOfGuests},
      ${bookingToInsert.dailyType || 'couple'},
      ${bookingToInsert.discountPercentage},
      ${bookingToInsert.discountAmount},
      ${bookingToInsert.cleaningFee},
      ${bookingToInsert.subtotal},
      ${bookingToInsert.totalPrice || 0},
      ${bookingToInsert.specialRequests},
      ${bookingToInsert.checkInTime},
      ${bookingToInsert.checkOutTime},
      ${bookingToInsert.documentType},
      ${bookingToInsert.documentNumber},
      ${bookingToInsert.paymentAtBooking},
      ${bookingToInsert.paymentAtCheckIn}
    )
  `)
  
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
  
  // Gerar codigo de confirmacao unico (formato: YYYYMMDD-XXXXX)
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const confirmationCode = `${dateStr}-${randomStr}`;
  
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
      bookingId: bookingId,
      startDate,
      endDate,
      reason: `Reserva automática - Código: ${confirmationCode} - Hóspede: ${bookingData.firstName} ${bookingData.lastName}`,
    });
  } catch (error) {
    console.error("[Booking] Erro ao bloquear datas automaticamente:", error);
    // Não falhar a reserva se o bloqueio automático falhar
  }
  
  // Atualizar booking com o código de confirmação
  await db.update(bookings).set({ confirmationCode }).where(eq(bookings.id, bookingId));
  
  // Enviar notificação para o hóspede
  try {
    const { notifyGuest } = await import('./_core/guestNotification');
    const roomResult = await db.select().from(rooms).where(eq(rooms.id, bookingData.roomId)).limit(1);
    const room = roomResult.length > 0 ? roomResult[0] : null;
    
    if (room) {
      await notifyGuest({
        guestEmail: bookingData.email,
        guestPhone: bookingData.phone,
        guestName: `${bookingData.firstName} ${bookingData.lastName}`,
        bookingCode: confirmationCode,
        checkInDate: new Date(bookingData.checkInDate).toLocaleDateString('pt-BR'),
        checkOutDate: new Date(bookingData.checkOutDate).toLocaleDateString('pt-BR'),
        roomName: room.name,
        totalPrice: bookingData.totalPrice,
        message: 'Sua reserva foi confirmada com sucesso! Aqui estão os detalhes:',
        cpf: bookingData.cpf,
        documentType: bookingData.documentType,
        documentNumber: bookingData.documentNumber,
      });
    }
  } catch (error) {
    console.error('[Booking] Erro ao enviar notificação:', error);
  }
  
  // Retornar dados completos da reserva com confirmationCode
  return {
    id: bookingId,
    guestId,
    confirmationCode,
    roomId: bookingData.roomId,
    checkInDate: bookingData.checkInDate,
    checkOutDate: bookingData.checkOutDate,
    numberOfGuests: bookingData.numberOfGuests,
    dailyType: bookingData.dailyType || 'couple',
    subtotal: subtotal,
    totalPrice: finalTotalPrice,
    checkInTime: bookingData.checkInTime,
    checkOutTime: bookingData.checkOutTime,
    discountPercentage: discountPercentage,
    discountAmount: discountAmount,
    cleaningFee: cleaningFee,
    specialRequests: bookingData.specialRequests,
  };
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
          bedId: bookings.bedId,
          checkInDate: bookings.checkInDate,
          checkOutDate: bookings.checkOutDate,
          numberOfGuests: bookings.numberOfGuests,
          dailyType: bookings.dailyType,
          discountPercentage: bookings.discountPercentage,
          discountAmount: bookings.discountAmount,
          cleaningFee: bookings.cleaningFee,
          subtotal: bookings.subtotal,
          totalPrice: bookings.totalPrice,
          status: bookings.status,
          specialRequests: bookings.specialRequests,
          paymentMethod: bookings.paymentMethod,
          paymentStatus: bookings.paymentStatus,
          confirmationCode: bookings.confirmationCode,
          checkInTime: bookings.checkInTime,
          checkOutTime: bookings.checkOutTime,
          editedAt: bookings.editedAt,
          editedBy: bookings.editedBy,
          createdAt: bookings.createdAt,
          updatedAt: bookings.updatedAt,
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
          createdAt: guests.createdAt,
          updatedAt: guests.updatedAt,
        },
        room: {
          id: rooms.id,
          name: rooms.name,
          type: rooms.type,
          capacity: rooms.capacity,
          pricePerNight: rooms.pricePerNight,
          description: rooms.description,
          amenities: rooms.amenities,
          imageUrl: rooms.imageUrl,
          additionalImages: rooms.additionalImages,
          status: rooms.status,
          createdAt: rooms.createdAt,
          updatedAt: rooms.updatedAt,
        }
      })
      .from(bookings)
      .innerJoin(guests, eq(bookings.guestId, guests.id))
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .orderBy(desc(bookings.createdAt));
    
    return result;
  } catch (error) {
    console.error('[Database] Error in getAllBookings:', error);
    return [];
  }
}

export async function getBookingById(bookingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db
      .select({
        booking: {
          id: bookings.id,
          guestId: bookings.guestId,
          roomId: bookings.roomId,
          bedId: bookings.bedId,
          checkInDate: bookings.checkInDate,
          checkOutDate: bookings.checkOutDate,
          numberOfGuests: bookings.numberOfGuests,
          dailyType: bookings.dailyType,
          discountPercentage: bookings.discountPercentage,
          discountAmount: bookings.discountAmount,
          cleaningFee: bookings.cleaningFee,
          subtotal: bookings.subtotal,
          totalPrice: bookings.totalPrice,
          status: bookings.status,
          specialRequests: bookings.specialRequests,
          paymentMethod: bookings.paymentMethod,
          paymentStatus: bookings.paymentStatus,
          confirmationCode: bookings.confirmationCode,
          checkInTime: bookings.checkInTime,
          checkOutTime: bookings.checkOutTime,
          editedAt: bookings.editedAt,
          editedBy: bookings.editedBy,
          createdAt: bookings.createdAt,
          updatedAt: bookings.updatedAt,
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
          createdAt: guests.createdAt,
          updatedAt: guests.updatedAt,
        },
        room: {
          id: rooms.id,
          name: rooms.name,
          type: rooms.type,
          capacity: rooms.capacity,
          pricePerNight: rooms.pricePerNight,
          description: rooms.description,
          amenities: rooms.amenities,
          imageUrl: rooms.imageUrl,
          additionalImages: rooms.additionalImages,
          status: rooms.status,
          createdAt: rooms.createdAt,
          updatedAt: rooms.updatedAt,
        }
      })
      .from(bookings)
      .innerJoin(guests, eq(bookings.guestId, guests.id))
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(eq(bookings.id, bookingId))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error('[Database] Error in getBookingById:', error);
    return undefined;
  }
}

export async function updateBookingStatus(bookingId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db
      .update(bookings)
      .set({ status: status as any })
      .where(eq(bookings.id, bookingId));
    return getBookingById(bookingId);
  } catch (error) {
    console.error("[Database] Error updating booking status:", error);
    throw error;
  }
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

export async function createRoomPhoto(photoData: InsertRoomPhoto) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create room photo: database not available");
    return null;
  }

  try {
    const result = await db.insert(roomPhotos).values(photoData);
    return result[0].insertId;
  } catch (error) {
    console.error("[Database] Failed to create room photo:", error);
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

export async function getBlockedDateByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(blockedDates)
    .where(eq(blockedDates.bookingId, bookingId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
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

export async function updateBlockedDate(blockedDateId: number, data: { startDate?: Date; endDate?: Date; reason?: string; roomId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = { updatedAt: new Date() };
  if (data.startDate) updates.startDate = data.startDate;
  if (data.endDate) updates.endDate = data.endDate;
  if (data.reason) updates.reason = data.reason;
  if (data.roomId) updates.roomId = data.roomId;
  
  await db.update(blockedDates)
    .set(updates)
    .where(eq(blockedDates.id, blockedDateId));
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


export async function updateBooking(bookingId: number, updateData: any, editedBy: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar a reserva atual para ter os dados originais
  const currentBooking = await getBookingById(bookingId);
  if (!currentBooking) throw new Error("Booking not found");
  
  // Determinar o quarto a ser usado (novo ou atual)
  const roomId = updateData.roomId !== undefined ? updateData.roomId : currentBooking.booking.roomId;
  const checkInDate = updateData.checkInDate !== undefined ? updateData.checkInDate : currentBooking.booking.checkInDate;
  const checkOutDate = updateData.checkOutDate !== undefined ? updateData.checkOutDate : currentBooking.booking.checkOutDate;
  const numberOfGuestsStr = updateData.numberOfGuests !== undefined ? String(updateData.numberOfGuests) : String(currentBooking.booking.numberOfGuests);
  const numberOfGuests = parseInt(numberOfGuestsStr);
  
  // Buscar o preço vigente do quarto
  const roomResult = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  const room = roomResult.length > 0 ? roomResult[0] : null;
  
  if (!room) {
    throw new Error(`Room with id ${roomId} not found`);
  }
  
  // Recalcular preço com o preço vigente
  const checkInDateObj = new Date(checkInDate);
  const checkOutDateObj = new Date(checkOutDate);
  const numberOfNights = Math.ceil((checkOutDateObj.getTime() - checkInDateObj.getTime()) / (1000 * 60 * 60 * 24));
  
  const currentRoomPrice = room.pricePerNight || 80;
  const baseSubtotal = currentRoomPrice * numberOfNights;
  
  // Aplicar desconto por duração ou por número de hóspedes
  let discountAmount = 0;
  let discountPercentage = 0;
  
  // Desconto por duração tem prioridade
  if (numberOfNights >= 30) {
    discountPercentage = room.discount30Days || 45;
    discountAmount = Math.round(baseSubtotal * discountPercentage / 100);
  } else if (numberOfNights >= 15) {
    discountPercentage = room.discount15Days || 16;
    discountAmount = Math.round(baseSubtotal * discountPercentage / 100);
  } else if (numberOfNights >= 7) {
    discountPercentage = room.discount7Days || 8;
    discountAmount = Math.round(baseSubtotal * discountPercentage / 100);
  } else if (numberOfGuests === 1) {
    // Desconto de 11% para 1 pessoa só se não houver desconto por duração
    discountPercentage = 11;
    discountAmount = Math.round(baseSubtotal * 0.11);
  }
  
  const subtotal = baseSubtotal - discountAmount;
  const cleaningFee = currentBooking.booking.cleaningFee || 700;
  const totalPrice = subtotal + cleaningFee;
  
  // Atualizar dados da reserva
  const updateSet: any = {
    editedAt: new Date(),
    editedBy,
    subtotal,
    discountPercentage,
    discountAmount,
    totalPrice,
  };
  
  // Adicionar campos opcionais se fornecidos
  if (updateData.checkInDate !== undefined) updateSet.checkInDate = updateData.checkInDate;
  if (updateData.checkOutDate !== undefined) updateSet.checkOutDate = updateData.checkOutDate;
  if (updateData.checkInTime !== undefined) updateSet.checkInTime = updateData.checkInTime;
  if (updateData.checkOutTime !== undefined) updateSet.checkOutTime = updateData.checkOutTime;
  if (updateData.roomId !== undefined) updateSet.roomId = updateData.roomId;
  if (updateData.numberOfGuests !== undefined) updateSet.numberOfGuests = updateData.numberOfGuests;
  if (updateData.dailyType !== undefined) updateSet.dailyType = updateData.dailyType;
  if (updateData.specialRequests !== undefined) updateSet.specialRequests = updateData.specialRequests;
  
  // Atualizar dados do hóspede se fornecidos
  if (updateData.firstName || updateData.lastName || updateData.email || updateData.phone) {
    const booking = await getBookingById(bookingId);
    if (booking) {
      const guestUpdateSet: any = {};
      if (updateData.firstName !== undefined) guestUpdateSet.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) guestUpdateSet.lastName = updateData.lastName;
      if (updateData.email !== undefined) guestUpdateSet.email = updateData.email;
      if (updateData.phone !== undefined) guestUpdateSet.phone = updateData.phone;
      
      if (Object.keys(guestUpdateSet).length > 0) {
        await db.update(guests).set(guestUpdateSet).where(eq(guests.id, booking.booking.guestId));
      }
    }
  }
  
  // Atualizar reserva
  await db.update(bookings).set(updateSet).where(eq(bookings.id, bookingId));
  
  // Sincronizar datas bloqueadas se as datas foram alteradas
  if (updateData.checkInDate !== undefined || updateData.checkOutDate !== undefined || updateData.roomId !== undefined) {
    try {
      const blockedDate = await getBlockedDateByBookingId(bookingId);
      if (blockedDate) {
        const newCheckInDate = updateData.checkInDate !== undefined ? updateData.checkInDate : currentBooking.booking.checkInDate;
        const newCheckOutDate = updateData.checkOutDate !== undefined ? updateData.checkOutDate : currentBooking.booking.checkOutDate;
        const newRoomId = updateData.roomId !== undefined ? updateData.roomId : currentBooking.booking.roomId;
        
        // Converter datas para timestamps
        const [checkInYear, checkInMonth, checkInDay] = newCheckInDate.split('-').map(Number);
        const [checkOutYear, checkOutMonth, checkOutDay] = newCheckOutDate.split('-').map(Number);
        const startDate = new Date(checkInYear, checkInMonth - 1, checkInDay, 0, 0, 0, 0);
        const endDate = new Date(checkOutYear, checkOutMonth - 1, checkOutDay, 23, 59, 59, 999);
        
        // Atualizar data bloqueada
        await updateBlockedDate(blockedDate.id, {
          roomId: newRoomId,
          startDate,
          endDate,
          reason: `Reserva automatica - Hospede: ${currentBooking.guest.firstName} ${currentBooking.guest.lastName}`,
        });
      }
    } catch (error) {
      console.error('[Booking] Erro ao sincronizar datas bloqueadas:', error);
      // Nao falhar a atualizacao se a sincronizacao falhar
    }
  }
  
  // Retornar dados atualizados com guest e room para WhatsApp
  const updatedBooking = await getBookingById(bookingId);
  if (!updatedBooking) throw new Error("Booking not found after update");
  
  // Enviar notificação para o hóspede sobre a edição
  try {
    const { notifyGuest } = await import('./_core/guestNotification');
    if (updatedBooking.guest.email && updatedBooking.booking.confirmationCode) {
      await notifyGuest({
        guestEmail: updatedBooking.guest.email,
        guestPhone: updatedBooking.guest.phone || undefined,
        guestName: `${updatedBooking.guest.firstName} ${updatedBooking.guest.lastName}`,
        bookingCode: updatedBooking.booking.confirmationCode,
        checkInDate: new Date(updatedBooking.booking.checkInDate).toLocaleDateString('pt-BR'),
        checkOutDate: new Date(updatedBooking.booking.checkOutDate).toLocaleDateString('pt-BR'),
        roomName: updatedBooking.room.name,
        totalPrice: updatedBooking.booking.totalPrice,
        message: 'Sua reserva foi editada! Aqui estão os detalhes atualizados:',
      });
    }
  } catch (error) {
    console.error('[Booking] Erro ao enviar notificação de edição:', error);
  }
  
  return {
    booking: updatedBooking.booking,
    guest: updatedBooking.guest,
    room: updatedBooking.room,
  };
}


/**
 * Atualizar informações do quarto (nome, preço, descrição, etc)
 */
export async function updateRoom(roomId: number, updateData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateSet: Record<string, any> = {};

  // Apenas campos permitidos
  const allowedFields = ['name', 'description', 'pricePerNight', 'capacity', 'type', 'amenities', 'status', 'cleaningFee', 'discount7Days', 'discount15Days', 'discount30Days', 'bathroomType'];
  
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      updateSet[field] = updateData[field];
    }
  }

  if (Object.keys(updateSet).length === 0) {
    throw new Error("No valid fields to update");
  }

  await db.update(rooms).set(updateSet).where(eq(rooms.id, roomId));

  return getRoomById(roomId);
}


/**
 * Criar novo quarto
 */
export async function createRoom(roomData: {
  name: string;
  type: "private" | "shared" | "dorm";
  capacity: number;
  pricePerNight: number;
  description?: string;
  amenities?: string;
  bathroomType?: "private" | "shared";
  status?: "available" | "maintenance" | "archived";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(rooms).values({
      name: roomData.name,
      type: roomData.type,
      capacity: roomData.capacity,
      pricePerNight: roomData.pricePerNight,
      description: roomData.description || null,
      amenities: roomData.amenities || null,
      bathroomType: roomData.bathroomType || "shared",
      status: roomData.status || "available",
    });

    // Extrair o ID do novo quarto
    let roomId: number;
    if ((result as any).insertId) {
      roomId = Number((result as any).insertId);
    } else if (Array.isArray(result) && (result[0] as any)?.insertId) {
      roomId = Number((result[0] as any).insertId);
    } else if ((result as any)[0]?.insertId) {
      roomId = Number((result as any)[0].insertId);
    } else {
      throw new Error("Failed to create room: could not extract insertId");
    }

    if (!roomId || isNaN(roomId)) throw new Error("Failed to create room: invalid roomId");

    return getRoomById(roomId);
  } catch (error) {
    console.error("[Database] Error creating room:", error);
    throw error;
  }
}


/**
 * Deletar uma reserva
 */
export async function deleteBooking(bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.delete(bookings).where(eq(bookings.id, bookingId));
    return { success: true, message: "Reserva deletada com sucesso" };
  } catch (error) {
    console.error("[Database] Error deleting booking:", error);
    throw error;
  }
}



export async function getBlockingExceptionsByRoom(roomId: number): Promise<BlockingException[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get all blocked dates for the room, then get all exceptions for those blocked dates
  const blockedDateRecords = await db
    .select({ id: blockedDates.id })
    .from(blockedDates)
    .where(eq(blockedDates.roomId, roomId));
  
  if (blockedDateRecords.length === 0) return [];
  
  const blockedDateIds = blockedDateRecords.map(bd => bd.id);
  
  return db
    .select()
    .from(blockingExceptions)
    .where(inArray(blockingExceptions.blockedDateId, blockedDateIds));
}


// ============================================================================
// Home Images Functions
// ============================================================================

export async function getHomeImages(): Promise<HomeImage[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(homeImages).orderBy(homeImages.displayOrder, homeImages.position);
  } catch (error) {
    console.error("[Database] Error fetching home images:", error);
    return [];
  }
}

export async function createHomeImage(data: InsertHomeImage): Promise<HomeImage | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(homeImages).values(data);
    const insertedId = result[0].insertId;
    return await db.select().from(homeImages).where(eq(homeImages.id, Number(insertedId))).then(rows => rows[0] || null);
  } catch (error) {
    console.error("[Database] Error creating home image:", error);
    return null;
  }
}

export async function updateHomeImage(id: number, data: Partial<InsertHomeImage>): Promise<HomeImage | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.update(homeImages).set(data).where(eq(homeImages.id, id));
    return await db.select().from(homeImages).where(eq(homeImages.id, id)).then(rows => rows[0] || null);
  } catch (error) {
    console.error("[Database] Error updating home image:", error);
    return null;
  }
}

export async function deleteHomeImage(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.delete(homeImages).where(eq(homeImages.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Error deleting home image:", error);
    return false;
  }
}

export async function getHomeImageByPosition(position: "left" | "right" | "top" | "bottom"): Promise<HomeImage | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(homeImages).where(eq(homeImages.position, position));
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error fetching home image by position:", error);
    return null;
  }
}

export async function reorderHomeImages(items: Array<{ id: number; displayOrder: number }>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    for (const item of items) {
      await db.update(homeImages).set({ displayOrder: item.displayOrder }).where(eq(homeImages.id, item.id));
    }
    return true;
  } catch (error) {
    console.error("[Database] Error reordering home images:", error);
    return false;
  }
}

// ============================================================================
// Monthly Revenue History Functions
// ============================================================================

export async function getMonthlyRevenueHistory(year: number, month: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(monthlyRevenueHistory).where(
      and(eq(monthlyRevenueHistory.year, year), eq(monthlyRevenueHistory.month, month))
    );
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error fetching monthly revenue history:", error);
    return null;
  }
}

export async function getAllMonthlyRevenueHistory() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(monthlyRevenueHistory).orderBy(desc(monthlyRevenueHistory.year), desc(monthlyRevenueHistory.month));
  } catch (error) {
    console.error("[Database] Error fetching all monthly revenue history:", error);
    return [];
  }
}

export async function saveMonthlyRevenueHistory(data: InsertMonthlyRevenueHistory) {
  const db = await getDb();
  if (!db) return null;
  try {
    const existing = await getMonthlyRevenueHistory(data.year!, data.month!);
    if (existing) {
      await db.update(monthlyRevenueHistory)
        .set(data)
        .where(and(eq(monthlyRevenueHistory.year, data.year!), eq(monthlyRevenueHistory.month, data.month!)));
      return existing;
    } else {
      await db.insert(monthlyRevenueHistory).values(data);
      const saved = await getMonthlyRevenueHistory(data.year!, data.month!);
      return saved;
    }
  } catch (error) {
    console.error("[Database] Error saving monthly revenue history:", error);
    return null;
  }
}
