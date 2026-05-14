import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = __dirname;
export const APP_CONFIG_PATH = path.resolve(APP_ROOT, 'pm-tools-config.json');
const DEFAULT_PROJECT_COLOR = '#253858';

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
    const active = savedConfig.projects.find((p) => p.id === savedConfig.activeProjectId) || savedConfig.projects[0];
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

// ── Constants ──────────────────────────────────────────────────────────────

export const TYPE_PREFIX_MAP = {
  Feature: 'FEAT',
  Bug: 'BUG',
  Enhancement: 'ENH',
  Refactor: 'REFA',
  Documentation: 'DOC',
  Spike: 'SPIKE',
  Security: 'SEC',
  Task: 'TASK',
};
const PREFIX_TYPE_MAP = Object.fromEntries(Object.entries(TYPE_PREFIX_MAP).map(([t, p]) => [p, t]));
const APPROVED_PREFIXES = Object.values(TYPE_PREFIX_MAP);
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low', 'Someday'];
const EFFORTS = ['XS', 'S', 'M', 'L', 'XL', 'Unknown'];
const STATUSES = ['Inbox', 'Ready', 'In Progress', 'Review', 'Done'];

// Old status → new status mapping for backward compat
const LEGACY_STATUS_MAP = {
  Backlog: 'Inbox',
  'Needs Validation': 'Review',
  'Ready to Release': 'Review',
  Blocked: 'Inbox',
  Deferred: 'Inbox',
  Archived: 'Done',
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const KNOWN_SECTION_TITLES = ['Summary', 'Acceptance Criteria', 'Implementation Notes', 'Notes'];

// ── Parsing ────────────────────────────────────────────────────────────────

function parseScalar(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1).split(',').map((e) => parseScalar(e)).filter(Boolean);
  }
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseFrontMatter(markdown) {
  const normalized = markdown.replace(/^﻿/, '');
  if (!normalized.startsWith('---\n') && !normalized.startsWith('---\r\n')) return { data: {}, body: markdown };
  const delimiterMatch = normalized.match(/^---\r?\n/);
  const startLength = delimiterMatch?.[0]?.length ?? 4;
  const rest = normalized.slice(startLength);
  const endMatch = rest.match(/\r?\n---\r?\n/);
  if (!endMatch || endMatch.index === undefined) return { data: {}, body: markdown };
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
  const knownKeys = new Map(KNOWN_SECTION_TITLES.map((t) => [sectionKey(t), t]));
  const headingPattern = /^##\s+(.+?)\s*#*\s*$/gm;
  const headings = [];
  let match;
  while ((match = headingPattern.exec(body)) !== null) {
    headings.push({ title: normalizeSectionTitle(match[1]), start: match.index, contentStart: headingPattern.lastIndex });
  }
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const next = headings[i + 1];
    const rawContent = body.slice(heading.contentStart, next ? next.start : body.length);
    const content = rawContent.replace(/^\r?\n/, '').replace(/\s+$/, '');
    const knownTitle = knownKeys.get(sectionKey(heading.title));
    if (knownTitle) {
      sections[knownTitle] = { title: heading.title, content };
    } else {
      otherSections.push({ title: heading.title, content });
    }
  }
  return { rawBody: body, sections, otherSections };
}

// ── Utilities ──────────────────────────────────────────────────────────────

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
  return String(title ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72) || 'untitled';
}

function extractItemNumber(id) {
  const match = String(id ?? '').match(/^[A-Z]+-(\d{4})$/);
  return match ? Number(match[1]) : null;
}

function yamlLine(key, value = '') {
  if (Array.isArray(value)) {
    return `${key}: [${value.map((e) => String(e ?? '').replace(/[\r\n,[\]]/g, ' ').trim()).filter(Boolean).join(', ')}]`;
  }
  return `${key}: ${String(value ?? '').replace(/[\r\n]/g, ' ').trim()}`;
}

function normalizeTokenList(value) {
  if (Array.isArray(value)) return [...new Set(value.map((e) => String(e ?? '').trim()).filter(Boolean))];
  return [...new Set(String(value ?? '').split(/[\n,]+/).map((e) => e.trim()).filter(Boolean))];
}

function normalizeItemIdList(value) {
  return normalizeTokenList(value).map((e) => e.toUpperCase());
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function criteriaLines(value) {
  const lines = normalizeText(value).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const clean = line.replace(/^[-*]\s+/, '').replace(/^\[[ xX]\]\s+/, '');
    return `- [ ] ${clean}`;
  }).join('\n');
}

function optionalSection(title, content) {
  const normalized = normalizeText(content);
  return normalized ? `\n## ${title}\n\n${normalized}\n` : '';
}

function sectionBlock(title, content) {
  return `\n## ${title}\n\n${String(content ?? '').trim()}\n`;
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

function idIsSafe(id) {
  return /^[A-Z]+-\d{4}$/.test(String(id ?? ''));
}

function releaseIdIsSafe(id) {
  return /^REL-\d{4}$/.test(String(id ?? ''));
}

function assertWithin(parent, child) {
  const relative = path.relative(parent, child);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Resolved file path is outside the allowed project directory.');
  }
}

