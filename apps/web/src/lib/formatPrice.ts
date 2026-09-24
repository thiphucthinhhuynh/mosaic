// Display-only formatting for the API's decimal-string prices ("24.99",
// "150"). The currency is fixed to USD because the data model has no
// currency field; if multi-currency ever arrives it belongs on Item, not here.
const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatPrice(price: string): string {
  return formatter.format(Number(price));
}
