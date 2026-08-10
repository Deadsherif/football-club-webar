type AnalyticsPayload = Record<string, string | number | boolean | undefined>

/**
 * Analytics abstraction — logs locally for MVP.
 * Swap `track` implementation for Segment / GA / Mixpanel later.
 */
class AnalyticsService {
  track(event: string, payload: AnalyticsPayload = {}): void {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info(`[analytics] ${event}`, payload)
    }
    // Future: send to provider
  }

  experienceStarted() {
    this.track('experience_started')
  }
  cameraOpened() {
    this.track('camera_opened')
  }
  targetDetected() {
    this.track('target_detected')
  }
  stadiumLoaded() {
    this.track('stadium_loaded')
  }
  historyOpened() {
    this.track('history_opened')
  }
  trophiesOpened() {
    this.track('trophies_opened')
  }
  legendsOpened() {
    this.track('legends_opened')
  }
  legendEraSelected(squadId: string) {
    this.track('legend_era_selected', { squadId })
  }
  legendPlayerSelected(playerId: string) {
    this.track('legend_player_selected', { playerId })
  }
  allTimeLegendsOpened() {
    this.track('all_time_legends_opened')
  }
  futureOpened() {
    this.track('future_opened')
  }
  aiOpened() {
    this.track('ai_opened')
  }
  experienceCompleted() {
    this.track('experience_completed')
  }
  sectionOpened(section: string) {
    this.track(`${section}_opened`)
  }
}

export const analytics = new AnalyticsService()
