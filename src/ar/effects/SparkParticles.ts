import * as THREE from 'three'

const PARTICLE_COUNT = 96

/**
 * Mobile-friendly spark burst rising from the crest into the portal.
 */
export class SparkParticles {
  readonly points: THREE.Points
  private readonly velocities: Float32Array
  private readonly lifetimes: Float32Array
  private readonly ages: Float32Array
  private active = false
  private emitTimer = 0

  constructor() {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    this.velocities = new Float32Array(PARTICLE_COUNT * 3)
    this.lifetimes = new Float32Array(PARTICLE_COUNT)
    this.ages = new Float32Array(PARTICLE_COUNT)

    const gold = new THREE.Color(0xd4af37)
    const lime = new THREE.Color(0xe30613)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.ages[i] = 999
      this.lifetimes[i] = 1
      const c = gold.clone().lerp(lime, Math.random())
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    this.points = new THREE.Points(geometry, material)
    this.points.name = 'SparkParticles'
    this.points.frustumCulled = false
    this.points.visible = false
  }

  burst(): void {
    this.active = true
    this.points.visible = true
    this.emitTimer = 1.4
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.respawn(i, true)
    }
  }

  stop(): void {
    this.active = false
    this.emitTimer = 0
    this.points.visible = false
  }

  update(delta: number): void {
    if (!this.active) return

    this.emitTimer = Math.max(0, this.emitTimer - delta)
    const positions = this.points.geometry.getAttribute('position') as THREE.BufferAttribute

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.ages[i] += delta
      if (this.ages[i] >= this.lifetimes[i]) {
        if (this.emitTimer > 0) {
          this.respawn(i, false)
        } else {
          positions.setY(i, -10)
          continue
        }
      }

      const ix = i * 3
      positions.array[ix] += this.velocities[ix] * delta
      positions.array[ix + 1] += this.velocities[ix + 1] * delta
      positions.array[ix + 2] += this.velocities[ix + 2] * delta
      this.velocities[ix + 1] += delta * 0.15
    }

    positions.needsUpdate = true

    const mat = this.points.material as THREE.PointsMaterial
    mat.opacity = this.emitTimer > 0 ? 0.95 : Math.max(0, mat.opacity - delta * 0.8)
    if (mat.opacity <= 0.02 && this.emitTimer <= 0) {
      this.stop()
    }
  }

  dispose(): void {
    this.points.geometry.dispose()
    ;(this.points.material as THREE.Material).dispose()
    this.points.removeFromParent()
  }

  private respawn(i: number, explosive: boolean): void {
    const positions = this.points.geometry.getAttribute('position') as THREE.BufferAttribute
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * 0.18
    positions.setXYZ(
      i,
      Math.cos(angle) * radius,
      0.02 + Math.random() * 0.04,
      Math.sin(angle) * radius,
    )

    const speed = explosive ? 0.55 + Math.random() * 0.55 : 0.2 + Math.random() * 0.35
    this.velocities[i * 3] = Math.cos(angle) * speed * 0.35
    this.velocities[i * 3 + 1] = 0.35 + Math.random() * 0.75
    this.velocities[i * 3 + 2] = Math.sin(angle) * speed * 0.35
    this.lifetimes[i] = 0.7 + Math.random() * 1.1
    this.ages[i] = 0
  }
}
