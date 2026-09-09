/** Leave a fixture retryable unless both participants received their reminder. */
export function reminderDelivered(homeHasEmail: boolean, awayHasEmail: boolean, results: boolean[]): boolean {
  return homeHasEmail && awayHasEmail && results.length === 2 && results.every(Boolean)
}
