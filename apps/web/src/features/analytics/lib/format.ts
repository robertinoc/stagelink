// Formatters for the analytics redesign — locale-aware where it matters.

export function formatNumber(value: number, locale = 'es'): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-AR' : 'en-US').format(value);
}

export function formatPercent(value: number, fractionDigits = 1, locale = 'es'): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-AR' : 'en-US', {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value / 100);
}

export function formatShortDate(iso: string, locale = 'es'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : 'en-US', {
    day: '2-digit',
    month: 'short',
  })
    .format(d)
    .replace('.', '');
}

export function formatFullDateTime(iso: string, locale = 'es'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
