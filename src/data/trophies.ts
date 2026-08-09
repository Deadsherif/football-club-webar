export interface TrophyDefinition {
  id: string
  name: string
  competition: string
  year: string
  description: string
  modelSrc: string
  placeholder?: boolean
}

/**
 * Trophy cabinet definitions. Drop GLBs into /public/models/trophies/
 */
export const trophies: TrophyDefinition[] = [
  {
    id: 'league',
    name: 'Egyptian Premier League',
    competition: 'Domestic League',
    year: 'Multiple',
    description: 'The backbone of Al Ahly’s domestic supremacy. Official tallies TBD.',
    modelSrc: '/models/trophies/league.glb',
    placeholder: true,
  },
  {
    id: 'caf-cl',
    name: 'CAF Champions League',
    competition: 'CAF Champions League',
    year: 'Multiple',
    description: 'Continental nights that defined eras. Replace with official records.',
    modelSrc: '/models/trophies/caf-cl.glb',
    placeholder: true,
  },
  {
    id: 'egypt-cup',
    name: 'Egypt Cup',
    competition: 'Domestic Cup',
    year: 'Multiple',
    description: 'Knockout glory woven into club DNA.',
    modelSrc: '/models/trophies/egypt-cup.glb',
    placeholder: true,
  },
  {
    id: 'super',
    name: 'CAF Super Cup',
    competition: 'CAF Super Cup',
    year: 'Multiple',
    description: 'Showcase of champions. Placeholder until official assets arrive.',
    modelSrc: '/models/trophies/super-cup.glb',
    placeholder: true,
  },
]
