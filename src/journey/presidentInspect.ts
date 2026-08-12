/** Bridge so journey chrome can flip the active presidents card. */
let flipHandler: (() => void) | null = null

export function registerPresidentFlip(handler: (() => void) | null): void {
  flipHandler = handler
}

export function flipPresidentCard(): void {
  flipHandler?.()
}
