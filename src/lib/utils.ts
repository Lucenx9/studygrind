import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatRelativeDate(date: Date, language: 'it' | 'en'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return language === 'it' ? 'Oggi' : 'Today';
  if (diffDays === 1) return language === 'it' ? 'Ieri' : 'Yesterday';
  if (diffDays < 7) return language === 'it' ? `${diffDays} giorni fa` : `${diffDays} days ago`;
  return date.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', { day: 'numeric', month: 'short' });
}
