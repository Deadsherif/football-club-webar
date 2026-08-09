/** English MVP copy. Swap locale via i18n/index.ts for Arabic later. */
export const en = {
  brand: 'AL AHLY',
  brandTagline: 'MORE THAN A CLUB',
  landingSubtitle: 'Point your camera at the Al Ahly crest to begin.',
  startExperience: 'SCAN CREST',
  immersiveHint: 'The experience starts when the logo is detected',

  journeyTitle: 'YOUR JOURNEY STARTS HERE',
  journeyHint: 'Point your camera at the Al Ahly crest.',
  openCamera: 'OPEN CAMERA',
  back: 'BACK',

  preparing: 'Preparing experience…',
  loadingAssets: 'Loading experience',
  requestingCamera: 'Requesting camera access',

  searching: 'Point at the Al Ahly crest…',
  crestDetected: 'AL AHLY CREST DETECTED',
  targetLost: 'Crest lost — find it again',
  exitAr: 'EXIT',

  legacyContinues: 'THE LEGACY CONTINUES',
  twelfthPlayerLine1: 'YOU ARE THE',
  twelfthPlayerLine2: '12TH PLAYER',
  twelfthPlayerSub: 'Every generation leaves a mark.',

  menuHistory: 'HISTORY',
  menuPresidents: 'PRESIDENTS',
  menuTrophies: 'TROPHIES',
  menuLegends: 'LEGENDS',
  menuFuture: 'FUTURE',
  askAlAhly: 'ASK AL AHLY',
  close: 'CLOSE',

  cameraErrorTitle: 'Camera access needed',
  cameraDenied:
    'Camera permission was denied. Enable camera access in your browser settings, then try again.',
  cameraUnavailable: 'No camera is available on this device, or it is in use by another app.',
  cameraInsecure: 'WebAR requires a secure connection (HTTPS).',
  cameraUnknown: 'Something went wrong while starting the camera.',
  retry: 'TRY AGAIN',
  continueInteractive: 'Continue with Interactive Experience',

  unsupportedTitle: 'AR is not available on this device.',
  unsupportedBody:
    'You can still explore the Al Ahly digital experience without the camera.',

  desktopTitle: 'Open on your phone',
  desktopBody:
    'This immersive AR experience is designed for mobile. Scan the QR code or open the URL on your phone.',
  desktopHint: 'Best on iOS Safari or Android Chrome',

  fallbackTitle: 'Explore the Legacy',
  fallbackBody: 'Discover History, Trophies, Legends, and the Future of Al Ahly.',

  historyTitle: 'HISTORY',
  trophiesTitle: 'TROPHIES',
  legendsTitle: 'LEGENDS',
  futureTitle: 'THE FUTURE OF AL AHLY',
  placeholderNote: 'Placeholder content — replace with official club data.',
  aiPlaceholder: 'Ask about Al Ahly history, trophies, legends…',
  aiSend: 'Send',

  presidentsEnter: 'THE PRESIDENTS',
  presidentsEnterHint: 'Enter the stadium of leadership',
  presidentsBack: 'BACK',
  presidentsLeaders: 'THE LEADERS',
  presidentsCentury: 'MORE THAN A CENTURY OF LEADERSHIP',
  presidentsExplore: 'EXPLORE THE LEGACY',
  presidentsEntering: 'ENTERING THE STADIUM…',
  presidentsOf: 'PRESIDENT OF AL AHLY',
  presidentsCurrent: 'CURRENT PRESIDENT',
  presidentsKeyMoments: 'KEY MOMENTS',
  presidentsPrev: 'PREVIOUS',
  presidentsNext: 'NEXT',
  presidentsHint: 'TAP A FLOATING CARD TO EXPLORE',
  presidentsNavigate: 'DRAG TO LOOK AROUND · PINCH TO ZOOM',
} as const

export type EnKey = keyof typeof en
export type Messages = typeof en
