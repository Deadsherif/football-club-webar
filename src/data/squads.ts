export type SquadLayout =
  | 'featured'
  | '2-3-5'
  | '4-3-3'
  | '4-4-2'
  | '4-3-1-2'
  | '4-2-3-1'
  | '3-5-2'

export interface HistoricalSquad {
  id: string
  year: number
  endYear?: number
  eraName: string
  formation?: Exclude<SquadLayout, 'featured'>
  layout: SquadLayout
  manager?: string
  captain?: string
  playerIds: string[]
  achievements?: string[]
  description: string
  source: string
  /** Prevents a featured collection being presented as a verified starting XI. */
  isVerifiedXI: boolean
}

export const historicalSquads: HistoricalSquad[] = [
  {
    id: 'founders-1907',
    year: 1907,
    endYear: 1929,
    eraName: 'THE FOUNDERS',
    layout: 'featured',
    playerIds: [
      'ahmed-fouad-anwar',
      'hussein-hegazi',
      'mokhtar-el-tetsh',
      'ali-el-husseiny',
      'hussein-sabry',
    ],
    description:
      'The first generations of Al Ahly built the identity of a club that would become one of Africa’s great sporting institutions.',
    source:
      'User-curated Featured Generation draft; Al Ahly was founded in 1907 and its first football team appeared in 1911.',
    isVerifiedXI: false,
  },
  {
    id: 'first-great-generation',
    year: 1930,
    endYear: 1949,
    eraName: 'THE FIRST GREAT GENERATION',
    layout: 'featured',
    playerIds: [
      'mokhtar-el-tetsh',
      'saleh-el-wahsh-player',
      'hussein-madkour',
      'ahmed-mekawy',
      'el-tohamy',
      'el-dazwy',
    ],
    description:
      'A featured generation representing the standards of commitment, competitiveness, and loyalty associated with the Red Castle.',
    source:
      'User-curated Featured Generation draft — not a verified historical starting XI.',
    isVerifiedXI: false,
  },
  {
    id: 'maestro-generation',
    year: 1950,
    endYear: 1969,
    eraName: 'THE MAESTRO GENERATION',
    layout: 'featured',
    playerIds: [
      'adel-heikal',
      'saleh-selim-player',
      'rifaat-el-fanagily',
      'taha-ismail',
      'mimi-el-sherbiny',
      'ahmed-mekawy',
      'el-dazwy',
      'hassan-hamdy-player',
    ],
    description:
      'A generation defined by elegance, leadership, and winning mentality, led by defining figures including Saleh Selim.',
    source:
      'User-curated Featured Generation draft — not a verified historical starting XI.',
    isVerifiedXI: false,
  },
  {
    id: 'golden-generation',
    year: 1970,
    endYear: 1989,
    eraName: 'THE GOLDEN GENERATION',
    formation: '4-3-3',
    layout: '4-3-3',
    playerIds: [
      'ahmed-shobeir',
      'rabie-yassin',
      'ekramy-el-shahat',
      'ibrahim-hassan',
      'hany-mostafa',
      'magdy-abdelghany',
      'taher-abu-zeid',
      'mahmoud-el-khatib',
      'alaa-mihoub',
      'zakaria-nassef',
      'hossam-hassan',
    ],
    achievements: ['Al Ahly won its first African title in 1982'],
    description:
      'A featured FIFA-style generation that represents Al Ahly’s rise as a continental powerhouse.',
    source:
      'User-curated Featured Generation draft; Mahmoud El Khatib’s 1982 and 1987 African titles are separately sourced.',
    isVerifiedXI: false,
  },
  {
    id: 'african-kings',
    year: 1980,
    endYear: 1999,
    eraName: 'THE AFRICAN KINGS',
    formation: '4-3-3',
    layout: '4-3-3',
    playerIds: [
      'ahmed-shobeir',
      'rabie-yassin',
      'alaa-mihoub',
      'hany-ramzy',
      'ibrahim-hassan',
      'taher-abu-zeid',
      'magdy-abdelghany',
      'hossam-hassan',
      'ayman-shawky',
      'mohamed-ramadan',
      'zakaria-nassef',
    ],
    description:
      'A featured generation of Egyptian stars representing Al Ahly’s growing continental ambition.',
    source: 'User-curated Featured Generation draft — not a verified historical starting XI.',
    isVerifiedXI: false,
  },
  {
    id: 'return-of-giants',
    year: 1990,
    endYear: 2000,
    eraName: 'THE RETURN OF THE GIANTS',
    formation: '4-3-3',
    layout: '4-3-3',
    playerIds: [
      'essam-el-hadary',
      'wael-riyad',
      'hady-khashaba',
      'ibrahim-hassan',
      'rabie-yassin',
      'hossam-ghaly',
      'khaled-bebo',
      'mohamed-barakat',
      'hossam-hassan',
      'ahmed-bilal',
      'alaa-ibrahim',
    ],
    description:
      'A featured transitional generation that prepared Al Ahly for a dominant modern era.',
    source: 'User-curated Featured Generation draft — not a verified historical starting XI.',
    isVerifiedXI: false,
  },
  {
    id: 'unbeatable-generation',
    year: 2004,
    endYear: 2006,
    eraName: 'THE UNBEATABLE GENERATION',
    formation: '4-3-1-2',
    layout: '4-3-1-2',
    playerIds: [
      'essam-el-hadary',
      'ahmed-fathy',
      'wael-gomaa',
      'shady-mohamed',
      'gilberto',
      'hossam-ashour',
      'mohamed-barakat',
      'mohamed-aboutrika',
      'ahmed-hassan',
      'emad-moteab',
      'flavio',
    ],
    description:
      'Under Manuel José, a featured generation became associated with discipline, technical quality, and success in Egypt and Africa.',
    source: 'User-curated Featured Generation draft — not a verified historical starting XI.',
    isVerifiedXI: false,
  },
  {
    id: 'african-dynasty',
    year: 2006,
    endYear: 2010,
    eraName: 'THE AFRICAN DYNASTY',
    formation: '4-3-3',
    layout: '4-3-3',
    playerIds: [
      'essam-el-hadary',
      'ahmed-fathy',
      'wael-gomaa',
      'shady-mohamed',
      'gilberto',
      'hossam-ashour',
      'mohamed-barakat',
      'mohamed-aboutrika',
      'emad-moteab',
      'flavio',
      'osama-hosny',
    ],
    description:
      'A featured generation representing the consistency and continental dominance associated with this Al Ahly era.',
    source:
      'User-curated Featured Generation draft — not a verified historical starting XI.',
    isVerifiedXI: false,
  },
  {
    id: 'generation-of-resilience',
    year: 2011,
    endYear: 2013,
    eraName: 'THE GENERATION OF RESILIENCE',
    formation: '4-2-3-1',
    layout: '4-2-3-1',
    playerIds: [
      'sherif-ekramy',
      'ahmed-fathy',
      'wael-gomaa',
      'mohamed-naguib',
      'sayed-moawad',
      'hossam-ashour',
      'hossam-ghaly',
      'mohamed-aboutrika',
      'walid-soliman',
      'abdallah-el-said',
      'emad-moteab',
    ],
    description:
      'A featured generation representing Al Ahly’s ability to compete with leadership and character under extraordinary circumstances.',
    source: 'User-curated Featured Generation draft — not a verified historical starting XI.',
    isVerifiedXI: false,
  },
  {
    id: 'modern-red-dynasty',
    year: 2018,
    endYear: 2021,
    eraName: 'THE MODERN RED DYNASTY',
    formation: '4-2-3-1',
    layout: '4-2-3-1',
    playerIds: [
      'mohamed-el-shenawy',
      'mohamed-hany',
      'badr-benoun',
      'ayman-ashraf',
      'ali-maaloul',
      'amr-el-solia',
      'aliou-dieng',
      'hussein-elshahat',
      'mohamed-magdy-afsha',
      'walid-soliman',
      'mohamed-sherif',
    ],
    description:
      'A featured modern generation combining experience, athleticism, and tactical discipline.',
    source:
      'User-curated Featured Generation draft — not a verified historical starting XI.',
    isVerifiedXI: false,
  },
  {
    id: 'new-generation',
    year: 2022,
    endYear: 2024,
    eraName: 'THE NEW GENERATION',
    formation: '4-3-3',
    layout: '4-3-3',
    playerIds: [
      'mohamed-el-shenawy',
      'mohamed-hany',
      'ramy-rabia',
      'yasser-ibrahim',
      'ali-maaloul',
      'marwan-attia',
      'aliou-dieng',
      'emam-ashour',
      'hussein-elshahat',
      'mahmoud-kahraba',
      'percy-tau',
    ],
    description:
      'A featured generation where new talent and experienced champions carried the club identity forward.',
    source: 'User-curated Featured Generation draft — not a verified historical starting XI.',
    isVerifiedXI: false,
  },
  {
    id: 'current-generation',
    year: 2025,
    endYear: 2026,
    eraName: 'THE CURRENT GENERATION',
    formation: '4-3-3',
    layout: '4-3-3',
    playerIds: [
      'mohamed-el-shenawy',
      'mohamed-hany',
      'yasser-ibrahim',
      'ramy-rabia',
      'ali-maaloul',
      'marwan-attia',
      'emam-ashour',
      'ahmed-nabil-kouka',
      'hussein-elshahat',
      'trezeguet',
      'zizo',
    ],
    description:
      'The current generation is presented as a live chapter of the club, not as a Legends XI.',
    source: 'User-curated current-generation draft; current roster must be refreshed from official club data before release.',
    isVerifiedXI: false,
  },
  {
    id: 'all-time-legends',
    year: 1907,
    eraName: 'ALL-TIME LEGENDS',
    layout: 'featured',
    playerIds: [
      'mokhtar-el-tetsh',
      'mahmoud-el-gohary',
      'mahmoud-el-khatib',
      'essam-el-hadary',
      'wael-gomaa',
      'mohamed-aboutrika',
      'emad-moteab',
      'mohamed-el-shenawy',
      'ali-maaloul',
      'hussein-elshahat',
    ],
    description: 'FEATURED LEGENDS FROM DIFFERENT GENERATIONS',
    source: 'See individual player sources.',
    isVerifiedXI: false,
  },
]

export function getHistoricalSquad(id: string): HistoricalSquad | undefined {
  return historicalSquads.find((squad) => squad.id === id)
}
