import { describe, it, expect } from 'vitest';

describe('Booking with Blocking Exceptions Integration', () => {
  // Função para normalizar datas (sem timezone)
  const normalizeDate = (dateStr: string | Date): Date => {
    if (typeof dateStr === 'string') {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
    const d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  };

  // Simular a lógica de verificação de bloqueio com exceções
  const isDateBlockedWithExceptions = (
    checkInStr: string,
    checkOutStr: string,
    blockedDates: Array<{ id: number; startDate: Date; endDate: Date }>,
    allExceptions: Array<{ exceptionDate: Date; blockedDateId: number }>
  ): boolean => {
    const checkIn = normalizeDate(checkInStr);
    const checkOut = normalizeDate(checkOutStr);

    // Verificar cada período bloqueado
    for (const blocked of blockedDates) {
      const blockedStart = normalizeDate(blocked.startDate);
      const blockedEnd = normalizeDate(blocked.endDate);

      // Verificar se há conflito de datas
      if (!(checkIn < blockedEnd && checkOut > blockedStart)) {
        continue; // Sem conflito neste período
      }

      // Há conflito - verificar se há exceções que desbloqueiam
      let allDatesHaveExceptions = true;
      const currentDate = new Date(checkIn);

      while (currentDate < checkOut) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const hasException = allExceptions.some(ex => {
          const exceptionDate = new Date(ex.exceptionDate).toISOString().split('T')[0];
          return exceptionDate === dateStr && ex.blockedDateId === blocked.id;
        });

        if (!hasException) {
          allDatesHaveExceptions = false;
          break; // Encontrou uma data sem exceção
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Se nem todas as datas têm exceções, está bloqueado
      if (!allDatesHaveExceptions) {
        return true;
      }
    }

    return false; // Nenhum período bloqueado ou todas as datas têm exceções
  };

  it('should block booking when dates conflict with blocked period', () => {
    const blockedDates = [
      {
        id: 1,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-30'),
      },
    ];
    const exceptions: Array<{ exceptionDate: Date; blockedDateId: number }> = [];

    const isBlocked = isDateBlockedWithExceptions(
      '2026-06-10',
      '2026-06-15',
      blockedDates,
      exceptions
    );

    expect(isBlocked).toBe(true);
  });

  it('should allow booking when dates are outside blocked period', () => {
    const blockedDates = [
      {
        id: 1,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-30'),
      },
    ];
    const exceptions: Array<{ exceptionDate: Date; blockedDateId: number }> = [];

    const isBlocked = isDateBlockedWithExceptions(
      '2026-07-10',
      '2026-07-15',
      blockedDates,
      exceptions
    );

    expect(isBlocked).toBe(false);
  });

  it('should allow booking when all dates have exceptions', () => {
    const blockedDates = [
      {
        id: 1,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-30'),
      },
    ];
    const exceptions = [
      { exceptionDate: new Date('2026-06-10'), blockedDateId: 1 },
      { exceptionDate: new Date('2026-06-11'), blockedDateId: 1 },
    ];

    const isBlocked = isDateBlockedWithExceptions(
      '2026-06-10',
      '2026-06-12',
      blockedDates,
      exceptions
    );

    expect(isBlocked).toBe(false);
  });

  it('should block booking when some dates do not have exceptions', () => {
    const blockedDates = [
      {
        id: 1,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-30'),
      },
    ];
    const exceptions = [
      { exceptionDate: new Date('2026-06-10'), blockedDateId: 1 },
      // 2026-06-11 não tem exceção
    ];

    const isBlocked = isDateBlockedWithExceptions(
      '2026-06-10',
      '2026-06-12',
      blockedDates,
      exceptions
    );

    expect(isBlocked).toBe(true);
  });

  it('should handle multiple blocked periods with exceptions', () => {
    const blockedDates = [
      {
        id: 1,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
      },
      {
        id: 2,
        startDate: new Date('2026-06-20'),
        endDate: new Date('2026-06-30'),
      },
    ];
    const exceptions = [
      { exceptionDate: new Date('2026-06-10'), blockedDateId: 1 },
      { exceptionDate: new Date('2026-06-11'), blockedDateId: 1 },
    ];

    // Booking dentro do primeiro período com exceções parciais
    expect(
      isDateBlockedWithExceptions('2026-06-10', '2026-06-13', blockedDates, exceptions)
    ).toBe(true); // 2026-06-12 não tem exceção

    // Booking na lacuna entre períodos
    expect(
      isDateBlockedWithExceptions('2026-06-16', '2026-06-19', blockedDates, exceptions)
    ).toBe(false);

    // Booking dentro do segundo período
    expect(
      isDateBlockedWithExceptions('2026-06-25', '2026-06-28', blockedDates, exceptions)
    ).toBe(true);
  });

  it('should correctly handle exception dates that fully cover booking period', () => {
    const blockedDates = [
      {
        id: 1,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-30'),
      },
    ];
    const exceptions = [
      { exceptionDate: new Date('2026-06-15'), blockedDateId: 1 },
      { exceptionDate: new Date('2026-06-16'), blockedDateId: 1 },
      { exceptionDate: new Date('2026-06-17'), blockedDateId: 1 },
      { exceptionDate: new Date('2026-06-18'), blockedDateId: 1 },
    ];

    // Booking que corresponde exatamente aos dias com exceções
    const isBlocked = isDateBlockedWithExceptions(
      '2026-06-15',
      '2026-06-19',
      blockedDates,
      exceptions
    );

    expect(isBlocked).toBe(false);
  });
});
