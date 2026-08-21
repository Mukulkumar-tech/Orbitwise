/**
 * Display vocabulary for the domain the API speaks in slugs.
 *
 * The server sends `class_12_pursuing` and `data_analytics`; a student reads
 * "Currently in Class 12" and "Data science & analytics". Keeping the mapping here
 * — and only here — means renaming a label is a one-line change that cannot break
 * a query, and an unknown slug degrades to something readable instead of leaking
 * an identifier into the interface.
 */

/** Turns any unmapped slug into prose rather than showing the raw value. */
/**
 * Turns a slug into readable text.
 *
 * Nullish input returns an empty string rather than throwing. A default
 * parameter only covers undefined, so `humanize(null)` used to raise a
 * TypeError — and several fields that reach these accessors are genuinely
 * nullable (an application snapshot degreeLevel, an unset goal), which made a
 * blank value able to take a whole page down.
 */
const humanize = (slug) =>
  slug == null ? '' : String(slug).replace(/_/g, ' ').replace(/^./, (char) => char.toUpperCase());

const labelFrom = (map) => (slug) => map[slug] ?? humanize(slug);

/* ─── Education ────────────────────────────────────────────────────────────── */

export const EDUCATION_LEVELS = {
  class_10: { label: 'Completed Class 10', hint: 'Class 10 done, Class 11 next' },
  class_11: { label: 'Studying in Class 11', hint: 'Planning ahead for after Class 12' },
  class_12_pursuing: { label: 'Currently in Class 12', hint: 'Results still to come' },
  class_12: { label: 'Completed Class 12', hint: 'Marksheet in hand' },
  diploma: { label: 'Completed a diploma', hint: 'Polytechnic or vocational diploma' },
  bachelors_pursuing: { label: 'Studying for a bachelor’s degree', hint: 'Final year or earlier' },
  bachelors: { label: 'Completed a bachelor’s degree', hint: 'Degree awarded' },
  masters: { label: 'Completed a master’s degree', hint: 'Postgraduate degree awarded' },
};

/** Wizard order — school first, because that is who most often arrives here. */
export const EDUCATION_LEVEL_ORDER = [
  'class_10',
  'class_11',
  'class_12_pursuing',
  'class_12',
  'diploma',
  'bachelors_pursuing',
  'bachelors',
  'masters',
];

export const educationLabel = (slug) => EDUCATION_LEVELS[slug]?.label ?? humanize(slug);

/** Which marksheet the profile should ask for at each level. */
export const marksBasisFor = (level) =>
  ['diploma', 'bachelors_pursuing', 'bachelors', 'masters'].includes(level) ? 'tertiary' : 'secondary';

export const GRADING_SYSTEMS = {
  percentage: { label: 'Percentage', suffix: '%', max: 100, step: 0.1, placeholder: '82.5' },
  cgpa_10: { label: 'CGPA (out of 10)', suffix: 'CGPA', max: 10, step: 0.01, placeholder: '8.4' },
  gpa_4: { label: 'GPA (out of 4)', suffix: 'GPA', max: 4, step: 0.01, placeholder: '3.2' },
};

export const STREAMS = {
  science_pcm: 'Science (PCM)',
  science_pcb: 'Science (PCB)',
  commerce: 'Commerce',
  arts: 'Arts / Humanities',
  vocational: 'Vocational',
  other: 'Other',
};

export const streamLabel = labelFrom(STREAMS);

/* ─── Study goals ──────────────────────────────────────────────────────────── */

export const DEGREE_LEVELS = {
  Foundation: { label: 'Foundation year', hint: 'Pathway into year 1 of a degree' },
  Certificate: { label: 'Certificate', hint: 'Short qualification, often postgraduate' },
  Diploma: { label: 'Diploma', hint: 'Career qualification, 1–3 years' },
  Bachelors: { label: 'Bachelor’s degree', hint: 'The main route after Class 12' },
  Masters: { label: 'Master’s degree', hint: 'After a bachelor’s degree' },
  PhD: { label: 'PhD', hint: 'Doctoral research' },
};

export const degreeLabel = (slug) => DEGREE_LEVELS[slug]?.label ?? humanize(slug);

export const FIELDS = {
  computer_science: 'Computer science & IT',
  engineering: 'Engineering',
  business: 'Business & management',
  data_analytics: 'Data science & analytics',
  health_sciences: 'Health & nursing',
  life_sciences: 'Life sciences & biotech',
  design: 'Design',
  law: 'Law',
  media: 'Media & communications',
  hospitality: 'Hospitality & tourism',
  education: 'Education & teaching',
  environment: 'Environment & sustainability',
};

