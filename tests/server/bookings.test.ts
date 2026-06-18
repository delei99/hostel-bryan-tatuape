import { describe, expect, it } from "vitest";

/**
 * Testes para cálculo de preço de reservas
 * Valida desconto de 12% para uma pessoa e taxa de limpeza
 */
describe("Booking Price Calculation", () => {
  const DISCOUNT_PERCENTAGE = 12;
  const CLEANING_FEE = 700; // R$ 7,00 em centavos

  // Função auxiliar para calcular preço (mesma lógica do frontend)
  function calculateBookingPrice(
    pricePerNight: number,
    nights: number,
    numberOfGuests: number
  ) {
    const subtotal = nights * pricePerNight;
    const discountAmount =
      numberOfGuests === 1
        ? Math.floor(subtotal * (DISCOUNT_PERCENTAGE / 100))
        : 0;
    const totalPrice = subtotal - discountAmount + CLEANING_FEE;

    return {
      subtotal,
      discountAmount,
      discountPercentage: numberOfGuests === 1 ? DISCOUNT_PERCENTAGE : 0,
      cleaningFee: CLEANING_FEE,
      totalPrice,
    };
  }

  describe("Desconto de 12% para uma pessoa", () => {
    it("deve aplicar desconto de 12% quando há apenas 1 hóspede", () => {
      const pricePerNight = 10000; // R$ 100,00
      const nights = 3;
      const numberOfGuests = 1;

      const result = calculateBookingPrice(
        pricePerNight,
        nights,
        numberOfGuests
      );

      expect(result.subtotal).toBe(30000); // R$ 300,00
      expect(result.discountPercentage).toBe(12);
      expect(result.discountAmount).toBe(3600); // R$ 36,00 (12% de 300)
      expect(result.totalPrice).toBe(27100); // 30000 - 3600 + 700
    });

    it("não deve aplicar desconto quando há 2 ou mais hóspedes", () => {
      const pricePerNight = 10000; // R$ 100,00
      const nights = 3;
      const numberOfGuests = 2;

      const result = calculateBookingPrice(
        pricePerNight,
        nights,
        numberOfGuests
      );

      expect(result.subtotal).toBe(30000);
      expect(result.discountPercentage).toBe(0);
      expect(result.discountAmount).toBe(0);
      expect(result.totalPrice).toBe(30700); // 30000 + 700 (sem desconto)
    });
  });

  describe("Taxa de limpeza", () => {
    it("deve cobrar R$ 7,00 de limpeza em todas as reservas", () => {
      const pricePerNight = 5000; // R$ 50,00
      const nights = 2;
      const numberOfGuests = 1;

      const result = calculateBookingPrice(
        pricePerNight,
        nights,
        numberOfGuests
      );

      expect(result.cleaningFee).toBe(700); // R$ 7,00
      // Verifica que o total inclui a taxa de limpeza
      expect(result.totalPrice).toBeGreaterThanOrEqual(result.subtotal - result.discountAmount + 700);
    });

    it("deve cobrar limpeza mesmo sem desconto", () => {
      const pricePerNight = 8000; // R$ 80,00
      const nights = 1;
      const numberOfGuests = 3;

      const result = calculateBookingPrice(
        pricePerNight,
        nights,
        numberOfGuests
      );

      expect(result.cleaningFee).toBe(700);
      expect(result.totalPrice).toBe(8700); // 8000 + 700 (sem desconto)
    });
  });

  describe("Cálculo completo", () => {
    it("deve calcular corretamente com desconto e limpeza", () => {
      const pricePerNight = 12000; // R$ 120,00
      const nights = 5;
      const numberOfGuests = 1;

      const result = calculateBookingPrice(
        pricePerNight,
        nights,
        numberOfGuests
      );

      const expectedSubtotal = 60000; // 5 * 12000
      const expectedDiscount = Math.floor(60000 * 0.12); // 7200
      const expectedTotal = expectedSubtotal - expectedDiscount + 700; // 60000 - 7200 + 700 = 53500

      expect(result.subtotal).toBe(expectedSubtotal);
      expect(result.discountAmount).toBe(expectedDiscount);
      expect(result.totalPrice).toBe(expectedTotal);
    });

    it("deve calcular corretamente sem desconto mas com limpeza", () => {
      const pricePerNight = 15000; // R$ 150,00
      const nights = 2;
      const numberOfGuests = 2;

      const result = calculateBookingPrice(
        pricePerNight,
        nights,
        numberOfGuests
      );

      const expectedSubtotal = 30000; // 2 * 15000
      const expectedTotal = 30700; // 30000 + 700 (sem desconto)

      expect(result.subtotal).toBe(expectedSubtotal);
      expect(result.discountAmount).toBe(0);
      expect(result.totalPrice).toBe(expectedTotal);
    });

    it("deve calcular corretamente para uma noite com uma pessoa", () => {
      const pricePerNight = 8000; // R$ 80,00
      const nights = 1;
      const numberOfGuests = 1;

      const result = calculateBookingPrice(
        pricePerNight,
        nights,
        numberOfGuests
      );

      const expectedSubtotal = 8000;
      const expectedDiscount = Math.floor(8000 * 0.12); // 960
      const expectedTotal = 8000 - 960 + 700; // 7740

      expect(result.subtotal).toBe(expectedSubtotal);
      expect(result.discountAmount).toBe(expectedDiscount);
      expect(result.totalPrice).toBe(expectedTotal);
    });
  });

  describe("Casos extremos", () => {
    it("deve calcular corretamente com preço muito alto", () => {
      const pricePerNight = 500000; // R$ 5.000,00
      const nights = 10;
      const numberOfGuests = 1;

      const result = calculateBookingPrice(
        pricePerNight,
        nights,
        numberOfGuests
      );

      const expectedSubtotal = 5000000; // 10 * 500000
      const expectedDiscount = Math.floor(5000000 * 0.12); // 600000
      const expectedTotal = 5000000 - 600000 + 700; // 4400700

      expect(result.subtotal).toBe(expectedSubtotal);
      expect(result.discountAmount).toBe(expectedDiscount);
      expect(result.totalPrice).toBe(expectedTotal);
    });

    it("deve calcular corretamente com preço muito baixo", () => {
      const pricePerNight = 100; // R$ 1,00
      const nights = 1;
      const numberOfGuests = 1;

      const result = calculateBookingPrice(
        pricePerNight,
        nights,
        numberOfGuests
      );

      const expectedSubtotal = 100;
      const expectedDiscount = Math.floor(100 * 0.12); // 12
      const expectedTotal = 100 - 12 + 700; // 788

      expect(result.subtotal).toBe(expectedSubtotal);
      expect(result.discountAmount).toBe(expectedDiscount);
      expect(result.totalPrice).toBe(expectedTotal);
    });
  });
});
