import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 좌표를 지정된 소수점 자리수로 반올림
 * @param value - 반올림할 숫자
 * @param decimals - 소수점 자리수 (기본값: 2)
 * @returns 반올림된 값
 */
export function roundCoordinate(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals)
  return Math.round(value * multiplier) / multiplier
}


