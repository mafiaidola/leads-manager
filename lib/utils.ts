/**
 * @module lib/utils
 * @description Utility re-export — `cn()` merges Tailwind CSS class names
 * using clsx + tailwind-merge for conflict-free conditional classes.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
