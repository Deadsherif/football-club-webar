/**
 * Al Ahly SC presidents — names & years from the Korabia historical poster
 * (رؤساء النادي الأهلي عبر التاريخ) plus public club records.
 *
 * Portraits sourced from Images/ (synced into public/assets/presidents).
 */

export interface President {
  id: string
  name: string
  arabicName?: string
  startYear: number
  /** null = current president */
  endYear: number | null
  yearsLabel: string
  portrait: string
  description: string
  achievements?: string[]
  source?: string
  /** Front-face eyebrow (default: PRESIDENT OF AL AHLY) */
  cardEyebrow?: string
  /** Badge when endYear === null (default: CURRENT PRESIDENT) */
  currentBadge?: string
}

export const presidents: President[] = [
  {
    id: 'mitchell-ince',
    name: 'Mitchel Ince',
    arabicName: 'ميشيل أنس',
    startYear: 1907,
    endYear: 1908,
    yearsLabel: '1907 — 1908',
    portrait: '/assets/presidents/ince.jpg',
    description:
      'First president of Al Ahly Sporting Club at its founding in 1907.',
    source: 'Korabia presidents poster; Al Ahly public history',
  },
  {
    id: 'aziz-ezzat',
    name: 'Aziz Ezzat Pasha',
    arabicName: 'عزيز عزت باشا',
    startYear: 1908,
    endYear: 1916,
    yearsLabel: '1908 — 1916',
    portrait: '/assets/presidents/ezzat.jpg',
    description:
      'First Egyptian president of Al Ahly. Led the club through its early institutional years after the founding presidency.',
    achievements: ['First Egyptian club president'],
    source: 'Korabia presidents poster; Al Ahly public history',
  },
  {
    id: 'abdel-khaliq-sarwat',
    name: 'Abdel Khaliq Sarwat Pasha',
    arabicName: 'عبد الخالق ثروت باشا',
    startYear: 1916,
    endYear: 1922,
    yearsLabel: '1916 — 1922',
    portrait: '/assets/presidents/sarwat.jpg',
    description:
      'Presided from 1916 to 1922. Associated with formalizing early club regulations during his tenure.',
    source: 'Korabia presidents poster; Arabic Wikipedia presidents list',
  },
  {
    id: 'gaafar-waly',
    name: 'Gaafar Waly Pasha',
    arabicName: 'جعفر والي باشا',
    startYear: 1922,
    endYear: 1944,
    yearsLabel: '1922 — 1940 · 1941 — 1944',
    portrait: '/assets/presidents/waly-1922.jpg',
    description:
      'Served two presidential periods (1922–1940 and 1941–1944), among the longest leadership spans in early club history.',
    achievements: ['Two presidential terms'],
    source: 'Korabia presidents poster',
  },
  {
    id: 'ahmed-fouad-anwar',
    name: 'Ahmed Fouad Anwar',
    arabicName: 'أحمد فؤاد أنور',
    startYear: 1940,
    endYear: 1941,
    yearsLabel: '1940 — 1941',
    portrait: '/assets/presidents/anwar.jpg',
    description:
      'Acting president between Gaafar Waly Pasha’s two terms (1940–1941). Also remembered as Al Ahly’s first football team captain.',
    achievements: ['Acting club president 1940–1941', 'First Al Ahly football captain'],
    source: 'Club historical records; Korabia presidents list',
  },
  {
    id: 'ahmed-hasanein',
    name: 'Ahmed Hasanein Pasha',
    arabicName: 'أحمد حسنين باشا',
    startYear: 1944,
    endYear: 1947,
    yearsLabel: '1944 — 1947',
    portrait: '/assets/presidents/hasanein.jpg',
    description: 'Club president from 1944 to 1947.',
    source: 'Korabia presidents poster',
  },
  {
    id: 'ahmed-aboud',
    name: 'Ahmed Aboud Pasha',
    arabicName: 'أحمد عبود باشا',
    startYear: 1947,
    endYear: 1961,
    yearsLabel: '1947 — 1961',
    portrait: '/assets/presidents/aboud.jpg',
    description:
      'Long mid-century presidency from 1947 to 1961 — one of the longest continuous terms in club history.',
    achievements: ['Long continuous presidential term (1947–1961)'],
    source: 'Korabia presidents poster',
  },
  {
    id: 'salah-desouky',
    name: 'Salah El Din El Desouky',
    arabicName: 'صلاح الدين الدسوقي',
    startYear: 1962,
    endYear: 1965,
    yearsLabel: '1962 — 1965',
    portrait: '/assets/presidents/desouky.jpg',
    description: 'Club president from 1962 to 1965.',
    source: 'Korabia presidents poster',
  },
  {
    id: 'abdelmohsen-mortagy',
    name: 'Abdel Mohsen Kamel Mortagy',
    arabicName: 'عبد المحسن كامل مرتجي',
    startYear: 1965,
    endYear: 1980,
    yearsLabel: '1965 — 1967 · 1971 — 1980',
    portrait: '/assets/presidents/mortagy-1971.jpg',
    description:
      'Served two presidential periods (1965–1967 and 1971–1980), bridging a pivotal era of modern Al Ahly leadership.',
    achievements: ['Two presidential terms'],
    source: 'Korabia presidents poster',
  },
  {
    id: 'ibrahim-el-wakil',
    name: 'Ibrahim El Wakil',
    arabicName: 'إبراهيم الوكيل',
    startYear: 1967,
    endYear: 1971,
    yearsLabel: '1967 — 1971',
    portrait: '/assets/presidents/wakil.jpg',
    description:
      'Presided between the two terms of Abdel Mohsen Kamel Mortagy (1967–1971).',
    source: 'Korabia presidents poster',
  },
  {
    id: 'saleh-selim',
    name: 'Saleh Selim',
    arabicName: 'صالح سليم',
    startYear: 1980,
    endYear: 2002,
    yearsLabel: '1980 — 1988 · 1992 — 2002',
    portrait: '/assets/presidents/selim-1992.jpg',
    description:
      'Iconic Al Ahly figure and former player. Served two presidencies (1980–1988 and 1992–2002). During his leadership Al Ahly was named African Club of the Century.',
    achievements: [
      'Two presidential terms',
      'African Club of the Century era',
    ],
    source: 'Korabia presidents poster; public club history',
  },
  {
    id: 'saleh-el-wahsh',
    name: 'Mohamed Abdou Saleh El Wahsh',
    arabicName: 'محمد عبده صالح الوحش',
    startYear: 1988,
    endYear: 1992,
    yearsLabel: '1988 — 1992',
    portrait: '/assets/presidents/wahsh.jpg',
    description:
      'Club president from 1988 to 1992, between the two terms of Saleh Selim.',
    source: 'Korabia presidents poster',
  },
  {
    id: 'hassan-hamdy',
    name: 'Hassan Hamdy',
    arabicName: 'حسن حمدي',
    startYear: 2002,
    endYear: 2014,
    yearsLabel: '2002 — 2014',
    portrait: '/assets/presidents/hamdy.jpg',
    description:
      'Presided from 2002 to 2014 — a long modern administrative era following Saleh Selim.',
    source: 'Korabia presidents poster',
  },
  {
    id: 'mahmoud-taher',
    name: 'Mahmoud Taher',
    arabicName: 'محمود طاهر',
    startYear: 2014,
    endYear: 2017,
    yearsLabel: '2014 — 2017',
    portrait: '/assets/presidents/taher.jpg',
    description: 'Club president from 2014 to 2017.',
    source: 'Korabia presidents poster',
  },
  {
    id: 'mahmoud-el-khatib',
    name: 'Mahmoud El Khatib',
    arabicName: 'محمود الخطيب',
    startYear: 2017,
    endYear: null,
    yearsLabel: '2017 — Present',
    portrait: '/assets/presidents/khatib.jpg',
    description:
      'Current president of Al Ahly SC (from 2017). Continues the club’s modern leadership era.',
    achievements: ['Current president'],
    source: 'Korabia presidents poster; club election records (2017)',
  },
]

export function getCurrentPresident(): President | undefined {
  return presidents.find((p) => p.endYear === null)
}

export function getPresidentById(id: string): President | undefined {
  return presidents.find((p) => p.id === id)
}

export function getPresidentIndex(id: string): number {
  return presidents.findIndex((p) => p.id === id)
}
