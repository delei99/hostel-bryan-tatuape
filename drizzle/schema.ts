import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de quartos do hostel
 */
export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["private", "shared", "dorm"]).notNull(),
  capacity: int("capacity").notNull(),
  pricePerNight: int("pricePerNight").notNull(), // em centavos
  description: text("description"),
  amenities: text("amenities"), // JSON stringified
  imageUrl: text("imageUrl"), // URL principal da foto do quarto
  additionalImages: text("additionalImages"), // JSON array com URLs adicionais
  bathroomType: mysqlEnum("bathroomType", ["private", "shared"]).default("shared").notNull(),
  cleaningFee: int("cleaningFee").default(700).notNull(), // em centavos (padrão R$ 7,00)
  discount7Days: int("discount7Days").default(8).notNull(), // % de desconto para 7+ dias
  discount15Days: int("discount15Days").default(16).notNull(), // % de desconto para 15+ dias
  discount30Days: int("discount30Days").default(45).notNull(), // % de desconto para 30+ dias
  singleGuestDiscountType: mysqlEnum("singleGuestDiscountType", ["percentage", "fixed"]).default("percentage").notNull(), // Tipo de desconto: % ou R$
  singleGuestDiscountValue: int("singleGuestDiscountValue").default(11).notNull(), // Valor do desconto (em % ou centavos)
  status: mysqlEnum("status", ["available", "maintenance", "archived"]).default("available").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

/**
 * Tabela de camas individuais dentro dos quartos
 */
