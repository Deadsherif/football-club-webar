import * as THREE from 'three'

const _homeWorld = new THREE.Vector3()
const _camWorld = new THREE.Vector3()
const _pulled = new THREE.Vector3()

/**
 * Select focus in AR: scale up and pull the card toward the camera.
 * Does NOT rewrite rotation — the card owns facing/flip.
 */
export class ArCardZoom {
  private amount = 0
  private target = 0

  /** How much larger the selected card grows (1 = +100%). Keep mild so HUD text stays clear. */
  focusScaleBoost = 0.08
  /** How far (world units) the card pulls toward the lens when focused. AR sets this higher. */
  focusPull = 0

  setActive(active: boolean): void {
    this.target = active ? 1 : 0
  }

  get value(): number {
    return this.amount
  }

  get isFocusing(): boolean {
    return this.amount > 0.08 || this.target > 0.5
  }

  /**
   * @param homeLocal - Frozen rest pose in parent space.
   * @param flip - kept for API compatibility; rotation is owned by the card.
   */
  apply(
    group: THREE.Object3D,
    camera: THREE.Camera | null,
    delta: number,
    baseScale: number,
    homeLocal: THREE.Vector3,
    _flip = 0,
  ): void {
    this.amount = THREE.MathUtils.damp(this.amount, this.target, 8, delta)
    if (this.amount < 0.001) return

    group.position.copy(homeLocal)

    if (camera && group.parent) {
      _homeWorld.copy(homeLocal)
      group.parent.localToWorld(_homeWorld)
      camera.getWorldPosition(_camWorld)
      _pulled.subVectors(_camWorld, _homeWorld)
      if (_pulled.lengthSq() > 1e-6) {
        _pulled.normalize().multiplyScalar(this.amount * this.focusPull)
        _pulled.add(_homeWorld)
        group.parent.worldToLocal(_pulled)
        group.position.copy(_pulled)
      }
    }

    const zoomScale = baseScale * (1 + this.amount * this.focusScaleBoost)
    group.scale.setScalar(Math.max(0.001, zoomScale))
  }
}
