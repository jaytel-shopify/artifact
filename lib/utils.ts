import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export function formatTimeAgo(
  dateString: string,
  { short = false }: { short?: boolean } = {}
): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return short ? "now" : "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return short
      ? `${minutes}m`
      : minutes === 1
        ? "1 minute ago"
        : `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return short
      ? `${hours}h`
      : hours === 1
        ? "1 hour ago"
        : `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return short ? "1d" : "yesterday";
  if (days < 7) return short ? `${days}d` : `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4)
    return short
      ? `${weeks}w`
      : weeks === 1
        ? "1 week ago"
        : `${weeks} weeks ago`;

  const months = Math.floor(days / 30);
  if (months < 12)
    return short
      ? `${months}m`
      : months === 1
        ? "1 month ago"
        : `${months} months ago`;

  const years = Math.floor(days / 365);
  return short
    ? `${years}y`
    : years === 1
      ? "1 year ago"
      : `${years} years ago`;
}
