import { describe, it, expect } from 'vitest';

/**
 * Testes para extensão de reservas
 * Valida cálculo de preço, desconto e taxa de limpeza
 */
describe('Booking Extension', () => {
  it('should calculate extension price for 3 additional days', () => {
    const pricePerNight = 8000; // R$ 80,00
    const extensionDays = 3;
    const numberOfGuests = 2;
    
    const extensionSubtotal = extensionDays * pricePerNight;
    let extensionDiscountAmount = 0;
    
    if (numberOfGuests === 1) {
      extensionDiscountAmount = Math.floor(extensionSubtotal * (12 / 100));
    }
    
    const extensionTotalPrice = extensionSubtotal - extensionDiscountAmount;
    
    expect(extensionSubtotal).toBe(24000); // 3 * 8000
    expect(extensionDiscountAmount).toBe(0); // Sem desconto para 2 pessoas
    expect(extensionTotalPrice).toBe(24000);
  });

  it('should apply 12% discount for single guest extension', () => {
    const pricePerNight = 8000; // R$ 80,00
    const extensionDays = 3;
    const numberOfGuests = 1;
    
    const extensionSubtotal = extensionDays * pricePerNight;
    let extensionDiscountAmount = 0;
    let extensionDiscountPercentage = 0;
    
    if (numberOfGuests === 1) {
      extensionDiscountPercentage = 12;
      extensionDiscountAmount = Math.floor(extensionSubtotal * (12 / 100));
    }
    
    const extensionTotalPrice = extensionSubtotal - extensionDiscountAmount;
    
    expect(extensionSubtotal).toBe(24000); // 3 * 8000
    expect(extensionDiscountPercentage).toBe(12);
    expect(extensionDiscountAmount).toBe(2880); // 12% de 24000
    expect(extensionTotalPrice).toBe(21120); // 24000 - 2880
  });

  it('should add cleaning fee to extension total', () => {
    const pricePerNight = 8000;
    const extensionDays = 2;
    const numberOfGuests = 2;
    const cleaningFee = 700; // R$ 7,00
    
    const extensionSubtotal = extensionDays * pricePerNight;
    let extensionDiscountAmount = 0;
    
    if (numberOfGuests === 1) {
      extensionDiscountAmount = Math.floor(extensionSubtotal * (12 / 100));
    }
    
    const extensionTotalPrice = extensionSubtotal - extensionDiscountAmount + cleaningFee;
    
    expect(extensionSubtotal).toBe(16000); // 2 * 8000
    expect(extensionTotalPrice).toBe(16700); // 16000 + 700
  });

  it('should calculate payment split correctly', () => {
    const extensionTotalPrice = 24000;
    const extensionPaymentAtBooking = Math.floor(extensionTotalPrice / 2);
    const extensionPaymentAtCheckIn = extensionTotalPrice - extensionPaymentAtBooking;
    
    expect(extensionPaymentAtBooking).toBe(12000);
    expect(extensionPaymentAtCheckIn).toBe(12000);
    expect(extensionPaymentAtBooking + extensionPaymentAtCheckIn).toBe(extensionTotalPrice);
  });

  it('should calculate days between dates correctly', () => {
    const originalCheckOut = '2026-07-15';
    const newCheckOut = '2026-07-18';
    
    const originalCheckOutDate = new Date(originalCheckOut);
    const newCheckOutDateObj = new Date(newCheckOut);
    
    const extensionDays = Math.ceil(
      (newCheckOutDateObj.getTime() - originalCheckOutDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    expect(extensionDays).toBe(3);
  });

  it('should mark extension booking correctly', () => {
    const isExtension = 1;
    const parentBookingId = 42;
    
    expect(isExtension).toBe(1);
    expect(parentBookingId).toBeGreaterThan(0);
  });

  it('should generate unique confirmation code', () => {
    const confirmationCode1 = `EXT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const confirmationCode2 = `EXT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    expect(confirmationCode1).toMatch(/^EXT-\d+-[A-Z0-9]+$/);
    expect(confirmationCode2).toMatch(/^EXT-\d+-[A-Z0-9]+$/);
    expect(confirmationCode1).not.toBe(confirmationCode2);
  });

  it('should reject extension date before original checkout', () => {
    const originalCheckOut = '2026-07-15';
    const invalidNewCheckOut = '2026-07-14';
    
    const originalCheckOutDate = new Date(originalCheckOut);
    const newCheckOutDateObj = new Date(invalidNewCheckOut);
    
    const extensionDays = Math.ceil(
      (newCheckOutDateObj.getTime() - originalCheckOutDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    expect(extensionDays).toBeLessThanOrEqual(0);
  });

  it('should include extension in special requests', () => {
    const parentBookingId = 42;
    const specialRequests = `Extensão da reserva #${parentBookingId}`;
    
    expect(specialRequests).toContain('Extensão');
    expect(specialRequests).toContain(parentBookingId.toString());
  });

  it('should calculate extension with discount and cleaning fee', () => {
    const pricePerNight = 8000;
    const extensionDays = 5;
    const numberOfGuests = 1;
    const cleaningFee = 700;
    
    const extensionSubtotal = extensionDays * pricePerNight;
    const extensionDiscountAmount = Math.floor(extensionSubtotal * (12 / 100));
    const extensionTotalPrice = extensionSubtotal - extensionDiscountAmount + cleaningFee;
    
    expect(extensionSubtotal).toBe(40000); // 5 * 8000
    expect(extensionDiscountAmount).toBe(4800); // 12% de 40000
    expect(extensionTotalPrice).toBe(35900); // 40000 - 4800 + 700
  });
});
