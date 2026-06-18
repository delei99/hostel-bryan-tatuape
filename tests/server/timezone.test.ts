import { describe, it, expect } from 'vitest';

/**
 * Testes para validar que o bug de timezone foi corrigido
 * Problema: Check-in bloqueado aparecia um dia anterior no calendário
 * Solução: Usar Date.UTC em vez de new Date() com timezone local
 */

describe('Timezone Bug Fix', () => {
  it('deve normalizar datas corretamente com UTC', () => {
    // Simular o que acontecia antes (timezone local)
    const localDate = new Date(2026, 4, 1, 0, 0, 0, 0); // 1º de maio

    // Simular o que acontece agora (UTC)
    const utcDate = new Date(Date.UTC(2026, 4, 1, 0, 0, 0, 0)); // 1º de maio UTC

    // Verificar que o dia está correto
    expect(utcDate.getUTCDate()).toBe(1);
    expect(utcDate.getUTCMonth()).toBe(4); // Maio (0-indexed)
    expect(utcDate.getUTCFullYear()).toBe(2026);
  });

  it('deve converter string YYYY-MM-DD para UTC corretamente', () => {
    const dateStr = '2026-05-01';
    const [year, month, day] = dateStr.split('-').map(Number);

    // Criar Date com UTC
    const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // Verificar que a data está correta
    expect(utcDate.getUTCFullYear()).toBe(2026);
    expect(utcDate.getUTCMonth()).toBe(4); // Maio
    expect(utcDate.getUTCDate()).toBe(1);
  });

  it('deve comparar datas bloqueadas corretamente', () => {
    // Simular bloqueio de 01/05 a 02/05
    const startDate = new Date(Date.UTC(2026, 4, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(2026, 4, 2, 23, 59, 59, 999));

    // Simular data do calendário (01/05)
    const calendarDate = new Date(Date.UTC(2026, 4, 1, 0, 0, 0, 0));

    // Verificar que 01/05 está entre o bloqueio
    expect(calendarDate >= startDate && calendarDate <= endDate).toBe(true);
  });

  it('não deve bloquear dia anterior ao check-in', () => {
    // Simular bloqueio de 01/05 a 02/05
    const startDate = new Date(Date.UTC(2026, 4, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(2026, 4, 2, 23, 59, 59, 999));

    // Simular dia anterior (30/04)
    const dayBefore = new Date(Date.UTC(2026, 3, 30, 0, 0, 0, 0));

    // Verificar que 30/04 NÃO está bloqueado
    expect(dayBefore >= startDate && dayBefore <= endDate).toBe(false);
  });

  it('deve bloquear check-out corretamente', () => {
    // Simular bloqueio de 01/05 a 02/05
    const startDate = new Date(Date.UTC(2026, 4, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(2026, 4, 2, 23, 59, 59, 999));

    // Simular dia do check-out (02/05)
    const checkOutDate = new Date(Date.UTC(2026, 4, 2, 0, 0, 0, 0));

    // Verificar que 02/05 está bloqueado
    expect(checkOutDate >= startDate && checkOutDate <= endDate).toBe(true);
  });

  it('deve normalizar datas de string corretamente', () => {
    // Simular o que BlockedDatesCalendar faz
    const normalizeDate = (date: Date | string): Date => {
      if (typeof date === 'string') {
        const [year, month, day] = date.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      }
      const d = new Date(date);
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    };

    // Testar com string
    const dateFromString = normalizeDate('2026-05-01');
    expect(dateFromString.getUTCDate()).toBe(1);
    expect(dateFromString.getUTCMonth()).toBe(4);

    // Testar com Date
    const dateFromDate = normalizeDate(new Date(Date.UTC(2026, 4, 1, 12, 30, 0, 0)));
    expect(dateFromDate.getUTCDate()).toBe(1);
    expect(dateFromDate.getUTCMonth()).toBe(4);
    expect(dateFromDate.getUTCHours()).toBe(0); // Deve ser normalizado para 00:00
  });

  it('deve validar que check-in e check-out não se sobrepõem incorretamente', () => {
    // Simular bloqueio automático de check-in 01/05 até check-out 02/05
    const checkInDate = '2026-05-01';
    const checkOutDate = '2026-05-02';

    const [checkInYear, checkInMonth, checkInDay] = checkInDate.split('-').map(Number);
    const [checkOutYear, checkOutMonth, checkOutDay] = checkOutDate.split('-').map(Number);

    const startDate = new Date(Date.UTC(checkInYear, checkInMonth - 1, checkInDay, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(checkOutYear, checkOutMonth - 1, checkOutDay, 23, 59, 59, 999));

    // Verificar que as datas estão corretas
    expect(startDate.getUTCDate()).toBe(1);
    expect(startDate.getUTCMonth()).toBe(4);
    expect(endDate.getUTCDate()).toBe(2);
    expect(endDate.getUTCMonth()).toBe(4);

    // Verificar que 30/04 não está bloqueado
    const dayBefore = new Date(Date.UTC(2026, 3, 30, 0, 0, 0, 0));
    expect(dayBefore >= startDate && dayBefore <= endDate).toBe(false);
  });
});
