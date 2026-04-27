import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";

export const appRouter = router({
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
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().min(1, "Email é obrigatório").regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido"),
        phone: z.string(),
        cpf: z.string().optional(),
        nationality: z.string().optional(),
        checkInDate: z.string(),
        checkOutDate: z.string(),
        checkInTime: z.string(),
        checkOutTime: z.string(),
        numberOfGuests: z.number(),
        dailyType: z.enum(["couple", "individual"]),
        subtotal: z.number(),
        discountPercentage: z.number().optional(),
        discountAmount: z.number().optional(),
        cleaningFee: z.number().optional(),
        totalPrice: z.number(),
        specialRequests: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createBooking } = await import("./db");
        const booking = await createBooking(input);
        return booking;
      }),

    list: protectedProcedure
      .input(z.object({ roomId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        // Apenas admins podem listar todas as reservas
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem listar reservas' });
        }
        const { getAllBookings } = await import("./db");
        return getAllBookings();
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getBookingById } = await import("./db");
        return getBookingById(input.id);
      }),
  }),

  blockedDates: router({
    list: publicProcedure
      .input(z.object({ roomId: z.number() }))
      .query(async ({ input }) => {
        const { getAllBlockedDates } = await import("./db");
        return getAllBlockedDates(input.roomId);
      }),

    create: publicProcedure
      .input(z.object({
        roomId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createBlockedDate, createAuditLog } = await import("./db");
        
        const result = await createBlockedDate({
          roomId: input.roomId,
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason,
        });

        await createAuditLog({
          userId: ctx.user?.id || 0,
          action: "block",
          blockedDateId: result,
          roomId: input.roomId,
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason,
          ipAddress: ctx.req.headers["x-forwarded-for"] as string || ctx.req.socket.remoteAddress || "",
          userAgent: ctx.req.headers["user-agent"] as string || "",
        });

        return result;
      }),

    delete: publicProcedure
      .input(z.object({
        id: z.number(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { deleteBlockedDate, createAuditLog, getBlockedDateById, recordFailedAttempt, checkSuspiciousActivity } = await import("./db");
        
        const blockedDate = await getBlockedDateById(input.id);
        if (!blockedDate) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const correctPassword = "Capacho@69";
        if (input.password !== correctPassword) {
          const ipAddress = ctx.req.headers["x-forwarded-for"] as string || ctx.req.socket.remoteAddress || "";
          const userAgent = ctx.req.headers["user-agent"] as string || "";
          
          await recordFailedAttempt({
            ipAddress,
            userAgent,
            blockedDateId: input.id,
          });

          const isSuspicious = await checkSuspiciousActivity(ipAddress);
          if (isSuspicious) {
            const { notifyOwner } = await import("./_core/notification");
            await notifyOwner({
              title: "Atividade Suspeita Detectada",
              content: `Múltiplas tentativas de desbloqueio falhadas do IP: ${ipAddress}`,
            });
          }

          throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha incorreta" });
        }

        await deleteBlockedDate(input.id);

        await createAuditLog({
          userId: ctx.user?.id || 0,
          action: "unblock",
          blockedDateId: input.id,
          roomId: blockedDate.roomId,
          startDate: blockedDate.startDate,
          endDate: blockedDate.endDate,
          reason: blockedDate.reason,
          ipAddress: ctx.req.headers["x-forwarded-for"] as string || ctx.req.socket.remoteAddress || "",
          userAgent: ctx.req.headers["user-agent"] as string || "",
        });

        return { success: true };
      }),
  }),

  auditLogs: router({
    getByRoom: publicProcedure
      .input(z.object({
        roomId: z.number(),
        action: z.enum(["block", "unblock"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const { getAuditLogsByRoom } = await import("./db");
        return getAuditLogsByRoom(input.roomId, input.limit, input.offset);
      }),
  }),

  securityAlerts: router({
    getFailedAttempts: publicProcedure
      .input(z.object({
        minutesBack: z.number().default(5),
      }))
      .query(async ({ input }) => {
        const { getRecentFailedAttempts } = await import("./db");
        return getRecentFailedAttempts("", input.minutesBack);
      }),
  }),

  roomPhotos: router({
    getByRoom: publicProcedure
      .input(z.object({ roomId: z.number() }))
      .query(async ({ input }) => {
        const { getRoomPhotos } = await import("./db");
        return getRoomPhotos(input.roomId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
