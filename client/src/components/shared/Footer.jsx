import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';

import Logo from './Logo.jsx';
import { PATHS } from '../../constants/routes.js';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { label: 'Study abroad', to: PATHS.studyAbroad },
      { label: 'Destinations', to: PATHS.countries },
      { label: 'Universities', to: PATHS.universities },
      { label: 'Courses', to: PATHS.courses },
    ],
  },
  {
    title: 'Prepare',
    links: [
      { label: 'IELTS', to: PATHS.testPrep('ielts') },
      { label: 'PTE', to: PATHS.testPrep('pte') },
      { label: 'TOEFL', to: PATHS.testPrep('toefl') },
      { label: 'Student visa', to: PATHS.visa },
      { label: 'PR pathways', to: PATHS.pr },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Orbitwise', to: PATHS.about },
      { label: 'Success stories', to: PATHS.successStories },
      { label: 'Book counselling', to: PATHS.contact },
      { label: 'Sign in', to: PATHS.login },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-navy-300">
      <div className="container-page py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Logo tone="light" />
            <p className="mt-5 text-sm leading-relaxed text-navy-400">
              Orbitwise helps students discover, plan and complete their study-abroad journey — with matches based on
              your actual marks, budget and goals, not a brochure.
            </p>

            <ul className="mt-7 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary-400" aria-hidden="true" />
                <a href="mailto:hello@orbitwise.dev" className="transition-colors hover:text-white">
                  hello@orbitwise.dev
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary-400" aria-hidden="true" />
                <a href="tel:+919000000000" className="transition-colors hover:text-white">
                  +91 90000 00000
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary-400" aria-hidden="true" />
                <span>India · counselling available online</span>
              </li>
            </ul>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-2xs font-semibold tracking-wider text-white uppercase">{column.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="text-sm transition-colors duration-150 hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-7 text-xs text-navy-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Orbitwise. Built as a portfolio demonstration.</p>
          <p>
            Tuition and living costs are indicative planning figures. Always confirm current fees with the university
            before applying.
          </p>
        </div>
      </div>
    </footer>
  );
}
