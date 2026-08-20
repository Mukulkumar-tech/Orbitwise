/**
 * Demo fixtures.
 *
 * Captured from real API responses by scripts/capture-demo-data.mjs, not written
 * by hand, so the shapes cannot drift from what the endpoints actually return.
 *
 * Used only when the API is unreachable — see services/api.js. The UI always
 * says so; serving this silently while implying a live backend would be a lie to
 * whoever is looking at the page.
 *
 * Regenerate:  MONGODB_URI="..." node scripts/capture-demo-data.mjs
 */
export const FIXTURES = {
  "/public/home": {
    "data": {
      "stats": {
        "countries": 8,
        "universities": 23,
        "courses": 59,
        "scholarshipCourses": 24,
        "lowestTuitionInr": 48000
      },
      "destinations": [
        {
          "_id": "6a869ef4e5042bce96b2a108",
          "code": "AU",
          "name": "Australia",
          "flag": "🇦🇺",
          "currency": "AUD",
          "livingCostPerYearInr": 880000,
          "tuitionRangeInr": {
            "min": 1400000,
            "max": 3000000
          },
          "workRights": {
            "hoursPerWeekDuringStudy": 24,
            "postStudyWorkYears": 3
          },
          "prPathway": true,
          "typicalIelts": 6.5,
          "summary": "Strong graduate work rights, a points-based PR system that rewards regional study, and February/July intakes that suit an Indian academic year.",
          "slug": "australia"
        },
        {
          "_id": "6a869ef4e5042bce96b2a105",
          "code": "CA",
          "name": "Canada",
          "flag": "🇨🇦",
          "currency": "CAD",
          "livingCostPerYearInr": 800000,
          "tuitionRangeInr": {
            "min": 1200000,
            "max": 2800000
          },
          "workRights": {
            "hoursPerWeekDuringStudy": 24,
            "postStudyWorkYears": 3
          },
          "prPathway": true,
          "typicalIelts": 6.5,
          "summary": "The clearest study-to-permanent-residence route of any destination, with a three-year post-graduation work permit — but the toughest visa approval odds, so course choice matters.",
          "slug": "canada"
        },
        {
          "_id": "6a869ef4e5042bce96b2a10b",
          "code": "DE",
          "name": "Germany",
          "flag": "🇩🇪",
          "currency": "EUR",
          "livingCostPerYearInr": 780000,
          "tuitionRangeInr": {
            "min": 0,
            "max": 1800000
          },
          "workRights": {
            "hoursPerWeekDuringStudy": 20,
            "postStudyWorkYears": 2
          },
          "prPathway": true,
          "typicalIelts": 6.5,
          "summary": "Public universities charge no tuition, only a semester fee — so the real cost is living, not fees. Indian Class 12 students usually enter through a one-year Studienkolleg foundation.",
          "slug": "germany"
        },
        {
          "_id": "6a869ef4e5042bce96b2a10e",
          "code": "IE",
          "name": "Ireland",
          "flag": "🇮🇪",
          "currency": "EUR",
          "livingCostPerYearInr": 900000,
          "tuitionRangeInr": {
            "min": 1200000,
            "max": 2600000
          },
          "workRights": {
            "hoursPerWeekDuringStudy": 20,
            "postStudyWorkYears": 2
          },
          "prPathway": true,
          "typicalIelts": 6.5,
          "summary": "English-speaking, inside the EU, and the European base for most large technology and pharmaceutical employers — with a two-year graduate stay-back.",
          "slug": "ireland"
        },
        {
          "_id": "6a869ef4e5042bce96b2a111",
          "code": "NZ",
          "name": "New Zealand",
          "flag": "🇳🇿",
          "currency": "NZD",
          "livingCostPerYearInr": 780000,
          "tuitionRangeInr": {
            "min": 1200000,
            "max": 2400000
          },
          "workRights": {
            "hoursPerWeekDuringStudy": 20,
            "postStudyWorkYears": 3
          },
          "prPathway": true,
          "typicalIelts": 6,
          "summary": "Smaller class sizes, lower living costs than Australia, and a three-year open work visa after a bachelor’s degree.",
          "slug": "new-zealand"
        },
        {
          "_id": "6a869ef4e5042bce96b2a114",
          "code": "AE",
          "name": "United Arab Emirates",
          "flag": "🇦🇪",
          "currency": "AED",
          "livingCostPerYearInr": 700000,
          "tuitionRangeInr": {
            "min": 800000,
            "max": 2200000
          },
          "workRights": {
            "hoursPerWeekDuringStudy": 15,
            "postStudyWorkYears": 2
          },
          "prPathway": false,
          "typicalIelts": 6,
          "summary": "UK and Australian university campuses at roughly half the fees, a three-hour flight from home, and a two-year post-study work visa in Dubai.",
          "slug": "united-arab-emirates"
        },
        {
          "_id": "6a869ef4e5042bce96b2a100",
          "code": "GB",
          "name": "United Kingdom",
          "flag": "🇬🇧",
          "currency": "GBP",
          "livingCostPerYearInr": 950000,
          "tuitionRangeInr": {
            "min": 1600000,
            "max": 3600000
          },
          "workRights": {
            "hoursPerWeekDuringStudy": 20,
            "postStudyWorkYears": 2
          },
          "prPathway": true,
          "typicalIelts": 6.5,
          "summary": "One-year master’s degrees, a two-year Graduate Route work visa, and the highest study-visa approval rate of any major destination.",
          "slug": "united-kingdom"
        },
        {
          "_id": "6a869ef4e5042bce96b2a0fb",
          "code": "US",
          "name": "United States",
          "flag": "🇺🇸",
          "currency": "USD",
          "livingCostPerYearInr": 1050000,
          "tuitionRangeInr": {
            "min": 1800000,
            "max": 4800000
          },
          "workRights": {
            "hoursPerWeekDuringStudy": 20,
            "postStudyWorkYears": 3
          },
          "prPathway": false,
          "typicalIelts": 6.5,
          "summary": "The largest choice of universities anywhere, strong research funding, and up to three years of post-study work for STEM graduates on OPT.",
          "slug": "united-states"
        }
      ],
      "universities": [
        {
          "_id": "6a869ef6e5042bce96b2a159",
          "name": "Amity University Dubai",
          "countryCode": "AE",
          "city": "Dubai",
          "type": "private",
          "worldRanking": null,
          "acceptanceRate": 80,
          "scholarshipAvailable": true,
          "slug": "amity-university-dubai"
        },
        {
          "_id": "6a869ef5e5042bce96b2a141",
          "name": "SRH Berlin University of Applied Sciences",
          "countryCode": "DE",
          "city": "Berlin",
          "type": "private",
          "worldRanking": null,
          "acceptanceRate": 55,
          "scholarshipAvailable": true,
          "slug": "srh-berlin-university-of-applied-sciences"
        },
        {
          "_id": "6a869ef5e5042bce96b2a132",
          "name": "University of Melbourne",
          "countryCode": "AU",
          "city": "Melbourne",
          "type": "public",
          "worldRanking": 13,
          "acceptanceRate": 70,
          "scholarshipAvailable": true,
          "slug": "university-of-melbourne"
        },
        {
          "_id": "6a869ef5e5042bce96b2a129",
          "name": "University of Toronto",
          "countryCode": "CA",
          "city": "Toronto",
          "type": "public",
          "worldRanking": 25,
          "acceptanceRate": 43,
          "scholarshipAvailable": true,
          "slug": "university-of-toronto"
        },
        {
          "_id": "6a869ef4e5042bce96b2a120",
          "name": "University of Manchester",
          "countryCode": "GB",
          "city": "Manchester",
          "type": "public",
          "worldRanking": 34,
          "acceptanceRate": 56,
          "scholarshipAvailable": true,
          "slug": "university-of-manchester"
        },
        {
          "_id": "6a869ef6e5042bce96b2a14d",
          "name": "University of Auckland",
          "countryCode": "NZ",
          "city": "Auckland",
          "type": "public",
          "worldRanking": 65,
          "acceptanceRate": 60,
          "scholarshipAvailable": true,
          "slug": "university-of-auckland"
        }
      ],
      "testimonials": [
        {
          "_id": "6a869efce5042bce96b2a25b",
          "studentName": "Simran Kaur",
          "avatar": "",
          "quote": "I applied in my final year of BCom with predicted grades and held a conditional offer for four months before my degree certificate arrived. Starting early is the whole trick.",
          "courseTitle": "Master of Professional Accounting",
          "universityName": "University of Melbourne",
          "countryCode": "AU",
          "countryName": "Australia",
          "fromCity": "Ludhiana",
          "previousQualification": "BCom, 76%",
          "intakeYear": 2025,
          "scholarshipPercent": 20,
          "rating": 5,
          "isFeatured": true,
          "isPublished": true,
          "createdAt": "2026-08-20T06:30:20.847Z",
          "updatedAt": "2026-08-20T06:30:20.847Z",
          "__v": 0
        },
        {
          "_id": "6a869efce5042bce96b2a261",
          "studentName": "Priyanka Joshi",
          "avatar": "",
          "quote": "The three-year post-study work permit is why I picked Canada over the US. I wanted a route that did not depend on winning a lottery after graduation.",
          "courseTitle": "MSc Computer Science (with co-op)",
          "universityName": "University of Windsor",
          "countryCode": "CA",
          "countryName": "Canada",
          "fromCity": "Nagpur",
          "previousQualification": "BTech IT, 7.6 CGPA",
          "intakeYear": 2025,
          "scholarshipPercent": 10,
          "rating": 4,
          "isFeatured": true,
          "isPublished": true,
          "createdAt": "2026-08-20T06:30:20.974Z",
          "updatedAt": "2026-08-20T06:30:20.974Z",
          "__v": 0
        },
        {
          "_id": "6a869efde5042bce96b2a264",
          "studentName": "Karthik Iyer",
          "avatar": "",
          "quote": "I was still in Class 12 when I started. Having the deadline dates and document list in one place meant I was not scrambling in March like most of my friends.",
          "courseTitle": "BSc Computer Science",
          "universityName": "University of Auckland",
          "countryCode": "NZ",
          "countryName": "New Zealand",
          "fromCity": "Chennai",
          "previousQualification": "Class 12 — PCM, 88%",
          "intakeYear": 2025,
          "scholarshipPercent": 25,
          "rating": 5,
          "isFeatured": true,
          "isPublished": true,
          "createdAt": "2026-08-20T06:30:21.051Z",
          "updatedAt": "2026-08-20T06:30:21.051Z",
          "__v": 0
        },
        {
          "_id": "6a869efce5042bce96b2a255",
          "studentName": "Ananya Reddy",
          "avatar": "",
          "quote": "I had 74% in Class 12 and assumed the UK was closed to me. The foundation year at Coventry got me in, and I finished first year with a 2:1. Nobody had explained that pathway to me before.",
          "courseTitle": "International Foundation Year — Business",
          "universityName": "Coventry University",
          "countryCode": "GB",
          "countryName": "United Kingdom",
          "fromCity": "Hyderabad",
          "previousQualification": "Class 12 — Commerce, 74%",
          "intakeYear": 2024,
          "scholarshipPercent": 15,
          "rating": 5,
          "isFeatured": true,
          "isPublished": true,
          "createdAt": "2026-08-20T06:30:20.721Z",
          "updatedAt": "2026-08-20T06:30:20.721Z",
          "__v": 0
        },
        {
          "_id": "6a869efce5042bce96b2a258",
          "studentName": "Rohan Deshpande",
          "avatar": "",
          "quote": "Germany was the only option my family could fund without a loan. Public university tuition is genuinely near-zero — the real budget was living costs and the blocked account, and seeing that split honestly is what convinced my father.",
          "courseTitle": "MSc Computer Science",
          "universityName": "Technical University of Munich",
          "countryCode": "DE",
          "countryName": "Germany",
          "fromCity": "Pune",
          "previousQualification": "BE Computer Engineering, 8.1 CGPA",
          "intakeYear": 2024,
          "scholarshipPercent": 0,
          "rating": 5,
          "isFeatured": true,
          "isPublished": true,
          "createdAt": "2026-08-20T06:30:20.785Z",
          "updatedAt": "2026-08-20T06:30:20.785Z",
          "__v": 0
        },
        {
          "_id": "6a869efce5042bce96b2a25e",
          "studentName": "Aditya Menon",
          "avatar": "",
          "quote": "My IELTS was 6.0 and the course wanted 6.5. Rather than gambling the application, I retook it eight weeks later with 7.0 and applied to a better university than my original shortlist.",
          "courseTitle": "MSc Data Analytics",
          "universityName": "University College Dublin",
          "countryCode": "IE",
          "countryName": "Ireland",
          "fromCity": "Kochi",
          "previousQualification": "BSc Statistics, 71%",
          "intakeYear": 2024,
          "scholarshipPercent": 10,
          "rating": 5,
          "isFeatured": true,
          "isPublished": true,
          "createdAt": "2026-08-20T06:30:20.915Z",
          "updatedAt": "2026-08-20T06:30:20.915Z",
          "__v": 0
        }
      ]
    }
  },
  "/countries": {
    "data": [
      {
        "_id": "6a869ef4e5042bce96b2a108",
        "code": "AU",
        "name": "Australia",
        "flag": "🇦🇺",
        "currency": "AUD",
        "livingCostPerYearInr": 880000,
        "tuitionRangeInr": {
          "min": 1400000,
          "max": 3000000
        },
        "visaSuccessRate": 85,
        "visaFeeInr": 100000,
        "workRights": {
          "hoursPerWeekDuringStudy": 24,
          "postStudyWorkYears": 3
        },
        "prPathway": true,
        "intakes": [
          "February",
          "July"
        ],
        "popularCities": [
          "Melbourne",
          "Sydney",
          "Brisbane",
          "Geelong"
        ],
        "typicalIelts": 6.5,
        "summary": "Strong graduate work rights, a points-based PR system that rewards regional study, and February/July intakes that suit an Indian academic year.",
        "isActive": true,
        "slug": "australia",
        "createdAt": "2026-08-20T06:30:12.458Z",
        "updatedAt": "2026-08-20T06:30:12.458Z",
        "__v": 0
      },
      {
        "_id": "6a869ef4e5042bce96b2a105",
        "code": "CA",
        "name": "Canada",
        "flag": "🇨🇦",
        "currency": "CAD",
        "livingCostPerYearInr": 800000,
        "tuitionRangeInr": {
          "min": 1200000,
          "max": 2800000
        },
        "visaSuccessRate": 62,
        "visaFeeInr": 15000,
        "workRights": {
          "hoursPerWeekDuringStudy": 24,
          "postStudyWorkYears": 3
        },
        "prPathway": true,
        "intakes": [
          "January",
          "May",
          "September"
        ],
        "popularCities": [
          "Toronto",
          "Vancouver",
          "Kitchener",
          "Windsor"
        ],
        "typicalIelts": 6.5,
        "summary": "The clearest study-to-permanent-residence route of any destination, with a three-year post-graduation work permit — but the toughest visa approval odds, so course choice matters.",
        "isActive": true,
        "slug": "canada",
        "createdAt": "2026-08-20T06:30:12.371Z",
        "updatedAt": "2026-08-20T06:30:12.371Z",
        "__v": 0
      },
      {
        "_id": "6a869ef4e5042bce96b2a10b",
        "code": "DE",
        "name": "Germany",
        "flag": "🇩🇪",
        "currency": "EUR",
        "livingCostPerYearInr": 780000,
        "tuitionRangeInr": {
          "min": 0,
          "max": 1800000
        },
        "visaSuccessRate": 90,
        "visaFeeInr": 7500,
        "workRights": {
          "hoursPerWeekDuringStudy": 20,
          "postStudyWorkYears": 2
        },
        "prPathway": true,
        "intakes": [
          "April",
          "October"
        ],
        "popularCities": [
          "Munich",
          "Berlin",
          "Aachen",
          "Frankfurt"
        ],
        "typicalIelts": 6.5,
        "summary": "Public universities charge no tuition, only a semester fee — so the real cost is living, not fees. Indian Class 12 students usually enter through a one-year Studienkolleg foundation.",
        "isActive": true,
        "slug": "germany",
        "createdAt": "2026-08-20T06:30:12.518Z",
        "updatedAt": "2026-08-20T06:30:12.518Z",
        "__v": 0
      },
      {
        "_id": "6a869ef4e5042bce96b2a10e",
        "code": "IE",
        "name": "Ireland",
        "flag": "🇮🇪",
        "currency": "EUR",
        "livingCostPerYearInr": 900000,
        "tuitionRangeInr": {
          "min": 1200000,
          "max": 2600000
        },
        "visaSuccessRate": 90,
        "visaFeeInr": 5500,
        "workRights": {
          "hoursPerWeekDuringStudy": 20,
          "postStudyWorkYears": 2
        },
        "prPathway": true,
        "intakes": [
          "January",
          "September"
        ],
        "popularCities": [
          "Dublin",
          "Cork",
          "Galway",
          "Limerick"
        ],
        "typicalIelts": 6.5,
        "summary": "English-speaking, inside the EU, and the European base for most large technology and pharmaceutical employers — with a two-year graduate stay-back.",
        "isActive": true,
        "slug": "ireland",
        "createdAt": "2026-08-20T06:30:12.578Z",
        "updatedAt": "2026-08-20T06:30:12.578Z",
        "__v": 0
      },
      {
        "_id": "6a869ef4e5042bce96b2a111",
        "code": "NZ",
        "name": "New Zealand",
        "flag": "🇳🇿",
        "currency": "NZD",
        "livingCostPerYearInr": 780000,
        "tuitionRangeInr": {
          "min": 1200000,
          "max": 2400000
        },
        "visaSuccessRate": 82,
        "visaFeeInr": 24000,
        "workRights": {
          "hoursPerWeekDuringStudy": 20,
          "postStudyWorkYears": 3
        },
        "prPathway": true,
        "intakes": [
          "February",
          "July"
        ],
        "popularCities": [
          "Auckland",
          "Wellington",
          "Christchurch"
        ],
        "typicalIelts": 6,
        "summary": "Smaller class sizes, lower living costs than Australia, and a three-year open work visa after a bachelor’s degree.",
        "isActive": true,
        "slug": "new-zealand",
        "createdAt": "2026-08-20T06:30:12.648Z",
        "updatedAt": "2026-08-20T06:30:12.648Z",
        "__v": 0
      },
      {
        "_id": "6a869ef4e5042bce96b2a114",
        "code": "AE",
        "name": "United Arab Emirates",
        "flag": "🇦🇪",
        "currency": "AED",
        "livingCostPerYearInr": 700000,
        "tuitionRangeInr": {
          "min": 800000,
          "max": 2200000
        },
        "visaSuccessRate": 95,
        "visaFeeInr": 18000,
        "workRights": {
          "hoursPerWeekDuringStudy": 15,
          "postStudyWorkYears": 2
        },
        "prPathway": false,
        "intakes": [
          "January",
          "September"
        ],
        "popularCities": [
          "Dubai",
          "Abu Dhabi",
          "Sharjah"
        ],
        "typicalIelts": 6,
        "summary": "UK and Australian university campuses at roughly half the fees, a three-hour flight from home, and a two-year post-study work visa in Dubai.",
        "isActive": true,
        "slug": "united-arab-emirates",
        "createdAt": "2026-08-20T06:30:12.707Z",
        "updatedAt": "2026-08-20T06:30:12.707Z",
        "__v": 0
      },
      {
        "_id": "6a869ef4e5042bce96b2a100",
        "code": "GB",
        "name": "United Kingdom",
        "flag": "🇬🇧",
        "currency": "GBP",
        "livingCostPerYearInr": 950000,
        "tuitionRangeInr": {
          "min": 1600000,
          "max": 3600000
        },
        "visaSuccessRate": 96,
        "visaFeeInr": 52000,
        "workRights": {
          "hoursPerWeekDuringStudy": 20,
          "postStudyWorkYears": 2
        },
        "prPathway": true,
        "intakes": [
          "January",
          "May",
          "September"
        ],
        "popularCities": [
          "London",
          "Manchester",
          "Birmingham",
          "Coventry"
        ],
        "typicalIelts": 6.5,
        "summary": "One-year master’s degrees, a two-year Graduate Route work visa, and the highest study-visa approval rate of any major destination.",
        "isActive": true,
        "slug": "united-kingdom",
        "createdAt": "2026-08-20T06:30:12.302Z",
        "updatedAt": "2026-08-20T06:30:12.302Z",
        "__v": 0
      },
      {
        "_id": "6a869ef4e5042bce96b2a0fb",
        "code": "US",
        "name": "United States",
        "flag": "🇺🇸",
        "currency": "USD",
        "livingCostPerYearInr": 1050000,
        "tuitionRangeInr": {
          "min": 1800000,
          "max": 4800000
        },
        "visaSuccessRate": 78,
        "visaFeeInr": 45000,
        "workRights": {
          "hoursPerWeekDuringStudy": 20,
          "postStudyWorkYears": 3
        },
        "prPathway": false,
        "intakes": [
          "January",
          "May",
          "September"
        ],
        "popularCities": [
          "New York",
          "Boston",
          "Chicago",
          "Phoenix"
        ],
        "typicalIelts": 6.5,
        "summary": "The largest choice of universities anywhere, strong research funding, and up to three years of post-study work for STEM graduates on OPT.",
        "isActive": true,
        "slug": "united-states",
        "createdAt": "2026-08-20T06:30:12.231Z",
        "updatedAt": "2026-08-20T06:30:12.231Z",
        "__v": 0
      }
    ]
  },
  "/public/testimonials": {
    "data": [
      {
        "_id": "6a869efce5042bce96b2a25b",
        "studentName": "Simran Kaur",
        "avatar": "",
        "quote": "I applied in my final year of BCom with predicted grades and held a conditional offer for four months before my degree certificate arrived. Starting early is the whole trick.",
        "courseTitle": "Master of Professional Accounting",
        "universityName": "University of Melbourne",
        "countryCode": "AU",
        "countryName": "Australia",
        "fromCity": "Ludhiana",
        "previousQualification": "BCom, 76%",
        "intakeYear": 2025,
        "scholarshipPercent": 20,
        "rating": 5,
        "isFeatured": true,
        "isPublished": true,
        "createdAt": "2026-08-20T06:30:20.847Z",
        "updatedAt": "2026-08-20T06:30:20.847Z",
        "__v": 0
      },
      {
        "_id": "6a869efce5042bce96b2a261",
        "studentName": "Priyanka Joshi",
        "avatar": "",
        "quote": "The three-year post-study work permit is why I picked Canada over the US. I wanted a route that did not depend on winning a lottery after graduation.",
        "courseTitle": "MSc Computer Science (with co-op)",
        "universityName": "University of Windsor",
        "countryCode": "CA",
        "countryName": "Canada",
        "fromCity": "Nagpur",
        "previousQualification": "BTech IT, 7.6 CGPA",
        "intakeYear": 2025,
        "scholarshipPercent": 10,
        "rating": 4,
        "isFeatured": true,
        "isPublished": true,
        "createdAt": "2026-08-20T06:30:20.974Z",
        "updatedAt": "2026-08-20T06:30:20.974Z",
        "__v": 0
      },
      {
        "_id": "6a869efde5042bce96b2a264",
        "studentName": "Karthik Iyer",
        "avatar": "",
        "quote": "I was still in Class 12 when I started. Having the deadline dates and document list in one place meant I was not scrambling in March like most of my friends.",
        "courseTitle": "BSc Computer Science",
        "universityName": "University of Auckland",
        "countryCode": "NZ",
        "countryName": "New Zealand",
        "fromCity": "Chennai",
        "previousQualification": "Class 12 — PCM, 88%",
        "intakeYear": 2025,
        "scholarshipPercent": 25,
        "rating": 5,
        "isFeatured": true,
        "isPublished": true,
        "createdAt": "2026-08-20T06:30:21.051Z",
        "updatedAt": "2026-08-20T06:30:21.051Z",
        "__v": 0
      },
      {
        "_id": "6a869efce5042bce96b2a255",
        "studentName": "Ananya Reddy",
        "avatar": "",
        "quote": "I had 74% in Class 12 and assumed the UK was closed to me. The foundation year at Coventry got me in, and I finished first year with a 2:1. Nobody had explained that pathway to me before.",
        "courseTitle": "International Foundation Year — Business",
        "universityName": "Coventry University",
        "countryCode": "GB",
        "countryName": "United Kingdom",
        "fromCity": "Hyderabad",
        "previousQualification": "Class 12 — Commerce, 74%",
        "intakeYear": 2024,
        "scholarshipPercent": 15,
        "rating": 5,
        "isFeatured": true,
        "isPublished": true,
        "createdAt": "2026-08-20T06:30:20.721Z",
        "updatedAt": "2026-08-20T06:30:20.721Z",
        "__v": 0
      },
      {
        "_id": "6a869efce5042bce96b2a258",
        "studentName": "Rohan Deshpande",
        "avatar": "",
        "quote": "Germany was the only option my family could fund without a loan. Public university tuition is genuinely near-zero — the real budget was living costs and the blocked account, and seeing that split honestly is what convinced my father.",
        "courseTitle": "MSc Computer Science",
        "universityName": "Technical University of Munich",
        "countryCode": "DE",
        "countryName": "Germany",
        "fromCity": "Pune",
        "previousQualification": "BE Computer Engineering, 8.1 CGPA",
        "intakeYear": 2024,
        "scholarshipPercent": 0,
        "rating": 5,
        "isFeatured": true,
        "isPublished": true,
        "createdAt": "2026-08-20T06:30:20.785Z",
        "updatedAt": "2026-08-20T06:30:20.785Z",
        "__v": 0
      },
      {
        "_id": "6a869efce5042bce96b2a25e",
        "studentName": "Aditya Menon",
        "avatar": "",
        "quote": "My IELTS was 6.0 and the course wanted 6.5. Rather than gambling the application, I retook it eight weeks later with 7.0 and applied to a better university than my original shortlist.",
        "courseTitle": "MSc Data Analytics",
        "universityName": "University College Dublin",
        "countryCode": "IE",
        "countryName": "Ireland",
        "fromCity": "Kochi",
        "previousQualification": "BSc Statistics, 71%",
        "intakeYear": 2024,
        "scholarshipPercent": 10,
        "rating": 5,
        "isFeatured": true,
        "isPublished": true,
        "createdAt": "2026-08-20T06:30:20.915Z",
        "updatedAt": "2026-08-20T06:30:20.915Z",
        "__v": 0
      },
      {
        "_id": "6a869efde5042bce96b2a26a",
        "studentName": "Zaid Ansari",
        "avatar": "",
        "quote": "Dubai let me study at a UK university brand without the flight costs, and I could visit home in a weekend. For my family that mattered more than the ranking.",
        "courseTitle": "BSc Business Management",
        "universityName": "Heriot-Watt University Dubai",
        "countryCode": "AE",
        "countryName": "United Arab Emirates",
        "fromCity": "Lucknow",
        "previousQualification": "Class 12 — Commerce, 81%",
        "intakeYear": 2025,
        "scholarshipPercent": 20,
        "rating": 4,
        "isFeatured": false,
        "isPublished": true,
        "createdAt": "2026-08-20T06:30:21.176Z",
        "updatedAt": "2026-08-20T06:30:21.176Z",
        "__v": 0
      },
      {
        "_id": "6a869efde5042bce96b2a267",
        "studentName": "Meera Nair",
        "avatar": "",
        "quote": "My cousin was refused a visa two years earlier, so we were nervous. Getting the financial documents right the first time — and understanding exactly what the officer looks for — made the difference.",
        "courseTitle": "MS Information Systems",
        "universityName": "Northeastern University",
        "countryCode": "US",
        "countryName": "United States",
        "fromCity": "Thiruvananthapuram",
        "previousQualification": "BCA, 79%",
        "intakeYear": 2024,
        "scholarshipPercent": 30,
        "rating": 5,
        "isFeatured": false,
        "isPublished": true,
        "createdAt": "2026-08-20T06:30:21.119Z",
        "updatedAt": "2026-08-20T06:30:21.119Z",
        "__v": 0
      }
    ]
  },
  "/courses": {
    "data": [
      {
        "_id": "6a869ef9e5042bce96b2a1bc",
        "slug": "msc-informatics-technical-university-of-munich",
        "title": "MSc Informatics",
        "universityName": "Technical University of Munich",
        "countryCode": "DE",
        "city": "Munich",
        "degreeLevel": "Masters",
        "field": "computer_science",
        "durationMonths": 24,
        "tuitionPerYear": {
          "amount": 500,
          "currency": "EUR"
        },
        "tuitionPerYearInr": 48000,
        "intakes": [
          "April",
          "October"
        ],
        "requirements": {
          "minEducationLevel": "bachelors",
          "minSecondaryPercentage": null,
          "minTertiaryPercentage": 80,
          "minIelts": 6.5,
          "maxBacklogs": 0,
          "minWorkExperienceYears": 0,
          "additional": [
            "Computer science bachelor’s with matching module coverage",
            "Aptitude assessment interview"
          ]
        },
        "scholarship": {
          "available": false,
          "maxPercentOfTuition": 0,
          "note": ""
        },
        "careerOutcomes": [
          "Software engineer",
          "Research engineer",
          "Systems architect"
        ],
        "highlights": [
          "No tuition — semester fee only",
          "Top 30 worldwide",
          "18-month job-seeker visa after graduation"
        ],
        "summary": "Effectively free tuition at a top-30 university, which is exactly why admission is the most competitive in this catalogue. Living costs are the real budget line.",
        "programmeCostInr": 1656000,
        "match": null,
        "university": {
          "_id": "6a869ef5e5042bce96b2a13b",
          "name": "Technical University of Munich",
          "slug": "technical-university-of-munich",
          "city": "Munich",
          "worldRanking": 28,
          "acceptanceRate": 8,
          "scholarshipAvailable": false
        },
        "country": {
          "code": "DE",
          "name": "Germany",
          "flag": "🇩🇪",
          "slug": "germany",
          "livingCostPerYearInr": 780000
        }
      },
      {
        "_id": "6a869ef9e5042bce96b2a1c8",
        "slug": "studienkolleg-foundation-year-t-course-srh-berlin-university-of-applied-sciences",
        "title": "Studienkolleg Foundation Year (T-Course)",
        "universityName": "SRH Berlin University of Applied Sciences",
        "countryCode": "DE",
        "city": "Berlin",
        "degreeLevel": "Foundation",
        "field": "engineering",
        "durationMonths": 12,
        "tuitionPerYear": {
          "amount": 9000,
          "currency": "EUR"
        },
        "tuitionPerYearInr": 864000,
        "intakes": [
          "April",
          "October"
        ],
        "requirements": {
          "minEducationLevel": "class_12_pursuing",
          "minSecondaryPercentage": 50,
          "minTertiaryPercentage": null,
          "minIelts": 5.5,
          "maxBacklogs": 5,
          "minWorkExperienceYears": 0,
          "additional": []
        },
        "scholarship": {
          "available": false,
          "maxPercentOfTuition": 0,
          "note": ""
        },
        "careerOutcomes": [
          "Progression to a German bachelor’s degree"
        ],
        "highlights": [
          "Bridges 12 years of schooling to Germany’s 13",
          "German language included",
          "Opens tuition-free public universities"
        ],
        "summary": "The Studienkolleg is the formal bridge Indian Class 12 students need for German bachelor’s admission — one paid year that unlocks tuition-free public universities afterwards.",
        "programmeCostInr": 1644000,
        "match": null,
        "university": {
          "_id": "6a869ef5e5042bce96b2a141",
          "name": "SRH Berlin University of Applied Sciences",
          "slug": "srh-berlin-university-of-applied-sciences",
          "city": "Berlin",
          "worldRanking": null,
          "acceptanceRate": 55,
          "scholarshipAvailable": true
        },
        "country": {
          "code": "DE",
          "name": "Germany",
          "flag": "🇩🇪",
          "slug": "germany",
          "livingCostPerYearInr": 780000
        }
      },
      {
        "_id": "6a869ef8e5042bce96b2a19b",
        "slug": "computer-programming-and-analysis-advanced-diploma-conestoga-college",
        "title": "Computer Programming and Analysis (Advanced Diploma)",
        "universityName": "Conestoga College",
        "countryCode": "CA",
        "city": "Kitchener",
        "degreeLevel": "Diploma",
        "field": "computer_science",
        "durationMonths": 36,
        "tuitionPerYear": {
          "amount": 17000,
          "currency": "CAD"
        },
        "tuitionPerYearInr": 1088000,
        "intakes": [
          "January",
          "May",
          "September"
        ],
        "requirements": {
          "minEducationLevel": "class_12",
          "minSecondaryPercentage": 60,
          "minTertiaryPercentage": null,
          "minIelts": 6,
          "maxBacklogs": 5,
          "minWorkExperienceYears": 0,
          "additional": []
        },
        "scholarship": {
          "available": false,
          "maxPercentOfTuition": 0,
          "note": ""
        },
        "careerOutcomes": [
          "Application developer",
          "Junior software developer",
          "Support analyst"
        ],
        "highlights": [
          "3-year PGWP on completion",
          "Co-op work terms",
          "Direct entry from Class 12"
        ],
        "summary": "A three-year career diploma straight from Class 12 that earns a full three-year work permit — the most common Canadian route for students who are not aiming at a research degree.",
        "programmeCostInr": 5664000,
        "match": null,
        "university": {
          "_id": "6a869ef5e5042bce96b2a12f",
          "name": "Conestoga College",
          "slug": "conestoga-college",
          "city": "Kitchener",
          "worldRanking": null,
          "acceptanceRate": 60,
          "scholarshipAvailable": false
        },
        "country": {
          "code": "CA",
          "name": "Canada",
          "flag": "🇨🇦",
          "slug": "canada",
          "livingCostPerYearInr": 800000
        }
      },
      {
        "_id": "6a869efbe5042bce96b2a207",
        "slug": "bba-bachelor-of-business-administration-amity-university-dubai",
        "title": "BBA (Bachelor of Business Administration)",
        "universityName": "Amity University Dubai",
        "countryCode": "AE",
        "city": "Dubai",
        "degreeLevel": "Bachelors",
        "field": "business",
        "durationMonths": 36,
        "tuitionPerYear": {
          "amount": 48000,
          "currency": "AED"
        },
        "tuitionPerYearInr": 1152000,
        "intakes": [
          "January",
          "September"
        ],
        "requirements": {
          "minEducationLevel": "class_12",
          "minSecondaryPercentage": 50,
          "minTertiaryPercentage": null,
          "minIelts": 5.5,
          "maxBacklogs": 5,
          "minWorkExperienceYears": 0,
          "additional": []
        },
        "scholarship": {
          "available": true,
          "maxPercentOfTuition": 30,
          "note": "Merit scholarship on Class 12 marks."
        },
        "careerOutcomes": [
          "Business development executive",
          "Retail manager",
          "Family business role"
        ],
        "highlights": [
          "50% Class 12 entry",
          "Semester exchange with Amity India",
          "Lowest-cost bachelor’s here"
        ],
        "summary": "The most accessible bachelor’s in this catalogue — 50% in Class 12, IELTS 5.5, and fees under ₹12L a year.",
        "programmeCostInr": 5556000,
        "match": null,
        "university": {
          "_id": "6a869ef6e5042bce96b2a159",
          "name": "Amity University Dubai",
          "slug": "amity-university-dubai",
          "city": "Dubai",
          "worldRanking": null,
          "acceptanceRate": 80,
          "scholarshipAvailable": true
        },
        "country": {
          "code": "AE",
          "name": "United Arab Emirates",
          "flag": "🇦🇪",
          "slug": "united-arab-emirates",
          "livingCostPerYearInr": 700000
        }
      },
      {
        "_id": "6a869ef7e5042bce96b2a183",
        "slug": "international-foundation-year-engineering-and-computing-coventry-university",
        "title": "International Foundation Year — Engineering and Computing",
        "universityName": "Coventry University",
        "countryCode": "GB",
        "city": "Coventry",
        "degreeLevel": "Foundation",
        "field": "engineering",
        "durationMonths": 12,
        "tuitionPerYear": {
          "amount": 14000,
          "currency": "GBP"
        },
        "tuitionPerYearInr": 1568000,
        "intakes": [
          "January",
          "September"
        ],
        "requirements": {
          "minEducationLevel": "class_12_pursuing",
          "minSecondaryPercentage": 55,
          "minTertiaryPercentage": null,
          "minIelts": 5.5,
          "maxBacklogs": 5,
          "minWorkExperienceYears": 0,
          "additional": []
        },
        "scholarship": {
          "available": false,
          "maxPercentOfTuition": 0,
          "note": ""
        },
        "careerOutcomes": [
          "Progression to a UK engineering or computing degree"
        ],
        "highlights": [
          "Guaranteed progression on pass",
          "January start available",
          "Lowest-cost UK pathway on this list"
        ],
        "summary": "The standard UK route for students whose Class 12 result or English score is short of direct entry — one year, then straight into year 1 of the degree.",
        "programmeCostInr": 2518000,
        "match": null,
        "university": {
          "_id": "6a869ef5e5042bce96b2a126",
          "name": "Coventry University",
          "slug": "coventry-university",
          "city": "Coventry",
          "worldRanking": 601,
          "acceptanceRate": 82,
          "scholarshipAvailable": true
        },
        "country": {
          "code": "GB",
          "name": "United Kingdom",
          "flag": "🇬🇧",
          "slug": "united-kingdom",
          "livingCostPerYearInr": 950000
        }
      },
      {
        "_id": "6a869efae5042bce96b2a1f8",
        "slug": "beng-hons-mechanical-engineering-heriot-watt-university-dubai",
        "title": "BEng (Hons) Mechanical Engineering",
        "universityName": "Heriot-Watt University Dubai",
        "countryCode": "AE",
        "city": "Dubai",
        "degreeLevel": "Bachelors",
        "field": "engineering",
        "durationMonths": 48,
        "tuitionPerYear": {
          "amount": 68000,
          "currency": "AED"
        },
        "tuitionPerYearInr": 1632000,
        "intakes": [
          "January",
          "September"
        ],
        "requirements": {
          "minEducationLevel": "class_12",
          "minSecondaryPercentage": 60,
          "minTertiaryPercentage": null,
          "minIelts": 6,
          "maxBacklogs": 3,
          "minWorkExperienceYears": 0,
          "additional": []
        },
        "scholarship": {
          "available": true,
          "maxPercentOfTuition": 25,
          "note": "Academic excellence scholarship, assessed on Class 12 marks."
        },
        "careerOutcomes": [
          "Mechanical engineer",
          "Project engineer",
          "Maintenance engineer"
        ],
        "highlights": [
          "UK degree, UAE fees",
          "Transfer to Edinburgh after year 2",
          "Three hours from home"
        ],
        "summary": "A UK engineering degree awarded in Dubai at roughly half the UK cost, with the option to finish in Edinburgh.",
        "programmeCostInr": 9328000,
        "match": null,
        "university": {
          "_id": "6a869ef6e5042bce96b2a153",
          "name": "Heriot-Watt University Dubai",
          "slug": "heriot-watt-university-dubai",
          "city": "Dubai",
          "worldRanking": 281,
          "acceptanceRate": 70,
          "scholarshipAvailable": true
        },
        "country": {
          "code": "AE",
          "name": "United Arab Emirates",
          "flag": "🇦🇪",
          "slug": "united-arab-emirates",
          "livingCostPerYearInr": 700000
        }
      },
      {
        "_id": "6a869efae5042bce96b2a1dd",
        "slug": "msc-computing-secure-software-engineering-dublin-city-university",
        "title": "MSc Computing (Secure Software Engineering)",
        "universityName": "Dublin City University",
        "countryCode": "IE",
        "city": "Dublin",
        "degreeLevel": "Masters",
        "field": "computer_science",
        "durationMonths": 12,
        "tuitionPerYear": {
          "amount": 18000,
          "currency": "EUR"
        },
        "tuitionPerYearInr": 1728000,
        "intakes": [
          "January",
          "September"
        ],
        "requirements": {
          "minEducationLevel": "bachelors",
          "minSecondaryPercentage": null,
          "minTertiaryPercentage": 58,
          "minIelts": 6.5,
          "maxBacklogs": 4,
          "minWorkExperienceYears": 0,
          "additional": []
        },
        "scholarship": {
          "available": true,
          "maxPercentOfTuition": 15,
          "note": "DCU international merit award."
        },
        "careerOutcomes": [
          "Security engineer",
          "Software engineer",
          "DevSecOps engineer"
        ],
        "highlights": [
          "January intake",
          "Lowest Dublin fees on this list",
          "INTRA work placement option"
        ],
        "summary": "The most affordable Dublin computing master’s here, with a January intake and a 58% entry requirement.",
        "programmeCostInr": 2628000,
        "match": null,
        "university": {
          "_id": "6a869ef6e5042bce96b2a14a",
          "name": "Dublin City University",
          "slug": "dublin-city-university",
          "city": "Dublin",
          "worldRanking": 421,
          "acceptanceRate": 60,
          "scholarshipAvailable": true
        },
        "country": {
          "code": "IE",
          "name": "Ireland",
          "flag": "🇮🇪",
          "slug": "ireland",
          "livingCostPerYearInr": 900000
        }
      },
      {
        "_id": "6a869ef9e5042bce96b2a1b3",
        "slug": "foundation-studies-deakin-college-deakin-university",
        "title": "Foundation Studies (Deakin College)",
        "universityName": "Deakin University",
        "countryCode": "AU",
        "city": "Geelong",
        "degreeLevel": "Foundation",
        "field": "business",
        "durationMonths": 12,
        "tuitionPerYear": {
          "amount": 32000,
          "currency": "AUD"
        },
        "tuitionPerYearInr": 1856000,
        "intakes": [
          "February",
          "July"
        ],
        "requirements": {
          "minEducationLevel": "class_11",
          "minSecondaryPercentage": 55,
          "minTertiaryPercentage": null,
          "minIelts": 5.5,
          "maxBacklogs": 5,
          "minWorkExperienceYears": 0,
          "additional": []
        },
        "scholarship": {
          "available": false,
          "maxPercentOfTuition": 0,
          "note": ""
        },
        "careerOutcomes": [
          "Progression to a Deakin bachelor’s degree"
        ],
        "highlights": [
          "Entry from Class 11 marks",
          "Guaranteed degree progression",
          "Two intakes a year"
        ],
        "summary": "One of the few pathways that admits on Class 11 results, so a student can start planning before Class 12 finishes.",
        "programmeCostInr": 2736000,
        "match": null,
        "university": {
          "_id": "6a869ef5e5042bce96b2a138",
          "name": "Deakin University",
          "slug": "deakin-university",
          "city": "Geelong",
          "worldRanking": 233,
          "acceptanceRate": 65,
          "scholarshipAvailable": true
        },
        "country": {
          "code": "AU",
          "name": "Australia",
          "flag": "🇦🇺",
          "slug": "australia",
          "livingCostPerYearInr": 880000
        }
      },
      {
        "_id": "6a869efae5042bce96b2a1ef",
        "slug": "bachelor-of-computer-and-information-sciences-auckland-university-of-technology",
        "title": "Bachelor of Computer and Information Sciences",
        "universityName": "Auckland University of Technology",
        "countryCode": "NZ",
        "city": "Auckland",
        "degreeLevel": "Bachelors",
        "field": "computer_science",
        "durationMonths": 36,
        "tuitionPerYear": {
          "amount": 38000,
          "currency": "NZD"
        },
        "tuitionPerYearInr": 2014000,
        "intakes": [
          "February",
          "July"
        ],
        "requirements": {
          "minEducationLevel": "class_12",
          "minSecondaryPercentage": 65,
          "minTertiaryPercentage": null,
          "minIelts": 6,
          "maxBacklogs": 3,
          "minWorkExperienceYears": 0,
          "additional": []
        },
        "scholarship": {
          "available": true,
          "maxPercentOfTuition": 15,
          "note": "AUT international student scholarship."
        },
        "careerOutcomes": [
          "Software developer",
          "Network engineer",
          "IT analyst"
        ],
        "highlights": [
          "Two intakes a year",
          "Industry capstone",
          "Accessible entry requirements"
        ],
        "summary": "A practical computing degree with genuinely reachable entry requirements and the lowest fees of the New Zealand options here.",
        "programmeCostInr": 8382000,
        "match": null,
        "university": {
          "_id": "6a869ef6e5042bce96b2a150",
          "name": "Auckland University of Technology",
          "slug": "auckland-university-of-technology",
          "city": "Auckland",
          "worldRanking": 407,
          "acceptanceRate": 70,
          "scholarshipAvailable": true
        },
        "country": {
          "code": "NZ",
          "name": "New Zealand",
          "flag": "🇳🇿",
          "slug": "new-zealand",
          "livingCostPerYearInr": 780000
        }
      },
      {
        "_id": "6a869ef8e5042bce96b2a195",
        "slug": "msc-computer-science-with-co-op-university-of-windsor",
        "title": "MSc Computer Science (with co-op)",
        "universityName": "University of Windsor",
        "countryCode": "CA",
        "city": "Windsor",
        "degreeLevel": "Masters",
        "field": "computer_science",
        "durationMonths": 24,
        "tuitionPerYear": {
          "amount": 32000,
          "currency": "CAD"
        },
        "tuitionPerYearInr": 2048000,
        "intakes": [
          "January",
          "May",
          "September"
        ],
        "requirements": {
          "minEducationLevel": "bachelors",
          "minSecondaryPercentage": null,
          "minTertiaryPercentage": 70,
          "minIelts": 6.5,
          "maxBacklogs": 3,
          "minWorkExperienceYears": 0,
          "additional": []
        },
        "scholarship": {
          "available": true,
          "maxPercentOfTuition": 10,
          "note": "International graduate entrance award."
        },
        "careerOutcomes": [
          "Software developer",
          "Data engineer",
          "QA automation engineer"
        ],
        "highlights": [
          "Co-op work terms",
          "Three intakes",
          "Lower Ontario living costs"
        ],
        "summary": "A co-op computer science master’s at roughly half Toronto’s fees, in a city where rent is a fraction of the GTA.",
        "programmeCostInr": 5696000,
        "match": null,
        "university": {
          "_id": "6a869ef5e5042bce96b2a12c",
          "name": "University of Windsor",
          "slug": "university-of-windsor",
          "city": "Windsor",
          "worldRanking": 601,
          "acceptanceRate": 70,
          "scholarshipAvailable": true
        },
        "country": {
          "code": "CA",
          "name": "Canada",
          "flag": "🇨🇦",
          "slug": "canada",
          "livingCostPerYearInr": 800000
        }
      },
      {
        "_id": "6a869ef7e5042bce96b2a189",
        "slug": "msc-data-science-and-computational-intelligence-coventry-university",
        "title": "MSc Data Science and Computational Intelligence",
        "universityName": "Coventry University",
        "countryCode": "GB",
        "city": "Coventry",
        "degreeLevel": "Masters",
        "field": "data_analytics",
        "durationMonths": 12,
        "tuitionPerYear": {
          "amount": 19000,
          "currency": "GBP"
        },
        "tuitionPerYearInr": 2128000,
        "intakes": [
          "January",
          "May",
          "September"
        ],
        "requirements": {
          "minEducationLevel": "bachelors",
          "minSecondaryPercentage": null,
          "minTertiaryPercentage": 55,
          "minIelts": 6.5,
          "maxBacklogs": 5,
          "minWorkExperienceYears": 0,
          "additional": []
        },
        "scholarship": {
          "available": true,
          "maxPercentOfTuition": 15,
          "note": "Early acceptance discount."
        },
        "careerOutcomes": [
          "Data analyst",
          "BI developer",
          "Data scientist"
        ],
        "highlights": [
          "Three intakes a year",
          "Accepts 55% degrees",
          "Two-year Graduate Route visa"
        ],
        "summary": "The most accessible UK data science master’s on this list, with three intakes a year and a 55% entry requirement.",
        "programmeCostInr": 3078000,
        "match": null,
        "university": {
          "_id": "6a869ef5e5042bce96b2a126",
          "name": "Coventry University",
          "slug": "coventry-university",
          "city": "Coventry",
          "worldRanking": 601,
          "acceptanceRate": 82,
          "scholarshipAvailable": true
        },
        "country": {
          "code": "GB",
          "name": "United Kingdom",
          "flag": "🇬🇧",
          "slug": "united-kingdom",
          "livingCostPerYearInr": 950000
        }
      },
      {
        "_id": "6a869efae5042bce96b2a1d7",
        "slug": "msc-business-analytics-university-college-dublin",
        "title": "MSc Business Analytics",
        "universityName": "University College Dublin",
        "countryCode": "IE",
        "city": "Dublin",
        "degreeLevel": "Masters",
        "field": "data_analytics",
        "durationMonths": 12,
        "tuitionPerYear": {
          "amount": 24000,
          "currency": "EUR"
        },
        "tuitionPerYearInr": 2304000,
        "intakes": [
          "September"
        ],
        "requirements": {
          "minEducationLevel": "bachelors",
          "minSecondaryPercentage": null,
          "minTertiaryPercentage": 65,
          "minIelts": 6.5,
          "maxBacklogs": 3,
          "minWorkExperienceYears": 0,
          "additional": []
        },
        "scholarship": {
          "available": true,
          "maxPercentOfTuition": 25,
          "note": "UCD Global Excellence Scholarship for Indian students."
        },
        "careerOutcomes": [
          "Business analyst",
          "Consultant",
          "Data analyst"
        ],
        "highlights": [
          "Smurfit Business School",
          "25% India scholarship",
          "Capstone with a live client"
        ],
        "summary": "Business analytics at Ireland’s leading business school, where the India scholarship materially changes the cost.",
        "programmeCostInr": 3204000,
        "match": null,
        "university": {
          "_id": "6a869ef5e5042bce96b2a147",
          "name": "University College Dublin",
          "slug": "university-college-dublin",
          "city": "Dublin",
          "worldRanking": 126,
          "acceptanceRate": 45,
          "scholarshipAvailable": true
        },
        "country": {
          "code": "IE",
          "name": "Ireland",
          "flag": "🇮🇪",
          "slug": "ireland",
          "livingCostPerYearInr": 900000
        }
      }
    ],
    "meta": {
      "page": 1,
      "limit": 12,
      "total": 59,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false,
      "personalized": false
    }
  },
  "/scholarships": {
    "data": [
      {
        "_id": "6a869efbe5042bce96b2a231",
        "name": "Health Sciences Access Grant",
        "provider": "University of Auckland",
        "university": "6a869ef6e5042bce96b2a14d",
        "universityName": "University of Auckland",
        "countryCode": "NZ",
        "countryName": "New Zealand",
        "award": {
          "type": "fixed",
          "amount": 8000,
          "currency": "NZD",
          "amountInr": 424000,
          "recurrence": "per_year",
          "percentOfTuition": 0
        },
        "coverage": [
          "Tuition",
          "Books"
        ],
        "eligibility": {
          "degreeLevels": [
            "Bachelors"
          ],
          "fields": [
            "health_sciences",
            "life_sciences"
          ],
          "minPercentage": 80,
          "needsFinancialNeed": true,
          "minIelts": null,
          "nationalities": [],
          "notes": ""
        },
        "deadline": "2026-08-28T06:30:19.876Z",
        "automatic": false,
        "applicationUrl": "",
        "description": "Needs-assessed award for undergraduate health and life sciences students.",
        "isActive": true,
        "slug": "health-sciences-access-grant-university-of-auckland",
        "createdAt": "2026-08-20T06:30:19.905Z",
        "updatedAt": "2026-08-20T06:30:19.905Z",
        "__v": 0,
        "daysRemaining": 8
      },
      {
        "_id": "6a869efbe5042bce96b2a21f",
        "name": "Chevening-style Leadership Award",
        "provider": "UK Government (demonstration)",
        "university": null,
        "universityName": "",
        "countryCode": "GB",
        "countryName": "United Kingdom",
        "award": {
          "type": "full",
          "currency": "INR",
          "amountInr": null,
          "recurrence": "per_year",
          "percentOfTuition": 0,
          "amount": 0
        },
        "coverage": [
          "Full tuition",
          "Living stipend",
          "Return airfare"
        ],
        "eligibility": {
          "degreeLevels": [
            "Masters"
          ],
          "minPercentage": 80,
          "minIelts": 6.5,
          "needsFinancialNeed": false,
          "fields": [],
          "nationalities": [],
          "notes": ""
        },
        "deadline": "2026-09-01T06:30:19.507Z",
        "automatic": false,
        "applicationUrl": "",
        "description": "Fully funded one-year master’s for applicants with demonstrated leadership and work experience.",
        "isActive": true,
        "slug": "chevening-style-leadership-award-uk-government-demonstration",
        "createdAt": "2026-08-20T06:30:19.535Z",
        "updatedAt": "2026-08-20T06:30:19.535Z",
        "__v": 0,
        "daysRemaining": 12
      },
      {
        "_id": "6a869efce5042bce96b2a24f",
        "name": "Regional Access Scholarship",
        "provider": "University of Windsor",
        "university": "6a869ef5e5042bce96b2a12c",
        "universityName": "University of Windsor",
        "countryCode": "CA",
        "countryName": "Canada",
        "award": {
          "type": "fixed",
          "amount": 6000,
          "currency": "CAD",
          "amountInr": 384000,
          "recurrence": "per_year",
          "percentOfTuition": 0
        },
        "coverage": [
          "Tuition"
        ],
        "eligibility": {
          "degreeLevels": [
            "Bachelors",
            "Diploma"
          ],
          "minPercentage": 65,
          "needsFinancialNeed": true,
          "fields": [],
          "minIelts": null,
          "nationalities": [],
          "notes": ""
        },
        "deadline": "2026-09-04T06:30:20.565Z",
        "automatic": false,
        "applicationUrl": "",
        "description": "Needs-assessed award for undergraduate students studying outside Canada’s largest cities.",
        "isActive": true,
        "slug": "regional-access-scholarship-university-of-windsor",
        "createdAt": "2026-08-20T06:30:20.598Z",
        "updatedAt": "2026-08-20T06:30:20.598Z",
        "__v": 0,
        "daysRemaining": 15
      },
      {
        "_id": "6a869efce5042bce96b2a243",
        "name": "Data and Analytics Talent Award",
        "provider": "Northeastern University",
        "university": "6a869ef4e5042bce96b2a11a",
        "universityName": "Northeastern University",
        "countryCode": "US",
        "countryName": "United States",
        "award": {
          "type": "fixed",
          "amount": 15000,
          "currency": "USD",
          "amountInr": 1320000,
          "recurrence": "one_time",
          "percentOfTuition": 0
        },
        "coverage": [
          "Tuition"
        ],
        "eligibility": {
          "degreeLevels": [
            "Masters"
          ],
          "fields": [
            "data_analytics",
            "computer_science"
          ],
          "minPercentage": 75,
          "minIelts": 6.5,
          "nationalities": [],
          "needsFinancialNeed": false,
          "notes": ""
        },
        "deadline": "2026-09-07T06:30:20.295Z",
        "automatic": false,
        "applicationUrl": "",
        "description": "One-time tuition award for analytics and computing master’s applicants with a strong quantitative record.",
        "isActive": true,
        "slug": "data-and-analytics-talent-award-northeastern-university",
        "createdAt": "2026-08-20T06:30:20.324Z",
        "updatedAt": "2026-08-20T06:30:20.324Z",
        "__v": 0,
        "daysRemaining": 18
      },
      {
        "_id": "6a869efbe5042bce96b2a219",
        "name": "Vice-Chancellor’s International Scholarship",
        "provider": "University of Auckland",
        "university": "6a869ef6e5042bce96b2a14d",
        "universityName": "University of Auckland",
        "countryCode": "NZ",
        "countryName": "New Zealand",
        "award": {
          "type": "fixed",
          "amount": 10000,
          "currency": "NZD",
          "amountInr": 530000,
          "recurrence": "one_time",
          "percentOfTuition": 0
        },
        "coverage": [
          "Tuition"
        ],
        "eligibility": {
          "degreeLevels": [
            "Bachelors"
          ],
          "minPercentage": 85,
          "minIelts": 6,
          "fields": [],
          "nationalities": [],
          "needsFinancialNeed": false,
          "notes": ""
        },
        "deadline": "2026-09-10T06:30:19.384Z",
        "automatic": false,
        "applicationUrl": "",
        "description": "For first-year undergraduates with outstanding Class 12 results.",
        "isActive": true,
        "slug": "vice-chancellors-international-scholarship-university-of-auckland",
        "createdAt": "2026-08-20T06:30:19.412Z",
        "updatedAt": "2026-08-20T06:30:19.412Z",
        "__v": 0,
        "daysRemaining": 21
      },
      {
        "_id": "6a869efce5042bce96b2a23d",
        "name": "First-Generation Student Award",
        "provider": "Orbitwise Partner Network",
        "university": null,
        "universityName": "",
        "countryCode": "",
        "countryName": "",
        "award": {
          "type": "fixed",
          "amount": 250000,
          "currency": "INR",
          "amountInr": 250000,
          "recurrence": "one_time",
          "percentOfTuition": 0
        },
        "coverage": [
          "Tuition contribution"
        ],
        "eligibility": {
          "minPercentage": 65,
          "needsFinancialNeed": true,
          "degreeLevels": [],
          "fields": [],
          "minIelts": null,
          "nationalities": [],
          "notes": ""
        },
        "deadline": "2026-09-15T06:30:20.156Z",
        "automatic": false,
        "applicationUrl": "",
        "description": "For students who would be the first in their family to study at university abroad. Any destination.",
        "isActive": true,
        "slug": "first-generation-student-award-orbitwise-partner-network",
        "createdAt": "2026-08-20T06:30:20.190Z",
        "updatedAt": "2026-08-20T06:30:20.190Z",
        "__v": 0,
        "daysRemaining": 26
      },
      {
        "_id": "6a869efbe5042bce96b2a225",
        "name": "Ireland Higher Education Award",
        "provider": "University College Dublin",
        "university": "6a869ef5e5042bce96b2a147",
        "universityName": "University College Dublin",
        "countryCode": "IE",
        "countryName": "Ireland",
        "award": {
          "type": "fixed",
          "amount": 5000,
          "currency": "EUR",
          "amountInr": 480000,
          "recurrence": "one_time",
          "percentOfTuition": 0
        },
        "coverage": [
          "Tuition"
        ],
        "eligibility": {
          "degreeLevels": [
            "Masters"
          ],
          "minPercentage": 72,
          "minIelts": 6.5,
          "fields": [],
          "nationalities": [],
          "needsFinancialNeed": false,
          "notes": ""
        },
        "deadline": "2026-09-18T06:30:19.629Z",
        "automatic": false,
        "applicationUrl": "",
        "description": "Partial tuition award for postgraduate entrants from outside the EU.",
        "isActive": true,
        "slug": "ireland-higher-education-award-university-college-dublin",
        "createdAt": "2026-08-20T06:30:19.658Z",
        "updatedAt": "2026-08-20T06:30:19.658Z",
        "__v": 0,
        "daysRemaining": 29
      },
      {
        "_id": "6a869efbe5042bce96b2a22b",
        "name": "Commerce and Business Entry Award",
        "provider": "University of Melbourne",
        "university": "6a869ef5e5042bce96b2a132",
        "universityName": "University of Melbourne",
        "countryCode": "AU",
        "countryName": "Australia",
        "award": {
          "type": "percentage",
          "percentOfTuition": 15,
          "currency": "INR",
          "amountInr": null,
          "recurrence": "per_year",
          "amount": 0
        },
        "coverage": [
          "Tuition"
        ],
        "eligibility": {
          "degreeLevels": [
            "Bachelors"
          ],
          "fields": [
            "business"
          ],
          "minPercentage": 75,
          "minIelts": null,
          "nationalities": [],
          "needsFinancialNeed": false,
          "notes": ""
        },
        "deadline": "2026-09-23T06:30:19.753Z",
        "automatic": false,
        "applicationUrl": "",
        "description": "For Class 12 commerce students entering an undergraduate business degree.",
        "isActive": true,
        "slug": "commerce-and-business-entry-award-university-of-melbourne",
        "createdAt": "2026-08-20T06:30:19.785Z",
        "updatedAt": "2026-08-20T06:30:19.785Z",
        "__v": 0,
        "daysRemaining": 34
      },
      {
        "_id": "6a869efce5042bce96b2a246",
        "name": "Hospitality Industry Placement Award",
        "provider": "Heriot-Watt University Dubai",
        "university": "6a869ef6e5042bce96b2a153",
        "universityName": "Heriot-Watt University Dubai",
        "countryCode": "AE",
        "countryName": "United Arab Emirates",
        "award": {
          "type": "percentage",
          "percentOfTuition": 25,
          "currency": "INR",
          "amountInr": null,
          "recurrence": "per_year",
          "amount": 0
        },
        "coverage": [
          "Tuition",
          "Paid industry placement"
        ],
        "eligibility": {
          "degreeLevels": [
            "Bachelors",
            "Diploma"
          ],
          "fields": [
            "hospitality",
            "business"
          ],
          "minPercentage": 62,
          "minIelts": null,
          "nationalities": [],
          "needsFinancialNeed": false,
          "notes": ""
        },
        "deadline": "2026-09-25T06:30:20.358Z",
        "automatic": false,
        "applicationUrl": "",
        "description": "Combines a tuition reduction with a guaranteed paid placement in a Dubai hotel group.",
        "isActive": true,
        "slug": "hospitality-industry-placement-award-heriot-watt-university-dubai",
        "createdAt": "2026-08-20T06:30:20.399Z",
        "updatedAt": "2026-08-20T06:30:20.399Z",
        "__v": 0,
        "daysRemaining": 36
      },
      {
        "_id": "6a869efbe5042bce96b2a210",
        "name": "Global Excellence Scholarship",
        "provider": "University of Melbourne",
        "university": "6a869ef5e5042bce96b2a132",
        "universityName": "University of Melbourne",
        "countryCode": "AU",
        "countryName": "Australia",
        "award": {
          "type": "fixed",
          "amount": 20000,
          "currency": "AUD",
          "amountInr": 1160000,
          "recurrence": "one_time",
          "percentOfTuition": 0
        },
        "coverage": [
          "Tuition"
        ],
        "eligibility": {
          "degreeLevels": [
            "Masters"
          ],
          "minPercentage": 80,
          "minIelts": 6.5,
          "fields": [],
          "nationalities": [],
          "needsFinancialNeed": false,
          "notes": ""
        },
        "deadline": "2026-09-27T06:30:19.196Z",
        "automatic": false,
        "applicationUrl": "",
        "description": "Competitive award for high-achieving postgraduate applicants across all faculties.",
        "isActive": true,
        "slug": "global-excellence-scholarship-university-of-melbourne",
        "createdAt": "2026-08-20T06:30:19.231Z",
        "updatedAt": "2026-08-20T06:30:19.231Z",
        "__v": 0,
        "daysRemaining": 38
      },
      {
        "_id": "6a869efbe5042bce96b2a22e",
        "name": "Design and Media Portfolio Award",
        "provider": "Coventry University",
        "university": "6a869ef5e5042bce96b2a126",
        "universityName": "Coventry University",
        "countryCode": "GB",
        "countryName": "United Kingdom",
        "award": {
          "type": "fixed",
          "amount": 3000,
          "currency": "GBP",
          "amountInr": 336000,
          "recurrence": "one_time",
          "percentOfTuition": 0
        },
        "coverage": [
          "Tuition"
        ],
        "eligibility": {
          "degreeLevels": [
            "Bachelors",
            "Foundation"
          ],
          "fields": [
            "design",
            "media"
          ],
          "minPercentage": 60,
          "minIelts": null,
          "nationalities": [],
          "needsFinancialNeed": false,
          "notes": ""
        },
        "deadline": "2026-09-30T06:30:19.816Z",
        "automatic": false,
        "applicationUrl": "",
        "description": "Assessed on portfolio rather than marks alone, for creative undergraduate programmes.",
        "isActive": true,
        "slug": "design-and-media-portfolio-award-coventry-university",
        "createdAt": "2026-08-20T06:30:19.845Z",
        "updatedAt": "2026-08-20T06:30:19.845Z",
        "__v": 0,
        "daysRemaining": 41
      },
      {
        "_id": "6a869efbe5042bce96b2a222",
        "name": "Undergraduate Foundation Bursary",
        "provider": "Heriot-Watt University Dubai",
        "university": "6a869ef6e5042bce96b2a153",
        "universityName": "Heriot-Watt University Dubai",
        "countryCode": "AE",
        "countryName": "United Arab Emirates",
        "award": {
          "type": "percentage",
          "percentOfTuition": 20,
          "currency": "INR",
          "amountInr": null,
          "recurrence": "per_year",
          "amount": 0
        },
        "coverage": [
          "Tuition"
        ],
        "eligibility": {
          "degreeLevels": [
            "Foundation",
            "Bachelors"
          ],
          "minPercentage": 65,
          "fields": [],
          "minIelts": null,
          "nationalities": [],
          "needsFinancialNeed": false,
          "notes": ""
        },
        "deadline": "2026-10-04T06:30:19.568Z",
        "automatic": true,
        "applicationUrl": "",
        "description": "Reduces tuition for students entering a foundation or first-year programme in Dubai.",
        "isActive": true,
        "slug": "undergraduate-foundation-bursary-heriot-watt-university-dubai",
        "createdAt": "2026-08-20T06:30:19.599Z",
        "updatedAt": "2026-08-20T06:30:19.599Z",
        "__v": 0,
        "daysRemaining": 45
      }
    ],
    "meta": {
      "page": 1,
      "limit": 12,
      "total": 24,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false,
      "personalized": false
    }
  },
  "/universities": {
    "data": [
      {
        "_id": "6a869ef6e5042bce96b2a159",
        "name": "Amity University Dubai",
        "country": "6a869ef4e5042bce96b2a114",
        "countryCode": "AE",
        "city": "Dubai",
        "type": "private",
        "establishedYear": 2011,
        "worldRanking": null,
        "acceptanceRate": 80,
        "internationalStudentShare": 75,
        "description": "An accessible private campus in Dubai Knowledge Park with foundation, diploma and degree routes, and Indian-curriculum entry criteria.",
        "highlights": [
          "Accepts CBSE/ISC directly",
          "Foundation and diploma routes",
          "Lowest fees in the UAE list"
        ],
        "applicationFeeInr": 3500,
        "scholarshipAvailable": true,
        "isActive": true,
        "slug": "amity-university-dubai",
        "createdAt": "2026-08-20T06:30:14.493Z",
        "updatedAt": "2026-08-20T06:30:14.493Z",
        "__v": 0
      },
      {
        "_id": "6a869ef5e5042bce96b2a12f",
        "name": "Conestoga College",
        "country": "6a869ef4e5042bce96b2a105",
        "countryCode": "CA",
        "city": "Kitchener",
        "type": "public",
        "establishedYear": 1967,
        "worldRanking": null,
        "acceptanceRate": 60,
        "internationalStudentShare": 42,
        "description": "An Ontario public college offering two- and three-year career diplomas and postgraduate certificates, all PGWP-eligible — the most common route into Canadian work experience.",
        "highlights": [
          "Career diplomas from Class 12",
          "PGWP eligible",
          "Employer-designed curriculum"
        ],
        "applicationFeeInr": 8500,
        "scholarshipAvailable": false,
        "isActive": true,
        "slug": "conestoga-college",
        "createdAt": "2026-08-20T06:30:13.276Z",
        "updatedAt": "2026-08-20T06:30:13.276Z",
        "__v": 0
      },
      {
        "_id": "6a869ef5e5042bce96b2a141",
        "name": "SRH Berlin University of Applied Sciences",
        "country": "6a869ef4e5042bce96b2a10b",
        "countryCode": "DE",
        "city": "Berlin",
        "type": "private",
        "establishedYear": 2002,
        "worldRanking": null,
        "acceptanceRate": 55,
        "internationalStudentShare": 60,
        "description": "English-taught private university of applied sciences, with a Studienkolleg foundation year that admits Indian Class 12 students directly.",
        "highlights": [
          "English-taught, no German required",
          "Studienkolleg foundation route",
          "Berlin startup placements"
        ],
        "applicationFeeInr": 9000,
        "scholarshipAvailable": true,
        "isActive": true,
        "slug": "srh-berlin-university-of-applied-sciences",
        "createdAt": "2026-08-20T06:30:13.714Z",
        "updatedAt": "2026-08-20T06:30:13.714Z",
        "__v": 0
      },
      {
        "_id": "6a869ef5e5042bce96b2a132",
        "name": "University of Melbourne",
        "country": "6a869ef4e5042bce96b2a108",
        "countryCode": "AU",
        "city": "Melbourne",
        "type": "public",
        "establishedYear": 1853,
        "worldRanking": 13,
        "acceptanceRate": 70,
        "internationalStudentShare": 44,
        "description": "Australia’s leading university on most global rankings, with a research-intensive profile and the country’s largest graduate school.",
        "highlights": [
          "Top 15 worldwide",
          "Melbourne CBD campus",
          "Graduate Research Scholarships"
        ],
        "applicationFeeInr": 8000,
        "scholarshipAvailable": true,
        "isActive": true,
        "slug": "university-of-melbourne",
        "createdAt": "2026-08-20T06:30:13.344Z",
        "updatedAt": "2026-08-20T06:30:13.344Z",
        "__v": 0
      },
      {
        "_id": "6a869ef5e5042bce96b2a129",
        "name": "University of Toronto",
        "country": "6a869ef4e5042bce96b2a105",
        "countryCode": "CA",
        "city": "Toronto",
        "type": "public",
        "establishedYear": 1827,
        "worldRanking": 25,
        "acceptanceRate": 43,
        "internationalStudentShare": 28,
        "description": "Canada’s highest-ranked university and one of the world’s leading public research institutions, with three campuses across the Greater Toronto Area.",
        "highlights": [
          "Top 25 worldwide",
          "Birthplace of modern deep learning",
          "3-year PGWP eligible"
        ],
        "applicationFeeInr": 11000,
        "scholarshipAvailable": true,
        "isActive": true,
        "slug": "university-of-toronto",
        "createdAt": "2026-08-20T06:30:13.154Z",
        "updatedAt": "2026-08-20T06:30:13.154Z",
        "__v": 0
      },
      {
        "_id": "6a869ef5e5042bce96b2a13b",
        "name": "Technical University of Munich",
        "country": "6a869ef4e5042bce96b2a10b",
        "countryCode": "DE",
        "city": "Munich",
        "type": "public",
        "establishedYear": 1868,
        "worldRanking": 28,
        "acceptanceRate": 8,
        "internationalStudentShare": 32,
        "description": "Germany’s leading technical university, tuition-free apart from a semester contribution, and correspondingly one of the most competitive admissions in Europe.",
        "highlights": [
          "No tuition fees",
          "Top 30 worldwide",
          "Deep automotive and aerospace links"
        ],
        "applicationFeeInr": 6500,
        "scholarshipAvailable": false,
        "isActive": true,
        "slug": "technical-university-of-munich",
        "createdAt": "2026-08-20T06:30:13.567Z",
        "updatedAt": "2026-08-20T06:30:13.567Z",
        "__v": 0
      },
      {
        "_id": "6a869ef4e5042bce96b2a120",
        "name": "University of Manchester",
        "country": "6a869ef4e5042bce96b2a100",
        "countryCode": "GB",
        "city": "Manchester",
        "type": "public",
        "establishedYear": 1824,
        "worldRanking": 34,
        "acceptanceRate": 56,
        "internationalStudentShare": 40,
        "description": "A Russell Group university with 25 Nobel laureates among its staff and alumni, and one of the largest single-site student populations in the UK.",
        "highlights": [
          "Russell Group",
          "25 Nobel laureates",
          "Two-year Graduate Route visa"
        ],
        "applicationFeeInr": 0,
        "scholarshipAvailable": true,
        "isActive": true,
        "slug": "university-of-manchester",
        "createdAt": "2026-08-20T06:30:12.971Z",
        "updatedAt": "2026-08-20T06:30:12.971Z",
        "__v": 0
      },
      {
        "_id": "6a869ef6e5042bce96b2a14d",
        "name": "University of Auckland",
        "country": "6a869ef4e5042bce96b2a111",
        "countryCode": "NZ",
        "city": "Auckland",
        "type": "public",
        "establishedYear": 1883,
        "worldRanking": 65,
        "acceptanceRate": 60,
        "internationalStudentShare": 26,
        "description": "New Zealand’s largest and highest-ranked university, with a foundation-year pathway designed for Indian Class 12 students.",
        "highlights": [
          "NZ’s #1 university",
          "Foundation year for CBSE/ISC students",
          "3-year open work visa"
        ],
        "applicationFeeInr": 6000,
        "scholarshipAvailable": true,
        "isActive": true,
        "slug": "university-of-auckland",
        "createdAt": "2026-08-20T06:30:14.098Z",
        "updatedAt": "2026-08-20T06:30:14.098Z",
        "__v": 0
      },
      {
        "_id": "6a869ef5e5042bce96b2a123",
        "name": "University of Birmingham",
        "country": "6a869ef4e5042bce96b2a100",
        "countryCode": "GB",
        "city": "Birmingham",
        "type": "public",
        "establishedYear": 1900,
        "worldRanking": 84,
        "acceptanceRate": 65,
        "internationalStudentShare": 35,
        "description": "Russell Group, campus-based, and the first English civic university — with a large business school and generous India-specific scholarships.",
        "highlights": [
          "Russell Group",
          "India excellence scholarships",
          "Campus university in a low-cost city"
        ],
        "applicationFeeInr": 0,
        "scholarshipAvailable": true,
        "isActive": true,
        "slug": "university-of-birmingham",
        "createdAt": "2026-08-20T06:30:13.032Z",
        "updatedAt": "2026-08-20T06:30:13.032Z",
        "__v": 0
      },
      {
        "_id": "6a869ef6e5042bce96b2a156",
        "name": "University of Birmingham Dubai",
        "country": "6a869ef4e5042bce96b2a114",
        "countryCode": "AE",
        "city": "Dubai",
        "type": "private",
        "establishedYear": 2018,
        "worldRanking": 84,
        "acceptanceRate": 65,
        "internationalStudentShare": 88,
        "description": "A Russell Group campus in Dubai Academic City, teaching the same curriculum and awarding the same degree as Birmingham in the UK.",
        "highlights": [
          "Russell Group degree",
          "Dubai Academic City",
          "Scholarships up to 50%"
        ],
        "applicationFeeInr": 4500,
        "scholarshipAvailable": true,
        "isActive": true,
        "slug": "university-of-birmingham-dubai",
        "createdAt": "2026-08-20T06:30:14.394Z",
        "updatedAt": "2026-08-20T06:30:14.394Z",
        "__v": 0
      },
      {
        "_id": "6a869ef5e5042bce96b2a144",
        "name": "Trinity College Dublin",
        "country": "6a869ef4e5042bce96b2a10e",
        "countryCode": "IE",
        "city": "Dublin",
        "type": "public",
        "establishedYear": 1592,
        "worldRanking": 87,
        "acceptanceRate": 34,
        "internationalStudentShare": 29,
        "description": "Ireland’s oldest and highest-ranked university, in the centre of Dublin, with particular strength in immunology, literature and computer science.",
        "highlights": [
          "Ireland’s #1 university",
          "City-centre campus",
          "2-year graduate stay-back"
        ],
        "applicationFeeInr": 5500,
        "scholarshipAvailable": true,
        "isActive": true,
        "slug": "trinity-college-dublin",
        "createdAt": "2026-08-20T06:30:13.778Z",
        "updatedAt": "2026-08-20T06:30:13.778Z",
        "__v": 0
      },
      {
        "_id": "6a869ef5e5042bce96b2a13e",
        "name": "RWTH Aachen University",
        "country": "6a869ef4e5042bce96b2a10b",
        "countryCode": "DE",
        "city": "Aachen",
        "type": "public",
        "establishedYear": 1870,
        "worldRanking": 99,
        "acceptanceRate": 20,
        "internationalStudentShare": 27,
        "description": "The largest engineering faculty in Germany, with industry-funded research institutes and no tuition fees for international students.",
        "highlights": [
          "No tuition fees",
          "Largest German engineering faculty",
          "Industry-embedded research"
        ],
        "applicationFeeInr": 6000,
        "scholarshipAvailable": false,
        "isActive": true,
        "slug": "rwth-aachen-university",
        "createdAt": "2026-08-20T06:30:13.650Z",
        "updatedAt": "2026-08-20T06:30:13.650Z",
        "__v": 0
      }
    ],
    "meta": {
      "page": 1,
      "limit": 12,
      "total": 23,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
};

export default FIXTURES;
