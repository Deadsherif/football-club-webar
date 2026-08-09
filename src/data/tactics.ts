export interface TacticPlayer {
  id: string
  name: string
  number: number
  role: string
  /** Short position code shown on the card face. */
  pos: string
  line: 'GK' | 'DF' | 'MF' | 'FW'
  /** Position on the pitch, percentage coordinates. x: 0 (left) – 100 (right). y: 0 (attack) – 100 (own goal). */
  x: number
  y: number
}

export interface TacticEra {
  id: string
  label: string
  years: string
  formation: string
  trophy: string
  result: string
  players: TacticPlayer[]
}

/**
 * Al Ahly's "Golden Era" (2005–2013) — the club's own documented run of
 * CAF Champions League dominance. Players and honors are real; squads are
 * reconstructed from public match records for three of that era's title
 * runs and reflect each side's real, known playing position. They are
 * presented as the era's tactical identity, not a claim of verified
 * minute-by-minute matchday records.
 */
export const tacticEras: TacticEra[] = [
  {
    id: 'era-2005',
    label: '2005',
    years: 'Golden Era · Opening Chapter',
    formation: '4-3-3',
    trophy: 'CAF Champions League',
    result: 'Beat Étoile du Sahel 3–0 on aggregate',
    players: [
      { id: '2005-gk', name: 'Essam El Hadary', number: 1, role: 'Goalkeeper', pos: 'GK', line: 'GK', x: 50, y: 93 },
      { id: '2005-lb', name: 'Hassan Mostafa', number: 14, role: 'Left-back', pos: 'LB', line: 'DF', x: 14, y: 71 },
      { id: '2005-cb1', name: 'Wael Gomaa', number: 26, role: 'Centre-back · Captain', pos: 'CB', line: 'DF', x: 35, y: 76 },
      { id: '2005-cb2', name: 'Ahmad El-Sayed', number: 5, role: 'Centre-back', pos: 'CB', line: 'DF', x: 65, y: 76 },
      { id: '2005-rb', name: 'Emad El-Nahhas', number: 16, role: 'Right-back', pos: 'RB', line: 'DF', x: 86, y: 71 },
      { id: '2005-dm', name: 'Mohamed Shawky', number: 17, role: 'Defensive midfield', pos: 'CDM', line: 'MF', x: 50, y: 60 },
      { id: '2005-cm', name: 'Gilberto', number: 12, role: 'Central midfield', pos: 'CM', line: 'MF', x: 30, y: 48 },
      { id: '2005-am', name: 'Mohamed Aboutrika', number: 22, role: 'Attacking midfield', pos: 'CAM', line: 'MF', x: 70, y: 46 },
      { id: '2005-lw', name: 'Osama Hosny', number: 18, role: 'Left wing', pos: 'LW', line: 'FW', x: 20, y: 22 },
      { id: '2005-st', name: 'Emad Moteab', number: 13, role: 'Striker', pos: 'ST', line: 'FW', x: 50, y: 14 },
      { id: '2005-rw', name: 'Mohamed Barakat', number: 8, role: 'Right wing', pos: 'RW', line: 'FW', x: 80, y: 22 },
    ],
  },
  {
    id: 'era-2008',
    label: '2008',
    years: 'Golden Era · Record Sixth Title',
    formation: '4-2-3-1',
    trophy: 'CAF Champions League',
    result: 'Beat Coton Sport Garoua 4–2 on aggregate',
    players: [
      { id: '2008-gk', name: 'Essam El Hadary', number: 1, role: 'Goalkeeper', pos: 'GK', line: 'GK', x: 50, y: 93 },
      { id: '2008-lb', name: 'Sayed Moawad', number: 3, role: 'Left-back', pos: 'LB', line: 'DF', x: 14, y: 71 },
      { id: '2008-cb1', name: 'Wael Gomaa', number: 26, role: 'Centre-back · Captain', pos: 'CB', line: 'DF', x: 35, y: 76 },
      { id: '2008-cb2', name: 'Ahmad El-Sayed', number: 5, role: 'Centre-back', pos: 'CB', line: 'DF', x: 65, y: 76 },
      { id: '2008-rb', name: 'Ahmed Fathy', number: 7, role: 'Right-back', pos: 'RB', line: 'DF', x: 86, y: 71 },
      { id: '2008-dm1', name: 'Hossam Ashour', number: 25, role: 'Defensive midfield', pos: 'CDM', line: 'MF', x: 35, y: 58 },
      { id: '2008-dm2', name: 'Gilberto', number: 12, role: 'Defensive midfield', pos: 'CDM', line: 'MF', x: 65, y: 58 },
      { id: '2008-lw', name: 'Shikabala', number: 10, role: 'Left wing', pos: 'LM', line: 'MF', x: 22, y: 34 },
      { id: '2008-am', name: 'Mohamed Aboutrika', number: 22, role: 'Attacking midfield', pos: 'CAM', line: 'MF', x: 50, y: 30 },
      { id: '2008-rw', name: 'Mohamed Barakat', number: 8, role: 'Right wing', pos: 'RM', line: 'MF', x: 78, y: 34 },
      { id: '2008-st', name: 'Flávio', number: 23, role: 'Striker', pos: 'ST', line: 'FW', x: 50, y: 14 },
    ],
  },
  {
    id: 'era-2012',
    label: '2012',
    years: 'Golden Era · Closing Chapter',
    formation: '4-2-3-1',
    trophy: 'CAF Champions League',
    result: 'Beat Espérance de Tunis 3–2 on aggregate',
    players: [
      { id: '2012-gk', name: 'Sherif Ekramy', number: 1, role: 'Goalkeeper', pos: 'GK', line: 'GK', x: 50, y: 93 },
      { id: '2012-lb', name: 'Sherif Abdel-Fadil', number: 20, role: 'Left-back', pos: 'LB', line: 'DF', x: 14, y: 71 },
      { id: '2012-cb1', name: 'Wael Gomaa', number: 6, role: 'Centre-back · Captain', pos: 'CB', line: 'DF', x: 35, y: 76 },
      { id: '2012-cb2', name: 'Mohamed Naguib', number: 23, role: 'Centre-back', pos: 'CB', line: 'DF', x: 65, y: 76 },
      { id: '2012-rb', name: 'Ahmed Fathy', number: 24, role: 'Right-back', pos: 'RB', line: 'DF', x: 86, y: 71 },
      { id: '2012-dm1', name: 'Hossam Ghaly', number: 14, role: 'Defensive midfield', pos: 'CDM', line: 'MF', x: 35, y: 58 },
      { id: '2012-dm2', name: 'Hossam Ashour', number: 25, role: 'Defensive midfield', pos: 'CDM', line: 'MF', x: 65, y: 58 },
      { id: '2012-lw', name: 'Walid Soliman', number: 11, role: 'Left wing', pos: 'LM', line: 'MF', x: 22, y: 34 },
      { id: '2012-am', name: 'Mohamed Aboutrika', number: 22, role: 'Attacking midfield', pos: 'CAM', line: 'MF', x: 50, y: 30 },
      { id: '2012-rw', name: 'Mohamed Barakat', number: 8, role: 'Right wing', pos: 'RM', line: 'MF', x: 78, y: 34 },
      { id: '2012-st', name: 'Gedo', number: 15, role: 'Striker', pos: 'ST', line: 'FW', x: 50, y: 14 },
    ],
  },
]
