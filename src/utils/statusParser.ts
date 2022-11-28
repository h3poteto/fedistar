export function findLink(target: HTMLElement | null, parentClassName: string): string | null {
  if (!target) {
    return null
  }
  if (target.localName === 'a') {
    return (target as HTMLLinkElement).href
  }
  if (target.parentNode === undefined || target.parentNode === null) {
    return null
  }
  const parent = target.parentNode as HTMLElement
  if (parent.getAttribute('class') === parentClassName) {
    return null
  }
  return findLink(parent, parentClassName)
}
