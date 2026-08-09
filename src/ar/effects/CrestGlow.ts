import * as THREE from 'three'
import { lerp } from '@/ar/effects/easing'

/**
 * Soft crest aura: disc bloom + dual rings that intensify on detection.
 */
export class CrestGlow {
  readonly group = new THREE.Group()

  private readonly disc: THREE.Mesh
  private readonly innerRing: THREE.Mesh
  private readonly outerRing: THREE.Mesh
  private intensity = 0
  private targetIntensity = 0

  constructor() {
    this.group.name = 'CrestGlow'

    this.disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 48),
      new THREE.MeshBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    this.disc.rotation.x = -Math.PI / 2
    this.disc.position.y = 0.008

    this.innerRing = this.makeRing(0.28, 0.36, 0xd4af37)
    this.outerRing = this.makeRing(0.4, 0.52, 0xe30613)
    this.outerRing.position.y = 0.012

    this.group.add(this.disc, this.innerRing, this.outerRing)
  }

  setActive(active: boolean): void {
    this.targetIntensity = active ? 1 : 0
  }

  /** 0–1 scripted boost during the opening beat. */
  setScriptedIntensity(value: number): void {
    this.intensity = value
    this.targetIntensity = value
    this.apply()
  }

  update(delta: number): void {
    this.intensity = lerp(this.intensity, this.targetIntensity, 1 - Math.exp(-delta * 5))
    this.apply()

    const t = performance.now() * 0.001
    const pulse = 1 + Math.sin(t * 3.2) * 0.06 * this.intensity
    this.innerRing.scale.setScalar(pulse)
    this.outerRing.scale.setScalar(1.05 + Math.sin(t * 2.1 + 1) * 0.08 * this.intensity)
    this.outerRing.rotation.z += delta * 0.35 * this.intensity
    this.innerRing.rotation.z -= delta * 0.55 * this.intensity
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        ;(obj.material as THREE.Material).dispose()
      }
    })
    this.group.removeFromParent()
  }

  private apply(): void {
    const i = this.intensity
    ;(this.disc.material as THREE.MeshBasicMaterial).opacity = 0.22 * i
    ;(this.innerRing.material as THREE.MeshBasicMaterial).opacity = 0.55 * i
    ;(this.outerRing.material as THREE.MeshBasicMaterial).opacity = 0.4 * i
    this.group.visible = i > 0.01
  }

  private makeRing(inner: number, outer: number, color: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 64),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = 0.01
    return mesh
  }
}
