import { redCastleMembers } from '@/data/redCastleMembers'
import { RosterContent } from '@/ar/roster/RosterContent'

/** El Qalaa El Hamraa board cards for crest AR. */
export class RedCastleContent extends RosterContent {
  constructor(scale: number) {
    super(scale, redCastleMembers, {
      name: 'RedCastleContent',
      maxCards: redCastleMembers.length,
    })
  }
}
