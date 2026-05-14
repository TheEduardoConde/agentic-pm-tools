const KNOWN_SECTION_ORDER = [
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
const TYPE_PREFIX_MAP = {
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
const TYPE_OPTIONS = Object.keys(TYPE_PREFIX_MAP);
const PREFIX_TYPE_MAP = Object.fromEntries(Object.entries(TYPE_PREFIX_MAP).map(([type, prefix]) => [prefix, type]));
const STATUS_GROUPS = {
  Intake: ['Backlog', 'Ready'],
  Build: ['In Progress'],
  Validation: ['Needs Validation'],
  Release: ['Ready to Release', 'Done'],
  Paused: ['Blocked', 'Deferred', 'Archived'],
};
const STATUS_OPTIONS = ['Backlog', 'Ready', 'In Progress', 'Needs Validation', 'Ready to Release', 'Done', 'Blocked', 'Deferred', 'Archived'];
const NON_INACTIVE_STATUS_FILTER = '__non_inactive__';
const INACTIVE_STATUSES = new Set(['Done', 'Deferred', 'Archived']);
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low', 'Someday', 'Parking Lot'];
const EFFORT_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'Unknown'];
const FORM_FIELDS = [
  ['userStory', 'User Story', 'User Story', 3],
  ['summary', 'Summary', 'Summary', 3],
  ['problemNeed', 'Problem / Need', 'Problem / Need', 3],
  ['expectedOutcome', 'Expected Outcome', 'Expected Outcome', 3],
  ['functionalRequirements', 'Functional Requirements', 'Functional Requirements', 4],
  ['technicalRequirements', 'Technical Requirements', 'Technical Requirements', 4],
  ['acceptanceCriteria', 'Acceptance Criteria', 'Acceptance Criteria', 5],
  ['edgeCases', 'Edge Cases', 'Edge Cases', 3],
  ['implementationNotes', 'Implementation Notes', 'Implementation Notes', 4],
  ['testingNotes', 'Testing Notes', 'Testing Notes', 4],
  ['humanTestingPlan', 'Human Testing Plan', 'Human Testing Plan', 4],
  ['ownerReviewNeeded', 'Owner Review Needed', 'Owner Review Needed', 3],
  ['links', 'Links', 'Links', 3],
];

const state = {
  items: [],
  releases: [],
  selectedId: '',
  selectedIds: new Set(),
  selectedReleaseId: '',
  modalMode: '',
  modalItemId: '',
  currentView: 'backlog',
  projectPath: '',
  lastValidation: '',
  lastPrompt: { type: '', source: '', timestamp: '' },
  filters: { search: '', fullText: false, type: '', status: NON_INACTIVE_STATUS_FILTER, priority: '', effort: '', release: '', tag: '', folder: '', sort: 'updated', sortDir: 'desc' },
  config: { activeProjectId: '', activeProject: null, projects: [], projectPath: '', projectLabel: '', recentProjects: [] },
  savedViews: [],
  fullTextResults: [],
  focusedRowId: '',
  editingProjectId: '',
  projectFormMode: '',
  projectForm: { label: '', path: '', color: '#253858' },
  projectAnalysis: null,
  controlManager: { status: null, recommendations: null, approvalPackage: null, message: '' },
};

const PROJECT_COLORS = [
  { label: 'Navy', value: '#253858' },
  { label: 'Blue', value: '#1d4ed8' },
  { label: 'Teal', value: '#0f766e' },
  { label: 'Green', value: '#166534' },
  { label: 'Mustard', value: '#8a6f00' },
  { label: 'Orange', value: '#c2410c' },
  { label: 'Red', value: '#b91c1c' },
  { label: 'Purple', value: '#6d28d9' },
  { label: 'Slate', value: '#334155' },
  { label: 'Charcoal', value: '#27272a' },
];

const els = {
  refreshBtn: document.getElementById('refreshBtn'),
  addItemBtn: document.getElementById('addItemBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  itemCount: document.getElementById('itemCount'),
  activeCount: document.getElementById('activeCount'),
  needsValCount: document.getElementById('needsValCount'),
  deferredBacklogCount: document.getElementById('deferredBacklogCount'),
  bugCount: document.getElementById('bugCount'),
  featCount: document.getElementById('featCount'),
  enhCount: document.getElementById('enhCount'),
  uxCount: document.getElementById('uxCount'),
  loadedAt: document.getElementById('loadedAt'),
  prioritySummary: document.getElementById('prioritySummary'),
  statusSummary: document.getElementById('statusSummary'),
  typeSummary: document.getElementById('typeSummary'),
  releaseSummary: document.getElementById('releaseSummary'),
  needsAttention: document.getElementById('needsAttention'),
  readyForTesting: document.getElementById('readyForTesting'),
  readyToDeploy: document.getElementById('readyToDeploy'),

  recentActivity: document.getElementById('recentActivity'),
  statusBoard: document.getElementById('statusBoard'),
  visibleCount: document.getElementById('visibleCount'),
  rows: document.getElementById('backlogRows'),
  error: document.getElementById('error'),
  searchFilter: document.getElementById('searchFilter'),
  typeFilter: document.getElementById('typeFilter'),
  statusFilter: document.getElementById('statusFilter'),
  priorityFilter: document.getElementById('priorityFilter'),
  effortFilter: document.getElementById('effortFilter'),
  releaseFilter: document.getElementById('releaseFilter'),
  tagFilter: document.getElementById('tagFilter'),
  folderFilter: document.getElementById('folderFilter'),
  sortSelect: document.getElementById('sortSelect'),
  fullTextSearchToggle: document.getElementById('fullTextSearchToggle'),
  fullTextResults: document.getElementById('fullTextResults'),
  saveViewBtn: document.getElementById('saveViewBtn'),
  savedViewSelect: document.getElementById('savedViewSelect'),
  renameViewBtn: document.getElementById('renameViewBtn'),
  deleteViewBtn: document.getElementById('deleteViewBtn'),
  selectionCount: document.getElementById('selectionCount'),
  bulkReleaseInput: document.getElementById('bulkReleaseInput'),
  bulkReleaseBtn: document.getElementById('bulkReleaseBtn'),
  bulkPrioritySelect: document.getElementById('bulkPrioritySelect'),
  bulkPriorityBtn: document.getElementById('bulkPriorityBtn'),
  bulkStatusSelect: document.getElementById('bulkStatusSelect'),
  bulkStatusBtn: document.getElementById('bulkStatusBtn'),
  goReleasesBtn: document.getElementById('goReleasesBtn'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  sprintBoard: document.getElementById('sprintBoard'),
  sprintCapacityInput: document.getElementById('sprintCapacityInput'),
  roadmapBoard: document.getElementById('roadmapBoard'),
  validateBtn: document.getElementById('validateBtn'),
  validationReminder: document.getElementById('validationReminder'),
  lastValidation: document.getElementById('lastValidation'),
  validationResults: document.getElementById('validationResults'),
  releaseInput: document.getElementById('releaseInput'),
  releaseSearch: document.getElementById('releaseSearch'),
  newReleaseInput: document.getElementById('newReleaseInput'),
  assignReleaseBtn: document.getElementById('assignReleaseBtn'),
  createReleaseBtn: document.getElementById('createReleaseBtn'),
  releaseMessage: document.getElementById('releaseMessage'),
  releaseList: document.getElementById('releaseList'),
  releaseDetail: document.getElementById('releaseDetail'),
  refreshReleasesBtn: document.getElementById('refreshReleasesBtn'),
  promptType: document.getElementById('promptType'),
  promptItemSelect: document.getElementById('promptItemSelect'),
  promptReleaseSelect: document.getElementById('promptReleaseSelect'),
  generatePromptBtn: document.getElementById('generatePromptBtn'),
  savePromptBtn: document.getElementById('savePromptBtn'),
  promptOutput: document.getElementById('promptOutput'),
  promptMeta: document.getElementById('promptMeta'),
  copyPromptBtn: document.getElementById('copyPromptBtn'),
  itemModal: document.getElementById('itemModal'),
  settingsPaths: document.getElementById('settingsPaths'),
  controlManager: document.getElementById('controlManager'),
  refreshControlManagerBtn: document.getElementById('refreshControlManagerBtn'),
  viewTitle: document.getElementById('viewTitle'),
  activeProjectSelect: document.getElementById('activeProjectSelect'),
  activeProjectButton: document.getElementById('activeProjectButton'),
  activeProjectSwatch: document.getElementById('activeProjectSwatch'),
  activeProjectLabel: document.getElementById('activeProjectLabel'),
  activeProjectMenu: document.getElementById('activeProjectMenu'),
};

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function populateFilter(select, values, currentValue, defaultLabel) {
  select.innerHTML = [`<option value="">${escapeHtml(defaultLabel)}</option>`, ...values.map((value) => `<option value="${escapeHtml(value)}"${value === currentValue ? ' selected' : ''}>${escapeHtml(value)}</option>`)].join('');
}

function populateStatusFilter(select, values, currentValue) {
  const options = [
    `<option value="${NON_INACTIVE_STATUS_FILTER}"${currentValue === NON_INACTIVE_STATUS_FILTER ? ' selected' : ''}>Non-inactive statuses</option>`,
    `<option value=""${currentValue === '' ? ' selected' : ''}>All statuses</option>`,
    ...values.map((value) => `<option value="${escapeHtml(value)}"${value === currentValue ? ' selected' : ''}>${escapeHtml(value)}</option>`),
  ];
  select.innerHTML = options.join('');
}

function optionList(values, selected) {
  return values.map((value) => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('');
}

function typeFromPrefix(prefix) {
  return PREFIX_TYPE_MAP[String(prefix ?? '').trim().toUpperCase()] || 'Unknown';
}

function itemType(item) {
  return item?.type || typeFromPrefix(item?.prefix);
}

function prefixFromType(type) {
  return TYPE_PREFIX_MAP[String(type ?? '').trim()] || '';
}

function sectionValue(item, title) {
  return item?.sections?.[title]?.content ?? '';
}

function listValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value ?? '').split(/[\n,]+/).map((entry) => entry.trim()).filter(Boolean);
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function badgeKey(value) {
  return String(value || '').toLowerCase().replace(/[\s/]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function badge(value, type) {
  const key = badgeKey(value);
  return `<span class="badge badge-${type}${key ? ` bv-${key}` : ''}">${escapeHtml(value || '-')}</span>`;
}

function tagBadges(tags = []) {
  const list = listValue(tags);
  return list.length ? list.map((tag) => `<span class="tag-badge">${escapeHtml(tag)}</span>`).join('') : '<span class="muted-inline">None</span>';
}

function matchesSearch(item, query) {
  if (!query) return true;
  const fields = [item.id, item.title, item.status, item.priority, item.effort, item.release, item.updated, item.folder, item.fileName];
  if (state.filters.fullText) fields.push(item.rawBody);
  return fields.join(' ').toLowerCase().includes(query.toLowerCase());
}

function filteredItems() {
  const items = state.items.filter((item) => matchesSearch(item, state.filters.search)
    && (!state.filters.type || itemType(item) === state.filters.type)
    && (!state.filters.status
      || (state.filters.status === NON_INACTIVE_STATUS_FILTER && !INACTIVE_STATUSES.has(item.status))
      || item.status === state.filters.status)
    && (!state.filters.priority || item.priority === state.filters.priority)
    && (!state.filters.effort || item.effort === state.filters.effort)
    && (!state.filters.release || item.release === state.filters.release)
    && (!state.filters.tag || listValue(item.tags).includes(state.filters.tag))
    && (!state.filters.folder || item.folder === state.filters.folder));
  const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3, Someday: 4, 'Parking Lot': 5 };
  const dir = state.filters.sortDir === 'asc' ? 1 : -1;
  return items.sort((a, b) => {
    let cmp = 0;
    switch (state.filters.sort) {
      case 'id':       cmp = (a.id || '').localeCompare(b.id || ''); break;
      case 'type':     cmp = (itemType(a) || '').localeCompare(itemType(b) || ''); break;
      case 'title':    cmp = (a.title || '').localeCompare(b.title || ''); break;
      case 'status':   cmp = (a.status || '').localeCompare(b.status || ''); break;
      case 'priority': cmp = (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9); break;
      case 'effort':   cmp = (a.effort || '').localeCompare(b.effort || ''); break;
      case 'release':  cmp = (a.release || '').localeCompare(b.release || ''); break;
      case 'folder':   cmp = (a.folder || '').localeCompare(b.folder || ''); break;
      default:         cmp = (a.updated || '').localeCompare(b.updated || ''); break;
    }
    return (cmp || (a.id || '').localeCompare(b.id || '')) * dir;
  });
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || 'Blank';
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function countByType(items) {
  return items.reduce((acc, item) => {
    const type = itemType(item);
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});
}

function renderPills(target, counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  target.innerHTML = entries.length ? entries.map(([label, count]) => `<span class="summary-pill">${escapeHtml(label)} <strong>${count}</strong></span>`).join('') : '<span class="muted">None</span>';
}

function renderGroupedStatusPills(target, counts) {
  target.innerHTML = Object.entries(STATUS_GROUPS).map(([group, statuses]) => {
    const pills = statuses
      .filter((status) => counts[status])
      .map((status) => `<span class="summary-pill">${escapeHtml(status)} <strong>${counts[status]}</strong></span>`)
      .join('');
    return `<div class="pill-group"><strong>${escapeHtml(group)}</strong>${pills || '<span class="muted-inline">0</span>'}</div>`;
  }).join('');
}

function formatValidationTimestamp(value) {
  if (!value) return 'Never';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value} (legacy date-only)`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const formatted = parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });
  return formatted.replace(',', '');
}

function attentionItem(item) {
  return `<button type="button" class="attention-item" data-open-item="${escapeHtml(item.id)}"><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(item.title)}</span><em>${escapeHtml(item.status)}</em></button>`;
}

function renderAttentionPanels() {
  const DONE_STATUSES = new Set(['Done', 'Archived', 'Deferred']);
  const attention = state.items.filter((item) =>
    !DONE_STATUSES.has(item.status) && (
      item.status === 'Blocked' ||
      item.release === 'Unassigned'
    )
  ).slice(0, 8);
  els.needsAttention.innerHTML = attention.length ? attention.map(attentionItem).join('') : '<p class="muted">No priority attention items.</p>';
  const needsValidation = state.items.filter((item) => item.status === 'Needs Validation');
  els.readyForTesting.innerHTML = needsValidation.length ? needsValidation.map(attentionItem).join('') : '<p class="muted">No items need validation.</p>';
  const readyRelease = state.items.filter((item) => item.status === 'Ready to Release');
  els.readyToDeploy.innerHTML = readyRelease.length ? readyRelease.map(attentionItem).join('') : '<p class="muted">No items ready to release.</p>';

  const recent = [...state.items].sort((a, b) => (b.updated || '').localeCompare(a.updated || '')).slice(0, 8);
  els.recentActivity.innerHTML = recent.length ? recent.map(attentionItem).join('') : '<p class="muted">No recent items.</p>';
}

function activeProject() {
  return state.config.activeProject || state.config.projects.find((project) => project.id === state.config.activeProjectId) || null;
}

function applyProjectTheme() {
  const project = activeProject();
  const color = project?.color || '#253858';
  const textColor = highContrastTextColor(color);
  document.documentElement.style.setProperty('--project-nav-bg', color);
  document.documentElement.style.setProperty('--project-nav-text', textColor);
  document.documentElement.style.setProperty('--project-nav-text-muted', textColor === '#111827' ? '#243041' : '#f8fafc');
  document.documentElement.style.setProperty('--project-nav-active-bg', textColor === '#111827' ? 'rgba(255, 255, 255, 0.48)' : 'rgba(255, 255, 255, 0.16)');
  document.documentElement.style.setProperty('--project-nav-hover-bg', textColor === '#111827' ? 'rgba(255, 255, 255, 0.34)' : 'rgba(255, 255, 255, 0.1)');
}

function highContrastTextColor(hexColor) {
  const match = String(hexColor || '').match(/^#?([0-9a-f]{6})$/i);
  if (!match) return '#f8fafc';
  const value = match[1];
  const channel = (index) => {
    const raw = parseInt(value.slice(index, index + 2), 16) / 255;
    return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.46 ? '#111827' : '#f8fafc';
}

function currentTheme() {
  return localStorage.getItem('pmToolsTheme') || 'light';
}

function applyTheme(theme = currentTheme()) {
  document.documentElement.dataset.theme = theme;
  if (els.themeToggleBtn) els.themeToggleBtn.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

function saveTheme(theme) {
  localStorage.setItem('pmToolsTheme', theme);
  applyTheme(theme);
}

function normalizeConfig(data = {}) {
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const active = data.activeProject || projects.find((project) => project.id === data.activeProjectId) || null;
  return {
    activeProjectId: data.activeProjectId || active?.id || '',
    activeProject: active,
    projects,
    projectPath: data.projectPath ?? active?.path ?? '',
    projectLabel: data.projectLabel ?? active?.label ?? '',
    recentProjects: Array.isArray(data.recentProjects) ? data.recentProjects : [],
  };
}

function renderSavedViews() {
  if (!els.savedViewSelect) return;
  els.savedViewSelect.innerHTML = [
    '<option value="">Saved views...</option>',
    ...state.savedViews.map((view) => `<option value="${escapeHtml(view.id)}">${escapeHtml(view.name)}</option>`),
  ].join('');
}

async function loadSavedViews() {
  try {
    const response = await fetch('/api/saved-views', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || `Saved view load failed with ${response.status}`);
    state.savedViews = data.savedViews || [];
    renderSavedViews();
  } catch (error) {
    showError(error.message || 'Failed to load saved views.');
  }
}

async function persistSavedViews() {
  const response = await fetch('/api/saved-views', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ savedViews: state.savedViews }),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || `Saved view save failed with ${response.status}`);
  state.savedViews = data.savedViews || [];
  renderSavedViews();
}

function renderProjectSelector() {
  const projects = state.config.projects || [];
  const active = activeProject();
  if (els.activeProjectSelect) {
    els.activeProjectSelect.innerHTML = projects.length
      ? projects.map((project) => `<option value="${escapeHtml(project.id)}"${project.id === state.config.activeProjectId ? ' selected' : ''}>${escapeHtml(project.label || project.path)}</option>`).join('')
      : '<option value="">No projects</option>';
    els.activeProjectSelect.disabled = projects.length === 0;
  }
  if (els.activeProjectButton) els.activeProjectButton.disabled = projects.length === 0;
  if (els.activeProjectSwatch) els.activeProjectSwatch.style.background = active?.color || '#253858';
  if (els.activeProjectLabel) els.activeProjectLabel.textContent = active?.label || active?.path || 'No projects';
  if (els.activeProjectMenu) {
    els.activeProjectMenu.innerHTML = projects.map((project) => `
      <button type="button" class="project-picker-option${project.id === state.config.activeProjectId ? ' active' : ''}" data-project-picker-id="${escapeHtml(project.id)}">
        <span class="project-picker-swatch" style="background:${escapeHtml(project.color || '#253858')}"></span>
        <strong>${escapeHtml(project.label || project.path)}</strong>
      </button>
    `).join('');
  }
}

function analysisSummary(analysis) {
  if (!analysis) return 'Not analyzed in this session.';
  return `Errors: ${analysis.counts?.Error ?? 0} | Warnings: ${analysis.counts?.Warning ?? 0} | Info: ${analysis.counts?.Info ?? 0}`;
}

function renderAnalysisReport(analysis) {
  if (!analysis) return '<p class="muted">Analyze a project path to preview structure findings before saving.</p>';
  const groups = ['Error', 'Warning', 'Info'];
  return `
    <div class="validation-counts">
      <span class="count-error">Errors: ${analysis.counts?.Error ?? 0}</span>
      <span class="count-warning">Warnings: ${analysis.counts?.Warning ?? 0}</span>
      <span class="count-info">Info: ${analysis.counts?.Info ?? 0}</span>
    </div>
    ${groups.map((severity) => {
      const findings = (analysis.findings ?? []).filter((finding) => finding.severity === severity);
      return `<section class="finding-group"><h3>${severity}</h3>${findings.length ? `<ul>${findings.map(renderFinding).join('')}</ul>` : '<p class="muted">No findings.</p>'}</section>`;
    }).join('')}
  `;
}

function renderProjectColorChoices(selectedColor = '#253858') {
  const selected = PROJECT_COLORS.some((color) => color.value === selectedColor) ? selectedColor : '#253858';
  return `
    <input id="settingsColor" type="hidden" value="${escapeHtml(selected)}" />
    <div class="color-choice-list" role="radiogroup" aria-label="Project color">
      ${PROJECT_COLORS.map((color) => `
        <button
          type="button"
          class="color-choice${color.value === selected ? ' selected' : ''}"
          data-color-choice="${escapeHtml(color.value)}"
          style="--choice-color:${escapeHtml(color.value)}"
          aria-label="${escapeHtml(color.label)}"
          aria-pressed="${color.value === selected ? 'true' : 'false'}"
          title="${escapeHtml(color.label)}"
        ></button>
      `).join('')}
    </div>
  `;
}

function renderSettings() {
  const cfg = state.config;
  const projects = cfg.projects || [];
  const editingProject = projects.find((project) => project.id === state.editingProjectId);
  const formOpen = state.projectFormMode === 'new' || Boolean(editingProject);
  const formProject = state.projectForm.path || state.projectForm.label || state.projectForm.color !== '#253858'
    ? state.projectForm
    : (editingProject || { label: '', path: '', color: '#253858' });
  const canSave = state.projectAnalysis?.isValid;
  const projectCards = projects.length ? projects.map((project) => {
    const isActive = project.id === cfg.activeProjectId;
    return `
      <li class="project-registry-item${isActive ? ' active' : ''}" data-card-project="${escapeHtml(project.id)}" tabindex="0">
        <div class="project-card-main">
          <span class="project-color-swatch" style="background:${escapeHtml(project.color || '#253858')}"></span>
          <div>
            <strong>${escapeHtml(project.label || project.path)}</strong>
            <code>${escapeHtml(project.path)}</code>
            <small>${isActive ? 'Active project' : 'Saved project'}${project.lastValidatedAt ? ` | Last analyzed: ${escapeHtml(formatValidationTimestamp(project.lastValidatedAt))}` : ''}</small>
          </div>
        </div>
        <div class="project-card-actions">
          <button type="button" class="secondary small-button" data-edit-project="${escapeHtml(project.id)}">Edit</button>
          <button type="button" class="secondary small-button danger-button" data-remove-project="${escapeHtml(project.id)}">Remove Entry</button>
        </div>
      </li>`;
  }).join('') : '<li class="project-registry-empty">No saved projects.</li>';
  els.settingsPaths.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-heading">
        <h3>Saved Projects</h3>
        <button type="button" id="newProjectBtn" class="primary small-button">Add Project</button>
      </div>
      <ul class="project-registry">${projectCards}</ul>
    </div>
    ${formOpen ? `
    <div class="settings-form">
      <div class="field-row">
        <label for="settingsLabel">Project Label</label>
        <input id="settingsLabel" type="text" value="${escapeHtml(formProject.label)}" placeholder="e.g. My App" />
      </div>
      <div class="field-row">
        <label for="settingsPath">Project Path</label>
        <div class="path-picker-row">
          <input id="settingsPath" type="text" value="${escapeHtml(formProject.path)}" placeholder="Project repo or docs/project folder" style="flex:1" />
          <button type="button" id="browseProjectBtn" class="secondary small-button">Browse</button>
        </div>
      </div>
      <div class="field-row">
        <label for="settingsColor">Project Color</label>
        ${renderProjectColorChoices(formProject.color || '#253858')}
      </div>
      <div class="field-row project-form-actions">
        <span>Actions</span>
        <div>
          <button type="button" id="analyzeProjectBtn" class="secondary small-button">Analyze</button>
          <button type="button" id="saveConfigBtn" class="primary small-button"${canSave ? '' : ' disabled'}>${editingProject ? 'Save Project' : 'Add Project'}</button>
          <button type="button" id="cancelProjectEditBtn" class="secondary small-button">Cancel</button>
          <span id="configMsg" class="muted" style="margin-left:8px"></span>
        </div>
      </div>
      <div class="field-row"><span>Analysis</span><strong>${escapeHtml(analysisSummary(state.projectAnalysis))}</strong></div>
    </div>
    <div class="settings-section project-analysis-report">
      <h3>Analysis Report</h3>
      ${renderAnalysisReport(state.projectAnalysis)}
    </div>
    ` : ''}
  `;
  renderProjectSelector();
  applyProjectTheme();
}

function renderControlManager() {
  if (!els.controlManager) return;
  const status = state.controlManager.status;
  const recommendations = state.controlManager.recommendations;
  const approval = state.controlManager.approvalPackage;
  if (!status) {
    els.controlManager.innerHTML = '<p class="muted">Control Manager status is not loaded yet.</p>';
    return;
  }
  if (status.error) {
    els.controlManager.innerHTML = `<div class="error">${escapeHtml(status.error)}</div>`;
    return;
  }
  const changedFiles = status.changedFiles || [];
  const stagedFiles = status.stagedFiles || [];
  const methodologyFiles = status.methodology?.files || [];
  const warningList = [...(status.warnings || []), ...(approval?.risks || [])];
  const byRelease = recommendations?.byRelease || {};
  const approvalSelected = approval?.selectedFiles || changedFiles.map((file) => file.path);
  const releaseOptions = Object.keys(byRelease);
  const selectedRelease = approval?.releaseId || releaseOptions[0] || '';
  const branchName = approval?.branchName || (selectedRelease ? `release/${selectedRelease}` : `release/${new Date().toISOString().slice(0, 10)}`);
  const commitMessage = approval?.commitMessage || (selectedRelease ? `feat: deliver release ${selectedRelease}` : 'chore: update selected project work');
  const confirmPhrase = approval?.requiredConfirmations?.commit || `COMMIT ${selectedRelease || branchName || 'SELECTED'}`;
  els.controlManager.innerHTML = `
    <div class="control-grid">
      <section>
        <h3>Repository</h3>
        <div class="detail-grid compact">
          ${readonlyField('Root', status.repoRoot)}
          ${readonlyField('Branch', status.branch || '-')}
          ${readonlyField('Upstream', status.upstream || 'Not set')}
          ${readonlyField('Dirty Files', String(changedFiles.length))}
        </div>
      </section>
      <section>
        <h3>Methodology</h3>
        <ul class="control-list">${methodologyFiles.map((file) => `<li class="${file.found ? '' : 'warning-row'}"><strong>${escapeHtml(file.label)}</strong><span>${file.found ? 'Loaded' : 'Missing'}</span></li>`).join('')}</ul>
      </section>
    </div>
    <section class="control-section">
      <h3>Promotable Work</h3>
      ${recommendations?.itemCount ? Object.entries(byRelease).map(([release, items]) => `
        <div class="release-recommendation">
          <strong>${escapeHtml(release)}</strong>
          <ul>${items.map((item) => `<li><span class="mono">${escapeHtml(item.id)}</span> ${escapeHtml(item.title)} ${badge(item.status, 'status')}</li>`).join('')}</ul>
        </div>
      `).join('') : '<p class="muted">No items are Ready to Release.</p>'}
    </section>
    <section class="control-section">
      <h3>Changed Files</h3>
      ${changedFiles.length ? `<div class="file-check-list">${changedFiles.map((file) => `
        <label><input type="checkbox" class="control-file-check" value="${escapeHtml(file.path)}"${approvalSelected.includes(file.path) ? ' checked' : ''}> <code>${escapeHtml(file.path)}</code> <span>${escapeHtml(`${file.index}${file.worktree}`)}</span></label>
      `).join('')}</div>` : '<p class="muted">No changed files.</p>'}
    </section>
    <section class="control-section approval-builder">
      <h3>Approval Package</h3>
      <div class="control-form-grid">
        <label>Release<select id="controlRelease">${releaseOptions.map((release) => `<option value="${escapeHtml(release)}"${release === selectedRelease ? ' selected' : ''}>${escapeHtml(release)}</option>`).join('')}</select></label>
        <label>Branch<input id="controlBranch" type="text" value="${escapeHtml(branchName)}"></label>
        <label>Commit Message<input id="controlCommitMessage" type="text" value="${escapeHtml(commitMessage)}"></label>
        <label>Typed Approval<input id="controlConfirmation" type="text" placeholder="${escapeHtml(confirmPhrase)}"></label>
      </div>
      <div class="control-actions">
        <button type="button" class="secondary small-button" data-control-preview>Preview Package</button>
        <button type="button" class="secondary small-button" data-control-action="prepare-branch" data-required-confirmation="${escapeHtml(approval?.requiredConfirmations?.prepareBranch || '')}" disabled>Prepare Branch</button>
        <button type="button" class="secondary small-button" data-control-action="stage-selected" data-required-confirmation="${escapeHtml(approval?.requiredConfirmations?.stageSelected || '')}" disabled>Stage Selected</button>
        <button type="button" class="secondary small-button" data-control-action="commit" data-required-confirmation="${escapeHtml(approval?.requiredConfirmations?.commit || '')}" disabled>Commit</button>
        <button type="button" class="secondary small-button" data-control-action="push" data-required-confirmation="${escapeHtml(approval?.requiredConfirmations?.push || '')}" disabled>Push</button>
        <button type="button" class="secondary small-button" data-control-action="open-pr" data-required-confirmation="${escapeHtml(approval?.requiredConfirmations?.openPr || '')}" disabled>Open PR</button>
        <button type="button" class="secondary small-button" data-control-action="merge-pr" data-required-confirmation="${escapeHtml(approval?.requiredConfirmations?.mergePr || '')}" disabled>Merge PR</button>
      </div>
      ${approval ? `<pre class="control-package">${escapeHtml(JSON.stringify({
        selectedFiles: approval.selectedFiles,
        excludedFiles: approval.excludedFiles,
        tests: approval.tests?.commands,
        backlogItems: approval.backlogItems?.map((item) => item.id),
        commitMessage: approval.commitMessage,
        commands: approval.commands,
        requiredConfirmations: approval.requiredConfirmations,
      }, null, 2))}</pre>` : '<p class="muted">Preview the package before running any action.</p>'}
    </section>
    ${warningList.length ? `<section class="control-section"><h3>Guardrails</h3><ul class="warning-list">${warningList.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul></section>` : ''}
    ${state.controlManager.message ? `<div class="create-message">${escapeHtml(state.controlManager.message)}</div>` : ''}
  `;
}

function controlPayload() {
  const selectedFiles = [...document.querySelectorAll('.control-file-check:checked')].map((input) => input.value);
  const changedFiles = state.controlManager.status?.changedFiles?.map((file) => file.path) || [];
  const excludedFiles = changedFiles.filter((file) => !selectedFiles.includes(file));
  const releaseId = document.getElementById('controlRelease')?.value || '';
  const branchName = document.getElementById('controlBranch')?.value?.trim() || '';
  return {
    selectedFiles,
    excludedFiles,
    releaseId,
    branchName,
    commitMessage: document.getElementById('controlCommitMessage')?.value?.trim() || '',
    confirmation: document.getElementById('controlConfirmation')?.value?.trim() || '',
    prTitle: document.getElementById('controlCommitMessage')?.value?.trim() || '',
    prBody: `Prepared by PM Tools Control Manager for ${releaseId || branchName}.`,
    prNumber: document.getElementById('controlConfirmation')?.value?.trim()?.match(/MERGE PR\s+(\d+)/i)?.[1] || '',
  };
}

function updateControlActionButtons() {
  const typed = document.getElementById('controlConfirmation')?.value?.trim() || '';
  document.querySelectorAll('[data-control-action]').forEach((button) => {
    const required = button.dataset.requiredConfirmation || '';
    button.disabled = !required || typed !== required;
  });
}

async function loadControlManager() {
  if (!els.controlManager) return;
  els.controlManager.innerHTML = '<p class="muted">Loading control manager...</p>';
  try {
    const [statusResponse, recommendationsResponse] = await Promise.all([
      fetch('/api/control-manager/status', { cache: 'no-store' }),
      fetch('/api/control-manager/recommendations', { cache: 'no-store' }),
    ]);
    const status = await statusResponse.json();
    const recommendations = await recommendationsResponse.json();
    if (!statusResponse.ok || status.error) throw new Error(status.error || `Status failed with ${statusResponse.status}`);
    if (!recommendationsResponse.ok || recommendations.error) throw new Error(recommendations.error || `Recommendations failed with ${recommendationsResponse.status}`);
    state.controlManager = { status, recommendations, approvalPackage: null, message: '' };
    renderControlManager();
  } catch (error) {
    state.controlManager = { status: { error: error.message || 'Control Manager failed to load.' }, recommendations: null, approvalPackage: null, message: '' };
    renderControlManager();
  }
}

async function previewControlPackage() {
  try {
    const response = await fetch('/api/control-manager/approval-package', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(controlPayload()),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || `Preview failed with ${response.status}`);
    state.controlManager.approvalPackage = data;
    state.controlManager.message = 'Approval package refreshed.';
    renderControlManager();
  } catch (error) {
    state.controlManager.message = error.message || 'Approval package preview failed.';
    renderControlManager();
  }
}

async function runControlAction(action) {
  try {
    const response = await fetch(`/api/control-manager/actions/${encodeURIComponent(action)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(controlPayload()),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || `${action} failed with ${response.status}`);
    state.controlManager.message = `${action} completed.`;
    await loadControlManager();
  } catch (error) {
    state.controlManager.message = error.message || `${action} failed.`;
    renderControlManager();
  }
}

async function loadConfig() {
  try {
    const response = await fetch('/api/config', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || `Request failed with ${response.status}`);
    state.config = normalizeConfig(data);
    renderSettings();
  } catch {
    // non-fatal: settings will show empty form
  }
}

async function analyzeProject() {
  const msgEl = document.getElementById('configMsg');
  if (msgEl) { msgEl.textContent = 'Analyzing...'; msgEl.className = 'muted'; }
  try {
    const labelInput = document.getElementById('settingsLabel');
    const pathInput = document.getElementById('settingsPath');
    const colorInput = document.getElementById('settingsColor');
    state.projectForm = {
      label: labelInput?.value?.trim() || '',
      path: pathInput?.value?.trim() || '',
      color: colorInput?.value || '#253858',
    };
    const response = await fetch('/api/projects/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: state.projectForm.path }),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || `Analysis failed with ${response.status}`);
    state.projectAnalysis = data;
    renderSettings();
    const msg = document.getElementById('configMsg');
    if (msg) { msg.textContent = data.isValid ? 'Analysis passed.' : 'Analysis found structural errors.'; msg.className = data.isValid ? 'muted' : 'error-text'; }
  } catch (error) {
    const msg = document.getElementById('configMsg');
    if (msg) { msg.textContent = error.message || 'Analysis failed.'; msg.className = 'error-text'; }
  }
}

async function browseProjectPath() {
  const msgEl = document.getElementById('configMsg');
  if (msgEl) { msgEl.textContent = 'Opening folder browser...'; msgEl.className = 'muted'; }
  try {
    const response = await fetch('/api/projects/browse', { method: 'POST' });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || `Browse failed with ${response.status}`);
    if (!data.selectedPath) {
      if (msgEl) msgEl.textContent = 'Folder selection cancelled.';
      return;
    }
    const pathInput = document.getElementById('settingsPath');
    if (pathInput) pathInput.value = data.selectedPath;
    const labelInput = document.getElementById('settingsLabel');
    const colorInput = document.getElementById('settingsColor');
    state.projectForm = {
      label: labelInput?.value?.trim() || '',
      path: data.selectedPath,
      color: colorInput?.value || '#253858',
    };
    state.projectAnalysis = null;
    const msg = document.getElementById('configMsg');
    if (msg) { msg.textContent = 'Folder selected. Analyze before saving.'; msg.className = 'muted'; }
  } catch (error) {
    const msg = document.getElementById('configMsg');
    if (msg) { msg.textContent = error.message || 'Browse failed.'; msg.className = 'error-text'; }
  }
}

async function saveProjectConfig() {
  const msgEl = document.getElementById('configMsg');
  if (msgEl) { msgEl.textContent = 'Saving...'; msgEl.className = 'muted'; }
  try {
    const labelInput = document.getElementById('settingsLabel');
    const pathInput = document.getElementById('settingsPath');
    const colorInput = document.getElementById('settingsColor');
    const payload = {
      label: labelInput?.value?.trim() || state.projectForm.label,
      path: state.projectAnalysis?.isValid && state.projectAnalysis.projectPath
        ? state.projectAnalysis.projectPath
        : (pathInput?.value?.trim() || state.projectForm.path),
      color: colorInput?.value || state.projectForm.color || '#253858',
    };
    state.projectForm = { ...payload };
    const response = await fetch(state.editingProjectId ? `/api/projects/${encodeURIComponent(state.editingProjectId)}` : '/api/projects', {
      method: state.editingProjectId ? 'PUT' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      if (data.analysis) state.projectAnalysis = data.analysis;
      throw new Error(data.error || `Save failed with ${response.status}`);
    }
    state.config = normalizeConfig(data);
    state.projectAnalysis = data.analysis || null;
    state.projectForm = { label: '', path: '', color: '#253858' };
    state.editingProjectId = '';
    state.projectFormMode = '';
    renderSettings();
    await reloadProjectData();
  } catch (error) {
    renderSettings();
    const msg = document.getElementById('configMsg');
    if (msg) { msg.textContent = error.message || 'Save failed.'; msg.className = 'error-text'; }
  }
}

async function setActiveProject(projectId) {
  if (!projectId || projectId === state.config.activeProjectId) return;
  try {
    const response = await fetch('/api/config/active-project', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ activeProjectId: projectId }),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      if (data.analysis) state.projectAnalysis = data.analysis;
      throw new Error(data.error || `Project switch failed with ${response.status}`);
    }
    state.config = normalizeConfig(data);
    state.projectAnalysis = data.analysis || null;
    state.selectedIds.clear();
    state.selectedId = '';
    state.selectedReleaseId = '';
    renderSettings();
    await reloadProjectData();
  } catch (error) {
    showError(error.message || 'Project switch failed.');
    renderSettings();
  }
}

async function removeProject(projectId) {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' });
  const data = await response.json();
  if (!response.ok || data.error) {
    showError(data.error || `Remove failed with ${response.status}`);
    return;
  }
  state.config = normalizeConfig(data);
  if (state.editingProjectId === projectId) {
    state.editingProjectId = '';
    state.projectFormMode = '';
    state.projectForm = { label: '', path: '', color: '#253858' };
  }
  state.projectAnalysis = null;
  renderSettings();
  await reloadProjectData();
}

function renderDashboard() {
  const open = state.items.filter((item) => item.folder !== 'completed' && item.folder !== 'archived');
  const ACTIVE_STATUSES = new Set(['In Progress', 'Ready', 'Blocked', 'Ready to Release']);
  const DEFERRED_BACKLOG_STATUSES = new Set(['Backlog', 'Deferred']);
  els.itemCount.textContent = String(open.length);
  els.activeCount.textContent = String(open.filter((item) => ACTIVE_STATUSES.has(item.status)).length);
  els.needsValCount.textContent = String(open.filter((item) => item.status === 'Needs Validation').length);
  els.deferredBacklogCount.textContent = String(open.filter((item) => DEFERRED_BACKLOG_STATUSES.has(item.status)).length);
  els.bugCount.textContent = String(open.filter((item) => item.prefix === 'BUG').length);
  els.featCount.textContent = String(open.filter((item) => item.prefix === 'FEAT').length);
  els.enhCount.textContent = String(open.filter((item) => item.prefix === 'ENH').length);
  els.uxCount.textContent = String(open.filter((item) => item.prefix === 'UX' || item.prefix === 'UI').length);
  if (els.prioritySummary) renderPills(els.prioritySummary, countBy(open, 'priority'));
  if (els.statusSummary) renderGroupedStatusPills(els.statusSummary, countBy(open, 'status'));
  if (els.typeSummary) renderPills(els.typeSummary, countByType(open));
  if (els.releaseSummary) renderPills(els.releaseSummary, state.releases.length ? Object.fromEntries(state.releases.map((release) => [release.id, release.itemCount])) : {});
  renderBoard();
  renderAttentionPanels();
  renderSprintBoard();
  renderRoadmap();
  renderSettings();
}

const EFFORT_POINTS = { XS: 0.5, S: 1, M: 2, L: 3, XL: 5, Unknown: 0 };
const PRIORITY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3, Someday: 4, 'Parking Lot': 5 };

function renderSprintBoard() {
  if (!els.sprintBoard) return;
  const capacity = Number(els.sprintCapacityInput?.value || 10);
  const groups = new Map();
  for (const item of state.items) {
    const sprint = item.sprint || 'Backlog';
    if (!groups.has(sprint)) groups.set(sprint, []);
    groups.get(sprint).push(item);
  }
  const ordered = [...groups.entries()].sort(([a], [b]) => (a === 'Backlog' ? 1 : b === 'Backlog' ? -1 : a.localeCompare(b)));
  els.sprintBoard.innerHTML = ordered.map(([sprint, items]) => {
    const points = items.reduce((sum, item) => sum + (EFFORT_POINTS[item.effort] ?? 0), 0);
    return `
      <section class="planning-column">
        <header><h3>${escapeHtml(sprint)}</h3><span>${points}/${capacity} pts</span></header>
        <div class="planning-items">
          ${items.map((item) => `
            <article class="planning-item">
              <button type="button" class="link-button" data-open-item="${escapeHtml(item.id)}">${escapeHtml(item.id)} ${escapeHtml(item.title)}</button>
              <select data-sprint-assign="${escapeHtml(item.id)}">
                ${['Backlog', 'Sprint 1', 'Sprint 2', 'Sprint 3'].map((option) => `<option value="${option === 'Backlog' ? '' : escapeHtml(option)}"${(item.sprint || '') === (option === 'Backlog' ? '' : option) ? ' selected' : ''}>${escapeHtml(option)}</option>`).join('')}
              </select>
            </article>
          `).join('')}
        </div>
      </section>
    `;
  }).join('') || '<p class="muted">No backlog items available for sprint planning.</p>';
}

function releaseSortKey(value) {
  const match = String(value || '').match(/^v(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return [9999, 9999, 9999, value || ''];
  return match.slice(1).map(Number);
}

function compareReleaseLabels(a, b) {
  const ak = releaseSortKey(a);
  const bk = releaseSortKey(b);
  for (let i = 0; i < 3; i++) {
    if (ak[i] !== bk[i]) return ak[i] - bk[i];
  }
  return String(ak[3] || '').localeCompare(String(bk[3] || ''));
}

function renderRoadmap() {
  if (!els.roadmapBoard) return;
  const releases = [...new Set(state.items.map((item) => item.release || 'Unassigned'))]
    .sort((a, b) => (a === 'Unassigned' ? 1 : b === 'Unassigned' ? -1 : compareReleaseLabels(a, b)));
  els.roadmapBoard.innerHTML = releases.map((release) => {
    const items = state.items
      .filter((item) => (item.release || 'Unassigned') === release)
      .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) || a.id.localeCompare(b.id));
    return `
      <section class="roadmap-column">
        <header><h3>${escapeHtml(release)}</h3><span>${items.length} item(s)</span></header>
        ${items.map((item) => `
          <button type="button" class="roadmap-item" data-open-item="${escapeHtml(item.id)}">
            <strong>${escapeHtml(item.id)}</strong>
            <span>${escapeHtml(item.title)}</span>
            <em>${escapeHtml(item.priority)} / ${escapeHtml(item.status)}</em>
          </button>
        `).join('') || '<p class="muted">No items.</p>'}
      </section>
    `;
  }).join('');
}

function renderBoard() {
  const groups = STATUS_OPTIONS.filter((status) => state.items.some((item) => item.status === status));
  if (!groups.length) {
    els.statusBoard.innerHTML = '<div class="board-empty-state">No backlog items to display.</div>';
    return;
  }
  els.statusBoard.innerHTML = groups.map((status) => {
    const items = state.items.filter((item) => item.status === status);
    return `
      <div class="board-column" data-drop-status="${escapeHtml(status)}">
        <div class="board-column-header"><span>${escapeHtml(status)}</span><strong>${items.length}</strong></div>
        <div class="board-cards">
          ${items.slice(0, 6).map((item) => `
            <button type="button" class="board-card" draggable="true" data-item-id="${escapeHtml(item.id)}" data-open-item="${escapeHtml(item.id)}">
              <span>${escapeHtml(item.id)}</span>
              <strong>${escapeHtml(item.title)}</strong>
              <em>${escapeHtml(item.priority || '-')} · ${escapeHtml(item.effort || '-')}</em>
              <small>${escapeHtml(item.release || 'Unassigned')} · ${escapeHtml(item.updated || '-')}</small>
            </button>`).join('')}
          ${items.length > 6 ? `<button type="button" class="board-overflow" data-board-status-filter="${escapeHtml(status)}">+ ${items.length - 6} more</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderTableHeaders() {
  document.querySelectorAll('thead th[data-sort]').forEach((th) => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === state.filters.sort) {
      th.classList.add(state.filters.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

function renderRows() {
  renderTableHeaders();
  const items = filteredItems();
  els.visibleCount.textContent = `${items.length} shown`;
  if (!items.length) {
    els.rows.innerHTML = `${quickAddRow()}<tr><td colspan="12" class="empty">No backlog items match the current filters.</td></tr>`;
    return;
  }
  els.rows.innerHTML = quickAddRow() + items.map((item) => `
    <tr class="${item.id === state.selectedId ? 'selected' : ''}${item.id === state.focusedRowId ? ' focused-row' : ''}" data-item-id="${escapeHtml(item.id)}">
      <td><input type="checkbox" class="row-select" data-select-id="${escapeHtml(item.id)}"${state.selectedIds.has(item.id) ? ' checked' : ''}></td>
      <td class="mono">${escapeHtml(item.id || '-')}</td>
      <td>${badge(itemType(item), 'type')}</td>
      <td><button type="button" class="link-button" data-open-item="${escapeHtml(item.id)}">${escapeHtml(item.title || '(untitled)')}</button><div class="path">${escapeHtml(item.path || item.fileName || '')}</div></td>
      <td><button type="button" class="badge badge-status${badgeKey(item.status) ? ` bv-${badgeKey(item.status)}` : ''}" data-status-pick="${escapeHtml(item.id)}">${escapeHtml(item.status || '-')}</button></td>
      <td>${badge(item.priority, 'priority')}</td>
      <td>${escapeHtml(item.effort || '-')}</td>
      <td>${escapeHtml(item.release || '-')}</td>
      <td>${escapeHtml(item.updated || '-')}</td>
      <td>${badge(item.folder, 'folder')}</td>
      <td><div class="tag-list">${tagBadges(item.tags)}</div></td>
      <td><button type="button" class="secondary small-button" data-open-item="${escapeHtml(item.id)}">View</button></td>
    </tr>
  `).join('');
  els.selectionCount.textContent = `${state.selectedIds.size} selected`;
}

function quickAddRow() {
  return `
    <tr class="quick-add-row">
      <td colspan="12">
        <form id="quickAddForm" class="quick-add-form">
          <select name="type" aria-label="Type">${optionList(TYPE_OPTIONS, 'Feature')}</select>
          <input name="title" type="text" placeholder="Quick add backlog item title">
          <button type="submit" class="secondary small-button">Add</button>
        </form>
      </td>
    </tr>
  `;
}

function renderFilters() {
  populateFilter(els.typeFilter, uniqueValues(state.items.map((item) => ({ type: itemType(item) })), 'type'), state.filters.type, 'All types');
  populateStatusFilter(els.statusFilter, uniqueValues(state.items, 'status'), state.filters.status);
  populateFilter(els.priorityFilter, uniqueValues(state.items, 'priority'), state.filters.priority, 'All priorities');
  populateFilter(els.effortFilter, uniqueValues(state.items, 'effort'), state.filters.effort, 'All efforts');
  populateFilter(els.releaseFilter, uniqueValues(state.items, 'release'), state.filters.release, 'All releases');
  populateFilter(els.tagFilter, [...new Set(state.items.flatMap((item) => listValue(item.tags)))].sort((a, b) => a.localeCompare(b)), state.filters.tag, 'All tags');
  populateFilter(els.folderFilter, uniqueValues(state.items, 'folder'), state.filters.folder, 'All folders');
  populateFilter(els.bulkPrioritySelect, PRIORITY_OPTIONS, els.bulkPrioritySelect?.value || '', 'Priority...');
  populateFilter(els.bulkStatusSelect, STATUS_OPTIONS, els.bulkStatusSelect?.value || '', 'Status...');
}

function readonlyField(label, value) {
  return `<div class="field-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || '-')}</strong></div>`;
}

function inputField(name, label, value, readonly = false, rows = 1) {
  const attr = readonly ? ' readonly disabled' : '';
  if (rows > 1) {
    return `<label class="span-3">${escapeHtml(label)}<textarea name="${escapeHtml(name)}" rows="${rows}"${attr}>${escapeHtml(value)}</textarea></label>`;
  }
  return `<label>${escapeHtml(label)}<input name="${escapeHtml(name)}" type="text" value="${escapeHtml(value)}"${attr}></label>`;
}

function linkedItemsHtml(ids = []) {
  const list = listValue(ids);
  if (!list.length) return '<span class="muted-inline">None</span>';
  return list.map((id) => {
    const item = state.items.find((candidate) => candidate.id === id);
    return item
      ? `<button type="button" class="dependency-link" data-open-item="${escapeHtml(id)}">${escapeHtml(id)} ${badge(item.status, 'status')}</button>`
      : `<span class="dependency-link missing">${escapeHtml(id)} Missing</span>`;
  }).join('');
}

function activityHtml(item) {
  const content = sectionValue(item, 'Activity');
  return content.trim() ? `<pre class="activity-log">${escapeHtml(content)}</pre>` : '<p class="muted">No activity yet.</p>';
}

function renderItemForm(mode, item = {}) {
  const isCreate = mode === 'create';
  const isView = mode === 'view';
  const title = isCreate ? 'Create Backlog Item' : isView ? 'View Backlog Item' : 'Edit Backlog Item';
  const prefix = item.prefix || 'FEAT';
  const type = item.type || typeFromPrefix(prefix);
  const status = item.status || 'Backlog';
  const priority = item.priority || 'Medium';
  const effort = item.effort || 'Unknown';
  return `
    <div class="modal-backdrop" data-close-modal></div>
    <section class="item-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <header class="modal-header">
        <div><p class="eyebrow">${escapeHtml(title)}</p><h2>${escapeHtml(isCreate ? 'New backlog item' : `${item.id}: ${item.title}`)}</h2></div>
        <div class="modal-header-actions">
          ${isView ? `<button type="button" id="modalEditBtnTop">Edit</button>` : ''}
          ${isView ? `<button type="button" id="modalPromptBtnTop" class="secondary">Generate Codex Prompt</button>` : ''}
          <button type="button" class="secondary" data-close-modal>${isView ? 'Close' : 'Cancel'}</button>
        </div>
      </header>
      <form id="itemForm" class="create-form">
        ${isCreate ? `<label>Type<select name="type" id="itemTypeSelect">${optionList(TYPE_OPTIONS, type === 'Unknown' ? 'Feature' : type)}</select><span class="hint">Prefix is derived automatically.</span></label>` : `${readonlyField('ID', item.id)}${readonlyField('Prefix', item.prefix)}${readonlyField('Number', item.number)}${readonlyField('Type', type)}<input name="type" type="hidden" value="${escapeHtml(type === 'Unknown' ? '' : type)}">`}
        ${inputField('title', 'Title', item.title || '', isView)}
        <label>Status<select name="status"${isView ? ' disabled' : ''}>${optionList(STATUS_OPTIONS, status)}</select></label>
        <label>Priority<select name="priority"${isView ? ' disabled' : ''}>${optionList(PRIORITY_OPTIONS, priority)}</select></label>
        <label>Effort<select name="effort"${isView ? ' disabled' : ''}>${optionList(EFFORT_OPTIONS, effort)}</select></label>
        ${inputField('release', 'Release', item.release || 'Unassigned', isView)}
        ${inputField('sprint', 'Sprint', item.sprint || '', isView)}
        ${inputField('tags', 'Tags', listValue(item.tags).join(', '), isView)}
        ${inputField('blocks', 'Blocks', listValue(item.blocks).join(', '), isView)}
        ${inputField('blocked_by', 'Blocked By', listValue(item.blocked_by).join(', '), isView)}
        ${isCreate ? '' : `
          ${readonlyField('Created', item.created)}
          ${readonlyField('Developed', item.developed)}
          ${readonlyField('Updated', item.updated)}
          ${readonlyField('Tested', item.tested)}
          ${readonlyField('Deployed', item.deployed)}
          ${readonlyField('Archived', item.archived)}
          ${readonlyField('Deferred', item.deferred)}
          ${readonlyField('Source File', item.path)}
          ${readonlyField('Folder', item.folder)}
          <div class="field-row span-3"><span>Tags</span><strong>${tagBadges(item.tags)}</strong></div>
          <div class="field-row span-3"><span>Blocks</span><strong>${linkedItemsHtml(item.blocks)}</strong></div>
          <div class="field-row span-3"><span>Blocked By</span><strong>${linkedItemsHtml(item.blocked_by)}</strong></div>
        `}
        ${FORM_FIELDS.map(([name, label, section, rows]) => inputField(name, label, isCreate ? '' : sectionValue(item, section), isView, rows)).join('')}
        ${inputField('archive_reason', 'Archive Reason', item.archive_reason || '', isView)}
        ${inputField('defer_reason', 'Defer Reason', item.defer_reason || '', isView)}
        <div class="form-actions span-3">
          ${isView ? `<button type="button" id="modalEditBtn">Edit</button>` : `<button type="submit">${isCreate ? 'Create' : 'Update'}</button>`}
          ${!isCreate && !isView ? '<button type="button" id="modalArchiveBtn" class="secondary">Archive</button>' : ''}
          ${!isCreate ? `<button type="button" id="modalPromptBtn" class="secondary">Generate Codex Prompt</button>` : ''}
          <button type="button" class="secondary" data-close-modal>Cancel</button>
        </div>
        <div id="modalMessage" class="create-message span-3" hidden></div>
        ${!isCreate && isView ? `
          <section class="activity-panel span-3">
            <h3>Activity</h3>
            ${activityHtml(item)}
            <div class="activity-note-row">
              <input id="activityNoteInput" type="text" placeholder="Add note">
              <button id="activityNoteBtn" type="button" class="secondary small-button">Add Note</button>
            </div>
          </section>
        ` : ''}
      </form>
    </section>
  `;
}

function openItemModal(mode, id = '') {
  const item = state.items.find((candidate) => candidate.id === id) ?? {};
  state.modalMode = mode;
  state.modalItemId = id;
  state.selectedId = id;
  els.itemModal.hidden = false;
  els.itemModal.innerHTML = renderItemForm(mode, item);
  document.getElementById('itemForm')?.addEventListener('submit', submitItemForm);
  document.getElementById('modalEditBtn')?.addEventListener('click', () => openItemModal('edit', id));
  document.getElementById('modalEditBtnTop')?.addEventListener('click', () => openItemModal('edit', id));
  document.getElementById('modalArchiveBtn')?.addEventListener('click', archiveCurrentItem);
  document.getElementById('modalPromptBtn')?.addEventListener('click', () => generatePrompt('item', id, false));
  document.getElementById('modalPromptBtnTop')?.addEventListener('click', () => generatePrompt('item', id, false));
  document.getElementById('activityNoteBtn')?.addEventListener('click', () => addActivityNote(id));
  renderRows();
}

function closeItemModal() {
  els.itemModal.hidden = true;
  els.itemModal.innerHTML = '';
  state.modalMode = '';
  state.modalItemId = '';
}

function showModalMessage(message, type = 'success') {
  const el = document.getElementById('modalMessage');
  if (!el) return;
  el.hidden = !message;
  el.textContent = message || '';
  el.className = `create-message ${type} span-3`;
}

function formPayload(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function validateCreatePayload(payload) {
  const errors = [];
  if (!payload.type || !prefixFromType(payload.type)) errors.push('Type is required.');
  if (!payload.title?.trim()) errors.push('Title is required.');
  if (!payload.summary?.trim()) errors.push('Summary is required.');
  if (!payload.problemNeed?.trim()) errors.push('Problem / Need is required.');
  if (!payload.expectedOutcome?.trim()) errors.push('Expected Outcome is required.');
  if (!payload.acceptanceCriteria?.trim()) errors.push('At least one Acceptance Criterion is required.');
  return errors;
}

function validateEditPayload(payload) {
  const errors = [];
  if (!payload.title?.trim()) errors.push('Title is required.');
  if (!payload.status?.trim()) errors.push('Status is required.');
  if (!payload.priority?.trim()) errors.push('Priority is required.');
  if (!payload.effort?.trim()) errors.push('Effort is required.');
  return errors;
}

async function submitItemForm(event) {
  event.preventDefault();
  const payload = formPayload(event.currentTarget);
  const errors = state.modalMode === 'create' ? validateCreatePayload(payload) : validateEditPayload(payload);
  if (errors.length) return showModalMessage(errors.join(' '), 'error');
  try {
    const url = state.modalMode === 'create' ? '/api/backlog/items' : `/api/backlog/items/${encodeURIComponent(state.modalItemId)}`;
    const method = state.modalMode === 'create' ? 'POST' : 'PUT';
    const response = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || `${method} failed with ${response.status}`);
    await loadBacklog();
    await loadReleases();
    const id = result.id || result.item?.id;
    showModalMessage(`${state.modalMode === 'create' ? 'Created' : 'Updated'} ${id}.`);
    openItemModal('view', id);
  } catch (error) {
    showModalMessage(error.message || 'Save failed.', 'error');
  }
}

async function archiveCurrentItem() {
  const item = state.items.find((candidate) => candidate.id === state.modalItemId);
  if (!item) return;
  const payload = {
    title: item.title,
    status: 'Archived',
    priority: item.priority,
    effort: item.effort,
    release: item.release,
    archive_reason: 'Archived from PM Tools app.',
  };
  try {
    const response = await fetch(`/api/backlog/items/${encodeURIComponent(item.id)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || `Archive failed with ${response.status}`);
    await loadBacklog();
    await loadReleases();
    openItemModal('view', item.id);
  } catch (error) {
    showModalMessage(error.message || 'Archive failed.', 'error');
  }
}

async function addActivityNote(id) {
  const input = document.getElementById('activityNoteInput');
  const note = input?.value?.trim() || '';
  if (!note) return showModalMessage('Enter a note before adding it.', 'error');
  try {
    const response = await fetch(`/api/backlog/items/${encodeURIComponent(id)}/activity`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || `Add note failed with ${response.status}`);
    await loadBacklog();
    openItemModal('view', id);
  } catch (error) {
    showModalMessage(error.message || 'Add note failed.', 'error');
  }
}

function showError(message) {
  els.error.hidden = !message;
  els.error.textContent = message || '';
}

function showReleaseMessage(message, type = 'success') {
  els.releaseMessage.hidden = !message;
  els.releaseMessage.textContent = message || '';
  els.releaseMessage.className = `create-message ${type}`;
}

function releaseItemsTable(items = []) {
  if (!items.length) return '<p class="muted">No items assigned.</p>';
  return `
    <div class="release-items-table-wrap">
      <table class="release-items-table">
        <thead>
          <tr><th>ID</th><th>Title</th><th>Status</th><th>Priority</th><th>Updated</th><th>Path</th></tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td class="mono"><button type="button" class="link-button" data-open-item="${escapeHtml(item.id)}">${escapeHtml(item.id)}</button></td>
              <td>${escapeHtml(item.title || '(untitled)')}</td>
              <td>${badge(item.status, 'status')}</td>
              <td>${badge(item.priority || '-', 'priority')}</td>
              <td>${escapeHtml(item.updated || '-')}</td>
              <td class="path">${escapeHtml(item.path || '-')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function validationIsRecent(dateText) {
  if (!dateText) return false;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(dateText) ? new Date(`${dateText}T00:00:00`) : new Date(dateText);
  return !Number.isNaN(parsed.getTime()) && Date.now() - parsed.getTime() < 7 * 24 * 60 * 60 * 1000;
}

function renderValidationReminder(lastValidation) {
  state.lastValidation = lastValidation || '';
  els.lastValidation.textContent = formatValidationTimestamp(lastValidation);
  els.validationReminder.hidden = validationIsRecent(lastValidation);
  els.validationReminder.textContent = lastValidation ? `Backlog validation has not run recently. Last run: ${formatValidationTimestamp(lastValidation)}.` : 'Backlog validation has not run yet.';
  renderSettings();
}

async function loadValidationMeta() {
  try {
    const response = await fetch('/api/validation/meta', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || `Request failed with ${response.status}`);
    renderValidationReminder(data.lastBacklogValidation);
  } catch (error) {
    els.lastValidation.textContent = 'Unavailable';
    els.validationReminder.hidden = false;
    els.validationReminder.textContent = error.message || 'Could not load validation metadata.';
  }
}

function renderFinding(finding) {
  const fixButton = finding.fix ? `<button type="button" class="secondary small-button" data-validation-fix="${escapeHtml(finding.fix.action)}" data-validation-fix-id="${escapeHtml(finding.fix.id || '')}">${finding.fix.action === 'move-item' ? 'Move to correct folder' : 'Regenerate index'}</button>` : '';
  return `<li><div><strong>${escapeHtml(finding.id || finding.path || 'Project')}</strong><span>${escapeHtml(finding.message)}</span></div>${finding.path ? `<code>${escapeHtml(finding.path)}</code>` : ''}${finding.suggestedFix ? `<p>${escapeHtml(finding.suggestedFix)}</p>` : ''}${fixButton}</li>`;
}

function renderValidationResults(result) {
  const groups = ['Error', 'Warning', 'Info'];
  els.validationResults.hidden = false;
  els.validationResults.innerHTML = `
    <div class="validation-counts">
      <span class="count-error">Errors: ${result.counts?.Error ?? 0}</span>
      <span class="count-warning">Warnings: ${result.counts?.Warning ?? 0}</span>
      <span class="count-info">Info: ${result.counts?.Info ?? 0}</span>
    </div>
    ${groups.map((severity) => {
      const findings = (result.findings ?? []).filter((finding) => finding.severity === severity);
      return `<section class="finding-group"><h3>${severity}</h3>${findings.length ? `<ul>${findings.map(renderFinding).join('')}</ul>` : '<p class="muted">No findings.</p>'}</section>`;
    }).join('')}
  `;
}

async function runValidation() {
  els.validateBtn.disabled = true;
  els.validateBtn.textContent = 'Validating...';
  try {
    const response = await fetch('/api/backlog/validate', { method: 'POST' });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || `Validation failed with ${response.status}`);
    renderValidationReminder(result.lastBacklogValidation);
    renderValidationResults(result);
  } catch (error) {
    els.validationResults.hidden = false;
    els.validationResults.innerHTML = `<div class="error">${escapeHtml(error.message || 'Validation failed.')}</div>`;
  } finally {
    els.validateBtn.disabled = false;
    els.validateBtn.textContent = 'Validate Backlog';
  }
}

function renderReleases(releases = []) {
  state.releases = releases;
  renderDashboard();
  renderPromptSelectors();
  if (!state.selectedReleaseId && releases.length) state.selectedReleaseId = releases[0].id;
  if (!releases.length) {
    els.releaseList.innerHTML = '<p class="muted">No release files found.</p>';
    els.releaseDetail.innerHTML = '<p class="muted">No releases found.</p>';
    return;
  }
  const query = (els.releaseSearch?.value || '').toLowerCase();
  const visible = releases.filter((release) => [release.id, release.status, release.readiness].join(' ').toLowerCase().includes(query));
  els.releaseList.innerHTML = visible.map((release) => `
    <button type="button" class="release-list-card${release.id === state.selectedReleaseId ? ' active' : ''}" data-release-select="${escapeHtml(release.id)}">
      <strong>${escapeHtml(release.id)}</strong>
      <span>${release.isVersionRelease ? 'App Version' : 'Historical / Reference'}</span>
      <em>${escapeHtml(release.readiness)} · ${release.itemCount} item(s)</em>
    </button>
  `).join('') || '<p class="muted">No releases match the current search.</p>';
  renderReleaseDetail();
}

async function runValidationFix(action, id = '') {
  const response = await fetch('/api/backlog/fix', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, id }),
  });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error || `Fix failed with ${response.status}`);
  await loadBacklog();
  await runValidation();
}

function releaseProgress(release) {
  const groups = [
    ['Not Started', ['Backlog', 'Ready']],
    ['In Build', ['In Progress']],
    ['In Test', ['Needs Validation']],
    ['Done', ['Ready to Release', 'Done']],
  ];
  const total = Math.max(1, release.items?.length || 0);
  return `
    <div class="release-progress">
      ${groups.map(([label, statuses]) => {
        const count = (release.items || []).filter((item) => statuses.includes(item.status)).length;
        const percent = Math.round((count / total) * 100);
        return `<div class="release-progress-segment seg-${badgeKey(label)}" style="width:${percent}%"><span>${escapeHtml(label)} ${count} / ${percent}%</span></div>`;
      }).join('')}
    </div>
  `;
}

function releaseEffortSummary(release) {
  const counts = countBy(release.items || [], 'effort');
  return EFFORT_OPTIONS.map((effort) => `<span class="summary-pill">${escapeHtml(effort)} <strong>${counts[effort] || 0}</strong></span>`).join('');
}

function renderReleaseDetail() {
  const release = state.releases.find((candidate) => candidate.id === state.selectedReleaseId) || state.releases[0];
  if (!release) return;
  state.selectedReleaseId = release.id;
  els.releaseInput.value = release.isVersionRelease ? release.id : els.releaseInput.value;
  const statusCounts = Object.entries(release.statusCounts ?? {})
    .map(([status, count]) => `<span class="summary-pill">${escapeHtml(status)} <strong>${count}</strong></span>`)
    .join('') || '<span class="muted-inline">No included items.</span>';
  els.releaseDetail.innerHTML = `
    <div class="release-detail-header">
      <div>
        <p class="eyebrow">${release.isVersionRelease ? 'App-Version Release' : 'Historical / Reference Release'}</p>
        <h2>${escapeHtml(release.id)}</h2>
      </div>
      ${badge(release.readiness, 'status')}
    </div>
    <div class="release-status-row">
      <label>Status
        <select id="releaseStatusSelect" data-release-status="${escapeHtml(release.id)}">
          ${['Planning', 'Active', 'Testing', 'Released', 'Ready for Development', 'In Development', 'Development Complete', 'Ready for Human Testing', 'Ready to Deploy', 'Deployed', 'Blocked', 'Cancelled'].map((status) => `<option value="${escapeHtml(status)}"${status === release.status ? ' selected' : ''}>${escapeHtml(status)}</option>`).join('')}
        </select>
      </label>
    </div>
    <div class="detail-grid">
      ${readonlyField('Status', release.status)}
      ${readonlyField('Created', release.created)}
      ${readonlyField('Developed', release.developed)}
      ${readonlyField('Tested', release.tested)}
      ${readonlyField('Deployed', release.deployed)}
      ${readonlyField('Included Items', release.itemCount)}
      ${readonlyField('Path', release.path)}
      ${readonlyField('Codex Prompt', release.promptStatus?.codexPromptGenerated ? 'Generated' : 'Not generated')}
      ${readonlyField('Human Checklist', release.promptStatus?.checklistGenerated ? 'Generated' : 'Not generated')}
    </div>
    <section class="release-detail-section">
      <h3>Readiness by Status</h3>
      <div class="summary-pills">${statusCounts}</div>
    </section>
    <section class="release-detail-section">
      <h3>Progress</h3>
      ${release.itemCount ? releaseProgress(release) : '<p class="muted">No included items.</p>'}
    </section>
    <section class="release-detail-section">
      <h3>Effort</h3>
      <div class="summary-pills">${release.itemCount ? releaseEffortSummary(release) : '<span class="muted-inline">No included items.</span>'}</div>
    </section>
    <section class="release-detail-section">
      <h3>Items Needing Attention</h3>
      <div class="attention-list">${release.attentionItems?.length ? release.attentionItems.map((item) => `<button type="button" class="attention-item" data-open-item="${escapeHtml(item.id)}"><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(item.title)}</span><em>${escapeHtml(item.status)}</em></button>`).join('') : '<p class="muted">No included items need attention.</p>'}</div>
    </section>
    <section class="release-detail-section">
      <h3>Included Backlog Items</h3>
      ${releaseItemsTable(release.items ?? [])}
    </section>
    <div class="release-actions detail-actions">
      <button type="button" class="secondary" data-release-prompt="${escapeHtml(release.id)}">Generate Codex Prompt</button>
      <button type="button" class="secondary" data-release-prompt-save="${escapeHtml(release.id)}">Save Codex Prompt</button>
      <button type="button" class="secondary" data-release-claude-prompt="${escapeHtml(release.id)}">Generate Claude Code Prompt</button>
      <button type="button" class="secondary" data-release-claude-prompt-save="${escapeHtml(release.id)}">Save Claude Code Prompt</button>
      <button type="button" class="secondary" data-release-checklist="${escapeHtml(release.id)}">Generate Human Testing Checklist</button>
      <button type="button" class="secondary" data-release-checklist-save="${escapeHtml(release.id)}">Save Checklist</button>
      <button type="button" class="secondary" data-vc-prompt-release="${escapeHtml(release.id)}">Generate Version-Control Prompt</button>
    </div>
  `;
}

async function loadReleases() {
  try {
    const response = await fetch('/api/releases', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || `Release load failed with ${response.status}`);
    renderReleases(data.releases ?? []);
  } catch (error) {
    els.releaseList.innerHTML = `<div class="error">${escapeHtml(error.message || 'Failed to load releases.')}</div>`;
  }
}

async function createRelease() {
  const version = els.newReleaseInput.value.trim();
  if (!version) return showReleaseMessage('Enter a release version such as v0.2.0.', 'error');
  els.createReleaseBtn.disabled = true;
  els.createReleaseBtn.textContent = 'Creating...';
  try {
    const response = await fetch('/api/releases', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ version }) });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || `Create release failed with ${response.status}`);
    showReleaseMessage(`Created ${result.id} at ${result.path}.`);
    els.newReleaseInput.value = '';
    state.selectedReleaseId = result.id;
    await loadReleases();
  } catch (error) {
    showReleaseMessage(error.message || 'Create release failed.', 'error');
  } finally {
    els.createReleaseBtn.disabled = false;
    els.createReleaseBtn.textContent = 'Create Release';
  }
}

async function updateReleaseStatus(releaseId, status) {
  try {
    const response = await fetch(`/api/releases/${encodeURIComponent(releaseId)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || `Release update failed with ${response.status}`);
    await loadReleases();
  } catch (error) {
    showReleaseMessage(error.message || 'Release status update failed.', 'error');
  }
}

async function copyPromptToClipboard() {
  const text = els.promptOutput.textContent || '';
  if (!text.trim()) {
    els.promptMeta.textContent = 'No prompt available to copy.';
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    els.promptMeta.textContent = `Copied prompt at ${new Date().toLocaleString()}.`;
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(els.promptOutput);
    selection.removeAllRanges();
    selection.addRange(range);
    els.promptMeta.textContent = 'Prompt selected. Use your browser copy command.';
  }
}

function renderPromptSelectors() {
  if (els.promptItemSelect) {
    els.promptItemSelect.innerHTML = state.items.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.id)}: ${escapeHtml(item.title)}</option>`).join('');
  }
  if (els.promptReleaseSelect) {
    els.promptReleaseSelect.innerHTML = state.releases.map((release) => `<option value="${escapeHtml(release.id)}">${escapeHtml(release.id)} (${escapeHtml(release.readiness)})</option>`).join('');
  }
}

async function generatePromptFromWorkspace(save = false) {
  const button = save ? els.savePromptBtn : els.generatePromptBtn;
  const originalText = button?.textContent || '';
  if (button) {
    button.disabled = true;
    button.textContent = save ? 'Saving...' : 'Generating...';
  }
  const promptType = els.promptType.value;
  try {
    if (promptType === 'checklist') {
      const releaseId = els.promptReleaseSelect.value;
      if (!releaseId) {
        els.promptOutput.textContent = 'Select a release first.';
        return;
      }
      await generateChecklist(releaseId, save);
      return;
    }
    if (promptType === 'release') {
      const releaseId = els.promptReleaseSelect.value;
      if (!releaseId) {
        els.promptOutput.textContent = 'Select a release first.';
        return;
      }
      await generatePrompt('release', releaseId, save);
      return;
    }
    if (promptType === 'claude-release') {
      const releaseId = els.promptReleaseSelect.value;
      if (!releaseId) {
        els.promptOutput.textContent = 'Select a release first.';
        return;
      }
      await generatePrompt('claude-release', releaseId, save);
      return;
    }
    if (promptType === 'claude-item') {
      const itemId = els.promptItemSelect.value;
      if (!itemId) {
        els.promptOutput.textContent = 'Select a backlog item first.';
        return;
      }
      await generatePrompt('claude-item', itemId, save);
      return;
    }
    if (promptType === 'version-control') {
      const releaseId = els.promptReleaseSelect.value;
      const itemId = els.promptItemSelect.value;
      const sourceType = releaseId ? 'release' : 'item';
      await generatePrompt('version-control', releaseId || itemId, false, sourceType);
      return;
    }
    const itemId = els.promptItemSelect.value;
    if (!itemId) {
      els.promptOutput.textContent = 'Select a backlog item first.';
      return;
    }
    await generatePrompt('item', itemId, save);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function assignSelectedToRelease() {
  const itemIds = [...state.selectedIds];
  if (!itemIds.length) return showReleaseMessage('Select at least one backlog item.', 'error');
  els.assignReleaseBtn.disabled = true;
  els.assignReleaseBtn.textContent = 'Assigning...';
  try {
    const response = await fetch('/api/releases/assign', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ release: els.releaseInput.value.trim() || 'Unassigned', itemIds }) });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || `Assignment failed with ${response.status}`);
    showReleaseMessage(`Assigned ${result.assignedItemIds.length} item(s) to ${result.release}. ${result.warnings?.join(' ') || ''}`);
    state.selectedIds.clear();
    await loadBacklog();
    await loadReleases();
  } catch (error) {
    showReleaseMessage(error.message || 'Release assignment failed.', 'error');
  } finally {
    els.assignReleaseBtn.disabled = false;
    els.assignReleaseBtn.textContent = 'Assign Selected';
  }
}

