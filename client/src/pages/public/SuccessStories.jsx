import { Link, useSearchParams } from 'react-router-dom';
import { Quote } from 'lucide-react';

import PageHero from '../../components/shared/PageHero.jsx';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { StoryCard } from './home/Stories.jsx';
import useQuery from '../../hooks/useQuery.js';
import publicService from '../../services/publicService.js';
import catalogueService from '../../services/catalogueService.js';
import { PATHS } from '../../constants/routes.js';

export default function SuccessStories() {
  const [params, setParams] = useSearchParams();
  const countryCode = params.get('countryCode') ?? '';

  const { data: countries } = useQuery((signal) => catalogueService.listCountries(signal), []);
  const { data, isLoading, isError, error, refetch } = useQuery(
    () => publicService.testimonials(countryCode ? { countryCode } : undefined),
    [countryCode]
  );

  const setFilter = (code) => setParams(code ? { countryCode: code } : {}, { replace: true });

  return (
    <>
      <PageHero
        eyebrow="Success stories"
        title="Students who started where you are"
        description="Marks below a cut-off, a tight budget, a first attempt at IELTS, a visa refusal in the family — these are the journeys, not just the destinations."
        breadcrumbs={[{ label: 'Home', to: PATHS.home }, { label: 'Success stories' }]}
      />

      <div className="container-page py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="text-sm text-navy-500">{data ? `${data.length} stor${data.length === 1 ? 'y' : 'ies'}` : 'Loading…'}</p>
          <Select
            label="Destination"
            value={countryCode}
            onChange={(event) => setFilter(event.target.value)}
            containerClassName="w-full sm:w-64"
          >
            <option value="">All destinations</option>
            {(countries ?? []).map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </Select>
        </div>

        {isLoading && (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-72" rounded="rounded-2xl" />
            ))}
          </div>
        )}

        {isError && <ErrorState className="mt-8" error={error} onRetry={refetch} title="Couldn’t load stories" />}

        {data && data.length === 0 && (
          <EmptyState
            className="mt-8"
            icon={Quote}
            title="No stories from that destination yet"
            description="Try another country, or read all of them."
            action={
              <Button variant="outline" onClick={() => setFilter('')}>
                Show all stories
              </Button>
            }
          />
        )}

        {data && data.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.map((story) => (
              <StoryCard key={`${story.studentName}-${story.intakeYear}`} story={story} />
            ))}
          </div>
        )}

        <div className="mt-16 flex flex-col items-center gap-4 rounded-2xl bg-primary-50 px-6 py-12 text-center">
          <h2 className="max-w-lg font-display text-2xl font-semibold text-navy-950">Write your own version of this</h2>
          <Button as={Link} to={PATHS.register} size="lg" className="mt-2">
            Find my course
          </Button>
        </div>
      </div>
    </>
  );
}
