import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import { PATHS, ROLES } from './constants/routes.js';

import PublicLayout from './layouts/PublicLayout.jsx';
import Home from './pages/public/Home.jsx';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import { ADMIN_NAV, COUNSELLOR_NAV } from './layouts/portalNav.js';
import Forbidden from './pages/Forbidden.jsx';
import NotFound from './pages/NotFound.jsx';
import RouteFallback from './components/shared/RouteFallback.jsx';


/**
 * Everything past the front door loads on demand.
 *
 * Eager above: the layout, the homepage and the two auth forms — the path a
 * first-time visitor actually takes. A public visitor should not download the
 * student portal to read a country guide, and a student should not download the
 * staff portals at all (split separately below).
 */
const Countries = lazy(() => import('./pages/public/Countries.jsx'));
const CountryDetail = lazy(() => import('./pages/public/CountryDetail.jsx'));
const Universities = lazy(() => import('./pages/public/Universities.jsx'));
const UniversityDetail = lazy(() => import('./pages/public/UniversityDetail.jsx'));
const Courses = lazy(() => import('./pages/public/Courses.jsx'));
const CourseDetail = lazy(() => import('./pages/public/CourseDetail.jsx'));
const Scholarships = lazy(() => import('./pages/public/Scholarships.jsx'));
const CostCalculator = lazy(() => import('./pages/public/CostCalculator.jsx'));
const SuccessStories = lazy(() => import('./pages/public/SuccessStories.jsx'));
const Contact = lazy(() => import('./pages/public/Contact.jsx'));
const ContentPage = lazy(() => import('./pages/public/ContentPage.jsx'));
const SystemStatus = lazy(() => import('./pages/dev/SystemStatus.jsx'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail.jsx'));
const AccountOverview = lazy(() => import('./pages/account/AccountOverview.jsx'));
const StudentLayout = lazy(() => import('./layouts/StudentLayout.jsx'));
const Onboarding = lazy(() => import('./pages/onboarding/Onboarding.jsx'));
const Dashboard = lazy(() => import('./pages/student/Dashboard.jsx'));
const Matches = lazy(() => import('./pages/student/Matches.jsx'));
const Shortlist = lazy(() => import('./pages/student/Shortlist.jsx'));
const Compare = lazy(() => import('./pages/student/Compare.jsx'));
const Applications = lazy(() => import('./pages/student/Applications.jsx'));
const Documents = lazy(() => import('./pages/student/Documents.jsx'));
const ApplicationDetail = lazy(() => import('./pages/shared/ApplicationDetail.jsx'));
const Profile = lazy(() => import('./pages/student/Profile.jsx'));
const BookSession = lazy(() => import('./pages/student/BookSession.jsx'));
const Appointments = lazy(() => import('./pages/shared/Appointments.jsx'));

/**
 * The staff portals load on demand.
 *
 * Recharts alone is ~432 KB, and a student will never open a screen that uses
 * it. Imported statically these would sit in the entry graph and every visitor
 * would pay for them, so the whole counsellor and admin surface is split behind
 * lazy() and rendered inside one Suspense boundary.
 */
const PortalLayout = lazy(() => import('./layouts/PortalLayout.jsx'));
const CounsellorDashboard = lazy(() => import('./pages/counsellor/Dashboard.jsx'));
const CounsellorStudents = lazy(() => import('./pages/counsellor/Students.jsx'));
const CounsellorStudentDetail = lazy(() => import('./pages/counsellor/StudentDetail.jsx'));
const ReviewQueue = lazy(() => import('./pages/counsellor/ReviewQueue.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminStudents = lazy(() => import('./pages/admin/Students.jsx'));
const AdminCounsellors = lazy(() => import('./pages/admin/Counsellors.jsx'));
const AdminEnquiries = lazy(() => import('./pages/admin/Enquiries.jsx'));

/**
 * Route table.
 *
 * Public marketing routes and the student portal load eagerly — they are the
 * paths a first-time visitor takes. The staff portals are split out above.
 */
export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* ─── Public marketing site ───────────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path={PATHS.home} element={<Home />} />
          <Route path={PATHS.studyAbroad} element={<ContentPage contentKey="study-abroad" />} />
          <Route path={PATHS.countries} element={<Countries />} />
          <Route path={PATHS.country()} element={<CountryDetail />} />
          <Route path={PATHS.universities} element={<Universities />} />
          <Route path={PATHS.university()} element={<UniversityDetail />} />
          <Route path={PATHS.courses} element={<Courses />} />
          <Route path={PATHS.course()} element={<CourseDetail />} />
          <Route path={PATHS.scholarships} element={<Scholarships />} />
          <Route path={PATHS.costCalculator} element={<CostCalculator />} />
          <Route path={PATHS.successStories} element={<SuccessStories />} />
          <Route path={PATHS.about} element={<ContentPage contentKey="about" />} />
          <Route path={PATHS.contact} element={<Contact />} />
          <Route path={PATHS.testPrep()} element={<ContentPage />} />
          <Route path={PATHS.visa} element={<ContentPage contentKey="visa" />} />
          <Route path={PATHS.pr} element={<ContentPage contentKey="pr" />} />
        </Route>

        {/* Phase 1 scaffolding, kept for diagnosing the API and design tokens. */}
        <Route path={PATHS.systemStatus} element={<SystemStatus />} />

        {/* ─── Authentication ──────────────────────────────────────────── */}
        <Route path={PATHS.login} element={<Login />} />
        <Route path={PATHS.register} element={<Register />} />
        <Route path={PATHS.forgotPassword} element={<ForgotPassword />} />
        <Route path={PATHS.resetPassword()} element={<ResetPassword />} />
        <Route path={PATHS.verifyEmail()} element={<VerifyEmail />} />

        {/* ─── Student ─────────────────────────────────────────────────── */}
        <Route element={<RoleRoute roles={[ROLES.STUDENT]} />}>
          {/* Onboarding sits outside the portal shell on purpose: a student with no
              profile has nothing to navigate to yet, and a sidebar full of empty
              destinations is a worse first impression than a single focused task. */}
          <Route path={PATHS.onboarding} element={<Onboarding />} />

          <Route element={<StudentLayout />}>
            <Route path={PATHS.studentHome} element={<Dashboard />} />
            <Route path={PATHS.studentCourses} element={<Matches />} />
            <Route path={PATHS.studentShortlist} element={<Shortlist />} />
            <Route path={PATHS.studentCompare} element={<Compare />} />
            <Route path={PATHS.studentApplications} element={<Applications />} />
            <Route path={PATHS.studentDocuments} element={<Documents />} />
            <Route path={PATHS.application()} element={<ApplicationDetail />} />
            <Route path={PATHS.studentProfile} element={<Profile />} />
            <Route path={PATHS.studentBookSession} element={<BookSession />} />
            <Route path={PATHS.studentAppointments} element={<Appointments />} />
          </Route>
        </Route>

        {/* ─── Counsellor ──────────────────────────────────────────────── */}
        <Route element={<RoleRoute roles={[ROLES.COUNSELLOR]} />}>
          <Route element={<PortalLayout nav={COUNSELLOR_NAV} roleLabel="Counsellor" />}>
            <Route path={PATHS.counsellorHome} element={<CounsellorDashboard />} />
            <Route path={PATHS.counsellorStudents} element={<CounsellorStudents />} />
            <Route path={PATHS.counsellorStudent()} element={<CounsellorStudentDetail />} />
            <Route path={PATHS.counsellorReview} element={<ReviewQueue />} />
            {/* Same component as the student view; the API scopes results by role. */}
            <Route path={PATHS.counsellorAppointments} element={<Appointments />} />
          {/* Same page as the student sees. The server filters
              availableTransitions by role, so the counsellor gets the moves
              only they can make without the client knowing the rule. */}
          <Route
            path={PATHS.counsellorApplication()}
            element={
              <ApplicationDetail
                backTo={PATHS.counsellorStudents}
                backLabel="My students"
                allowPrivateNotes
                audience="staff"
              />
            }
          />
          </Route>
        </Route>

        {/* ─── Admin ───────────────────────────────────────────────────── */}
        <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
          <Route element={<PortalLayout nav={ADMIN_NAV} roleLabel="Admin" />}>
            <Route path={PATHS.adminHome} element={<AdminDashboard />} />
            <Route path={PATHS.adminStudents} element={<AdminStudents />} />
            <Route path={PATHS.adminCounsellors} element={<AdminCounsellors />} />
            <Route path={PATHS.adminEnquiries} element={<AdminEnquiries />} />
          </Route>
        </Route>

        {/* Any authenticated user, regardless of role. */}
        <Route element={<ProtectedRoute />}>
          <Route path={PATHS.account} element={<AccountOverview />} />
        </Route>

        <Route path={PATHS.forbidden} element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
