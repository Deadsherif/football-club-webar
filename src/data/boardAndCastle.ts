export type {
  BoardMemberCard as BoardMember,
} from '@/data/boardMembers'
export { boardMembers } from '@/data/boardMembers'

export interface RedCastleHighlight {
  id: string
  titleEn: string
  titleAr: string
  summaryEn: string
  summaryAr: string
}

export const redCastleHighlights: RedCastleHighlight[] = [
  {
    id: 'identity',
    titleEn: 'El Qalaa El Hamraa',
    titleAr: 'القلعة الحمراء',
    summaryEn:
      'Al Ahly is known as El Qalaa El Hamraa — a symbol of belonging, ambition, and generations of fans.',
    summaryAr:
      'يُعرف الأهلي بالقلعة الحمراء — رمز للانتماء والطموح وأجيال من الجماهير.',
  },
  {
    id: 'home',
    titleEn: 'Home of Champions',
    titleAr: 'موطن الأبطال',
    summaryEn:
      'From Cairo to Africa and the world, El Qalaa El Hamraa is where Al Ahly’s story is written.',
    summaryAr:
      'من القاهرة إلى أفريقيا والعالم، تُكتب قصة الأهلي داخل القلعة الحمراء.',
  },
  {
    id: 'people',
    titleEn: 'More Than a Club',
    titleAr: 'أكثر من نادٍ',
    summaryEn:
      'Players, leaders, and supporters together make El Qalaa El Hamraa more than a stadium or a badge.',
    summaryAr:
      'اللاعبون والقادة والجماهير معًا يجعلون القلعة الحمراء أكثر من ملعب أو شعار.',
  },
]
