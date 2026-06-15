import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createBooking, updateBooking, getRoomById, updateRoom } from "./db";

describe("Dynamic Pricing - Using Current Room Price", () => {
  const testRoomId = 1;
  const testBookingData = {
    firstName: "João",
    lastName: "Silva",
    email: "joao@example.com",
    phone: "11987654321",
    cpf: "12345678901",
    nationality: "Brasileiro",
    roomId: testRoomId,
    checkInDate: "2026-06-20",
    checkOutDate: "2026-06-22",
    numberOfGuests: "2",
    checkInTime: "14:00",
    checkOutTime: "12:00",
    specialRequests: "",
  };

  beforeAll(async () => {
    // Verificar que o quarto 1 existe
    const room = await getRoomById(testRoomId);
    if (!room) {
      throw new Error(`Room ${testRoomId} not found. Please ensure room exists in database.`);
    }
    // Restaurar preço padrão
    await updateRoom(testRoomId, { pricePerNight: 80 });
  });

  afterAll(async () => {
    // Restaurar preço padrão após todos os testes
    await updateRoom(testRoomId, { pricePerNight: 80 });
  });

  it("should use current room price when creating a booking", async () => {
    // Garantir que o preço está em 80
    await updateRoom(testRoomId, { pricePerNight: 80 });
    
    // Criar reserva
    const booking = await createBooking({
      ...testBookingData,
      checkInDate: "2026-06-20",
      checkOutDate: "2026-06-22",
    });

    // Validar que o preço foi calculado com base no preço vigente
    expect(booking.subtotal).toBeGreaterThan(0);
    expect(booking.totalPrice).toBeGreaterThan(0);
    expect(booking.totalPrice).toBeGreaterThan(booking.subtotal); // Total deve incluir taxa de limpeza
  });

  it("should apply 12% discount for 1 guest", async () => {
    await updateRoom(testRoomId, { pricePerNight: 80 });

    const booking = await createBooking({
      ...testBookingData,
      numberOfGuests: "1",
      checkInDate: "2026-06-25",
      checkOutDate: "2026-06-27",
    });

    // Validar que o desconto foi aplicado
    expect(booking.discountPercentage).toBe(12);
    expect(booking.discountAmount).toBeGreaterThan(0);
    expect(booking.subtotal).toBeLessThan(booking.subtotal + booking.discountAmount);
  });

  it("should not apply discount for 2 guests", async () => {
    await updateRoom(testRoomId, { pricePerNight: 80 });

    const booking = await createBooking({
      ...testBookingData,
      numberOfGuests: "2",
      checkInDate: "2026-07-01",
      checkOutDate: "2026-07-03",
    });

    // Validar que sem desconto foi aplicado
    expect(booking.discountPercentage).toBe(0);
    expect(booking.discountAmount).toBe(0);
  });

  it("should recalculate price when room price changes", async () => {
    // Criar primeira reserva com preço 80
    await updateRoom(testRoomId, { pricePerNight: 80 });
    const booking1 = await createBooking({
      ...testBookingData,
      checkInDate: "2026-07-05",
      checkOutDate: "2026-07-07",
    });

    const price1 = booking1.totalPrice;

    // Mudar preço do quarto para 100
    await updateRoom(testRoomId, { pricePerNight: 100 });

    // Criar segunda reserva com preço 100
    const booking2 = await createBooking({
      ...testBookingData,
      checkInDate: "2026-07-10",
      checkOutDate: "2026-07-12",
    });

    const price2 = booking2.totalPrice;

    // Preço 2 deve ser maior que preço 1 (porque o preço do quarto aumentou)
    expect(price2).toBeGreaterThan(price1);

    // Restaurar preço original
    await updateRoom(testRoomId, { pricePerNight: 80 });
  });

  it("should update booking price when room price changes and booking is edited", async () => {
    // Criar reserva com preço 80
    await updateRoom(testRoomId, { pricePerNight: 80 });
    const booking = await createBooking({
      ...testBookingData,
      checkInDate: "2026-07-15",
      checkOutDate: "2026-07-17",
    });

    const bookingId = booking.id;
    const price1 = booking.totalPrice;

    // Mudar preço do quarto para 120
    await updateRoom(testRoomId, { pricePerNight: 120 });

    // Editar a reserva (mesmo que apenas para atualizar o preço)
    const updatedBooking = await updateBooking(
      bookingId,
      {
        checkInDate: "2026-07-15",
        checkOutDate: "2026-07-17",
      },
      "admin"
    );

    const price2 = updatedBooking.booking.totalPrice;

    // Preço deve ser recalculado com novo preço
    expect(price2).toBeGreaterThan(price1);

    // Restaurar preço original
    await updateRoom(testRoomId, { pricePerNight: 80 });
  });

  it("should handle price changes correctly for different number of guests", async () => {
    await updateRoom(testRoomId, { pricePerNight: 80 });

    // Reserva para 1 pessoa (com desconto)
    const booking1 = await createBooking({
      ...testBookingData,
      numberOfGuests: "1",
      checkInDate: "2026-07-20",
      checkOutDate: "2026-07-22",
    });

    // Reserva para 2 pessoas (sem desconto)
    const booking2 = await createBooking({
      ...testBookingData,
      numberOfGuests: "2",
      checkInDate: "2026-07-23",
      checkOutDate: "2026-07-25",
    });

    // Ambas as reservas devem ter o mesmo preço base, mas booking1 deve ter desconto
    expect(booking1.discountPercentage).toBe(12);
    expect(booking2.discountPercentage).toBe(0);
    
    // O preço total de booking2 deve ser maior que booking1 (por causa do desconto)
    expect(booking2.totalPrice).toBeGreaterThan(booking1.totalPrice);
  });
});
