export function localized<T extends Record<string, any>>(
  item: T | null | undefined,
  field: string,
  currentLang: 'en' | 'ar'
): string {
  if (!item) return '';
  const ar = item[`${field}Ar`] as string | undefined;
  const en = item[`${field}En`] as string | undefined;
  if (currentLang === 'ar') return (ar ?? en ?? '') as string;
  return (en ?? ar ?? '') as string;
}
