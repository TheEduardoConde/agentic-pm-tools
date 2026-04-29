import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createBacklogItem,
  assignItemsToRelease,
  createRelease,
  generateChecklist,
  generatePrompt,
  generateVersionControlPrompt,
  getReleasePlanner,
  getNextSequenceNumber,
  isValidReleaseVersion,
  parseBodySections,
  parseFrontMatter,
  prefixFromType,
  readBacklogItems,
  slugifyTitle,
  typeFromPrefix,
  updateBacklogItem,
  validateBacklog,
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-tools-app-'));
  const projectPath = path.join(dir, 'project');
  for (const folder of ['active', 'completed', 'deferred', 'archived']) {
    fs.mkdirSync(path.join(projectPath, 'backlog', folder), { recursive: true });
  }
  fs.writeFileSync(path.join(projectPath, '.pm-meta.json'), JSON.stringify({
    lastBacklogValidation: null,
    lastIndexRegeneration: null,
    pmStructureCreated: '2026-04-28',
    migrationStatus: 'not_started',
  }, null, 2), 'utf8');
  return { dir, projectPath };
}

await runTest('parseFrontMatter extracts scalar fields', () => {
  const parsed = parseFrontMatter(`---
id: TEST-0001
title: Sample item
status: New
priority: Medium
---

# Body
`);

  assert.equal(parsed.data.id, 'TEST-0001');
  assert.equal(parsed.data.title, 'Sample item');
  assert.equal(parsed.data.status, 'New');
  assert.equal(parsed.data.priority, 'Medium');
  assert.ok(parsed.body.includes('# Body'));
});

await runTest('parseFrontMatter preserves missing optional fields as absent data', () => {
  const parsed = parseFrontMatter(`---
id: TEST-0001
title: Minimal item
---

## Summary

Minimal body.
`);

  assert.equal(parsed.data.status, undefined);
  assert.equal(parsed.data.effort, undefined);
  assert.ok(parsed.body.includes('## Summary'));
});

await runTest('parseBodySections extracts known sections and preserves list content', () => {
  const parsed = parseBodySections(`## Summary

Short summary.

## Acceptance Criteria

- [ ] First criterion
- [x] Existing completed criterion
- Nested details stay in markdown.

## Testing Notes

Run the relevant checks.
`);

  assert.equal(parsed.sections.Summary.content, 'Short summary.');
  assert.ok(parsed.sections['Acceptance Criteria'].content.includes('- [ ] First criterion'));
  assert.ok(parsed.sections['Acceptance Criteria'].content.includes('- [x] Existing completed criterion'));
  assert.equal(parsed.sections['Testing Notes'].content, 'Run the relevant checks.');
  assert.equal(parsed.otherSections.length, 0);
});

await runTest('parseBodySections handles missing optional sections', () => {
  const parsed = parseBodySections(`## Summary

Only one section.
`);

  assert.equal(parsed.sections.Summary.content, 'Only one section.');
  assert.equal(parsed.sections['Human Testing Plan'], undefined);
  assert.equal(parsed.sections['Codex Prompt'], undefined);
});