async function atomicWriteFile(filePath, content) {
  const directory = path.dirname(filePath);
  const basename = path.basename(filePath).replace(/^\.+/, '') || 'file';
  const tempPath = path.join(directory, `${basename}.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tempPath, content, 'utf8');
  await fs.rename(tempPath, filePath);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

// ── Folder / status mapping ────────────────────────────────────────────────

function statusFolder(status) {
  if (status === 'Done') return 'completed';
  if (['Inbox', 'Ready', 'In Progress', 'Review'].includes(status)) return 'active';
  throw new Error(`Unsupported status: ${status}`);
}

function normalizeStatus(raw) {
  const s = String(raw ?? '').trim();
  if (STATUSES.includes(s)) return s;
  return LEGACY_STATUS_MAP[s] || 'Inbox';
}

function normalizeLegacyTags(existingTags, oldStatus) {
  const tags = normalizeTokenList(existingTags);
  if (oldStatus === 'Blocked' && !tags.includes('blocked')) tags.push('blocked');
  if (oldStatus === 'Deferred' && !tags.includes('deferred')) tags.push('deferred');
  return tags;
}

// ── Backlog reading ────────────────────────────────────────────────────────

const READ_FOLDERS = ['active', 'completed', 'archived', 'deferred', 'items'];

async function readBacklogItemFile(projectPath, folder, fileName) {
  const filePath = path.join(projectPath, 'backlog', folder, fileName);
  const markdown = await fs.readFile(filePath, 'utf8');
  const { data, body } = parseFrontMatter(markdown);
  const { sections, otherSections } = parseBodySections(body);
  const rawStatus = data.status || '';
  const status = normalizeStatus(rawStatus);
  const tags = normalizeLegacyTags(data.tags, rawStatus);
  const prefix = data.prefix || String(data.id ?? '').split('-')[0] || '';
  return {
    id: data.id || fileName.replace(/\.md$/i, ''),
    type: data.type || typeFromPrefix(prefix) || 'Task',
    prefix,
    title: data.title || '',
    status,
    priority: data.priority || 'Medium',
    effort: data.effort || 'Unknown',
    tags,
    blocked_by: normalizeItemIdList(data.blocked_by || data.blocks || []),
    created: data.created || '',
    updated: data.updated || '',
    folder: folder === 'items' ? 'active' : folder,
    fileName,
    path: publicItemPath(projectPath, filePath),
    rawBody: body,
    sections,
    otherSections,
    frontMatter: data,
  };
}

export async function readBacklogItems(projectPath = DEFAULT_PROJECT_PATH) {
  const backlogRoot = path.resolve(projectPath, 'backlog');
  const items = [];
  for (const folder of READ_FOLDERS) {
    const folderPath = path.join(backlogRoot, folder);
    let entries;
    try {
      entries = await fs.readdir(folderPath, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue;
      try {
        const item = await readBacklogItemFile(projectPath, folder, entry.name);
        items.push(item);
      } catch {
        // skip malformed files
      }
    }
  }
  // deduplicate by id (prefer first occurrence)
  const seen = new Set();
  const deduped = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  return { items: deduped, itemCount: deduped.length };
}

export async function getNextSequenceNumber(projectPath = DEFAULT_PROJECT_PATH) {
  const backlog = await readBacklogItems(projectPath);
  const numbers = backlog.items.map((item) => extractItemNumber(item.id)).filter((n) => Number.isInteger(n));
  const max = numbers.length ? Math.max(...numbers) : -1;
  if (max >= 9999) throw new Error('No backlog ID numbers remain in the supported 0000-9999 range.');
  return max + 1;
}

// ── Backlog index ──────────────────────────────────────────────────────────

export function generateBacklogIndex(backlog) {
  const lines = [
    '# Project Backlog',
    '',
    'Generated from backlog item files. Do not manually edit.',
    '',
    `Last regenerated: ${todayIsoDate()}`,
    '',
  ];
  const folders = ['active', 'completed', 'archived'];
  const labels = { active: 'Active', completed: 'Completed', archived: 'Archived' };
  for (const folder of folders) {
    const folderItems = backlog.items.filter((item) => item.folder === folder).sort((a, b) => a.id.localeCompare(b.id));
    lines.push(`## ${labels[folder]}`);
    lines.push('');
    if (!folderItems.length) { lines.push('- None.'); lines.push(''); continue; }
    lines.push('| ID | Title | Status | Priority | Effort | Updated | File |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const item of folderItems) {
      lines.push(`| ${item.id} | ${item.title} | ${item.status} | ${item.priority} | ${item.effort} | ${item.updated} | ${item.path} |`);
    }
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

// ── pm-meta ────────────────────────────────────────────────────────────────

async function readPmMeta(projectPath = DEFAULT_PROJECT_PATH) {
  const metaPath = path.join(projectPath, '.pm-meta.json');
  try {
    return JSON.parse(await fs.readFile(metaPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function updatePmMeta(projectPath, date) {
  const metaPath = path.join(projectPath, '.pm-meta.json');
  let meta = {};
  try { meta = JSON.parse(await fs.readFile(metaPath, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  meta.lastIndexRegeneration = date;
  await atomicWriteFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
}

// ── App config ─────────────────────────────────────────────────────────────

function normalizeProjectRecord(project = {}, fallback = {}) {
  const rawPath = String(project.path || project.projectPath || fallback.path || '').trim();
  const resolvedPath = rawPath ? path.resolve(rawPath) : '';
  const label = String(project.label || project.projectLabel || fallback.label || (resolvedPath ? path.basename(resolvedPath) : '') || 'Project').trim();
  return {
    id: String(project.id || fallback.id || projectIdFromPath(resolvedPath || label)).trim(),
    label,
    path: resolvedPath,
    color: normalizeProjectColor(project.color || fallback.color),
    lastUsedAt: project.lastUsedAt || fallback.lastUsedAt || '',
  };
}

function dedupeProjects(projects = []) {
  const byPath = new Map();
  for (const p of projects) {
    const normalized = normalizeProjectRecord(p);
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
    projects.push({ id: cfg.activeProjectId || projectIdFromPath(cfg.projectPath), label: cfg.projectLabel || '', path: cfg.projectPath, color: cfg.projectColor || DEFAULT_PROJECT_COLOR, lastUsedAt: cfg.lastUsedAt || '' });
  }
  if (Array.isArray(cfg.recentProjects)) {
    for (const r of cfg.recentProjects) projects.push({ label: r.label || '', path: r.path || '', color: r.color || DEFAULT_PROJECT_COLOR, lastUsedAt: r.lastUsed || r.lastUsedAt || '' });
  }
  const normalizedProjects = dedupeProjects(projects);
  const activeProject = normalizedProjects.find((p) => p.id === cfg.activeProjectId)
    || normalizedProjects.find((p) => cfg.projectPath && path.resolve(p.path).toLowerCase() === path.resolve(cfg.projectPath).toLowerCase())
    || normalizedProjects[0] || null;
  return {
    activeProjectId: activeProject?.id || '',
    projects: normalizedProjects,
    activeProject,
    projectPath: activeProject?.path || '',
    projectLabel: activeProject?.label || '',
    recentProjects: normalizedProjects.filter((p) => p.id !== activeProject?.id).map((p) => ({ path: p.path, label: p.label, lastUsed: p.lastUsedAt || '' })),
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
  await atomicWriteFile(configPath, `${JSON.stringify({ activeProjectId: updated.activeProjectId, projects: updated.projects }, null, 2)}\n`);
  return updated;
}

export const runtimeConfig = normalizeAppConfig({ ..._startupConfig, projectPath: _startupConfig.projectPath || DEFAULT_PROJECT_PATH });

// ── Backlog item create ────────────────────────────────────────────────────

export function validateCreateBacklogInput(input = {}) {
  const errors = [];
  const type = String(input.type ?? '').trim();
  const derivedPrefix = prefixFromType(type);
  const prefix = derivedPrefix || String(input.prefix ?? '').trim().toUpperCase();
  const title = String(input.title ?? '').trim();
  const summary = String(input.summary ?? '').trim();
  const acceptanceCriteria = normalizeText(input.acceptanceCriteria);
  const priority = String(input.priority ?? 'Medium').trim() || 'Medium';
  const effort = String(input.effort ?? 'Unknown').trim() || 'Unknown';

  if (!type && !input.prefix) errors.push('type is required');
  if (type && !derivedPrefix) errors.push(`type must be one of: ${Object.keys(TYPE_PREFIX_MAP).join(', ')}`);
  if (!APPROVED_PREFIXES.includes(prefix)) errors.push('prefix must be an approved value');
  if (!title) errors.push('title is required');
  if (!summary) errors.push('summary is required');
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
      acceptanceCriteria,
      priority,
      effort,
      implementationNotes: normalizeText(input.implementationNotes),
      notes: normalizeText(input.notes),
      tags: normalizeTokenList(input.tags),
      blocked_by: normalizeItemIdList(input.blocked_by ?? input.blockedBy),
    },
  };
}

export function buildBacklogItemMarkdown(input, { id, date }) {
  const frontMatter = [
    '---',
    yamlLine('id', id),
    yamlLine('type', input.type),
    yamlLine('title', input.title),
    yamlLine('status', 'Inbox'),
    yamlLine('priority', input.priority),
    yamlLine('effort', input.effort),
    yamlLine('tags', input.tags || []),
    yamlLine('blocked_by', input.blocked_by || []),
    yamlLine('created', date),
    yamlLine('updated', date),
    '---',
  ].join('\n');

  return `${frontMatter}\n\n# ${id}: ${input.title}\n`
    + `\n## Summary\n\n${input.summary}\n`
    + `\n## Acceptance Criteria\n\n${criteriaLines(input.acceptanceCriteria)}\n`
    + optionalSection('Implementation Notes', input.implementationNotes)
    + optionalSection('Notes', input.notes);
}

export async function createBacklogItem(input, projectPath = DEFAULT_PROJECT_PATH) {
  const validation = validateCreateBacklogInput(input);
  if (!validation.ok) return { error: validation.errors.join('; '), statusCode: 400 };

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
  const markdown = buildBacklogItemMarkdown(validation.value, { id, date });
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
  return { item: created, id, filePath: created?.path || publicItemPath(projectPath, filePath), backlog: updatedBacklog };
}

// ── Backlog item update ────────────────────────────────────────────────────

function validateEditBacklogInput(input = {}, original = {}) {
  const errors = [];
  const status = String(input.status ?? original.status ?? '').trim();
  const priority = String(input.priority ?? original.priority ?? '').trim();
  const effort = String(input.effort ?? original.effort ?? '').trim();
  const title = String(input.title ?? original.title ?? '').trim();

  if (!title) errors.push('title is required');
  if (!STATUSES.includes(status)) errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  if (!PRIORITIES.includes(priority)) errors.push('priority must be an approved value');
  if (!EFFORTS.includes(effort)) errors.push('effort must be an approved value');

  const value = { title, status, priority, effort };
  if (Object.hasOwn(input, 'tags')) value.tags = normalizeTokenList(input.tags);
  if (Object.hasOwn(input, 'blocked_by')) value.blocked_by = normalizeItemIdList(input.blocked_by);
  if (Object.hasOwn(input, 'blockedBy')) value.blocked_by = normalizeItemIdList(input.blockedBy);
  if (Object.hasOwn(input, 'summary')) value.summary = normalizeText(input.summary);
  if (Object.hasOwn(input, 'acceptanceCriteria')) value.acceptanceCriteria = normalizeText(input.acceptanceCriteria);
  if (Object.hasOwn(input, 'implementationNotes')) value.implementationNotes = normalizeText(input.implementationNotes);
  if (Object.hasOwn(input, 'notes')) value.notes = normalizeText(input.notes);

  return { ok: errors.length === 0, errors, value };
}

function editedSection(input, original, title, inputKey) {
  if (Object.hasOwn(input, inputKey)) return input[inputKey];
  return original.sections?.[title]?.content ?? '';
}

function buildEditedBacklogMarkdown(original, input, date) {
  const fm = { ...original.frontMatter };
  fm.title = input.title;
  fm.status = input.status;
  fm.priority = input.priority;
  fm.effort = input.effort;
  fm.tags = input.tags ?? normalizeTokenList(fm.tags);
  fm.blocked_by = input.blocked_by ?? normalizeItemIdList(fm.blocked_by);
  fm.updated = date;

  const frontMatter = [
    '---',
    yamlLine('id', original.id),
    yamlLine('type', original.type || typeFromPrefix(original.prefix)),
    yamlLine('title', fm.title),
    yamlLine('status', fm.status),
    yamlLine('priority', fm.priority),
    yamlLine('effort', fm.effort),
    yamlLine('tags', fm.tags),
    yamlLine('blocked_by', fm.blocked_by),
    yamlLine('created', fm.created || date),
    yamlLine('updated', fm.updated),
    '---',
  ].join('\n');

  const summary = editedSection(input, original, 'Summary', 'summary');
  const ac = editedSection(input, original, 'Acceptance Criteria', 'acceptanceCriteria');
  const implNotes = editedSection(input, original, 'Implementation Notes', 'implementationNotes');
  const notes = editedSection(input, original, 'Notes', 'notes');

  return `${frontMatter}\n\n# ${original.id}: ${input.title}\n`
    + sectionBlock('Summary', summary)
    + sectionBlock('Acceptance Criteria', ac || '- [ ] Not specified yet.')
    + optionalSection('Implementation Notes', implNotes)
    + optionalSection('Notes', notes);
}

async function replaceOrMoveFile({ oldPath, targetPath, content }) {
  const tempPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  const samePath = oldPath === targetPath;
  await fs.writeFile(tempPath, content, { encoding: 'utf8', flag: 'wx' });
  if (samePath) { await fs.rename(tempPath, targetPath); return; }
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
    if (/Target backlog filename already exists/.test(error.message)) return { error: error.message, statusCode: 409 };
    throw error;
  }

  const updatedBacklog = await readBacklogItems(projectPath);
  const indexPath = path.join(projectPath, 'BACKLOG.md');
  await atomicWriteFile(indexPath, generateBacklogIndex(updatedBacklog));
  await updatePmMeta(projectPath, date);

  const item = updatedBacklog.items.find((c) => c.id === id);
  return {
    id,
    item,
    oldPath: original.path,
    newPath: item?.path || publicItemPath(projectPath, targetPath),
    moved: original.path !== (item?.path || publicItemPath(projectPath, targetPath)),
    backlog: updatedBacklog,
  };
}

export async function deleteBacklogItem(id, projectPath = DEFAULT_PROJECT_PATH) {
  if (!idIsSafe(id)) return { error: 'Invalid backlog item ID.', statusCode: 400 };
  const backlog = await readBacklogItems(projectPath);
  const item = backlog.items.find((i) => i.id === id);
  if (!item) return { error: `Backlog item not found: ${id}`, statusCode: 404 };
  const filePath = path.resolve(projectPath, item.path);
  assertWithin(path.resolve(projectPath, 'backlog'), filePath);
  await fs.unlink(filePath);
  const updatedBacklog = await readBacklogItems(projectPath);
  await atomicWriteFile(path.join(projectPath, 'BACKLOG.md'), generateBacklogIndex(updatedBacklog));
  await updatePmMeta(projectPath, todayIsoDate());
  return { id, deleted: true, backlog: updatedBacklog };
}

// ── Releases ───────────────────────────────────────────────────────────────

function releaseNextId(existing) {
  const nums = existing.map((r) => {
    const m = String(r.id).match(/^REL-(\d{4})$/);
    return m ? Number(m[1]) : null;
  }).filter((n) => n !== null);
  const max = nums.length ? Math.max(...nums) : -1;
  return `REL-${String(max + 1).padStart(4, '0')}`;
}

function buildReleaseMarkdown(release) {
  const fm = [
    '---',
    yamlLine('id', release.id),
    yamlLine('title', release.title),
    yamlLine('status', release.status || 'Draft'),
    yamlLine('created', release.created),
    yamlLine('dispatched', release.dispatched || ''),
    yamlLine('items', release.items || []),
    '---',
  ].join('\n');
  return `${fm}\n\n# Release: ${release.title}\n`;
}

async function readReleaseFiles(projectPath) {
  const releasesPath = path.resolve(projectPath, 'backlog', 'releases');
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
    if (entry.name.includes('-work-package')) continue;
    const filePath = path.join(releasesPath, entry.name);
    const markdown = await fs.readFile(filePath, 'utf8');
    const { data } = parseFrontMatter(markdown);
    const id = data.id || entry.name.replace(/\.md$/i, '');
    const wpPath = path.join(releasesPath, `${id}-work-package.md`);
    const hasWorkPackage = fsSync.existsSync(wpPath);
    releases.push({
      id,
      title: data.title || `Release ${id}`,
      status: data.status || 'Draft',
      created: data.created || '',
      dispatched: data.dispatched || '',
      items: normalizeItemIdList(data.items || []),
      path: publicItemPath(projectPath, filePath),
      fileName: entry.name,
      workPackagePath: hasWorkPackage ? publicItemPath(projectPath, wpPath) : null,
    });
  }
  return releases.sort((a, b) => a.id.localeCompare(b.id));
}

export async function getReleases(projectPath = DEFAULT_PROJECT_PATH) {
  const releases = await readReleaseFiles(projectPath);
  const backlog = await readBacklogItems(projectPath);
  const itemById = new Map(backlog.items.map((item) => [item.id, item]));
  return releases.map((release) => ({
    ...release,
    itemDetails: release.items.map((id) => {
      const item = itemById.get(id);
      return item ? { id, title: item.title, status: item.status, priority: item.priority, effort: item.effort } : { id, title: '(missing)', status: 'Missing', priority: '', effort: '' };
    }),
  }));
}

export async function createRelease(input = {}, projectPath = DEFAULT_PROJECT_PATH) {
  const title = String(input.title ?? '').trim();
  if (!title) return { error: 'title is required', statusCode: 400 };
  const itemIds = normalizeItemIdList(input.items || []);
  const releasesPath = path.resolve(projectPath, 'backlog', 'releases');
  await fs.mkdir(releasesPath, { recursive: true });
  const existing = await readReleaseFiles(projectPath);
  const id = releaseNextId(existing);
  const date = todayIsoDate();
  const release = { id, title, status: 'Draft', created: date, dispatched: '', items: itemIds };
  const filePath = path.resolve(releasesPath, `${id}.md`);
  assertWithin(releasesPath, filePath);
  await fs.writeFile(filePath, buildReleaseMarkdown(release), { encoding: 'utf8', flag: 'wx' });
  return { release, path: publicItemPath(projectPath, filePath) };
}

export async function updateRelease(id, input = {}, projectPath = DEFAULT_PROJECT_PATH) {
  const releaseId = String(id ?? '').trim();
  if (!releaseIdIsSafe(releaseId)) return { error: 'Invalid release ID.', statusCode: 400 };
  const releasesPath = path.resolve(projectPath, 'backlog', 'releases');
  const filePath = path.resolve(releasesPath, `${releaseId}.md`);
  assertWithin(releasesPath, filePath);
  let existing;
  try {
    const markdown = await fs.readFile(filePath, 'utf8');
    const { data } = parseFrontMatter(markdown);
    existing = { id: releaseId, title: data.title || `Release ${releaseId}`, status: data.status || 'Draft', created: data.created || todayIsoDate(), dispatched: data.dispatched || '', items: normalizeItemIdList(data.items || []) };
  } catch (error) {
    if (error.code === 'ENOENT') return { error: `Release not found: ${releaseId}`, statusCode: 404 };
    throw error;
  }
  const updated = {
    ...existing,
    title: input.title ?? existing.title,
    status: input.status ?? existing.status,
    items: Object.hasOwn(input, 'items') ? normalizeItemIdList(input.items) : existing.items,
  };
  await atomicWriteFile(filePath, buildReleaseMarkdown(updated));
  return { release: updated, path: publicItemPath(projectPath, filePath) };
}

export async function deleteRelease(id, projectPath = DEFAULT_PROJECT_PATH) {
  const releaseId = String(id ?? '').trim();
  if (!releaseIdIsSafe(releaseId)) return { error: 'Invalid release ID.', statusCode: 400 };
  const releasesPath = path.resolve(projectPath, 'backlog', 'releases');
  const filePath = path.resolve(releasesPath, `${releaseId}.md`);
  assertWithin(releasesPath, filePath);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') return { error: `Release not found: ${releaseId}`, statusCode: 404 };
    throw error;
  }
  return { id: releaseId, deleted: true };
}

function generateWorkPackage(release, items) {
  const date = todayIsoDate();
  const header = `# Release: ${release.title}
# Dispatched: ${date}

## Instructions for Claude Code

Work through each item below in order. For each item:
1. Read the Acceptance Criteria carefully before writing any code.
2. Implement until all criteria are met.
3. After completing ALL items, update each item's \`status\` field in its frontmatter to \`Review\`.

Do not commit or push changes — the project owner will handle version control.

---
`;
  const sections = items.map((item, index) => {
    const { sections } = parseBodySections(item.rawBody || '');
    const summary = sections['Summary']?.content || '';
    const ac = sections['Acceptance Criteria']?.content || '';
    const implNotes = sections['Implementation Notes']?.content || '';
    let block = `## Item ${index + 1} of ${items.length}: ${item.id} — ${item.title}\n\n`;
    block += `**Type:** ${item.type} | **Priority:** ${item.priority} | **Effort:** ${item.effort}\n\n`;
    if (summary) block += `### Summary\n\n${summary}\n\n`;
    if (ac) block += `### Acceptance Criteria\n\n${ac}\n\n`;
    if (implNotes) block += `### Implementation Notes\n\n${implNotes}\n\n`;
    return block.trimEnd();
  });
  return `${header}\n${sections.join('\n\n---\n\n')}\n`;
}

export async function dispatchRelease(id, projectPath = DEFAULT_PROJECT_PATH) {
  const releaseId = String(id ?? '').trim();
  if (!releaseIdIsSafe(releaseId)) return { error: 'Invalid release ID.', statusCode: 400 };
  const releasesPath = path.resolve(projectPath, 'backlog', 'releases');
  const filePath = path.resolve(releasesPath, `${releaseId}.md`);
  assertWithin(releasesPath, filePath);

  let release;
  try {
    const markdown = await fs.readFile(filePath, 'utf8');
    const { data } = parseFrontMatter(markdown);
    release = { id: releaseId, title: data.title || `Release ${releaseId}`, status: data.status || 'Draft', created: data.created || todayIsoDate(), dispatched: data.dispatched || '', items: normalizeItemIdList(data.items || []) };
  } catch (error) {
    if (error.code === 'ENOENT') return { error: `Release not found: ${releaseId}`, statusCode: 404 };
    throw error;
  }

  if (!release.items.length) return { error: 'Release has no items to dispatch.', statusCode: 400 };

  const backlog = await readBacklogItems(projectPath);
  const itemsToDispatch = release.items.map((itemId) => backlog.items.find((i) => i.id === itemId)).filter(Boolean);
  const missing = release.items.filter((itemId) => !backlog.items.find((i) => i.id === itemId));

  const workPackage = generateWorkPackage(release, itemsToDispatch);

  // Save work package file
  const packageFileName = `${releaseId}-work-package.md`;
  const packagePath = path.resolve(releasesPath, packageFileName);
  assertWithin(releasesPath, packagePath);
  await atomicWriteFile(packagePath, workPackage);

  // Mark items In Progress
  const date = todayIsoDate();
  for (const item of itemsToDispatch) {
    if (['Inbox', 'Ready'].includes(item.status)) {
      await updateBacklogItem(item.id, { title: item.title, status: 'In Progress', priority: item.priority, effort: item.effort, tags: item.tags, blocked_by: item.blocked_by }, projectPath);
    }
  }

  // Update release status
  const dispatched = { ...release, status: 'Dispatched', dispatched: date };
  await atomicWriteFile(filePath, buildReleaseMarkdown(dispatched));

  return {
    release: dispatched,
    workPackage,
    packagePath: publicItemPath(projectPath, packagePath),
    dispatchedCount: itemsToDispatch.length,
    missingItems: missing,
  };
}

// ── Project config management ──────────────────────────────────────────────

async function hasBacklogFolder(projectPath) {
  try {
    const stat = await fs.stat(path.join(projectPath, 'backlog'));
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function resolveProjectDataPath(inputPath) {
  const requested = path.resolve(String(inputPath ?? '').trim());
  const candidates = [
    { path: requested, inferred: false },
    { path: path.join(requested, 'project'), inferred: true },
    { path: path.join(requested, 'docs', 'project'), inferred: true },
  ];
  for (const candidate of candidates) {
    if (await hasBacklogFolder(candidate.path)) return { requested, resolved: candidate.path, inferred: candidate.inferred };
  }
  return { requested, resolved: requested, inferred: false };
}

export async function addProjectToConfig(input = {}, configPath = APP_CONFIG_PATH) {
  const current = await readAppConfig(configPath);
  const { resolved } = await resolveProjectDataPath(input.path);
  const project = normalizeProjectRecord({ label: input.label, path: resolved, color: input.color, lastUsedAt: currentIsoTimestamp() });
  const projects = dedupeProjects([...current.projects.filter((p) => path.resolve(p.path).toLowerCase() !== project.path.toLowerCase()), project]);
  const updated = normalizeAppConfig({ activeProjectId: current.activeProjectId || project.id, projects });
  await atomicWriteFile(configPath, `${JSON.stringify({ activeProjectId: updated.activeProjectId, projects: updated.projects }, null, 2)}\n`);
  return { config: updated, project };
}

export async function updateProjectInConfig(id, input = {}, configPath = APP_CONFIG_PATH) {
  const current = await readAppConfig(configPath);
  const existing = current.projects.find((p) => p.id === id);
  if (!existing) return { error: `Project not found: ${id}`, statusCode: 404 };
  const updatedProject = normalizeProjectRecord({ ...existing, label: input.label ?? existing.label, color: input.color ?? existing.color }, existing);
  const projects = current.projects.map((p) => (p.id === id ? updatedProject : p));
  const updated = normalizeAppConfig({ activeProjectId: current.activeProjectId, projects });
  await atomicWriteFile(configPath, `${JSON.stringify({ activeProjectId: updated.activeProjectId, projects: updated.projects }, null, 2)}\n`);
  return { config: updated, project: updatedProject };
}

export async function removeProjectFromConfig(id, configPath = APP_CONFIG_PATH) {
  const current = await readAppConfig(configPath);
  const project = current.projects.find((p) => p.id === id);
  if (!project) return { error: `Project not found: ${id}`, statusCode: 404 };
  const projects = current.projects.filter((p) => p.id !== id);
  const updated = normalizeAppConfig({ activeProjectId: current.activeProjectId === id ? projects[0]?.id || '' : current.activeProjectId, projects });
  await atomicWriteFile(configPath, `${JSON.stringify({ activeProjectId: updated.activeProjectId, projects: updated.projects }, null, 2)}\n`);
  return { config: updated, removedProject: project };
}

export async function setActiveProjectInConfig(id, configPath = APP_CONFIG_PATH) {
  const current = await readAppConfig(configPath);
  const project = current.projects.find((p) => p.id === id);
  if (!project) return { error: `Project not found: ${id}`, statusCode: 404 };
  const projects = current.projects.map((p) => (p.id === id ? { ...p, lastUsedAt: currentIsoTimestamp() } : p));
  const updated = normalizeAppConfig({ activeProjectId: id, projects });
  await atomicWriteFile(configPath, `${JSON.stringify({ activeProjectId: updated.activeProjectId, projects: updated.projects }, null, 2)}\n`);
  return { config: updated, activeProject: updated.activeProject };
}

// ── Inline validation ──────────────────────────────────────────────────────

export async function validateBacklog(projectPath = DEFAULT_PROJECT_PATH) {
  const backlog = await readBacklogItems(projectPath);
  const findings = [];
  const ids = new Map();

  for (const item of backlog.items) {
    if (!ids.has(item.id)) ids.set(item.id, []);
    ids.get(item.id).push(item);
  }

  for (const [id, matches] of ids.entries()) {
    if (id && matches.length > 1) {
      for (const item of matches) {
        findings.push({ severity: 'Error', id, path: item.path, message: `Duplicate backlog ID ${id}.` });
      }
    }
  }

  for (const item of backlog.items) {
    if (!item.id) findings.push({ severity: 'Error', id: '', path: item.path, message: 'Missing id field.' });
    if (!item.title) findings.push({ severity: 'Error', id: item.id, path: item.path, message: 'Missing title field.' });
    if (!STATUSES.includes(item.status)) findings.push({ severity: 'Error', id: item.id, path: item.path, message: `Invalid status: ${item.status}` });
    if (!PRIORITIES.includes(item.priority)) findings.push({ severity: 'Warning', id: item.id, path: item.path, message: `Invalid priority: ${item.priority}` });
    if (!item.sections?.Summary?.content) findings.push({ severity: 'Warning', id: item.id, path: item.path, message: 'Missing Summary section.' });
    if (!item.sections?.['Acceptance Criteria']?.content) findings.push({ severity: 'Warning', id: item.id, path: item.path, message: 'Missing Acceptance Criteria section.' });
  }

  return { validatedAt: currentIsoTimestamp(), itemCount: backlog.itemCount, findings };
}

// ── HTTP server ────────────────────────────────────────────────────────────

let _projectPath = runtimeConfig.projectPath || DEFAULT_PROJECT_PATH;

function getProjectPath() {
  return _projectPath;
}

function setProjectPath(p) {
  _projectPath = p;
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

async function serveStaticFile(res, filePath) {
  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') { res.writeHead(404); res.end('Not found'); } else throw error;
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost`);
  const pathname = url.pathname;
  const method = req.method;

  try {
    // ── Static files ─────────────────────────────────────────────────────
    if (!pathname.startsWith('/api/')) {
      const filePath = pathname === '/' || pathname === '/index.html'
        ? path.join(APP_ROOT, 'index.html')
        : path.join(APP_ROOT, pathname.slice(1));
      await serveStaticFile(res, filePath);
      return;
    }

    // ── Config ────────────────────────────────────────────────────────────
    if (pathname === '/api/config' && method === 'GET') {
      const config = await readAppConfig();
      sendJson(res, 200, { ...config, constants: { statuses: STATUSES, priorities: PRIORITIES, efforts: EFFORTS, types: Object.keys(TYPE_PREFIX_MAP) } });
      return;
    }

    if (pathname === '/api/config/active-project' && method === 'PUT') {
      const body = await readJsonBody(req);
      const result = await setActiveProjectInConfig(body.id);
      if (result.error) { sendError(res, result.statusCode || 400, result.error); return; }
      setProjectPath(result.activeProject?.path || getProjectPath());
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/config' && method === 'PUT') {
      const body = await readJsonBody(req);
      const updated = await writeAppConfig(body);
      sendJson(res, 200, updated);
      return;
    }

    // ── Projects ──────────────────────────────────────────────────────────
    if (pathname === '/api/projects' && method === 'POST') {
      const body = await readJsonBody(req);
      const result = await addProjectToConfig(body);
      if (result.error) { sendError(res, result.statusCode || 400, result.error); return; }
      sendJson(res, 201, result);
      return;
    }

    const projectIdMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (projectIdMatch) {
      const projectId = decodeURIComponent(projectIdMatch[1]);
      if (method === 'PUT') {
        const body = await readJsonBody(req);
        const result = await updateProjectInConfig(projectId, body);
        if (result.error) { sendError(res, result.statusCode || 400, result.error); return; }
        sendJson(res, 200, result);
        return;
      }
      if (method === 'DELETE') {
        const result = await removeProjectFromConfig(projectId);
        if (result.error) { sendError(res, result.statusCode || 404, result.error); return; }
        sendJson(res, 200, result);
        return;
      }
    }

    // ── Backlog ────────────────────────────────────────────────────────────
    if (pathname === '/api/backlog' && method === 'GET') {
      const projectPath = getProjectPath();
      const backlog = await readBacklogItems(projectPath);
      sendJson(res, 200, backlog);
      return;
    }

    if (pathname === '/api/backlog/items' && method === 'POST') {
      const body = await readJsonBody(req);
      const result = await createBacklogItem(body, getProjectPath());
      if (result.error) { sendError(res, result.statusCode || 400, result.error); return; }
      sendJson(res, 201, result);
      return;
    }

    if (pathname === '/api/backlog/validate' && method === 'GET') {
      const result = await validateBacklog(getProjectPath());
      sendJson(res, 200, result);
      return;
    }

    const itemIdMatch = pathname.match(/^\/api\/backlog\/items\/([^/]+)$/);
    if (itemIdMatch) {
      const itemId = decodeURIComponent(itemIdMatch[1]);
      if (method === 'PUT') {
        const body = await readJsonBody(req);
        const result = await updateBacklogItem(itemId, body, getProjectPath());
        if (result.error) { sendError(res, result.statusCode || 400, result.error); return; }
        sendJson(res, 200, result);
        return;
      }
      if (method === 'DELETE') {
        const result = await deleteBacklogItem(itemId, getProjectPath());
        if (result.error) { sendError(res, result.statusCode || 404, result.error); return; }
        sendJson(res, 200, result);
        return;
      }
    }

    // ── Releases ──────────────────────────────────────────────────────────
    if (pathname === '/api/releases' && method === 'GET') {
      const releases = await getReleases(getProjectPath());
      sendJson(res, 200, { releases });
      return;
    }

    if (pathname === '/api/releases' && method === 'POST') {
      const body = await readJsonBody(req);
      const result = await createRelease(body, getProjectPath());
      if (result.error) { sendError(res, result.statusCode || 400, result.error); return; }
      sendJson(res, 201, result);
      return;
    }

    const releaseIdMatch = pathname.match(/^\/api\/releases\/([^/]+)$/);
    if (releaseIdMatch) {
      const releaseId = decodeURIComponent(releaseIdMatch[1]);
      if (method === 'PUT') {
        const body = await readJsonBody(req);
        const result = await updateRelease(releaseId, body, getProjectPath());
        if (result.error) { sendError(res, result.statusCode || 400, result.error); return; }
        sendJson(res, 200, result);
        return;
      }
      if (method === 'DELETE') {
        const result = await deleteRelease(releaseId, getProjectPath());
        if (result.error) { sendError(res, result.statusCode || 404, result.error); return; }
        sendJson(res, 200, result);
        return;
      }
    }

    const workPackageMatch = pathname.match(/^\/api\/releases\/([^/]+)\/work-package$/);
    if (workPackageMatch && method === 'GET') {
      const releaseId = decodeURIComponent(workPackageMatch[1]);
      if (!releaseIdIsSafe(releaseId)) { sendError(res, 400, 'Invalid release ID.'); return; }
      const releasesPath = path.resolve(getProjectPath(), 'backlog', 'releases');
      const packagePath = path.resolve(releasesPath, `${releaseId}-work-package.md`);
      assertWithin(releasesPath, packagePath);
      try {
        const content = await fs.readFile(packagePath, 'utf8');
        sendJson(res, 200, { content });
      } catch (e) {
        if (e.code === 'ENOENT') { sendError(res, 404, 'Work package not found.'); return; }
        throw e;
      }
      return;
    }

    const dispatchMatch = pathname.match(/^\/api\/releases\/([^/]+)\/dispatch$/);
    if (dispatchMatch && method === 'POST') {
      const releaseId = decodeURIComponent(dispatchMatch[1]);
      const result = await dispatchRelease(releaseId, getProjectPath());
      if (result.error) { sendError(res, result.statusCode || 400, result.error); return; }
      sendJson(res, 200, result);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  } catch (err) {
    console.error('Server error:', err);
    sendError(res, 500, 'Internal server error');
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);
// Only listen when run directly (not when imported by tests)
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  server.listen(PORT, () => {
    console.log(`PM Tools server running at http://localhost:${PORT}`);
    console.log(`Project path: ${getProjectPath()}`);
  });
}

export default server;
