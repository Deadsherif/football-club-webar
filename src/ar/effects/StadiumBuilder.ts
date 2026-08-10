import * as THREE from 'three'
import { preserveSourceTextures } from '@/ar/effects/studioEnvironment'

/**
 * Stylized night-match stadium built from lightweight primitives.
 * Used when a custom stadium.glb is missing — still looks intentional on mobile.
 */
export function buildProceduralStadium(): THREE.Group {
  const root = new THREE.Group()
  root.name = 'ProceduralStadium'

  // Pitch
  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.72),
    new THREE.MeshStandardMaterial({
      color: 0x1a6b32,
      roughness: 0.85,
      metalness: 0.05,
    }),
  )
  pitch.rotation.x = -Math.PI / 2
  pitch.position.y = 0.01
  root.add(pitch)

  // Center circle + halfway line (markings)
  const markings = new THREE.Group()
  markings.name = 'PitchMarkings'
  const lineMat = new THREE.MeshBasicMaterial({
    color: 0xf2f5f0,
    transparent: true,
    opacity: 0.85,
  })
  const halfway = new THREE.Mesh(new THREE.PlaneGeometry(0.015, 0.72), lineMat)
  halfway.rotation.x = -Math.PI / 2
  halfway.position.y = 0.012
  const circle = new THREE.Mesh(
    new THREE.RingGeometry(0.09, 0.105, 48),
    lineMat.clone(),
  )
  circle.rotation.x = -Math.PI / 2
  circle.position.y = 0.012
  markings.add(halfway, circle)
  root.add(markings)

  // Bowl stands — four trapezoid banks
  const standMat = new THREE.MeshStandardMaterial({
    color: 0x1a1f2a,
    roughness: 0.7,
    metalness: 0.15,
  })
  const seatMat = new THREE.MeshStandardMaterial({
    color: 0xb01018,
    roughness: 0.6,
    metalness: 0.05,
  })

  addStand(root, standMat, seatMat, 0, 0.42, 1.15, 0.22, 0.28, 0)
  addStand(root, standMat, seatMat, 0, -0.42, 1.15, 0.22, 0.28, Math.PI)
  addStand(root, standMat, seatMat, 0.62, 0, 0.22, 0.85, 0.28, Math.PI / 2)
  addStand(root, standMat, seatMat, -0.62, 0, 0.22, 0.85, 0.28, -Math.PI / 2)

  // Roof rim
  const roof = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.04, 8, 48),
    new THREE.MeshStandardMaterial({
      color: 0x10141c,
      metalness: 0.4,
      roughness: 0.45,
    }),
  )
  roof.rotation.x = Math.PI / 2
  roof.position.y = 0.34
  root.add(roof)

  // Floodlight towers
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0xc9ced6,
    metalness: 0.55,
    roughness: 0.35,
  })
  const corners: Array<[number, number]> = [
    [0.72, 0.5],
    [-0.72, 0.5],
    [0.72, -0.5],
    [-0.72, -0.5],
  ]
  for (const [x, z] of corners) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.55, 6), towerMat)
    pole.position.set(x, 0.28, z)
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.04, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xf0f3f7, emissive: 0xe30613, emissiveIntensity: 0.2 }),
    )
    head.position.set(x, 0.56, z)
    head.lookAt(0, 0.2, 0)
    root.add(pole, head)
  }

  // Goals
  const goalMat = new THREE.MeshBasicMaterial({ color: 0xf5f7fa })
  for (const z of [0.34, -0.34]) {
    const goal = new THREE.Group()
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), goalMat)
    const postR = postL.clone()
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.02), goalMat)
    postL.position.set(-0.13, 0.07, 0)
    postR.position.set(0.13, 0.07, 0)
    cross.position.set(0, 0.13, 0)
    goal.add(postL, postR, cross)
    goal.position.z = z
    root.add(goal)
  }

  // Normalize to sit nicely above a ~1-unit image target
  root.scale.setScalar(0.72)
  return root
}

function addStand(
  parent: THREE.Group,
  structure: THREE.Material,
  seats: THREE.Material,
  x: number,
  z: number,
  width: number,
  depth: number,
  height: number,
  rotY: number,
): void {
  const stand = new THREE.Group()
  const base = new THREE.Mesh(new THREE.BoxGeometry(width, height * 0.55, depth), structure)
  base.position.y = height * 0.28
  const seating = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.92, height * 0.22, depth * 0.7),
    seats,
  )
  seating.position.set(0, height * 0.55, -depth * 0.05)
  stand.add(base, seating)
  stand.position.set(x, 0, z)
  stand.rotation.y = rotY
  parent.add(stand)
}

/**
 * Fit an imported stadium GLB into the portal footprint.
 * Textures and PBR factors stay as authored in the source file.
 */
export function prepareStadiumModel(model: THREE.Object3D, targetWidth = 1.05): void {
  const box = new THREE.Box3().setFromObject(model)
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const scale = targetWidth / maxDim
  model.scale.setScalar(scale)

  box.setFromObject(model)
  const center = new THREE.Vector3()
  box.getCenter(center)
  model.position.sub(center)
  model.position.y -= box.min.y

  preserveSourceTextures(model)
}
