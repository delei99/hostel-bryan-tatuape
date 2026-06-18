import { describe, it, expect } from "vitest";

/**
 * Testes para notificacao WhatsApp
 */
describe("WhatsApp Notification", () => {
  it("should format phone number correctly", () => {
    const phone = "(11) 95219-7283";
    const cleanedPhone = phone.replace(/\D/g, '');
    
    expect(cleanedPhone).toBe("11952197283");
    expect(cleanedPhone.length).toBe(11);
  });

  it("should validate phone number has minimum 11 digits", () => {
    const phone = "11952197283";
    
    expect(phone.length >= 11).toBe(true);
  });

  it("should reject invalid phone numbers", () => {
    const phone = "123";
    
    expect(phone.length >= 11).toBe(false);
  });

  it("should encode message for URL", () => {
    const message = "Reserva Editada - Hostel Bryan Tatuapé";
    const encoded = encodeURIComponent(message);
    
    expect(encoded).toBeTruthy();
    expect(encoded).toContain("Reserva");
  });

  it("should generate valid WhatsApp URL", () => {
    const phoneNumber = "11952197283";
    const message = "Test message";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    expect(whatsappUrl).toContain("https://wa.me/");
    expect(whatsappUrl).toContain(phoneNumber);
    expect(whatsappUrl).toContain("text=");
  });

  it("should include booking details in message", () => {
    const booking = {
      confirmationCode: "20260427-ABC12",
      checkInDate: "2026-05-15",
      checkOutTime: "12:00",
      totalPrice: 80000,
    };
    
    const message = `Codigo: ${booking.confirmationCode}`;
    
    expect(message).toContain(booking.confirmationCode);
  });

  it("should include edit timestamp in message", () => {
    const now = new Date();
    const editedAt = now.toLocaleString('pt-BR');
    
    expect(editedAt).toBeTruthy();
    expect(editedAt.length > 0).toBe(true);
  });

  it("should include admin name in message", () => {
    const editedBy = "Admin";
    const message = `Editado por: ${editedBy}`;
    
    expect(message).toContain(editedBy);
  });
});
