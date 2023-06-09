export function parseDomain(str: string) {
  try {
    const url = new URL(str)
    return url.host
  } catch {
    return str
  }
}
