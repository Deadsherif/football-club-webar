import { boardMembers } from '@/data/boardMembers'
import { RosterContent } from '@/ar/roster/RosterContent'

/** Board of Directors cards for crest AR. */
export class BoardContent extends RosterContent {
  constructor(scale: number) {
    super(scale, boardMembers, {
      name: 'BoardContent',
      maxCards: boardMembers.length,
    })
  }
}
