/**
 * Institutions, keyed to a country by code.
 *
 * The mix is intentional and is what makes the recommendation engine's output
 * honest: a catalogue of only Toronto and Melbourne would rank every student's
 * matches as "ambitious", while a catalogue of only accessible institutions would
 * never tell a strong student they can reach higher. Each destination therefore
 * carries a selective institution, a mainstream one, and — where Indian students
 * actually go — a college or pathway provider.
 *
 * `acceptanceRate` drives the admission-likelihood scorer, so it is the figure to
 * keep current when this data is refreshed.
 */

export const UNIVERSITIES = [
  // ─── United States ─────────────────────────────────────────────────────────
  {
    name: 'Arizona State University',
    countryCode: 'US',
    city: 'Tempe',
    type: 'public',
    establishedYear: 1885,
    worldRanking: 179,
    acceptanceRate: 88,
    internationalStudentShare: 26,
    applicationFeeInr: 6_500,
    scholarshipAvailable: true,
    description:
      'The largest public university in the United States and consistently first for innovation, with strong engineering, computing and sustainability schools.',
    highlights: ['#1 for innovation, 10 years running', 'Optional-STEM OPT for 3 years', 'Merit aid for international freshers'],
  },
  {
    name: 'Northeastern University',
    countryCode: 'US',
    city: 'Boston',
    type: 'private',
    establishedYear: 1898,
    worldRanking: 187,
    acceptanceRate: 20,
    internationalStudentShare: 31,
    applicationFeeInr: 7_500,
    scholarshipAvailable: true,
    description:
      'Built around co-op: degrees include six-month paid placements with employers, which is why its graduate employment figures lead the sector.',
    highlights: ['Paid co-op placements built into the degree', '3,300+ employer partners', 'Boston tech and biotech corridor'],
  },
  {
    name: 'University of Illinois Chicago',
    countryCode: 'US',
    city: 'Chicago',
    type: 'public',
    establishedYear: 1982,
    worldRanking: 231,
    acceptanceRate: 79,
    internationalStudentShare: 18,
    applicationFeeInr: 6_000,
    scholarshipAvailable: true,
    description:
      'A large public research university in downtown Chicago with a health-sciences campus and one of the more affordable fee structures among US research universities.',
    highlights: ['Lower fees than coastal peers', 'Major teaching hospital on campus', 'Strong Indian student community'],
  },

  // ─── United Kingdom ────────────────────────────────────────────────────────
  {
    name: 'University of Manchester',
    countryCode: 'GB',
    city: 'Manchester',
    type: 'public',
    establishedYear: 1824,
    worldRanking: 34,
    acceptanceRate: 56,
    internationalStudentShare: 40,
    applicationFeeInr: 0,
    scholarshipAvailable: true,
    description:
      'A Russell Group university with 25 Nobel laureates among its staff and alumni, and one of the largest single-site student populations in the UK.',
    highlights: ['Russell Group', '25 Nobel laureates', 'Two-year Graduate Route visa'],
  },
  {
    name: 'University of Birmingham',
    countryCode: 'GB',
    city: 'Birmingham',
    type: 'public',
    establishedYear: 1900,
    worldRanking: 84,
    acceptanceRate: 65,
    internationalStudentShare: 35,
    applicationFeeInr: 0,
    scholarshipAvailable: true,
    description:
      'Russell Group, campus-based, and the first English civic university — with a large business school and generous India-specific scholarships.',
    highlights: ['Russell Group', 'India excellence scholarships', 'Campus university in a low-cost city'],
  },
  {
    name: 'Coventry University',
    countryCode: 'GB',
    city: 'Coventry',
    type: 'public',
    establishedYear: 1843,
    worldRanking: 601,
    acceptanceRate: 82,
    internationalStudentShare: 45,
    applicationFeeInr: 0,
    scholarshipAvailable: true,
    description:
      'Teaching-focused and openly accessible, with January and September intakes, foundation routes, and fees at the lower end of the UK market.',
    highlights: ['Foundation and top-up routes', 'January intake', 'Among the UK’s lowest tuition fees'],
  },

  // ─── Canada ────────────────────────────────────────────────────────────────
  {
    name: 'University of Toronto',
    countryCode: 'CA',
    city: 'Toronto',
    type: 'public',
    establishedYear: 1827,
    worldRanking: 25,
    acceptanceRate: 43,
    internationalStudentShare: 28,
    applicationFeeInr: 11_000,
    scholarshipAvailable: true,
    description:
      'Canada’s highest-ranked university and one of the world’s leading public research institutions, with three campuses across the Greater Toronto Area.',
    highlights: ['Top 25 worldwide', 'Birthplace of modern deep learning', '3-year PGWP eligible'],
  },
  {
    name: 'University of Windsor',
    countryCode: 'CA',
    city: 'Windsor',
    type: 'public',
    establishedYear: 1857,
    worldRanking: 601,
    acceptanceRate: 70,
    internationalStudentShare: 30,
    applicationFeeInr: 8_000,
    scholarshipAvailable: true,
    description:
      'A mid-sized research university on the Detroit border, known for co-op engineering and business master’s programmes aimed at international students.',
    highlights: ['Co-op options in most master’s', 'Lower Ontario living costs', 'Automotive and manufacturing links'],
  },
  {
    name: 'Conestoga College',
    countryCode: 'CA',
    city: 'Kitchener',
    type: 'public',
    establishedYear: 1967,
    worldRanking: null,
    acceptanceRate: 60,
    internationalStudentShare: 42,
    applicationFeeInr: 8_500,
    scholarshipAvailable: false,
    description:
      'An Ontario public college offering two- and three-year career diplomas and postgraduate certificates, all PGWP-eligible — the most common route into Canadian work experience.',
    highlights: ['Career diplomas from Class 12', 'PGWP eligible', 'Employer-designed curriculum'],
  },

  // ─── Australia ─────────────────────────────────────────────────────────────
  {
    name: 'University of Melbourne',
    countryCode: 'AU',
    city: 'Melbourne',
    type: 'public',
    establishedYear: 1853,
    worldRanking: 13,
    acceptanceRate: 70,
    internationalStudentShare: 44,
    applicationFeeInr: 8_000,
    scholarshipAvailable: true,
    description:
      'Australia’s leading university on most global rankings, with a research-intensive profile and the country’s largest graduate school.',
    highlights: ['Top 15 worldwide', 'Melbourne CBD campus', 'Graduate Research Scholarships'],
  },
  {
    name: 'RMIT University',
    countryCode: 'AU',
    city: 'Melbourne',
    type: 'public',
    establishedYear: 1887,
    worldRanking: 123,
    acceptanceRate: 70,
    internationalStudentShare: 40,
    applicationFeeInr: 6_000,
    scholarshipAvailable: true,
    description:
      'Technology, design and enterprise focused, with strong industry placement in engineering and the largest design school in Australia.',
    highlights: ['#1 in Australia for art and design', 'Industry placements', 'Vocational to degree pathways'],
  },
  {
    name: 'Deakin University',
    countryCode: 'AU',
    city: 'Geelong',
    type: 'public',
    establishedYear: 1974,
    worldRanking: 233,
    acceptanceRate: 65,
    internationalStudentShare: 32,
    applicationFeeInr: 5_500,
    scholarshipAvailable: true,
    description:
      'Consistently top-rated for student experience, with regional campuses that earn additional points towards Australian permanent residence.',
    highlights: ['Regional PR points', 'Foundation and diploma pathways', '20% India merit scholarship'],
  },

  // ─── Germany ───────────────────────────────────────────────────────────────
  {
    name: 'Technical University of Munich',
    countryCode: 'DE',
    city: 'Munich',
    type: 'public',
    establishedYear: 1868,
    worldRanking: 28,
    acceptanceRate: 8,
    internationalStudentShare: 32,
    applicationFeeInr: 6_500,
    scholarshipAvailable: false,
    description:
      'Germany’s leading technical university, tuition-free apart from a semester contribution, and correspondingly one of the most competitive admissions in Europe.',
    highlights: ['No tuition fees', 'Top 30 worldwide', 'Deep automotive and aerospace links'],
  },
  {
    name: 'RWTH Aachen University',
    countryCode: 'DE',
    city: 'Aachen',
    type: 'public',
    establishedYear: 1870,
    worldRanking: 99,
    acceptanceRate: 20,
    internationalStudentShare: 27,
    applicationFeeInr: 6_000,
    scholarshipAvailable: false,
    description:
      'The largest engineering faculty in Germany, with industry-funded research institutes and no tuition fees for international students.',
    highlights: ['No tuition fees', 'Largest German engineering faculty', 'Industry-embedded research'],
  },
  {
    name: 'SRH Berlin University of Applied Sciences',
    countryCode: 'DE',
    city: 'Berlin',
    type: 'private',
    establishedYear: 2002,
    worldRanking: null,
    acceptanceRate: 55,
    internationalStudentShare: 60,
    applicationFeeInr: 9_000,
    scholarshipAvailable: true,
    description:
      'English-taught private university of applied sciences, with a Studienkolleg foundation year that admits Indian Class 12 students directly.',
    highlights: ['English-taught, no German required', 'Studienkolleg foundation route', 'Berlin startup placements'],
  },

  // ─── Ireland ───────────────────────────────────────────────────────────────
  {
    name: 'Trinity College Dublin',
    countryCode: 'IE',
    city: 'Dublin',
    type: 'public',
    establishedYear: 1592,
    worldRanking: 87,
    acceptanceRate: 34,
    internationalStudentShare: 29,
    applicationFeeInr: 5_500,
    scholarshipAvailable: true,
    description:
      'Ireland’s oldest and highest-ranked university, in the centre of Dublin, with particular strength in immunology, literature and computer science.',
    highlights: ['Ireland’s #1 university', 'City-centre campus', '2-year graduate stay-back'],
  },
  {
    name: 'University College Dublin',
    countryCode: 'IE',
    city: 'Dublin',
    type: 'public',
    establishedYear: 1854,
    worldRanking: 126,
    acceptanceRate: 45,
    internationalStudentShare: 33,
    applicationFeeInr: 5_500,
    scholarshipAvailable: true,
    description:
      'Ireland’s largest university, with the country’s leading business school and a campus that hosts research centres for most major technology employers.',
    highlights: ['Smurfit Business School', 'Global Excellence scholarships', 'Largest Irish university'],
  },
  {
    name: 'Dublin City University',
    countryCode: 'IE',
    city: 'Dublin',
    type: 'public',
    establishedYear: 1975,
    worldRanking: 421,
    acceptanceRate: 60,
    internationalStudentShare: 28,
    applicationFeeInr: 5_000,
    scholarshipAvailable: true,
    description:
      'Young, industry-facing and built around paid work placements — with lower fees than the older Dublin universities.',
    highlights: ['Paid INTRA work placements', 'Lower Dublin fees', 'January intake for master’s'],
  },

  // ─── New Zealand ───────────────────────────────────────────────────────────
  {
    name: 'University of Auckland',
    countryCode: 'NZ',
    city: 'Auckland',
    type: 'public',
    establishedYear: 1883,
    worldRanking: 65,
    acceptanceRate: 60,
    internationalStudentShare: 26,
    applicationFeeInr: 6_000,
    scholarshipAvailable: true,
    description:
      'New Zealand’s largest and highest-ranked university, with a foundation-year pathway designed for Indian Class 12 students.',
    highlights: ['NZ’s #1 university', 'Foundation year for CBSE/ISC students', '3-year open work visa'],
  },
  {
    name: 'Auckland University of Technology',
    countryCode: 'NZ',
    city: 'Auckland',
    type: 'public',
    establishedYear: 2000,
    worldRanking: 407,
    acceptanceRate: 70,
    internationalStudentShare: 30,
    applicationFeeInr: 5_000,
    scholarshipAvailable: true,
    description:
      'Practice-oriented, with lower entry requirements than Auckland and degrees built around industry projects.',
    highlights: ['Accessible entry requirements', 'Industry capstone projects', 'Lower fees than NZ average'],
  },

  // ─── United Arab Emirates ──────────────────────────────────────────────────
  {
    name: 'Heriot-Watt University Dubai',
    countryCode: 'AE',
    city: 'Dubai',
    type: 'private',
    establishedYear: 2005,
    worldRanking: 281,
    acceptanceRate: 70,
    internationalStudentShare: 90,
    applicationFeeInr: 4_500,
    scholarshipAvailable: true,
    description:
      'The Dubai campus of a UK university, awarding the same degree at roughly half the UK fee, with transfer options to Edinburgh.',
    highlights: ['Identical UK degree', 'Transfer to the UK campus', 'Half the UK tuition'],
  },
  {
    name: 'University of Birmingham Dubai',
    countryCode: 'AE',
    city: 'Dubai',
    type: 'private',
    establishedYear: 2018,
    worldRanking: 84,
    acceptanceRate: 65,
    internationalStudentShare: 88,
    applicationFeeInr: 4_500,
    scholarshipAvailable: true,
    description:
      'A Russell Group campus in Dubai Academic City, teaching the same curriculum and awarding the same degree as Birmingham in the UK.',
    highlights: ['Russell Group degree', 'Dubai Academic City', 'Scholarships up to 50%'],
  },
  {
    name: 'Amity University Dubai',
    countryCode: 'AE',
    city: 'Dubai',
    type: 'private',
    establishedYear: 2011,
    worldRanking: null,
    acceptanceRate: 80,
    internationalStudentShare: 75,
    applicationFeeInr: 3_500,
    scholarshipAvailable: true,
    description:
      'An accessible private campus in Dubai Knowledge Park with foundation, diploma and degree routes, and Indian-curriculum entry criteria.',
    highlights: ['Accepts CBSE/ISC directly', 'Foundation and diploma routes', 'Lowest fees in the UAE list'],
  },
];

export default UNIVERSITIES;
