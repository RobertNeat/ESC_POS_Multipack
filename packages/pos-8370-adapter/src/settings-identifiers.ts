export function normalizeKey(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function createSlug(value: string): string {
  const slug = normalizeKey(value)
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'item';
}

export function countKeys(
  values: readonly string[],
): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = normalizeKey(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function assertUniqueIds<T extends { readonly id: string }>(
  values: readonly T[],
  kind: string,
): void {
  const identifiers = new Set<string>();
  for (const value of values) {
    const key = normalizeKey(value.id);
    if (identifiers.has(key)) {
      throw new Error(`Duplicate POS-8370 ${kind} id: "${value.id}".`);
    }
    identifiers.add(key);
  }
}
