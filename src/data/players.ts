import { legendPortraits } from './legendPortraits'

export interface LegendPlayer {
  id: string
  name: string
  arabicName?: string
  /** Real portrait URL only. Undefined renders the product's no-photo state. */
  portrait?: string
  position?: string
  shirtNumber?: number
  era: string
  description: string
  achievements?: string[]
  appearances?: number
  goals?: number
  isLegend: boolean
  source: string
}

/**
 * Initial Legends dataset.
 *
 * These are featured profiles, not a claimed historical starting XI. Statistics
 * and shirt numbers remain omitted until they have a primary-source citation.
 */
const verifiedLegendPlayers: LegendPlayer[] = [
  {
    id: 'mokhtar-el-tetsh',
    name: 'Mokhtar El Tetsh',
    arabicName: 'مختار التتش',
    position: 'Striker',
    era: '1922–1940',
    description:
      'Mokhtar El Tetsh joined Al Ahly in 1922 and remained one of the key figures of a golden generation until his retirement in 1940.',
    achievements: [
      'Joined Al Ahly in 1922',
      'Later served Al Ahly as coach and administrator',
    ],
    isLegend: true,
    source:
      'https://www.alahlyegypt.com/ar/news/article/mkhtar-alttsh-astor-snaatha-almoakf-alotny-oaashk-alahly',
  },
  {
    id: 'mahmoud-el-gohary',
    name: 'Mahmoud El Gohary',
    arabicName: 'محمود الجوهري',
    position: 'Forward',
    era: '1950s–1961',
    description:
      'Mahmoud El Gohary was an Al Ahly forward. At the 1959 Africa Cup of Nations, he scored a hat-trick against Ethiopia and finished as the tournament top scorer as Egypt won the title.',
    achievements: [
      'Africa Cup of Nations winner with Egypt in 1959',
      'Top scorer at the 1959 Africa Cup of Nations',
    ],
    isLegend: true,
    source:
      'https://www.cafonline.com/afcon2025/news/el-gohary-and-keshi-a-feat-for-two/',
  },
  {
    id: 'mahmoud-el-khatib',
    name: 'Mahmoud El Khatib',
    arabicName: 'محمود الخطيب',
    position: 'Forward',
    era: '1970s–1980s',
    description:
      'Mahmoud El Khatib won Al Ahly’s first African title in 1982 and another in 1987. He later became the club president.',
    achievements: [
      'CAF Champions League winner with Al Ahly in 1982 and 1987',
      'First African club president to win the CAF Champions League as both player and president',
    ],
    isLegend: true,
    source:
      'https://www.alahlyegypt.com/en/news/article/el-khatib-became-the-first-to-win-caf-champions-league-as-a-player-and-a-president',
  },
  {
    id: 'essam-el-hadary',
    name: 'Essam El Hadary',
    arabicName: 'عصام الحضري',
    position: 'GK',
    era: '1996–2008',
    description:
      'Essam El Hadary is a goalkeeper whose international career included four Africa Cup of Nations titles with Egypt.',
    achievements: [
      'Four-time Africa Cup of Nations winner with Egypt',
      'Named AFCON best goalkeeper in 2006, 2008, and 2010',
    ],
    isLegend: true,
    source:
      'https://english.ahram.org.eg/NewsContent/6/51/89377/Sports/Egyptian-Football/FACTBOX-Career-highlights-of-Essam-ElHadary.aspx',
  },
  {
    id: 'wael-gomaa',
    name: 'Wael Gomaa',
    arabicName: 'وائل جمعة',
    position: 'CB',
    era: '2000s',
    description:
      'Wael Gomaa was a centre-back in Al Ahly’s mid-2000s side that reached four consecutive CAF Champions League finals and won three of them.',
    achievements: [
      'Reached four consecutive CAF Champions League finals with Al Ahly',
      'Won three CAF Champions League titles in that run',
    ],
    isLegend: true,
    source:
      'https://www.cafonline.com/caf-champions-league/news/caf-cl-sundowns-stun-mighty-ahly-with-five-goal-triumph/',
  },
  {
    id: 'mohamed-aboutrika',
    name: 'Mohamed Aboutrika',
    arabicName: 'محمد أبو تريكة',
    position: 'Attacking player',
    era: '2004–2013',
    description:
      'Mohamed Aboutrika joined Al Ahly in 2004. At the 2006 FIFA Club World Cup, he was top scorer as Al Ahly won bronze.',
    achievements: [
      'Top scorer at the 2006 FIFA Club World Cup',
      'Helped Al Ahly win FIFA Club World Cup bronze in 2006',
    ],
    isLegend: true,
    source:
      'https://www.fifa.com/en/articles/aboutrika-bags-al-ahly-bronze-japan-2006-great-fifa-club-world-cup-moments',
  },
  {
    id: 'emad-moteab',
    name: 'Emad Moteab',
    arabicName: 'عماد متعب',
    position: 'Striker',
    era: '2000s–2010s',
    description:
      'Emad Moteab scored Al Ahly’s first-ever FIFA Club World Cup goal in 2005.',
    achievements: ['Scored Al Ahly’s first FIFA Club World Cup goal in 2005'],
    isLegend: true,
    source:
      'https://www.fifa.com/en/tournaments/mens/fifa-club-world-cup/saudi-arabia-2023/articles/moteab',
  },
  {
    id: 'mohamed-el-shenawy',
    name: 'Mohamed El Shenawy',
    arabicName: 'محمد الشناوي',
    position: 'GK',
    era: '2017–present',
    description:
      'Mohamed El Shenawy captained Al Ahly and matched the FIFA Club World Cup record of four clean sheets in 2023.',
    achievements: ['Matched the FIFA Club World Cup record of four clean sheets'],
    isLegend: true,
    source:
      'https://www.fifa.com/en/tournaments/mens/club-world-cup/morocco-2022/teams/al-ahly-fc/articles/ahly-banking-on-more-elshenawy-heroics',
  },
  {
    id: 'ali-maaloul',
    name: 'Ali Maaloul',
    arabicName: 'علي معلول',
    position: 'Defender',
    era: '2016–present',
    description:
      'Ali Maaloul joined Al Ahly in 2016. FIFA credits him with 18 titles at the club.',
    achievements: ['FIFA credits 18 titles with Al Ahly'],
    isLegend: true,
    source:
      'https://www.fifa.com/en/tournaments/mens/club-world-cup/usa-2025/articles/al-ahly-club-profile-history-players-qualified',
  },
  {
    id: 'hussein-elshahat',
    name: 'Hussein Elshahat',
    arabicName: 'حسين الشحات',
    position: 'Midfielder',
    era: '2020s',
    description:
      'Hussein Elshahat became the first player to reach 15 FIFA Club World Cup appearances and later reached 16 FIFA club-tournament matches.',
    achievements: ['First player to reach 15 FIFA Club World Cup appearances'],
    isLegend: true,
    source:
      'https://www.fifa.com/en/tournaments/mens/club-world-cup/saudi-arabia-2023/articles/appearances-goals-records-statistics',
  },
]

