import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatQty(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "0";
  const num = Number(value);
  return isNaN(num) ? "0" : new Intl.NumberFormat("en-US").format(num);
}

export function formatSku(sku: string): string {
  return sku.toUpperCase();
}
