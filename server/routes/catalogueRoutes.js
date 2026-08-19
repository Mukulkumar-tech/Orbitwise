import { Router } from 'express';

import * as catalogueController from '../controllers/catalogueController.js';
import validate from '../middleware/validate.js';
import { universityQuery } from '../validators/catalogueValidators.js';

/**
 * Reference data: destinations, institutions, and the option sets the onboarding
 * wizard renders its choices from.
 *
 * All public and all cacheable — nothing here depends on who is asking, which is
 * why the wizard can load its dropdowns before a student has told us anything.
 */

export const countryRoutes = Router();
countryRoutes.get('/', catalogueController.listCountries);

export const universityRoutes = Router();
universityRoutes.get('/', validate({ query: universityQuery }), catalogueController.listUniversities);

/**
 * One request that returns every enum the wizard needs.
 *
 * The alternative is a client that hardcodes the same eight destination codes and
 * twelve subject slugs the server validates against — and a silent 400 the first
 * time the two lists disagree.
 */
export const optionRoutes = Router();
optionRoutes.get('/', catalogueController.getOptions);
