export function formatDate(value: string): string {
  const date = new Date(value.replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
