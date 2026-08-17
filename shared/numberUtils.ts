/**
 * Converte um valor de formulário para inteiro sem retornar NaN.
 * Campos vazios ou inválidos usam o fallback informado.
 */
export function parseIntegerOrFallback(value: unknown, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : fallback;
  }

  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Alias semântico para campos de desconto opcionais.
 */
export function parseOptionalDiscount(value: unknown): number {
  return parseIntegerOrFallback(value, 0);
}

export default parseIntegerOrFallback;
