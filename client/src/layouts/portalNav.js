import { CalendarClock, Inbox, LayoutDashboard, Users } from 'lucide-react';

import { PATHS } from '../constants/routes.js';

/**
 * Sidebar contents for the staff portals.
 *
 * Kept out of `PortalLayout` so the layout stays a shell with no opinion about
 * who is using it, and out of `App.jsx` so adding a screen is one edit next to
 * its route rather than two in unrelated files.
 *
 * `end` on the home entry stops it from matching every nested path — without it
 * "Overview" would stay highlighted while you were three levels into a student.
 */
export const COUNSELLOR_NAV = [
  { to: PATHS.counsellorHome, label: 'Overview', icon: LayoutDashboard, end: true },
  { to: PATHS.counsellorStudents, label: 'My students', icon: Users },
  { to: PATHS.counsellorReview, label: 'Document review', icon: Inbox },
  { to: PATHS.counsellorAppointments, label: 'Appointments', icon: CalendarClock },
];