await runTest('parseBodySections preserves unknown custom sections', () => {
  const parsed = parseBodySections(`## Summary

Known content.

## Custom Review Notes

- Keep this custom note.
`);

  assert.equal(parsed.sections.Summary.content, 'Known content.');
  assert.equal(parsed.otherSections.length, 1);
  assert.equal(parsed.otherSections[0].title, 'Custom Review Notes');
  assert.ok(parsed.otherSections[0].content.includes('- Keep this custom note.'));
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
  fs.writeFileSync(path.join(projectPath, 'backlog', 'archived', 'TEST-0209-gamma.md'), `---
id: TEST-0209
title: Gamma
---
`, 'utf8');

  assert.equal(await getNextSequenceNumber(projectPath), 210);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('slugifyTitle creates safe filenames', () => {
  assert.equal(slugifyTitle('Add PM Tools: Create Item!'), 'add-pm-tools-create-item');
  assert.equal(slugifyTitle('../escape path'), 'escape-path');
  assert.equal(slugifyTitle(''), 'untitled');
});

await runTest('Type maps to prefix and prefix derives Type', () => {
  assert.equal(prefixFromType('Feature'), 'FEAT');
  assert.equal(prefixFromType('API / Integration'), 'API');
  assert.equal(typeFromPrefix('BUG'), 'Bug');
  assert.equal(typeFromPrefix('UNKNOWN'), 'Unknown');
});

await runTest('createBacklogItem enforces required fields', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const result = await createBacklogItem({ prefix: 'TEST' }, projectPath);
  assert.equal(result.statusCode, 400);
  assert.ok(result.error.includes('title is required'));
  assert.equal((await readBacklogItems(projectPath)).itemCount, 0);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('createBacklogItem rejects path traversal-like prefix values', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const result = await createBacklogItem({
    prefix: '../TEST',
    title: 'Unsafe Name',
    summary: 'Summary',
    problemNeed: 'Need',
    expectedOutcome: 'Outcome',
    acceptanceCriteria: 'Criterion',
  }, projectPath);

  assert.equal(result.statusCode, 400);
  assert.ok(result.error.includes('prefix must be an approved value'));
  assert.equal((await readBacklogItems(projectPath)).itemCount, 0);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('createBacklogItem sanitizes path traversal-like titles into safe filenames', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const result = await createBacklogItem({
    prefix: 'TEST',
    title: '../../Unsafe Name',
    summary: 'Summary',
    problemNeed: 'Need',
    expectedOutcome: 'Outcome',
    acceptanceCriteria: 'Criterion',
  }, projectPath);

  assert.equal(result.id, 'TEST-0000');
  assert.equal(result.filePath, 'backlog/active/TEST-0000-unsafe-name.md');
  assert.ok(fs.existsSync(path.join(projectPath, 'backlog', 'active', 'TEST-0000-unsafe-name.md')));
  assert.ok(!fs.existsSync(path.join(projectPath, '..', 'Unsafe Name.md')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('createBacklogItem creates valid markdown and regenerates BACKLOG index', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const result = await createBacklogItem({
    type: 'Project Management',
    title: 'Create backlog item safely',
    summary: 'Add safe creation support.',
    problemNeed: 'Users need a guided way to create PM cards.',
    expectedOutcome: 'A valid backlog file exists.',
    acceptanceCriteria: 'File is created\nBACKLOG.md includes the item',
    functionalRequirements: '- Create under active only',
    testingNotes: 'Use fixture tests.',
  }, projectPath);

  assert.equal(result.id, 'PM-0000');
  const itemPath = path.join(projectPath, result.filePath);
  assert.ok(fs.existsSync(itemPath));
  const markdown = fs.readFileSync(itemPath, 'utf8');
  assert.ok(markdown.includes('id: PM-0000'));
  assert.ok(markdown.includes('type: Project Management'));
  assert.ok(markdown.includes('prefix: PM'));
  assert.ok(markdown.includes('status: New'));
  assert.ok(markdown.includes('release: Unassigned'));
  assert.ok(markdown.includes('- [ ] File is created'));
  assert.ok(markdown.includes('- [ ] BACKLOG.md includes the item'));

  const index = fs.readFileSync(path.join(projectPath, 'BACKLOG.md'), 'utf8');
  assert.ok(index.includes('PM-0000'));
  assert.ok(index.includes('Create backlog item safely'));

  const meta = JSON.parse(fs.readFileSync(path.join(projectPath, '.pm-meta.json'), 'utf8'));
  assert.ok(meta.lastIndexRegeneration);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('createBacklogItem derives prefix from Type', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const result = await createBacklogItem({
    type: 'Bug',
    title: 'Bug typed item',
    summary: 'Summary',
    problemNeed: 'Need',
    expectedOutcome: 'Outcome',
    acceptanceCriteria: 'Criterion',
  }, projectPath);
  assert.equal(result.id, 'BUG-0000');
  const item = (await readBacklogItems(projectPath)).items.find((candidate) => candidate.id === 'BUG-0000');
  assert.equal(item.type, 'Bug');
  assert.equal(item.prefix, 'BUG');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem edits front matter fields and known body sections', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Original title',
    summary: 'Old summary.',
    problemNeed: 'Old need.',
    expectedOutcome: 'Old outcome.',
    acceptanceCriteria: '- [ ] Old criterion',
  }, projectPath);

  const result = await updateBacklogItem('PM-0000', {
    title: 'Updated title',
    status: 'Ready',
    priority: 'High',
    effort: 'S',
    release: 'v0.1.0',
    summary: 'New summary.',
    problemNeed: 'New need.',
    expectedOutcome: 'New outcome.',
    acceptanceCriteria: '- [ ] New criterion',
    testingNotes: 'New testing notes.',
  }, projectPath);

  assert.equal(result.item.title, 'Updated title');
  assert.equal(result.item.status, 'Ready');
  assert.equal(result.item.priority, 'High');
  assert.equal(result.item.effort, 'S');
  assert.equal(result.item.release, 'v0.1.0');
  assert.equal(result.item.id, 'PM-0000');
  assert.equal(result.item.prefix, 'PM');
  assert.equal(result.item.number, '0000');
  assert.equal(result.item.sections.Summary.content, 'New summary.');
  assert.ok(result.item.sections['Acceptance Criteria'].content.includes('New criterion'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem rejects Type changes that conflict with immutable prefix', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    type: 'Project Management',
    title: 'Immutable prefix',
    summary: 'Summary.',
    problemNeed: 'Need.',
    expectedOutcome: 'Outcome.',
    acceptanceCriteria: 'Criterion',
  }, projectPath);
  const result = await updateBacklogItem('PM-0000', {
    title: 'Immutable prefix',
    status: 'New',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
    type: 'Bug',
  }, projectPath);
  assert.equal(result.statusCode, 400);
  assert.ok(result.error.includes('immutable backlog item prefix'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem preserves unknown sections', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Has custom section',
    summary: 'Summary.',
    problemNeed: 'Need.',
    expectedOutcome: 'Outcome.',
    acceptanceCriteria: 'Criterion',
  }, projectPath);
  const itemPath = path.join(projectPath, 'backlog', 'active', 'PM-0000-has-custom-section.md');
  fs.appendFileSync(itemPath, '\n## Custom Notes\n\nKeep this content.\n', 'utf8');

  const result = await updateBacklogItem('PM-0000', {
    title: 'Has custom section',
    status: 'Ready',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
    summary: 'Updated summary.',
  }, projectPath);

  assert.equal(result.item.otherSections.length, 1);
  assert.equal(result.item.otherSections[0].title, 'Custom Notes');
  assert.ok(result.item.otherSections[0].content.includes('Keep this content.'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem moves status changes to the correct folder', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Deploy me',
    summary: 'Summary.',
    problemNeed: 'Need.',
    expectedOutcome: 'Outcome.',
    acceptanceCriteria: 'Criterion',
  }, projectPath);

  const result = await updateBacklogItem('PM-0000', {
    title: 'Deploy me',
    status: 'Deployed',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
  }, projectPath);

  assert.equal(result.item.folder, 'completed');
  assert.ok(fs.existsSync(path.join(projectPath, 'backlog', 'completed', 'PM-0000-deploy-me.md')));
  assert.ok(!fs.existsSync(path.join(projectPath, 'backlog', 'active', 'PM-0000-deploy-me.md')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem sets deployed date when status becomes Deployed', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Deploy date',
    summary: 'Summary.',
    problemNeed: 'Need.',
    expectedOutcome: 'Outcome.',
    acceptanceCriteria: 'Criterion',
  }, projectPath);

  const result = await updateBacklogItem('PM-0000', {
    title: 'Deploy date',
    status: 'Deployed',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
  }, projectPath);

  assert.match(result.item.deployed, /^\d{4}-\d{2}-\d{2}$/);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem sets tested date when status becomes Passed Testing', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Tested date',
    summary: 'Summary.',
    problemNeed: 'Need.',
    expectedOutcome: 'Outcome.',
    acceptanceCriteria: 'Criterion',
  }, projectPath);

  const result = await updateBacklogItem('PM-0000', {
    title: 'Tested date',
    status: 'Passed Testing',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
  }, projectPath);

  assert.match(result.item.tested, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(result.item.folder, 'active');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem sets archived date and archive reason', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Archive date',
    summary: 'Summary.',
    problemNeed: 'Need.',
    expectedOutcome: 'Outcome.',
    acceptanceCriteria: 'Criterion',
  }, projectPath);

  const result = await updateBacklogItem('PM-0000', {
    title: 'Archive date',
    status: 'Archived',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
    archiveReason: 'No longer needed.',
  }, projectPath);

  assert.match(result.item.archived, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(result.item.archive_reason, 'No longer needed.');
  assert.equal(result.item.folder, 'archived');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem sets deferred date and defer reason', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Defer date',
    summary: 'Summary.',
    problemNeed: 'Need.',
    expectedOutcome: 'Outcome.',
    acceptanceCriteria: 'Criterion',
  }, projectPath);

  const result = await updateBacklogItem('PM-0000', {
    title: 'Defer date',
    status: 'Deferred',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
    deferReason: 'Wait for later.',
  }, projectPath);

  assert.match(result.item.deferred, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(result.item.defer_reason, 'Wait for later.');
  assert.equal(result.item.folder, 'deferred');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem renames title slug while preserving ID', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Old slug',
    summary: 'Summary.',
    problemNeed: 'Need.',
    expectedOutcome: 'Outcome.',
    acceptanceCriteria: 'Criterion',
  }, projectPath);

  const result = await updateBacklogItem('PM-0000', {
    title: 'New slug value',
    status: 'New',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
  }, projectPath);

  assert.equal(result.item.id, 'PM-0000');
  assert.equal(result.newPath, 'backlog/active/PM-0000-new-slug-value.md');
  assert.ok(!fs.existsSync(path.join(projectPath, 'backlog', 'active', 'PM-0000-old-slug.md')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem rejects duplicate filename overwrite', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Alpha',
    summary: 'Summary.',
    problemNeed: 'Need.',
    expectedOutcome: 'Outcome.',
    acceptanceCriteria: 'Criterion',
  }, projectPath);
  fs.writeFileSync(path.join(projectPath, 'backlog', 'active', 'PM-0000-zulu.md'), `---
id: PM-0000
prefix: PM
number: 0000
title: Zulu
status: New
priority: Medium
effort: Unknown
release: Unassigned
created: 2026-04-28
updated: 2026-04-28
---
`, 'utf8');

  const result = await updateBacklogItem('PM-0000', {
    title: 'Zulu',
    status: 'New',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
  }, projectPath);
  assert.equal(result.statusCode, 409);
  assert.ok(result.error.includes('Target backlog filename already exists'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem rejects path traversal IDs', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const result = await updateBacklogItem('../PM-0000', {
    title: 'Unsafe',
    status: 'New',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
  }, projectPath);

  assert.equal(result.statusCode, 400);
  assert.ok(result.error.includes('Invalid backlog item ID'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem regenerates BACKLOG index after save', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Index old',
    summary: 'Summary.',
    problemNeed: 'Need.',
    expectedOutcome: 'Outcome.',
    acceptanceCriteria: 'Criterion',
  }, projectPath);
  await updateBacklogItem('PM-0000', {
    title: 'Index new',
    status: 'Ready',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
  }, projectPath);

  const index = fs.readFileSync(path.join(projectPath, 'BACKLOG.md'), 'utf8');
  assert.ok(index.includes('PM-0000'));
  assert.ok(index.includes('Index new'));
  assert.ok(index.includes('backlog/active/PM-0000-index-new.md'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog detects duplicate IDs', async () => {
  const { dir, projectPath } = makeProjectFixture();
  fs.writeFileSync(path.join(projectPath, 'backlog', 'active', 'PM-0001-alpha.md'), `---
id: PM-0001
prefix: PM
number: 0001
title: Alpha
status: New
priority: Medium
effort: Unknown
release: Unassigned
created: 2026-04-28
updated: 2026-04-28
---
`, 'utf8');
  fs.writeFileSync(path.join(projectPath, 'backlog', 'completed', 'PM-0001-beta.md'), `---
id: PM-0001
prefix: PM
number: 0001
title: Beta
status: Deployed
priority: Medium
effort: Unknown
release: Unassigned
created: 2026-04-28
updated: 2026-04-28
---
`, 'utf8');
  const result = await validateBacklog(projectPath, { updateMeta: false });
  assert.ok(result.findings.some((finding) => finding.severity === 'Error' && finding.message.includes('Duplicate backlog ID PM-0001')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog detects missing required fields', async () => {
  const { dir, projectPath } = makeProjectFixture();
  fs.writeFileSync(path.join(projectPath, 'backlog', 'active', 'PM-0001-missing.md'), `---
id: PM-0001
prefix: PM
title: Missing fields
status: New
priority: Medium
---
`, 'utf8');
  const result = await validateBacklog(projectPath, { updateMeta: false });
  assert.ok(result.findings.some((finding) => finding.message.includes('Missing required front matter field: number')));
  assert.ok(result.findings.some((finding) => finding.message.includes('Missing required front matter field: effort')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog detects invalid enum values', async () => {
  const { dir, projectPath } = makeProjectFixture();
  fs.writeFileSync(path.join(projectPath, 'backlog', 'active', 'BAD-0001-invalid.md'), `---
id: BAD-0001
prefix: BAD
number: 0001
title: Invalid
status: Strange
priority: Urgent
effort: Huge
release: Unassigned
created: 2026-04-28
updated: 2026-04-28
---
`, 'utf8');
  const result = await validateBacklog(projectPath, { updateMeta: false });
  assert.ok(result.findings.some((finding) => finding.message.includes('Invalid prefix')));
  assert.ok(result.findings.some((finding) => finding.message.includes('Invalid status')));
  assert.ok(result.findings.some((finding) => finding.message.includes('Invalid priority')));
  assert.ok(result.findings.some((finding) => finding.message.includes('Invalid effort')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog detects invalid release format', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Release format',
    summary: 'Summary',
    problemNeed: 'Need',
    expectedOutcome: 'Outcome',
    acceptanceCriteria: 'Criterion',
  }, projectPath);
  await updateBacklogItem('PM-0000', {
    title: 'Release format',
    status: 'New',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'release-one',
  }, projectPath);
  const result = await validateBacklog(projectPath, { updateMeta: false });
  assert.ok(result.findings.some((finding) => finding.message.includes('Invalid release format')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog detects status-folder mismatch', async () => {
  const { dir, projectPath } = makeProjectFixture();
  fs.writeFileSync(path.join(projectPath, 'backlog', 'active', 'PM-0001-deployed.md'), `---
id: PM-0001
prefix: PM
number: 0001
title: Deployed
status: Deployed
priority: Medium
effort: Unknown
release: Unassigned
created: 2026-04-28
updated: 2026-04-28
---
`, 'utf8');
  const result = await validateBacklog(projectPath, { updateMeta: false });
  assert.ok(result.findings.some((finding) => finding.message.includes('belongs in completed/')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog detects missing release file', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Missing release',
    summary: 'Summary',
    problemNeed: 'Need',
    expectedOutcome: 'Outcome',
    acceptanceCriteria: 'Criterion',
  }, projectPath);
  await updateBacklogItem('PM-0000', {
    title: 'Missing release',
    status: 'New',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'v0.1.0',
  }, projectPath);
  const result = await validateBacklog(projectPath, { updateMeta: false });
  assert.ok(result.findings.some((finding) => finding.message.includes('Missing release file')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog detects release references missing backlog items', async () => {
  const { dir, projectPath } = makeProjectFixture();
  fs.mkdirSync(path.join(projectPath, 'releases'), { recursive: true });
  fs.writeFileSync(path.join(projectPath, 'releases', 'v0.1.0.md'), `---
id: v0.1.0
title: Release
status: Planning
created: 2026-04-28
---

## Included Backlog Items

- PM-9999
`, 'utf8');
  const result = await validateBacklog(projectPath, { updateMeta: false });
  assert.ok(result.findings.some((finding) => finding.message.includes('Release references missing backlog item PM-9999')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog detects item and release membership mismatch', async () => {
  const { dir, projectPath } = makeProjectFixture();
  fs.mkdirSync(path.join(projectPath, 'releases'), { recursive: true });
  await createBacklogItem({
    prefix: 'PM',
    title: 'Mismatch',
    summary: 'Summary',
    problemNeed: 'Need',
    expectedOutcome: 'Outcome',
    acceptanceCriteria: 'Criterion',
  }, projectPath);
  await updateBacklogItem('PM-0000', {
    title: 'Mismatch',
    status: 'New',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'v0.1.0',
  }, projectPath);
  fs.writeFileSync(path.join(projectPath, 'releases', 'v0.1.0.md'), `---
id: v0.1.0
title: Release
status: Planning
created: 2026-04-28
---

## Included Backlog Items

- PM-0001
`, 'utf8');
  const result = await validateBacklog(projectPath, { updateMeta: false });
  assert.ok(result.findings.some((finding) => finding.message.includes('does not list it')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog detects invalid lifecycle dates', async () => {
  const { dir, projectPath } = makeProjectFixture();
  fs.writeFileSync(path.join(projectPath, 'backlog', 'active', 'PM-0001-date.md'), `---
id: PM-0001
prefix: PM
number: 0001
title: Bad date
status: New
priority: Medium
effort: Unknown
release: Unassigned
created: 2026-99-99
updated: 2026-04-28
---
`, 'utf8');
  const result = await validateBacklog(projectPath, { updateMeta: false });
  assert.ok(result.findings.some((finding) => finding.message.includes('Invalid date format for created')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog detects filename mismatch', async () => {
  const { dir, projectPath } = makeProjectFixture();
  fs.writeFileSync(path.join(projectPath, 'backlog', 'active', 'wrong-name.md'), `---
id: PM-0001
prefix: PM
number: 0001
title: Wrong name
status: New
priority: Medium
effort: Unknown
release: Unassigned
created: 2026-04-28
updated: 2026-04-28
---
`, 'utf8');
  const result = await validateBacklog(projectPath, { updateMeta: false });
  assert.ok(result.findings.some((finding) => finding.message.includes('Filename does not start with item ID')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog detects BACKLOG index out of sync', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Index drift',
    summary: 'Summary',
    problemNeed: 'Need',
    expectedOutcome: 'Outcome',
    acceptanceCriteria: 'Criterion',
  }, projectPath);
  fs.writeFileSync(path.join(projectPath, 'BACKLOG.md'), '# stale\n', 'utf8');
  const result = await validateBacklog(projectPath, { updateMeta: false });
  assert.ok(result.findings.some((finding) => finding.message.includes('BACKLOG.md index appears out of sync')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog does not modify backlog item files', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'No mutation',
    summary: 'Summary',
    problemNeed: 'Need',
    expectedOutcome: 'Outcome',
    acceptanceCriteria: 'Criterion',
  }, projectPath);
  const itemPath = path.join(projectPath, 'backlog', 'active', 'PM-0000-no-mutation.md');
  const before = fs.readFileSync(itemPath, 'utf8');
  await validateBacklog(projectPath, { updateMeta: true });
  const after = fs.readFileSync(itemPath, 'utf8');
  assert.equal(after, before);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog updates lastBacklogValidation only after validation', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const before = JSON.parse(fs.readFileSync(path.join(projectPath, '.pm-meta.json'), 'utf8'));
  assert.equal(before.lastBacklogValidation, null);
  await validateBacklog(projectPath, { updateMeta: false });
  const afterReadOnly = JSON.parse(fs.readFileSync(path.join(projectPath, '.pm-meta.json'), 'utf8'));
  assert.equal(afterReadOnly.lastBacklogValidation, null);
  await validateBacklog(projectPath, { updateMeta: true });
  const afterValidation = JSON.parse(fs.readFileSync(path.join(projectPath, '.pm-meta.json'), 'utf8'));
  assert.match(afterValidation.lastBacklogValidation, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog preserves legacy date-only timestamp before updating to ISO timestamp', async () => {
  const { dir, projectPath } = makeProjectFixture();
  fs.writeFileSync(path.join(projectPath, '.pm-meta.json'), JSON.stringify({
    lastBacklogValidation: '2026-04-28',
    lastIndexRegeneration: null,
  }, null, 2), 'utf8');
  const result = await validateBacklog(projectPath, { updateMeta: false });
  assert.equal(result.lastBacklogValidationBefore, '2026-04-28');
  const afterReadOnly = JSON.parse(fs.readFileSync(path.join(projectPath, '.pm-meta.json'), 'utf8'));
  assert.equal(afterReadOnly.lastBacklogValidation, '2026-04-28');
  const updated = await validateBacklog(projectPath, { updateMeta: true });
  assert.match(updated.lastBacklogValidation, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('isValidReleaseVersion validates Unassigned and semantic versions', () => {
  assert.equal(isValidReleaseVersion('Unassigned'), true);
  assert.equal(isValidReleaseVersion('v0.1.0'), true);
  assert.equal(isValidReleaseVersion('v1.0.0'), true);
  assert.equal(isValidReleaseVersion('0.1.0'), false);
  assert.equal(isValidReleaseVersion('release-1'), false);
});

await runTest('assignItemsToRelease creates release file and assigns items', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'First item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await createBacklogItem({ prefix: 'TEST', title: 'Second item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  const result = await assignItemsToRelease({ release: 'v0.1.0', itemIds: ['PM-0000', 'TEST-0001'] }, projectPath);
  assert.equal(result.releaseFileCreated, true);
  assert.ok(fs.existsSync(path.join(projectPath, 'releases', 'v0.1.0.md')));
  const backlog = await readBacklogItems(projectPath);
  assert.equal(backlog.items.find((item) => item.id === 'PM-0000').release, 'v0.1.0');
  assert.equal(backlog.items.find((item) => item.id === 'PM-0000').status, 'Planned');
  assert.equal(backlog.items.find((item) => item.id === 'TEST-0001').status, 'Planned');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('assignItemsToRelease adds item IDs without duplication', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Only item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await assignItemsToRelease({ release: 'v0.1.0', itemIds: ['PM-0000'] }, projectPath);
  await assignItemsToRelease({ release: 'v0.1.0', itemIds: ['PM-0000'] }, projectPath);
  const release = fs.readFileSync(path.join(projectPath, 'releases', 'v0.1.0.md'), 'utf8');
  assert.equal((release.match(/- PM-0000/g) ?? []).length, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('assignItemsToRelease does not downgrade advanced statuses', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Advanced', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await updateBacklogItem('PM-0000', { title: 'Advanced', status: 'In Development', priority: 'Medium', effort: 'Unknown', release: 'Unassigned' }, projectPath);
  await assignItemsToRelease({ release: 'v0.1.0', itemIds: ['PM-0000'] }, projectPath);
  const item = (await readBacklogItems(projectPath)).items.find((candidate) => candidate.id === 'PM-0000');
  assert.equal(item.status, 'In Development');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('assignItemsToRelease rejects Deployed items', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Deployed item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await updateBacklogItem('PM-0000', { title: 'Deployed item', status: 'Deployed', priority: 'Medium', effort: 'Unknown', release: 'Unassigned' }, projectPath);
  const result = await assignItemsToRelease({ release: 'v0.1.0', itemIds: ['PM-0000'] }, projectPath);
  assert.equal(result.statusCode, 400);
  assert.ok(result.error.includes('Deployed items cannot be reassigned'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('assignItemsToRelease warns for Clarifying items', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Clarify item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await updateBacklogItem('PM-0000', { title: 'Clarify item', status: 'Clarifying', priority: 'Medium', effort: 'Unknown', release: 'Unassigned' }, projectPath);
  const result = await assignItemsToRelease({ release: 'v0.1.0', itemIds: ['PM-0000'] }, projectPath);
  assert.ok(result.warnings.some((warning) => warning.includes('Clarifying')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('getReleasePlanner computes release readiness summary', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Ready item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await updateBacklogItem('PM-0000', { title: 'Ready item', status: 'Ready to Deploy', priority: 'Medium', effort: 'Unknown', release: 'v0.1.0' }, projectPath);
  await assignItemsToRelease({ release: 'v0.1.0', itemIds: ['PM-0000'] }, projectPath);
  const planner = await getReleasePlanner(projectPath);
  assert.equal(planner.releases.find((release) => release.id === 'v0.1.0').readiness, 'Ready to Deploy');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('generatePrompt creates and saves item-level prompt', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Prompt item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  const result = await generatePrompt({ type: 'item', id: 'PM-0000', save: true }, projectPath);
  assert.ok(result.prompt.includes('PM-0000'));
  assert.ok(result.prompt.includes('Do not redesign, refactor, restructure'));
  const item = (await readBacklogItems(projectPath)).items.find((candidate) => candidate.id === 'PM-0000');
  assert.ok(item.sections['Codex Prompt'].content.includes('PM-0000'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('generatePrompt creates and saves release-level prompt', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Release prompt item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await assignItemsToRelease({ release: 'v0.1.0', itemIds: ['PM-0000'] }, projectPath);
  const result = await generatePrompt({ type: 'release', id: 'v0.1.0', save: true }, projectPath);
  assert.ok(result.prompt.includes('Included backlog item IDs'));
  const release = fs.readFileSync(path.join(projectPath, 'releases', 'v0.1.0.md'), 'utf8');
  assert.ok(release.includes('Codex Development Prompt'));
  assert.ok(release.includes('PM-0000'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('generateChecklist creates and saves human testing checklist', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Checklist item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A', humanTestingPlan: 'Confirm behavior manually.' }, projectPath);
  await assignItemsToRelease({ release: 'v0.1.0', itemIds: ['PM-0000'] }, projectPath);
  const result = await generateChecklist({ id: 'v0.1.0', save: true }, projectPath);
  assert.ok(result.checklist.includes('Confirm behavior manually.'));
  const release = fs.readFileSync(path.join(projectPath, 'releases', 'v0.1.0.md'), 'utf8');
  assert.ok(release.includes('Human Testing Checklist'));
  assert.ok(release.includes('Confirm behavior manually.'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('createRelease validates release version and prevents duplicates', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const invalid = await createRelease('release-1', projectPath);
  assert.equal(invalid.statusCode, 400);
  const created = await createRelease('v0.2.0', projectPath);
  assert.equal(created.created, true);
  assert.ok(fs.existsSync(path.join(projectPath, 'releases', 'v0.2.0.md')));
  const duplicate = await createRelease('v0.2.0', projectPath);
  assert.equal(duplicate.statusCode, 409);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('getReleasePlanner lists historical non-version releases as reference', async () => {
  const { dir, projectPath } = makeProjectFixture();
  fs.mkdirSync(path.join(projectPath, 'releases'), { recursive: true });
  fs.writeFileSync(path.join(projectPath, 'releases', 'release-checklist.md'), '# Release Checklist\n', 'utf8');
  const planner = await getReleasePlanner(projectPath);
  const historical = planner.releases.find((release) => release.id === 'release-checklist');
  assert.ok(historical);
  assert.equal(historical.isVersionRelease, false);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('getReleasePlanner exposes release details and included item titles', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ type: 'Project Management', title: 'Release detail item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await assignItemsToRelease({ release: 'v0.3.0', itemIds: ['PM-0000'] }, projectPath);
  const planner = await getReleasePlanner(projectPath);
  const release = planner.releases.find((candidate) => candidate.id === 'v0.3.0');
  assert.equal(release.items[0].title, 'Release detail item');
  assert.equal(release.statusCounts.Planned, 1);
  assert.equal(release.promptStatus.codexPromptGenerated, false);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('generatePrompt creates version-control prompt', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ type: 'Project Management', title: 'VC item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  const result = await generatePrompt({ type: 'version-control', id: 'PM-0000', sourceType: 'item' }, projectPath);
  assert.ok(result.prompt.includes('version-control recommendation'));
  assert.ok(result.prompt.includes('Do not commit, push, merge'));
  assert.ok(generateVersionControlPrompt({ kind: 'Backlog item', id: 'PM-0000' }, []).includes('Changed files placeholder'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('UI static files expose combined Backlog Dashboard workspace and no batch banner text', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.ok(html.includes('favicon.svg'));
  assert.ok(fs.existsSync(new URL('../favicon.svg', import.meta.url)));
  assert.ok(html.includes('Backlog Dashboard'));
  assert.ok(html.includes('data-view-target="backlog"'));
  assert.ok(html.includes('data-view-target="releases"'));
  assert.ok(html.includes('data-view-target="validation"'));
  assert.ok(html.includes('data-view-target="prompts"'));
  assert.ok(html.includes('data-view-target="settings"'));
  assert.ok(!html.includes('data-view-target="dashboard"'));
  assert.ok(!html.includes('data-view="dashboard"'));
  assert.ok(html.includes('Needs Attention'));
  assert.ok(html.includes('Release Readiness'));
  assert.ok(html.includes('Recent Activity'));
  assert.ok(html.includes('By Status'));
  assert.ok(html.includes('By Priority'));
  assert.ok(html.includes('By Type'));
  assert.ok(html.includes('Lifecycle Board'));
  assert.ok(html.includes('Release Workspace'));
  assert.ok(html.includes('Prompt Workspace'));
  assert.ok(html.includes('Version Control Prompt'));
  assert.ok(html.includes('itemModal'));
  assert.ok(html.includes('Settings'));
  assert.ok(js.includes('Create Backlog Item'));
  assert.ok(js.includes('View Backlog Item'));
  assert.ok(js.includes('Edit Backlog Item'));
  assert.ok(js.includes('TYPE_PREFIX_MAP'));
  assert.ok(js.includes('formatValidationTimestamp'));
  assert.ok(js.includes('Archive'));
  assert.ok(js.includes('data-open-item'));
  assert.ok(js.includes('setView'));
  assert.ok(js.includes('sortSelect'));
  assert.ok(!/Build Batch|Batch 00\d/.test(html));
});

await runTest('readBacklogItems reads markdown files from all backlog folders', async () => {
  const { dir, projectPath } = makeProjectFixture();

  fs.writeFileSync(path.join(projectPath, 'backlog', 'active', 'TEST-0001-sample.md'), `---
id: TEST-0001
title: Active sample
status: New
priority: Medium
effort: Unknown
release: Unassigned
updated: 2026-04-28
---
`, 'utf8');
  fs.writeFileSync(path.join(projectPath, 'backlog', 'completed', 'BUG-0002-sample.md'), `---
id: BUG-0002
title: Completed sample
status: Deployed
priority: High
effort: S
release: v0.1.0
updated: 2026-04-28
---
`, 'utf8');

  const result = await readBacklogItems(projectPath);
  assert.equal(result.itemCount, 2);
  assert.equal(result.readOnly, true);
  assert.deepEqual(result.items.map((item) => item.id), ['BUG-0002', 'TEST-0001']);
  assert.equal(result.items.find((item) => item.id === 'TEST-0001').folder, 'active');
  assert.equal(result.items.find((item) => item.id === 'BUG-0002').folder, 'completed');
  assert.ok('rawBody' in result.items[0]);
  assert.ok('sections' in result.items[0]);

  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('readBacklogItems loads current project backlog without writing files', async () => {
  const result = await readBacklogItems();
  assert.ok(result.itemCount >= 1, 'expected at least one backlog item in docs/project/backlog');
  assert.ok(result.items.every((item) => item.folder), 'each item should include source folder');
  assert.ok(result.items.every((item) => item.rawBody !== undefined), 'each item should include raw markdown body');
  assert.ok(result.items.every((item) => item.sections), 'each item should include parsed sections');
});
