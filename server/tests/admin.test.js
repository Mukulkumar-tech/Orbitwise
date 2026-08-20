import { beforeEach, describe, expect, it } from 'vitest';

import { agent, createUserWithRole, registerStudent } from './helpers.js';
import Counsellor from '../models/Counsellor.js';
import StudentProfile from '../models/StudentProfile.js';
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
