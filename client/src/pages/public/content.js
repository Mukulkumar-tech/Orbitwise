/**
 * Copy for the guidance pages.
 *
 * Content as data, rendered by one ContentPage component, so six informational
 * routes share a single layout and a single set of type styles. Adding a guide is
 * an entry here, not another page component to keep visually in sync.
 */

const IELTS = {
  key: 'ielts',
  eyebrow: 'Test preparation',
  title: 'IELTS: what the band actually means',
  description:
    'The most widely accepted English test, scored 0–9 in half bands. Most bachelor’s courses ask for 6.0–6.5 overall; most master’s courses ask 6.5–7.0, often with a minimum in each section.',
  sections: [
    {
      heading: 'How it is scored',
      body: 'Four sections — Listening, Reading, Writing, Speaking — each scored 0–9. Your overall band is their average, rounded to the nearest half. A course asking "6.5 overall with no band below 6.0" means a 5.5 in Writing fails you even if your average is 7.0.',
      list: [
        'Listening — 30 minutes, four recordings',
        'Reading — 60 minutes, three passages',
        'Writing — 60 minutes, two tasks',
        'Speaking — 11–14 minutes, face to face',
      ],
    },
    {
      heading: 'Which version to book',
      body: 'IELTS Academic is the one universities require. IELTS General Training is for migration and work, and will not be accepted for a degree — booking the wrong one is a common and expensive mistake.',
    },
    {
      heading: 'Planning your timeline',
      body: 'Results arrive in 3–5 days for computer-delivered tests and 13 days on paper. Scores are valid for two years. Book at least three months before your application deadline so there is room to retake once without missing the intake.',
    },
  ],
  faqs: [
    { q: 'Can I apply before I have a score?', a: 'Yes. Many universities issue a conditional offer and let you submit your English score later. Orbitwise shows the band each course needs, so you know your target before you book.' },
    { q: 'What if I am one band short?', a: 'Some universities accept a pre-sessional English course instead, and others will reconsider on a retake. Retaking is usually cheaper and faster than a pathway programme.' },
  ],
};

const PTE = {
  key: 'pte',
  eyebrow: 'Test preparation',
  title: 'PTE Academic: fastest results',
  description:
    'A fully computer-based English test scored 10–90, marked by algorithm rather than an examiner. Results typically arrive within 48 hours, which makes it the practical choice when a deadline is close.',
  sections: [
    {
      heading: 'How it compares to IELTS',
      body: 'Roughly 15 PTE points to an IELTS band in the working range: PTE 50 ≈ IELTS 6.0, PTE 58 ≈ 6.5, PTE 65 ≈ 7.0. Orbitwise converts your score to an IELTS equivalent internally, so you can compare any course requirement against whichever test you sat.',
    },
    {
      heading: 'What suits it',
      body: 'Everything is typed and spoken into a microphone, with no human interviewer. If speaking to an examiner makes you freeze, PTE removes that variable. If your typing is slow, it adds one.',
    },
    {
      heading: 'Accepted where',
      body: 'Australia, New Zealand, the UK, Ireland and Canada accept PTE Academic broadly. A minority of US universities still prefer TOEFL, so confirm on the course page before booking.',
    },
  ],
  faqs: [
    { q: 'Is PTE easier than IELTS?', a: 'Neither is easier — they test the same ability differently. Choose based on format preference and how soon you need the result.' },
  ],
};

