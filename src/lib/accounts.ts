export interface Account {
  code: string
  name: string
  type: 'income' | 'cogs' | 'expense'
  parent: string | null
}

export const accounts: Account[] = [
  // INCOME - 4-xxxx
  { code: '4-0101', name: 'Memberships - Adult/Senior',         type: 'income',  parent: '4-0100' },
  { code: '4-0102', name: 'Memberships - Pensioner',            type: 'income',  parent: '4-0100' },
  { code: '4-0103', name: 'Memberships - Junior',               type: 'income',  parent: '4-0100' },
  { code: '4-0104', name: 'Memberships - Family',               type: 'income',  parent: '4-0100' },
  { code: '4-0105', name: 'Memberships - Student',              type: 'income',  parent: '4-0100' },
  { code: '4-0201', name: 'Social Sessions - Mondays',          type: 'income',  parent: '4-0200' },
  { code: '4-0202', name: 'Social Sessions - Wednesday Nights', type: 'income',  parent: '4-0200' },
  { code: '4-0203', name: 'Social Sessions - Thursday Ladies',  type: 'income',  parent: '4-0200' },
  { code: '4-0204', name: 'Social Sessions - Sunday Pickleball',type: 'income',  parent: '4-0200' },
  { code: '4-0205', name: 'Social Sessions - Fridays',          type: 'income',  parent: '4-0200' },
  { code: '4-0206', name: 'Social Sessions - Friday Nights',    type: 'income',  parent: '4-0200' },
  { code: '4-0207', name: 'Social Sessions - Sundays',          type: 'income',  parent: '4-0200' },
  { code: '4-0301', name: 'Pennants - Tennis West Fees',        type: 'income',  parent: '4-0300' },
  { code: '4-0302', name: 'Pennants - Amenities/Ball Fees',     type: 'income',  parent: '4-0300' },
  { code: '4-0401', name: 'Tournaments - Nomination Fees',      type: 'income',  parent: '4-0400' },
  { code: '4-0402', name: 'Tournaments - Canteen Sales',        type: 'income',  parent: '4-0400' },
  { code: '4-0501', name: 'Court Hire',                         type: 'income',  parent: '4-0500' },
  { code: '4-0500', name: 'Hire of Equipment & Courts',         type: 'income',  parent: null },
  { code: '4-0113', name: 'Uniforms',                           type: 'income',  parent: null },
  { code: '4-0604', name: 'Junior Program - Sponsorship',       type: 'income',  parent: '4-0600' },
  { code: '4-0606', name: 'Junior Program - Pennants Fees',     type: 'income',  parent: '4-0600' },
  { code: '4-4011', name: 'Drink Sales',                        type: 'income',  parent: '4-4010' },
  { code: '4-4101', name: 'Surplus Equipment - Old Tennis Balls',type: 'income', parent: '4-4100' },
  { code: '4-6000', name: 'Events',                             type: 'income',  parent: null },
  { code: '4-6002', name: 'Events - Tickets',                   type: 'income',  parent: '4-6000' },
  { code: '4-6003', name: 'Events - Raffles',                   type: 'income',  parent: '4-6000' },
  { code: '4-6020', name: 'Events - Fundraising',               type: 'income',  parent: '4-6000' },
  { code: '4-7002', name: 'Coaching - Night Hire',              type: 'income',  parent: '4-7000' },
  { code: '4-7004', name: 'Coaching - Lease',                   type: 'income',  parent: '4-7000' },
  { code: '4-7007', name: 'Coaching - Kidsport Income',         type: 'income',  parent: '4-7000' },
  { code: '4-8001', name: 'Interest Received',                  type: 'income',  parent: null },
  { code: '4-9001', name: 'Other - Donations (Non-Coaching)',   type: 'income',  parent: '4-9000' },
  { code: '4-9002', name: 'Other - Grants',                     type: 'income',  parent: '4-9000' },
  { code: '4-9003', name: 'Other - Miscellaneous',              type: 'income',  parent: '4-9000' },
  { code: '4-9004', name: 'Other - Sponsorship',                type: 'income',  parent: '4-9000' },
  { code: '4-4014', name: 'New Balls',                          type: 'income',  parent: '4-9000' },

  // COGS - 5-xxxx
  { code: '5-1000', name: 'Cost of Goods - Drinks',             type: 'cogs',    parent: null },

  // EXPENSES - 6-xxxx
  { code: '6-0603', name: 'Junior Program - Event Costs',       type: 'expense', parent: '6-0600' },
  { code: '6-0606', name: 'Junior Program - Pennants Costs',    type: 'expense', parent: '6-0600' },
  { code: '6-0607', name: 'Junior Program - Pennant Uniform Gift', type: 'expense', parent: '6-0600' },
  { code: '6-0608', name: 'Junior Program - Balls',             type: 'expense', parent: '6-0600' },
  { code: '6-1101', name: 'Membership - Affiliations',          type: 'expense', parent: '6-1100' },
  { code: '6-1201', name: 'Clubhouse - Honorarium Cleaning',    type: 'expense', parent: '6-1200' },
  { code: '6-1202', name: 'Clubhouse - Repairs & Maintenance',  type: 'expense', parent: '6-1200' },
  { code: '6-1203', name: 'Clubhouse - Electricity',            type: 'expense', parent: '6-1200' },
  { code: '6-1204', name: 'Clubhouse - Replacements',           type: 'expense', parent: '6-1200' },
  { code: '6-1205', name: 'Clubhouse - Kitchen Consumables',    type: 'expense', parent: '6-1200' },
  { code: '6-1206', name: 'Clubhouse - Cleaning Consumables',   type: 'expense', parent: '6-1200' },
  { code: '6-1207', name: 'Clubhouse - Water',                  type: 'expense', parent: '6-1200' },
  { code: '6-1210', name: 'Clubhouse - Rates, ESL, Waste & Rent', type: 'expense', parent: '6-1200' },
  { code: '6-1211', name: 'Clubhouse - Internet Connection',    type: 'expense', parent: '6-1200' },
  { code: '6-1200', name: 'Clubhouse - General',                type: 'expense', parent: null },
  { code: '6-1302', name: 'Courts - Repairs & Maintenance',     type: 'expense', parent: '6-1300' },
  { code: '6-1303', name: 'Courts - Replacements',              type: 'expense', parent: '6-1300' },
  { code: '6-1350', name: 'Courts - Book a Court Fees',         type: 'expense', parent: '6-1300' },
  { code: '6-1402', name: 'Grounds - Consumables',              type: 'expense', parent: '6-1400' },
  { code: '6-1403', name: 'Grounds - Repairs & Maintenance',    type: 'expense', parent: '6-1400' },
  { code: '6-1501', name: 'Social Sessions - Balls',            type: 'expense', parent: '6-1500' },
  { code: '6-1601', name: 'Pennants - Balls',                   type: 'expense', parent: '6-1600' },
  { code: '6-1602', name: 'Pennants - Tennis West Fees',        type: 'expense', parent: '6-1600' },
  { code: '6-1701', name: 'Tournaments - Balls',                type: 'expense', parent: '6-1700' },
  { code: '6-1702', name: 'Tournaments - Trophies/Prizes/Gifts',type: 'expense', parent: '6-1700' },
  { code: '6-1703', name: 'Tournaments - Canteen Stock',        type: 'expense', parent: '6-1700' },
  { code: '6-4001', name: 'Events - Food',                      type: 'expense', parent: '6-4000' },
  { code: '6-4002', name: 'Events - Consumables',               type: 'expense', parent: '6-4000' },
  { code: '6-4003', name: 'Events - Entertainment',             type: 'expense', parent: '6-4000' },
  { code: '6-4005', name: 'Events - Venue Hire',                type: 'expense', parent: '6-4000' },
  { code: '6-4020', name: 'Events - Fundraising Expenses',      type: 'expense', parent: '6-4000' },
  { code: '6-5005', name: 'Coaching - Kidsport',                type: 'expense', parent: '6-5000' },
  { code: '6-7003', name: 'Other - Insurance',                  type: 'expense', parent: '6-7000' },
  { code: '6-7004', name: 'Other - Stationery & Postage',       type: 'expense', parent: '6-7000' },
  { code: '6-7006', name: 'Other - Committee Costs',            type: 'expense', parent: '6-7000' },
  { code: '6-7007', name: 'Other - Bank Fees',                  type: 'expense', parent: '6-7000' },
  { code: '6-7008', name: 'Other - Accountant/Auditor Fees',    type: 'expense', parent: '6-7000' },
  { code: '6-7009', name: 'Other - Miscellaneous',              type: 'expense', parent: '6-7000' },
  { code: '6-7099', name: 'Other - Computer Software',          type: 'expense', parent: '6-7000' },
]

export const expenseAccounts = accounts.filter(a => a.type === 'expense')
export const incomeAccounts  = accounts.filter(a => a.type === 'income')

/** Formatted label for dropdowns: "6-1203 Clubhouse - Electricity" */
export function accountLabel(account: Account): string {
  return `${account.code} ${account.name}`
}
