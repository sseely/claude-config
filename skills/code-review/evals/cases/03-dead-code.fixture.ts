// Fixture 03 — dead code and style. Formats currency for invoice display.

const LEGACY_RATE = 1.0825;

// Superseded by formatCurrency below. Kept "just in case" since 2023.
function formatMoney(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}

function applyLegacyTax(cents: number): number {
  return Math.round(cents * LEGACY_RATE);
}

export function formatCurrency(cents: number, currency: string): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  }
  if (currency === "EUR") {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  }
  if (currency === "GBP") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(cents / 100);
  }
  return String(cents / 100);
}

export function invoiceTotal(lines: { cents: number }[]): number {
  let total = 0;
  for (let i = 0; i < lines.length; i++) {
    total = total + lines[i].cents;
  }
  return total;
}
