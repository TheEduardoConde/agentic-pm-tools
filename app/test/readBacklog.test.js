import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createBacklogItem,
  createRelease,
  deleteBacklogItem,
  dispatchRelease,
  getReleases,
  getNextSequenceNumber,
  parseBodySections,
  parseFrontMatter,
  prefixFromType,
  readBacklogItems,
  slugifyTitle,
  typeFromPrefix,
  updateBacklogItem,
} from '../server.js';

function runTest(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log(`PASS ${name}`))
    .catch((error) => {
      console.error(`FAIL ${name}`);
      console.error(error);
      process.exitCode = 1;
    });
}

function makeProjectFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-tools-'));
  const projectPath = path.join(dir, 'project');
  for (const folder of ['active', 'completed', 'deferred', 'archived']) {
    fs.mkdirSync(path.join(projectPath, 'backlog', folder), { recursive: true });
  }
  return { dir, projectPath };
}

// ── Parsing ──────────────────────────────────────────────────────────────────

await runTest('parseFrontMatter extracts scalar fields', () => {
  const parsed = parseFrontMatter(`---
id: FEAT-0001
title: Sample item
status: Inbox
priority: Medium
---

# Body
`);
  assert.equal(parsed.data.id, 'FEAT-0001');
  assert.equal(parsed.data.title, 'Sample item');
  assert.equal(parsed.data.status, 'Inbox');
  assert.equal(parsed.data.priority, 'Medium');
  assert.ok(parsed.body.includes('# Body'));
});

await runTest('parseFrontMatter handles array fields', () => {
  const parsed = parseFrontMatter(`---
id: FEAT-0002
tags: [alpha, beta]
blocked_by: [BUG-0001]
---
`);
  assert.deepEqual(parsed.data.tags, ['alpha', 'beta']);
  assert.deepEqual(parsed.data.blocked_by, ['BUG-0001']);
});

await runTest('parseBodySections extracts known sections', () => {
  const parsed = parseBodySections(`## Summary

Short summary.

## Acceptance Criteria

- [ ] First criterion
- [ ] Second criterion

## Implementation Notes

Some hints.
`);
  assert.equal(parsed.sections.Summary.content, 'Short summary.');
  assert.ok(parsed.sections['Acceptance Criteria'].content.includes('First criterion'));
  assert.equal(parsed.sections['Implementation Notes'].content, 'Some hints.');
});

await runTest('parseBodySections preserves unknown custom sections in otherSections', () => {
  const parsed = parseBodySections(`## Summary

Known.

## Custom Notes

- Keep this.
`);
  assert.equal(parsed.sections.Summary.content, 'Known.');
  assert.equal(parsed.otherSections.length, 1);
  assert.equal(parsed.otherSections[0].title, 'Custom Notes');
});

// ── Utilities ─────────────────────────────────────────────────────────────────

await runTest('slugifyTitle creates safe filenames', () => {
  assert.equal(slugifyTitle('Add PM Tools: Create Item!'), 'add-pm-tools-create-item');
  assert.equal(slugifyTitle('../escape path'), 'escape-path');
  assert.equal(slugifyTitle(''), 'untitled');
});

await runTest('prefixFromType and typeFromPrefix round-trip', () => {
  assert.equal(prefixFromType('Feature'), 'FEAT');
  assert.equal(prefixFromType('Bug'), 'BUG');
  assert.equal(prefixFromType('Task'), 'TASK');
  assert.equal(typeFromPrefix('BUG'), 'Bug');
  assert.equal(typeFromPrefix('UNKNOWN'), 'Unknown');
});

