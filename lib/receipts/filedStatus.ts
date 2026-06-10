import type { Prisma } from "@prisma/client";

export function isReceiptFiled(row: {
  taxSeason?: string | null;
  taxSeasonDate?: Date | null;
}): boolean {
  const season = row.taxSeason?.trim();
  return Boolean(season && row.taxSeasonDate);
}

export function filedFlag(row: {
  taxSeason?: string | null;
  taxSeasonDate?: Date | null;
}): 0 | 1 {
  return isReceiptFiled(row) ? 1 : 0;
}

/** Prisma WHERE fragment: receipt not yet filed for tax. */
export function unfiledReceiptWhere(): Prisma.SnaptaxReceiptWhereInput {
  return {
    OR: [{ taxSeason: null }, { taxSeason: "" }, { taxSeasonDate: null }],
  };
}
