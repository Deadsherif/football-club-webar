import { useEffect } from 'react'
import type { JourneyChapter } from '@/data/journey'
import { useJourneyOptional } from '@/journey/JourneyContext'

/**
 * When the global journey focuses this chapter, call onItem with the step's item.
 * Pass ready=true only after the experience controller has started.
 */
export function useJourneyChapterSync(
  chapter: JourneyChapter,
  onItem: (itemId: string, meta?: { squadId?: string }) => void,
  ready = true,
): boolean {
  const journey = useJourneyOptional()
  const activeHere = Boolean(
    journey?.active && journey.chapter === chapter && journey.step?.itemId,
  )

  useEffect(() => {
    if (!ready) return
    if (!journey?.active || journey.chapter !== chapter) return
    const itemId = journey.step?.itemId
    if (!itemId) return
    onItem(itemId, { squadId: journey.step?.squadId })
  }, [
    ready,
    journey?.active,
    journey?.chapter,
    journey?.stepIndex,
    chapter,
    onItem,
    journey?.step?.itemId,
    journey?.step?.squadId,
  ])

  return activeHere
}
