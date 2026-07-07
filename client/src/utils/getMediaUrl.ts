const API_BASE = import.meta.env.VITE_API_URL || '';

export function getMediaUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = API_BASE.replace('/api', '');
  return `${base}${path}`;
}
