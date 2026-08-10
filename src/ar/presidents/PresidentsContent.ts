import { presidents } from '@/data/presidents'
import { RosterContent } from '@/ar/roster/RosterContent'

/**
 * Presidents cards for crest AR — thin wrapper over shared RosterContent.
 */
export class PresidentsContent extends RosterContent {
  constructor(scale: number) {
    super(scale, presidents, { name: 'PresidentsContent', maxCards: 12 })
  }
}
