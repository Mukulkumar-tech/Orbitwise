import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Counsellor from '../models/Counsellor.js';
import Appointment from '../models/Appointment.js';
import Document from '../models/Document.js';
import { getStorage } from '../services/storage/index.js';
import { ROLES } from '../constants/index.js';
import { DEMO_PASSWORD } from './seedUsers.js';

/**
 * The counsellor's caseload.
 *
 * Without this the counsellor portal seeds into four empty states, which
 * demonstrates nothing: no students to open, no documents to review, no booking
 * request to confirm. The point of the portal is the decisions it surfaces, so
 * the seed has to include something waiting for a decision.
 *
 * Students here are deliberately at different stages — one barely started, one
 * mid-onboarding, one complete with an English score — because the caseload is
 * sorted as a worklist and a list of identical students would not show that.
 */

const MINUTE = 60_000;

/** Mon–Fri, 10:00–17:00. */
const AVAILABILITY = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  dayOfWeek,
  startMinute: 10 * 60,
  endMinute: 17 * 60,
}));

/**
 * A profile for student@orbitwise.dev.
 *
 * `$setOnInsert`, not `$set`: anyone demoing the student portal edits this
 * account, and a reseed that overwrote their answers would be worse than a
 * missing fixture.
 */
const DEMO_STUDENT_PROFILE = {
  education: {
    level: 'bachelors',
    boardOrInstitution: 'Delhi Technological University',
    secondaryMarks: { system: 'percentage', value: 89 },
    tertiaryMarks: { system: 'cgpa', value: 8.4 },
    yearOfCompletion: 2025,
    backlogs: 0,
  },
  goal: { degreeLevel: 'Masters', fields: ['computer_science'], intake: { season: 'September', year: 2026 } },
  destinations: ['CA', 'DE', 'GB'],
  budget: { annualInr: 2_500_000, fundingSource: 'education_loan', needsScholarship: true },
  english: { test: 'ielts', overall: 7.5 },
  work: { years: 1 },
};

const CASELOAD = [
  {
    name: 'Ishita Rao',
    email: 'ishita.rao@orbitwise.dev',
    phone: '+91 90000 10001',
    profile: {
      education: {
        level: 'class_12',
        stream: 'science_pcm',
        boardOrInstitution: 'CBSE',
        secondaryMarks: { system: 'percentage', value: 88 },
        yearOfCompletion: 2026,
      },
      goal: { degreeLevel: 'Bachelors', fields: ['computer_science'], intake: { season: 'September', year: 2027 } },
      destinations: ['CA', 'DE'],
      budget: { annualInr: 2_200_000, fundingSource: 'education_loan', needsScholarship: true },
      english: { test: 'ielts', overall: 7 },
    },
  },
  {
    name: 'Vikram Iyer',
    email: 'vikram.iyer@orbitwise.dev',
    phone: '+91 90000 10002',
    profile: {
      education: {
        level: 'bachelors',
        boardOrInstitution: 'VIT Vellore',
        secondaryMarks: { system: 'percentage', value: 79 },
        tertiaryMarks: { system: 'cgpa', value: 8.1 },
        yearOfCompletion: 2024,
        backlogs: 1,
      },
      goal: { degreeLevel: 'Masters', fields: ['data_analytics'], intake: { season: 'September', year: 2026 } },
      destinations: ['US', 'CA'],
      budget: { annualInr: 3_500_000, fundingSource: 'education_loan' },
      english: { test: 'ielts', overall: 7.5 },
      work: { years: 2 },
    },
  },
  {
    // Barely started on purpose: the worklist sorts the least-complete profile
    // above the finished ones once documents are equal.
    name: 'Sana Qureshi',
    email: 'sana.qureshi@orbitwise.dev',
    phone: '+91 90000 10003',
    profile: {
      education: { level: 'class_12', stream: 'commerce' },
    },
  },
  {
    name: 'Aditya Krishnan',
    email: 'aditya.krishnan@orbitwise.dev',
    phone: '+91 90000 10004',
    profile: {
      education: {
        level: 'bachelors',
        boardOrInstitution: 'Christ University',
        secondaryMarks: { system: 'percentage', value: 91 },
        tertiaryMarks: { system: 'percentage', value: 74 },
        yearOfCompletion: 2025,
      },
      goal: { degreeLevel: 'Masters', fields: ['business'], intake: { season: 'January', year: 2027 } },
      destinations: ['GB', 'IE'],
      budget: { annualInr: 2_800_000, fundingSource: 'family' },
      english: { test: 'planned' },
    },
  },
];

