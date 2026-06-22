import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";

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
        checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .query(async ({ input }) => {
        const { getRoomAvailability } = await import("./db");
        return getRoomAvailability(input.roomId, new Date(input.checkInDate), new Date(input.checkOutDate));
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["private", "shared", "dorm"]),
        capacity: z.number(),
        pricePerNight: z.number(),
        cleaningFee: z.number().optional(),
        discount7Days: z.number().optional(),
        discount15Days: z.number().optional(),
        discount30Days: z.number().optional(),
        description: z.string().optional(),
        amenities: z.string().optional(),
        bathroomType: z.enum(["private", "shared"]).optional(),
        status: z.enum(["available", "maintenance", "archived"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { createRoom } = await import("./db");
        return createRoom(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        pricePerNight: z.number().optional(),
        cleaningFee: z.number().optional(),
        discount7Days: z.number().optional(),
        discount15Days: z.number().optional(),
        discount30Days: z.number().optional(),
        capacity: z.number().optional(),
        type: z.enum(["private", "shared", "dorm"]).optional(),
        amenities: z.string().optional(),
        bathroomType: z.enum(["private", "shared"]).optional(),
        status: z.enum(["available", "maintenance", "archived"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateRoom } = await import("./db");
        return updateRoom(input.id, input);
      }),
  }),

  bookings: router({
    create: publicProcedure
      .input(z.object({
        roomId: z.number(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email().or(z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
        phone: z.string(),
        cpf: z.string(),
        checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        numberOfGuests: z.string(),
        checkInTime: z.string(),
        checkOutTime: z.string(),
        specialRequests: z.string().optional(),
        nationality: z.string().optional(),
        dailyType: z.string().optional(),
        subtotal: z.number().optional(),
        discountPercentage: z.number().optional(),
        discountAmount: z.number().optional(),
        cleaningFee: z.number().optional(),
        totalPrice: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createBooking } = await import("./db");
        return createBooking(input);
      }),

    list: adminProcedure.query(async () => {
      const { getAllBookings } = await import("./db");
      return getAllBookings();
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getBookingById } = await import("./db");
        return getBookingById(input.id);
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        roomId: z.number(),
        checkInDate: z.string(),
        checkOutDate: z.string(),
        numberOfGuests: z.string(),
        specialRequests: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { updateBooking } = await import("./db");
        return updateBooking(input.id, {
          roomId: input.roomId,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          numberOfGuests: parseInt(input.numberOfGuests),
          specialRequests: input.specialRequests,
        }, ctx.user?.email || 'system');
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteBooking } = await import("./db");
        return deleteBooking(input.id);
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "cancelled"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const { updateBookingStatus } = await import("./db");
        return updateBookingStatus(input.id, input.status);
      }),

    getMonthlyHistory: adminProcedure.query(async () => {
      const { getAllMonthlyRevenueHistory } = await import("./db");
      return getAllMonthlyRevenueHistory();
    }),

    saveMonthlyHistory: adminProcedure
      .input(z.object({
        year: z.number(),
        month: z.number(),
        totalReservations: z.number(),
        totalRevenue: z.number(),
        confirmedReservations: z.number(),
        confirmedRevenue: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { saveMonthlyRevenueHistory } = await import("./db");
        return saveMonthlyRevenueHistory(input);
      }),
  }),

  blockedDates: router({
    list: publicProcedure
      .input(z.object({ roomId: z.number() }))
      .query(async ({ input }) => {
        const { getBlockedDates } = await import("./db");
        return getBlockedDates(input.roomId, new Date("1970-01-01"), new Date("2099-12-31"));
      }),

    create: publicProcedure
      .input(z.object({
        roomId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        reason: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { createBlockedDate } = await import("./db");
        const blockedDateId = await createBlockedDate({
          roomId: input.roomId,
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason,
        });

        return { id: blockedDateId };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number(), password: z.string() }))
      .mutation(async ({ input }) => {
        const correctPassword = "Capacho@69";
        const inputPassword = input.password.trim();
        if (inputPassword !== correctPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha incorreta" });
        }

        const { deleteBlockedDate } = await import("./db");
        await deleteBlockedDate(input.id);

        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        reason: z.string().optional(),
        roomId: z.number().optional(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const correctPassword = "Capacho@69";
        const inputPassword = input.password.trim();
        if (inputPassword !== correctPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha incorreta" });
        }

        const { updateBlockedDate } = await import("./db");
        await updateBlockedDate(input.id, {
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason,
          roomId: input.roomId,
        });

        return { success: true };
      }),
  }),

  blockingExceptions: router({
    getByRoom: publicProcedure
      .input(z.object({ roomId: z.number() }))
      .query(async ({ input }) => {
        const { getBlockingExceptionsByRoom } = await import("./db");
        return getBlockingExceptionsByRoom(input.roomId);
      }),

    getByBlockedDate: publicProcedure
      .input(z.object({ blockedDateId: z.number() }))
      .query(async ({ input }) => {
        const { getBlockingExceptionsByBlockedDate } = await import("./db");
        return getBlockingExceptionsByBlockedDate(input.blockedDateId);
      }),

    create: protectedProcedure
      .input(z.object({
        blockedDateId: z.number(),
        exceptionDate: z.date(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createBlockingException } = await import("./db");
        return createBlockingException({
          blockedDateId: input.blockedDateId,
          exceptionDate: input.exceptionDate,
          reason: input.reason,
          createdBy: ctx.user?.id || 1,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ exceptionId: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteBlockingException } = await import("./db");
        return deleteBlockingException(input.exceptionId);
      }),
  }),

  roomPhotos: router({
    getByRoom: publicProcedure
      .input(z.object({ roomId: z.number() }))
      .query(async ({ input }) => {
        const { getRoomPhotos } = await import("./db");
        return getRoomPhotos(input.roomId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        roomId: z.number(),
        photoUrl: z.string(),
        caption: z.string().optional(),
        displayOrder: z.number().optional(),
        isMainPhoto: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createRoomPhoto } = await import("./db");
        return createRoomPhoto({
          roomId: input.roomId,
          photoUrl: input.photoUrl,
          caption: input.caption,
          displayOrder: input.displayOrder || 0,
          isMainPhoto: input.isMainPhoto || 0,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteRoomPhoto } = await import("./db");
        return deleteRoomPhoto(input.photoId);
      }),
    
    update: protectedProcedure
      .input(z.object({
        photoId: z.number(),
        caption: z.string().optional(),
        displayOrder: z.number().optional(),
        isMainPhoto: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateRoomPhoto } = await import("./db");
        return updateRoomPhoto(input.photoId, {
          caption: input.caption,
          displayOrder: input.displayOrder,
          isMainPhoto: input.isMainPhoto,
        });
      }),
    
    uploadAndOptimize: protectedProcedure
      .input(z.object({
        roomId: z.number(),
        fileBase64: z.string(),
        fileName: z.string(),
        caption: z.string().optional(),
        isMainPhoto: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const sharp = require('sharp');
          const { storagePut } = await import("./storage");
          const { createRoomPhoto } = await import("./db");
          
          // Decodificar base64
          const buffer = Buffer.from(input.fileBase64, 'base64');
          
          // Otimizar com Sharp: redimensionar e comprimir
          const optimized = await sharp(buffer)
            .resize(1200, 800, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();
          
          // Salvar em S3
          const fileKey = `room-photos/${input.roomId}/${Date.now()}-${input.fileName}`;
          const { url } = await storagePut(fileKey, optimized, 'image/jpeg');
          
          // Salvar no banco
          const photoId = await createRoomPhoto({
            roomId: input.roomId,
            photoUrl: url,
            caption: input.caption,
            isMainPhoto: input.isMainPhoto || 0,
            displayOrder: 0,
          });
          
          return { success: true, photoId, url };
        } catch (error: any) {
          console.error('[Upload] Error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Erro ao fazer upload da foto',
          });
        }
      }),
    }),

  homeImages: router({
    list: publicProcedure.query(async () => {
      const { getHomeImages } = await import("./db");
      return getHomeImages();
    }),
    
    getByPosition: publicProcedure
      .input(z.object({ position: z.enum(["left", "right", "top", "bottom"]) }))
      .query(async ({ input }) => {
        const { getHomeImageByPosition } = await import("./db");
        return getHomeImageByPosition(input.position);
      }),
    
    create: adminProcedure
      .input(z.object({
        imageUrl: z.string(),
        position: z.enum(["left", "right", "top", "bottom"]),
        title: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createHomeImage } = await import("./db");
        const { storagePut } = await import("./storage");
        
        let finalImageUrl = input.imageUrl;
        if (input.imageUrl.startsWith('data:')) {
          try {
            const base64Data = input.imageUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const fileKey = `home-images/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
            const { url } = await storagePut(fileKey, buffer, 'image/png');
            finalImageUrl = url;
          } catch (error) {
            console.error('Erro ao fazer upload:', error);
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao fazer upload da imagem' });
          }
        }
        
        return createHomeImage({
          imageUrl: finalImageUrl,
          position: input.position,
          title: input.title,
          description: input.description,
          uploadedBy: ctx.user.id,
        });
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        imageUrl: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateHomeImage } = await import("./db");
        return updateHomeImage(input.id, {
          imageUrl: input.imageUrl,
          title: input.title,
          description: input.description,
        });
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteHomeImage } = await import("./db");
        return deleteHomeImage(input.id);
      }),
    
    reorder: adminProcedure
      .input(z.object({
        items: z.array(z.object({
          id: z.number(),
          displayOrder: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { reorderHomeImages } = await import("./db");
        return reorderHomeImages(input.items);
      }),
  }),
});
export type AppRouter = typeof appRouter;
