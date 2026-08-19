import Country from '../models/Country.js';
import University from '../models/University.js';
import Course from '../models/Course.js';
import Testimonial from '../models/Testimonial.js';
import Enquiry from '../models/Enquiry.js';
import sendEmail from './email/index.js';
import logger from '../config/logger.js';
import { env } from '../config/env.js';

/**
 * Reads for the public marketing site, plus the contact form.
 *
 * Kept separate from catalogueService because the audience differs: this composes
 * whole-page payloads for anonymous visitors, where catalogueService answers
 * precise catalogue queries for both visitors and signed-in students.
 */
export const publicService = {
  /**
   * Everything the homepage renders, in one request.
   *
   * A homepage that fires six requests shows six loading states and lands last on
   * the metric that matters. The counts come from the database rather than being
   * hardcoded, so the trust statistics can never claim more universities than the
   * catalogue actually holds.
   */
  async home() {
    const [countryCount, universityCount, courseCount, scholarshipCourseCount, destinations, universities, testimonials, cheapest] =
      await Promise.all([
        Country.countDocuments({ isActive: true }),
        University.countDocuments({ isActive: true }),
        Course.countDocuments({ isActive: true }),
        Course.countDocuments({ isActive: true, 'scholarship.available': true }),
        Country.find({ isActive: true })
          .select('code name slug flag currency livingCostPerYearInr tuitionRangeInr prPathway workRights summary typicalIelts')
          .sort({ name: 1 })
          .limit(8)
          .lean(),
        University.find({ isActive: true, scholarshipAvailable: true })
          .select('name slug countryCode city worldRanking acceptanceRate type scholarshipAvailable')
          .sort({ worldRanking: 1 })
          .limit(6)
          .lean(),
        Testimonial.find({ isPublished: true })
          .sort({ isFeatured: -1, intakeYear: -1 })
          .limit(6)
          .lean(),
        Course.find({ isActive: true }).sort({ tuitionPerYearInr: 1 }).select('tuitionPerYearInr').limit(1).lean(),
      ]);

    return {
      stats: {
        countries: countryCount,
        universities: universityCount,
        courses: courseCount,
        scholarshipCourses: scholarshipCourseCount,
        lowestTuitionInr: cheapest[0]?.tuitionPerYearInr ?? null,
      },
      destinations,
      universities,
      testimonials,
    };
  },

  async testimonials({ countryCode } = {}) {
    return Testimonial.find({ isPublished: true, ...(countryCode ? { countryCode } : {}) })
      .sort({ isFeatured: -1, intakeYear: -1 })
      .lean();
  },

  /**
   * Records a counselling request.
   *
   * Saved first, emailed second, and a delivery failure is logged rather than
   * thrown: the enquiry is already safe in the database, so failing the request
   * would tell a prospective student their message was lost when it was not.
   */
  async submitEnquiry(payload, { ip } = {}) {
    const enquiry = await Enquiry.create({ ...payload, submittedFromIp: ip ?? '' });

    const summary = [
      `Name:      ${enquiry.name}`,
      `Email:     ${enquiry.email}`,
      enquiry.phone ? `Phone:     ${enquiry.phone}` : null,
      enquiry.educationLevel ? `Education: ${enquiry.educationLevel}` : null,
      enquiry.interestedCountries.length ? `Countries: ${enquiry.interestedCountries.join(', ')}` : null,
      '',
      enquiry.message,
    ]
      .filter(Boolean)
      .join('\n');

    const delivery = await sendEmail({
      to: env.EMAIL_FROM,
      subject: `New counselling enquiry — ${enquiry.name}`,
      text: summary,
      html: `<pre style="font-family:inherit">${summary}</pre>`,
    });

    if (!delivery.delivered) {
      logger.warn(`Enquiry ${enquiry._id} saved but notification email failed.`);
    }

    // Only the reference goes back — echoing the stored document would leak the
    // triage fields (status, assignedTo, ip) to an anonymous submitter.
    return { reference: enquiry._id.toString(), name: enquiry.name };
  },
};

export default publicService;
