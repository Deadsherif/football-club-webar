export interface LegendDefinition {
  id: string
  name: string
  position: string
  era: string
  achievements: string[]
  imageSrc: string
  modelSrc?: string
  placeholder?: boolean
}

/**
 * Legend profiles — placeholders only. No fabricated statistics.
 */
export const legends: LegendDefinition[] = [
  {
    id: 'legend-1',
    name: 'Club Legend (Placeholder)',
    position: 'Forward',
    era: 'Golden Era',
    achievements: [
      'Iconic presence for Al Ahly',
      'Replace with official biography',
    ],
    imageSrc: '/assets/crest.png',
    placeholder: true,
  },
  {
    id: 'legend-2',
    name: 'Club Legend (Placeholder)',
    position: 'Midfielder',
    era: 'Modern Era',
    achievements: [
      'Leadership on and off the pitch',
      'Awaiting official club assets',
    ],
    imageSrc: '/assets/crest.png',
    placeholder: true,
  },
  {
    id: 'legend-3',
    name: 'Club Legend (Placeholder)',
    position: 'Goalkeeper',
    era: 'Classic Era',
    achievements: [
      'Remembered by generations of fans',
      'Content marked as placeholder',
    ],
    imageSrc: '/assets/crest.png',
    placeholder: true,
  },
]
