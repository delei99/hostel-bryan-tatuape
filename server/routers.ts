import { z } from "zod";
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
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        cpf: z.string().optional(),
        nationality: z.string().optional(),
        roomId: z.number(),
        checkInDate: z.date(),
        checkOutDate: z.date(),
        numberOfGuests: z.number(),
        totalPrice: z.number(),
        specialRequests: z.string().optional(),
        paymentMethod: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createOrUpdateGuest, createBooking } = await import("./db");
        const { nanoid } = await import("nanoid");
        const { notifyOwner } = await import("./_core/notification");
        
        try {
          // Criar ou atualizar hóspede
          const guestId = await createOrUpdateGuest({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            cpf: input.cpf,
            nationality: input.nationality,
          });
          
          // Gerar código de confirmação
          const confirmationCode = nanoid(12).toUpperCase();
          
          // Criar reserva
          const bookingId = await createBooking({
            guestId,
            roomId: input.roomId,
            checkInDate: input.checkInDate,
            checkOutDate: input.checkOutDate,
            numberOfGuests: input.numberOfGuests,
            totalPrice: input.totalPrice,
            specialRequests: input.specialRequests,
            paymentMethod: input.paymentMethod,
            confirmationCode,
          });
          
          // Notificar dono
          const checkInFormatted = input.checkInDate.toLocaleDateString('pt-BR');
          const checkOutFormatted = input.checkOutDate.toLocaleDateString('pt-BR');
          const priceFormatted = (input.totalPrice / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          
          await notifyOwner({
            title: `Nova Reserva - ${input.firstName} ${input.lastName}`,
            content: `Uma nova reserva foi confirmada no Hostel Bryan Tatuapé!\n\n` +
              `Hóspede: ${input.firstName} ${input.lastName}\n` +
              `Email: ${input.email}\n` +
              `Telefone: ${input.phone || 'N/A'}\n\n` +
              `Quarto: ${input.roomId}\n` +
              `Check-in: ${checkInFormatted}\n` +
              `Check-out: ${checkOutFormatted}\n` +
              `Hóspedes: ${input.numberOfGuests}\n` +
              `Valor Total: ${priceFormatted}\n\n` +
              `Código de Confirmação: ${confirmationCode}`
          });
          
          return {
            success: true,
            bookingId,
            confirmationCode,
          };
        } catch (error) {
          console.error("Error creating booking:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao criar reserva"
          });
        }
      }),
    
    list: protectedProcedure.query(async ({ ctx }) => {
      // Apenas admin pode listar todas as reservas
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem listar reservas"
        });
      }
      
      const { getAllBookings } = await import("./db");
      return getAllBookings();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem visualizar reservas"
          });
        }
        
        const { getBookingById } = await import("./db");
        return getBookingById(input.id);
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        status: z.enum(["pending", "confirmed", "checked_in", "checked_out", "cancelled"])
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem atualizar reservas"
          });
        }
        
        const { updateBookingStatus } = await import("./db");
        await updateBookingStatus(input.bookingId, input.status);
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