/**
 * The smallest byte sequence a PDF reader will still open.
 *
 * Real bytes rather than a placeholder key, because the review queue's "Open"
 * button streams the file through the authenticated endpoint — a fabricated
 * storageKey would render a working-looking button that 404s.
 */
const stubPdf = (title) =>
  Buffer.from(
    `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n` +
      `2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n` +
      `3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 100]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n` +
      `4 0 obj<</Length 70>>stream\nBT /F1 12 Tf 20 50 Td (${title}) Tj ET\nendstream endobj\n` +
      `5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n` +
      `trailer<</Root 1 0 R>>\n%%EOF\n`,
    'utf8'
  );

/** Next weekday at a given hour, always in the future. */
const nextWeekdayAt = (hour, daysAhead = 1) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const pastWeekdayAt = (hour, daysBack = 7) => {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() - 1);
  date.setHours(hour, 0, 0, 0);
  return date;
};

export async function seedCaseload({ force = false } = {}) {
  const counsellorUser = await User.findOne({ email: 'counsellor@orbitwise.dev' });
  if (!counsellorUser) return { skipped: 'no demo counsellor' };

  // `--force` recreates the demo users with fresh ids, which orphans any
  // Counsellor row still pointing at the previous one. Left behind, it shows up
  // in the bookable list with a dangling user ref.
  const liveUserIds = await User.find({ role: ROLES.COUNSELLOR }).distinct('_id');
  await Counsellor.deleteMany({ user: { $nin: liveUserIds } });

  const existing = await Counsellor.findOne({ user: counsellorUser._id });
  if (existing && !force) return { skipped: 'already seeded', students: existing.assignedStudents.length };
  if (existing) await existing.deleteOne();

  // The demo student shares the caseload, so signing in as either role shows the
  // same relationship from both sides.
  const demoStudent = await User.findOne({ email: 'student@orbitwise.dev' });

  // Keyed by email, never by array position: the fixtures below name the student
  // they belong to, and an index would silently re-point them if the list order
  // ever changed.
  const idByEmail = new Map();
  const studentIds = [];

  if (demoStudent) {
    idByEmail.set(demoStudent.email, demoStudent._id);
    studentIds.push(demoStudent._id);

    // seedUsers creates the account but no profile, which left the flagship demo
    // login reading 0% complete with every field a dash in the counsellor view.
    await StudentProfile.findOneAndUpdate(
      { user: demoStudent._id },
      { $setOnInsert: { user: demoStudent._id, ...DEMO_STUDENT_PROFILE } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  for (const spec of CASELOAD) {
    // `User.create` rather than a query-level write: password hashing lives in a
    // pre-save hook that insertMany/updateOne bypass entirely.
    let user = await User.findOne({ email: spec.email });
    if (!user) {
      user = await User.create({
        name: spec.name,
        email: spec.email,
        phone: spec.phone,
        password: DEMO_PASSWORD,
        role: ROLES.STUDENT,
        isVerified: true,
      });
    }

    await StudentProfile.findOneAndUpdate(
      { user: user._id },
      { $set: { user: user._id, ...spec.profile } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    idByEmail.set(spec.email, user._id);
    studentIds.push(user._id);
  }

  const counsellor = await Counsellor.create({
    user: counsellorUser._id,
    title: 'Senior Education Counsellor',
    bio: 'Fifteen years placing Indian students in Canada, Germany and the UK. Specialises in engineering and data-science admissions, and in the funding side that decides most of them.',
    experienceYears: 15,
    countries: ['CA', 'DE', 'GB', 'US', 'IE'],
    fields: ['computer_science', 'engineering', 'data_analytics', 'business'],
    languages: ['English', 'Hindi', 'Malayalam'],
    availability: AVAILABILITY,
    slotMinutes: 30,
    assignedStudents: studentIds,
    isAcceptingStudents: true,
  });

  /* ─── Something waiting for a decision ─────────────────────────────────── */

  const at = (email) => idByEmail.get(email) ?? null;

  const appointments = [];
  if (at('ishita.rao@orbitwise.dev')) {
    // Unconfirmed on purpose: the dashboard's first job is to surface this.
    const start = nextWeekdayAt(11, 1);
    appointments.push({
      student: at('ishita.rao@orbitwise.dev'),
      counsellor: counsellorUser._id,
      type: 'university_selection',
      status: 'requested',
      startsAt: start,
      endsAt: new Date(start.getTime() + 30 * MINUTE),
      mode: 'video',
      agenda: 'Whether my 7.0 IELTS is enough for the Canadian courses I shortlisted, and what the loan process looks like.',
    });
  }
  if (at('vikram.iyer@orbitwise.dev')) {
    const start = nextWeekdayAt(15, 2);
    appointments.push({
      student: at('vikram.iyer@orbitwise.dev'),
      counsellor: counsellorUser._id,
      type: 'application_review',
      status: 'confirmed',
      startsAt: start,
      endsAt: new Date(start.getTime() + 30 * MINUTE),
      mode: 'video',
      meetingLink: 'https://meet.orbitwise.in/demo-session',
      agenda: 'Reviewing my SOP draft before submission.',
    });
  }
  if (at('sana.qureshi@orbitwise.dev')) {
    const start = pastWeekdayAt(14, 6);
    appointments.push({
      student: at('sana.qureshi@orbitwise.dev'),
      counsellor: counsellorUser._id,
      type: 'counselling',
      status: 'completed',
      startsAt: start,
      endsAt: new Date(start.getTime() + 30 * MINUTE),
      mode: 'phone',
      outcome:
        'Talked through Bachelors pathways in Germany. Next step is a public-university shortlist and the APS certificate timeline.',
    });
  }

  await Appointment.deleteMany({ counsellor: counsellorUser._id });
  if (appointments.length) await Appointment.insertMany(appointments);

  /* ─── A review queue with real files in it ─────────────────────────────── */

  const storage = getStorage();
  const documentSpecs = [
    { student: at('ishita.rao@orbitwise.dev'), type: 'passport', originalName: 'passport-ishita-rao.pdf' },
    { student: at('ishita.rao@orbitwise.dev'), type: 'english_test', originalName: 'ielts-trf-ishita-rao.pdf' },
    { student: at('vikram.iyer@orbitwise.dev'), type: 'mark_sheets', originalName: 'vit-transcript-vikram-iyer.pdf' },
    { student: at('vikram.iyer@orbitwise.dev'), type: 'sop', originalName: 'sop-draft-v2-vikram-iyer.pdf' },
    { student: at('student@orbitwise.dev'), type: 'passport', originalName: 'passport-aarav-sharma.pdf' },
  ].filter((spec) => spec.student);

  const documents = [];
  for (const spec of documentSpecs) {
    const buffer = stubPdf(`Orbitwise demo document — ${spec.originalName}`);
    // A storage failure must not abort the seed: the portal is still usable
    // without a review queue, and on a read-only filesystem this is expected.
    const stored = await storage.put({ buffer, extension: '.pdf', folder: 'documents' }).catch(() => null);
    if (!stored) continue;

    documents.push({
      student: spec.student,
      type: spec.type,
      status: 'uploaded',
      storageKey: stored.key,
      storageProvider: stored.provider,
      originalName: spec.originalName,
      mimeType: 'application/pdf',
      sizeBytes: stored.size,
    });
  }

  if (documents.length) {
    await Document.deleteMany({ student: { $in: studentIds }, status: 'uploaded' });
    await Document.insertMany(documents);
  }

  return {
    students: counsellor.assignedStudents.length,
    appointments: appointments.length,
    documents: documents.length,
  };
}

export default seedCaseload;
