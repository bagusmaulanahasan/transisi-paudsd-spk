export function formatAngka(nilai, digit = 4) {
  if (nilai === null || nilai === undefined || !Number.isFinite(Number(nilai))) {
    return '—';
  }

  return Number(nilai).toLocaleString('id-ID', {
    minimumFractionDigits: digit,
    maximumFractionDigits: digit
  });
}
