/** Shared INR + label formatting helpers used across every Wall. */
export const inr = (value: unknown) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

/** "needs_information" -> "Needs Information" */
export const formatLabel = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
