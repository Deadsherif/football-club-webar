import { detectDeviceCapability } from '@/utils/deviceCapability'

export function toMobileModelSrc(src: string): string {
  if (!src || src.endsWith('.mobile.glb')) return src
  return src.replace(/\.glb$/i, '.mobile.glb')
}

/** Desktop keeps full GLBs. Phones use pre-baked *.mobile.glb copies. */
export function resolveModelSrc(src: string): string {
  if (!src.toLowerCase().includes('.glb')) return src
  if (!detectDeviceCapability().isMobile) return src
  return toMobileModelSrc(src)
}
