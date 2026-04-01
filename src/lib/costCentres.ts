/**
 * Cost Centres — augmented version of accounts.ts for the AI-guided picker.
 *
 * Each entry mirrors an account in accounts.ts and adds:
 *   - category: human-readable group name shown in the picker
 *   - keywords: lowercase strings used by the keyword scorer in categoriser.ts
 *
 * Keep ledgerCode values in sync with accounts.ts.
 */

export interface CostCentre {
  id: string         // same as ledgerCode, used as React key
  label: string      // account name
  ledgerCode: string // e.g. '6-1203'
  category: string   // group label shown in picker dropdown
  keywords: string[] // lowercase; matched against transaction description
}

export const COST_CENTRES: CostCentre[] = [
  // ── Memberships ─────────────────────────────────────────────────────────────
  {
    id: '4-0101', ledgerCode: '4-0101', label: 'Memberships - Adult/Senior',
    category: 'Memberships',
    keywords: ['membership', 'adult', 'senior', 'annual fee', 'registration', 'stripe', 'member fee'],
  },
  {
    id: '4-0102', ledgerCode: '4-0102', label: 'Memberships - Pensioner',
    category: 'Memberships',
    keywords: ['membership', 'pensioner', 'pension', 'concession', 'senior'],
  },
  {
    id: '4-0103', ledgerCode: '4-0103', label: 'Memberships - Junior',
    category: 'Memberships',
    keywords: ['membership', 'junior', 'child', 'youth', 'under 18', 'junior member'],
  },
  {
    id: '4-0104', ledgerCode: '4-0104', label: 'Memberships - Family',
    category: 'Memberships',
    keywords: ['membership', 'family', 'household', 'family membership'],
  },
  {
    id: '4-0105', ledgerCode: '4-0105', label: 'Memberships - Student',
    category: 'Memberships',
    keywords: ['membership', 'student', 'university', 'tertiary', 'student member'],
  },

  // ── Social Sessions ──────────────────────────────────────────────────────────
  {
    id: '4-0201', ledgerCode: '4-0201', label: 'Social Sessions - Mondays',
    category: 'Social Sessions',
    keywords: ['social', 'monday', 'session fee', 'gate', 'monday social'],
  },
  {
    id: '4-0202', ledgerCode: '4-0202', label: 'Social Sessions - Wednesday Nights',
    category: 'Social Sessions',
    keywords: ['social', 'wednesday', 'night', 'evening', 'wednesday social'],
  },
  {
    id: '4-0203', ledgerCode: '4-0203', label: 'Social Sessions - Thursday Ladies',
    category: 'Social Sessions',
    keywords: ['social', 'thursday', 'ladies', 'thursday social', 'ladies social'],
  },
  {
    id: '4-0204', ledgerCode: '4-0204', label: 'Social Sessions - Sunday Pickleball',
    category: 'Social Sessions',
    keywords: ['pickleball', 'sunday pickleball', 'pickle ball'],
  },
  {
    id: '4-0205', ledgerCode: '4-0205', label: 'Social Sessions - Fridays',
    category: 'Social Sessions',
    keywords: ['social', 'friday', 'session fee', 'friday social'],
  },
  {
    id: '4-0206', ledgerCode: '4-0206', label: 'Social Sessions - Friday Nights',
    category: 'Social Sessions',
    keywords: ['social', 'friday night', 'friday evening', 'night social'],
  },
  {
    id: '4-0207', ledgerCode: '4-0207', label: 'Social Sessions - Sundays',
    category: 'Social Sessions',
    keywords: ['social', 'sunday', 'session fee', 'sunday social'],
  },

  // ── Pennants (income) ────────────────────────────────────────────────────────
  {
    id: '4-0301', ledgerCode: '4-0301', label: 'Pennants - Tennis West Fees',
    category: 'Pennants',
    keywords: ['pennants', 'tennis west', 'team fee', 'competition', 'pennant fee'],
  },
  {
    id: '4-0302', ledgerCode: '4-0302', label: 'Pennants - Amenities/Ball Fees',
    category: 'Pennants',
    keywords: ['pennants', 'ball fee', 'amenities', 'pennant ball', 'competition fee'],
  },

  // ── Tournaments (income) ─────────────────────────────────────────────────────
  {
    id: '4-0401', ledgerCode: '4-0401', label: 'Tournaments - Nomination Fees',
    category: 'Tournaments',
    keywords: ['tournament', 'nomination', 'entry fee', 'comp fee', 'competition entry'],
  },
  {
    id: '4-0402', ledgerCode: '4-0402', label: 'Tournaments - Canteen Sales',
    category: 'Tournaments',
    keywords: ['tournament', 'canteen', 'tournament canteen', 'tournament food'],
  },

  // ── Court Hire ───────────────────────────────────────────────────────────────
  {
    id: '4-0501', ledgerCode: '4-0501', label: 'Court Hire',
    category: 'Court Hire',
    keywords: ['court hire', 'court booking', 'book a court', 'private hire', 'stripe payout', 'stripe', 'clubspark'],
  },
  {
    id: '4-0500', ledgerCode: '4-0500', label: 'Hire of Equipment & Courts',
    category: 'Court Hire',
    keywords: ['equipment hire', 'court hire', 'hire', 'equipment rental'],
  },

  // ── Uniforms ─────────────────────────────────────────────────────────────────
  {
    id: '4-0113', ledgerCode: '4-0113', label: 'Uniforms',
    category: 'Other Income',
    keywords: ['uniform', 'shirt', 'apparel', 'kit', 'clothing', 'polo'],
  },

  // ── Junior Program (income) ──────────────────────────────────────────────────
  {
    id: '4-0604', ledgerCode: '4-0604', label: 'Junior Program - Sponsorship',
    category: 'Junior Program',
    keywords: ['junior', 'sponsorship', 'junior sponsor', 'sponsor donation'],
  },
  {
    id: '4-0606', ledgerCode: '4-0606', label: 'Junior Program - Pennants Fees',
    category: 'Junior Program',
    keywords: ['junior', 'pennants', 'junior pennant', 'junior team fee'],
  },

  // ── Drink Sales ──────────────────────────────────────────────────────────────
  {
    id: '4-4011', ledgerCode: '4-4011', label: 'Drink Sales',
    category: 'Drinks',
    keywords: ['drink', 'drinks', 'canteen', 'bar', 'beverage', 'square', 'soft drink', 'beer', 'wine', 'water', 'juice', 'can', 'bottle', 'sq *sbtc'],
  },

  // ── Surplus Equipment ────────────────────────────────────────────────────────
  {
    id: '4-4101', ledgerCode: '4-4101', label: 'Surplus Equipment - Old Tennis Balls',
    category: 'Other Income',
    keywords: ['surplus', 'old balls', 'used balls', 'second hand', 'equipment sale'],
  },

  // ── Events (income) ──────────────────────────────────────────────────────────
  {
    id: '4-6000', ledgerCode: '4-6000', label: 'Events',
    category: 'Events',
    keywords: ['event', 'function', 'dinner', 'party', 'celebration', 'christmas', 'gala'],
  },
  {
    id: '4-6002', ledgerCode: '4-6002', label: 'Events - Tickets',
    category: 'Events',
    keywords: ['event', 'ticket', 'entry', 'admission', 'event ticket'],
  },
  {
    id: '4-6003', ledgerCode: '4-6003', label: 'Events - Raffles',
    category: 'Events',
    keywords: ['raffle', 'raffle ticket', 'prize draw', 'lottery', 'lucky door'],
  },
  {
    id: '4-6020', ledgerCode: '4-6020', label: 'Events - Fundraising',
    category: 'Events',
    keywords: ['fundraising', 'fundraiser', 'appeal', 'charity', 'building fund', 'levy'],
  },

  // ── Coaching (income) ────────────────────────────────────────────────────────
  {
    id: '4-7002', ledgerCode: '4-7002', label: 'Coaching - Night Hire',
    category: 'Coaching',
    keywords: ['coaching', 'night hire', 'court hire coaching', 'coach court'],
  },
  {
    id: '4-7004', ledgerCode: '4-7004', label: 'Coaching - Lease',
    category: 'Coaching',
    keywords: ['coaching', 'lease', 'coach rent', 'fox tennis', 'karen wenham', 'coach fee', 'coaching rent'],
  },
  {
    id: '4-7007', ledgerCode: '4-7007', label: 'Coaching - Kidsport Income',
    category: 'Coaching',
    keywords: ['kidsport', 'coaching', 'junior kidsport', 'government subsidy', 'active kids'],
  },

  // ── Interest ─────────────────────────────────────────────────────────────────
  {
    id: '4-8001', ledgerCode: '4-8001', label: 'Interest Received',
    category: 'Interest',
    keywords: ['interest', 'term deposit', 'savings interest', 'bank interest', 'investment income', 'td interest', 'asset renewal term deposit interest'],
  },

  // ── Other Income ─────────────────────────────────────────────────────────────
  {
    id: '4-9001', ledgerCode: '4-9001', label: 'Other - Donations (Non-Coaching)',
    category: 'Other Income',
    keywords: ['donation', 'gift', 'contribution', 'benevolent', 'community donation'],
  },
  {
    id: '4-9002', ledgerCode: '4-9002', label: 'Other - Grants',
    category: 'Other Income',
    keywords: ['grant', 'funding', 'government grant', 'council grant', 'city of rockingham', 'lotterywest', 'dept sport'],
  },
  {
    id: '4-9003', ledgerCode: '4-9003', label: 'Other - Miscellaneous',
    category: 'Other Income',
    keywords: ['miscellaneous', 'misc', 'other income', 'refund', 'return', 'ww return recycle', 'recycle'],
  },
  {
    id: '4-9004', ledgerCode: '4-9004', label: 'Other - Sponsorship',
    category: 'Other Income',
    keywords: ['sponsorship', 'sponsor', 'advertising', 'promotion', 'club sponsor'],
  },
  {
    id: '4-4014', ledgerCode: '4-4014', label: 'New Balls',
    category: 'Other Income',
    keywords: ['new balls', 'ball sales', 'tennis balls sale'],
  },

  // ── Cost of Goods ─────────────────────────────────────────────────────────────
  {
    id: '5-1000', ledgerCode: '5-1000', label: 'Cost of Goods - Drinks',
    category: 'Cost of Goods',
    keywords: ['drinks stock', 'bws', 'endeavour', 'liquor', 'beverage purchase', 'drink purchase', 'soft drink purchase', 'cost of goods', 'stock purchase'],
  },

  // ── Junior Program (expenses) ─────────────────────────────────────────────────
  {
    id: '6-0603', ledgerCode: '6-0603', label: 'Junior Program - Event Costs',
    category: 'Junior Program',
    keywords: ['junior', 'event cost', 'junior program', 'kids event'],
  },
  {
    id: '6-0606', ledgerCode: '6-0606', label: 'Junior Program - Pennants Costs',
    category: 'Junior Program',
    keywords: ['junior', 'pennants cost', 'junior pennant', 'team cost'],
  },
  {
    id: '6-0607', ledgerCode: '6-0607', label: 'Junior Program - Pennant Uniform Gift',
    category: 'Junior Program',
    keywords: ['junior', 'uniform gift', 'pennant gift', 'junior uniform'],
  },
  {
    id: '6-0608', ledgerCode: '6-0608', label: 'Junior Program - Balls',
    category: 'Junior Program',
    keywords: ['junior', 'balls', 'junior balls', 'program balls', 'tennis balls junior'],
  },

  // ── Membership Costs ─────────────────────────────────────────────────────────
  {
    id: '6-1101', ledgerCode: '6-1101', label: 'Membership - Affiliations',
    category: 'Memberships',
    keywords: ['affiliation', 'tennis west', 'tennis australia', 'membership fee', 'annual levy', 'ta levy', 'tw levy'],
  },

  // ── Clubhouse ────────────────────────────────────────────────────────────────
  {
    id: '6-1201', ledgerCode: '6-1201', label: 'Clubhouse - Honorarium Cleaning',
    category: 'Clubhouse',
    keywords: ['cleaning', 'honorarium', 'cleaner', 'cleaning fee', 'clubhouse cleaning'],
  },
  {
    id: '6-1202', ledgerCode: '6-1202', label: 'Clubhouse - Repairs & Maintenance',
    category: 'Clubhouse',
    keywords: ['repair', 'maintenance', 'handyman', 'fix', 'clubhouse repair', 'building repair', 'plumber', 'electrician', 'tradie'],
  },
  {
    id: '6-1203', ledgerCode: '6-1203', label: 'Clubhouse - Electricity',
    category: 'Clubhouse',
    keywords: ['electricity', 'synergy', 'power', 'energy', 'utility', 'electric', 'synergy bpay', 'bpay synergy'],
  },
  {
    id: '6-1204', ledgerCode: '6-1204', label: 'Clubhouse - Replacements',
    category: 'Clubhouse',
    keywords: ['replacement', 'equipment replacement', 'furniture', 'fitting', 'new equipment', 'clubhouse equipment'],
  },
  {
    id: '6-1205', ledgerCode: '6-1205', label: 'Clubhouse - Kitchen Consumables',
    category: 'Clubhouse',
    keywords: ['kitchen', 'consumable', 'tea', 'coffee', 'paper towel', 'cleaning supply', 'dishwashing', 'woolworths', 'coles'],
  },
  {
    id: '6-1206', ledgerCode: '6-1206', label: 'Clubhouse - Cleaning Consumables',
    category: 'Clubhouse',
    keywords: ['cleaning', 'consumable', 'bleach', 'mop', 'broom', 'cleaning product', 'disinfectant', 'bunnings cleaning'],
  },
  {
    id: '6-1207', ledgerCode: '6-1207', label: 'Clubhouse - Water',
    category: 'Clubhouse',
    keywords: ['water', 'water corp', 'watercorp', 'water corporation', 'tap', 'waterwise'],
  },
  {
    id: '6-1210', ledgerCode: '6-1210', label: 'Clubhouse - Rates, ESL, Waste & Rent',
    category: 'Clubhouse',
    keywords: ['rates', 'esl', 'waste', 'rent', 'council rates', 'city of rockingham', 'city of rock', 'garbage', 'waste collection', 'rubbish', 'bpay city of rockingham'],
  },
  {
    id: '6-1211', ledgerCode: '6-1211', label: 'Clubhouse - Internet Connection',
    category: 'Clubhouse',
    keywords: ['internet', 'broadband', 'wifi', 'pentanet', 'telstra', 'isp', 'nbn', 'internet plan', 'pentanet direct debit'],
  },
  {
    id: '6-1200', ledgerCode: '6-1200', label: 'Clubhouse - General',
    category: 'Clubhouse',
    keywords: ['clubhouse', 'building', 'general clubhouse'],
  },

  // ── Courts ───────────────────────────────────────────────────────────────────
  {
    id: '6-1302', ledgerCode: '6-1302', label: 'Courts - Repairs & Maintenance',
    category: 'Courts',
    keywords: ['court repair', 'court maintenance', 'resurfacing', 'net repair', 'fence repair', 'court surface', 'tennis court'],
  },
  {
    id: '6-1303', ledgerCode: '6-1303', label: 'Courts - Replacements',
    category: 'Courts',
    keywords: ['court replacement', 'net replacement', 'court equipment replacement', 'posts'],
  },
  {
    id: '6-1350', ledgerCode: '6-1350', label: 'Courts - Book a Court Fees',
    category: 'Courts',
    keywords: ['book a court', 'courtside', 'booking system', 'booking fee', 'platform fee', 'booking software'],
  },

  // ── Grounds ──────────────────────────────────────────────────────────────────
  {
    id: '6-1402', ledgerCode: '6-1402', label: 'Grounds - Consumables',
    category: 'Grounds',
    keywords: ['grounds', 'consumable', 'garden supply', 'landscaping supply', 'gardening', 'mulch', 'soil', 'bunnings grounds'],
  },
  {
    id: '6-1403', ledgerCode: '6-1403', label: 'Grounds - Repairs & Maintenance',
    category: 'Grounds',
    keywords: ['grounds', 'mowing', 'lawn', 'gardening', 'jims mowing', 'mow', 'grass', 'barras', 'barras mowing', 'garden maintenance', 'lawn care'],
  },

  // ── Social Sessions (expenses) ────────────────────────────────────────────────
  {
    id: '6-1501', ledgerCode: '6-1501', label: 'Social Sessions - Balls',
    category: 'Social Sessions',
    keywords: ['social', 'session balls', 'balls social', 'social tennis balls'],
  },

  // ── Pennants (expenses) ───────────────────────────────────────────────────────
  {
    id: '6-1601', ledgerCode: '6-1601', label: 'Pennants - Balls',
    category: 'Pennants',
    keywords: ['pennants', 'competition balls', 'pennant balls'],
  },
  {
    id: '6-1602', ledgerCode: '6-1602', label: 'Pennants - Tennis West Fees',
    category: 'Pennants',
    keywords: ['pennants', 'tennis west', 'competition fee', 'team fee', 'tw fee'],
  },

  // ── Tournaments (expenses) ────────────────────────────────────────────────────
  {
    id: '6-1701', ledgerCode: '6-1701', label: 'Tournaments - Balls',
    category: 'Tournaments',
    keywords: ['tournament', 'competition balls', 'tournament balls'],
  },
  {
    id: '6-1702', ledgerCode: '6-1702', label: 'Tournaments - Trophies/Prizes/Gifts',
    category: 'Tournaments',
    keywords: ['tournament', 'trophy', 'prize', 'gift', 'award', 'perpetual', 'medal', 'voucher'],
  },
  {
    id: '6-1703', ledgerCode: '6-1703', label: 'Tournaments - Canteen Stock',
    category: 'Tournaments',
    keywords: ['tournament', 'canteen stock', 'tournament food', 'refreshment stock'],
  },

  // ── Events (expenses) ─────────────────────────────────────────────────────────
  {
    id: '6-4001', ledgerCode: '6-4001', label: 'Events - Food',
    category: 'Events',
    keywords: ['event', 'food', 'catering', 'meal', 'bbq', 'refreshment', 'event food', 'event catering'],
  },
  {
    id: '6-4002', ledgerCode: '6-4002', label: 'Events - Consumables',
    category: 'Events',
    keywords: ['event', 'consumable', 'decoration', 'paper plate', 'napkin', 'event supply'],
  },
  {
    id: '6-4003', ledgerCode: '6-4003', label: 'Events - Entertainment',
    category: 'Events',
    keywords: ['event', 'entertainment', 'music', 'performer', 'dj', 'band', 'hire entertainment'],
  },
  {
    id: '6-4005', ledgerCode: '6-4005', label: 'Events - Venue Hire',
    category: 'Events',
    keywords: ['event', 'venue hire', 'hall hire', 'room hire', 'function room'],
  },
  {
    id: '6-4020', ledgerCode: '6-4020', label: 'Events - Fundraising Expenses',
    category: 'Events',
    keywords: ['fundraising', 'fundraiser', 'raffle cost', 'prize cost', 'building appeal'],
  },

  // ── Coaching (expenses) ───────────────────────────────────────────────────────
  {
    id: '6-5005', ledgerCode: '6-5005', label: 'Coaching - Kidsport',
    category: 'Coaching',
    keywords: ['kidsport', 'coaching', 'government subsidy', 'active kids', 'sport voucher'],
  },

  // ── Other Expenses ────────────────────────────────────────────────────────────
  {
    id: '6-7003', ledgerCode: '6-7003', label: 'Other - Insurance',
    category: 'Other Expenses',
    keywords: ['insurance', 'premium', 'public liability', 'club insurance', 'tennis australia insurance', 'contents insurance'],
  },
  {
    id: '6-7004', ledgerCode: '6-7004', label: 'Other - Stationery & Postage',
    category: 'Other Expenses',
    keywords: ['stationery', 'postage', 'stamps', 'printing', 'paper', 'envelope', 'office supply'],
  },
  {
    id: '6-7006', ledgerCode: '6-7006', label: 'Other - Committee Costs',
    category: 'Other Expenses',
    keywords: ['committee', 'agm', 'annual general meeting', 'committee expense', 'award night', 'volunteer'],
  },
  {
    id: '6-7007', ledgerCode: '6-7007', label: 'Other - Bank Fees',
    category: 'Other Expenses',
    keywords: ['bank fee', 'service fee', 'account fee', 'merchant fee', 'square fee', 'stripe fee', 'eftpos fee', 'transaction fee', 'monthly fee'],
  },
  {
    id: '6-7008', ledgerCode: '6-7008', label: 'Other - Accountant/Auditor Fees',
    category: 'Other Expenses',
    keywords: ['accountant', 'auditor', 'audit', 'accounting fee', 'bookkeeper', 'tax agent', 'reckon ltd', 'reckon subscription'],
  },
  {
    id: '6-7009', ledgerCode: '6-7009', label: 'Other - Miscellaneous',
    category: 'Other Expenses',
    keywords: ['miscellaneous', 'misc', 'sundry', 'general expense', 'other expense'],
  },
  {
    id: '6-7099', ledgerCode: '6-7099', label: 'Other - Computer Software',
    category: 'Other Expenses',
    keywords: ['software', 'subscription', 'saas', 'computer', 'microsoft', 'google', 'adobe', 'digital', 'app', 'software fee', 'reckon'],
  },
]

