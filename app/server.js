import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = __dirname;
export const APP_CONFIG_PATH = path.resolve(APP_ROOT, 'pm-tools-config.json');
const DEFAULT_PROJECT_COLOR = '#253858';
const execFileAsync = promisify(execFile);

function readStartupAppConfig() {
  try {
    return JSON.parse(fsSync.readFileSync(APP_CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function resolveDefaultProjectPath() {
  const savedConfig = readStartupAppConfig();
  if (Array.isArray(savedConfig.projects) && savedConfig.projects.length) {
    const active = savedConfig.projects.find((project) => project.id === savedConfig.activeProjectId) || savedConfig.projects[0];
    if (active?.path) return path.resolve(active.path);
  }
  if (savedConfig.projectPath) return path.resolve(savedConfig.projectPath);

  const projectArgIndex = process.argv.indexOf('--project');
  const cliProjectPath = projectArgIndex !== -1 ? process.argv[projectArgIndex + 1] : '';
  if (process.env.PM_TOOLS_PROJECT_PATH) return path.resolve(process.env.PM_TOOLS_PROJECT_PATH);
  if (cliProjectPath) return path.resolve(cliProjectPath);

  const standaloneExamplePath = path.resolve(APP_ROOT, '..', 'examples', 'project');
  if (fsSync.existsSync(standaloneExamplePath)) return standaloneExamplePath;

  return path.resolve(APP_ROOT, '..', '..', 'project');
}

const DEFAULT_PROJECT_PATH = resolveDefaultProjectPath();
const _startupConfig = readStartupAppConfig();
const BACKLOG_FOLDERS = ['active', 'completed', 'deferred', 'archived'];
const APPROVED_PREFIXES = [
  'FEAT',
  'BUG',
  'ENH',
  'REQ',
  'TEST',
  'SEC',
  'API',
  'DATA',
  'OPS',
  'DOC',
  'ARCH',
  'REFA',
  'REL',
  'AI',
  'PM',
  'UX',
  'UI',
  'PERF',
  'RISK',
  'SPIKE',
];
export const TYPE_PREFIX_MAP = {
  Feature: 'FEAT',
  Bug: 'BUG',
  Enhancement: 'ENH',
  Requirement: 'REQ',
  Test: 'TEST',
  Security: 'SEC',
  'API / Integration': 'API',
  Data: 'DATA',
  Operations: 'OPS',
  Documentation: 'DOC',
  Architecture: 'ARCH',
  Refactor: 'REFA',
  Release: 'REL',
  AI: 'AI',
  'Project Management': 'PM',
  'User Experience': 'UX',
  'User Interface': 'UI',
  Performance: 'PERF',
  Risk: 'RISK',
  Spike: 'SPIKE',
};
const PREFIX_TYPE_MAP = Object.fromEntries(Object.entries(TYPE_PREFIX_MAP).map(([type, prefix]) => [prefix, type]));
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low', 'Someday', 'Parking Lot'];
const EFFORTS = ['XS', 'S', 'M', 'L', 'XL', 'Unknown'];
const STATUSES = [
  'Backlog',
  'Ready',
  'In Progress',
  'Needs Validation',
  'Ready to Release',
  'Done',
  'Blocked',
  'Deferred',
  'Archived',
];
const ACTIVE_STATUSES = new Set([
  'Backlog',
  'Ready',
  'In Progress',
  'Needs Validation',
  'Ready to Release',
  'Blocked',
]);
const STATUS_PROGRESS = new Map(STATUSES.map((status, index) => [status, index]));
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};
const KNOWN_SECTION_TITLES = [
  'Summary',
  'User Story',
  'Problem / Need',
  'Expected Outcome',
  'Functional Requirements',
  'Technical Requirements',
  'Acceptance Criteria',
  'Edge Cases',
  'Implementation Notes',
  'Testing Notes',
  'Human Testing Plan',
  'Codex Prompt',
  'Changed Files',
  'Owner Review Needed',
  'Activity',
  'Archive Note',
  'Defer Note',
  'Links',
];

function parseScalar(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((entry) => parseScalar(entry))
      .filter(Boolean);
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseFrontMatter(markdown) {
  const normalized = markdown.replace(/^\uFEFF/, '');
  if (!normalized.startsWith('---\n') && !normalized.startsWith('---\r\n')) {
    return { data: {}, body: markdown };
  }

  const delimiterMatch = normalized.match(/^---\r?\n/);
  const startLength = delimiterMatch?.[0]?.length ?? 4;
  const rest = normalized.slice(startLength);
  const endMatch = rest.match(/\r?\n---\r?\n/);
  if (!endMatch || endMatch.index === undefined) {
    return { data: {}, body: markdown };
  }

  const yaml = rest.slice(0, endMatch.index);
  const body = rest.slice(endMatch.index + endMatch[0].length);
  const data = {};

  for (const line of yaml.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1);
    if (key) data[key] = parseScalar(value);
  }

  return { data, body };
}

function normalizeSectionTitle(title) {
  return title.trim().replace(/\s+/g, ' ');
}

function sectionKey(title) {
  return normalizeSectionTitle(title).toLowerCase();
}

export function parseBodySections(body) {
  const sections = {};
  const otherSections = [];
  const knownKeys = new Map(KNOWN_SECTION_TITLES.map((title) => [sectionKey(title), title]));
  const headingPattern = /^##\s+(.+?)\s*#*\s*$/gm;
  const headings = [];
  let match;

  while ((match = headingPattern.exec(body)) !== null) {
    headings.push({
      title: normalizeSectionTitle(match[1]),
      start: match.index,
      contentStart: headingPattern.lastIndex,
    });
  }

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const next = headings[i + 1];
    const rawContent = body.slice(heading.contentStart, next ? next.start : body.length);
    const content = rawContent.replace(/^\r?\n/, '').replace(/\s+$/, '');
    const knownTitle = knownKeys.get(sectionKey(heading.title));
    const section = { title: heading.title, content };

    if (knownTitle) {
      sections[knownTitle] = section;
    } else {
      otherSections.push(section);
    }
  }

  return {
    rawBody: body,
    sections,
    otherSections,
  };
}

function publicItemPath(projectPath, filePath) {
  return path.relative(projectPath, filePath).split(path.sep).join('/');
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentIsoTimestamp() {
  return new Date().toISOString();
}

export function prefixFromType(type) {
  return TYPE_PREFIX_MAP[String(type ?? '').trim()] || '';
}

export function typeFromPrefix(prefix) {
  return PREFIX_TYPE_MAP[String(prefix ?? '').trim().toUpperCase()] || 'Unknown';
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function slugifyTitle(title) {
  return String(title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'untitled';
}

function extractItemNumber(id) {
  const match = String(id ?? '').match(/^[A-Z]+-(\d{4})$/);
  return match ? Number(match[1]) : null;
}

export async function getNextSequenceNumber(projectPath = DEFAULT_PROJECT_PATH) {
  const backlog = await readBacklogItems(projectPath);
  const numbers = backlog.items
    .map((item) => extractItemNumber(item.id))
    .filter((number) => Number.isInteger(number));
  const max = numbers.length ? Math.max(...numbers) : -1;
  if (max >= 9999) {
    throw new Error('No backlog ID numbers remain in the supported 0000-9999 range.');
  }
  return max + 1;
}

function yamlLine(key, value = '') {
  if (Array.isArray(value)) {
    return `${key}: [${value.map((entry) => String(entry ?? '').replace(/[\r\n,[\]]/g, ' ').trim()).filter(Boolean).join(', ')}]`;
  }
  return `${key}: ${String(value ?? '').replace(/[\r\n]/g, ' ').trim()}`;
}

function normalizeListText(value) {
  return String(value ?? '').trim();
}

function normalizeTokenList(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((entry) => String(entry ?? '').trim()).filter(Boolean))];
  }
  return [...new Set(String(value ?? '')
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean))];
}

function normalizeItemIdList(value) {
  return normalizeTokenList(value).map((entry) => entry.toUpperCase());
}

function criteriaLines(value) {
  const lines = normalizeListText(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line) => {
    const clean = line.replace(/^[-*]\s+/, '').replace(/^\[[ xX]\]\s+/, '');
    return `- [ ] ${clean}`;
  }).join('\n');
}

function optionalSection(title, content) {
  const normalized = normalizeListText(content);
  return normalized ? `\n## ${title}\n\n${normalized}\n` : '';
}

function sectionBlock(title, content) {
  return `\n## ${title}\n\n${String(content ?? '').trim()}\n`;
}

function statusFolder(status) {
  if (ACTIVE_STATUSES.has(status)) return 'active';
  if (status === 'Done') return 'completed';
  if (status === 'Deferred') return 'deferred';
  if (status === 'Archived') return 'archived';
  throw new Error(`Unsupported status: ${status}`);
}

export function validateCreateBacklogInput(input = {}) {
  const errors = [];
  const type = String(input.type ?? '').trim();
  const derivedPrefix = prefixFromType(type);
  const prefix = derivedPrefix || String(input.prefix ?? '').trim().toUpperCase();
  const title = String(input.title ?? '').trim();
  const summary = String(input.summary ?? '').trim();
  const problemNeed = String(input.problemNeed ?? '').trim();
  const expectedOutcome = String(input.expectedOutcome ?? '').trim();
  const acceptanceCriteria = normalizeListText(input.acceptanceCriteria);
  const priority = String(input.priority ?? 'Medium').trim() || 'Medium';
  const effort = String(input.effort ?? 'Unknown').trim() || 'Unknown';

  if (!type && !input.prefix) errors.push('type is required');
  if (type && !derivedPrefix) errors.push('type must be an approved value');
  if (!APPROVED_PREFIXES.includes(prefix)) errors.push('prefix must be an approved value');
  if (!title) errors.push('title is required');
  if (!summary) errors.push('summary is required');
  if (!problemNeed) errors.push('problem / need is required');
  if (!expectedOutcome) errors.push('expected outcome is required');
  if (!acceptanceCriteria) errors.push('at least one acceptance criterion is required');
  if (!PRIORITIES.includes(priority)) errors.push('priority must be an approved value');
  if (!EFFORTS.includes(effort)) errors.push('effort must be an approved value');

  return {
    ok: errors.length === 0,
    errors,
    value: {
      prefix,
      type: type || typeFromPrefix(prefix),
      title,
      summary,
      problemNeed,
      expectedOutcome,
      acceptanceCriteria,
      priority,
      effort,
      functionalRequirements: normalizeListText(input.functionalRequirements),
      technicalRequirements: normalizeListText(input.technicalRequirements),
      edgeCases: normalizeListText(input.edgeCases),
      implementationNotes: normalizeListText(input.implementationNotes),
      testingNotes: normalizeListText(input.testingNotes),
      humanTestingPlan: normalizeListText(input.humanTestingPlan),
      ownerReviewNeeded: normalizeListText(input.ownerReviewNeeded),
      userStory: normalizeListText(input.userStory),
      tags: normalizeTokenList(input.tags),
      blocks: normalizeItemIdList(input.blocks),
      blocked_by: normalizeItemIdList(input.blocked_by ?? input.blockedBy),
      sprint: normalizeListText(input.sprint),
      links: normalizeListText(input.links),
    },
  };
}

export function buildBacklogItemMarkdown(input, { id, number, date }) {
  const frontMatter = [
    '---',
    yamlLine('id', id),
    yamlLine('type', input.type),
    yamlLine('prefix', input.prefix),
    yamlLine('number', number),
    yamlLine('title', input.title),
    yamlLine('status', 'Backlog'),
    yamlLine('priority', input.priority),
    yamlLine('effort', input.effort),
    yamlLine('release', 'Unassigned'),
    yamlLine('tags', input.tags || []),
    yamlLine('blocks', input.blocks || []),
    yamlLine('blocked_by', input.blocked_by || []),
    yamlLine('sprint', input.sprint || ''),
    yamlLine('created', date),
    yamlLine('developed'),
    yamlLine('updated', date),
    yamlLine('tested'),
    yamlLine('deployed'),
    yamlLine('archived'),
    yamlLine('archive_reason'),
    yamlLine('deferred'),
    yamlLine('defer_reason'),
    '---',
  ].join('\n');

  return `${frontMatter}\n\n# ${id}: ${input.title}\n`
    + optionalSection('User Story', input.userStory)
    + `\n## Summary\n\n${input.summary}\n`
    + `\n## Problem / Need\n\n${input.problemNeed}\n`
    + `\n## Expected Outcome\n\n${input.expectedOutcome}\n`
    + optionalSection('Functional Requirements', input.functionalRequirements)
    + optionalSection('Technical Requirements', input.technicalRequirements)
    + `\n## Acceptance Criteria\n\n${criteriaLines(input.acceptanceCriteria)}\n`
    + optionalSection('Edge Cases', input.edgeCases)
    + optionalSection('Implementation Notes', input.implementationNotes)
    + `\n## Testing Notes\n\n${input.testingNotes || 'Not specified yet.'}\n`
    + `\n## Human Testing Plan\n\n${input.humanTestingPlan || 'Not specified yet.'}\n`
    + optionalSection('Owner Review Needed', input.ownerReviewNeeded)
    + '\n## Codex Prompt\n\nNot generated yet.\n'
    + '\n## Changed Files\n\n- None yet.\n'
    + '\n## Activity\n\n- None yet.\n'
    + `\n## Links\n\n${input.links || '- None.'}\n`;
}

