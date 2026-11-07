export function reportFilename(disposition: string | null, fallback: string): string {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  let name = disposition?.match(/filename="([^"]*)"|filename=([^;]+)/i)?.slice(1).find(Boolean)?.trim();
  if (encoded) { try { name = decodeURIComponent(encoded); } catch { name = undefined; } }
  const safe = name?.replace(/[\\/:*?"<>|\x00-\x1f\x7f]/g, '_').replace(/^\.+/, '').slice(0, 180);
  return safe && /\.json$/i.test(safe) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])\./i.test(safe) ? safe : fallback;
}
