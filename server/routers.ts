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
        checkInDate: z.string(),
        checkOutDate: z.string(),
        checkInTime: z.string(),
        checkOutTime: z.string(),
        numberOfGuests: z.number(),
        dailyType: z.enum(["couple", "individual"]).default("couple"),
        subtotal: z.number(),
        discountPercentage: z.number().default(0),
        discountAmount: z.number().default(0),
        cleaningFee: z.number().default(700),
        totalPrice: z.number(),
        // Validação: desconto de 12% deve ser aplicado apenas para diária individual
        specialRequests: z.string().optional(),
        paymentMethod: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createOrUpdateGuest, createBooking, createBlockedDate } = await import("./db");
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
          
          // Criar reserva (manter datas como strings)
          const bookingId = await createBooking({
            guestId,
            roomId: input.roomId,
            checkInDate: input.checkInDate,
            checkOutDate: input.checkOutDate,
            checkInTime: input.checkInTime,
            checkOutTime: input.checkOutTime,
            numberOfGuests: input.numberOfGuests,
            dailyType: input.dailyType,
            discountPercentage: input.discountPercentage,
            discountAmount: input.discountAmount,
            cleaningFee: input.cleaningFee,
            subtotal: input.subtotal,
            totalPrice: input.totalPrice,
            specialRequests: input.specialRequests,
            paymentMethod: input.paymentMethod,
            confirmationCode,
          });
          
          // Bloquear automaticamente as datas da reserva
          try {
            // Converter strings para Date objects para bloqueio
            const stringToDate = (dateStr: string) => {
              return new Date(dateStr + 'T00:00:00Z');
            };
            await createBlockedDate({
              roomId: input.roomId,
              startDate: stringToDate(input.checkInDate),
              endDate: stringToDate(input.checkOutDate),
              reason: "booking",
            });
          } catch (blockError) {
            console.warn("[Warning] Failed to create automatic blocked date:", blockError);
            // Não falhar a reserva se o bloqueio automático falhar
          }
          
          // Notificar dono
          const parseDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
          };
          const checkInFormatted = parseDate(input.checkInDate);
          const checkOutFormatted = parseDate(input.checkOutDate);
          const priceFormatted = (input.totalPrice / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const subtotalFormatted = (input.subtotal / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const discountFormatted = (input.discountAmount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const cleaningFormatted = (input.cleaningFee / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          
          const whatsappMessage = `Olá! Sua reserva foi confirmada!\n\n📋 Detalhes da Reserva:\nCódigo: ${confirmationCode}\nDiária: ${input.dailyType === 'couple' ? 'Casal' : 'Individual'}\n\n📅 Datas:\nCheck-in: ${checkInFormatted}\nCheck-out: ${checkOutFormatted}\nHóspedes: ${input.numberOfGuests}\n\n💰 Valores:\nSubtotal: ${subtotalFormatted}${input.discountAmount > 0 ? `\nDesconto 12%: -${discountFormatted}` : ''}\nLimpeza: ${cleaningFormatted}\nTOTAL: ${priceFormatted}\n\nObrigado por escolher o Hostel Bryan Tatuapé!`;
          
          await notifyOwner({
            title: `🆕 Nova Reserva - ${input.firstName} ${input.lastName}`,
            content: `✅ NOVA RESERVA CONFIRMADA\n\n` +
              `👤 HÓSPEDE:\n` +
              `Nome: ${input.firstName} ${input.lastName}\n` +
              `Email: ${input.email}\n` +
              `Telefone: ${input.phone || 'Não informado'}\n` +
              `CPF: ${input.cpf || 'Não informado'}\n` +
              `Nacionalidade: ${input.nationality || 'Não informado'}\n\n` +
              `🏠 ACOMODAÇÃO:\n` +
              `Tipo de Diária: ${input.dailyType === 'couple' ? 'Casal' : 'Individual'}\n\n` +
              `📅 PERÍODO:\n` +
              `Check-in: ${checkInFormatted}\n` +
              `Check-out: ${checkOutFormatted}\n` +
              `Hóspedes: ${input.numberOfGuests}\n\n` +
              `💰 VALORES:\n` +
              `Subtotal: ${subtotalFormatted}\n` +
              `${input.discountAmount > 0 ? `Desconto 12%: -${discountFormatted}\n` : ''}` +
              `Limpeza: ${cleaningFormatted}\n` +
              `TOTAL: ${priceFormatted}\n\n` +
              `📝 Observações: ${input.specialRequests || 'Nenhuma'}\n\n` +
              `✅ Código de Confirmação: ${confirmationCode}\n\n` +
              `📱 MENSAGEM WHATSAPP A ENVIAR:\n` +
              `${whatsappMessage}`
          });
          
          return {
            success: true,
            bookingId,
            confirmationCode,
            whatsappMessage,
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

  roomPhotos: router({
    getByRoomId: publicProcedure
      .input(z.object({ roomId: z.number() }))
      .query(async ({ input }) => {
        const { getRoomPhotos } = await import("./db");
        return getRoomPhotos(input.roomId);
      }),

    add: protectedProcedure
      .input(z.object({
        roomId: z.number(),
        photoUrl: z.string().url(),
        caption: z.string().optional(),
        displayOrder: z.number().default(0),
        isMainPhoto: z.number().default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem adicionar fotos"
          });
        }
        
        const { addRoomPhoto } = await import("./db");
        return addRoomPhoto({
          roomId: input.roomId,
          photoUrl: input.photoUrl,
          caption: input.caption,
          displayOrder: input.displayOrder,
          isMainPhoto: input.isMainPhoto,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem deletar fotos"
          });
        }
        
        const { deleteRoomPhoto } = await import("./db");
        const success = await deleteRoomPhoto(input.photoId);
        return { success };
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
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem bloquear datas"
          });
        }

        // Verificar senha
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Capacho@69";
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Senha incorreta"
          });
        }

        const { createBlockedDate } = await import("./db");
        const id = await createBlockedDate({
          roomId: input.roomId,
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason,
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
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem desbloquear datas"
          });
        }

        // Verificar senha
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Capacho@69";
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Senha incorreta"
          });
        }

        const { deleteBlockedDate } = await import("./db");
        await deleteBlockedDate(input.blockedDateId);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;;