await runTest('getNextSequenceNumber scans all backlog folders globally', async () => {
  const { dir, projectPath } = makeProjectFixture();
  fs.writeFileSync(path.join(projectPath, 'backlog', 'active', 'FEAT-0203-alpha.md'), `---
id: FEAT-0203
title: Alpha
---
`, 'utf8');
  fs.writeFileSync(path.join(projectPath, 'backlog', 'completed', 'BUG-0204-beta.md'), `---
id: BUG-0204
title: Beta
---
`, 'utf8');
  assert.equal(await getNextSequenceNumber(projectPath), 205);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ── CRUD ──────────────────────────────────────────────────────────────────────

await runTest('createBacklogItem requires type and title', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const result = await createBacklogItem({}, projectPath);
  assert.ok(result.error);
  assert.equal(result.statusCode, 400);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('createBacklogItem requires summary and acceptanceCriteria', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const result = await createBacklogItem({ type: 'Feature', title: 'No summary' }, projectPath);
  assert.ok(result.error);
  assert.equal(result.statusCode, 400);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('createBacklogItem creates valid markdown with new schema', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const result = await createBacklogItem({
    type: 'Feature',
    title: 'Add CSV export',
    priority: 'High',
    effort: 'M',
    tags: ['export', 'csv'],
    summary: 'Users need CSV export.',
    acceptanceCriteria: 'Data exports correctly\nFile downloads properly',
  }, projectPath);

  assert.ok(!result.error, result.error);
  assert.equal(result.id, 'FEAT-0000');
  const filePath = path.join(projectPath, result.filePath);
  assert.ok(fs.existsSync(filePath));
  const md = fs.readFileSync(filePath, 'utf8');
  assert.ok(md.includes('id: FEAT-0000'));
  assert.ok(md.includes('type: Feature'));
  assert.ok(md.includes('status: Inbox'));
  assert.ok(md.includes('priority: High'));
  assert.ok(md.includes('effort: M'));
  assert.ok(md.includes('- [ ] Data exports correctly'));
  assert.ok(md.includes('- [ ] File downloads properly'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('createBacklogItem places item in active/ folder', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const result = await createBacklogItem({
    type: 'Bug',
    title: 'Fix login crash',
    summary: 'App crashes on login.',
    acceptanceCriteria: 'Login works',
  }, projectPath);
  assert.ok(result.filePath.startsWith('backlog/active/'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem changes title and status', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    type: 'Task',
    title: 'Original title',
    summary: 'Summary.',
    acceptanceCriteria: 'Criterion',
  }, projectPath);

  const result = await updateBacklogItem('TASK-0000', {
    title: 'Updated title',
    status: 'Ready',
    priority: 'High',
    effort: 'S',
    summary: 'New summary.',
    acceptanceCriteria: '- [ ] New criterion',
  }, projectPath);

  assert.ok(!result.error, result.error);
  assert.equal(result.item.title, 'Updated title');
  assert.equal(result.item.status, 'Ready');
  assert.equal(result.item.priority, 'High');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem moves item to completed/ when status becomes Done', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    type: 'Bug',
    title: 'Fix me',
    summary: 'Summary.',
    acceptanceCriteria: 'Fixed',
  }, projectPath);

  const result = await updateBacklogItem('BUG-0000', {
    title: 'Fix me',
    status: 'Done',
    summary: 'Summary.',
    acceptanceCriteria: 'Fixed',
  }, projectPath);

  assert.ok(!result.error, result.error);
  assert.equal(result.item.folder, 'completed');
  assert.ok(fs.existsSync(path.join(projectPath, 'backlog', 'completed', 'BUG-0000-fix-me.md')));
  assert.ok(!fs.existsSync(path.join(projectPath, 'backlog', 'active', 'BUG-0000-fix-me.md')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem maps legacy status Backlog → Inbox on read, saves as Inbox', async () => {
  const { dir, projectPath } = makeProjectFixture();
  // Write a file with old-style status
  fs.writeFileSync(path.join(projectPath, 'backlog', 'active', 'FEAT-0050-legacy.md'), `---
id: FEAT-0050
title: Legacy item
status: Backlog
priority: Medium
effort: S
tags: []
blocked_by: []
created: 2025-01-01
updated: 2025-01-01
---

## Summary

Old item.

## Acceptance Criteria

- [ ] Works
`, 'utf8');

  const items = await readBacklogItems(projectPath);
  const item = items.items.find((i) => i.id === 'FEAT-0050');
  assert.equal(item.status, 'Inbox', 'Legacy Backlog status should map to Inbox');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('deleteBacklogItem removes the file', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    type: 'Task',
    title: 'Delete me',
    summary: 'Summary.',
    acceptanceCriteria: 'Deleted',
  }, projectPath);

  const result = await deleteBacklogItem('TASK-0000', projectPath);
  assert.ok(!result.error, result.error);
  assert.ok(!fs.existsSync(path.join(projectPath, 'backlog', 'active', 'TASK-0000-delete-me.md')));
  fs.rmSync(dir, { recursive: true, force: true });
});

// ── Releases ──────────────────────────────────────────────────────────────────

await runTest('createRelease requires a title', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const result = await createRelease({}, projectPath);
  assert.ok(result.error);
  assert.equal(result.statusCode, 400);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('createRelease writes a release file and returns id', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const result = await createRelease({ title: 'First release', items: [] }, projectPath);
  assert.ok(!result.error, result.error);
  assert.ok(result.release.id.startsWith('REL-'));
  const releasesPath = path.join(projectPath, 'backlog', 'releases');
  assert.ok(fs.existsSync(path.join(releasesPath, `${result.release.id}.md`)));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('getReleases lists created releases', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createRelease({ title: 'Release A', items: [] }, projectPath);
  await createRelease({ title: 'Release B', items: [] }, projectPath);
  const releases = await getReleases(projectPath);
  assert.equal(releases.length, 2);
  assert.ok(releases.some((r) => r.title === 'Release A'));
  assert.ok(releases.some((r) => r.title === 'Release B'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('dispatchRelease generates work package and marks items In Progress', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    type: 'Feature',
    title: 'Export data',
    summary: 'Users need export.',
    acceptanceCriteria: 'CSV file downloads',
  }, projectPath);
  const relResult = await createRelease({ title: 'Sprint 1', items: ['FEAT-0000'] }, projectPath);
  const releaseId = relResult.release.id;

  const dispatch = await dispatchRelease(releaseId, projectPath);
  assert.ok(!dispatch.error, dispatch.error);
  assert.ok(dispatch.workPackage.includes('FEAT-0000'));
  assert.ok(dispatch.workPackage.includes('Export data'));
  assert.ok(dispatch.workPackage.includes('CSV file downloads'));

  // Check items marked In Progress
  const backlog = await readBacklogItems(projectPath);
  const item = backlog.items.find((i) => i.id === 'FEAT-0000');
  assert.equal(item.status, 'In Progress');

  // Check release file updated to Dispatched
  const releases = await getReleases(projectPath);
  const rel = releases.find((r) => r.id === releaseId);
  assert.equal(rel.status, 'Dispatched');

  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('dispatchRelease fails if no items', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const relResult = await createRelease({ title: 'Empty release', items: [] }, projectPath);
  const dispatch = await dispatchRelease(relResult.release.id, projectPath);
  assert.ok(dispatch.error);
  assert.equal(dispatch.statusCode, 400);
  fs.rmSync(dir, { recursive: true, force: true });
});
