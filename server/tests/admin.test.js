import { beforeEach, describe, expect, it } from 'vitest';

import { agent, createUserWithRole, registerStudent } from './helpers.js';
import Counsellor from '../models/Counsellor.js';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import { ROLES } from '../constants/index.js';

let token;

beforeEach(async () => {
  const created = await createUserWithRole(ROLES.ADMIN);
  token = created.accessToken;
});

const get = (path) => agent().get(path).set('Authorization', `Bearer ${token}`);
const patch = (path) => agent().patch(path).set('Authorization', `Bearer ${token}`);

const idOf = (registered) => (registered.user._id ?? registered.user.id).toString();

describe('admin authorization', () => {
  it('refuses a student', async () => {
    const { accessToken } = await registerStudent();
    const response = await agent()
      .get('/api/admin/stats/overview')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
  });

  it('refuses a counsellor — elevated is not the same as admin', async () => {
    const { accessToken } = await createUserWithRole(ROLES.COUNSELLOR);
    const response = await agent()
      .get('/api/admin/stats/overview')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
  });

  it('refuses an unauthenticated caller', async () => {
    expect((await agent().get('/api/admin/students')).status).toBe(401);
  });
});

describe('GET /api/admin/stats/overview', () => {
  it('counts students, and counts unassigned ones separately', async () => {
    const assigned = await registerStudent();
    await registerStudent();

    const counsellor = await createUserWithRole(ROLES.COUNSELLOR);
    await Counsellor.create({ user: counsellor.user._id, assignedStudents: [idOf(assigned)] });

    const response = await get('/api/admin/stats/overview');

    expect(response.status).toBe(200);
    expect(response.body.data.students).toBe(2);
    expect(response.body.data.counsellors).toBe(1);
    // The number that makes the dashboard a worklist rather than a scoreboard.
    expect(response.body.data.unassignedStudents).toBe(1);
  });

  it('reports an offer rate of 0 rather than NaN when there are no applications', async () => {
    // 0/0 would serialize as null through JSON and render as "NaN%".
    const response = await get('/api/admin/stats/overview');

    expect(response.body.data.applications).toBe(0);
    expect(response.body.data.offerRate).toBe(0);
  });
});

describe('GET /api/admin/stats/charts', () => {
  it('zero-fills every month and every application status', async () => {
    await registerStudent();

    const response = await get('/api/admin/stats/charts?months=6');

    expect(response.status).toBe(200);
    // A month with no signups must be present as 0, not absent — a line chart
    // draws straight through a gap, which reads as activity rather than none.
    expect(response.body.data.signups).toHaveLength(6);
    expect(response.body.data.signups.every((point) => typeof point.count === 'number')).toBe(true);
    expect(response.body.data.signups.at(-1).count).toBeGreaterThanOrEqual(1);
    // All eight statuses, so the chart's categories don't shift as data lands.
    expect(response.body.data.applicationsByStatus).toHaveLength(8);
  });

  it('rejects a months value outside the allowed range', async () => {
    expect((await get('/api/admin/stats/charts?months=99')).status).toBe(400);
  });
});

