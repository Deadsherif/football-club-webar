declare module 'mind-ar/dist/mindar-image-three.prod.js' {
  import type {
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    Group,
  } from 'three'

  export interface MindARThreeAnchor {
    group: Group
    targetIndex: number
    onTargetFound?: () => void
    onTargetLost?: () => void
  }

  export interface MindARThreeOptions {
    container: HTMLElement
    imageTargetSrc: string
    maxTrack?: number
    uiLoading?: string | boolean
    uiScanning?: string | boolean
    uiError?: string | boolean
    filterMinCF?: number
    filterBeta?: number
    warmupTolerance?: number
    missTolerance?: number
  }

  export class MindARThree {
    renderer: WebGLRenderer
    scene: Scene
    camera: PerspectiveCamera

    constructor(options: MindARThreeOptions)
    start(): Promise<void>
    stop(): void
    switchCamera(): void
    addAnchor(targetIndex: number): MindARThreeAnchor
  }
}
