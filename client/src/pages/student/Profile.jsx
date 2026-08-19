import Onboarding from '../onboarding/Onboarding.jsx';

/**
 * The profile editor.
 *
 * Deliberately the wizard itself, in edit mode: the questions, validation, save
 * behaviour and eligibility rules are identical, and a second implementation of
 * them would drift within a release. Every step is unlocked here, and the deep
 * links from the dashboard's "next steps" (`?step=4`) land on the right one.
 */
export default function Profile() {
  return <Onboarding mode="profile" />;
}