describe('GET /api/admin/students', () => {
  it('searches by name and email', async () => {
    await registerStudent({ name: 'Meera Pillai', email: 'meera.pillai@orbitwise.dev' });
    await registerStudent({ name: 'Rohan Gupta', email: 'rohan.gupta@orbitwise.dev' });

    const byName = await get('/api/admin/students?search=Meera');
    expect(byName.body.data).toHaveLength(1);
    expect(byName.body.data[0].name).toBe('Meera Pillai');

    const byEmail = await get('/api/admin/students?search=rohan.gupta');
    expect(byEmail.body.data).toHaveLength(1);
  });

  it('treats a regex metacharacter in the search box as a literal', async () => {
    // Unescaped, '(' throws and 'a.b' matches 'axb'. Both are bugs a student
    // typing a phone number would hit.
    await registerStudent({ name: 'Ravi (Raj) Kumar', email: 'ravi.raj@orbitwise.dev' });

    const response = await get('/api/admin/students?search=' + encodeURIComponent('(Raj)'));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Ravi (Raj) Kumar');
  });

  it('filters to unassigned students', async () => {
    const assigned = await registerStudent();
    await registerStudent();

    const counsellor = await createUserWithRole(ROLES.COUNSELLOR);
    await Counsellor.create({ user: counsellor.user._id, assignedStudents: [idOf(assigned)] });

    const unassigned = await get('/api/admin/students?assigned=false');
    expect(unassigned.body.data).toHaveLength(1);
    expect(unassigned.body.data[0].counsellor).toBeNull();

    const withCounsellor = await get('/api/admin/students?assigned=true');
    expect(withCounsellor.body.data).toHaveLength(1);
    expect(withCounsellor.body.data[0].counsellor.name).toBe(counsellor.user.name);
  });

  it('paginates with the standard envelope', async () => {
    for (let i = 0; i < 3; i++) await registerStudent();

    const response = await get('/api/admin/students?page=1&limit=2');

    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2, hasNextPage: true });
  });

  it('rejects a sort field that is not on the allowlist', async () => {
    // An arbitrary sort key is a way to make the database scan whatever you name.
    expect((await get('/api/admin/students?sort=password')).status).toBe(400);
  });

  it('computes profile completion rather than reporting zero', async () => {
    const student = await registerStudent();
    await StudentProfile.create({
      user: idOf(student),
      education: { level: 'class_12', secondaryMarks: { system: 'percentage', value: 84 } },
      goal: { degreeLevel: 'Bachelors', fields: ['computer_science'] },
    });

    const response = await get('/api/admin/students');

    expect(response.body.data[0].completionPercent).toBeGreaterThan(0);
  });
});

describe('GET /api/admin/students/export.csv', () => {
  it('exports the filtered set, not the whole table', async () => {
    await registerStudent({ name: 'Meera Pillai', email: 'meera.pillai@orbitwise.dev' });
    await registerStudent({ name: 'Rohan Gupta', email: 'rohan.gupta@orbitwise.dev' });

    const response = await get('/api/admin/students/export.csv?search=Meera');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/csv/);
    expect(response.headers['content-disposition']).toMatch(/attachment; filename="orbitwise-students-/);

    const rows = response.text.trim().split('\r\n');
    expect(rows).toHaveLength(2); // header + one match
    expect(rows[1]).toContain('Meera Pillai');
    expect(response.text).not.toContain('Rohan Gupta');
  });

  it('neutralizes a formula so a spreadsheet cannot execute a student name', async () => {
    // CSV injection: Excel evaluates a leading '=', '+', '-' or '@'.
    await registerStudent({ name: '=1+1', email: 'formula@orbitwise.dev' });

    const response = await get('/api/admin/students/export.csv?search=formula@orbitwise.dev');

    expect(response.status).toBe(200);
    expect(response.text).toContain(`"'=1+1"`);
    expect(response.text).not.toContain(`"=1+1"`);
  });

  it('serves the whole table when no filter is given', async () => {
    await registerStudent({ name: 'Meera Pillai', email: 'meera.pillai@orbitwise.dev' });
    await registerStudent({ name: 'Rohan Gupta', email: 'rohan.gupta@orbitwise.dev' });

    const response = await get('/api/admin/students/export.csv');

    expect(response.status).toBe(200);
    expect(response.text.trim().split(String.fromCharCode(13, 10))).toHaveLength(3); // header + both
  });
});

