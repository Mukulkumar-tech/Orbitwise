import publicService from '../services/publicService.js';
import catalogueService from '../services/catalogueService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';

export const getHome = asyncHandler(async (_req, res) => ok(res, await publicService.home()));

export const listTestimonials = asyncHandler(async (req, res) =>
  ok(res, await publicService.testimonials(req.query))
);

export const getCountry = asyncHandler(async (req, res) =>
  ok(res, await catalogueService.countryBySlug(req.params.slug))
);

export const getUniversity = asyncHandler(async (req, res) =>
  ok(res, await catalogueService.universityBySlug(req.params.slug))
);

export const submitEnquiry = asyncHandler(async (req, res) =>
  created(res, await publicService.submitEnquiry(req.body, { ip: req.ip }))
);