/** Quick lookup by ledger code */
export const COST_CENTRE_MAP: Map<string, CostCentre> = new Map(
  COST_CENTRES.map(cc => [cc.ledgerCode, cc])
)

/**
 * Maps Square POS catalog category names → Reckon ledger codes.
 * Derived from the SBTC Square account at Safety Bay Tennis Club.
 * These are the 19 categories returned by GET /v2/catalog/list?types=CATEGORY.
 * Where a mapping exists, treat it as high-confidence ground truth.
 */
export const SQUARE_CATEGORY_MAP: Record<string, string> = {
  'Monday Social':          '4-0201',  // Social Sessions - Mondays
  'Wednesday Night Social': '4-0202',  // Social Sessions - Wednesday Nights
  'Thursday Social':        '4-0203',  // Social Sessions - Thursday Ladies
  'Pickleball':             '4-0204',  // Social Sessions - Sunday Pickleball
  'Friday Social':          '4-0205',  // Social Sessions - Fridays
  'Friday Evening':         '4-0206',  // Social Sessions - Friday Nights
  'Sunday Social':          '4-0207',  // Social Sessions - Sundays
  'Junior Social':          '4-0600',  // Junior Program (parent)
  'Drinks':                 '4-4011',  // Drink Sales
  'Membership Fees':        '4-0101',  // Memberships - Adult/Senior (most common type)
  'Pennant Fees':           '4-0301',  // Pennants - Tennis West Fees
  'Tournaments':            '4-0401',  // Tournaments - Nomination Fees
  'Canteen':                '4-4011',  // Drink Sales (canteen sales = drinks at SBTC)
  'TW Canteen':             '4-0402',  // Tournaments - Canteen Sales
  'Events':                 '4-6000',  // Events
  'Uniforms':               '4-0113',  // Uniforms
  'Balls':                  '4-4014',  // New Balls (income side for POS ball sales)
  'Social Tennis fees':     '4-0200',  // Social Sessions (parent — item name determines sub-code)
  'Fees':                   '4-0200',  // Social Sessions (generic — item name determines sub-code)
}
