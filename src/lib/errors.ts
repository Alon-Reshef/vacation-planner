export function formatUnknownError(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const err = e as { message?: string; code?: string; details?: string; hint?: string }
    return [err.message, err.code, err.details, err.hint].filter(Boolean).join(' — ')
  }
  return fallback
}
