import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function getTimeColor(timeRemaining: number, totalTime?: number): string {
  if (totalTime) {
    // When total time is provided, calculate percentage
    const percentage = (timeRemaining / totalTime) * 100;
    if (percentage > 50) return "text-green-600 dark:text-green-400";
    if (percentage > 25) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  } else {
    // Backward compatibility - use fixed thresholds
    if (timeRemaining > 600) return "text-green-600 dark:text-green-400"; // More than 10 minutes
    if (timeRemaining > 300) return "text-yellow-600 dark:text-yellow-400"; // More than 5 minutes
    return "text-red-600 dark:text-red-400"; // Less than 5 minutes
  }
}
