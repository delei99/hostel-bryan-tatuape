import { describe, it, expect } from 'vitest';

describe('Blocking Exceptions Logic', () => {
  // Função para converter data para string YYYY-MM-DD
  const dateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Função para verificar se uma data está bloqueada com exceções
  const isDateBlockedWithExceptions = (
    checkInDate: string,
    checkOutDate: string,
    blockedPeriods: Array<{ startDate: string; endDate: string }>,
    exceptionDates: string[]
  ): boolean => {
    // Converter datas para comparação
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Verificar cada período bloqueado
    for (const period of blockedPeriods) {
      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);

      // Verificar se há sobreposição
      if (checkIn >= periodEnd || checkOut <= periodStart) {
        continue; // Sem sobreposição
      }

      // Há sobreposição - verificar se todas as datas têm exceções
      let allDatesExcepted = true;
      const currentDate = new Date(checkIn);

      while (currentDate < checkOut) {
        const dateStr = dateToString(currentDate);
        if (!exceptionDates.includes(dateStr)) {
          allDatesExcepted = false;
          break;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Se nem todas as datas têm exceções, está bloqueado
      if (!allDatesExcepted) {
        return true;
      }
    }

    return false;
  };

  it('should block dates within blocked period without exceptions', () => {
    const blockedPeriods = [{ startDate: '2026-06-01', endDate: '2026-06-29' }];
    const exceptions: string[] = [];

    const isBlocked = isDateBlockedWithExceptions(
      '2026-06-10',
      '2026-06-15',
      blockedPeriods,
      exceptions
    );

    expect(isBlocked).toBe(true);
  });

  it('should not block dates outside blocked period', () => {
    const blockedPeriods = [{ startDate: '2026-06-01', endDate: '2026-06-29' }];
    const exceptions: string[] = [];

    const isBlocked = isDateBlockedWithExceptions(
      '2026-07-10',
      '2026-07-15',
      blockedPeriods,
      exceptions
    );

    expect(isBlocked).toBe(false);
  });

  it('should block dates when some dates do not have exceptions', () => {
    const blockedPeriods = [{ startDate: '2026-06-01', endDate: '2026-06-29' }];
    const exceptions = ['2026-06-10', '2026-06-11'];
    // 2026-06-12 não tem exceção

    const isBlocked = isDateBlockedWithExceptions(
      '2026-06-10',
      '2026-06-12',
      blockedPeriods,
      exceptions
    );

    expect(isBlocked).toBe(true);
  });

  it('should handle multiple blocked periods', () => {
    const blockedPeriods = [
      { startDate: '2026-06-01', endDate: '2026-06-15' },
      { startDate: '2026-06-20', endDate: '2026-06-29' },
    ];
    const exceptions: string[] = [];

    // Dentro do primeiro período
    expect(
      isDateBlockedWithExceptions('2026-06-10', '2026-06-12', blockedPeriods, exceptions)
    ).toBe(true);

    // Na lacuna entre períodos
    expect(
      isDateBlockedWithExceptions('2026-06-16', '2026-06-19', blockedPeriods, exceptions)
    ).toBe(false);

    // Dentro do segundo período
    expect(
      isDateBlockedWithExceptions('2026-06-25', '2026-06-28', blockedPeriods, exceptions)
    ).toBe(true);
  });

  it('should handle edge case: check-in equals period start', () => {
    const blockedPeriods = [{ startDate: '2026-06-01', endDate: '2026-06-29' }];
    const exceptions: string[] = [];

    const isBlocked = isDateBlockedWithExceptions(
      '2026-06-01',
      '2026-06-05',
      blockedPeriods,
      exceptions
    );

    expect(isBlocked).toBe(true);
  });

  it('should handle edge case: check-out equals period end', () => {
    const blockedPeriods = [{ startDate: '2026-06-01', endDate: '2026-06-29' }];
    const exceptions: string[] = [];

    const isBlocked = isDateBlockedWithExceptions(
      '2026-06-25',
      '2026-06-29',
      blockedPeriods,
      exceptions
    );

    expect(isBlocked).toBe(true);
  });
});
