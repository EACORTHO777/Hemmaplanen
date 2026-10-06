export const UNITS = ['st', 'kg', 'g'] as const

export const CATEGORIES = [
  'Frukt & grönt',
  'Skafferi',
  'Kaffe',
  'Bakning',
  'Kött & fisk',
  'Mejeri',
  'Frysvaror',
  'Hygien',
  'Hushåll',
  'Leå',
  'Pasta',
  'Ris',
  'Ketchup',
  'Drycker',
  'Njiåm',
] as const

export type Section = {
  title: string
  categories: string[]
}

// Store walking order, same as the old app
export const SECTIONS: Section[] = [
  { title: 'Frukt & grönt / Skafferi mat', categories: ['Frukt & grönt', 'Skafferi'] },
  { title: 'Kaffe / Skafferi bak', categories: ['Kaffe', 'Bakning'] },
  { title: 'Kött & fisk', categories: ['Kött & fisk'] },
  { title: 'Mejeri / Frys', categories: ['Mejeri', 'Frysvaror'] },
  { title: 'Hygien / Hushåll / Leå', categories: ['Hygien', 'Hushåll', 'Leå'] },
  { title: 'Pasta / Ris / Ketchup', categories: ['Pasta', 'Ris', 'Ketchup'] },
  { title: 'Drycker & Njiåm', categories: ['Drycker', 'Njiåm'] },
]
