/** Copy text to the clipboard with a fallback for blocked Clipboard API. */
export async function copyText(payload: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(payload)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = payload
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}
