export interface HistoryMilestone {
  id: string
  year: number
  title: string
  summary: string
  /** Mark unofficial / demo content clearly */
  placeholder?: boolean
}

/**
 * Data-driven club timeline. Replace with official Al Ahly records.
 */
export const historyMilestones: HistoryMilestone[] = [
  {
    id: 'founding',
    year: 1907,
    title: 'Foundation',
    summary: 'Al Ahly Sporting Club is founded in Cairo — the beginning of a national institution.',
    placeholder: true,
  },
  {
    id: 'identity',
    year: 1911,
    title: 'Club Identity',
    summary: 'Early years establish Al Ahly as a symbol of ambition and community.',
    placeholder: true,
  },
  {
    id: 'dominance',
    year: 1950,
    title: 'Domestic Era',
    summary: 'A culture of excellence takes shape across Egyptian football.',
    placeholder: true,
  },
  {
    id: 'africa',
    year: 1982,
    title: 'Continental Ambition',
    summary: 'Al Ahly’s African journey strengthens a legacy beyond borders.',
    placeholder: true,
  },
  {
    id: 'century',
    year: 2000,
    title: 'Club of the Century',
    summary: 'Recognized among Africa’s greatest clubs — a title earned across generations.',
    placeholder: true,
  },
  {
    id: 'today',
    year: 2024,
    title: 'Living Legacy',
    summary: 'Fans, players, and history continue to write the next chapter.',
    placeholder: true,
  },
]
