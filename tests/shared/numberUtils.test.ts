import { describe, expect, it } from "vitest";
import { parseIntegerOrFallback, parseOptionalDiscount } from "../../shared/numberUtils";

describe("numberUtils", () => {
  describe("parseOptionalDiscount", () => {
    it("converte strings numéricas em inteiros", () => {
      expect(parseOptionalDiscount("8")).toBe(8);
      expect(parseOptionalDiscount("16.5")).toBe(16);
    });

    it("converte campo vazio em zero em vez de NaN", () => {
      expect(parseOptionalDiscount("")).toBe(0);
      expect(parseOptionalDiscount("   ")).toBe(0);
      expect(Number.isNaN(parseOptionalDiscount(""))).toBe(false);
    });

    it("converte valores inválidos em zero", () => {
      expect(parseOptionalDiscount(undefined)).toBe(0);
      expect(parseOptionalDiscount(null)).toBe(0);
      expect(parseOptionalDiscount("abc")).toBe(0);
    });
  });

  describe("parseIntegerOrFallback", () => {
    it("usa o fallback para valores inválidos", () => {
      expect(parseIntegerOrFallback("", 1)).toBe(1);
      expect(parseIntegerOrFallback("abc", 1)).toBe(1);
      expect(parseIntegerOrFallback(NaN, 1)).toBe(1);
    });
  });
});
