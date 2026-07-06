/**
 * Helper para converter datas YYYY-MM-DD sem timezone shift
 * Evita o problema de new Date('2026-07-05') ser interpretado como UTC
 */

export const parseYmdToLocalDate = (ymd: string): Date => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

export const formatYmdToPtBr = (ymd: string): string => {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
};

export const formatDateToPtBr = (date: Date | string): string => {
  if (typeof date === 'string') {
    return formatYmdToPtBr(date);
  }
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
};
