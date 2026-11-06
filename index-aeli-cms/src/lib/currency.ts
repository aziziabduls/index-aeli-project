/**
 * Standard Indonesian Rupiah (IDR) Currency Formatter.
 * Sesuai dengan skema format baku Rupiah di Indonesia:
 * - Titik (.) sebagai pemisah ribuan (thousand separator)
 * - Koma (,) sebagai pemisah desimal (decimal separator)
 *
 * Contoh penggunaan:
 *   formatIDR(14000000)        => "Rp 14.000.000"
 *   formatIDR(7500000.75, true) => "Rp 7.500.000,75"
 */
export function formatIDR(
  amount: number | string | null | undefined,
  withDecimals = false
): string {
  if (amount === null || amount === undefined || amount === "") return "Rp 0";
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return "Rp 0";

  if (withDecimals) {
    const formatted = new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
    return `Rp ${formatted}`;
  }

  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.round(num));

  return `Rp ${formatted}`;
}

