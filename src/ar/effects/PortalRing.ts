import * as THREE from 'three'
import { easeOutCubic, lerp } from '@/ar/effects/easing'

/**
 * Circular energy portal that opens above the crest.
 */
export class PortalRing {
  readonly group = new THREE.Group()

  private readonly rim: THREE.Mesh
  private readonly energy: THREE.Mesh
  private readonly vortex: THREE.Mesh
  private readonly voidDisc: THREE.Mesh
  private openAmount = 0

  constructor() {
    this.group.name = 'PortalRing'
    this.group.visible = false

    this.voidDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.38, 64),
      new THREE.MeshBasicMaterial({
        color: 0x020805,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    this.voidDisc.rotation.x = -Math.PI / 2
    this.voidDisc.position.y = 0.03

    this.rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.028, 12, 64),
      new THREE.MeshBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity: 0,
      }),
    )
    this.rim.rotation.x = Math.PI / 2
    this.rim.position.y = 0.035

    this.energy = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.37, 64),
      new THREE.MeshBasicMaterial({
        color: 0xe30613,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    )
    this.energy.rotation.x = -Math.PI / 2
    this.energy.position.y = 0.04

    this.vortex = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.26, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    )
    this.vortex.rotation.x = -Math.PI / 2
    this.vortex.position.y = 0.045

    this.group.add(this.voidDisc, this.energy, this.vortex, this.rim)
    this.group.scale.setScalar(0.15)
  }

  /** openAmount 0–1 driven by cinematic timeline. */
  setOpen(amount: number): void {
    this.openAmount = amount
    this.group.visible = amount > 0.01

    const eased = easeOutCubic(amount)
    this.group.scale.setScalar(lerp(0.15, 1, eased))

    ;(this.rim.material as THREE.MeshBasicMaterial).opacity = 0.95 * eased
    ;(this.energy.material as THREE.MeshBasicMaterial).opacity = 0.55 * eased
    ;(this.vortex.material as THREE.MeshBasicMaterial).opacity = 0.35 * eased
    ;(this.voidDisc.material as THREE.MeshBasicMaterial).opacity = 0.85 * eased
  }

  update(delta: number): void {
    if (this.openAmount <= 0.01) return
    this.rim.rotation.z += delta * 1.2
    this.energy.rotation.z -= delta * 0.8
    this.vortex.rotation.z += delta * 2.4
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
}
