import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createBacklogItem,
  addProjectToConfig,
  analyzeProjectPath,
  appendBacklogItemActivity,
  assignItemsToRelease,
  createServer,
  createRelease,
  generateChecklist,
  generatePrompt,
  generateVersionControlPrompt,
  buildControlApprovalPackage,
  fixValidationFinding,
  getSavedViews,
  getReleasePlanner,
  getNextSequenceNumber,
  getPromotionRecommendations,
  loadControlMethodology,
  resolveGitRepoRoot,
  runControlManagerAction,
  saveSavedViews,
  searchBacklogItems,
  isValidReleaseVersion,
  parseBodySections,
  parseFrontMatter,
  prefixFromType,
  readAppConfig,
  readBacklogItems,
  removeProjectFromConfig,
  setActiveProjectInConfig,
  slugifyTitle,
  typeFromPrefix,
  updateBacklogItem,
  updateReleaseMetadata,
  updateProjectInConfig,
  updateRecentProjects,
  validateBacklog,
  writeAppConfig,
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

function makeGitProjectFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-tools-git-'));
  const repoRoot = path.join(dir, 'repo');
  const projectPath = path.join(repoRoot, 'docs', 'project');
  for (const folder of ['active', 'completed', 'deferred', 'archived']) {
    fs.mkdirSync(path.join(projectPath, 'backlog', folder), { recursive: true });
  }
  fs.mkdirSync(path.join(repoRoot, 'docs', '_methodology', 'prompts'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', '_methodology', 'STARTUP.md'), '# Methodology Startup\n\n- startup rule\n', 'utf8');
  fs.writeFileSync(path.join(repoRoot, 'docs', '_methodology', 'DELIVERY_STANDARD.md'), '# Delivery Standard\n\n- dynamic rule\n', 'utf8');
  fs.writeFileSync(path.join(repoRoot, 'docs', '_methodology', 'RELEASE_STANDARD.md'), '# Release Standard\n\n- release rule\n', 'utf8');
  fs.writeFileSync(path.join(repoRoot, 'docs', '_methodology', 'prompts', 'version-control-manager.md'), '# Version-Control Manager\n\n- prompt rule\n', 'utf8');
  execFileSync('git', ['init'], { cwd: repoRoot, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: repoRoot, stdio: 'ignore' });
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# fixture\n', 'utf8');
  execFileSync('git', ['add', 'README.md'], { cwd: repoRoot, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'init'], { cwd: repoRoot, stdio: 'ignore' });
  return { dir, repoRoot, projectPath };
}

await runTest('parseFrontMatter extracts scalar fields', () => {
  const parsed = parseFrontMatter(`---
id: TEST-0001
title: Sample item
status: Backlog
priority: Medium
---

# Body
`);

  assert.equal(parsed.data.id, 'TEST-0001');
  assert.equal(parsed.data.title, 'Sample item');
  assert.equal(parsed.data.status, 'Backlog');
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
  assert.ok(markdown.includes('status: Backlog'));
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
    status: 'Backlog',
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
    status: 'Done',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
  }, projectPath);

  assert.equal(result.item.folder, 'completed');
  assert.ok(fs.existsSync(path.join(projectPath, 'backlog', 'completed', 'PM-0000-deploy-me.md')));
  assert.ok(!fs.existsSync(path.join(projectPath, 'backlog', 'active', 'PM-0000-deploy-me.md')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem sets deployed date when status becomes Done', async () => {
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
    status: 'Done',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
  }, projectPath);

  assert.match(result.item.deployed, /^\d{4}-\d{2}-\d{2}$/);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem sets tested date when status becomes Ready to Release', async () => {
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
    status: 'Ready to Release',
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
    archive_reason: 'No longer needed.',
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
    defer_reason: 'Wait for later.',
  }, projectPath);

  assert.match(result.item.deferred, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(result.item.defer_reason, 'Wait for later.');
  assert.equal(result.item.folder, 'deferred');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem still accepts legacy camelCase archive and defer reasons', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({
    prefix: 'PM',
    title: 'Legacy reasons',
    summary: 'Summary.',
    problemNeed: 'Need.',
    expectedOutcome: 'Outcome.',
    acceptanceCriteria: 'Criterion',
  }, projectPath);

  const archived = await updateBacklogItem('PM-0000', {
    title: 'Legacy reasons',
    status: 'Archived',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
    archiveReason: 'Legacy archive reason.',
  }, projectPath);

  assert.equal(archived.item.archive_reason, 'Legacy archive reason.');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateBacklogItem supports tags dependencies sprint and activity warnings', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Blocker', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await createBacklogItem({ prefix: 'PM', title: 'Blocked work', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);

  const result = await updateBacklogItem('PM-0001', {
    title: 'Blocked work',
    status: 'In Progress',
    priority: 'Medium',
    effort: 'S',
    release: 'Unassigned',
    tags: ['alpha', 'beta_tag'],
    blocks: [],
    blocked_by: ['PM-0000'],
    sprint: 'Sprint 1',
  }, projectPath);

  assert.deepEqual(result.item.tags, ['alpha', 'beta_tag']);
  assert.deepEqual(result.item.blocked_by, ['PM-0000']);
  assert.equal(result.item.sprint, 'Sprint 1');
  assert.ok(result.item.sections.Activity.content.includes('Status changed from Backlog to In Progress.'));
  assert.ok(result.warnings[0].includes('PM-0000'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('appendBacklogItemActivity adds an append-only Activity entry', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Activity item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);

  const result = await appendBacklogItemActivity('PM-0000', 'Owner reviewed scope.', projectPath);

  assert.ok(result.item.sections.Activity.content.includes('Note: Owner reviewed scope.'));
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
    status: 'Backlog',
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
status: Backlog
priority: Medium
effort: Unknown
release: Unassigned
created: 2026-04-28
updated: 2026-04-28
---
`, 'utf8');

  const result = await updateBacklogItem('PM-0000', {
    title: 'Zulu',
    status: 'Backlog',
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
    status: 'Backlog',
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
status: Backlog
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
status: Done
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
status: Backlog
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
    status: 'Backlog',
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
status: Done
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
    status: 'Backlog',
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
    status: 'Backlog',
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
status: Backlog
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
status: Backlog
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
  assert.equal(backlog.items.find((item) => item.id === 'PM-0000').status, 'Ready');
  assert.equal(backlog.items.find((item) => item.id === 'TEST-0001').status, 'Ready');
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
  await updateBacklogItem('PM-0000', { title: 'Advanced', status: 'In Progress', priority: 'Medium', effort: 'Unknown', release: 'Unassigned' }, projectPath);
  await assignItemsToRelease({ release: 'v0.1.0', itemIds: ['PM-0000'] }, projectPath);
  const item = (await readBacklogItems(projectPath)).items.find((candidate) => candidate.id === 'PM-0000');
  assert.equal(item.status, 'In Progress');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('assignItemsToRelease rejects Done items', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Deployed item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await updateBacklogItem('PM-0000', { title: 'Deployed item', status: 'Done', priority: 'Medium', effort: 'Unknown', release: 'Unassigned' }, projectPath);
  const result = await assignItemsToRelease({ release: 'v0.1.0', itemIds: ['PM-0000'] }, projectPath);
  assert.equal(result.statusCode, 400);
  assert.ok(result.error.includes('Done items cannot be reassigned'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('assignItemsToRelease warns for Backlog items', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Clarify item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await updateBacklogItem('PM-0000', { title: 'Clarify item', status: 'Backlog', priority: 'Medium', effort: 'Unknown', release: 'Unassigned' }, projectPath);
  const result = await assignItemsToRelease({ release: 'v0.1.0', itemIds: ['PM-0000'] }, projectPath);
  assert.ok(result.warnings.some((warning) => warning.includes('Backlog')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('getReleasePlanner computes release readiness summary', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Ready item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await updateBacklogItem('PM-0000', { title: 'Ready item', status: 'Ready to Release', priority: 'Medium', effort: 'Unknown', release: 'v0.1.0' }, projectPath);
  await assignItemsToRelease({ release: 'v0.1.0', itemIds: ['PM-0000'] }, projectPath);
  const planner = await getReleasePlanner(projectPath);
  assert.equal(planner.releases.find((release) => release.id === 'v0.1.0').readiness, 'Ready to Release');
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

await runTest('POST /api/releases creates a release file', async () => {
  const { dir, projectPath } = makeProjectFixture();
  const server = createServer({ config: { projectPath, projectLabel: '', recentProjects: [] } });
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  const response = await fetch(`http://localhost:${port}/api/releases`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ version: 'v0.4.0' }),
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.id, 'v0.4.0');
  assert.ok(fs.existsSync(path.join(projectPath, 'releases', 'v0.4.0.md')));

  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateReleaseMetadata stamps release lifecycle dates once', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createRelease('v0.4.0', projectPath);

  const active = await updateReleaseMetadata('v0.4.0', { status: 'Active' }, projectPath);
  const testing = await updateReleaseMetadata('v0.4.0', { status: 'Testing' }, projectPath);
  const released = await updateReleaseMetadata('v0.4.0', { status: 'Released' }, projectPath);

  assert.match(active.release.developed, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(testing.release.developed, active.release.developed);
  assert.match(testing.release.tested, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(released.release.deployed, /^\d{4}-\d{2}-\d{2}$/);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('searchBacklogItems returns body matches with excerpts', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Search item', summary: 'Rare phrase lives here.', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);

  const result = await searchBacklogItems('rare phrase', projectPath);

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, 'PM-0000');
  assert.ok(result.items[0].excerpt.toLowerCase().includes('rare phrase'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('saved views persist under project metadata', async () => {
  const { dir, projectPath } = makeProjectFixture();

  await saveSavedViews(projectPath, [{ id: 'view-1', name: 'Ready work', filters: { status: 'Ready' } }]);
  const views = await getSavedViews(projectPath);

  assert.equal(views.length, 1);
  assert.equal(views[0].name, 'Ready work');
  assert.equal(views[0].filters.status, 'Ready');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('validateBacklog flags invalid tags and missing dependency references', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Tagged dependency item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await updateBacklogItem('PM-0000', {
    title: 'Tagged dependency item',
    status: 'Backlog',
    priority: 'Medium',
    effort: 'Unknown',
    release: 'Unassigned',
    tags: ['bad tag'],
    blocked_by: ['PM-9999'],
  }, projectPath);

  const result = await validateBacklog(projectPath, { updateMeta: false });

  assert.ok(result.findings.some((finding) => finding.message.includes('Invalid tag value')));
  assert.ok(result.findings.some((finding) => finding.message.includes('references missing dependency PM-9999')));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('fixValidationFinding regenerates the BACKLOG index', async () => {
  const { dir, projectPath } = makeProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Index fix item', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  fs.writeFileSync(path.join(projectPath, 'BACKLOG.md'), '# stale\n', 'utf8');

  const result = await fixValidationFinding(projectPath, { action: 'regenerate-index' });
  const index = fs.readFileSync(path.join(projectPath, 'BACKLOG.md'), 'utf8');

  assert.equal(result.fixed, true);
  assert.ok(index.includes('PM-0000'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('project registry API analyzes, adds, switches, and removes entries', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-config-'));
  const configPath = path.join(dir, 'pm-tools-config.json');
  const fixtureA = makeProjectFixture();
  const fixtureB = makeProjectFixture();
  await writeAppConfig({ activeProjectId: '', projects: [] }, configPath);
  const server = createServer({ config: await readAppConfig(configPath), configPath });
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  const analysisResponse = await fetch(`http://localhost:${port}/api/projects/analyze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path: fixtureA.projectPath }),
  });
  const analysis = await analysisResponse.json();
  assert.equal(analysisResponse.status, 200);
  assert.equal(analysis.isValid, true);

  const addAResponse = await fetch(`http://localhost:${port}/api/projects`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ label: 'Project A', path: fixtureA.projectPath, color: '#123456' }),
  });
  const addA = await addAResponse.json();
  assert.equal(addAResponse.status, 201);
  assert.equal(addA.projects.length, 1);

  const addBResponse = await fetch(`http://localhost:${port}/api/projects`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ label: 'Project B', path: fixtureB.projectPath, color: '#654321' }),
  });
  const addB = await addBResponse.json();
  assert.equal(addBResponse.status, 201);
  const projectB = addB.projects.find((project) => project.label === 'Project B');

  const switchResponse = await fetch(`http://localhost:${port}/api/config/active-project`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ activeProjectId: projectB.id }),
  });
  const switched = await switchResponse.json();
  assert.equal(switchResponse.status, 200);
  assert.equal(switched.activeProjectId, projectB.id);

  const deleteResponse = await fetch(`http://localhost:${port}/api/projects/${encodeURIComponent(addA.project.id)}`, { method: 'DELETE' });
  const deleted = await deleteResponse.json();
  assert.equal(deleteResponse.status, 200);
  assert.equal(deleted.projects.length, 1);
  assert.ok(fs.existsSync(fixtureA.projectPath));

  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(fixtureA.dir, { recursive: true, force: true });
  fs.rmSync(fixtureB.dir, { recursive: true, force: true });
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('GET /api/config refreshes persisted project registry instead of stale startup config', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-config-'));
  const configPath = path.join(dir, 'pm-tools-config.json');
  const fixture = makeProjectFixture();
  await writeAppConfig({
    activeProjectId: 'project-stale',
    projects: [{ id: 'project-stale', label: 'Stale', path: fixture.projectPath, color: '#253858' }],
  }, configPath);
  const server = createServer({ config: await readAppConfig(configPath), configPath });
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  await writeAppConfig({
    activeProjectId: 'project-fresh',
    projects: [{ id: 'project-fresh', label: 'Fresh', path: fixture.projectPath, color: '#b91c1c' }],
  }, configPath);

  const response = await fetch(`http://localhost:${port}/api/config`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.activeProjectId, 'project-fresh');
  assert.equal(body.projects[0].label, 'Fresh');
  assert.equal(body.projects[0].color, '#b91c1c');

  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(fixture.dir, { recursive: true, force: true });
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('resolveGitRepoRoot walks up from project data folder', async () => {
  const { dir, repoRoot, projectPath } = makeGitProjectFixture();
  const resolved = await resolveGitRepoRoot(projectPath);
  assert.equal(resolved, repoRoot);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('loadControlMethodology reads docs/_methodology files dynamically', async () => {
  const { dir, repoRoot } = makeGitProjectFixture();
  const methodology = await loadControlMethodology(repoRoot);
  assert.equal(methodology.warnings.length, 0);
  assert.ok(methodology.files.find((file) => file.relativePath === 'docs/_methodology/DELIVERY_STANDARD.md')?.excerpt.includes('dynamic rule'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('getPromotionRecommendations includes only deploy-ready item statuses', async () => {
  const { dir, projectPath } = makeGitProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Ready deploy', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await createBacklogItem({ prefix: 'BUG', title: 'Passed testing', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await createBacklogItem({ prefix: 'FEAT', title: 'Not ready', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await updateBacklogItem('PM-0000', { title: 'Ready deploy', status: 'Ready to Release', priority: 'Medium', effort: 'Unknown', release: 'v0.1.0' }, projectPath);
  await updateBacklogItem('BUG-0001', { title: 'Passed testing', status: 'Ready to Release', priority: 'Medium', effort: 'Unknown', release: 'v0.1.0' }, projectPath);
  const recommendations = await getPromotionRecommendations(projectPath);
  assert.deepEqual(recommendations.items.map((item) => item.id).sort(), ['BUG-0001', 'PM-0000']);
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('control approval package identifies selected and unaccounted files', async () => {
  const { dir, repoRoot, projectPath } = makeGitProjectFixture();
  fs.appendFileSync(path.join(repoRoot, 'README.md'), 'included\n', 'utf8');
  fs.writeFileSync(path.join(repoRoot, 'other.txt'), 'other\n', 'utf8');
  const approval = await buildControlApprovalPackage(projectPath, { selectedFiles: ['README.md'], releaseId: 'v0.9.0' });
  assert.deepEqual(approval.selectedFiles, ['README.md']);
  assert.equal(approval.requiredConfirmations.commit, 'COMMIT v0.9.0');
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('control manager mutating actions reject wrong typed confirmation', async () => {
  const { dir, projectPath } = makeGitProjectFixture();
  const result = await runControlManagerAction(projectPath, 'stage-selected', { selectedFiles: ['README.md'], confirmation: 'STAGE EVERYTHING' });
  assert.equal(result.statusCode, 403);
  assert.ok(result.expectedConfirmation.includes('STAGE SELECTED'));
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('control manager API exposes status, recommendations, package, and approval gate', async () => {
  const { dir, projectPath } = makeGitProjectFixture();
  await createBacklogItem({ prefix: 'PM', title: 'Ready API', summary: 'S', problemNeed: 'N', expectedOutcome: 'O', acceptanceCriteria: 'A' }, projectPath);
  await updateBacklogItem('PM-0000', { title: 'Ready API', status: 'Ready to Release', priority: 'Medium', effort: 'Unknown', release: 'v0.9.0' }, projectPath);
  const server = createServer({ config: { projectPath, projectLabel: '', recentProjects: [] } });
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  const status = await (await fetch(`http://localhost:${port}/api/control-manager/status`)).json();
  assert.ok(status.repoRoot);
  const recommendations = await (await fetch(`http://localhost:${port}/api/control-manager/recommendations`)).json();
  assert.equal(recommendations.itemCount, 1);
  const approvalResponse = await fetch(`http://localhost:${port}/api/control-manager/approval-package`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ selectedFiles: ['docs/project/BACKLOG.md'], releaseId: 'v0.9.0' }),
  });
  const approval = await approvalResponse.json();
  assert.equal(approvalResponse.status, 200);
  assert.equal(approval.requiredConfirmations.commit, 'COMMIT v0.9.0');
  const rejectedResponse = await fetch(`http://localhost:${port}/api/control-manager/actions/stage-selected`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ selectedFiles: ['docs/project/BACKLOG.md'], confirmation: 'WRONG' }),
  });
  assert.equal(rejectedResponse.status, 403);

  await new Promise((resolve) => server.close(resolve));
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
  assert.equal(release.items[0].priority, 'Medium');
  assert.equal(release.items[0].path, 'backlog/active/PM-0000-release-detail-item.md');
  assert.equal(release.statusCounts.Ready, 1);
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
  assert.ok(html.includes('activeProjectSelect'));
  assert.ok(html.includes('project-picker'));
  assert.ok(!html.includes('dashboard-action-cards'));
  assert.ok(html.includes('ctx-total'));
  assert.ok(html.includes('ctx-bug'));
  assert.ok(html.includes('ctx-feat'));
  assert.ok(html.includes('ctx-enh'));
  assert.ok(html.includes('ctx-ux'));
  assert.ok(html.includes('data-view-target="backlog"'));
  assert.ok(html.includes('data-view-target="releases"'));
  assert.ok(html.includes('data-view-target="sprints"'));
  assert.ok(html.includes('data-view-target="roadmap"'));
  assert.ok(html.includes('data-view-target="validation"'));
  assert.ok(html.includes('data-view-target="prompts"'));
  assert.ok(html.includes('data-view-target="settings"'));
  assert.ok(!html.includes('data-view-target="dashboard"'));
  assert.ok(!html.includes('data-view="dashboard"'));
  assert.ok(html.includes('Needs Attention'));
  assert.ok(html.includes('Recent Activity'));
  assert.ok(!html.includes('Release Readiness'));
  assert.ok(html.includes('By Status'));
  assert.ok(html.includes('Open Items by Type'));
  assert.ok(!html.includes('By Priority'));
  assert.ok(html.includes('Lifecycle Board'));
  assert.ok(html.includes('Release Workspace'));
  assert.ok(html.includes('Prompt Workspace'));
  assert.ok(html.includes('Copy Prompt'));
  assert.ok(html.includes('Version Control Prompt'));
  assert.ok(html.includes('itemModal'));
  assert.ok(html.includes('Settings'));
  assert.ok(html.includes('Projects'));
  assert.ok(html.includes('Control Manager'));
  assert.ok(html.includes('refreshControlManagerBtn'));
  assert.ok(html.includes('controlManager'));
  assert.ok(html.includes('activeProjectButton'));
  assert.ok(html.includes('activeProjectSwatch'));
  assert.ok(js.includes('/api/control-manager/status'));
  assert.ok(js.includes('/api/control-manager/approval-package'));
  assert.ok(js.includes('data-control-action="commit"'));
  assert.ok(js.includes('Typed Approval'));
  assert.ok(js.includes('/api/projects/analyze'));
  assert.ok(js.includes('/api/projects/browse'));
  assert.ok(js.includes('data-board-status-filter'));
  assert.ok(js.includes('Generating...'));
  assert.ok(js.includes('project-picker-option'));
  assert.ok(html.includes('typeFilter'));
  assert.ok(html.includes('releaseFilter'));
  assert.ok(html.includes('bulkPriorityBtn'));
  assert.ok(html.includes('bulkStatusBtn'));
  assert.ok(html.includes('bulkReleaseBtn'));
  assert.ok(html.includes('fullTextSearchToggle'));
  assert.ok(html.includes('tagFilter'));
  assert.ok(html.includes('saveViewBtn'));
  assert.ok(html.includes('exportCsvBtn'));
  assert.ok(html.includes('themeToggleBtn'));
  assert.ok(html.includes('sprintBoard'));
  assert.ok(html.includes('roadmapBoard'));
  assert.ok(js.includes('/api/backlog/search'));
  assert.ok(js.includes('/api/saved-views'));
  assert.ok(js.includes('Keyboard Shortcuts'));
  assert.ok(js.includes('quickAddForm'));
  assert.ok(js.includes('data-validation-fix'));
  assert.ok(js.includes('release-progress'));
  assert.ok(js.includes('data-sprint-assign'));
  assert.ok(js.includes('settingsColor'));
  assert.ok(js.includes('browseProjectBtn'));
  assert.ok(js.includes('Browse'));
  assert.ok(js.includes('projectForm'));
  assert.ok(js.includes('state.projectForm = {'));
  assert.ok(js.includes('Remove Entry'));
  assert.ok(js.includes('activeProjectSelect'));
  assert.ok(js.includes('Create Backlog Item'));
  assert.ok(js.includes('View Backlog Item'));
  assert.ok(js.includes('Edit Backlog Item'));
  assert.ok(js.includes('TYPE_PREFIX_MAP'));
  assert.ok(js.includes('formatValidationTimestamp'));
  assert.ok(js.includes('Archive'));
  assert.ok(js.includes('data-open-item'));
  assert.ok(js.includes('setView'));
  assert.ok(js.includes('sortSelect'));
  assert.ok(js.includes('NON_INACTIVE_STATUS_FILTER'));
  assert.ok(js.includes('copyPromptToClipboard'));
  assert.ok(js.includes('releaseItemsTable'));
  assert.ok(!/Build Batch|Batch 00\d/.test(html));
});

await runTest('readBacklogItems reads markdown files from all backlog folders', async () => {
  const { dir, projectPath } = makeProjectFixture();

  fs.writeFileSync(path.join(projectPath, 'backlog', 'active', 'TEST-0001-sample.md'), `---
id: TEST-0001
title: Active sample
status: Backlog
priority: Medium
effort: Unknown
release: Unassigned
updated: 2026-04-28
---
`, 'utf8');
  fs.writeFileSync(path.join(projectPath, 'backlog', 'completed', 'BUG-0002-sample.md'), `---
id: BUG-0002
title: Completed sample
status: Done
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

// App Config

await runTest('readAppConfig returns defaults when config file is missing', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-config-'));
  const configPath = path.join(dir, 'pm-tools-config.json');

  const result = await readAppConfig(configPath);

  assert.equal(result.activeProjectId, '');
  assert.equal(result.activeProject, null);
  assert.equal(result.projectPath, '');
  assert.equal(result.projectLabel, '');
  assert.deepEqual(result.projects, []);
  assert.deepEqual(result.recentProjects, []);

  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('readAppConfig returns persisted values when file exists', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-config-'));
  const configPath = path.join(dir, 'pm-tools-config.json');
  fs.writeFileSync(configPath, JSON.stringify({ projectPath: '/some/path', projectLabel: 'Test App', recentProjects: [{ path: '/old/path', label: 'Old', lastUsed: '2026-01-01' }] }), 'utf8');

  const result = await readAppConfig(configPath);

  assert.equal(result.projectPath, path.resolve('/some/path'));
  assert.equal(result.projectLabel, 'Test App');
  assert.equal(result.recentProjects.length, 1);
  assert.equal(result.projects.length, 2);
  assert.equal(result.projects[0].path, path.resolve('/some/path'));
  assert.equal(result.recentProjects[0].path, path.resolve('/old/path'));

  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('writeAppConfig creates the file and round-trips correctly', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-config-'));
  const configPath = path.join(dir, 'pm-tools-config.json');

  const written = await writeAppConfig({ projectPath: '/new/path', projectLabel: 'New App' }, configPath);

  assert.equal(written.projectPath, path.resolve('/new/path'));
  assert.equal(written.projectLabel, 'New App');
  assert.deepEqual(written.recentProjects, []);
  assert.equal(written.projects.length, 1);

  const readBack = await readAppConfig(configPath);
  assert.equal(readBack.projectPath, path.resolve('/new/path'));
  assert.equal(readBack.projectLabel, 'New App');

  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('writeAppConfig merges patch without stomping unrelated fields', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-config-'));
  const configPath = path.join(dir, 'pm-tools-config.json');
  await writeAppConfig({ projectPath: '/original', projectLabel: 'Original', recentProjects: [{ path: '/old', label: 'Old', lastUsed: '2026-01-01' }] }, configPath);

  await writeAppConfig({ projectLabel: 'Updated Label' }, configPath);

  const result = await readAppConfig(configPath);
  assert.equal(result.projectPath, path.resolve('/original'));
  assert.equal(result.projectLabel, 'Updated Label');
  assert.equal(result.recentProjects.length, 1);

  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('analyzeProjectPath reports missing required project structure', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-analysis-'));
  const projectPath = path.join(dir, 'project');
  fs.mkdirSync(path.join(projectPath, 'backlog', 'active'), { recursive: true });

  const result = await analyzeProjectPath(projectPath);

  assert.equal(result.isValid, false);
  assert.ok(result.counts.Error >= 3);
  assert.ok(result.findings.some((finding) => finding.message.includes('Missing required backlog folder: backlog/completed')));

  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('analyzeProjectPath accepts repository root when docs/project contains PM data', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-analysis-'));
  const repoRoot = path.join(dir, 'repo');
  const projectPath = path.join(repoRoot, 'docs', 'project');
  for (const folder of ['active', 'completed', 'deferred', 'archived']) {
    fs.mkdirSync(path.join(projectPath, 'backlog', folder), { recursive: true });
  }

  const result = await analyzeProjectPath(repoRoot);

  assert.equal(result.isValid, true);
  assert.equal(result.projectPath, projectPath);
  assert.ok(result.findings.some((finding) => finding.severity === 'Info' && finding.message.includes('Using PM data folder')));

  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('analyzeProjectPath accepts docs folder when project contains PM data', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-analysis-'));
  const docsRoot = path.join(dir, 'repo', 'docs');
  const projectPath = path.join(docsRoot, 'project');
  for (const folder of ['active', 'completed', 'deferred', 'archived']) {
    fs.mkdirSync(path.join(projectPath, 'backlog', folder), { recursive: true });
  }

  const result = await analyzeProjectPath(docsRoot);

  assert.equal(result.isValid, true);
  assert.equal(result.projectPath, projectPath);
  assert.ok(result.findings.some((finding) => finding.severity === 'Info' && finding.path === 'project'));

  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('addProjectToConfig saves valid projects with color after analysis', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-config-'));
  const configPath = path.join(dir, 'pm-tools-config.json');
  const fixture = makeProjectFixture();

  const result = await addProjectToConfig({ label: 'Valid Project', path: fixture.projectPath, color: '#aa5500' }, configPath);

  assert.equal(result.project.label, 'Valid Project');
  assert.equal(result.project.color, '#aa5500');
  assert.equal(result.config.activeProjectId, result.project.id);
  assert.equal(result.config.projects.length, 1);
  assert.equal(result.analysis.isValid, true);

  fs.rmSync(fixture.dir, { recursive: true, force: true });
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('addProjectToConfig stores docs/project when given repository root', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-config-'));
  const configPath = path.join(dir, 'pm-tools-config.json');
  const repoRoot = path.join(dir, 'repo');
  const projectPath = path.join(repoRoot, 'docs', 'project');
  for (const folder of ['active', 'completed', 'deferred', 'archived']) {
    fs.mkdirSync(path.join(projectPath, 'backlog', folder), { recursive: true });
  }

  const result = await addProjectToConfig({ label: 'Repo Root', path: repoRoot, color: '#225533' }, configPath);

  assert.equal(result.analysis.isValid, true);
  assert.equal(result.project.path, projectPath);
  assert.equal(result.config.projectPath, projectPath);

  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateProjectInConfig saves updated project path after analysis', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-config-'));
  const configPath = path.join(dir, 'pm-tools-config.json');
  const first = makeProjectFixture();
  const secondRoot = path.join(dir, 'second-repo');
  const secondProjectPath = path.join(secondRoot, 'docs', 'project');
  for (const folder of ['active', 'completed', 'deferred', 'archived']) {
    fs.mkdirSync(path.join(secondProjectPath, 'backlog', folder), { recursive: true });
  }
  const added = await addProjectToConfig({ label: 'First', path: first.projectPath, color: '#335577' }, configPath);

  const updated = await updateProjectInConfig(added.project.id, { label: 'Second', path: secondRoot, color: '#d6a21d' }, configPath);
  const readBack = await readAppConfig(configPath);

  assert.equal(updated.analysis.isValid, true);
  assert.equal(updated.project.id, added.project.id);
  assert.equal(updated.project.label, 'Second');
  assert.equal(updated.project.color, '#d6a21d');
  assert.equal(updated.project.path, secondProjectPath);
  assert.equal(readBack.projects.find((project) => project.id === added.project.id).path, secondProjectPath);

  fs.rmSync(first.dir, { recursive: true, force: true });
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('addProjectToConfig blocks invalid projects with detailed report', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-config-'));
  const configPath = path.join(dir, 'pm-tools-config.json');
  const invalidPath = path.join(dir, 'missing-project');

  const result = await addProjectToConfig({ label: 'Invalid', path: invalidPath, color: '#123456' }, configPath);
  const readBack = await readAppConfig(configPath);

  assert.equal(result.statusCode, 400);
  assert.equal(result.analysis.isValid, false);
  assert.ok(result.analysis.findings.some((finding) => finding.suggestedFix));
  assert.equal(readBack.projects.length, 0);

  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('removeProjectFromConfig removes registry entry without deleting project files', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-config-'));
  const configPath = path.join(dir, 'pm-tools-config.json');
  const fixture = makeProjectFixture();
  const added = await addProjectToConfig({ label: 'Keep Files', path: fixture.projectPath, color: '#335577' }, configPath);
  const marker = path.join(fixture.projectPath, 'backlog', 'active', 'PM-0001-keep.md');
  fs.writeFileSync(marker, `---
id: PM-0001
prefix: PM
number: 0001
title: Keep
status: Backlog
priority: Medium
effort: Unknown
release: Unassigned
created: 2026-04-28
updated: 2026-04-28
---
`, 'utf8');

  const removed = await removeProjectFromConfig(added.project.id, configPath);

  assert.equal(removed.config.projects.length, 0);
  assert.ok(fs.existsSync(marker));

  fs.rmSync(fixture.dir, { recursive: true, force: true });
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('setActiveProjectInConfig blocks invalid saved projects', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-config-'));
  const configPath = path.join(dir, 'pm-tools-config.json');
  const fixture = makeProjectFixture();
  const invalidPath = path.join(dir, 'invalid-project');
  fs.mkdirSync(invalidPath, { recursive: true });
  await writeAppConfig({
    activeProjectId: 'valid',
    projects: [
      { id: 'valid', label: 'Valid', path: fixture.projectPath, color: '#111111' },
      { id: 'invalid', label: 'Invalid', path: invalidPath, color: '#222222' },
    ],
  }, configPath);

  const result = await setActiveProjectInConfig('invalid', configPath);
  const readBack = await readAppConfig(configPath);

  assert.equal(result.statusCode, 400);
  assert.equal(result.analysis.isValid, false);
  assert.equal(readBack.activeProjectId, 'valid');

  fs.rmSync(fixture.dir, { recursive: true, force: true });
  fs.rmSync(dir, { recursive: true, force: true });
});

await runTest('updateRecentProjects adds previousPath to front and removes duplicates', () => {
  const existing = [
    { path: '/path/a', label: 'A', lastUsed: '2026-01-01' },
    { path: '/path/b', label: 'B', lastUsed: '2026-01-02' },
  ];

  const result = updateRecentProjects(existing, '/path/c', 'C');

  assert.equal(result.length, 3);
  assert.equal(result[0].path, '/path/c');
  assert.equal(result[0].label, 'C');
  assert.ok(result[0].lastUsed, 'lastUsed should be set');
  assert.equal(result[1].path, '/path/a');
  assert.equal(result[2].path, '/path/b');
});

await runTest('updateRecentProjects removes existing entry for previousPath before prepending', () => {
  const existing = [
    { path: '/path/a', label: 'A', lastUsed: '2026-01-01' },
    { path: '/path/b', label: 'B', lastUsed: '2026-01-02' },
  ];

  const result = updateRecentProjects(existing, '/path/a', 'A updated');

  assert.equal(result.length, 2, 'should not duplicate /path/a');
  assert.equal(result[0].path, '/path/a');
  assert.equal(result[0].label, 'A updated');
  assert.equal(result[1].path, '/path/b');
});

await runTest('updateRecentProjects returns empty array when previousPath is falsy', () => {
  const existing = [{ path: '/path/a', label: 'A', lastUsed: '2026-01-01' }];

  const result = updateRecentProjects(existing, '', 'ignored');

  assert.deepEqual(result, existing);
});

await runTest('updateRecentProjects caps result at 10 entries', () => {
  const existing = Array.from({ length: 10 }, (_, i) => ({ path: `/old-${i}`, label: `Old ${i}`, lastUsed: `2026-01-${String(i + 1).padStart(2, '0')}` }));

  const result = updateRecentProjects(existing, '/current', 'Current');

  assert.equal(result.length, 10, 'should be capped at 10');
  assert.equal(result[0].path, '/current', 'newest entry should be first');
  assert.equal(result[9].path, '/old-8', 'entry 9 (oldest kept) should be /old-8, /old-9 should be trimmed');
});