function selectedBacklogItems() {
  const byId = new Map(state.items.map((item) => [item.id, item]));
  return [...state.selectedIds].map((id) => byId.get(id)).filter(Boolean);
}

function setBulkButtonsDisabled(disabled) {
  [els.bulkReleaseBtn, els.bulkPriorityBtn, els.bulkStatusBtn].forEach((button) => {
    if (button) button.disabled = disabled;
  });
}

async function bulkAssignSelectedRelease() {
  const itemIds = [...state.selectedIds];
  const release = els.bulkReleaseInput.value.trim() || 'Unassigned';
  if (!itemIds.length) return showError('Select at least one backlog item.');
  setBulkButtonsDisabled(true);
  try {
    const response = await fetch('/api/releases/assign', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ release, itemIds }),
    });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || `Bulk release assignment failed with ${response.status}`);
    state.selectedIds.clear();
    await loadBacklog();
    await loadReleases();
    showError('');
  } catch (error) {
    showError(error.message || 'Bulk release assignment failed.');
  } finally {
    setBulkButtonsDisabled(false);
  }
}

async function bulkUpdateSelectedItems(changes) {
  const items = selectedBacklogItems();
  if (!items.length) return showError('Select at least one backlog item.');
  setBulkButtonsDisabled(true);
  try {
    for (const item of items) {
      const payload = {
        title: item.title,
        status: changes.status ?? item.status,
        priority: changes.priority ?? item.priority,
        effort: item.effort || 'Unknown',
        release: item.release || 'Unassigned',
      };
      const response = await fetch(`/api/backlog/items/${encodeURIComponent(item.id)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || `Bulk update failed for ${item.id} with ${response.status}`);
    }
    state.selectedIds.clear();
    await loadBacklog();
    await loadReleases();
    showError('');
  } catch (error) {
    showError(error.message || 'Bulk update failed.');
  } finally {
    setBulkButtonsDisabled(false);
  }
}

async function updateItemStatus(id, newStatus) {
  const item = state.items.find((candidate) => candidate.id === id);
  if (!item) return { error: `Item not found: ${id}` };
  if (item.status === newStatus) return { noop: true };
  const payload = {
    title: item.title,
    status: newStatus,
    priority: item.priority,
    effort: item.effort || 'Unknown',
    release: item.release || 'Unassigned',
  };
  const response = await fetch(`/api/backlog/items/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

async function generatePrompt(type, id, save, sourceType = '') {
  try {
    const response = await fetch('/api/prompts/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, id, save, sourceType }) });
    const result = await response.json();
    closeItemModal();
    if (!response.ok || result.error) {
      els.promptOutput.textContent = result.error || `Prompt generation failed with ${response.status}`;
      setView('prompts');
      return false;
    }
    els.promptOutput.textContent = result.prompt;
    state.lastPrompt = { type, source: id, timestamp: new Date().toLocaleString() };
    els.promptMeta.textContent = `${save ? 'Saved' : 'Previewed'} ${type} prompt for ${id} at ${state.lastPrompt.timestamp}.`;
    setView('prompts');
    if (save) {
      await loadBacklog();
      await loadReleases();
    }
    return true;
  } catch (error) {
    closeItemModal();
    els.promptOutput.textContent = error.message || 'Prompt generation failed.';
    setView('prompts');
    return false;
  }
}

async function generateChecklist(id, save) {
  try {
    const response = await fetch('/api/checklists/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, save }) });
    const result = await response.json();
    if (!response.ok || result.error) {
      els.promptOutput.textContent = result.error || `Checklist generation failed with ${response.status}`;
      return false;
    }
    els.promptOutput.textContent = result.checklist;
    state.lastPrompt = { type: 'checklist', source: id, timestamp: new Date().toLocaleString() };
    els.promptMeta.textContent = `${save ? 'Saved' : 'Previewed'} human testing checklist for ${id} at ${state.lastPrompt.timestamp}.`;
    setView('prompts');
    if (save) await loadReleases();
    return true;
  } catch (error) {
    els.promptOutput.textContent = error.message || 'Checklist generation failed.';
    return false;
  }
}

function exportFilteredCsv() {
  const rows = filteredItems();
  const header = ['ID', 'Title', 'Status', 'Priority', 'Effort', 'Release', 'Type', 'Created', 'Updated'];
  const csv = [
    header.join(','),
    ...rows.map((item) => [
      item.id,
      item.title,
      item.status,
      item.priority,
      item.effort,
      item.release,
      itemType(item),
      item.created,
      item.updated,
    ].map(csvCell).join(',')),
  ].join('\n');
  const label = activeProject()?.label || 'project';
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slug}-backlog-${date}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function runFullTextSearch() {
  if (!els.fullTextResults) return;
  const query = state.filters.search.trim();
  if (!state.filters.fullText || !query) {
    els.fullTextResults.hidden = true;
    els.fullTextResults.innerHTML = '';
    return;
  }
  const response = await fetch(`/api/backlog/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error || `Full-text search failed with ${response.status}`);
  state.fullTextResults = result.items || [];
  els.fullTextResults.hidden = false;
  els.fullTextResults.innerHTML = state.fullTextResults.length
    ? state.fullTextResults.slice(0, 12).map((item) => `<button type="button" class="search-result" data-open-item="${escapeHtml(item.id)}"><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(item.excerpt)}</span></button>`).join('')
    : '<p class="muted">No full-text matches.</p>';
}

async function saveCurrentView() {
  const name = prompt('Saved view name');
  if (!name) return;
  state.savedViews.push({ id: crypto.randomUUID(), name: name.trim(), filters: { ...state.filters } });
  await persistSavedViews();
}

async function applySavedView(id) {
  const view = state.savedViews.find((candidate) => candidate.id === id);
  if (!view) return;
  state.filters = { ...state.filters, ...view.filters };
  els.searchFilter.value = state.filters.search || '';
  els.fullTextSearchToggle.checked = Boolean(state.filters.fullText);
  els.typeFilter.value = state.filters.type || '';
  els.statusFilter.value = state.filters.status || '';
  els.priorityFilter.value = state.filters.priority || '';
  els.effortFilter.value = state.filters.effort || '';
  els.releaseFilter.value = state.filters.release || '';
  els.tagFilter.value = state.filters.tag || '';
  els.folderFilter.value = state.filters.folder || '';
  els.sortSelect.value = ['updated', 'priority', 'status', 'release'].includes(state.filters.sort) ? state.filters.sort : 'updated';
  renderRows();
  await runFullTextSearch();
}

async function renameSavedView() {
  const id = els.savedViewSelect.value;
  const view = state.savedViews.find((candidate) => candidate.id === id);
  if (!view) return showError('Choose a saved view to rename.');
  const name = prompt('Rename saved view', view.name);
  if (!name) return;
  view.name = name.trim();
  await persistSavedViews();
}

async function deleteSavedView() {
  const id = els.savedViewSelect.value;
  if (!id) return showError('Choose a saved view to delete.');
  state.savedViews = state.savedViews.filter((view) => view.id !== id);
  await persistSavedViews();
}

async function loadBacklog() {
  els.refreshBtn.disabled = true;
  els.refreshBtn.textContent = 'Loading...';
  showError('');
  try {
    const response = await fetch('/api/backlog', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || `Request failed with ${response.status}`);
    state.items = data.items ?? [];
    state.projectPath = data.projectPath ?? '';
    els.loadedAt.textContent = data.loadedAt ? `Loaded ${new Date(data.loadedAt).toLocaleString()}` : '-';
    renderFilters();
    renderRows();
    renderDashboard();
    renderPromptSelectors();
  } catch (error) {
    state.items = [];
    renderFilters();
    renderRows();
    renderDashboard();
    showError(error.message || 'Failed to load backlog items.');
  } finally {
    els.refreshBtn.disabled = false;
    els.refreshBtn.textContent = 'Refresh';
  }
}

async function reloadProjectData() {
  applyTheme();
  await loadConfig();
  await loadSavedViews();
  await loadValidationMeta();
  await loadBacklog();
  await loadReleases();
  await loadControlManager();
  setView(state.currentView);
}

function applyFilter(field, value) {
  state.filters[field] = value;
  renderRows();
  if (field === 'search' || field === 'fullText') {
    runFullTextSearch().catch((error) => showError(error.message || 'Full-text search failed.'));
  }
}

function setView(view) {
  state.currentView = view;
  document.querySelectorAll('[data-view]').forEach((section) => {
    section.classList.toggle('active', section.dataset.view === view);
  });
  document.querySelectorAll('[data-view-target]').forEach((button) => {
    button.classList.toggle('active', button.dataset.viewTarget === view);
  });
  const label = state.config.projectLabel;
  const titles = {
    backlog: label ? `Backlog Dashboard for: ${label}` : 'Backlog Dashboard',
    releases: 'Release Workspace',
    validation: 'Validation',
    prompts: 'Prompt Workspace',
    sprints: 'Sprint Planning',
    roadmap: 'Roadmap',
    settings: 'Settings',
  };
  els.viewTitle.textContent = titles[view] || 'PM Tools';
}

els.refreshBtn.addEventListener('click', () => { loadBacklog(); loadReleases(); });
els.addItemBtn.addEventListener('click', () => openItemModal('create'));
els.themeToggleBtn.addEventListener('click', () => saveTheme(currentTheme() === 'dark' ? 'light' : 'dark'));
document.querySelectorAll('[data-view-target]').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.viewTarget));
});
els.validateBtn.addEventListener('click', runValidation);
els.validationResults.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-validation-fix]');
  if (!btn) return;
  runValidationFix(btn.dataset.validationFix, btn.dataset.validationFixId).catch((error) => showError(error.message || 'Validation fix failed.'));
});
els.refreshReleasesBtn.addEventListener('click', loadReleases);
els.releaseSearch.addEventListener('input', () => renderReleases(state.releases));
els.assignReleaseBtn.addEventListener('click', assignSelectedToRelease);
els.createReleaseBtn.addEventListener('click', createRelease);
els.copyPromptBtn.addEventListener('click', copyPromptToClipboard);
els.generatePromptBtn.addEventListener('click', () => generatePromptFromWorkspace(false));
els.savePromptBtn.addEventListener('click', () => generatePromptFromWorkspace(true));
els.goReleasesBtn.addEventListener('click', () => setView('releases'));
els.refreshControlManagerBtn.addEventListener('click', loadControlManager);
els.controlManager.addEventListener('click', async (event) => {
  if (event.target.closest('[data-control-preview]')) {
    await previewControlPackage();
    return;
  }
  const actionButton = event.target.closest('[data-control-action]');
  if (actionButton) await runControlAction(actionButton.dataset.controlAction);
});
els.controlManager.addEventListener('input', (event) => {
  if (event.target.id === 'controlConfirmation') updateControlActionButtons();
});
els.activeProjectSelect.addEventListener('change', (event) => setActiveProject(event.target.value));
els.activeProjectButton.addEventListener('click', () => {
  if (!els.activeProjectMenu) return;
  els.activeProjectMenu.hidden = !els.activeProjectMenu.hidden;
});
els.activeProjectMenu.addEventListener('click', async (event) => {
  const option = event.target.closest('[data-project-picker-id]');
  if (!option) return;
  els.activeProjectMenu.hidden = true;
  await setActiveProject(option.dataset.projectPickerId);
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.project-picker') && els.activeProjectMenu) els.activeProjectMenu.hidden = true;
});
els.settingsPaths.addEventListener('click', async (event) => {
  const browseBtn = event.target.closest('#browseProjectBtn');
  if (browseBtn) {
    await browseProjectPath();
    return;
  }
  const analyzeBtn = event.target.closest('#analyzeProjectBtn');
  if (analyzeBtn) {
    await analyzeProject();
    return;
  }
  const saveBtn = event.target.closest('#saveConfigBtn');
  if (saveBtn) {
    await saveProjectConfig();
    return;
  }
  const newBtn = event.target.closest('#newProjectBtn');
  if (newBtn) {
    state.projectFormMode = 'new';
    state.editingProjectId = '';
    state.projectForm = { label: '', path: '', color: '#253858' };
    state.projectAnalysis = null;
    renderSettings();
    return;
  }
  const colorBtn = event.target.closest('[data-color-choice]');
  if (colorBtn) {
    const labelInput = document.getElementById('settingsLabel');
    const pathInput = document.getElementById('settingsPath');
    state.projectForm = {
      label: labelInput?.value?.trim() || '',
      path: pathInput?.value?.trim() || '',
      color: colorBtn.dataset.colorChoice || '#253858',
    };
    renderSettings();
    return;
  }
  const editBtn = event.target.closest('[data-edit-project]');
  if (editBtn) {
    state.editingProjectId = editBtn.dataset.editProject;
    state.projectFormMode = 'edit';
    const project = state.config.projects.find((candidate) => candidate.id === state.editingProjectId);
    state.projectForm = project ? { label: project.label || '', path: project.path || '', color: project.color || '#253858' } : { label: '', path: '', color: '#253858' };
    state.projectAnalysis = null;
    renderSettings();
    return;
  }
  const cancelBtn = event.target.closest('#cancelProjectEditBtn');
  if (cancelBtn) {
    state.editingProjectId = '';
    state.projectFormMode = '';
    state.projectForm = { label: '', path: '', color: '#253858' };
    state.projectAnalysis = null;
    renderSettings();
    return;
  }
  const activeBtn = event.target.closest('[data-set-active-project]');
  if (activeBtn) {
    await setActiveProject(activeBtn.dataset.setActiveProject);
    return;
  }
  const removeBtn = event.target.closest('[data-remove-project]');
  if (removeBtn) {
    await removeProject(removeBtn.dataset.removeProject);
    return;
  }
  const projectCard = event.target.closest('[data-card-project]');
  if (projectCard) {
    await setActiveProject(projectCard.dataset.cardProject);
  }
});
els.searchFilter.addEventListener('input', (event) => applyFilter('search', event.target.value));
els.fullTextSearchToggle.addEventListener('change', (event) => applyFilter('fullText', event.target.checked));
els.typeFilter.addEventListener('change', (event) => applyFilter('type', event.target.value));
els.statusFilter.addEventListener('change', (event) => applyFilter('status', event.target.value));
els.priorityFilter.addEventListener('change', (event) => applyFilter('priority', event.target.value));
els.effortFilter.addEventListener('change', (event) => applyFilter('effort', event.target.value));
els.releaseFilter.addEventListener('change', (event) => applyFilter('release', event.target.value));
els.tagFilter.addEventListener('change', (event) => applyFilter('tag', event.target.value));
els.folderFilter.addEventListener('change', (event) => applyFilter('folder', event.target.value));
els.saveViewBtn.addEventListener('click', () => saveCurrentView().catch((error) => showError(error.message)));
els.savedViewSelect.addEventListener('change', (event) => applySavedView(event.target.value).catch((error) => showError(error.message)));
els.renameViewBtn.addEventListener('click', () => renameSavedView().catch((error) => showError(error.message)));
els.deleteViewBtn.addEventListener('click', () => deleteSavedView().catch((error) => showError(error.message)));
els.exportCsvBtn.addEventListener('click', exportFilteredCsv);
els.sprintCapacityInput.addEventListener('input', renderSprintBoard);
els.bulkReleaseBtn.addEventListener('click', bulkAssignSelectedRelease);
els.bulkPriorityBtn.addEventListener('click', () => {
  const priority = els.bulkPrioritySelect.value;
  if (!priority) return showError('Choose a priority for the selected backlog items.');
  return bulkUpdateSelectedItems({ priority });
});
els.bulkStatusBtn.addEventListener('click', () => {
  const status = els.bulkStatusSelect.value;
  if (!status) return showError('Choose a status for the selected backlog items.');
  return bulkUpdateSelectedItems({ status });
});
els.sortSelect.addEventListener('change', (event) => {
  state.filters.sort = event.target.value;
  state.filters.sortDir = event.target.value === 'updated' ? 'desc' : 'asc';
  renderRows();
});

document.querySelector('thead').addEventListener('click', (event) => {
  const th = event.target.closest('th[data-sort]');
  if (!th) return;
  const col = th.dataset.sort;
  if (col === state.filters.sort) {
    state.filters.sortDir = state.filters.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    state.filters.sort = col;
    state.filters.sortDir = col === 'updated' ? 'desc' : 'asc';
    if (els.sortSelect) els.sortSelect.value = ['updated', 'priority', 'status', 'release'].includes(col) ? col : 'updated';
  }
  renderRows();
});
els.rows.addEventListener('click', (event) => {
  const checkbox = event.target.closest('.row-select');
  if (checkbox) {
    state.selectedIds[checkbox.checked ? 'add' : 'delete'](checkbox.dataset.selectId);
    els.selectionCount.textContent = `${state.selectedIds.size} selected`;
    return;
  }
  const statusPick = event.target.closest('[data-status-pick]');
  if (statusPick) {
    showStatusPicker(statusPick.dataset.statusPick, statusPick);
    return;
  }
  const opener = event.target.closest('[data-open-item]');
  const row = event.target.closest('tr[data-item-id]');
  const id = opener?.dataset.openItem || row?.dataset.itemId;
  if (id) openItemModal('view', id);
});
els.rows.addEventListener('submit', async (event) => {
  if (event.target.id !== 'quickAddForm') return;
  event.preventDefault();
  const payload = formPayload(event.target);
  const title = payload.title?.trim();
  if (!title) return showError('Enter a title for the quick-add item.');
  const body = {
    type: payload.type || 'Feature',
    title,
    summary: title,
    problemNeed: 'Quick-added backlog item needs detail before implementation.',
    expectedOutcome: 'Backlog item is captured for refinement.',
    acceptanceCriteria: 'Backlog item exists in the table',
  };
  try {
    const response = await fetch('/api/backlog/items', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || `Quick add failed with ${response.status}`);
    await loadBacklog();
    showError('');
  } catch (error) {
    showError(error.message || 'Quick add failed.');
  }
});
els.rows.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && event.target.closest('#quickAddForm')) {
    event.target.closest('form')?.reset();
  }
});
els.statusBoard.addEventListener('click', (event) => {
  const overflow = event.target.closest('[data-board-status-filter]');
  if (overflow) {
    applyFilter('status', overflow.dataset.boardStatusFilter);
    if (els.statusFilter) els.statusFilter.value = overflow.dataset.boardStatusFilter;
    document.querySelector('.table-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const opener = event.target.closest('[data-open-item]');
  if (opener) openItemModal('view', opener.dataset.openItem);
});
els.fullTextResults.addEventListener('click', (event) => {
  const opener = event.target.closest('[data-open-item]');
  if (opener) openItemModal('view', opener.dataset.openItem);
});
document.addEventListener('click', (event) => {
  const opener = event.target.closest('.attention-item[data-open-item]');
  if (opener) openItemModal('view', opener.dataset.openItem);
  const releaseOpener = event.target.closest('.attention-item[data-view-release]');
  if (releaseOpener) {
    state.selectedReleaseId = releaseOpener.dataset.viewRelease;
    setView('releases');
    renderReleases(state.releases);
  }
});
els.itemModal.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-modal]')) closeItemModal();
});
els.releaseList.addEventListener('click', (event) => {
  const selected = event.target.closest('[data-release-select]');
  if (selected) {
    state.selectedReleaseId = selected.dataset.releaseSelect;
    renderReleases(state.releases);
  }
});
els.releaseDetail.addEventListener('click', (event) => {
  const prompt = event.target.closest('[data-release-prompt]');
  const promptSave = event.target.closest('[data-release-prompt-save]');
  const claudePrompt = event.target.closest('[data-release-claude-prompt]');
  const claudePromptSave = event.target.closest('[data-release-claude-prompt-save]');
  const checklist = event.target.closest('[data-release-checklist]');
  const checklistSave = event.target.closest('[data-release-checklist-save]');
  const vcPrompt = event.target.closest('[data-vc-prompt-release]');
  const opener = event.target.closest('[data-open-item]');
  if (opener) openItemModal('view', opener.dataset.openItem);
  if (prompt) generatePrompt('release', prompt.dataset.releasePrompt, false);
  if (promptSave) generatePrompt('release', promptSave.dataset.releasePromptSave, true);
  if (claudePrompt) generatePrompt('claude-release', claudePrompt.dataset.releaseClaudePrompt, false);
  if (claudePromptSave) generatePrompt('claude-release', claudePromptSave.dataset.releaseClaudePromptSave, true);
  if (checklist) generateChecklist(checklist.dataset.releaseChecklist, false);
  if (checklistSave) generateChecklist(checklistSave.dataset.releaseChecklistSave, true);
  if (vcPrompt) generatePrompt('version-control', vcPrompt.dataset.vcPromptRelease, false, 'release');
});
els.releaseDetail.addEventListener('change', (event) => {
  const statusSelect = event.target.closest('[data-release-status]');
  if (statusSelect) updateReleaseStatus(statusSelect.dataset.releaseStatus, statusSelect.value);
});
els.sprintBoard.addEventListener('change', async (event) => {
  const select = event.target.closest('[data-sprint-assign]');
  if (!select) return;
  const item = state.items.find((candidate) => candidate.id === select.dataset.sprintAssign);
  if (!item) return;
  const result = await fetch(`/api/backlog/items/${encodeURIComponent(item.id)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: item.title, status: item.status, priority: item.priority, effort: item.effort, release: item.release, tags: item.tags, blocks: item.blocks, blocked_by: item.blocked_by, sprint: select.value }),
  }).then((response) => response.json());
  if (result.error) showError(result.error);
  await loadBacklog();
});
els.sprintBoard.addEventListener('click', (event) => {
  const opener = event.target.closest('[data-open-item]');
  if (opener) openItemModal('view', opener.dataset.openItem);
});
els.roadmapBoard.addEventListener('click', (event) => {
  const opener = event.target.closest('[data-open-item]');
  if (opener) openItemModal('view', opener.dataset.openItem);
});

// ── Status picker (ENH-0007) ──────────────────────────────────────────────────

const statusPickerEl = document.createElement('div');
statusPickerEl.id = 'statusPicker';
statusPickerEl.className = 'status-picker';
statusPickerEl.hidden = true;
document.body.appendChild(statusPickerEl);

let statusPickerTargetId = '';

function showStatusPicker(itemId, anchorEl) {
  statusPickerTargetId = itemId;
  statusPickerEl.innerHTML = STATUS_OPTIONS.map((status) =>
    `<button type="button" class="status-picker-option" data-pick-status="${escapeHtml(status)}">${escapeHtml(status)}</button>`
  ).join('');
  statusPickerEl.hidden = false;
  const rect = anchorEl.getBoundingClientRect();
  const left = Math.min(rect.left + window.scrollX, window.innerWidth - 200);
  statusPickerEl.style.top = `${rect.bottom + window.scrollY + 4}px`;
  statusPickerEl.style.left = `${left}px`;
}

function hideStatusPicker() {
  statusPickerEl.hidden = true;
  statusPickerTargetId = '';
}

statusPickerEl.addEventListener('click', async (event) => {
  const btn = event.target.closest('[data-pick-status]');
  if (!btn || !statusPickerTargetId) return;
  const newStatus = btn.dataset.pickStatus;
  const id = statusPickerTargetId;
  hideStatusPicker();
  const result = await updateItemStatus(id, newStatus);
  if (result.noop) return;
  if (result.error) { showError(result.error); return; }
  showError('');
  await loadBacklog();
  await loadReleases();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !statusPickerEl.hidden) hideStatusPicker();
});

document.addEventListener('click', (event) => {
  if (!statusPickerEl.hidden && !statusPickerEl.contains(event.target) && !event.target.closest('[data-status-pick]')) {
    hideStatusPicker();
  }
});

// ── Kanban drag-and-drop (FEAT-0019) ─────────────────────────────────────────

const shortcutsOverlay = document.createElement('div');
shortcutsOverlay.id = 'shortcutsOverlay';
shortcutsOverlay.className = 'shortcuts-overlay';
shortcutsOverlay.hidden = true;
shortcutsOverlay.innerHTML = `
  <div class="shortcuts-panel">
    <h2>Keyboard Shortcuts</h2>
    <p><strong>Arrow Up / Arrow Down</strong> Move row focus</p>
    <p><strong>Enter / O</strong> Open focused item</p>
    <p><strong>S</strong> Open status picker</p>
    <p><strong>Escape</strong> Close modal or picker</p>
    <p><strong>?</strong> Show or hide this overlay</p>
  </div>
`;
document.body.appendChild(shortcutsOverlay);

function isTypingTarget(target) {
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function visibleRowIds() {
  return filteredItems().map((item) => item.id);
}

function focusRow(delta) {
  const ids = visibleRowIds();
  if (!ids.length) return;
  const current = ids.indexOf(state.focusedRowId);
  const next = current === -1 ? 0 : Math.max(0, Math.min(ids.length - 1, current + delta));
  state.focusedRowId = ids[next];
  renderRows();
  document.querySelector(`tr[data-item-id="${CSS.escape(state.focusedRowId)}"]`)?.scrollIntoView({ block: 'nearest' });
}

document.addEventListener('keydown', (event) => {
  if (isTypingTarget(event.target)) {
    if (event.key === 'Escape' && event.target.closest('#quickAddForm')) event.target.closest('form')?.reset();
    return;
  }
  if (event.key === '?') {
    shortcutsOverlay.hidden = !shortcutsOverlay.hidden;
    event.preventDefault();
    return;
  }
  if (event.key === 'Escape') {
    shortcutsOverlay.hidden = true;
    if (!els.itemModal.hidden) closeItemModal();
    if (!statusPickerEl.hidden) hideStatusPicker();
    return;
  }
  if (state.currentView !== 'backlog') return;
  if (event.key === 'ArrowDown') { focusRow(1); event.preventDefault(); }
  if (event.key === 'ArrowUp') { focusRow(-1); event.preventDefault(); }
  if ((event.key === 'Enter' || event.key.toLowerCase() === 'o') && state.focusedRowId) {
    openItemModal('view', state.focusedRowId);
    event.preventDefault();
  }
  if (event.key.toLowerCase() === 's' && state.focusedRowId) {
    const badgeButton = document.querySelector(`tr[data-item-id="${CSS.escape(state.focusedRowId)}"] [data-status-pick]`);
    if (badgeButton) showStatusPicker(state.focusedRowId, badgeButton);
    event.preventDefault();
  }
});

let draggedItemId = '';

els.statusBoard.addEventListener('dragstart', (event) => {
  const card = event.target.closest('.board-card[draggable]');
  if (!card) return;
  draggedItemId = card.dataset.itemId;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', draggedItemId);
  card.classList.add('dragging');
});

els.statusBoard.addEventListener('dragend', (event) => {
  draggedItemId = '';
  document.querySelectorAll('.board-column.drag-over').forEach((col) => col.classList.remove('drag-over'));
  event.target.classList.remove('dragging');
});

els.statusBoard.addEventListener('dragover', (event) => {
  const column = event.target.closest('[data-drop-status]');
  if (!column || !draggedItemId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.board-column.drag-over').forEach((col) => { if (col !== column) col.classList.remove('drag-over'); });
  column.classList.add('drag-over');
});

els.statusBoard.addEventListener('dragleave', (event) => {
  const column = event.target.closest('[data-drop-status]');
  if (!column) return;
  if (!column.contains(event.relatedTarget)) column.classList.remove('drag-over');
});

els.statusBoard.addEventListener('drop', async (event) => {
  const column = event.target.closest('[data-drop-status]');
  if (!column || !draggedItemId) return;
  event.preventDefault();
  column.classList.remove('drag-over');
  const newStatus = column.dataset.dropStatus;
  const id = draggedItemId;
  draggedItemId = '';
  const result = await updateItemStatus(id, newStatus);
  if (result.noop) return;
  if (result.error) { showError(result.error); return; }
  showError('');
  await loadBacklog();
  await loadReleases();
});

reloadProjectData();