const TOEFL = {
  key: 'toefl',
  eyebrow: 'Test preparation',
  title: 'TOEFL iBT: the US standard',
  description:
    'Scored 0–120 across four sections. The most established test for US admissions, and accepted almost everywhere else too.',
  sections: [
    {
      heading: 'Score equivalence',
      body: 'TOEFL 60 ≈ IELTS 6.0, 79 ≈ 6.5, 94 ≈ 7.0, 102 ≈ 7.5. The mapping is not linear, which is why a "just add points" estimate misleads people near a cut-off.',
    },
    {
      heading: 'Format',
      body: 'Reading, Listening, Speaking and Writing, taken in one sitting of roughly two hours. Speaking is recorded rather than conversational, and scored by a mix of AI and human raters.',
    },
    {
      heading: 'When to choose it',
      body: 'Pick TOEFL if your shortlist is US-heavy or a specific programme names it. Otherwise IELTS or PTE are usually cheaper and faster to schedule from India.',
    },
  ],
  faqs: [
    { q: 'How long is a TOEFL score valid?', a: 'Two years from the test date, the same as IELTS and PTE.' },
  ],
};

const VISA = {
  key: 'visa',
  eyebrow: 'Visa',
  title: 'Student visas, without the guesswork',
  description:
    'A student visa is mostly an evidence exercise: prove you are a genuine student, that you can fund the course, and that you intend to comply with the conditions. Refusals are usually documentation failures, not judgements about you.',
  sections: [
    {
      heading: 'What every country asks for',
      body: 'The specifics differ but the categories rarely do.',
      list: [
        'Offer letter or confirmation of enrolment from the university',
        'Proof of funds — tuition plus living costs, held long enough to satisfy the rule',
        'Academic transcripts and your English test result',
        'Valid passport, biometrics and the visa fee',
        'Health insurance, and a medical examination in some countries',
      ],
    },
    {
      heading: 'Proof of funds is where applications fail',
      body: 'Most refusals come from funds that appeared too recently, a sponsor whose relationship is undocumented, or a balance short of the published threshold. Read the rule for your destination and hold the money for the full required period before you apply.',
    },
    {
      heading: 'Timelines',
      body: 'Processing ranges from about two weeks to three months depending on destination and season. Apply as soon as you hold an unconditional offer — peak-season queues are the most common reason a student defers an intake.',
    },
  ],
  faqs: [
    { q: 'Does a past refusal end my chances?', a: 'No. A refusal must be declared, and the notice states the reason. Fixing that specific reason and reapplying is normal and frequently succeeds.' },
    { q: 'Can my family fund me?', a: 'Yes, in every major destination — but the relationship and the source of the money must be documented. An unexplained deposit is treated as a risk, not as support.' },
  ],
};

const PR = {
  key: 'pr',
  eyebrow: 'PR pathways',
  title: 'Study routes that lead to residency',
  description:
    'If staying on matters to you, it should shape your course choice from the start — not become a problem you discover at graduation. Post-study work rights vary enormously between destinations.',
  sections: [
    {
      heading: 'Why the destination decides this',
      body: 'A degree does not grant residency anywhere. What matters is the length of the post-study work visa, whether your occupation is in demand, and whether the country runs a points-based route you can realistically score on.',
      list: [
        'Canada — up to 3 years post-graduation work, well-defined study→work→PR route',
        'Australia — 2–4 years depending on qualification and region',
        'New Zealand — up to 3 years, tied to your qualification level',
        'Germany — 18 months to find work, then a settlement route',
        'Ireland — up to 2 years on the Third Level Graduate Programme',
        'UK — 2 years on the Graduate Route, with no direct PR link',
      ],
    },
    {
      heading: 'Choose the course, not just the country',
      body: 'A shorter certificate may not qualify for the same work rights as a full degree, and some occupations score far better on points systems than others. Check both before you commit tuition.',
    },
    {
      heading: 'Be realistic',
      body: 'No consultancy can guarantee permanent residency, and any that does is selling you something. Immigration rules change between your application and your graduation. Pick a destination whose current rules you would still accept if they tightened slightly.',
    },
  ],
  faqs: [
    { q: 'Which destination is best for PR?', a: 'Canada and Australia have the clearest documented routes, which is why both are competitive. "Best" depends on your field, your budget and your risk tolerance — a counsellor can work through the trade-offs with you.' },
  ],
};

