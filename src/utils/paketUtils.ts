/**
 * Utility functions for package (paket) date calculations
 */

/**
 * Calculate package end date based on start date and duration in months
 * @param startDate - The start date of the package
 * @param durationMonths - Duration in months (default: 1)
 * @returns End date
 */
export function calculatePaketEndDate(startDate: Date, durationMonths: number = 1): Date {
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + durationMonths)
  return endDate
}

/**
 * Check if a package has expired
 * @param endDate - The end date of the package
 * @returns true if expired, false otherwise
 */
export function isPaketExpired(endDate: Date | null): boolean {
  if (!endDate) return false
  return new Date() > endDate
}

/**
 * Check if a package is expiring soon
 * @param endDate - The end date of the package
 * @param daysThreshold - Number of days threshold (default: 7)
 * @returns true if expiring within threshold, false otherwise
 */
export function isPaketExpiringSoon(endDate: Date | null, daysThreshold: number = 7): boolean {
  if (!endDate) return false
  const daysUntilExpiry = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0
}

/**
 * Get days remaining until package expiry
 * @param endDate - The end date of the package
 * @returns Number of days remaining (negative if expired)
 */
export function getDaysRemaining(endDate: Date | null): number | null {
  if (!endDate) return null
  return Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

/**
 * Format package period for display
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted string like "22 Jan 2026 - 22 Feb 2026"
 */
export function formatPaketPeriod(startDate: Date | null, endDate: Date | null): string {
  if (!startDate || !endDate) return 'N/A'

  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
  const start = startDate.toLocaleDateString('id-ID', options)
  const end = endDate.toLocaleDateString('id-ID', options)

  return `${start} - ${end}`
}