describe('PATCH /api/admin/students/:id/counsellor', () => {
  it('assigns, and moves rather than duplicates on reassignment', async () => {
    const student = await registerStudent();
    const first = await createUserWithRole(ROLES.COUNSELLOR);
    const second = await createUserWithRole(ROLES.COUNSELLOR);
    await Counsellor.create({ user: first.user._id });
    await Counsellor.create({ user: second.user._id });

    await patch(`/api/admin/students/${idOf(student)}/counsellor`)
      .send({ counsellorUserId: first.user._id.toString() })
      .expect(200);

    const response = await patch(`/api/admin/students/${idOf(student)}/counsellor`).send({
      counsellorUserId: second.user._id.toString(),
    });

    expect(response.status).toBe(200);
    // "Who is my counsellor" has to have exactly one answer.
    const firstProfile = await Counsellor.findOne({ user: first.user._id });
    const secondProfile = await Counsellor.findOne({ user: second.user._id });
    expect(firstProfile.assignedStudents).toHaveLength(0);
    expect(secondProfile.assignedStudents).toHaveLength(1);
  });

  it('unassigns on an explicit null', async () => {
    const student = await registerStudent();
    const counsellor = await createUserWithRole(ROLES.COUNSELLOR);
    await Counsellor.create({ user: counsellor.user._id, assignedStudents: [idOf(student)] });

    const response = await patch(`/api/admin/students/${idOf(student)}/counsellor`).send({ counsellorUserId: null });

    expect(response.status).toBe(200);
    expect(response.body.data.counsellor).toBeNull();
    const profile = await Counsellor.findOne({ user: counsellor.user._id });
    expect(profile.assignedStudents).toHaveLength(0);
  });

  it('404s for a counsellor that does not exist', async () => {
    const student = await registerStudent();
    const response = await patch(`/api/admin/students/${idOf(student)}/counsellor`).send({
      counsellorUserId: '0'.repeat(24),
    });

    expect(response.status).toBe(404);
  });

  it('rejects a malformed student id with 400 rather than a cast error', async () => {
    const response = await patch('/api/admin/students/not-an-id/counsellor').send({ counsellorUserId: null });

    expect(response.status).toBe(400);
  });

  it('refuses to assign a counsellor to a non-student', async () => {
    const other = await createUserWithRole(ROLES.COUNSELLOR);
    const response = await patch(`/api/admin/students/${other.user._id}/counsellor`).send({ counsellorUserId: null });

    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/admin/students/:id/active', () => {
  it('deactivates without deleting the account', async () => {
    const student = await registerStudent();

    const response = await patch(`/api/admin/students/${idOf(student)}/active`).send({ isActive: false });

    expect(response.status).toBe(200);
    expect(response.body.data.isActive).toBe(false);
    // Still listed — the history behind the login is intact.
    const list = await get('/api/admin/students');
    expect(list.body.data).toHaveLength(1);
  });
});

describe('GET /api/admin/counsellors', () => {
  it('reports live caseload sizes, busiest first', async () => {
    const busy = await createUserWithRole(ROLES.COUNSELLOR);
    const quiet = await createUserWithRole(ROLES.COUNSELLOR);
    const a = await registerStudent();
    const b = await registerStudent();

    await Counsellor.create({ user: busy.user._id, assignedStudents: [idOf(a), idOf(b)] });
    await Counsellor.create({ user: quiet.user._id, assignedStudents: [] });

    const response = await get('/api/admin/counsellors');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].caseload).toBe(2);
    expect(response.body.data[1].caseload).toBe(0);
  });
});

