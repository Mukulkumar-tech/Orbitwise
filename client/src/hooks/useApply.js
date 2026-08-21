import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import useQuery from './useQuery.js';
import applicationService from '../services/applicationService.js';
import { PATHS } from '../constants/routes.js';
import { nextIntake } from '../constants/domain.js';

/**
 * Starting an application from a course card.
 *
 * A hook rather than three copies of the same handler: the dashboard, the match
 * list and the shortlist all offer Apply, and a student who applied from one
 * should see "View application" on the others. That only works if all three read
 * the same source of truth for what has already been applied to.
 *
 * The API rejects a duplicate with 409. Rather than surfacing that as an error
 * the student can do nothing about, an already-applied course navigates to the
 * existing record — the button says "View application" for the same reason.
 */
export default function useApply() {
  const navigate = useNavigate();
  const { data: applications, refetch } = useQuery((signal) => applicationService.list({}, signal), []);
  const [applyingSlug, setApplyingSlug] = useState(null);

  /** courseSlug → application id, from the snapshot the server stored at apply time. */
  const appliedBySlug = useMemo(() => {
    const map = new Map();
    for (const application of applications ?? []) {
      const slug = application.snapshot?.courseSlug;
      if (slug) map.set(slug, application._id);
    }
    return map;
  }, [applications]);

  const apply = useCallback(
    async (course) => {
      const existingId = appliedBySlug.get(course.slug);
      if (existingId) {
        navigate(PATHS.application(existingId));
        return;
      }

      setApplyingSlug(course.slug);
      try {
        const application = await applicationService.create({
          courseSlug: course.slug,
          // Recorded on the snapshot so the student can later see what the match
          // looked like when they committed, even after their profile changes.
          matchScore: course.match?.score ?? null,
          intake: nextIntake(course.intakes) ?? undefined,
        });

        toast.success('Application started — it is a draft until you submit it');
        navigate(PATHS.application(application._id));
      } catch (error) {
        // 409 means it already exists, most likely opened in another tab or by a
        // counsellor. Refetching turns the button into "View application" instead
        // of leaving it offering something that cannot succeed.
        if (/already/i.test(error.message)) {
          toast.error(error.message);
          await refetch();
        } else {
          toast.error(error.message);
        }
      } finally {
        setApplyingSlug(null);
      }
    },
    [appliedBySlug, navigate, refetch]
  );

  return {
    apply,
    /** True when this course already has an application. */
    hasApplied: useCallback((course) => appliedBySlug.has(course.slug), [appliedBySlug]),
    applyingSlug,
  };
}
