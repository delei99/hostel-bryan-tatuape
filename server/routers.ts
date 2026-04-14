import z from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Feature routers
  rooms: router({
    list: publicProcedure.query(async () => {
      const { getAllRooms } = await import("./db");
      return getAllRooms();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getRoomById } = await import("./db");
        return getRoomById(input.id);
      }),
    
    checkAvailability: publicProcedure
      .input(z.object({
        roomId: z.number(),
        checkInDate: z.date(),
        checkOutDate: z.date(),
      }))
      .query(async ({ input }) => {
        const { getRoomAvailability } = await import("./db");
        return getRoomAvailability(input.roomId, input.checkInDate, input.checkOutDate);
      }),
  }),

  bookings: router({
    create: publicProcedure
      .input(z.object({
        roomId: z.number(),
        guestName: z.string(),
        guestEmail: z.string().email(),
        guestPhone: z.string(),
        checkInDate: z.date(),
        checkOutDate: z.date(),
        totalPrice: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createBooking } = await import("./db");
        const booking = await createBooking({
          roomId: input.roomId,
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          guestPhone: input.guestPhone,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          totalPrice: input.totalPrice,
          notes: input.notes,
        });
        return booking;
      }),

    list: publicProcedure
      .input(z.object({ roomId: z.number().optional() }))
      .query(async ({ input }) => {
        const { getAllBookings } = await import("./db");
        return getAllBookings(input.roomId);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getBookingById } = await import("./db");
        return getBookingById(input.id);
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        guestName: z.string().optional(),
        guestEmail: z.string().email().optional(),
        guestPhone: z.string().optional(),
        checkInDate: z.date().optional(),
        checkOutDate: z.date().optional(),
        totalPrice: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateBooking } = await import("./db");
        const booking = await updateBooking(input.id, {
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          guestPhone: input.guestPhone,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          totalPrice: input.totalPrice,
          notes: input.notes,
        });
        return booking;
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteBooking } = await import("./db");
        await deleteBooking(input.id);
        return { success: true };
      }),

    cancel: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { cancelBooking } = await import("./db");
        await cancelBooking(input.id);
        return { success: true };
      }),
  }),

  auditLogs: router({
    list: protectedProcedure
      .input(z.object({
        roomId: z.number().optional(),
        userId: z.number().optional(),
        action: z.enum(["block", "unblock"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const { getAuditLogs } = await import("./db");
        return getAuditLogs({
          roomId: input.roomId,
          userId: input.userId,
          action: input.action,
          limit: input.limit,
          offset: input.offset,
        });
      }),
  }),

  securityAlerts: router({
    getFailedAttempts: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const db = await (await import("./db")).getDb();
        if (!db) return [];
        
        const { failedUnblockAttempts } = await import("../drizzle/schema");
        const { desc, gt } = await import("drizzle-orm");
        
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return db
          .select()
          .from(failedUnblockAttempts)
          .where(gt(failedUnblockAttempts.createdAt, oneDayAgo))
          .orderBy(desc(failedUnblockAttempts.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      }),
  }),

  blockedDates: router({
    create: protectedProcedure
      .input(z.object({
        roomId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        reason: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verificar senha - qualquer usuario autenticado pode bloquear com a senha correta
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Capacho@69";
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Senha incorreta"
          });
        }

        const { createBlockedDate, createAuditLog } = await import("./db");
        const id = await createBlockedDate({
          roomId: input.roomId,
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason,
        });
        
        // Registrar no log de auditoria
        await createAuditLog({
          userId: ctx.user.id,
          action: "block",
          blockedDateId: id,
          roomId: input.roomId,
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason,
          ipAddress: ctx.req.headers['x-forwarded-for'] as string || ctx.req.socket.remoteAddress || undefined,
          userAgent: ctx.req.headers['user-agent'] as string || undefined,
        });
        
        return { id, success: true };
      }),

    list: publicProcedure
      .input(z.object({ roomId: z.number() }))
      .query(async ({ input }) => {
        const { getAllBlockedDates } = await import("./db");
        return getAllBlockedDates(input.roomId);
      }),

    delete: protectedProcedure
      .input(z.object({
        blockedDateId: z.number(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verificar senha - qualquer usuario autenticado pode desbloquear com a senha correta
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Capacho@69";
        if (input.password !== ADMIN_PASSWORD) {
          // Registrar tentativa falhada
          const { recordFailedUnblockAttempt, getRecentFailedAttempts } = await import("./db");
          const { notifyOwner } = await import("./_core/notification");
          
          const ipAddress = ctx.req.headers['x-forwarded-for'] as string || ctx.req.socket.remoteAddress || 'unknown';
          
          await recordFailedUnblockAttempt({
            userId: ctx.user.id,
            ipAddress,
            userAgent: ctx.req.headers['user-agent'] as string || undefined,
            blockedDateId: input.blockedDateId,
            reason: "Senha incorreta",
          });
          
          // Verificar se há atividade suspeita (3+ tentativas em 5 minutos)
          const recentAttempts = await getRecentFailedAttempts(ipAddress, 5);
          if (recentAttempts.length >= 3) {
            // Notificar admin sobre atividade suspeita
            await notifyOwner({
              title: "🚨 Alerta de Segurança: Atividade Suspeita Detectada",
              content: `Múltiplas tentativas de desbloqueio falhadas detectadas.\n\nIP: ${ipAddress}\nTentativas: ${recentAttempts.length}\nPeríodo: Últimos 5 minutos\n\nPor favor, verifique os logs de auditoria para mais detalhes.`,
            });
          }
          
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Senha incorreta"
          });
        }

        const { deleteBlockedDate, createAuditLog, getDb } = await import("./db");
        const { blockedDates } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        // Buscar dados do bloqueio antes de deletar
        const db = await getDb();
        let blockedDateData = null;
        if (db) {
          const result = await db.select().from(blockedDates).where(eq(blockedDates.id, input.blockedDateId));
          blockedDateData = result[0];
        }
        
        // Registrar no log de auditoria
        if (blockedDateData) {
          await createAuditLog({
            userId: ctx.user.id,
            action: "unblock",
            blockedDateId: input.blockedDateId,
            roomId: blockedDateData.roomId,
            startDate: blockedDateData.startDate,
            endDate: blockedDateData.endDate,
            reason: blockedDateData.reason || undefined,
            ipAddress: ctx.req.headers['x-forwarded-for'] as string || ctx.req.socket.remoteAddress || undefined,
            userAgent: ctx.req.headers['user-agent'] as string || undefined,
          });
        }
        
        await deleteBlockedDate(input.blockedDateId);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;;
