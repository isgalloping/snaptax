export type FaqItem = {
  readonly question: string;
  readonly answer: string;
};

export type FaqCategory = {
  readonly name: string;
  readonly items: readonly FaqItem[];
};

export function flattenFaqItems(
  categories: readonly FaqCategory[],
): FaqItem[] {
  return categories.flatMap((category) => [...category.items]);
}