const STUDY_ABROAD = {
  key: 'study-abroad',
  eyebrow: 'Study abroad',
  title: 'How studying abroad actually works',
  description:
    'The process is more predictable than it looks. Nine stages, most of which come down to preparing the right document before the right deadline.',
  sections: [
    {
      heading: 'Start from where you are',
      body: 'Your current qualification decides what you can apply to. That is why Orbitwise asks for it first and filters everything afterwards.',
      list: [
        'After Class 10 — a foundation year is the bridge into a bachelor’s degree',
        'In Class 11 or 12 — apply on predicted grades for a conditional offer',
        'After Class 12 — direct entry to bachelor’s degrees and diplomas',
        'After a diploma — bachelor’s entry, often with credit transfer',
        'In your final year of a degree — conditional master’s offers',
        'After graduation — master’s and PG diploma admission',
      ],
    },
    {
      heading: 'The nine stages',
      body: 'Profile, course discovery, university shortlist, documents, applications, offer letter, visa, pre-departure, arrival. Orbitwise tracks where you are and tells you the single next thing to do.',
    },
    {
      heading: 'Budget honestly, early',
      body: 'Tuition is the headline number but rarely the largest total. Add living costs for the full duration, then visa fees, insurance, flights and a buffer. A course that looks affordable per year can be unaffordable across three.',
    },
    {
      heading: 'Timeline',
      body: 'Work backwards 12–18 months from your intake: English test and shortlist first, applications 8–12 months out, then offers, funds and visa. Starting late narrows your options far more than weak marks do.',
    },
  ],
  faqs: [
    { q: 'Do I need an agent?', a: 'No, but guidance helps with documentation and visa evidence, where most avoidable failures happen. Discovery, matching and planning on Orbitwise are free and yours to do alone if you prefer.' },
    { q: 'How much does it cost overall?', a: 'From roughly ₹15L a year all-in for Germany or the UAE, to ₹45L+ for the US and UK. Your dashboard shows the total for each shortlisted course against your stated budget.' },
  ],
};

const ABOUT = {
  key: 'about',
  eyebrow: 'About',
  title: 'Built to tell students the truth',
  description:
    'Orbitwise exists because most study-abroad advice is either a brochure or a sales call. A student deciding where to spend twenty-five lakh rupees deserves to see the requirements, the total cost and their actual odds before anyone asks them to commit.',
  sections: [
    {
      heading: 'What we do differently',
      body: 'Three decisions shape the whole product.',
      list: [
        'Eligibility is a filter, not a score — you are never shown a course you cannot enter',
        'Every match explains itself, factor by factor, including what it could not assess',
        'Costs are total and in rupees, so comparisons are about your budget rather than currency conversion',
      ],
    },
    {
      heading: 'What we will not do',
      body: 'We do not promise visas or permanent residency, because nobody can. We do not hide entry requirements to generate application fees. And we do not rank universities by what they pay us — the catalogue order is by fit to you.',
    },
    {
      heading: 'How the matching works',
      body: 'Seven weighted factors — academic fit, budget, English, destination, course fit, intake timing and admission likelihood — computed from your profile against each course’s stated requirements. The same computation produces both the score and its explanation, so the two can never disagree.',
    },
    {
      heading: 'About this build',
      body: 'Orbitwise is a portfolio demonstration of a production-grade platform: role-based authentication, an explainable recommendation engine, and a student dashboard, built on React and Express with a test suite covering the logic that would be expensive to get wrong.',
    },
  ],
  faqs: [
    { q: 'Is the data real?', a: 'The universities and countries are real; tuition and requirements are realistic planning figures for demonstration. Always confirm current fees and requirements with the university before applying.' },
  ],
};

export const CONTENT = {
  'study-abroad': STUDY_ABROAD,
  about: ABOUT,
  visa: VISA,
  pr: PR,
  ielts: IELTS,
  pte: PTE,
  toefl: TOEFL,
};

export const TEST_PREP_KEYS = ['ielts', 'pte', 'toefl'];

export default CONTENT;
