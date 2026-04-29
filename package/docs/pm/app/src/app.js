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
  'Eddie Review Needed',
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
  Intake: ['New', 'Clarifying'],
  Planning: ['Ready', 'Planned'],
  Build: ['In Development', 'Development Complete', 'Needs Review', 'Changes Requested'],
  Test: ['Ready for Testing', 'In Testing', 'Failed Testing', 'Passed Testing'],
  Release: ['Ready to Deploy', 'Deployed'],
  Inactive: ['Blocked', 'Deferred', 'Rejected', 'Duplicate', 'Archived'],
};
const STATUS_OPTIONS = ['New', 'Clarifying', 'Ready', 'Planned', 'In Development', 'Development Complete', 'Needs Review', 'Changes Requested', 'Ready for Testing', 'In Testing', 'Failed Testing', 'Passed Testing', 'Ready to Deploy', 'Deployed', 'Blocked', 'Deferred', 'Rejected', 'Duplicate', 'Archived'];
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
  ['eddieReviewNeeded', 'Eddie Review Needed', 'Eddie Review Needed', 3],
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
  filters: { search: '', status: '', priority: '', folder: '', sort: 'updated', sortDir: 'desc' },
};

const els = {
  refreshBtn: document.getElementById('refreshBtn'),
  addItemBtn: document.getElementById('addItemBtn'),
  itemCount: document.getElementById('itemCount'),
  activeCount: document.getElementById('activeCount'),
  completedCount: document.getElementById('completedCount'),
  newCount: document.getElementById('newCount'),
  developmentCount: document.getElementById('developmentCount'),
  readyTestingCount: document.getElementById('readyTestingCount'),
  passedTestingCount: document.getElementById('passedTestingCount'),
  blockedCount: document.getElementById('blockedCount'),
  clarifyingCount: document.getElementById('clarifyingCount'),
  deployReadyCount: document.getElementById('deployReadyCount'),
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
  statusFilter: document.getElementById('statusFilter'),
  priorityFilter: document.getElementById('priorityFilter'),
  folderFilter: document.getElementById('folderFilter'),
  sortSelect: document.getElementById('sortSelect'),
  selectionCount: document.getElementById('selectionCount'),
  goReleasesBtn: document.getElementById('goReleasesBtn'),
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
  viewTitle: document.getElementById('viewTitle'),
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

function badge(value, type) {
  const key = String(value || '').toLowerCase().replace(/[\s/]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `<span class="badge badge-${type}${key ? ` bv-${key}` : ''}">${escapeHtml(value || '-')}</span>`;
}

function matchesSearch(item, query) {
  if (!query) return true;
  return [item.id, item.title, item.status, item.priority, item.effort, item.release, item.updated, item.folder, item.fileName].join(' ').toLowerCase().includes(query.toLowerCase());
}

function filteredItems() {
  const items = state.items.filter((item) => matchesSearch(item, state.filters.search)
    && (!state.filters.status || item.status === state.filters.status)
    && (!state.filters.priority || item.priority === state.filters.priority)
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
  const DONE_STATUSES = new Set(['Deployed', 'Archived', 'Rejected', 'Duplicate', 'Deferred']);
  const attention = state.items.filter((item) =>
    !DONE_STATUSES.has(item.status) && (
      ['Blocked', 'Clarifying', 'Failed Testing'].includes(item.status) ||
      item.release === 'Unassigned'
    )
  ).slice(0, 8);
  els.needsAttention.innerHTML = attention.length ? attention.map(attentionItem).join('') : '<p class="muted">No priority attention items.</p>';
  const readyTesting = state.items.filter((item) => item.status === 'Ready for Testing');
  els.readyForTesting.innerHTML = readyTesting.length ? readyTesting.map(attentionItem).join('') : '<p class="muted">No items ready for human testing.</p>';
  const readyDeploy = state.items.filter((item) => ['Ready to Deploy', 'Passed Testing'].includes(item.status));
  els.readyToDeploy.innerHTML = readyDeploy.length ? readyDeploy.map(attentionItem).join('') : '<p class="muted">No items ready to deploy.</p>';

  const recent = [...state.items].sort((a, b) => (b.updated || '').localeCompare(a.updated || '')).slice(0, 8);
  els.recentActivity.innerHTML = recent.length ? recent.map(attentionItem).join('') : '<p class="muted">No recent items.</p>';
}

function renderSettings() {
  els.settingsPaths.innerHTML = `
    <div class="field-row"><span>Project Path</span><strong>${escapeHtml(state.projectPath || './docs/project')}</strong></div>
    <div class="field-row"><span>Backlog Path</span><strong>./docs/project/backlog</strong></div>
    <div class="field-row"><span>Release Path</span><strong>./docs/project/releases</strong></div>
    <div class="field-row"><span>Validation Reminder</span><strong>${escapeHtml(state.lastValidation ? `Last run ${state.lastValidation}` : 'Validation has not run yet')}</strong></div>
  `;
}

function renderDashboard() {
  const open = state.items.filter((item) => item.folder !== 'completed' && item.folder !== 'archived');
  els.itemCount.textContent = String(state.items.length);
  els.activeCount.textContent = String(state.items.filter((item) => item.folder === 'active').length);
  els.completedCount.textContent = String(state.items.filter((item) => item.status === 'Deployed').length);
  els.blockedCount.textContent = String(state.items.filter((item) => item.status === 'Blocked').length);
  els.clarifyingCount.textContent = String(state.items.filter((item) => item.status === 'Clarifying').length);
  els.deployReadyCount.textContent = String(state.items.filter((item) => ['Ready', 'Ready to Deploy', 'Passed Testing'].includes(item.status)).length);
  els.newCount.textContent = String(state.items.filter((item) => item.status === 'New').length);
  els.developmentCount.textContent = String(state.items.filter((item) => item.status === 'In Development').length);
  els.readyTestingCount.textContent = String(state.items.filter((item) => item.status === 'Ready for Testing').length);
  els.passedTestingCount.textContent = String(state.items.filter((item) => item.status === 'Passed Testing').length);
  renderPills(els.prioritySummary, countBy(open, 'priority'));
  renderGroupedStatusPills(els.statusSummary, countBy(open, 'status'));
  renderPills(els.typeSummary, countByType(open));
  renderPills(els.releaseSummary, state.releases.length ? Object.fromEntries(state.releases.map((release) => [release.id, release.itemCount])) : {});
  renderBoard();
  renderAttentionPanels();
  renderSettings();
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
      <div class="board-column">
        <div class="board-column-header"><span>${escapeHtml(status)}</span><strong>${items.length}</strong></div>
        <div class="board-cards">
          ${items.slice(0, 6).map((item) => `
            <button type="button" class="board-card" data-open-item="${escapeHtml(item.id)}">
              <span>${escapeHtml(item.id)}</span>
              <strong>${escapeHtml(item.title)}</strong>
              <em>${escapeHtml(item.priority || '-')} · ${escapeHtml(item.effort || '-')}</em>
              <small>${escapeHtml(item.release || 'Unassigned')} · ${escapeHtml(item.updated || '-')}</small>
            </button>`).join('')}
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
    els.rows.innerHTML = '<tr><td colspan="11" class="empty">No backlog items match the current filters.</td></tr>';
    return;
  }
  els.rows.innerHTML = items.map((item) => `
    <tr class="${item.id === state.selectedId ? 'selected' : ''}" data-item-id="${escapeHtml(item.id)}">
      <td><input type="checkbox" class="row-select" data-select-id="${escapeHtml(item.id)}"${state.selectedIds.has(item.id) ? ' checked' : ''}></td>
      <td class="mono">${escapeHtml(item.id || '-')}</td>
      <td>${badge(itemType(item), 'type')}</td>
      <td><button type="button" class="link-button" data-open-item="${escapeHtml(item.id)}">${escapeHtml(item.title || '(untitled)')}</button><div class="path">${escapeHtml(item.path || item.fileName || '')}</div></td>
      <td>${badge(item.status, 'status')}</td>
      <td>${badge(item.priority, 'priority')}</td>
      <td>${escapeHtml(item.effort || '-')}</td>
      <td>${escapeHtml(item.release || '-')}</td>
      <td>${escapeHtml(item.updated || '-')}</td>
      <td>${badge(item.folder, 'folder')}</td>
      <td><button type="button" class="secondary small-button" data-open-item="${escapeHtml(item.id)}">View</button></td>
    </tr>
  `).join('');
  els.selectionCount.textContent = `${state.selectedIds.size} selected`;
}

function renderFilters() {
  populateFilter(els.statusFilter, uniqueValues(state.items, 'status'), state.filters.status, 'All statuses');
  populateFilter(els.priorityFilter, uniqueValues(state.items, 'priority'), state.filters.priority, 'All priorities');
  populateFilter(els.folderFilter, uniqueValues(state.items, 'folder'), state.filters.folder, 'All folders');
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

function renderItemForm(mode, item = {}) {
  const isCreate = mode === 'create';
  const isView = mode === 'view';
  const title = isCreate ? 'Create Backlog Item' : isView ? 'View Backlog Item' : 'Edit Backlog Item';
  const prefix = item.prefix || 'FEAT';
  const type = item.type || typeFromPrefix(prefix);
  const status = item.status || 'New';
  const priority = item.priority || 'Medium';
  const effort = item.effort || 'Unknown';
  return `
    <div class="modal-backdrop" data-close-modal></div>
    <section class="item-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <header class="modal-header">
        <div><p class="eyebrow">${escapeHtml(title)}</p><h2>${escapeHtml(isCreate ? 'New backlog item' : `${item.id}: ${item.title}`)}</h2></div>
        <button type="button" class="secondary" data-close-modal>Close</button>
      </header>
      <form id="itemForm" class="create-form">
        ${isCreate ? `<label>Type<select name="type" id="itemTypeSelect">${optionList(TYPE_OPTIONS, type === 'Unknown' ? 'Feature' : type)}</select><span class="hint">Prefix is derived automatically.</span></label>` : `${readonlyField('ID', item.id)}${readonlyField('Prefix', item.prefix)}${readonlyField('Number', item.number)}${readonlyField('Type', type)}<input name="type" type="hidden" value="${escapeHtml(type === 'Unknown' ? '' : type)}">`}
        ${inputField('title', 'Title', item.title || '', isView)}
        <label>Status<select name="status"${isView ? ' disabled' : ''}>${optionList(STATUS_OPTIONS, status)}</select></label>
        <label>Priority<select name="priority"${isView ? ' disabled' : ''}>${optionList(PRIORITY_OPTIONS, priority)}</select></label>
        <label>Effort<select name="effort"${isView ? ' disabled' : ''}>${optionList(EFFORT_OPTIONS, effort)}</select></label>
        ${inputField('release', 'Release', item.release || 'Unassigned', isView)}
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
        `}
        ${FORM_FIELDS.map(([name, label, section, rows]) => inputField(name, label, isCreate ? '' : sectionValue(item, section), isView, rows)).join('')}
        ${inputField('archiveReason', 'Archive Reason', item.archive_reason || '', isView)}
        ${inputField('deferReason', 'Defer Reason', item.defer_reason || '', isView)}
        <div class="form-actions span-3">
          ${isView ? `<button type="button" id="modalEditBtn">Edit</button>` : `<button type="submit">${isCreate ? 'Create' : 'Update'}</button>`}
          ${!isCreate && !isView ? '<button type="button" id="modalArchiveBtn" class="secondary">Archive</button>' : ''}
          ${!isCreate ? `<button type="button" id="modalPromptBtn" class="secondary">Generate Codex Prompt</button>` : ''}
          <button type="button" class="secondary" data-close-modal>Cancel</button>
        </div>
        <div id="modalMessage" class="create-message span-3" hidden></div>
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
  document.getElementById('modalArchiveBtn')?.addEventListener('click', archiveCurrentItem);
  document.getElementById('modalPromptBtn')?.addEventListener('click', () => generatePrompt('item', id, false));
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
    archiveReason: 'Archived from PM Tools app.',
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

function showError(message) {
  els.error.hidden = !message;
  els.error.textContent = message || '';
}

function showReleaseMessage(message, type = 'success') {
  els.releaseMessage.hidden = !message;
  els.releaseMessage.textContent = message || '';
  els.releaseMessage.className = `create-message ${type}`;
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
  return `<li><div><strong>${escapeHtml(finding.id || finding.path || 'Project')}</strong><span>${escapeHtml(finding.message)}</span></div>${finding.path ? `<code>${escapeHtml(finding.path)}</code>` : ''}${finding.suggestedFix ? `<p>${escapeHtml(finding.suggestedFix)}</p>` : ''}</li>`;
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
      <h3>Items Needing Attention</h3>
      <div class="attention-list">${release.attentionItems?.length ? release.attentionItems.map((item) => `<button type="button" class="attention-item" data-open-item="${escapeHtml(item.id)}"><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(item.title)}</span><em>${escapeHtml(item.status)}</em></button>`).join('') : '<p class="muted">No included items need attention.</p>'}</div>
    </section>
    <section class="release-detail-section">
      <h3>Included Backlog Items</h3>
      <div class="release-items">${(release.items ?? []).map((item) => `<button type="button" class="item-chip" data-open-item="${escapeHtml(item.id)}">${escapeHtml(item.id)}: ${escapeHtml(item.title)}</button>`).join('') || '<span class="muted-inline">No items assigned.</span>'}</div>
    </section>
    <div class="release-actions detail-actions">
      <button type="button" class="secondary" data-release-prompt="${escapeHtml(release.id)}">Generate Release Codex Prompt</button>
      <button type="button" class="secondary" data-release-prompt-save="${escapeHtml(release.id)}">Save Release Prompt</button>
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
  const promptType = els.promptType.value;
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

async function generatePrompt(type, id, save, sourceType = '') {
  const response = await fetch('/api/prompts/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, id, save, sourceType }) });
  const result = await response.json();
  if (!response.ok || result.error) {
    els.promptOutput.textContent = result.error || `Prompt generation failed with ${response.status}`;
    return;
  }
  els.promptOutput.textContent = result.prompt;
  state.lastPrompt = { type, source: id, timestamp: new Date().toLocaleString() };
  els.promptMeta.textContent = `${save ? 'Saved' : 'Previewed'} ${type} prompt for ${id} at ${state.lastPrompt.timestamp}.`;
  setView('prompts');
  if (save) {
    await loadBacklog();
    await loadReleases();
  }
}

async function generateChecklist(id, save) {
  const response = await fetch('/api/checklists/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, save }) });
  const result = await response.json();
  if (!response.ok || result.error) {
    els.promptOutput.textContent = result.error || `Checklist generation failed with ${response.status}`;
    return;
  }
  els.promptOutput.textContent = result.checklist;
  state.lastPrompt = { type: 'checklist', source: id, timestamp: new Date().toLocaleString() };
  els.promptMeta.textContent = `${save ? 'Saved' : 'Previewed'} human testing checklist for ${id} at ${state.lastPrompt.timestamp}.`;
  setView('prompts');
  if (save) await loadReleases();
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

function applyFilter(field, value) {
  state.filters[field] = value;
  renderRows();
}

function setView(view) {
  state.currentView = view;
  document.querySelectorAll('[data-view]').forEach((section) => {
    section.classList.toggle('active', section.dataset.view === view);
  });
  document.querySelectorAll('[data-view-target]').forEach((button) => {
    button.classList.toggle('active', button.dataset.viewTarget === view);
  });
  const titles = {
    backlog: 'Backlog Dashboard',
    releases: 'Release Workspace',
    validation: 'Validation',
    prompts: 'Prompt Workspace',
    settings: 'Settings',
  };
  els.viewTitle.textContent = titles[view] || 'PM Tools';
}

els.refreshBtn.addEventListener('click', () => { loadBacklog(); loadReleases(); });
els.addItemBtn.addEventListener('click', () => openItemModal('create'));
document.querySelectorAll('[data-view-target]').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.viewTarget));
});
els.validateBtn.addEventListener('click', runValidation);
els.refreshReleasesBtn.addEventListener('click', loadReleases);
els.releaseSearch.addEventListener('input', () => renderReleases(state.releases));
els.assignReleaseBtn.addEventListener('click', assignSelectedToRelease);
els.createReleaseBtn.addEventListener('click', createRelease);
els.copyPromptBtn.addEventListener('click', () => navigator.clipboard?.writeText(els.promptOutput.textContent));
els.generatePromptBtn.addEventListener('click', () => generatePromptFromWorkspace(false));
els.savePromptBtn.addEventListener('click', () => generatePromptFromWorkspace(true));
els.goReleasesBtn.addEventListener('click', () => setView('releases'));
els.searchFilter.addEventListener('input', (event) => applyFilter('search', event.target.value));
els.statusFilter.addEventListener('change', (event) => applyFilter('status', event.target.value));
els.priorityFilter.addEventListener('change', (event) => applyFilter('priority', event.target.value));
els.folderFilter.addEventListener('change', (event) => applyFilter('folder', event.target.value));
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
  const opener = event.target.closest('[data-open-item]');
  const row = event.target.closest('tr[data-item-id]');
  const id = opener?.dataset.openItem || row?.dataset.itemId;
  if (id) openItemModal('view', id);
});
els.statusBoard.addEventListener('click', (event) => {
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
  const checklist = event.target.closest('[data-release-checklist]');
  const checklistSave = event.target.closest('[data-release-checklist-save]');
  const vcPrompt = event.target.closest('[data-vc-prompt-release]');
  const opener = event.target.closest('[data-open-item]');
  if (opener) openItemModal('view', opener.dataset.openItem);
  if (prompt) generatePrompt('release', prompt.dataset.releasePrompt, false);
  if (promptSave) generatePrompt('release', promptSave.dataset.releasePromptSave, true);
  if (checklist) generateChecklist(checklist.dataset.releaseChecklist, false);
  if (checklistSave) generateChecklist(checklistSave.dataset.releaseChecklistSave, true);
  if (vcPrompt) generatePrompt('version-control', vcPrompt.dataset.vcPromptRelease, false, 'release');
});

loadBacklog();
loadValidationMeta();
loadReleases();