describe('POST /api/admin/counsellors', () => {
  const post = (path) => agent().post(path).set('Authorization', `Bearer ${token}`);

  const NEW = {
    name: 'Deepa Menon',
    email: 'deepa.menon@orbitwise.dev',
    password: 'orbitwise2027',
    title: 'Senior Education Counsellor',
    experienceYears: 9,
    countries: ['ca', 'de'],
    fields: ['computer_science'],
    languages: ['English', 'Malayalam'],
  };

  it('creates a login that can actually sign in', async () => {
    // The whole point of the feature. User.create() is used rather than a
    // query-level write precisely because password hashing lives in a pre-save
    // hook that insertMany/updateOne bypass — through those the password would
    // be stored in plaintext and this login would fail.
    const created = await post('/api/admin/counsellors').send(NEW);
    expect(created.status).toBe(201);

    const login = await agent()
      .post('/api/auth/login')
      .send({ email: NEW.email, password: NEW.password });

    expect(login.status).toBe(200);
    expect(login.body.data.user.role).toBe(ROLES.COUNSELLOR);
  });

  it('creates the counsellor profile alongside the login', async () => {
    const response = await post('/api/admin/counsellors').send(NEW);

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe(NEW.title);
    expect(response.body.data.caseload).toBe(0);

    const profile = await Counsellor.findOne({ user: response.body.data.userId });
    expect(profile).not.toBeNull();
    // A counsellor with no availability cannot be booked, which would look like
    // a broken feature rather than an unconfigured one.
    expect(profile.availability.length).toBe(5);
    expect(profile.countries).toEqual(['CA', 'DE']);
  });

  it('is immediately bookable and shows up in both admin and student lists', async () => {
    const created = await post('/api/admin/counsellors').send(NEW);

    const adminList = await get('/api/admin/counsellors');
    expect(adminList.body.data.some((c) => c.email === NEW.email)).toBe(true);

    // The student-facing picker, which only lists accepting + active counsellors.
    const { accessToken } = await registerStudent();
    const bookable = await agent()
      .get('/api/appointments/counsellors')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(bookable.body.data.some((c) => c.userId === created.body.data.userId.toString())).toBe(true);
  });

  it('is created pre-verified, so the account is usable without an email round trip', async () => {
    const response = await post('/api/admin/counsellors').send(NEW);
    const user = await User.findById(response.body.data.userId).select('isVerified role');

    expect(user.isVerified).toBe(true);
    expect(user.role).toBe(ROLES.COUNSELLOR);
  });

  it('refuses a duplicate email with a field-keyed error', async () => {
    await post('/api/admin/counsellors').send(NEW).expect(201);

    const duplicate = await post('/api/admin/counsellors').send(NEW);

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.errors?.email).toBeTruthy();
  });

  it('holds an admin-created account to the same password rule as self-registration', async () => {
    // Reusing passwordSchema is the reason this passes; restating the rule in the
    // admin router is how it would quietly drift.
    const weak = await post('/api/admin/counsellors').send({ ...NEW, password: 'short' });

    expect(weak.status).toBe(400);
    expect(weak.body.errors?.password).toBeTruthy();
  });

  it('rejects an unknown study field rather than storing it', async () => {
    const response = await post('/api/admin/counsellors').send({ ...NEW, fields: ['quantum_basket_weaving'] });
    expect(response.status).toBe(400);
  });

  it('cannot be used to mint an admin', async () => {
    // Role is set by the service, not the payload. Zod strips unknown keys, so a
    // client asking for `role: admin` has it discarded before the service runs.
    const response = await post('/api/admin/counsellors').send({ ...NEW, role: ROLES.ADMIN });

    expect(response.status).toBe(201);
    const user = await User.findById(response.body.data.userId).select('role');
    expect(user.role).toBe(ROLES.COUNSELLOR);
  });

it('refuses an impossible availability window before creating anything', async () => {
    // Validation runs ahead of any write, so a rejected payload cannot leave a
    // login behind with no profile. (The service also rolls the user back if
    // profile creation throws, but that path needs a failure which passes
    // validation and so is not reachable from here.)
    const backwards = await post('/api/admin/counsellors').send({
      ...NEW,
      email: 'orphan.check@orbitwise.dev',
      availability: [{ dayOfWeek: 1, startMinute: 600, endMinute: 300 }],
    });

    expect(backwards.status).toBe(400);
    expect(await User.findOne({ email: 'orphan.check@orbitwise.dev' })).toBeNull();

    const outOfRange = await post('/api/admin/counsellors').send({
      ...NEW,
      email: 'orphan.check@orbitwise.dev',
      availability: [{ dayOfWeek: 9, startMinute: 0, endMinute: 60 }],
    });

    expect(outOfRange.status).toBe(400);
    expect(await User.findOne({ email: 'orphan.check@orbitwise.dev' })).toBeNull();
  });

  it('stores availability the admin supplied instead of the Mon-Fri default', async () => {
    const response = await post('/api/admin/counsellors').send({
      ...NEW,
      availability: [{ dayOfWeek: 6, startMinute: 9 * 60, endMinute: 13 * 60 }],
    });

    expect(response.status).toBe(201);
    const profile = await Counsellor.findOne({ user: response.body.data.userId });
    expect(profile.availability).toHaveLength(1);
    expect(profile.availability[0].dayOfWeek).toBe(6);
  });

  it('refuses a counsellor trying to create another counsellor', async () => {
    const { accessToken } = await createUserWithRole(ROLES.COUNSELLOR);

    const response = await agent()
      .post('/api/admin/counsellors')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(NEW);

    expect(response.status).toBe(403);
  });
});
