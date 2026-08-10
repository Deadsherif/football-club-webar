/**
 * Al Ahly Club Board of Directors — roster + portraits from the official site:
 * https://www.alahlyegypt.com/ar/club/board_members
 *
 * Portraits stored in public/assets/board/ (fetched from board.alahlyegypt.com).
 */

import type { President } from '@/data/presidents'

/**
 * Board members reuse the presidents card model (same mesh, flip, focus, HUD).
 * `yearsLabel` carries the role title; `cardEyebrow` labels the front face.
 */
export interface BoardMemberCard extends President {
  roleEn: string
  roleAr: string
}

export const boardMembers: BoardMemberCard[] = [
  {
    id: 'mahmoud-el-khatib',
    name: 'Mahmoud El Khatib',
    arabicName: 'محمود الخطيب',
    startYear: 2017,
    endYear: null,
    yearsLabel: 'Club President',
    roleEn: 'Al Ahly Club President',
    roleAr: 'رئيس النادي الأهلي',
    portrait: '/assets/board/mahmoud-el-khatib.jpg',
    cardEyebrow: 'AL AHLY BOARD',
    currentBadge: 'CLUB PRESIDENT',
    description:
      'Captain Mahmoud El Khatib — President of Al Ahly Sporting Club and head of the Board of Directors.',
    source: 'alahlyegypt.com/ar/club/board_members',
  },
  {
    id: 'yasseen-mansour',
    name: 'Yasseen Mansour',
    arabicName: 'ياسين منصور',
    startYear: 0,
    endYear: 0,
    yearsLabel: 'Vice President',
    roleEn: 'Vice President',
    roleAr: 'نائب رئيس مجلس الإدارة',
    portrait: '/assets/board/yasseen-mansour.jpg',
    cardEyebrow: 'AL AHLY BOARD',
    description:
      'Mr. Yasseen Mansour — Vice President of the Al Ahly Club Board of Directors.',
    source: 'alahlyegypt.com/ar/club/board_members',
  },
  {
    id: 'khaled-mortagy',
    name: 'Khaled Mortagy',
    arabicName: 'خالد مرتجي',
    startYear: 0,
    endYear: 0,
    yearsLabel: 'Treasurer',
    roleEn: 'Treasurer',
    roleAr: 'أمين الصندوق',
    portrait: '/assets/board/khaled-mortagy.jpg',
    cardEyebrow: 'AL AHLY BOARD',
    description:
      'Eng. Khaled Mortagy — Treasurer of the Al Ahly Club Board of Directors.',
    source: 'alahlyegypt.com/ar/club/board_members',
  },
  {
    id: 'tarek-kandil',
    name: 'Tarek Kandil',
    arabicName: 'طارق قنديل',
    startYear: 0,
    endYear: 0,
    yearsLabel: 'Board Member',
    roleEn: 'Board Member',
    roleAr: 'عضو مجلس إدارة',
    portrait: '/assets/board/tarek-kandil.jpg',
    cardEyebrow: 'AL AHLY BOARD',
    description: 'Mr. Tarek Kandil — Member of the Al Ahly Club Board of Directors.',
    source: 'alahlyegypt.com/ar/club/board_members',
  },
  {
    id: 'mohamed-el-ghazawy',
    name: 'Mohamed El Ghazawy',
    arabicName: 'محمد الغزاوي',
    startYear: 0,
    endYear: 0,
    yearsLabel: 'Board Member',
    roleEn: 'Board Member',
    roleAr: 'عضو مجلس إدارة',
    portrait: '/assets/board/mohamed-el-ghazawy.jpg',
    cardEyebrow: 'AL AHLY BOARD',
    description:
      'Mr. Mohamed El Ghazawy — Member of the Al Ahly Club Board of Directors.',
    source: 'alahlyegypt.com/ar/club/board_members',
  },
  {
    id: 'mohamed-el-damaty',
    name: 'Mohamed El Damaty',
    arabicName: 'محمد الدماطي',
    startYear: 0,
    endYear: 0,
    yearsLabel: 'Board Member',
    roleEn: 'Board Member',
    roleAr: 'عضو مجلس إدارة',
    portrait: '/assets/board/mohamed-el-damaty.jpg',
    cardEyebrow: 'AL AHLY BOARD',
    description:
      'Mr. Mohamed El Damaty — Member of the Al Ahly Club Board of Directors.',
    source: 'alahlyegypt.com/ar/club/board_members',
  },
  {
    id: 'mohamed-el-garhy',
    name: 'Mohamed El Garhy',
    arabicName: 'محمد الجارحي',
    startYear: 0,
    endYear: 0,
    yearsLabel: 'Board Member',
    roleEn: 'Board Member',
    roleAr: 'عضو مجلس إدارة',
    portrait: '/assets/board/mohamed-el-garhy.jpg',
    cardEyebrow: 'AL AHLY BOARD',
    description:
      'Mr. Mohamed El Garhy — Member of the Al Ahly Club Board of Directors.',
    source: 'alahlyegypt.com/ar/club/board_members',
  },
  {
    id: 'sayed-abdelhafiz',
    name: 'Sayed Abdelhafiz',
    arabicName: 'سيد عبد الحفيظ',
    startYear: 0,
    endYear: 0,
    yearsLabel: 'Board Member',
    roleEn: 'Board Member',
    roleAr: 'عضو مجلس إدارة',
    portrait: '/assets/board/sayed-abdelhafiz.jpg',
    cardEyebrow: 'AL AHLY BOARD',
    description:
      'Captain Sayed Abdelhafiz — Member of the Al Ahly Club Board of Directors.',
    source: 'alahlyegypt.com/ar/club/board_members',
  },
  {
    id: 'hazem-hilal',
    name: 'Hazem Hilal',
    arabicName: 'حازم هلال',
    startYear: 0,
    endYear: 0,
    yearsLabel: 'Board Member',
    roleEn: 'Board Member',
    roleAr: 'عضو مجلس إدارة',
    portrait: '/assets/board/hazem-hilal.jpg',
    cardEyebrow: 'AL AHLY BOARD',
    description: 'Mr. Hazem Hilal — Member of the Al Ahly Club Board of Directors.',
    source: 'alahlyegypt.com/ar/club/board_members',
  },
  {
    id: 'ahmed-hossam-awad',
    name: 'Ahmed Hossam Awad',
    arabicName: 'أحمد حسام عوض',
    startYear: 0,
    endYear: 0,
    yearsLabel: 'Board Member',
    roleEn: 'Board Member',
    roleAr: 'عضو مجلس إدارة',
    portrait: '/assets/board/ahmed-hossam-awad.jpg',
    cardEyebrow: 'AL AHLY BOARD',
    description:
      'Eng. Ahmed Hossam Awad — Member of the Al Ahly Club Board of Directors.',
    source: 'alahlyegypt.com/ar/club/board_members',
  },
  {
    id: 'ibrahim-elamry-farouk',
    name: 'Ibrahim Elamry Farouk',
    arabicName: 'إبراهيم العامري فاروق',
    startYear: 0,
    endYear: 0,
    yearsLabel: 'Board Member',
    roleEn: 'Board Member',
    roleAr: 'عضو مجلس إدارة',
    portrait: '/assets/board/ibrahim-elamry-farouk.jpg',
    cardEyebrow: 'AL AHLY BOARD',
    description:
      'Mr. Ibrahim Elamry Farouk — Member of the Al Ahly Club Board of Directors.',
    source: 'alahlyegypt.com/ar/club/board_members',
  },
  {
    id: 'roweida-hesham',
    name: 'Roweida Hesham',
    arabicName: 'رويدا هشام',
    startYear: 0,
    endYear: 0,
    yearsLabel: 'Board Member',
    roleEn: 'Board Member',
    roleAr: 'عضو مجلس إدارة',
    portrait: '/assets/board/roweida-hesham.jpg',
    cardEyebrow: 'AL AHLY BOARD',
    description:
      'Ms. Roweida Hesham — Member of the Al Ahly Club Board of Directors.',
    source: 'alahlyegypt.com/ar/club/board_members',
  },
]

export function getBoardMemberById(id: string): BoardMemberCard | undefined {
  return boardMembers.find((m) => m.id === id)
}

export function getBoardMemberIndex(id: string): number {
  return boardMembers.findIndex((m) => m.id === id)
}
