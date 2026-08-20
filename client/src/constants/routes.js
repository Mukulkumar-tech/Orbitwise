export const ROLES = {
  STUDENT: 'student',
  COUNSELLOR: 'counsellor',
  ADMIN: 'admin',
};

/** Named paths, so a route rename never means grepping for string literals. */
export const PATHS = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: (token = ':token') => `/reset-password/${token}`,
  verifyEmail: (token = ':token') => `/verify-email/${token}`,
  forbidden: '/403',
  account: '/account',

  // ─── Public site ──────────────────────────────────────────────────────────
  studyAbroad: '/study-abroad',
  countries: '/countries',
  country: (slug = ':slug') => `/countries/${slug}`,
  universities: '/universities',
  university: (slug = ':slug') => `/universities/${slug}`,
  courses: '/courses',
  course: (slug = ':slug') => `/courses/${slug}`,
  scholarships: '/scholarships',
  costCalculator: '/cost-calculator',
  successStories: '/success-stories',
  about: '/about',
  contact: '/contact',
  testPrep: (test = ':test') => `/test-prep/${test}`,
  visa: '/visa',
  pr: '/pr',
  systemStatus: '/dev/status',

  onboarding: '/onboarding',
  studentHome: '/app',
  studentCourses: '/app/courses',
  studentShortlist: '/app/shortlist',
  studentCompare: '/app/compare',
  studentApplications: '/app/applications',
  studentDocuments: '/app/documents',
  application: (id = ':id') => `/app/applications/${id}`,
  studentProfile: '/app/profile',
  studentAppointments: '/app/appointments',
  studentBookSession: '/app/appointments/book',

  // ─── Counsellor portal ────────────────────────────────────────
  counsellorHome: '/counsellor',
  counsellorStudents: '/counsellor/students',
  counsellorStudent: (id = ':id') => `/counsellor/students/${id}`,
  counsellorReview: '/counsellor/review',
  counsellorAppointments: '/counsellor/appointments',

  // ─── Admin portal ───────────────────────────────────────────
  adminHome: '/admin',
  adminStudents: '/admin/students',
  adminCounsellors: '/admin/counsellors',
  adminEnquiries: '/admin/enquiries',
};

/** Where a user lands after signing in. */
export const homeForRole = (role) =>
  ({
    [ROLES.ADMIN]: PATHS.adminHome,
    [ROLES.COUNSELLOR]: PATHS.counsellorHome,
    [ROLES.STUDENT]: PATHS.studentHome,
  })[role] ?? PATHS.home;
