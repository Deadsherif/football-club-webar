/**
 * Soft permission check — does NOT open the camera.
 * Opening then stopping a probe stream often leaves the LED on
 * and can race MindAR's own getUserMedia.
 */
export type CameraErrorKind = 'denied' | 'unavailable' | 'insecure' | 'unknown'

export type CameraPermissionResult =
  | { ok: true }
  | { ok: false; error: CameraErrorKind; message: string }

export async function requestCameraPermission(): Promise<CameraPermissionResult> {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'unavailable', message: 'No window' }
  }

  if (!window.isSecureContext) {
    return {
      ok: false,
      error: 'insecure',
      message: 'Secure context (HTTPS) required for camera access.',
    }
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      error: 'unavailable',
      message: 'getUserMedia is not supported in this browser.',
    }
  }

  // Permissions API when available (Chrome). Safari often lacks camera permission query.
  try {
    const permissions = navigator.permissions
    if (permissions?.query) {
      const status = await permissions.query({
        name: 'camera' as PermissionName,
      })
      if (status.state === 'denied') {
        return {
          ok: false,
          error: 'denied',
          message: 'Camera permission is denied.',
        }
      }
    }
  } catch {
    // Unsupported permission name — MindAR will request on start.
  }

  return { ok: true }
}

function classifyCameraError(err: unknown): CameraErrorKind {
  if (!(err instanceof DOMException) && !(err instanceof Error)) {
    return 'unknown'
  }

  const name = err.name

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'denied'
  }
  if (
    name === 'NotFoundError' ||
    name === 'DevicesNotFoundError' ||
    name === 'NotReadableError' ||
    name === 'TrackStartError' ||
    name === 'OverconstrainedError'
  ) {
    return 'unavailable'
  }
  if (name === 'SecurityError') {
    return 'insecure'
  }

  return 'unknown'
}

export function classifyMindARCameraError(err: unknown): CameraErrorKind {
  return classifyCameraError(err)
}
