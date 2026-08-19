import { Routes, Route } from 'react-router-dom';

import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import { PATHS, ROLES } from './constants/routes.js';

import PublicLayout from './layouts/PublicLayout.jsx';
import Home from './pages/public/Home.jsx';
import Countries from './pages/public/Countries.jsx';
import CountryDetail from './pages/public/CountryDetail.jsx';
import Universities from './pages/public/Universities.jsx';
import UniversityDetail from './pages/public/UniversityDetail.jsx';
import Courses from './pages/public/Courses.jsx';
import CourseDetail from './pages/public/CourseDetail.jsx';
import Scholarships from './pages/public/Scholarships.jsx';
import CostCalculator from './pages/public/CostCalculator.jsx';
import SuccessStories from './pages/public/SuccessStories.jsx';
import Contact from './pages/public/Contact.jsx';
import ContentPage from './pages/public/ContentPage.jsx';

import SystemStatus from './pages/dev/SystemStatus.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import VerifyEmail from './pages/auth/VerifyEmail.jsx';
import AccountOverview from './pages/account/AccountOverview.jsx';
import StudentLayout from './layouts/StudentLayout.jsx';
import Onboarding from './pages/onboarding/Onboarding.jsx';
import Dashboard from './pages/student/Dashboard.jsx';
import Matches from './pages/student/Matches.jsx';
import Shortlist from './pages/student/Shortlist.jsx';
import Compare from './pages/student/Compare.jsx';
import Applications from './pages/student/Applications.jsx';
import Documents from './pages/student/Documents.jsx';
import ApplicationDetail from './pages/student/ApplicationDetail.jsx';
import Profile from './pages/student/Profile.jsx';
import Forbidden from './pages/Forbidden.jsx';
import NotFound from './pages/NotFound.jsx';

/**
 * Route table.
 *
 * Public marketing routes, the student portal, the counsellor portal and the
 * admin portal mount here behind their own layouts as each phase lands. Route
 * groups become lazily loaded in Phase 13 (code splitting); keeping them eager
 * for now means build output stays readable while the tree is still small.
 */
export default function App() {
  return (
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
        </Route>
      </Route>

      {/* ─── Counsellor ──────────────────────────────────────────────── */}
      <Route element={<RoleRoute roles={[ROLES.COUNSELLOR]} />}>
        <Route path={PATHS.counsellorHome} element={<AccountOverview />} />
      </Route>

      {/* ─── Admin ───────────────────────────────────────────────────── */}
      <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
        <Route path={PATHS.adminHome} element={<AccountOverview />} />
      </Route>

      {/* Any authenticated user, regardless of role. */}
      <Route element={<ProtectedRoute />}>
        <Route path={PATHS.account} element={<AccountOverview />} />
      </Route>

      <Route path={PATHS.forbidden} element={<Forbidden />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
