import * as THREE from 'three'

/**
 * Detaches visible AR content from MindAR's raw anchor jitter.
 * Content is parented to the Three.js scene and eases toward the tracked pose.
 */
export class StabilizedAnchor {
  readonly root = new THREE.Group()
  private readonly source: THREE.Object3D
  private readonly tmpPos = new THREE.Vector3()
  private readonly tmpQuat = new THREE.Quaternion()
  private readonly tmpScale = new THREE.Vector3()
  private readonly tmpMatrix = new THREE.Matrix4()
  private tracking = false
  private settleFrames = 0
  private readonly baseAlpha: number
  private readonly settledAlpha: number

  constructor(
    sourceAnchor: THREE.Object3D,
    options?: { baseAlpha?: number; settledAlpha?: number },
  ) {
    this.source = sourceAnchor
    this.root.name = 'StabilizedAnchor'
    this.baseAlpha = options?.baseAlpha ?? 0.22
    this.settledAlpha = options?.settledAlpha ?? 0.08
  }

  setTracking(active: boolean): void {
    this.tracking = active
    if (!active) this.settleFrames = 0
  }

  /** Snap immediately to the current tracked pose (target found). */
  snap(): void {
    this.source.updateWorldMatrix(true, false)
    this.source.matrixWorld.decompose(this.tmpPos, this.tmpQuat, this.tmpScale)
    this.root.position.copy(this.tmpPos)
    this.root.quaternion.copy(this.tmpQuat)
    this.root.scale.copy(this.tmpScale)
    this.settleFrames = 0
  }

  update(): void {
    if (!this.tracking) return

    this.source.updateWorldMatrix(true, false)
    this.tmpMatrix.copy(this.source.matrixWorld)
    this.tmpMatrix.decompose(this.tmpPos, this.tmpQuat, this.tmpScale)

    this.settleFrames += 1
    const alpha =
      this.settleFrames < 18 ? this.baseAlpha : this.settledAlpha

    this.root.position.lerp(this.tmpPos, alpha)
    this.root.quaternion.slerp(this.tmpQuat, alpha)
    this.root.scale.lerp(this.tmpScale, Math.min(1, alpha * 1.4))
  }
}