const EDITORIAL_SOURCE =
  'User-curated Featured Generation draft — individual match-lineup claims require official verification.'

function editorialPlayer(
  id: string,
  name: string,
  arabicName: string,
  position: string,
  era: string,
): LegendPlayer {
  return {
    id,
    name,
    arabicName,
    position,
    era,
    description:
      'Included in a user-curated Featured Generation. This presentation is not a verified historical starting XI.',
    isLegend: true,
    source: EDITORIAL_SOURCE,
  }
}

const editorialLegendPlayers: LegendPlayer[] = [
  editorialPlayer('ahmed-fouad-anwar', 'Ahmed Fouad Anwar', 'أحمد فؤاد أنور', 'Captain', '1910s–1920s'),
  editorialPlayer('hussein-hegazi', 'Hussein Hegazi', 'حسين حجازي', 'Forward', '1910s–1920s'),
  editorialPlayer('ali-el-husseiny', 'Ali El Husseiny', 'علي الحسيني', 'Player', '1910s–1920s'),
  editorialPlayer('hussein-sabry', 'Hussein Sabry', 'حسين صبري', 'Player', '1910s–1920s'),
  editorialPlayer('saleh-el-wahsh-player', 'Saleh El Wahsh', 'صالح الوحش', 'Player', '1930s–1940s'),
  editorialPlayer('hussein-madkour', 'Hussein Madkour', 'حسين مدكور', 'Player', '1930s–1940s'),
  editorialPlayer('ahmed-mekawy', 'Ahmed Mekawy', 'أحمد مكاوي', 'Player', '1930s–1960s'),
  editorialPlayer('el-tohamy', 'El Tohamy', 'التهامي', 'Player', '1930s–1940s'),
  editorialPlayer('el-dazwy', 'El Dazwy', 'الضظوي', 'Forward', '1930s–1960s'),
  editorialPlayer('adel-heikal', 'Adel Heikal', 'عادل هيكل', 'GK', '1950s–1960s'),
  editorialPlayer('saleh-selim-player', 'Saleh Selim', 'صالح سليم', 'Defender', '1950s–1960s'),
  editorialPlayer('rifaat-el-fanagily', 'Rifaat El Fanagily', 'رفعت الفناجيلي', 'Midfielder', '1950s–1960s'),
  editorialPlayer('taha-ismail', 'Taha Ismail', 'طه إسماعيل', 'Midfielder', '1950s–1960s'),
  editorialPlayer('mimi-el-sherbiny', 'Mimi El Sherbiny', 'ميمي الشربيني', 'Midfielder', '1950s–1960s'),
  editorialPlayer('hassan-hamdy-player', 'Hassan Hamdy', 'حسن حمدي', 'Forward', '1950s–1960s'),
  editorialPlayer('ahmed-shobeir', 'Ahmed Shobeir', 'أحمد شوبير', 'GK', '1970s–1990s'),
  editorialPlayer('rabie-yassin', 'Rabie Yassin', 'ربيع ياسين', 'Defender', '1970s–1990s'),
  editorialPlayer('ekramy-el-shahat', 'Ekramy El Shahat', 'إكرامي الشحات', 'Defender', '1970s–1980s'),
  editorialPlayer('ibrahim-hassan', 'Ibrahim Hassan', 'إبراهيم حسن', 'Defender', '1980s–1990s'),
  editorialPlayer('hany-mostafa', 'Hany Mostafa', 'هاني مصطفى', 'Defender', '1970s–1980s'),
  editorialPlayer('magdy-abdelghany', 'Magdy Abdelghany', 'مجدي عبدالغني', 'Midfielder', '1970s–1990s'),
  editorialPlayer('taher-abu-zeid', 'Taher Abu Zeid', 'طاهر أبو زيد', 'Midfielder', '1970s–1990s'),
  editorialPlayer('alaa-mihoub', 'Alaa Mihoub', 'علاء ميهوب', 'Forward', '1970s–1990s'),
  editorialPlayer('zakaria-nassef', 'Zakaria Nassef', 'زكريا ناصف', 'Forward', '1970s–1980s'),
  editorialPlayer('hossam-hassan', 'Hossam Hassan', 'حسام حسن', 'Forward', '1980s–2000s'),
  editorialPlayer('hany-ramzy', 'Hany Ramzy', 'هاني رمزي', 'Defender', '1980s–1990s'),
  editorialPlayer('ayman-shawky', 'Ayman Shawky', 'أيمن شوقي', 'Forward', '1980s–1990s'),
  editorialPlayer('mohamed-ramadan', 'Mohamed Ramadan', 'محمد رمضان', 'Forward', '1980s–1990s'),
  editorialPlayer('wael-riyad', 'Wael Riyad', 'وائل رياض', 'Defender', '1990s–2000s'),
  editorialPlayer('hady-khashaba', 'Hady Khashaba', 'هادي خشبة', 'Defender', '1990s–2000s'),
  editorialPlayer('hossam-ghaly', 'Hossam Ghaly', 'حسام غالي', 'Midfielder', '1990s–2010s'),
  editorialPlayer('khaled-bebo', 'Khaled Bebo', 'خالد بيبو', 'Midfielder', '1990s–2000s'),
  editorialPlayer('mohamed-barakat', 'Mohamed Barakat', 'محمد بركات', 'Midfielder', '2000s'),
  editorialPlayer('ahmed-bilal', 'Ahmed Bilal', 'أحمد بلال', 'Forward', '1990s–2000s'),
  editorialPlayer('alaa-ibrahim', 'Alaa Ibrahim', 'علاء إبراهيم', 'Forward', '1990s–2000s'),
  editorialPlayer('ahmed-fathy', 'Ahmed Fathy', 'أحمد فتحي', 'Defender', '2000s–2010s'),
  editorialPlayer('shady-mohamed', 'Shady Mohamed', 'شادي محمد', 'Defender', '2000s'),
  editorialPlayer('gilberto', 'Gilberto', 'جيلبرتو', 'Defender', '2000s'),
  editorialPlayer('hossam-ashour', 'Hossam Ashour', 'حسام عاشور', 'Midfielder', '2000s–2010s'),
  editorialPlayer('flavio', 'Flavio', 'فلافيو', 'Forward', '2000s'),
  editorialPlayer('osama-hosny', 'Osama Hosny', 'أسامة حسني', 'Forward', '2000s'),
  editorialPlayer('ahmed-hassan', 'Ahmed Hassan', 'أحمد حسن', 'Midfielder', '2000s'),
  editorialPlayer('sayed-moawad', 'Sayed Moawad', 'سيد معوض', 'Defender', '2000s–2010s'),
  editorialPlayer('islam-el-shater', 'Islam El Shater', 'إسلام الشاطر', 'Defender', '2000s'),
  editorialPlayer('sherif-ekramy', 'Sherif Ekramy', 'شريف إكرامي', 'GK', '2010s'),
  editorialPlayer('mohamed-naguib', 'Mohamed Naguib', 'محمد نجيب', 'Defender', '2010s'),
  editorialPlayer('walid-soliman', 'Walid Soliman', 'وليد سليمان', 'Midfielder', '2010s'),
  editorialPlayer('abdallah-el-said', 'Abdallah El Said', 'عبدالله السعيد', 'Midfielder', '2010s'),
  editorialPlayer('mohamed-hany', 'Mohamed Hany', 'محمد هاني', 'Defender', '2010s–2020s'),
  editorialPlayer('badr-benoun', 'Badr Benoun', 'بدر بانون', 'Defender', '2020s'),
  editorialPlayer('ayman-ashraf', 'Ayman Ashraf', 'أيمن أشرف', 'Defender', '2010s–2020s'),
  editorialPlayer('amr-el-solia', 'Amr El Solia', 'عمرو السولية', 'Midfielder', '2010s–2020s'),
  editorialPlayer('aliou-dieng', 'Aliou Dieng', 'أليو ديانج', 'Midfielder', '2020s'),
  editorialPlayer('mohamed-magdy-afsha', 'Mohamed Magdy Afsha', 'محمد مجدي أفشة', 'Midfielder', '2020s'),
  editorialPlayer('mohamed-sherif', 'Mohamed Sherif', 'محمد شريف', 'Forward', '2020s'),
  editorialPlayer('ramy-rabia', 'Ramy Rabia', 'رامي ربيعة', 'Defender', '2020s'),
  editorialPlayer('yasser-ibrahim', 'Yasser Ibrahim', 'ياسر إبراهيم', 'Defender', '2020s'),
  editorialPlayer('marwan-attia', 'Marwan Attia', 'مروان عطية', 'Midfielder', '2020s'),
  editorialPlayer('emam-ashour', 'Emam Ashour', 'إمام عاشور', 'Midfielder', '2020s'),
  editorialPlayer('mahmoud-kahraba', 'Mahmoud Kahraba', 'محمود كهربا', 'Forward', '2020s'),
  editorialPlayer('percy-tau', 'Percy Tau', 'بيرسي تاو', 'Forward', '2020s'),
  editorialPlayer('trezeguet', 'Trezeguet', 'تريزيجيه', 'Forward', '2020s'),
  editorialPlayer('zizo', 'Zizo', 'زيزو', 'Forward', '2020s'),
  editorialPlayer('ahmed-nabil-kouka', 'Ahmed Nabil Kouka', 'أحمد نبيل كوكا', 'Midfielder', '2020s'),
]

export const legendPlayers: LegendPlayer[] = [
  ...verifiedLegendPlayers,
  ...editorialLegendPlayers,
].map((player) => ({
  ...player,
  portrait: legendPortraits[player.id],
}))

export function getLegendPlayer(id: string): LegendPlayer | undefined {
  return legendPlayers.find((player) => player.id === id)
}