export const beds = mysqlTable("beds", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  bedNumber: int("bedNumber").notNull(),
  type: mysqlEnum("type", ["single", "double", "bunk"]).notNull(),
  status: mysqlEnum("status", ["available", "occupied", "maintenance"]).default("available").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bed = typeof beds.$inferSelect;
export type InsertBed = typeof beds.$inferInsert;

/**
 * Tabela de hóspedes
 */
export const guests = mysqlTable("guests", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  nationality: varchar("nationality", { length: 100 }),
  dateOfBirth: timestamp("dateOfBirth"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = typeof guests.$inferInsert;

/**
 * Tabela de reservas
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  guestId: int("guestId").notNull().references(() => guests.id, { onDelete: "cascade" }),
  roomId: int("roomId").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  bedId: int("bedId").references(() => beds.id, { onDelete: "set null" }),
  checkInDate: varchar("checkInDate", { length: 10 }).notNull(),
  checkOutDate: varchar("checkOutDate", { length: 10 }).notNull(),
  numberOfGuests: int("numberOfGuests").notNull(),
  dailyType: mysqlEnum("dailyType", ["couple", "individual"]).default("couple").notNull(),
  discountPercentage: int("discountPercentage").default(0),
  discountAmount: int("discountAmount").default(0),
  cleaningFee: int("cleaningFee").default(700),
  subtotal: int("subtotal").notNull(),
  totalPrice: int("totalPrice").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "checked_in", "checked_out", "cancelled"]).default("pending").notNull(),
  specialRequests: text("specialRequests"),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "refunded"]).default("pending").notNull(),
  confirmationCode: varchar("confirmationCode", { length: 50 }).unique(),
  checkInTime: varchar("checkInTime", { length: 5 }).notNull(), // HH:mm format (14:00 ate 23:30)
  checkOutTime: varchar("checkOutTime", { length: 5 }).notNull(), // HH:mm format (ate 12:00)
  documentType: mysqlEnum("documentType", ["rg", "passport"]).notNull(), // Tipo de documento
  documentNumber: varchar("documentNumber", { length: 20 }).notNull(), // Número do RG ou Passaporte
  paymentAtBooking: int("paymentAtBooking").default(0), // Valor a pagar no ato da reserva
  paymentAtCheckIn: int("paymentAtCheckIn").default(0), // Valor a pagar no check-in
  isExtension: int("isExtension").default(0).notNull(), // 0 = false, 1 = true (reserva é uma extensão)
  parentBookingId: int("parentBookingId"), // ID da reserva original (se for extensão)
  extensionCleaningFee: int("extensionCleaningFee").default(0), // Taxa de limpeza da extensão (0 = sem taxa)
  editedAt: timestamp("editedAt"), // Ultima edicao
  editedBy: varchar("editedBy", { length: 100 }), // Nome de quem editou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Tabela de fotos dos quartos
 */
export const roomPhotos = mysqlTable("roomPhotos", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  photoUrl: text("photoUrl").notNull(),
  caption: varchar("caption", { length: 255 }),
  displayOrder: int("displayOrder").default(0),
  isMainPhoto: int("isMainPhoto").default(0), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoomPhoto = typeof roomPhotos.$inferSelect;
export type InsertRoomPhoto = typeof roomPhotos.$inferInsert;
/**
 * Tabela de bloqueio de datas
 */
export const blockedDates = mysqlTable("blockedDates", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  bookingId: int("bookingId").references(() => bookings.id, { onDelete: "cascade" }), // Referência à reserva que criou este bloqueio
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  reason: varchar("reason", { length: 255 }), // "booking" ou "manual"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlockedDate = typeof blockedDates.$inferSelect;
export type InsertBlockedDate = typeof blockedDates.$inferInsert;

/**
 * Tabela de logs de auditoria para bloqueios de datas
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: mysqlEnum("action", ["block", "unblock", "update"]).notNull(),
  blockedDateId: int("blockedDateId").references(() => blockedDates.id, { onDelete: "set null" }),
  roomId: int("roomId").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  reason: varchar("reason", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Tabela de tentativas falhadas de desbloqueio para detecção de atividade suspeita
 */
export const failedUnblockAttempts = mysqlTable("failedUnblockAttempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  userAgent: text("userAgent"),
  blockedDateId: int("blockedDateId").notNull().references(() => blockedDates.id, { onDelete: "cascade" }),
  reason: varchar("reason", { length: 255 }).default("Senha incorreta").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FailedUnblockAttempt = typeof failedUnblockAttempts.$inferSelect;
export type InsertFailedUnblockAttempt = typeof failedUnblockAttempts.$inferInsert;

/**
 * Tabela de exceções de bloqueio (datas desbloqueadas dentro de um período bloqueado)
 */
export const blockingExceptions = mysqlTable("blockingExceptions", {
  id: int("id").autoincrement().primaryKey(),
  blockedDateId: int("blockedDateId").notNull().references(() => blockedDates.id, { onDelete: "cascade" }),
  exceptionDate: date("exceptionDate").notNull(),
  reason: varchar("reason", { length: 255 }),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlockingException = typeof blockingExceptions.$inferSelect;
export type InsertBlockingException = typeof blockingExceptions.$inferInsert;

/**
 * Tabela de imagens da página principal
 */
export const homeImages = mysqlTable("homeImages", {
  id: int("id").autoincrement().primaryKey(),
  imageUrl: text("imageUrl").notNull(),
  position: mysqlEnum("position", ["left", "right", "top", "bottom"]).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  uploadedBy: int("uploadedBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HomeImage = typeof homeImages.$inferSelect;
export type InsertHomeImage = typeof homeImages.$inferInsert;

/**
 * Tabela de histórico de receita mensal
 */
export const monthlyRevenueHistory = mysqlTable("monthlyRevenueHistory", {
  id: int("id").autoincrement().primaryKey(),
  year: int("year").notNull(),
  month: int("month").notNull(), // 0-11 (janeiro=0, dezembro=11)
  totalReservations: int("totalReservations").default(0).notNull(),
  totalRevenue: int("totalRevenue").default(0).notNull(),
  confirmedReservations: int("confirmedReservations").default(0).notNull(),
  confirmedRevenue: int("confirmedRevenue").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonthlyRevenueHistory = typeof monthlyRevenueHistory.$inferSelect;
export type InsertMonthlyRevenueHistory = typeof monthlyRevenueHistory.$inferInsert;