export const fieldLabel = labelFrom(FIELDS);

/* ─── Money ────────────────────────────────────────────────────────────────── */

export const FUNDING_SOURCES = {
  self: 'Self-funded / savings',
  education_loan: 'Education loan',
  family: 'Family support',
  scholarship: 'Mainly scholarships',
};

export const fundingLabel = labelFrom(FUNDING_SOURCES);

/**
 * Rupees in lakhs, the unit Indian families actually plan in.
 *
 * ₹29,50,000 is four mental steps away from "about thirty lakh"; ₹29.5L is none.
 * Crores take over above a hundred lakh for the same reason.
 */
export const formatInr = (amount) => {
  if (amount == null || Number.isNaN(amount)) return '—';
  if (amount === 0) return '₹0';
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2).replace(/\.00$/, '')}Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1).replace(/\.0$/, '')}L`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

/** Exact rupees, for the one place a total has to be unambiguous. */
export const formatInrExact = (amount) =>
  amount == null ? '—' : `₹${Math.round(amount).toLocaleString('en-IN')}`;

/* ─── English tests ────────────────────────────────────────────────────────── */

export const ENGLISH_TESTS = {
  ielts: { label: 'IELTS', range: [0, 9], step: 0.5, placeholder: '6.5' },
  pte: { label: 'PTE Academic', range: [10, 90], step: 1, placeholder: '58' },
  toefl: { label: 'TOEFL iBT', range: [0, 120], step: 1, placeholder: '79' },
  duolingo: { label: 'Duolingo', range: [10, 160], step: 5, placeholder: '105' },
  planned: { label: 'Not yet — test booked or planned', range: null },
  none: { label: 'Not taken yet', range: null },
};

export const testLabel = (slug) => ENGLISH_TESTS[slug]?.label ?? humanize(slug);

/** True when this test choice expects a score alongside it. */
export const testTakesScore = (slug) => Boolean(ENGLISH_TESTS[slug]?.range);

/* ─── Match presentation ───────────────────────────────────────────────────── */

/**
 * Band styling, mirroring the server's MATCH_BANDS.
 *
 * Colour alone never carries the meaning — every use pairs these classes with the
 * band's label text, so the distinction survives both greyscale and colour
 * blindness.
 */
export const MATCH_BANDS = {
  excellent: { label: 'Excellent match', tone: 'success', ring: 'text-success-600', chip: 'bg-success-50 text-success-700' },
  strong: { label: 'Strong match', tone: 'primary', ring: 'text-primary-600', chip: 'bg-primary-50 text-primary-700' },
  possible: { label: 'Possible match', tone: 'warning', ring: 'text-warning-600', chip: 'bg-warning-50 text-warning-700' },
  ambitious: { label: 'Ambitious match', tone: 'danger', ring: 'text-danger-600', chip: 'bg-danger-50 text-danger-700' },
};

export const bandOf = (key) => MATCH_BANDS[key] ?? MATCH_BANDS.ambitious;

/** How an offer would be made, in words a student can act on. */
export const ROUTE_LABELS = {
  direct: { label: 'Direct entry', tone: 'success', hint: 'You meet the qualification requirement today.' },
  conditional: { label: 'Conditional offer', tone: 'info', hint: 'Apply now; confirmed when your result arrives.' },
  future: { label: 'Opens after your result', tone: 'neutral', hint: 'Plan for it now, apply when you qualify.' },
};

export const routeOf = (route) => ROUTE_LABELS[route] ?? ROUTE_LABELS.direct;

export const VERDICT_STYLES = {
  strong: { bar: 'bg-success-500', text: 'text-success-700' },
  fair: { bar: 'bg-warning-500', text: 'text-warning-700' },
  weak: { bar: 'bg-danger-500', text: 'text-danger-700' },
  unknown: { bar: 'bg-navy-300', text: 'text-navy-500' },
};

export const JOURNEY_STAGE_LABELS = {
  profile: 'Building your profile',
  course_discovery: 'Discovering courses',
  university_shortlist: 'Shortlisting universities',
  documents: 'Preparing documents',
  applications: 'Applying',
  offer_letter: 'Offer received',
  visa: 'Visa stage',
  pre_departure: 'Pre-departure',
  arrival: 'Arrived',
};

export const INTAKE_SEASONS = ['January', 'February', 'April', 'May', 'July', 'September', 'October'];

/** Duration in the unit that reads fastest: months under a year, else years. */
export const formatDuration = (months) => {
  if (!months) return '—';
  if (months < 12) return `${months} months`;
  const years = months / 12;
  return `${Number.isInteger(years) ? years : years.toFixed(1)} year${years === 1 ? '' : 's'}`;
};

/* ─── Counsellor portal ────────────────────────────────────────────────────── */

/**
 * Labels for the staff-facing enums.
 *
 * Kept here with every other slug→label map rather than inline in a component,
 * so a rename is one edit and never a database migration.
 */
export const APPOINTMENT_TYPE_LABELS = {
  counselling: 'General counselling',
  university_selection: 'University selection',
  application_review: 'Application review',
  visa_consultation: 'Visa consultation',
  pre_departure: 'Pre-departure briefing',
};

export const appointmentTypeLabel = (slug) => APPOINTMENT_TYPE_LABELS[slug] ?? humanize(slug);

export const APPOINTMENT_STATUS_LABELS = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

/** Tone per status, so the colour of a booking is decided in one place. */
export const APPOINTMENT_STATUS_TONES = {
  requested: 'warning',
  confirmed: 'success',
  completed: 'neutral',
  cancelled: 'danger',
  no_show: 'danger',
};

export const DOCUMENT_TYPE_LABELS = {
  passport: 'Passport',
  degree_certificate: 'Degree certificate',
  mark_sheets: 'Mark sheets',
  english_test: 'English test score',
  sop: 'Statement of purpose',
  lor: 'Letter of recommendation',
  resume: 'Resume / CV',
  financial: 'Financial documents',
  visa: 'Visa documents',
};

export const documentTypeLabel = (slug) => DOCUMENT_TYPE_LABELS[slug] ?? humanize(slug);

/* ─── Applications ─────────────────────────────────────────────────────────── */

/**
 * Application status labels and tones.
 *
 * Lifted out of the two student pages that each had their own copy once the
 * counsellor's student detail became a third caller. Three copies of a status
 * map is three chances for the same status to render as a different colour.
 *
 * Note the counsellor endpoints read applications with `.lean()`, which skips
 * Mongoose virtuals — so `statusLabel` is absent there and the label has to come
 * from here rather than from the payload.
 */
export const APPLICATION_STATUS_LABELS = {
  draft: 'Draft',
  documents_pending: 'Documents Pending',
  ready_to_apply: 'Ready to Apply',
  submitted: 'Submitted',
  under_review: 'Under Review',
  offer_received: 'Offer Received',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const applicationStatusLabel = (slug) => APPLICATION_STATUS_LABELS[slug] ?? humanize(slug);

/** Terminal outcomes read differently from work in progress. */
export const APPLICATION_STATUS_TONES = {
  draft: 'neutral',
  documents_pending: 'warning',
  ready_to_apply: 'primary',
  submitted: 'info',
  under_review: 'info',
  offer_received: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};

/** Document status → badge tone, mirroring the review workflow's severity. */
export const DOCUMENT_STATUS_TONES = {
  missing: 'neutral',
  uploaded: 'info',
  under_review: 'warning',
  verified: 'success',
  rejected: 'danger',
  expired: 'danger',
};

/* ─── Intakes ──────────────────────────────────────────────────────────────── */

/**
 * Month index per intake season, so "September 2027" can be derived rather than
 * typed. Course.intakes stores season names only — no year — because a course
 * runs the same seasons every year.
 */
const INTAKE_MONTH = { January: 0, February: 1, April: 3, May: 4, July: 6, September: 8, October: 9 };

/**
 * The soonest intake a student could realistically start.
 *
 * Applications need a concrete `{season, year}`, and picking "the first season in
 * the array" would happily return an intake three months in the past. A season
 * whose month has already passed this year resolves to next year instead.
 *
 * `from` is injectable so this is testable without freezing the clock.
 */
export const nextIntake = (seasons = [], from = new Date()) => {
  const candidates = seasons
    .filter((season) => season in INTAKE_MONTH)
    .map((season) => {
      const month = INTAKE_MONTH[season];
      // Same-month counts as still open: applications for a September intake are
      // usually still being processed during September.
      const year = month < from.getMonth() ? from.getFullYear() + 1 : from.getFullYear();
      return { season, year, at: new Date(year, month, 1).getTime() };
    })
    .sort((a, b) => a.at - b.at);

  if (!candidates.length) return null;
  const { season, year } = candidates[0];
  return { season, year };
};
