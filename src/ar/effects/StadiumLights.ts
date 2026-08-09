import * as THREE from 'three'
import { lerp } from '@/ar/effects/easing'

/**
 * Match-night floodlights attached to the stadium root.
 */
export class StadiumLights {
  readonly group = new THREE.Group()
  private readonly spots: THREE.SpotLight[] = []
  private readonly bulbs: THREE.PointLight[] = []
  private readonly wash: THREE.HemisphereLight
  private intensity = 0
  private target = 0

  constructor() {
    this.group.name = 'StadiumLights'

    const corners: Array<[number, number, number]> = [
      [0.55, 0.62, 0.38],
      [-0.55, 0.62, 0.38],
      [0.55, 0.62, -0.38],
      [-0.55, 0.62, -0.38],
    ]

    for (const [x, y, z] of corners) {
      const spot = new THREE.SpotLight(0xfff2d0, 0, 3.5, Math.PI / 5, 0.45, 1.2)
      spot.position.set(x, y, z)
      spot.target.position.set(0, 0.05, 0)
      this.group.add(spot)
      this.group.add(spot.target)
      this.spots.push(spot)

      const bulb = new THREE.PointLight(0xffe6a8, 0, 1.4, 2)
      bulb.position.set(x, y - 0.02, z)
      this.group.add(bulb)
      this.bulbs.push(bulb)
    }

    this.wash = new THREE.HemisphereLight(0xb8d0ff, 0x1a2a18, 0)
    this.wash.name = 'StadiumWash'
    this.group.add(this.wash)
  }

  setEnabled(on: boolean): void {
    this.target = on ? 1 : 0
  }

  setIntensity(value: number): void {
    this.intensity = value
    this.target = value
    this.apply()
  }

  update(delta: number): void {
    this.intensity = lerp(this.intensity, this.target, 1 - Math.exp(-delta * 3.5))
    this.apply()

    if (this.intensity > 0.05) {
      const flicker = 1 + Math.sin(performance.now() * 0.012) * 0.03
      for (const spot of this.spots) {
        spot.intensity = 2.4 * this.intensity * flicker
      }
    }
  }

  dispose(): void {
    this.group.removeFromParent()
  }

  private apply(): void {
    const i = this.intensity
    for (const spot of this.spots) {
      spot.intensity = 2.4 * i
    }
    for (const bulb of this.bulbs) {
      bulb.intensity = 0.9 * i
    }
    this.wash.intensity = 0.55 * i
    this.group.visible = i > 0.01
  }
}
