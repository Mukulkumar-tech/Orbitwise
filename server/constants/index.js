/**
 * Domain vocabulary shared by models, validators, services and seed data.
 *
 * Enums live here rather than inline in schemas so that a status string is
 * defined exactly once across the whole backend.
 */

export const ROLES = {
  STUDENT: 'student',
  COUNSELLOR: 'counsellor',
  ADMIN: 'admin',
};

export const ROLE_VALUES = Object.values(ROLES);

/** Where a student sits in the journey the product is built around. */
export const JOURNEY_STAGES = [
  'profile',
  'course_discovery',
  'university_shortlist',
  'documents',
  'applications',
  'offer_letter',
  'visa',
  'pre_departure',
  'arrival',
];

export const APPLICATION_STATUS = {
  DRAFT: 'draft',
  DOCUMENTS_PENDING: 'documents_pending',
  READY_TO_APPLY: 'ready_to_apply',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  OFFER_RECEIVED: 'offer_received',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
};

export const APPLICATION_STATUS_VALUES = Object.values(APPLICATION_STATUS);

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

/**
 * Legal status transitions.
 *
 * An application is a state machine, not a free-text field. Without this an
 * application could jump from `draft` straight to `offer_received`, and the
 * timeline — which is the student's record of what actually happened — would
 * describe a sequence of events that never occurred.
 *
 * `rejected` and `withdrawn` are terminal by design. Reopening a rejected
 * application would rewrite history; the correct action is a new application.
 */
export const APPLICATION_TRANSITIONS = {
  draft: ['documents_pending', 'ready_to_apply', 'withdrawn'],
  documents_pending: ['ready_to_apply', 'draft', 'withdrawn'],
  ready_to_apply: ['submitted', 'documents_pending', 'withdrawn'],
  submitted: ['under_review', 'withdrawn'],
  under_review: ['offer_received', 'rejected', 'withdrawn'],
  offer_received: ['withdrawn'],
  rejected: [],
  withdrawn: [],
};

export const canTransition = (from, to) => Boolean(APPLICATION_TRANSITIONS[from]?.includes(to));

/** Statuses a student may set themselves; the rest are university outcomes. */
export const STUDENT_SETTABLE_STATUSES = ['draft', 'documents_pending', 'ready_to_apply', 'submitted', 'withdrawn'];

/** Ordered stages the application timeline renders, independent of status. */
export const APPLICATION_STAGES = [
  { key: 'created', label: 'Application started' },
  { key: 'documents', label: 'Documents' },
  { key: 'submitted', label: 'Submitted to university' },
  { key: 'review', label: 'University review' },
  { key: 'decision', label: 'Decision' },
];

export const DOCUMENT_TYPES = [
  'passport',
  'degree_certificate',
  'mark_sheets',
  'english_test',
  'sop',
  'lor',
  'resume',
  'financial',
  'visa',
];

export const DOCUMENT_STATUS = {
  MISSING: 'missing',
  UPLOADED: 'uploaded',
  UNDER_REVIEW: 'under_review',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

export const DOCUMENT_STATUS_VALUES = Object.values(DOCUMENT_STATUS);

export const DOCUMENT_TYPE_LABELS = {
  passport: 'Passport',
  degree_certificate: 'Degree Certificate',
  mark_sheets: 'Mark Sheets',
  english_test: 'English Test Score',
  sop: 'Statement of Purpose',
  lor: 'Letter of Recommendation',
  resume: 'Resume / CV',
  financial: 'Financial Documents',
  visa: 'Visa Documents',
};

/** Statuses only a reviewer may set. A student cannot verify their own passport. */
export const REVIEWABLE_DOCUMENT_STATUSES = [
  DOCUMENT_STATUS.UNDER_REVIEW,
  DOCUMENT_STATUS.VERIFIED,
  DOCUMENT_STATUS.REJECTED,
];

export const ENGLISH_TESTS = ['ielts', 'pte', 'toefl', 'duolingo', 'none', 'planned'];

/**
 * Degree levels, ordered from lowest to highest.
 *
 * Order is load-bearing: eligibility compares indices ("a Class 12 pass reaches
 * Bachelors but not Masters"), so a new level must be inserted at its academic
 * position rather than appended.
 *
 * `Foundation` is the pathway year that carries a student who has not finished
 * Class 12 — or finished it short of a direct-entry requirement — into the first
 * year of a bachelor's degree. It is the whole reason a student still in school
 * has something to see on their dashboard rather than an empty list.
 */
export const DEGREE_LEVELS = ['Foundation', 'Certificate', 'Diploma', 'Bachelors', 'Masters', 'PhD'];

/**
 * Where a student sits in the Indian education system, which is the single most
 * decisive input to a recommendation: it fixes which degree levels they can
 * legally be offered, and therefore what the whole dashboard is about.
 *
 * The `_pursuing` values are not padding. A student in Class 12 can hold a
 * conditional offer for a bachelor's degree months before results exist, and
 * telling them to come back later would be both wrong and useless.
 */
export const EDUCATION_LEVELS = {
  CLASS_10: 'class_10',
  CLASS_11: 'class_11',
  CLASS_12_PURSUING: 'class_12_pursuing',
  CLASS_12: 'class_12',
  DIPLOMA: 'diploma',
  BACHELORS_PURSUING: 'bachelors_pursuing',
  BACHELORS: 'bachelors',
  MASTERS: 'masters',
};

export const EDUCATION_LEVEL_VALUES = Object.values(EDUCATION_LEVELS);

/** Marks arrive in three notations; scoring needs one. See services/academics.js. */
export const GRADING_SYSTEMS = ['percentage', 'cgpa_10', 'gpa_4'];

export const ACADEMIC_STREAMS = ['science_pcm', 'science_pcb', 'commerce', 'arts', 'vocational', 'other'];

/**
 * Course subject areas. Slugs, not display strings — the client owns labels, so
 * renaming "Health sciences" in the UI never means a database migration.
 */
export const STUDY_FIELDS = [
  'computer_science',
  'engineering',
  'business',
  'data_analytics',
  'health_sciences',
  'life_sciences',
  'design',
  'law',
  'media',
  'hospitality',
  'education',
  'environment',
];

export const FUNDING_SOURCES = ['self', 'education_loan', 'family', 'scholarship'];

/**
 * Intake months, in calendar order.
 *
 * April is here because the German academic year has a summer semester starting in
 * April — leaving it out would have forced every German course to declare an
 * intake it does not run.
 */
export const INTAKE_SEASONS = ['January', 'February', 'April', 'May', 'July', 'September', 'October'];

export const APPOINTMENT_TYPES = [
  'counselling',
  'university_selection',
  'application_review',
  'visa_consultation',
  'pre_departure',
];

export const APPOINTMENT_STATUS = ['requested', 'confirmed', 'completed', 'cancelled', 'no_show'];

export const NOTIFICATION_TYPES = [
  'application_update',
  'deadline_reminder',
  'document_verification',
  'scholarship_match',
  'counsellor_message',
  'appointment_reminder',
  'course_recommendation',
];

/** OrbitMatch score bands — used by the API and mirrored in the client. */
export const MATCH_BANDS = [
  { min: 90, label: 'Excellent Match', key: 'excellent' },
  { min: 75, label: 'Strong Match', key: 'strong' },
  { min: 60, label: 'Possible Match', key: 'possible' },
  { min: 0, label: 'Ambitious Match', key: 'ambitious' },
];

export const matchBand = (score) => MATCH_BANDS.find((band) => score >= band.min) ?? MATCH_BANDS.at(-1);