async function atomicWriteFile(filePath, content) {
  const directory = path.dirname(filePath);
  const basename = path.basename(filePath).replace(/^\.+/, '') || 'file';
  const tempPath = path.join(directory, `${basename}.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tempPath, content, 'utf8');
  await fs.rename(tempPath, filePath);
}

function folderOrder(folder) {
  return BACKLOG_FOLDERS.indexOf(folder);
}

export function generateBacklogIndex(backlog) {
  const labels = {
    active: 'Active',
    completed: 'Completed',
    deferred: 'Deferred',
    archived: 'Archived',
  };
  const lines = [
    '# Project Backlog',
    '',
    'This file is generated from backlog item files.',
    '',
    'Individual backlog item files are the source of truth.',
    '',
    'Do not manually edit this file once the PM tooling is active.',
    '',
    `Last regenerated: ${todayIsoDate()}`,
    '',
  ];

  for (const folder of BACKLOG_FOLDERS) {
    const items = backlog.items
      .filter((item) => item.folder === folder)
      .sort((a, b) => a.id.localeCompare(b.id));
    lines.push(`## ${labels[folder]}`);
    lines.push('');
    if (!items.length) {
      lines.push('- None.');
      lines.push('');
      continue;
    }
    lines.push('| ID | Title | Status | Priority | Effort | Release | Updated | File |');
    lines.push('|---|---|---|---|---|---|---|---|');
    for (const item of items) {
      lines.push(`| ${item.id || ''} | ${item.title || ''} | ${item.status || ''} | ${item.priority || ''} | ${item.effort || ''} | ${item.release || ''} | ${item.updated || ''} | ${item.path || ''} |`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

async function updatePmMeta(projectPath, date) {
  const metaPath = path.join(projectPath, '.pm-meta.json');
  let meta = {};
  try {
    meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  meta.lastIndexRegeneration = date;
  await atomicWriteFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
}

async function readPmMeta(projectPath = DEFAULT_PROJECT_PATH) {
  const metaPath = path.join(projectPath, '.pm-meta.json');
  try {
    return JSON.parse(await fs.readFile(metaPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function updateLastBacklogValidation(projectPath, date) {
  const metaPath = path.join(projectPath, '.pm-meta.json');
  const meta = await readPmMeta(projectPath);
  meta.lastBacklogValidation = date;
  await atomicWriteFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
  return meta;
}

function normalizeProjectColor(value) {
  const color = String(value ?? '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : DEFAULT_PROJECT_COLOR;
}

function projectIdFromPath(projectPath) {
  const resolved = path.resolve(String(projectPath || DEFAULT_PROJECT_PATH));
  const hash = crypto.createHash('sha1').update(resolved.toLowerCase()).digest('hex').slice(0, 16);
  return `project-${hash || 'default'}`;
}

function normalizeProjectRecord(project = {}, fallback = {}) {
  const rawPath = String(project.path || project.projectPath || fallback.path || '').trim();
  const resolvedPath = rawPath ? path.resolve(rawPath) : '';
  const label = String(project.label || project.projectLabel || fallback.label || (resolvedPath ? path.basename(resolvedPath) : '') || 'Project').trim();
  return {
    id: String(project.id || fallback.id || projectIdFromPath(resolvedPath || label)).trim(),
    label,
    path: resolvedPath,
    color: normalizeProjectColor(project.color || fallback.color),
    lastValidatedAt: project.lastValidatedAt || fallback.lastValidatedAt || '',
    lastUsedAt: project.lastUsedAt || fallback.lastUsedAt || '',
  };
}

function dedupeProjects(projects = []) {
  const byPath = new Map();
  for (const project of projects) {
    const normalized = normalizeProjectRecord(project);
    if (!normalized.path) continue;
    const key = path.resolve(normalized.path).toLowerCase();
    byPath.set(key, { ...(byPath.get(key) || {}), ...normalized });
  }
  return [...byPath.values()];
}

export function normalizeAppConfig(cfg = {}) {
  const projects = [];
  if (Array.isArray(cfg.projects)) projects.push(...cfg.projects);
  if (cfg.projectPath) {
    projects.push({
      id: cfg.activeProjectId || projectIdFromPath(cfg.projectPath),
      label: cfg.projectLabel || '',
      path: cfg.projectPath,
      color: cfg.projectColor || DEFAULT_PROJECT_COLOR,
      lastUsedAt: cfg.lastUsedAt || '',
    });
  }
  if (Array.isArray(cfg.recentProjects)) {
    for (const recent of cfg.recentProjects) {
      projects.push({
        label: recent.label || '',
        path: recent.path || '',
        color: recent.color || DEFAULT_PROJECT_COLOR,
        lastUsedAt: recent.lastUsed || recent.lastUsedAt || '',
      });
    }
  }

  const normalizedProjects = dedupeProjects(projects);
  const activeProject = normalizedProjects.find((project) => project.id === cfg.activeProjectId)
    || normalizedProjects.find((project) => cfg.projectPath && path.resolve(project.path).toLowerCase() === path.resolve(cfg.projectPath).toLowerCase())
    || normalizedProjects[0]
    || null;

  return {
    activeProjectId: activeProject?.id || '',
    projects: normalizedProjects,
    activeProject,
    projectPath: activeProject?.path || '',
    projectLabel: activeProject?.label || '',
    recentProjects: normalizedProjects
      .filter((project) => project.id !== activeProject?.id)
      .map((project) => ({ path: project.path, label: project.label, lastUsed: project.lastUsedAt || '' })),
  };
}

export async function readAppConfig(configPath = APP_CONFIG_PATH) {
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    return normalizeAppConfig(JSON.parse(raw));
  } catch (error) {
    if (error.code === 'ENOENT') return normalizeAppConfig({});
    throw error;
  }
}

export async function writeAppConfig(patch, configPath = APP_CONFIG_PATH) {
  const current = await readAppConfig(configPath);
  const nextConfig = Array.isArray(patch.projects)
    ? { activeProjectId: patch.activeProjectId ?? current.activeProjectId, projects: patch.projects }
    : { ...current, ...patch };
  const updated = normalizeAppConfig(nextConfig);
  await atomicWriteFile(configPath, `${JSON.stringify({
    activeProjectId: updated.activeProjectId,
    projects: updated.projects,
  }, null, 2)}\n`);
  return updated;
}

export const runtimeConfig = normalizeAppConfig({
  ..._startupConfig,
  projectPath: _startupConfig.projectPath || DEFAULT_PROJECT_PATH,
});

function assertWithin(parent, child) {
  const relative = path.relative(parent, child);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Resolved file path is outside the allowed project directory.');
  }
}

function idIsSafe(id) {
  return /^[A-Z]+-\d{4}$/.test(String(id ?? ''));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function validationFinding(severity, message, { id = '', path: filePath = '', suggestedFix = '', fix = null } = {}) {
  const finding = { severity, id, path: filePath, message, suggestedFix };
  if (fix) finding.fix = fix;
  return finding;
}

async function readReleaseFiles(projectPath) {
  const releasesPath = path.resolve(projectPath, 'releases');
  assertWithin(path.resolve(projectPath), releasesPath);
  let entries = [];
  try {
    entries = await fs.readdir(releasesPath, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const releases = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue;
    const filePath = path.join(releasesPath, entry.name);
    const markdown = await fs.readFile(filePath, 'utf8');
    const { data, body } = parseFrontMatter(markdown);
    const inferredId = entry.name.replace(/\.md$/i, '');
    releases.push({
      id: data.id || inferredId,
      title: data.title || `Release ${data.id || inferredId}`,
      status: data.status || '',
      created: data.created || '',
      developed: data.developed || '',
      tested: data.tested || '',
      deployed: data.deployed || '',
      path: publicItemPath(projectPath, filePath),
      fileName: entry.name,
      frontMatter: data,
      rawBody: body,
      sections: parseBodySections(body).sections,
      itemIds: extractReleaseItemIds(body),
    });
  }
  return releases;
}

function extractReleaseItemIds(body) {
  const lines = String(body ?? '').split(/\r?\n/);
  const ids = [];
  let inIncluded = false;
  for (const line of lines) {
    if (/^##\s+Included Backlog Items\s*$/i.test(line.trim())) {
      inIncluded = true;
      continue;
    }
    if (inIncluded && /^##\s+/.test(line)) break;
    if (!inIncluded) continue;
    const matches = line.match(/\b[A-Z]+-\d{4}\b/g);
    if (matches) ids.push(...matches);
  }
  return [...new Set(ids)];
}

function releaseIsAssigned(value) {
  return value && value !== 'Unassigned';
}

function releaseFormatIsValid(value) {
  return value === 'Unassigned' || /^v\d+\.\d+\.\d+$/.test(String(value ?? ''));
}

export function isValidReleaseVersion(value) {
  return releaseFormatIsValid(String(value ?? '').trim());
}

function generatedIndexAppearsCurrent(existingIndex, backlog) {
  if (!existingIndex.trim()) return false;
  return backlog.items.every((item) => existingIndex.includes(item.id) && existingIndex.includes(item.path));
}

export async function validateBacklog(projectPath = DEFAULT_PROJECT_PATH, { updateMeta = true } = {}) {
  const projectRoot = path.resolve(projectPath);
  const backlog = await readBacklogItems(projectRoot);
  const releases = await readReleaseFiles(projectRoot);
  const metaBefore = await readPmMeta(projectRoot);
  const findings = [];
  const requiredFields = ['id', 'prefix', 'number', 'title', 'status', 'priority', 'effort', 'release', 'created', 'updated'];
  const lifecycleDates = ['created', 'developed', 'updated', 'tested', 'deployed', 'archived', 'deferred'];
  const ids = new Map();
  const itemById = new Map();
  const releaseById = new Map(releases.map((release) => [release.id, release]));

  for (const item of backlog.items) {
    if (!ids.has(item.id)) ids.set(item.id, []);
    ids.get(item.id).push(item);
    if (item.id && !itemById.has(item.id)) itemById.set(item.id, item);
  }

  for (const [id, matches] of ids.entries()) {
    if (id && matches.length > 1) {
      for (const item of matches) {
        findings.push(validationFinding('Error', `Duplicate backlog ID ${id}.`, {
          id,
          path: item.path,
          suggestedFix: 'Assign one duplicate item a new globally unique ID.',
        }));
      }
    }
  }

  for (const item of backlog.items) {
    for (const field of requiredFields) {
      if (!String(item.frontMatter?.[field] ?? '').trim()) {
        findings.push(validationFinding('Error', `Missing required front matter field: ${field}.`, {
          id: item.id,
          path: item.path,
          suggestedFix: `Add ${field} to the backlog item front matter.`,
        }));
      }
    }

    if (item.prefix && !APPROVED_PREFIXES.includes(item.prefix)) {
      findings.push(validationFinding('Error', `Invalid prefix: ${item.prefix}.`, {
        id: item.id,
        path: item.path,
        suggestedFix: 'Choose an approved backlog prefix.',
      }));
    }
    if (item.status && !STATUSES.includes(item.status)) {
      findings.push(validationFinding('Error', `Invalid status: ${item.status}.`, {
        id: item.id,
        path: item.path,
        suggestedFix: 'Choose an approved backlog status.',
      }));
    } else if (item.status) {
      const expectedFolder = statusFolder(item.status);
      if (expectedFolder !== item.folder) {
        findings.push(validationFinding('Warning', `Status ${item.status} belongs in ${expectedFolder}/, but file is in ${item.folder}/.`, {
          id: item.id,
          path: item.path,
          suggestedFix: `Move this file to ./docs/project/backlog/${expectedFolder}/.`,
          fix: { action: 'move-item', id: item.id },
        }));
      }
    }
    if (item.priority && !PRIORITIES.includes(item.priority)) {
      findings.push(validationFinding('Error', `Invalid priority: ${item.priority}.`, {
        id: item.id,
        path: item.path,
        suggestedFix: 'Choose an approved priority.',
      }));
    }
    if (item.effort && !EFFORTS.includes(item.effort)) {
      findings.push(validationFinding('Error', `Invalid effort: ${item.effort}.`, {
        id: item.id,
        path: item.path,
        suggestedFix: 'Choose an approved effort value.',
      }));
    }
    if (item.release && !releaseFormatIsValid(item.release)) {
      findings.push(validationFinding('Warning', `Invalid release format: ${item.release}.`, {
        id: item.id,
        path: item.path,
        suggestedFix: 'Use Unassigned or an app version such as v0.1.0.',
      }));
    }
    if (releaseIsAssigned(item.release) && releaseFormatIsValid(item.release) && !releaseById.has(item.release)) {
      findings.push(validationFinding('Warning', `Missing release file for assigned release ${item.release}.`, {
        id: item.id,
        path: item.path,
        suggestedFix: `Create ./docs/project/releases/${item.release}.md or set release to Unassigned.`,
      }));
    }
    for (const field of lifecycleDates) {
      const value = item.frontMatter?.[field];
      if (value && !isValidIsoDate(value)) {
        findings.push(validationFinding('Warning', `Invalid date format for ${field}: ${value}.`, {
          id: item.id,
          path: item.path,
          suggestedFix: 'Use YYYY-MM-DD or leave the field blank when optional.',
        }));
      }
    }
    if (item.id && !item.fileName.startsWith(item.id)) {
      findings.push(validationFinding('Warning', `Filename does not start with item ID ${item.id}.`, {
        id: item.id,
        path: item.path,
        suggestedFix: `Rename the file so it starts with ${item.id}.`,
      }));
    }
    for (const tag of item.tags || []) {
      if (!/^[A-Za-z0-9_-]+$/.test(tag)) {
        findings.push(validationFinding('Warning', `Invalid tag value: ${tag}.`, {
          id: item.id,
          path: item.path,
          suggestedFix: 'Use tags with only letters, numbers, hyphens, and underscores.',
        }));
      }
    }
    for (const dependencyId of [...(item.blocks || []), ...(item.blocked_by || [])]) {
      if (dependencyId && !itemById.has(dependencyId)) {
        findings.push(validationFinding('Error', `Backlog item ${item.id} references missing dependency ${dependencyId}.`, {
          id: item.id,
          path: item.path,
          suggestedFix: 'Remove the missing dependency ID or create the referenced backlog item.',
        }));
      }
    }
  }

  for (const release of releases) {
    for (const id of release.itemIds) {
      const item = itemById.get(id);
      if (!item) {
        findings.push(validationFinding('Error', `Release references missing backlog item ${id}.`, {
          id,
          path: release.path,
          suggestedFix: 'Remove the missing item from the release file or create the referenced backlog item.',
        }));
        continue;
      }
      if (item.release !== release.id) {
        findings.push(validationFinding('Warning', `Backlog item ${id} is listed in ${release.id}, but item release is ${item.release || 'blank'}.`, {
          id,
          path: release.path,
          suggestedFix: `Set ${id} release to ${release.id} or remove it from this release file.`,
        }));
      }
    }
  }

  for (const item of backlog.items) {
    if (!releaseIsAssigned(item.release) || !releaseById.has(item.release)) continue;
    const release = releaseById.get(item.release);
    if (!release.itemIds.includes(item.id)) {
      findings.push(validationFinding('Warning', `Backlog item ${item.id} is assigned to ${item.release}, but the release file does not list it.`, {
        id: item.id,
        path: item.path,
        suggestedFix: `Add ${item.id} to ./docs/project/releases/${item.release}.md or change the item release.`,
      }));
    }
  }

  try {
    const index = await fs.readFile(path.join(projectRoot, 'BACKLOG.md'), 'utf8');
    if (!generatedIndexAppearsCurrent(index, backlog)) {
      findings.push(validationFinding('Warning', 'BACKLOG.md index appears out of sync with item files.', {
        path: 'BACKLOG.md',
        suggestedFix: 'Regenerate BACKLOG.md from individual backlog item files.',
        fix: { action: 'regenerate-index' },
      }));
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      findings.push(validationFinding('Warning', 'BACKLOG.md index is missing.', {
        path: 'BACKLOG.md',
        suggestedFix: 'Regenerate BACKLOG.md from individual backlog item files.',
      }));
    } else {
      throw error;
    }
  }

  findings.push(validationFinding('Info', `Validated ${backlog.itemCount} backlog item(s) and ${releases.length} release file(s).`, {
    suggestedFix: 'Review errors and warnings before applying future safe fixes.',
  }));

  const counts = findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
    return acc;
  }, { Error: 0, Warning: 0, Info: 0 });
  const date = currentIsoTimestamp();
  const meta = updateMeta ? await updateLastBacklogValidation(projectRoot, date) : metaBefore;

  return {
    projectPath: projectRoot,
    validatedAt: date,
    lastBacklogValidationBefore: metaBefore.lastBacklogValidation ?? null,
    lastBacklogValidation: meta.lastBacklogValidation ?? null,
    counts,
    findings,
  };
}

function analysisCounts(findings) {
  return findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
    return acc;
  }, { Error: 0, Warning: 0, Info: 0 });
}

async function hasRequiredBacklogFolders(projectPath) {
  for (const folder of BACKLOG_FOLDERS) {
    try {
      const stat = await fs.stat(path.join(projectPath, 'backlog', folder));
      if (!stat.isDirectory()) return false;
    } catch {
      return false;
    }
  }
  return true;
}

async function resolveProjectDataPath(inputPath) {
  const requested = path.resolve(String(inputPath ?? '').trim());
  const candidates = [
    { path: requested, inferred: false },
    { path: path.join(requested, 'project'), inferred: true },
    { path: path.join(requested, 'docs', 'project'), inferred: true },
  ];
  for (const candidate of candidates) {
    if (await hasRequiredBacklogFolders(candidate.path)) {
      return { requested, resolved: candidate.path, inferred: candidate.inferred };
    }
  }
  return { requested, resolved: requested, inferred: false };
}

export async function analyzeProjectPath(projectPath) {
  const pathText = String(projectPath ?? '').trim();
  const { requested, resolved, inferred } = pathText ? await resolveProjectDataPath(pathText) : { requested: '', resolved: '', inferred: false };
  const findings = [];
  if (!pathText) {
    findings.push(validationFinding('Error', 'Project path is required.', {
      suggestedFix: 'Enter the absolute path to the project PM folder, such as docs/project.',
    }));
    const counts = analysisCounts(findings);
    return { projectPath: '', analyzedAt: currentIsoTimestamp(), isValid: false, counts, findings };
  }

  if (inferred) {
    findings.push(validationFinding('Info', `Using PM data folder ${path.relative(requested, resolved).split(path.sep).join('/')} inside the selected project.`, {
      path: path.relative(requested, resolved).split(path.sep).join('/'),
      suggestedFix: 'No action needed. Save will point to this docs/project folder.',
    }));
  }

  try {
    const stat = await fs.stat(resolved);
    if (!stat.isDirectory()) {
      findings.push(validationFinding('Error', `Project path is not a directory: ${resolved}.`, {
        path: resolved,
        suggestedFix: 'Choose a folder that contains the PM project files.',
      }));
    }
  } catch {
    findings.push(validationFinding('Error', `Project path does not exist: ${resolved}.`, {
      path: resolved,
      suggestedFix: 'Create the project PM folder or correct the path.',
    }));
  }

  for (const folder of BACKLOG_FOLDERS) {
    const folderPath = path.join(resolved, 'backlog', folder);
    try {
      const stat = await fs.stat(folderPath);
      if (!stat.isDirectory()) {
        findings.push(validationFinding('Error', `Required backlog folder is not a directory: backlog/${folder}.`, {
          path: path.relative(resolved, folderPath).split(path.sep).join('/'),
          suggestedFix: `Create a directory at backlog/${folder}.`,
        }));
      }
    } catch {
      findings.push(validationFinding('Error', `Missing required backlog folder: backlog/${folder}.`, {
        path: `backlog/${folder}`,
        suggestedFix: `Create ${path.join(resolved, 'backlog', folder)}.`,
      }));
    }
  }

  if (!findings.some((finding) => finding.severity === 'Error')) {
    const validation = await validateBacklog(resolved, { updateMeta: false });
    findings.push(...validation.findings);
  }

  const counts = analysisCounts(findings);
  return {
    projectPath: resolved,
    analyzedAt: currentIsoTimestamp(),
    isValid: counts.Error === 0,
    counts,
    findings,
  };
}

export async function addProjectToConfig(input = {}, configPath = APP_CONFIG_PATH) {
  const current = await readAppConfig(configPath);
  const analysis = await analyzeProjectPath(input.path);
  if (!analysis.isValid) return { error: 'Project analysis found structural errors.', statusCode: 400, analysis };
  const project = normalizeProjectRecord({
    label: input.label,
    path: analysis.projectPath,
    color: input.color,
    lastValidatedAt: analysis.analyzedAt,
    lastUsedAt: currentIsoTimestamp(),
  });
  const projects = dedupeProjects([...current.projects.filter((existing) => path.resolve(existing.path).toLowerCase() !== project.path.toLowerCase()), project]);
  const updated = normalizeAppConfig({
    activeProjectId: current.activeProjectId || project.id,
    projects,
  });
  await atomicWriteFile(configPath, `${JSON.stringify({ activeProjectId: updated.activeProjectId, projects: updated.projects }, null, 2)}\n`);
  return { config: updated, project, analysis };
}

export async function updateProjectInConfig(id, input = {}, configPath = APP_CONFIG_PATH) {
  const current = await readAppConfig(configPath);
  const existing = current.projects.find((project) => project.id === id);
  if (!existing) return { error: `Project not found: ${id}`, statusCode: 404 };
  const nextPath = input.path ?? existing.path;
  const analysis = await analyzeProjectPath(nextPath);
  if (!analysis.isValid) return { error: 'Project analysis found structural errors.', statusCode: 400, analysis };
  const updatedProject = normalizeProjectRecord({
    ...existing,
    label: input.label ?? existing.label,
    path: analysis.projectPath,
    color: input.color ?? existing.color,
    lastValidatedAt: analysis.analyzedAt,
  }, existing);
  const projects = current.projects.map((project) => (project.id === id ? updatedProject : project));
  const updated = normalizeAppConfig({ activeProjectId: current.activeProjectId, projects });
  await atomicWriteFile(configPath, `${JSON.stringify({ activeProjectId: updated.activeProjectId, projects: updated.projects }, null, 2)}\n`);
  return { config: updated, project: updatedProject, analysis };
}

export async function removeProjectFromConfig(id, configPath = APP_CONFIG_PATH) {
  const current = await readAppConfig(configPath);
  const project = current.projects.find((candidate) => candidate.id === id);
  if (!project) return { error: `Project not found: ${id}`, statusCode: 404 };
  const projects = current.projects.filter((candidate) => candidate.id !== id);
  const updated = normalizeAppConfig({
    activeProjectId: current.activeProjectId === id ? projects[0]?.id || '' : current.activeProjectId,
    projects,
  });
  await atomicWriteFile(configPath, `${JSON.stringify({ activeProjectId: updated.activeProjectId, projects: updated.projects }, null, 2)}\n`);
  return { config: updated, removedProject: project };
}

export async function setActiveProjectInConfig(id, configPath = APP_CONFIG_PATH) {
  const current = await readAppConfig(configPath);
  const project = current.projects.find((candidate) => candidate.id === id);
  if (!project) return { error: `Project not found: ${id}`, statusCode: 404 };
  const analysis = await analyzeProjectPath(project.path);
  if (!analysis.isValid) return { error: 'Project analysis found structural errors.', statusCode: 400, analysis };
  const projects = current.projects.map((candidate) => (
    candidate.id === id ? { ...candidate, lastValidatedAt: analysis.analyzedAt, lastUsedAt: currentIsoTimestamp() } : candidate
  ));
  const updated = normalizeAppConfig({ activeProjectId: id, projects });
  await atomicWriteFile(configPath, `${JSON.stringify({ activeProjectId: updated.activeProjectId, projects: updated.projects }, null, 2)}\n`);
  return { config: updated, activeProject: updated.activeProject, analysis };
}

export async function createBacklogItem(input, projectPath = DEFAULT_PROJECT_PATH) {
  const validation = validateCreateBacklogInput(input);
  if (!validation.ok) {
    return { error: validation.errors.join('; '), statusCode: 400 };
  }

  const activePath = path.resolve(projectPath, 'backlog', 'active');
  assertWithin(path.resolve(projectPath, 'backlog'), activePath);
  await fs.mkdir(activePath, { recursive: true });

  const sequence = await getNextSequenceNumber(projectPath);
  const number = String(sequence).padStart(4, '0');
  const id = `${validation.value.prefix}-${number}`;
  const slug = slugifyTitle(validation.value.title);
  const fileName = `${id}-${slug}.md`;
  const filePath = path.resolve(activePath, fileName);
  assertWithin(activePath, filePath);

  try {
    await fs.access(filePath);
    return { error: `Backlog item file already exists: ${fileName}`, statusCode: 409 };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const currentBacklog = await readBacklogItems(projectPath);
  if (currentBacklog.items.some((item) => item.id === id)) {
    return { error: `Backlog item ID already exists: ${id}`, statusCode: 409 };
  }

  const date = todayIsoDate();
  const markdown = buildBacklogItemMarkdown(validation.value, { id, number, date });
  await fs.writeFile(filePath, markdown, { encoding: 'utf8', flag: 'wx' });

  let updatedBacklog;
  try {
    updatedBacklog = await readBacklogItems(projectPath);
    const indexPath = path.join(projectPath, 'BACKLOG.md');
    await atomicWriteFile(indexPath, generateBacklogIndex(updatedBacklog));
    await updatePmMeta(projectPath, date);
  } catch (error) {
    await fs.unlink(filePath).catch(() => {});
    throw error;
  }

  const created = updatedBacklog.items.find((item) => item.id === id);
  return {
    item: created,
    id,
    filePath: created?.path || publicItemPath(projectPath, filePath),
    backlog: updatedBacklog,
  };
}

function validateEditBacklogInput(input = {}, original = {}) {
  const errors = [];
  const status = String(input.status ?? original.status ?? '').trim();
  const priority = String(input.priority ?? original.priority ?? '').trim();
  const effort = String(input.effort ?? original.effort ?? '').trim();
  const title = String(input.title ?? original.title ?? '').trim();
  const release = String(input.release ?? original.release ?? 'Unassigned').replace(/[\r\n]/g, ' ').trim() || 'Unassigned';
  const requestedType = String(input.type ?? '').trim();

  if (!title) errors.push('title is required');
  if (!STATUSES.includes(status)) errors.push('status must be an approved value');
  if (!PRIORITIES.includes(priority)) errors.push('priority must be an approved value');
  if (!EFFORTS.includes(effort)) errors.push('effort must be an approved value');
  if (requestedType) {
    const requestedPrefix = prefixFromType(requestedType);
    if (!requestedPrefix) errors.push('type must be an approved value');
    if (requestedPrefix && requestedPrefix !== original.prefix) {
      errors.push('type cannot change the immutable backlog item prefix');
    }
  }

  const value = {
    title,
    status,
    priority,
    effort,
    release,
    type: requestedType || original.type || typeFromPrefix(original.prefix),
  };
  if (Object.hasOwn(input, 'tags')) value.tags = normalizeTokenList(input.tags);
  if (Object.hasOwn(input, 'blocks')) value.blocks = normalizeItemIdList(input.blocks);
  if (Object.hasOwn(input, 'blocked_by')) value.blocked_by = normalizeItemIdList(input.blocked_by);
  if (Object.hasOwn(input, 'blockedBy')) value.blocked_by = normalizeItemIdList(input.blockedBy);
  if (Object.hasOwn(input, 'sprint')) value.sprint = normalizeListText(input.sprint);
  if (Object.hasOwn(input, 'activityEntry')) value.activityEntry = normalizeListText(input.activityEntry);
  const optionalFields = [
    ['summary', 'summary'],
    ['userStory', 'userStory'],
    ['problemNeed', 'problemNeed'],
    ['expectedOutcome', 'expectedOutcome'],
    ['functionalRequirements', 'functionalRequirements'],
    ['technicalRequirements', 'technicalRequirements'],
    ['acceptanceCriteria', 'acceptanceCriteria'],
    ['edgeCases', 'edgeCases'],
    ['implementationNotes', 'implementationNotes'],
    ['testingNotes', 'testingNotes'],
    ['humanTestingPlan', 'humanTestingPlan'],
    ['ownerReviewNeeded', 'ownerReviewNeeded'],
    ['links', 'links'],
    ['archive_reason', 'archive_reason'],
    ['defer_reason', 'defer_reason'],
  ];
  for (const [source, target] of optionalFields) {
    if (Object.hasOwn(input, source)) value[target] = normalizeListText(input[source]);
  }
  if (Object.hasOwn(input, 'archiveReason')) value.archive_reason = normalizeListText(input.archiveReason);
  if (Object.hasOwn(input, 'deferReason')) value.defer_reason = normalizeListText(input.deferReason);

  return {
    ok: errors.length === 0,
    errors,
    value,
  };
}

function editedSectionContent(input, original, title, inputKey) {
  if (Object.hasOwn(input, inputKey)) return input[inputKey];
  return original.sections?.[title]?.content ?? '';
}

function activityEntry(message, date = currentIsoTimestamp()) {
  return `- ${date} - ${String(message ?? '').replace(/[\r\n]+/g, ' ').trim()}`;
}

function appendActivityContent(original, entry) {
  const existing = original.sections?.Activity?.content || '';
  if (!entry) return existing;
  if (!existing.trim() || /^-\s+None yet\.$/i.test(existing.trim())) return entry;
  return `${existing.trimEnd()}\n${entry}`;
}

function buildEditedBacklogMarkdown(original, input, date) {
  const fm = { ...original.frontMatter };
  fm.title = input.title;
  fm.status = input.status;
  fm.priority = input.priority;
  fm.effort = input.effort;
  fm.release = input.release;
  fm.tags = input.tags ?? normalizeTokenList(fm.tags);
  fm.blocks = input.blocks ?? normalizeItemIdList(fm.blocks);
  fm.blocked_by = input.blocked_by ?? normalizeItemIdList(fm.blocked_by);
  fm.sprint = input.sprint ?? fm.sprint ?? '';
  fm.updated = date;

  if (['Needs Validation', 'Ready to Release', 'Done'].includes(input.status) && !fm.developed) fm.developed = date;
  if (['Ready to Release', 'Done'].includes(input.status) && !fm.tested) fm.tested = date;
  if (input.status === 'Done' && !fm.deployed) fm.deployed = date;
  if (input.status === 'Archived') {
    if (!fm.archived) fm.archived = date;
    if (input.archive_reason) fm.archive_reason = input.archive_reason;
  }
  if (input.status === 'Deferred') {
    if (!fm.deferred) fm.deferred = date;
    if (input.defer_reason) fm.defer_reason = input.defer_reason;
  }

  const frontMatter = [
    '---',
    yamlLine('id', original.id),
    yamlLine('type', input.type || typeFromPrefix(original.prefix)),
    yamlLine('prefix', original.prefix),
    yamlLine('number', original.number),
    yamlLine('title', fm.title),
    yamlLine('status', fm.status),
    yamlLine('priority', fm.priority),
    yamlLine('effort', fm.effort),
    yamlLine('release', fm.release),
    yamlLine('tags', fm.tags),
    yamlLine('blocks', fm.blocks),
    yamlLine('blocked_by', fm.blocked_by),
    yamlLine('sprint', fm.sprint),
    yamlLine('created', fm.created),
    yamlLine('developed', fm.developed),
    yamlLine('updated', fm.updated),
    yamlLine('tested', fm.tested),
    yamlLine('deployed', fm.deployed),
    yamlLine('archived', fm.archived),
    yamlLine('archive_reason', fm.archive_reason),
    yamlLine('deferred', fm.deferred),
    yamlLine('defer_reason', fm.defer_reason),
    '---',
  ].join('\n');

  const preserved = (title) => original.sections?.[title]?.content ?? '';
  const activity = appendActivityContent(
    original,
    input.activityEntry || (original.status !== input.status ? activityEntry(`Status changed from ${original.status || 'blank'} to ${input.status}.`) : '')
  );
  const blocks = [
    sectionBlock('User Story', editedSectionContent(input, original, 'User Story', 'userStory')),
    sectionBlock('Summary', editedSectionContent(input, original, 'Summary', 'summary')),
    sectionBlock('Problem / Need', editedSectionContent(input, original, 'Problem / Need', 'problemNeed')),
    sectionBlock('Expected Outcome', editedSectionContent(input, original, 'Expected Outcome', 'expectedOutcome')),
    sectionBlock('Functional Requirements', editedSectionContent(input, original, 'Functional Requirements', 'functionalRequirements')),
    sectionBlock('Technical Requirements', editedSectionContent(input, original, 'Technical Requirements', 'technicalRequirements')),
    sectionBlock('Acceptance Criteria', editedSectionContent(input, original, 'Acceptance Criteria', 'acceptanceCriteria')),
    sectionBlock('Edge Cases', editedSectionContent(input, original, 'Edge Cases', 'edgeCases')),
    sectionBlock('Implementation Notes', editedSectionContent(input, original, 'Implementation Notes', 'implementationNotes')),
    sectionBlock('Testing Notes', editedSectionContent(input, original, 'Testing Notes', 'testingNotes')),
    sectionBlock('Human Testing Plan', editedSectionContent(input, original, 'Human Testing Plan', 'humanTestingPlan')),
    sectionBlock('Owner Review Needed', editedSectionContent(input, original, 'Owner Review Needed', 'ownerReviewNeeded')),
    sectionBlock('Codex Prompt', preserved('Codex Prompt')),
    sectionBlock('Changed Files', preserved('Changed Files')),
    sectionBlock('Activity', activity || '- None yet.'),
    sectionBlock('Links', editedSectionContent(input, original, 'Links', 'links')),
  ];

  if (fm.archive_reason || preserved('Archive Note')) {
    blocks.push(sectionBlock('Archive Note', preserved('Archive Note') || fm.archive_reason));
  }
  if (fm.defer_reason || preserved('Defer Note')) {
    blocks.push(sectionBlock('Defer Note', preserved('Defer Note') || fm.defer_reason));
  }
  for (const section of original.otherSections ?? []) {
    blocks.push(sectionBlock(section.title, section.content));
  }

  return `${frontMatter}\n\n# ${original.id}: ${input.title}\n${blocks.join('')}`;
}

async function replaceOrMoveFile({ oldPath, targetPath, content }) {
  const tempPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  const samePath = oldPath === targetPath;
  await fs.writeFile(tempPath, content, { encoding: 'utf8', flag: 'wx' });

  if (samePath) {
    await fs.rename(tempPath, targetPath);
    return;
  }

  try {
    await fs.access(targetPath);
    await fs.unlink(tempPath).catch(() => {});
    throw new Error('Target backlog filename already exists.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  await fs.rename(tempPath, targetPath);
  try {
    await fs.unlink(oldPath);
  } catch (error) {
    await fs.unlink(targetPath).catch(() => {});
    throw error;
  }
}

export async function updateBacklogItem(id, input, projectPath = DEFAULT_PROJECT_PATH) {
  if (!idIsSafe(id)) return { error: 'Invalid backlog item ID.', statusCode: 400 };

  const backlogRoot = path.resolve(projectPath, 'backlog');
  const backlog = await readBacklogItems(projectPath);
  const original = backlog.items.find((item) => item.id === id);
  if (!original) return { error: `Backlog item not found: ${id}`, statusCode: 404 };

  const validation = validateEditBacklogInput(input, original);
  if (!validation.ok) return { error: validation.errors.join('; '), statusCode: 400 };
  const warnings = [];
  if (validation.value.status === 'In Progress') {
    const byId = new Map(backlog.items.map((item) => [item.id, item]));
    const openBlockers = (validation.value.blocked_by ?? original.blocked_by ?? [])
      .map((blockedId) => byId.get(blockedId))
      .filter((blockedItem) => blockedItem && blockedItem.status !== 'Done');
    if (openBlockers.length) {
      warnings.push(`Item is blocked by non-deployed item(s): ${openBlockers.map((item) => `${item.id} (${item.status})`).join(', ')}.`);
    }
  }

  const targetFolder = statusFolder(validation.value.status);
  const targetFolderPath = path.resolve(backlogRoot, targetFolder);
  assertWithin(backlogRoot, targetFolderPath);
  await fs.mkdir(targetFolderPath, { recursive: true });

  const oldPath = path.resolve(projectPath, original.path);
  assertWithin(backlogRoot, oldPath);
  const targetFileName = `${original.id}-${slugifyTitle(validation.value.title)}.md`;
  const targetPath = path.resolve(targetFolderPath, targetFileName);
  assertWithin(backlogRoot, targetPath);

  const date = todayIsoDate();
  const markdown = buildEditedBacklogMarkdown(original, validation.value, date);
  try {
    await replaceOrMoveFile({ oldPath, targetPath, content: markdown });
  } catch (error) {
    if (/Target backlog filename already exists/.test(error.message)) {
      return { error: error.message, statusCode: 409 };
    }
    throw error;
  }

  let updatedBacklog;
  try {
    updatedBacklog = await readBacklogItems(projectPath);
    const indexPath = path.join(projectPath, 'BACKLOG.md');
    await atomicWriteFile(indexPath, generateBacklogIndex(updatedBacklog));
    await updatePmMeta(projectPath, date);
  } catch (error) {
    throw error;
  }

  const item = updatedBacklog.items.find((candidate) => candidate.id === id);
  return {
    id,
    item,
    oldPath: original.path,
    newPath: item?.path || publicItemPath(projectPath, targetPath),
    moved: original.path !== (item?.path || publicItemPath(projectPath, targetPath)),
    warnings,
    backlog: updatedBacklog,
  };
}

export async function appendBacklogItemActivity(id, note, projectPath = DEFAULT_PROJECT_PATH) {
  const text = String(note ?? '').trim();
  if (!text) return { error: 'Activity note is required.', statusCode: 400 };
  const backlog = await readBacklogItems(projectPath);
  const item = backlog.items.find((candidate) => candidate.id === id);
  if (!item) return { error: `Backlog item not found: ${id}`, statusCode: 404 };
  return updateBacklogItem(id, {
    title: item.title,
    status: item.status,
    priority: item.priority,
    effort: item.effort,
    release: item.release,
    tags: item.tags,
    blocks: item.blocks,
    blocked_by: item.blocked_by,
    sprint: item.sprint,
    activityEntry: activityEntry(`Note: ${text}`),
  }, projectPath);
}

export async function searchBacklogItems(query, projectPath = DEFAULT_PROJECT_PATH) {
  const q = String(query ?? '').trim().toLowerCase();
  const backlog = await readBacklogItems(projectPath);
  if (!q) return { query: '', items: [] };
  const items = backlog.items
    .map((item) => {
      const haystack = [item.id, item.title, item.status, item.release, item.rawBody].join('\n');
      const index = haystack.toLowerCase().indexOf(q);
      if (index === -1) return null;
      const start = Math.max(0, index - 48);
      const end = Math.min(haystack.length, index + q.length + 72);
      return {
        id: item.id,
        title: item.title,
        status: item.status,
        priority: item.priority,
        effort: item.effort,
        release: item.release,
        path: item.path,
        excerpt: `${start > 0 ? '...' : ''}${haystack.slice(start, end).replace(/\s+/g, ' ').trim()}${end < haystack.length ? '...' : ''}`,
      };
    })
    .filter(Boolean);
  return { query: q, items };
}

export async function getSavedViews(projectPath = DEFAULT_PROJECT_PATH) {
  const meta = await readPmMeta(projectPath);
  return Array.isArray(meta.savedViews) ? meta.savedViews : [];
}

export async function saveSavedViews(projectPath = DEFAULT_PROJECT_PATH, savedViews = []) {
  const metaPath = path.join(projectPath, '.pm-meta.json');
  const meta = await readPmMeta(projectPath);
  meta.savedViews = savedViews.map((view) => ({
    id: String(view.id || crypto.randomUUID()).trim(),
    name: String(view.name || 'Saved view').trim(),
    filters: view.filters || {},
  }));
  await atomicWriteFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
  return meta.savedViews;
}

export async function fixValidationFinding(projectPath = DEFAULT_PROJECT_PATH, input = {}) {
  const action = String(input.action || '').trim();
  if (action === 'regenerate-index') {
    const backlog = await readBacklogItems(projectPath);
    await atomicWriteFile(path.join(projectPath, 'BACKLOG.md'), generateBacklogIndex(backlog));
    await updatePmMeta(projectPath, todayIsoDate());
    return { action, fixed: true };
  }
  if (action === 'move-item') {
    const id = String(input.id || '').trim();
    const backlog = await readBacklogItems(projectPath);
    const item = backlog.items.find((candidate) => candidate.id === id);
    if (!item) return { error: `Backlog item not found: ${id}`, statusCode: 404 };
    const result = await updateBacklogItem(id, {
      title: item.title,
      status: item.status,
      priority: item.priority,
      effort: item.effort,
      release: item.release,
      tags: item.tags,
      blocks: item.blocks,
      blocked_by: item.blocked_by,
      sprint: item.sprint,
    }, projectPath);
    return { action, fixed: !result.error, result };
  }
  return { error: `Unsupported validation fix: ${action}`, statusCode: 400 };
}

function releaseFileMarkdown(version, date, itemIds = []) {
  return `---
id: ${version}
title: Release ${version}
status: Planning
created: ${date}
developed:
tested:
deployed:
---

# Release ${version}

## Goal

Describe the release goal.

## Included Backlog Items

${itemIds.length ? itemIds.map((id) => `- ${id}`).join('\n') : '- None.'}

## Release Status Summary

Planning.

## Codex Development Prompt

Not generated yet.

## Human Testing Checklist

- [ ] Not generated yet.

## Version Control Prompt

Not generated yet.

## Release Notes

List user-facing release notes for this release.
`;
}

function replaceMarkdownSection(markdown, title, content) {
  const block = `## ${title}\n\n${String(content ?? '').trim()}\n`;
  const lines = markdown.split(/\r?\n/);
  const wanted = sectionKey(title);
  let start = -1;
  let end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^##\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    if (start === -1 && sectionKey(match[1]) === wanted) {
      start = i;
      continue;
    }
    if (start !== -1) {
      end = i;
      break;
    }
  }
  if (start !== -1) {
    const before = lines.slice(0, start).join('\n').trimEnd();
    const after = lines.slice(end).join('\n').trimStart();
    return `${before}\n\n${block}${after ? `\n${after}` : ''}`;
  }
  return `${markdown.trimEnd()}\n\n${block}`;
}

function upsertReleaseItems(markdown, ids) {
  return replaceMarkdownSection(markdown, 'Included Backlog Items', ids.map((id) => `- ${id}`).join('\n') || '- None.');
}

async function ensureReleaseFile(projectPath, version, initialIds = []) {
  const releasesRoot = path.resolve(projectPath, 'releases');
  await fs.mkdir(releasesRoot, { recursive: true });
  const releasePath = path.resolve(releasesRoot, `${version}.md`);
  assertWithin(releasesRoot, releasePath);
  try {
    await fs.access(releasePath);
    return { created: false, path: releasePath };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.writeFile(releasePath, releaseFileMarkdown(version, todayIsoDate(), initialIds), { encoding: 'utf8', flag: 'wx' });
  return { created: true, path: releasePath };
}

function shouldPlanStatus(status) {
  return status === 'Backlog';
}

export async function assignItemsToRelease(input = {}, projectPath = DEFAULT_PROJECT_PATH) {
  const release = String(input.release ?? '').trim();
  const itemIds = [...new Set((input.itemIds ?? []).map((id) => String(id).trim()).filter(Boolean))];
  if (!isValidReleaseVersion(release)) return { error: 'Release must be Unassigned or a version such as v0.1.0.', statusCode: 400 };
  if (!itemIds.length) return { error: 'At least one backlog item must be selected.', statusCode: 400 };
  if (itemIds.some((id) => !idIsSafe(id))) return { error: 'One or more backlog item IDs are invalid.', statusCode: 400 };

  const backlog = await readBacklogItems(projectPath);
  const warnings = [];
  const originals = itemIds.map((id) => backlog.items.find((item) => item.id === id));
  const missing = itemIds.filter((id, index) => !originals[index]);
  if (missing.length) return { error: `Backlog item not found: ${missing.join(', ')}`, statusCode: 404 };
  const done = originals.filter((item) => item.status === 'Done');
  if (done.length) return { error: `Done items cannot be reassigned: ${done.map((item) => item.id).join(', ')}`, statusCode: 400 };

  if (originals.some((item) => item.status === 'Backlog')) {
    warnings.push('Backlog items should be reviewed before being assigned to a release.');
  }

  let releaseFileCreated = false;
  let releasePath = '';
  let releaseIds = [];
  if (release !== 'Unassigned') {
    const ensured = await ensureReleaseFile(projectPath, release, []);
    releaseFileCreated = ensured.created;
    releasePath = publicItemPath(projectPath, ensured.path);
    const releaseMarkdown = await fs.readFile(ensured.path, 'utf8');
    releaseIds = [...new Set([...extractReleaseItemIds(parseFrontMatter(releaseMarkdown).body).filter((id) => id !== 'None'), ...itemIds])];
    await atomicWriteFile(ensured.path, upsertReleaseItems(releaseMarkdown, releaseIds));
  }

  for (const item of originals) {
    const nextStatus = release === 'Unassigned'
      ? item.status
      : shouldPlanStatus(item.status) ? 'Ready' : item.status;
    await updateBacklogItem(item.id, {
      title: item.title,
      status: nextStatus,
      priority: item.priority,
      effort: item.effort,
      release,
    }, projectPath);
  }

  const updatedBacklog = await readBacklogItems(projectPath);
  await atomicWriteFile(path.join(projectPath, 'BACKLOG.md'), generateBacklogIndex(updatedBacklog));
  await updatePmMeta(projectPath, todayIsoDate());
  return {
    release,
    assignedItemIds: itemIds,
    warnings,
    releaseFileCreated,
    releasePath,
    releaseItemIds: releaseIds,
    backlog: updatedBacklog,
  };
}

function computeReleaseReadiness(itemIds, itemById) {
  const items = itemIds.map((id) => itemById.get(id)).filter(Boolean);
  if (items.length && items.every((item) => ['Ready to Release', 'Done'].includes(item.status))) return 'Ready to Release';
  if (items.some((item) => item.status === 'Blocked')) return 'Blocked';
  if (items.some((item) => item.status === 'Needs Validation')) return 'Needs Validation';
  if (items.some((item) => item.status === 'In Progress')) return 'In Progress';
  return 'Planning';
}

function countItemsByStatus(items) {
  return items.reduce((acc, item) => {
    const status = item?.status || 'Missing';
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
}

function releaseSectionGenerated(release, title, placeholderPattern) {
  const content = release.sections?.[title]?.content || '';
  return Boolean(content.trim()) && !placeholderPattern.test(content);
}

export async function getReleasePlanner(projectPath = DEFAULT_PROJECT_PATH) {
  const backlog = await readBacklogItems(projectPath);
  const releases = await readReleaseFiles(projectPath);
  const itemById = new Map(backlog.items.map((item) => [item.id, item]));
  return {
    releases: releases.map((release) => {
      const items = release.itemIds.map((id) => {
        const item = itemById.get(id);
        return {
          id,
          title: item?.title || '(missing item)',
          status: item?.status || 'Missing',
          priority: item?.priority || '',
          effort: item?.effort || '',
          release: item?.release || '',
          updated: item?.updated || '',
          folder: item?.folder || '',
          path: item?.path || '',
        };
      });
      return {
        id: release.id,
        status: release.status || 'Planning',
        created: release.created || '',
        developed: release.developed || '',
        tested: release.tested || '',
        deployed: release.deployed || '',
        path: release.path,
        isVersionRelease: /^v\d+\.\d+\.\d+$/.test(release.id),
        itemCount: release.itemIds.length,
        itemIds: release.itemIds,
        items,
        statusCounts: countItemsByStatus(items),
        attentionItems: items.filter((item) => ['Blocked', 'Backlog', 'Missing'].includes(item.status)),
        promptStatus: {
          codexPromptGenerated: releaseSectionGenerated(release, 'Codex Development Prompt', /not generated yet/i),
          checklistGenerated: releaseSectionGenerated(release, 'Human Testing Checklist', /not generated yet/i),
          versionControlPromptGenerated: releaseSectionGenerated(release, 'Version Control Prompt', /not generated yet/i),
        },
        readiness: computeReleaseReadiness(release.itemIds, itemById),
      };
    }).sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export async function createRelease(version, projectPath = DEFAULT_PROJECT_PATH) {
  const release = String(version ?? '').trim();
  if (!/^v\d+\.\d+\.\d+$/.test(release)) {
    return { error: 'Release version must use semantic app version format such as v0.1.0.', statusCode: 400 };
  }
  const releasesRoot = path.resolve(projectPath, 'releases');
  await fs.mkdir(releasesRoot, { recursive: true });
  const releasePath = path.resolve(releasesRoot, `${release}.md`);
  assertWithin(releasesRoot, releasePath);
  try {
    await fs.access(releasePath);
    return { error: `Release already exists: ${release}`, statusCode: 409 };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.writeFile(releasePath, releaseFileMarkdown(release, todayIsoDate(), []), { encoding: 'utf8', flag: 'wx' });
  return { id: release, path: publicItemPath(projectPath, releasePath), created: true };
}

function releaseFrontMatterMarkdown(data) {
  return [
    '---',
    yamlLine('id', data.id),
    yamlLine('title', data.title || `Release ${data.id}`),
    yamlLine('status', data.status || 'Planning'),
    yamlLine('created', data.created),
    yamlLine('developed', data.developed),
    yamlLine('tested', data.tested),
    yamlLine('deployed', data.deployed),
    '---',
  ].join('\n');
}

export async function updateReleaseMetadata(id, input = {}, projectPath = DEFAULT_PROJECT_PATH) {
  const releaseId = String(id ?? '').trim();
  if (!releaseId || !/^[A-Za-z0-9._-]+$/.test(releaseId)) return { error: 'Invalid release ID.', statusCode: 400 };
  const releasesRoot = path.resolve(projectPath, 'releases');
  const releasePath = path.resolve(releasesRoot, `${releaseId}.md`);
  assertWithin(releasesRoot, releasePath);
  let markdown = '';
  try {
    markdown = await fs.readFile(releasePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return { error: `Release not found: ${releaseId}`, statusCode: 404 };
    throw error;
  }
  const parsed = parseFrontMatter(markdown);
  const data = { ...parsed.data };
  const status = String(input.status ?? data.status ?? 'Planning').trim() || 'Planning';
  const date = todayIsoDate();
  data.id = releaseId;
  data.title = data.title || `Release ${releaseId}`;
  data.status = status;
  data.created = data.created || date;
  if (['Active', 'In Development'].includes(status) && !data.developed) data.developed = date;
  if (['Testing', 'Ready for Human Testing'].includes(status) && !data.tested) data.tested = date;
  if (['Released', 'Deployed'].includes(status) && !data.deployed) data.deployed = date;
  const nextMarkdown = `${releaseFrontMatterMarkdown(data)}\n\n${parsed.body.trimStart()}`;
  await atomicWriteFile(releasePath, nextMarkdown.endsWith('\n') ? nextMarkdown : `${nextMarkdown}\n`);
  return { id: releaseId, path: publicItemPath(projectPath, releasePath), release: data };
}

const SCOPE_RULE = 'Do not redesign, refactor, restructure, or expand scope unless the backlog item explicitly requires it. If scope expansion is necessary, stop and ask the requester.';
const VC_RULE = 'Do not commit, push, merge, rebase, force push, deploy, create a release, or create a tag without explicit approval from the project owner or authorized reviewer.';

export function generateItemCodexPrompt(item) {
  return `You are working in this repository using the project PM methodology.

Methodology files to read first:
- ./docs/_methodology/STARTUP.md
- ./docs/_methodology/BACKLOG_STANDARD.md
- ./docs/_methodology/DELIVERY_STANDARD.md

Source-of-truth files:
- ./docs/project/${item.path}
- ./docs/project/TEST_COMMANDS.md

Backlog item:
- ${item.id}: ${item.title}

Acceptance Criteria:
${item.sections?.['Acceptance Criteria']?.content || '- Review the backlog item acceptance criteria.'}

Scope-control rule:
${SCOPE_RULE}

Testing rule:
Read ./docs/project/TEST_COMMANDS.md before running tests. Run the required commands when applicable. If the file is missing, infer likely commands, label them as inferred, and recommend creating TEST_COMMANDS.md.

Backlog update rule:
Update the related backlog item file with status, lifecycle dates, implementation notes, testing notes, changed files, and links when applicable.

Agent Completion Report rule:
After implementation, provide an Agent Completion Report.

Version-control approval rule:
${VC_RULE}`;
}

export function generateReleaseCodexPrompt(release, items) {
  return `You are working in this repository using the project PM methodology.

Methodology files to read first:
- ./docs/_methodology/STARTUP.md
- ./docs/_methodology/BACKLOG_STANDARD.md
- ./docs/_methodology/DELIVERY_STANDARD.md
- ./docs/_methodology/RELEASE_STANDARD.md

Source-of-truth files:
- ./docs/project/releases/${release.fileName}
${items.map((item) => `- ./docs/project/${item.path}`).join('\n')}
- ./docs/project/TEST_COMMANDS.md

Release:
- ${release.id}

Included backlog item IDs:
${release.itemIds.map((id) => `- ${id}`).join('\n') || '- None'}

Acceptance Criteria:
${items.map((item) => `\n${item.id}: ${item.title}\n${item.sections?.['Acceptance Criteria']?.content || '- Review item file.'}`).join('\n')}

Scope-control rule:
${SCOPE_RULE}

Testing rule:
Read ./docs/project/TEST_COMMANDS.md before running tests. Run the required commands when applicable. If the file is missing, infer likely commands, label them as inferred, and recommend creating TEST_COMMANDS.md.

Backlog update rule:
Update related backlog item files with status, lifecycle dates, implementation notes, testing notes, changed files, and links when applicable.

Agent Completion Report rule:
After implementation, provide an Agent Completion Report.

Version-control approval rule:
${VC_RULE}`;
}

export function generateHumanTestingChecklist(release, items) {
  const lines = [`# Human Testing Checklist for ${release.id}`, ''];
  for (const item of items) {
    const plan = item.sections?.['Human Testing Plan']?.content || 'No human testing plan provided.';
    lines.push(`## ${item.id}: ${item.title}`, '', plan, '');
  }
  return lines.join('\n').trimEnd();
}

export function generateVersionControlPrompt(source = {}, items = []) {
  const label = source.id ? `${source.kind || 'Source'} ${source.id}` : 'Selected work';
  const itemLines = items.length
    ? items.map((item) => `- ${item.id}: ${item.title}`).join('\n')
    : '- Add included backlog item IDs and titles.';
  return `Prepare a version-control recommendation for ${label}.

Source:
- ${source.path ? `./docs/project/${source.path}` : 'Add source file path.'}

Backlog items:
${itemLines}

Test results placeholder:
- Add commands run and results.

Changed files placeholder:
- Add files proposed for commit.

Commit message placeholder:
- type: concise summary

Approval rule:
${VC_RULE}`;
}

async function saveSectionToFile(projectPath, relativePath, title, content) {
  const filePath = path.resolve(projectPath, relativePath);
  assertWithin(path.resolve(projectPath), filePath);
  const markdown = await fs.readFile(filePath, 'utf8');
  await atomicWriteFile(filePath, replaceMarkdownSection(markdown, title, content));
}

export async function generatePrompt(input = {}, projectPath = DEFAULT_PROJECT_PATH) {
  const type = String(input.type ?? '');
  const save = Boolean(input.save);
  const backlog = await readBacklogItems(projectPath);
  if (type === 'item') {
    const item = backlog.items.find((candidate) => candidate.id === input.id);
    if (!item) return { error: `Backlog item not found: ${input.id}`, statusCode: 404 };
    const prompt = generateItemCodexPrompt(item);
    if (save) await saveSectionToFile(projectPath, item.path, 'Codex Prompt', prompt);
    return { type, id: item.id, prompt, saved: save };
  }
  if (type === 'release') {
    const releases = await readReleaseFiles(projectPath);
    const release = releases.find((candidate) => candidate.id === input.id);
    if (!release) return { error: `Release not found: ${input.id}`, statusCode: 404 };
    const itemById = new Map(backlog.items.map((item) => [item.id, item]));
    const items = release.itemIds.map((id) => itemById.get(id)).filter(Boolean);
    const prompt = generateReleaseCodexPrompt(release, items);
    if (save) await saveSectionToFile(projectPath, release.path, 'Codex Development Prompt', prompt);
    return { type, id: release.id, prompt, saved: save };
  }
  if (type === 'version-control') {
    if (input.sourceType === 'release') {
      const releases = await readReleaseFiles(projectPath);
      const release = releases.find((candidate) => candidate.id === input.id);
      if (!release) return { error: `Release not found: ${input.id}`, statusCode: 404 };
      const itemById = new Map(backlog.items.map((item) => [item.id, item]));
      const items = release.itemIds.map((id) => itemById.get(id)).filter(Boolean);
      return { type, id: release.id, prompt: generateVersionControlPrompt({ kind: 'Release', id: release.id, path: release.path }, items), saved: false };
    }
    const item = backlog.items.find((candidate) => candidate.id === input.id);
    if (!item) return { error: `Backlog item not found: ${input.id}`, statusCode: 404 };
    return { type, id: item.id, prompt: generateVersionControlPrompt({ kind: 'Backlog item', id: item.id, path: item.path }, [item]), saved: false };
  }
  return { error: 'Prompt type must be item, release, or version-control.', statusCode: 400 };
}

export async function generateChecklist(input = {}, projectPath = DEFAULT_PROJECT_PATH) {
  const releases = await readReleaseFiles(projectPath);
  const release = releases.find((candidate) => candidate.id === input.id);
  if (!release) return { error: `Release not found: ${input.id}`, statusCode: 404 };
  const backlog = await readBacklogItems(projectPath);
  const itemById = new Map(backlog.items.map((item) => [item.id, item]));
  const items = release.itemIds.map((id) => itemById.get(id)).filter(Boolean);
  const checklist = generateHumanTestingChecklist(release, items);
  if (input.save) await saveSectionToFile(projectPath, release.path, 'Human Testing Checklist', checklist);
  return { id: release.id, checklist, saved: Boolean(input.save) };
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveGitRepoRoot(startPath) {
  let current = path.resolve(startPath || DEFAULT_PROJECT_PATH);
  try {
    const stat = await fs.stat(current);
    if (!stat.isDirectory()) current = path.dirname(current);
  } catch {
    current = path.dirname(current);
  }
  while (true) {
    if (await pathExists(path.join(current, '.git'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return '';
    current = parent;
  }
}

function methodologyExcerpt(content) {
  return String(content || '')
    .split(/\r?\n/)
    .filter((line) => /^#{1,3}\s+/.test(line) || /^-\s+/.test(line))
    .slice(0, 12)
    .join('\n');
}

export async function loadControlMethodology(repoRoot) {
  const files = [
    { key: 'startup', label: 'Methodology Startup', relativePath: 'docs/_methodology/STARTUP.md' },
    { key: 'delivery', label: 'Delivery Standard', relativePath: 'docs/_methodology/DELIVERY_STANDARD.md' },
    { key: 'release', label: 'Release Standard', relativePath: 'docs/_methodology/RELEASE_STANDARD.md' },
    { key: 'managerPrompt', label: 'Version-Control Manager Prompt', relativePath: 'docs/_methodology/prompts/version-control-manager.md' },
  ];
  const loaded = [];
  const warnings = [];
  for (const file of files) {
    const absolutePath = path.join(repoRoot, file.relativePath);
    try {
      const content = await fs.readFile(absolutePath, 'utf8');
      loaded.push({ ...file, path: absolutePath, found: true, excerpt: methodologyExcerpt(content), updatedAt: (await fs.stat(absolutePath)).mtime.toISOString() });
    } catch {
      loaded.push({ ...file, path: absolutePath, found: false, excerpt: '', updatedAt: '' });
      warnings.push(`Missing methodology file: ${file.relativePath}`);
    }
  }
  return { files: loaded, warnings };
}

function parseGitStatus(porcelain = '') {
  return porcelain.split(/\r?\n/).filter(Boolean).map((line) => {
    const index = line[0] || ' ';
    const worktree = line[1] || ' ';
    const rawPath = line.slice(3).trim();
    const filePath = rawPath.includes(' -> ') ? rawPath.split(' -> ').pop() : rawPath;
    return { index, worktree, path: filePath, staged: index !== ' ' && index !== '?', unstaged: worktree !== ' ', untracked: index === '?' && worktree === '?' };
  });
}

async function gitExec(repoRoot, args) {
  try {
    const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';
    const { stdout, stderr } = await execFileAsync(gitBin, args, { cwd: repoRoot, windowsHide: true, maxBuffer: 1024 * 1024 * 4 });
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    return { ok: false, stdout: error.stdout?.trim() || '', stderr: error.stderr?.trim() || error.message, code: error.code || 1 };
  }
}

async function ghExec(repoRoot, args) {
  try {
    const ghBin = process.platform === 'win32' ? 'gh.exe' : 'gh';
    const { stdout, stderr } = await execFileAsync(ghBin, args, { cwd: repoRoot, windowsHide: true, maxBuffer: 1024 * 1024 * 4 });
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    return { ok: false, stdout: error.stdout?.trim() || '', stderr: error.stderr?.trim() || error.message, code: error.code || 1 };
  }
}

async function readTestCommands(repoRoot) {
  const testPath = path.join(repoRoot, 'docs', 'project', 'TEST_COMMANDS.md');
  try {
    const content = await fs.readFile(testPath, 'utf8');
    const commands = content.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')).slice(0, 12);
    return { path: testPath, missing: false, commands };
  } catch {
    return {
      path: testPath,
      missing: true,
      commands: ['node --check app/server.js', 'node --check app/src/app.js', 'npm run check'],
      warning: 'docs/project/TEST_COMMANDS.md is missing; inferred likely app validation commands.',
    };
  }
}

export async function getControlManagerStatus(projectPath = DEFAULT_PROJECT_PATH) {
  const repoRoot = await resolveGitRepoRoot(projectPath);
  if (!repoRoot) return { error: 'Could not resolve a Git repository for the active project.', statusCode: 404 };
  const [branch, upstream, porcelain, remotes, methodology, tests] = await Promise.all([
    gitExec(repoRoot, ['branch', '--show-current']),
    gitExec(repoRoot, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']),
    gitExec(repoRoot, ['status', '--porcelain=v1']),
    gitExec(repoRoot, ['remote', '-v']),
    loadControlMethodology(repoRoot),
    readTestCommands(repoRoot),
  ]);
  const changedFiles = parseGitStatus(porcelain.stdout);
  const warnings = [...methodology.warnings];
  if (tests.missing) warnings.push(tests.warning);
  if (!upstream.ok) warnings.push('Current branch has no upstream or upstream could not be resolved.');
  if (!porcelain.ok) warnings.push(`Git status failed: ${porcelain.stderr || 'unknown error'}`);
  if (!branch.ok) warnings.push(`Git branch inspection failed: ${branch.stderr || 'unknown error'}`);
  if (!remotes.ok) warnings.push(`Git remote inspection failed: ${remotes.stderr || 'unknown error'}`);
  return {
    repoRoot,
    branch: branch.stdout || '',
    upstream: upstream.ok ? upstream.stdout : '',
    remotes: remotes.stdout.split(/\r?\n/).filter(Boolean),
    changedFiles,
    stagedFiles: changedFiles.filter((file) => file.staged),
    dirty: changedFiles.length > 0,
    methodology,
    tests,
    warnings,
  };
}

export async function getPromotionRecommendations(projectPath = DEFAULT_PROJECT_PATH) {
  const backlog = await readBacklogItems(projectPath);
  const eligibleStatuses = new Set(['Ready to Release']);
  const items = backlog.items
    .filter((item) => eligibleStatuses.has(item.status))
    .map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      release: item.release || 'Unassigned',
      priority: item.priority,
      path: item.path,
      reason: `${item.status} is eligible for promotion under the methodology.`,
    }));
  const byRelease = items.reduce((acc, item) => {
    const release = item.release || 'Unassigned';
    if (!acc[release]) acc[release] = [];
    acc[release].push(item);
    return acc;
  }, {});
  return { eligibleStatuses: [...eligibleStatuses], itemCount: items.length, items, byRelease };
}

function secretScanFinding(filePath, content) {
  const findings = [];
  if (/\.env($|\.)/i.test(filePath)) findings.push(`${filePath}: environment file should not be committed without review.`);
  if (/-----BEGIN (RSA |DSA |EC |OPENSSH |)PRIVATE KEY-----/.test(content)) findings.push(`${filePath}: private key material detected.`);
  if (/(ghp|github_pat|sk-[A-Za-z0-9]|xox[baprs]-)[A-Za-z0-9_\-]{20,}/.test(content)) findings.push(`${filePath}: token-like secret detected.`);
  if (/(api[_-]?key|secret|password)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{16,}/i.test(content)) findings.push(`${filePath}: credential-like assignment detected.`);
  return findings;
}

async function scanFilesForSecrets(repoRoot, files = []) {
  const findings = [];
  for (const file of files) {
    const absolutePath = path.resolve(repoRoot, file);
    if (!absolutePath.startsWith(repoRoot)) {
      findings.push(`${file}: path is outside repository.`);
      continue;
    }
    try {
      const stat = await fs.stat(absolutePath);
      if (!stat.isFile() || stat.size > 1024 * 1024) continue;
      findings.push(...secretScanFinding(file, await fs.readFile(absolutePath, 'utf8')));
    } catch {
      // Deleted files or inaccessible files are handled by Git and do not need content scanning.
    }
  }
  return findings;
}

export async function buildControlApprovalPackage(projectPath = DEFAULT_PROJECT_PATH, input = {}) {
  const status = await getControlManagerStatus(projectPath);
  if (status.error) return status;
  const recommendations = await getPromotionRecommendations(projectPath);
  const selectedFiles = [...new Set((input.selectedFiles || []).map((file) => String(file).trim()).filter(Boolean))];
  const excludedFiles = [...new Set((input.excludedFiles || []).map((file) => String(file).trim()).filter(Boolean))];
  const changedPaths = status.changedFiles.map((file) => file.path);
  const unaccountedFiles = changedPaths.filter((file) => !selectedFiles.includes(file) && !excludedFiles.includes(file));
  const releaseId = String(input.releaseId || '').trim();
  const branchName = String(input.branchName || (releaseId ? `release/${releaseId}` : '')).trim();
  const commitMessage = String(input.commitMessage || (releaseId ? `feat: deliver release ${releaseId}` : 'chore: update selected project work')).trim();
  const secretFindings = await scanFilesForSecrets(status.repoRoot, selectedFiles);
  const risks = [];
  if (status.branch === 'main') risks.push('Current branch is main; default flow should use a feature or release branch before commit.');
  if (unaccountedFiles.length) risks.push(`Unaccounted dirty files: ${unaccountedFiles.join(', ')}`);
  if (!selectedFiles.length) risks.push('No files selected for the proposed action.');
  if (secretFindings.length) risks.push(...secretFindings);
  if (!recommendations.itemCount) risks.push('No backlog items are currently Ready to Release.');
  return {
    repoRoot: status.repoRoot,
    branch: status.branch,
    upstream: status.upstream,
    changedFiles: status.changedFiles,
    selectedFiles,
    excludedFiles,
    unaccountedFiles,
    tests: status.tests,
    backlogItems: recommendations.items,
    releaseId,
    branchName,
    commitMessage,
    commands: {
      prepareBranch: branchName ? `git switch -c ${branchName}` : '',
      stageSelected: selectedFiles.length ? `git add -- ${selectedFiles.join(' ')}` : '',
      commit: `git commit -m "${commitMessage.replaceAll('"', '\\"')}"`,
      push: branchName || status.branch ? `git push -u origin ${branchName || status.branch}` : '',
      openPr: branchName || status.branch ? `gh pr create --base main --head ${branchName || status.branch}` : '',
      mergePr: 'gh pr merge <number> --merge',
    },
    requiredConfirmations: {
      prepareBranch: branchName ? `PREPARE BRANCH ${branchName}` : '',
      stageSelected: 'STAGE SELECTED',
      commit: `COMMIT ${releaseId || branchName || 'SELECTED'}`,
      push: `PUSH ${branchName || status.branch}`,
      openPr: `OPEN PR ${branchName || status.branch}`,
      mergePr: input.prNumber ? `MERGE PR ${input.prNumber}` : 'MERGE PR <number>',
    },
    risks,
    blockers: risks,
  };
}

function confirmationForAction(action, input, currentBranch) {
  const branchName = String(input.branchName || currentBranch || '').trim();
  const releaseId = String(input.releaseId || '').trim();
  const prNumber = String(input.prNumber || '').trim();
  const map = {
    'prepare-branch': `PREPARE BRANCH ${branchName}`,
    'stage-selected': 'STAGE SELECTED',
    commit: `COMMIT ${releaseId || branchName || 'SELECTED'}`,
    push: `PUSH ${branchName}`,
    'open-pr': `OPEN PR ${branchName}`,
    'merge-pr': `MERGE PR ${prNumber}`,
  };
  return map[action] || '';
}

export async function runControlManagerAction(projectPath = DEFAULT_PROJECT_PATH, action, input = {}) {
  const status = await getControlManagerStatus(projectPath);
  if (status.error) return status;
  const expected = confirmationForAction(action, input, status.branch);
  if (!expected || input.confirmation !== expected) {
    return { error: `Typed confirmation must exactly match: ${expected || 'unsupported action'}`, statusCode: 403, expectedConfirmation: expected };
  }
  const packagePreview = await buildControlApprovalPackage(projectPath, input);
  if (['stage-selected', 'commit'].includes(action) && packagePreview.unaccountedFiles?.length) {
    return { error: `Unaccounted dirty files must be selected or excluded before ${action}: ${packagePreview.unaccountedFiles.join(', ')}`, statusCode: 409, approvalPackage: packagePreview };
  }
  if (action === 'commit' && packagePreview.risks.some((risk) => /token-like|private key|credential-like|environment file/i.test(risk))) {
    return { error: 'Secret scan found risky content in selected files.', statusCode: 409, approvalPackage: packagePreview };
  }
  const selectedFiles = packagePreview.selectedFiles || [];
  let result;
  if (action === 'prepare-branch') result = await gitExec(status.repoRoot, ['switch', '-c', String(input.branchName || '').trim()]);
  else if (action === 'stage-selected') {
    if (!selectedFiles.length) return { error: 'Select at least one file to stage.', statusCode: 400 };
    result = await gitExec(status.repoRoot, ['add', '--', ...selectedFiles]);
  } else if (action === 'commit') result = await gitExec(status.repoRoot, ['commit', '-m', packagePreview.commitMessage]);
  else if (action === 'push') result = await gitExec(status.repoRoot, ['push', '-u', 'origin', String(input.branchName || status.branch).trim()]);
  else if (action === 'open-pr') result = await ghExec(status.repoRoot, ['pr', 'create', '--base', 'main', '--head', String(input.branchName || status.branch).trim(), '--title', String(input.prTitle || packagePreview.commitMessage), '--body', String(input.prBody || 'Prepared by PM Tools Control Manager.')]);
  else if (action === 'merge-pr') result = await ghExec(status.repoRoot, ['pr', 'merge', String(input.prNumber || '').trim(), '--merge']);
  else return { error: `Unsupported control-manager action: ${action}`, statusCode: 404 };
  if (!result.ok) return { error: result.stderr || `${action} failed.`, statusCode: 500, result, approvalPackage: packagePreview };
  return { action, result, approvalPackage: packagePreview };
}

export async function readBacklogItems(projectPath = DEFAULT_PROJECT_PATH) {
  const backlogRoot = path.resolve(projectPath, 'backlog');
  const items = [];

  for (const folder of BACKLOG_FOLDERS) {
    const folderPath = path.join(backlogRoot, folder);
    let entries = [];
    try {
      entries = await fs.readdir(folderPath, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue;
      const filePath = path.join(folderPath, entry.name);
      const markdown = await fs.readFile(filePath, 'utf8');
      const { data, body } = parseFrontMatter(markdown);
      const bodyModel = parseBodySections(body);
      items.push({
        id: data.id || '',
        type: data.type || typeFromPrefix(data.prefix),
        prefix: data.prefix || '',
        number: data.number || '',
        title: data.title || '',
        status: data.status || '',
        priority: data.priority || '',
        effort: data.effort || '',
        release: data.release || '',
        tags: normalizeTokenList(data.tags),
        blocks: normalizeItemIdList(data.blocks),
        blocked_by: normalizeItemIdList(data.blocked_by),
        sprint: data.sprint || '',
        created: data.created || '',
        developed: data.developed || '',
        updated: data.updated || '',
        tested: data.tested || '',
        deployed: data.deployed || '',
        archived: data.archived || '',
        archive_reason: data.archive_reason || '',
        deferred: data.deferred || '',
        defer_reason: data.defer_reason || '',
        folder,
        fileName: entry.name,
        path: publicItemPath(projectPath, filePath),
        frontMatter: data,
        rawBody: bodyModel.rawBody,
        sections: bodyModel.sections,
        otherSections: bodyModel.otherSections,
      });
    }
  }

  items.sort((a, b) => a.id.localeCompare(b.id) || a.fileName.localeCompare(b.fileName));
  return {
    projectPath,
    backlogRoot,
    itemCount: items.length,
    folders: BACKLOG_FOLDERS,
    readOnly: true,
    loadedAt: new Date().toISOString(),
    items,
  };
}

function sendJson(res, payload, statusCode = 200) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(body);
}

function sendError(res, statusCode, message) {
  sendJson(res, { error: message }, statusCode);
}

async function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const filePath = path.resolve(APP_ROOT, `.${requested}`);
  const relative = path.relative(APP_ROOT, filePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return sendError(res, 403, 'Forbidden');
  }

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'content-type': MIME_TYPES[ext] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(content);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') {
      return sendError(res, 404, 'Not found');
    }
    sendError(res, 500, error.message);
  }
}

export function updateRecentProjects(recentProjects, previousPath, previousLabel) {
  if (!previousPath) return Array.isArray(recentProjects) ? [...recentProjects] : [];
  let updated = Array.isArray(recentProjects) ? [...recentProjects] : [];
  const resolvedPrev = path.resolve(previousPath);
  updated = updated.filter((r) => path.resolve(r.path) !== resolvedPrev);
  updated.unshift({ path: previousPath, label: previousLabel || '', lastUsed: todayIsoDate() });
  return updated.slice(0, 10);
}

async function ensureConfigFile(config, configPath) {
  try {
    await fs.access(configPath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeAppConfig({ activeProjectId: config.activeProjectId, projects: config.projects }, configPath);
  }
}

export async function browseForProjectPath() {
  if (process.platform !== 'win32') {
    return { error: 'Folder browsing is only supported on Windows in this local app.', statusCode: 501 };
  }
  const script = String.raw`
$source = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class FolderPicker {
  [ComImport]
  [Guid("DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7")]
  private class FileOpenDialog {}

  [ComImport]
  [Guid("42f85136-db7e-439c-85f1-e4075d135fc8")]
  [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  private interface IFileDialog {
    [PreserveSig] int Show(IntPtr parent);
    void SetFileTypes(uint cFileTypes, IntPtr rgFilterSpec);
    void SetFileTypeIndex(uint iFileType);
    void GetFileTypeIndex(out uint piFileType);
    void Advise(IntPtr pfde, out uint pdwCookie);
    void Unadvise(uint dwCookie);
    void SetOptions(uint fos);
    void GetOptions(out uint fos);
    void SetDefaultFolder(IntPtr psi);
    void SetFolder(IntPtr psi);
    void GetFolder(out IntPtr ppsi);
    void GetCurrentSelection(out IntPtr ppsi);
    void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string pszName);
    void GetFileName([MarshalAs(UnmanagedType.LPWStr)] out string pszName);
    void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string pszTitle);
    void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string pszText);
    void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string pszLabel);
    void GetResult(out IShellItem ppsi);
    void AddPlace(IntPtr psi, uint fdap);
    void SetDefaultExtension([MarshalAs(UnmanagedType.LPWStr)] string pszDefaultExtension);
    void Close(int hr);
    void SetClientGuid(ref Guid guid);
    void ClearClientData();
    void SetFilter(IntPtr pFilter);
  }

  [ComImport]
  [Guid("d57c7288-d4ad-4768-be02-9d969532d960")]
  [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  private interface IFileOpenDialog {
    [PreserveSig] int Show(IntPtr parent);
    void SetFileTypes(uint cFileTypes, IntPtr rgFilterSpec);
    void SetFileTypeIndex(uint iFileType);
    void GetFileTypeIndex(out uint piFileType);
    void Advise(IntPtr pfde, out uint pdwCookie);
    void Unadvise(uint dwCookie);
    void SetOptions(uint fos);
    void GetOptions(out uint fos);
    void SetDefaultFolder(IntPtr psi);
    void SetFolder(IntPtr psi);
    void GetFolder(out IntPtr ppsi);
    void GetCurrentSelection(out IntPtr ppsi);
    void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string pszName);
    void GetFileName([MarshalAs(UnmanagedType.LPWStr)] out string pszName);
    void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string pszTitle);
    void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string pszText);
    void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string pszLabel);
    void GetResult(out IShellItem ppsi);
  }

  [ComImport]
  [Guid("43826d1e-e718-42ee-bc55-a1e261c37bfe")]
  [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  private interface IShellItem {
    void BindToHandler(IntPtr pbc, ref Guid bhid, ref Guid riid, out IntPtr ppv);
    void GetParent(out IShellItem ppsi);
    void GetDisplayName(uint sigdnName, out IntPtr ppszName);
    void GetAttributes(uint sfgaoMask, out uint psfgaoAttribs);
    void Compare(IShellItem psi, uint hint, out int piOrder);
  }

  public static string Pick() {
    const uint FOS_PICKFOLDERS = 0x00000020;
    const uint FOS_FORCEFILESYSTEM = 0x00000040;
    const uint FOS_PATHMUSTEXIST = 0x00000800;
    const uint SIGDN_FILESYSPATH = 0x80058000;
    const int ERROR_CANCELLED = unchecked((int)0x800704C7);

    IFileOpenDialog dialog = (IFileOpenDialog)new FileOpenDialog();
    dialog.SetOptions(FOS_PICKFOLDERS | FOS_FORCEFILESYSTEM | FOS_PATHMUSTEXIST);
    dialog.SetTitle("Select a project repository or docs/project folder");
    dialog.SetOkButtonLabel("Select Folder");
    int hr = dialog.Show(IntPtr.Zero);
    if (hr == ERROR_CANCELLED) return "";
    if (hr != 0) Marshal.ThrowExceptionForHR(hr);
    IShellItem item;
    dialog.GetResult(out item);
    IntPtr pathPtr;
    item.GetDisplayName(SIGDN_FILESYSPATH, out pathPtr);
    string path = Marshal.PtrToStringUni(pathPtr);
    Marshal.FreeCoTaskMem(pathPtr);
    return path;
  }
}
"@
Add-Type -TypeDefinition $source
[FolderPicker]::Pick()
`;
  try {
    const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-STA', '-Command', script], { windowsHide: false });
    const selectedPath = stdout.trim();
    return selectedPath ? { selectedPath } : { selectedPath: '', cancelled: true };
  } catch (error) {
    return { error: error.message || 'Folder browser failed.', statusCode: 500 };
  }
}

export function createServer(options = {}) {
  let config = normalizeAppConfig(options.config || runtimeConfig);
  const configPath = options.configPath || APP_CONFIG_PATH;
  const refreshConfigFromDisk = !Object.hasOwn(options, 'config') || Object.hasOwn(options, 'configPath');

  async function refreshConfig() {
    if (!refreshConfigFromDisk) return;
    Object.assign(config, await readAppConfig(configPath));
  }

  return http.createServer(async (req, res) => {
    await refreshConfig();
    const projectPath = config.activeProject?.path || config.projectPath || DEFAULT_PROJECT_PATH;
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/api/config') {
      try {
        return sendJson(res, config);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/projects/analyze') {
      try {
        const body = await readJsonBody(req);
        return sendJson(res, await analyzeProjectPath(body.path));
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/projects/browse') {
      try {
        const result = await browseForProjectPath();
        if (result.error) return sendJson(res, result, result.statusCode || 500);
        return sendJson(res, result);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/projects') {
      try {
        await ensureConfigFile(config, configPath);
        const result = await addProjectToConfig(await readJsonBody(req), configPath);
        if (result.error) return sendJson(res, result, result.statusCode || 400);
        Object.assign(config, result.config);
        return sendJson(res, { ...result.config, project: result.project, analysis: result.analysis }, 201);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (projectMatch && req.method === 'PUT') {
      try {
        await ensureConfigFile(config, configPath);
        const result = await updateProjectInConfig(decodeURIComponent(projectMatch[1]), await readJsonBody(req), configPath);
        if (result.error) return sendJson(res, result, result.statusCode || 400);
        Object.assign(config, result.config);
        return sendJson(res, { ...result.config, project: result.project, analysis: result.analysis });
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (projectMatch && req.method === 'DELETE') {
      try {
        await ensureConfigFile(config, configPath);
        const result = await removeProjectFromConfig(decodeURIComponent(projectMatch[1]), configPath);
        if (result.error) return sendJson(res, result, result.statusCode || 400);
        Object.assign(config, result.config);
        return sendJson(res, { ...result.config, removedProject: result.removedProject });
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'PUT' && url.pathname === '/api/config/active-project') {
      try {
        await ensureConfigFile(config, configPath);
        const body = await readJsonBody(req);
        const result = await setActiveProjectInConfig(String(body.activeProjectId || body.projectId || ''), configPath);
        if (result.error) return sendJson(res, result, result.statusCode || 400);
        Object.assign(config, result.config);
        return sendJson(res, { ...result.config, analysis: result.analysis });
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'PUT' && url.pathname === '/api/config') {
      try {
        await ensureConfigFile(config, configPath);
        const body = await readJsonBody(req);
        const newPath = String(body.projectPath ?? '').trim();
        const newLabel = String(body.projectLabel ?? '').trim();
        if (!newPath) return sendError(res, 400, 'projectPath is required.');
        const existing = config.projects.find((project) => path.resolve(project.path).toLowerCase() === path.resolve(newPath).toLowerCase());
        const result = existing
          ? await setActiveProjectInConfig(existing.id, configPath)
          : await addProjectToConfig({ path: newPath, label: newLabel, color: body.color }, configPath);
        if (result.error) return sendJson(res, result, result.statusCode || 400);
        Object.assign(config, result.config);
        return sendJson(res, { ...result.config, analysis: result.analysis });
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/backlog') {
      try {
        return sendJson(res, await readBacklogItems(projectPath));
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/backlog/search') {
      try {
        return sendJson(res, await searchBacklogItems(url.searchParams.get('q') || '', projectPath));
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/validation/meta') {
      try {
        return sendJson(res, {
          projectPath,
          lastBacklogValidation: (await readPmMeta(projectPath)).lastBacklogValidation ?? null,
        });
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/backlog/validate') {
      try {
        return sendJson(res, await validateBacklog(projectPath, { updateMeta: true }));
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/backlog/fix') {
      try {
        const result = await fixValidationFinding(projectPath, await readJsonBody(req));
        if (result.error) return sendJson(res, result, result.statusCode || 400);
        return sendJson(res, result);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/backlog/items') {
      try {
        const result = await createBacklogItem(await readJsonBody(req), projectPath);
        if (result.error) return sendError(res, result.statusCode || 400, result.error);
        return sendJson(res, result, 201);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    const editMatch = url.pathname.match(/^\/api\/backlog\/items\/([^/]+)$/);
    if (req.method === 'PUT' && editMatch) {
      try {
        const result = await updateBacklogItem(decodeURIComponent(editMatch[1]), await readJsonBody(req), projectPath);
        if (result.error) return sendError(res, result.statusCode || 400, result.error);
        return sendJson(res, result);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    const activityMatch = url.pathname.match(/^\/api\/backlog\/items\/([^/]+)\/activity$/);
    if (req.method === 'POST' && activityMatch) {
      try {
        const body = await readJsonBody(req);
        const result = await appendBacklogItemActivity(decodeURIComponent(activityMatch[1]), body.note, projectPath);
        if (result.error) return sendError(res, result.statusCode || 400, result.error);
        return sendJson(res, result);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/saved-views') {
      try {
        return sendJson(res, { savedViews: await getSavedViews(projectPath) });
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'PUT' && url.pathname === '/api/saved-views') {
      try {
        const body = await readJsonBody(req);
        return sendJson(res, { savedViews: await saveSavedViews(projectPath, body.savedViews || []) });
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/releases') {
      try {
        return sendJson(res, await getReleasePlanner(projectPath));
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    const releaseMatch = url.pathname.match(/^\/api\/releases\/([^/]+)$/);
    if (releaseMatch && req.method === 'PUT') {
      try {
        const result = await updateReleaseMetadata(decodeURIComponent(releaseMatch[1]), await readJsonBody(req), projectPath);
        if (result.error) return sendJson(res, result, result.statusCode || 400);
        return sendJson(res, result);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/control-manager/status') {
      try {
        const result = await getControlManagerStatus(projectPath);
        if (result.error) return sendJson(res, result, result.statusCode || 400);
        return sendJson(res, result);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/control-manager/recommendations') {
      try {
        return sendJson(res, await getPromotionRecommendations(projectPath));
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/control-manager/approval-package') {
      try {
        const result = await buildControlApprovalPackage(projectPath, await readJsonBody(req));
        if (result.error) return sendJson(res, result, result.statusCode || 400);
        return sendJson(res, result);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    const controlActionMatch = url.pathname.match(/^\/api\/control-manager\/actions\/([^/]+)$/);
    if (req.method === 'POST' && controlActionMatch) {
      try {
        const result = await runControlManagerAction(projectPath, decodeURIComponent(controlActionMatch[1]), await readJsonBody(req));
        if (result.error) return sendJson(res, result, result.statusCode || 400);
        return sendJson(res, result);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/releases/assign') {
      try {
        const result = await assignItemsToRelease(await readJsonBody(req), projectPath);
        if (result.error) return sendError(res, result.statusCode || 400, result.error);
        return sendJson(res, result);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if ((req.method === 'POST' || req.method === 'PUT') && url.pathname === '/api/releases') {
      try {
        const body = await readJsonBody(req);
        const result = await createRelease(body.version, projectPath);
        if (result.error) return sendError(res, result.statusCode || 400, result.error);
        return sendJson(res, result, 201);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/prompts/generate') {
      try {
        const result = await generatePrompt(await readJsonBody(req), projectPath);
        if (result.error) return sendError(res, result.statusCode || 400, result.error);
        return sendJson(res, result);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/checklists/generate') {
      try {
        const result = await generateChecklist(await readJsonBody(req), projectPath);
        if (result.error) return sendError(res, result.statusCode || 400, result.error);
        return sendJson(res, result);
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

    if (req.method !== 'GET') {
      return sendError(res, 405, 'Method not supported.');
    }

    return serveStatic(req, res);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const portArgIndex = process.argv.indexOf('--port');
  const port = Number(process.env.PORT || (portArgIndex !== -1 ? process.argv[portArgIndex + 1] : 4173));
  const server = createServer();

  server.on('error', (err) => {
    console.error('Server error:', err.message);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`PM Tools app running at http://localhost:${port}`);
    console.log(`Reading project data from ${DEFAULT_PROJECT_PATH}`);
    console.log('PM Tools MVP server is running.');
  });
}
