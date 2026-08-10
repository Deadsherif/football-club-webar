import * as THREE from 'three'

const _worldPos = new THREE.Vector3()
const _camPos = new THREE.Vector3()
const _parentQuat = new THREE.Quaternion()
const _parentEuler = new THREE.Euler()

/**
 * Local Y rotation so a card's front (+Z) faces the camera on the XZ plane.
 * Flip is applied on top: yaw + flip * π.
 */
export function yawFacingCamera(
  localPos: THREE.Vector3,
  parent: THREE.Object3D | null,
  camera: THREE.Camera,
): number {
  _worldPos.copy(localPos)
  parent?.localToWorld(_worldPos)
  camera.getWorldPosition(_camPos)

  const worldYaw = Math.atan2(_camPos.x - _worldPos.x, _camPos.z - _worldPos.z)

  if (!parent) return worldYaw

  parent.getWorldQuaternion(_parentQuat)
  _parentEuler.setFromQuaternion(_parentQuat, 'YXZ')
  return worldYaw - _parentEuler.y
}
