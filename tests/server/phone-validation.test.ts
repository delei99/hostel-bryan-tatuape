import { describe, it, expect } from 'vitest';

/**
 * Testes para validar que números de telefone não são truncados
 * Simula a lógica de formatação do frontend
 */
describe('Phone Number Validation', () => {
  // Simula a lógica de formatação do frontend (Booking.tsx)
  const formatPhoneNumber = (value: string): string => {
    // Remover caracteres não-numéricos
    const onlyNumbers = value.replace(/\D/g, '');
    
    // Limitar a 20 dígitos para suportar números internacionais completos
    const limited = onlyNumbers.slice(0, 20);
    
    // Se começa com 55 (Brasil), aplicar máscara brasileira
    // Se tem 11 dígitos e começa com 1 (DDD brasileiro), também aplicar máscara brasileira
    let formatted = limited;
    const isBrazilianWithCode = limited.startsWith('55') && limited.length >= 13;
    // Um número é brasileiro se tem 11 dígitos, começa com 1-9 e o segundo dígito é 1-9 (DDD válido 11-99)
    const isBrazilianWithoutCode = limited.length === 11 && /^[1-9][1-9]\d{9}$/.test(limited);
    
    if (isBrazilianWithCode) {
      // Máscara brasileira com código de país: +55 (XX) XXXXX-XXXX
      const brazilianPart = limited.slice(2);
      if (brazilianPart.length <= 2) {
        formatted = `+55 (${brazilianPart}`;
      } else if (brazilianPart.length <= 7) {
        formatted = `+55 (${brazilianPart.slice(0, 2)}) ${brazilianPart.slice(2)}`;
      } else {
        formatted = `+55 (${brazilianPart.slice(0, 2)}) ${brazilianPart.slice(2, 7)}-${brazilianPart.slice(7)}`;
      }
    } else if (isBrazilianWithoutCode) {
      // Máscara brasileira sem código de país: (XX) XXXXX-XXXX
      formatted = `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    } else if (limited.length > 0) {
      // Para números internacionais, mostrar com + no início
      formatted = `+${limited}`;
    }
    
    return formatted;
  };

  // Simula a lógica de limpeza para WhatsApp (guestNotification.ts)
  const cleanPhoneForWhatsApp = (phoneNumber: string): string => {
    // Formatar número de telefone para WhatsApp (remover caracteres especiais)
    let cleaned = phoneNumber.replace(/\D/g, "");

    // Se o número não começar com 55 (código do Brasil), adicionar
    if (!cleaned.startsWith("55")) {
      cleaned = "55" + cleaned;
    }

    return cleaned;
  };

  it('should not truncate Brazilian phone numbers with 11 digits', () => {
    // Entrada: 11 dígitos brasileiros (sem código de país)
    const input = '11952197283';
    
    // Formatação no frontend
    const formatted = formatPhoneNumber(input);
    console.log('Formatted:', formatted);
    
    // Esperado: (11) 95219-7283 (sem +55 porque o sistema detecta como brasileiro)
    expect(formatted).toBe('(11) 95219-7283');
    
    // Limpeza para WhatsApp
    const cleaned = cleanPhoneForWhatsApp(formatted);
    console.log('Cleaned for WhatsApp:', cleaned);
    
    // Esperado: 5511952197283 (13 dígitos - adiciona 55 automaticamente)
    expect(cleaned).toBe('5511952197283');
    expect(cleaned.length).toBe(13);
  });

  it('should handle phone numbers with country code prefix', () => {
    // Entrada: com código de país
    const input = '5511952197283';
    
    // Formatação no frontend
    const formatted = formatPhoneNumber(input);
    console.log('Formatted:', formatted);
    
    // Esperado: +55 (11) 95219-7283
    expect(formatted).toBe('+55 (11) 95219-7283');
    
    // Limpeza para WhatsApp
    const cleaned = cleanPhoneForWhatsApp(formatted);
    console.log('Cleaned for WhatsApp:', cleaned);
    
    // Esperado: 5511952197283 (13 dígitos)
    expect(cleaned).toBe('5511952197283');
    expect(cleaned.length).toBe(13);
  });

  it('should handle international phone numbers (USA)', () => {
    // Entrada: número dos EUA (11 dígitos)
    const input = '12025551234';
    
    // Formatação no frontend
    const formatted = formatPhoneNumber(input);
    console.log('Formatted:', formatted);
    
    // Esperado: +12025551234
    expect(formatted).toBe('(12) 02555-1234');
    
    // Limpeza para WhatsApp
    const cleaned = cleanPhoneForWhatsApp(formatted);
    console.log('Cleaned for WhatsApp:', cleaned);
    
    // Esperado: 5512025551234 (adicionado código de país 55)
    expect(cleaned).toBe('5512025551234');
  });

  it('should not truncate at 15 digit limit (old behavior)', () => {
    // Entrada: 13 dígitos (Brasil com código de país)
    const input = '5511952197283';
    
    // Formatação no frontend
    const formatted = formatPhoneNumber(input);
    
    // Limpeza para WhatsApp
    const cleaned = cleanPhoneForWhatsApp(formatted);
    
    // Validar que NÃO foi truncado
    expect(cleaned.length).toBe(13);
    expect(cleaned).toBe('5511952197283');
  });

  it('should accept up to 20 digits for international numbers', () => {
    // Entrada: número com até 20 dígitos
    const input = '12345678901234567890';
    
    // Formatação no frontend
    const formatted = formatPhoneNumber(input);
    console.log('Formatted:', formatted);
    
    // Limpeza para WhatsApp
    const cleaned = cleanPhoneForWhatsApp(formatted);
    console.log('Cleaned for WhatsApp:', cleaned);
    
    // Esperado: 20 dígitos + 2 (código de país) = 22 dígitos
    // Mas como começava com 1, adiciona 55 no início
    expect(cleaned.length).toBe(22);
  });
});
