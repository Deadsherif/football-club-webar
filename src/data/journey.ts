import { presidents } from '@/data/presidents'
import { trophies } from '@/data/trophies'
import { boardMembers } from '@/data/boardMembers'
import { redCastleMembers } from '@/data/redCastleMembers'

export type JourneyChapter =
  | 'presidents'
  | 'trophies'
  | 'board'
  | 'red-castle'
  | 'complete'

export const JOURNEY_CHAPTER_ROUTES: Record<JourneyChapter, string> = {
  presidents: '/journey/presidents',
  trophies: '/journey/trophies',
  board: '/journey/board',
  'red-castle': '/journey/red-castle',
  complete: '/journey/complete',
}

export function isJourneyPath(path: string): boolean {
  return path === '/journey' || path.startsWith('/journey/')
}

export interface JourneyStep {
  id: string
  chapter: JourneyChapter
  route: string
  itemId?: string
  squadId?: string
  yearLabel: string
  titleEn: string
  titleAr: string
  summaryEn: string
  summaryAr?: string
  /** Optional stat shown above the story text (e.g. trophy title count). */
  countLabelEn?: string
  countLabelAr?: string
}

/**
 * Guided club story: Presidents → Trophies → Board → Red Castle.
 * Legends are hidden from the journey for now.
 */
function buildSteps(): JourneyStep[] {
  const steps: JourneyStep[] = []

  for (const p of presidents) {
    steps.push({
      id: `president-${p.id}`,
      chapter: 'presidents',
      route: JOURNEY_CHAPTER_ROUTES.presidents,
      itemId: p.id,
      yearLabel: p.yearsLabel,
      titleEn: p.name,
      titleAr: p.arabicName ?? p.name,
      summaryEn: p.description,
    })
  }

  for (const trophy of trophies) {
    const count = trophy.officialTitles
    steps.push({
      id: `trophy-${trophy.id}`,
      chapter: 'trophies',
      route: JOURNEY_CHAPTER_ROUTES.trophies,
      itemId: trophy.id,
      yearLabel: String(count),
      titleEn: trophy.nameEn,
      titleAr: trophy.nameAr,
      summaryEn: trophy.summaryAr,
      summaryAr: trophy.summaryAr,
      countLabelEn: titlesCountEn(count),
      countLabelAr: titlesCountAr(count),
    })
  }

  for (const member of boardMembers) {
    steps.push({
      id: `board-${member.id}`,
      chapter: 'board',
      route: JOURNEY_CHAPTER_ROUTES.board,
      itemId: member.id,
      yearLabel: member.yearsLabel,
      titleEn: member.name,
      titleAr: member.arabicName ?? member.name,
      summaryEn: member.description,
    })
  }

  for (const member of redCastleMembers) {
    steps.push({
      id: `castle-${member.id}`,
      chapter: 'red-castle',
      route: JOURNEY_CHAPTER_ROUTES['red-castle'],
      itemId: member.id,
      yearLabel: member.yearsLabel,
      titleEn: member.name,
      titleAr: member.arabicName ?? member.name,
      summaryEn: member.description,
    })
  }

  steps.push({
    id: 'complete',
    chapter: 'complete',
    route: JOURNEY_CHAPTER_ROUTES.complete,
    yearLabel: '∞',
    titleEn: 'The Legacy Continues',
    titleAr: 'الإرث مستمر',
    summaryEn:
      'You have walked the chapters of Al Ahly. The story is still being written — by players, leaders, and every fan.',
    summaryAr:
      'لقد سرت في فصول الأهلي. القصة ما زالت تُكتب — باللاعبين والقادة وكل مشجع.',
  })

  return steps
}

export const journeySteps: JourneyStep[] = buildSteps()

export const journeyChapters: JourneyChapter[] = [
  'presidents',
  'trophies',
  'board',
  'red-castle',
  'complete',
]

export function getJourneyStep(index: number): JourneyStep | null {
  return journeySteps[index] ?? null
}

export function firstIndexOfChapter(chapter: JourneyChapter): number {
  return journeySteps.findIndex((step) => step.chapter === chapter)
}

function titlesCountEn(count: number): string {
  if (count <= 0) return '0 OFFICIAL TITLES'
  if (count === 1) return '1 OFFICIAL TITLE'
  return `${count} OFFICIAL TITLES`
}

function titlesCountAr(count: number): string {
  if (count <= 0) return 'لا ألقاب رسمية'
  if (count === 1) return 'لقب رسمي واحد'
  if (count === 2) return 'لقبان رسميان'
  if (count >= 3 && count <= 10) return `${count} ألقاب رسمية`
  return `${count} لقباً رسمياً`
}
