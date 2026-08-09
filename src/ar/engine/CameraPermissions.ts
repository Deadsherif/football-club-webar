import type { CameraErrorKind, CameraPermissionResult } from '@/types/ar'

/**
 * Camera access helpers for mobile Safari / Chrome.
 * MindAR also requests the stream; we probe first for clearer UX errors.
 */
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

  let stream: MediaStream | null = null

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: classifyCameraError(err),
      message: err instanceof Error ? err.message : String(err),
    }
  } finally {
    // Release the probe stream; MindAR will open its own.
    stream?.getTracks().forEach((track) => track.stop())
  }
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
