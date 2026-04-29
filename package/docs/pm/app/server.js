import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = __dirname;

function resolveDefaultProjectPath() {
  const projectArgIndex = process.argv.indexOf('--project');
  const cliProjectPath = projectArgIndex !== -1 ? process.argv[projectArgIndex + 1] : '';
  if (process.env.PM_TOOLS_PROJECT_PATH) return path.resolve(process.env.PM_TOOLS_PROJECT_PATH);
  if (cliProjectPath) return path.resolve(cliProjectPath);

  const standaloneExamplePath = path.resolve(APP_ROOT, '..', 'examples', 'project');
  if (fsSync.existsSync(standaloneExamplePath)) return standaloneExamplePath;

  return path.resolve(APP_ROOT, '..', '..', 'project');
}

const DEFAULT_PROJECT_PATH = resolveDefaultProjectPath();
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
  'New',
  'Clarifying',
  'Ready',
  'Planned',
  'In Development',
  'Development Complete',
  'Needs Review',
  'Changes Requested',
  'Ready for Testing',
  'In Testing',
  'Failed Testing',
  'Passed Testing',
  'Ready to Deploy',
  'Deployed',
  'Blocked',
  'Deferred',
  'Rejected',
  'Duplicate',
  'Archived',
];
const ACTIVE_STATUSES = new Set([
  'New',
  'Clarifying',
  'Ready',
  'Planned',
  'In Development',
  'Development Complete',
  'Needs Review',
  'Changes Requested',
  'Ready for Testing',
  'In Testing',
  'Failed Testing',
  'Passed Testing',
  'Ready to Deploy',
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
  'Eddie Review Needed',
  'Archive Note',
  'Defer Note',
  'Links',
];

function parseScalar(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
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
  return `${key}: ${String(value ?? '').replace(/[\r\n]/g, ' ').trim()}`;
}

function normalizeListText(value) {
  return String(value ?? '').trim();
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
  if (status === 'Deployed') return 'completed';
  if (status === 'Deferred') return 'deferred';
  if (['Archived', 'Rejected', 'Duplicate'].includes(status)) return 'archived';
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
      eddieReviewNeeded: normalizeListText(input.eddieReviewNeeded),
      userStory: normalizeListText(input.userStory),
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
    yamlLine('status', 'New'),
    yamlLine('priority', input.priority),
    yamlLine('effort', input.effort),
    yamlLine('release', 'Unassigned'),
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
    + optionalSection('Eddie Review Needed', input.eddieReviewNeeded)
    + '\n## Codex Prompt\n\nNot generated yet.\n'
    + '\n## Changed Files\n\n- None yet.\n'
    + `\n## Links\n\n${input.links || '- None.'}\n`;
}

async function atomicWriteFile(filePath, content) {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
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

function validationFinding(severity, message, { id = '', path: filePath = '', suggestedFix = '' } = {}) {
  return { severity, id, path: filePath, message, suggestedFix };
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
    ['eddieReviewNeeded', 'eddieReviewNeeded'],
    ['links', 'links'],
    ['archiveReason', 'archiveReason'],
    ['deferReason', 'deferReason'],
  ];
  for (const [source, target] of optionalFields) {
    if (Object.hasOwn(input, source)) value[target] = normalizeListText(input[source]);
  }

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

function buildEditedBacklogMarkdown(original, input, date) {
  const fm = { ...original.frontMatter };
  fm.title = input.title;
  fm.status = input.status;
  fm.priority = input.priority;
  fm.effort = input.effort;
  fm.release = input.release;
  fm.updated = date;

  if (input.status === 'Development Complete' && !fm.developed) fm.developed = date;
  if (input.status === 'Passed Testing' && !fm.tested) fm.tested = date;
  if (input.status === 'Deployed' && !fm.deployed) fm.deployed = date;
  if (input.status === 'Archived') {
    if (!fm.archived) fm.archived = date;
    if (input.archiveReason) fm.archive_reason = input.archiveReason;
  }
  if (input.status === 'Deferred') {
    if (!fm.deferred) fm.deferred = date;
    if (input.deferReason) fm.defer_reason = input.deferReason;
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
    sectionBlock('Eddie Review Needed', editedSectionContent(input, original, 'Eddie Review Needed', 'eddieReviewNeeded')),
    sectionBlock('Codex Prompt', preserved('Codex Prompt')),
    sectionBlock('Changed Files', preserved('Changed Files')),
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
    backlog: updatedBacklog,
  };
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
  const planned = STATUS_PROGRESS.get('Planned');
  return (STATUS_PROGRESS.get(status) ?? 0) < planned;
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
  const deployed = originals.filter((item) => item.status === 'Deployed');
  if (deployed.length) return { error: `Deployed items cannot be reassigned: ${deployed.map((item) => item.id).join(', ')}`, statusCode: 400 };

  if (originals.some((item) => item.status === 'Clarifying')) {
    warnings.push('Clarifying items need review before being planned.');
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
      : shouldPlanStatus(item.status) ? 'Planned' : item.status;
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
  if (items.length && items.every((item) => ['Ready to Deploy', 'Passed Testing'].includes(item.status))) return 'Ready to Deploy';
  if (items.some((item) => item.status === 'Blocked')) return 'Blocked';
  if (items.some((item) => item.status === 'Ready for Testing')) return 'Ready for Human Testing';
  if (items.some((item) => item.status === 'In Development')) return 'In Development';
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
        return { id, title: item?.title || '(missing item)', status: item?.status || 'Missing' };
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
        attentionItems: items.filter((item) => ['Blocked', 'Clarifying', 'Failed Testing', 'Missing'].includes(item.status)),
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

const SCOPE_RULE = 'Do not redesign, refactor, restructure, or expand scope unless the backlog item explicitly requires it. If you believe redesign, refactor, restructuring, or scope expansion is necessary, stop and ask Eddie first.';
const VC_RULE = "Do not commit, push, merge, rebase, force push, deploy, create a release, or create a tag without Eddie's explicit approval.";

export function generateItemCodexPrompt(item) {
  return `You are working in this repository using the project PM methodology.

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
    res.writeHead(200, { 'content-type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') {
      return sendError(res, 404, 'Not found');
    }
    sendError(res, 500, error.message);
  }
}

export function createServer({ projectPath = DEFAULT_PROJECT_PATH } = {}) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/api/backlog') {
      try {
        return sendJson(res, await readBacklogItems(projectPath));
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

    if (req.method === 'GET' && url.pathname === '/api/releases') {
      try {
        return sendJson(res, await getReleasePlanner(projectPath));
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

    if (req.method === 'POST' && url.pathname === '/api/releases') {
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

  server.listen(port, () => {
    console.log(`PM Tools app running at http://localhost:${port}`);
    console.log(`Reading project data from ${DEFAULT_PROJECT_PATH}`);
    console.log('PM Tools MVP server is running.');
  });
}
