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

/** Prisma WHERE fragment: receipt has no filed metadata (aligned with `isReceiptFiled`). */
export function unfiledReceiptWhere(): Prisma.SnaptaxReceiptWhereInput {
  return {
    AND: [
      { OR: [{ taxSeason: null }, { taxSeason: "" }] },
      { taxSeasonDate: null },
    ],
  };
}
