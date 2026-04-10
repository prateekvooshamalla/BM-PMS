export function inr(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export function titleize(input: string) {
  return input.replace(/_/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase());
}
