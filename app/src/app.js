// ── Constants ──────────────────────────────────────────────────────────────

const TYPE_OPTIONS = ['Feature', 'Bug', 'Enhancement', 'Refactor', 'Documentation', 'Spike', 'Security', 'Task'];
const STATUSES = ['Inbox', 'Ready', 'In Progress', 'Review', 'Done'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low', 'Someday'];
const EFFORTS = ['XS', 'S', 'M', 'L', 'XL', 'Unknown'];
const PROJECT_COLORS = [
  '#253858', '#0052cc', '#0065ff', '#00875a', '#36b37e',
  '#ff5630', '#ff7452', '#ff8b00', '#ffab00', '#6554c0',
  '#8777d9', '#403294', '#00b8d9', '#00c7e6', '#57d9a3',
];

// ── State ──────────────────────────────────────────────────────────────────

const state = {
  config: null,
  items: [],
  releases: [],
  currentView: 'board',
  filters: { search: '', status: '', type: '', priority: '', tag: '' },
  sort: { key: 'updated', dir: 'desc' },
  selectMode: false,
  selectedIds: new Set(),
  activeReleaseId: null,
};

// ── API ────────────────────────────────────────────────────────────────────

async function api(method, urlPath, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(urlPath, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { error: text }; }
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// ── Data loading ───────────────────────────────────────────────────────────

async function loadConfig() {
  state.config = await api('GET', '/api/config');
}

async function loadBacklog() {
  const data = await api('GET', '/api/backlog');
  state.items = Array.isArray(data) ? data : (data.items || []);
}

async function loadReleases() {
  const data = await api('GET', '/api/releases');
  state.releases = Array.isArray(data) ? data : (Array.isArray(data.releases) ? data.releases : []);
}

async function loadAll() {
  await Promise.all([loadConfig(), loadBacklog(), loadReleases()]);
}

// ── View switching ─────────────────────────────────────────────────────────

function switchView(view) {
  state.currentView = view;
  document.querySelectorAll('.view-section').forEach((s) => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));
  const section = document.getElementById(`${view}View`);
  const navBtn = document.querySelector(`[data-view-target="${view}"]`);
  if (section) section.classList.add('active');
  if (navBtn) navBtn.classList.add('active');
  if (view === 'board') renderBoard();
  if (view === 'releases') renderReleaseList();
  if (view === 'settings') renderSettings();
}

// ── Status bar ─────────────────────────────────────────────────────────────

function updateStatusCounts() {
  const pillIds = {
    'Inbox': 'pillInbox',
    'Ready': 'pillReady',
    'In Progress': 'pillInProgress',
    'Review': 'pillReview',
    'Done': 'pillDone',
  };
  for (const [status, id] of Object.entries(pillIds)) {
    const count = state.items.filter((i) => i.status === status).length;
    const pill = document.getElementById(id);
    if (pill) pill.querySelector('strong').textContent = count;
  }
  const countEl = document.getElementById('itemCount');
  if (countEl) countEl.textContent = `${state.items.length} items`;
}

// ── Board rendering ────────────────────────────────────────────────────────

function getFilteredItems() {
  const { search, status, type, priority, tag } = state.filters;
  return state.items.filter((item) => {
    if (status && item.status !== status) return false;
    if (type && item.type !== type) return false;
    if (priority && item.priority !== priority) return false;
    if (tag) {
      const q = tag.toLowerCase();
      if (!(item.tags || []).some((t) => t.toLowerCase().includes(q))) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const hay = `${item.id} ${item.title} ${(item.tags || []).join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function sortItems(items) {
  const { key, dir } = state.sort;
  const mult = dir === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = a[key] ?? '';
    const bv = b[key] ?? '';
    return av < bv ? -mult : av > bv ? mult : 0;
  });
}

function statusClass(status) {
  return `bv-${(status || '').toLowerCase().replace(/\s+/g, '-')}`;
}

function priorityClass(priority) {
  return `bv-priority-${(priority || '').toLowerCase()}`;
}

function renderBoard() {
  const tbody = document.getElementById('backlogBody');
  if (!tbody) return;

  const filtered = sortItems(getFilteredItems());
  tbody.innerHTML = '';

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">No items match the current filters.</td></tr>`;
    return;
  }

  for (const item of filtered) {
    const tr = document.createElement('tr');
    if (state.selectedIds.has(item.id)) tr.classList.add('row-selected');
    tr.dataset.id = item.id;

    const tags = (item.tags || []).map((t) => `<span class="tag-chip">${esc(t)}</span>`).join('');

    tr.innerHTML = `
      <td class="col-check"><input type="checkbox" class="row-checkbox" data-id="${item.id}" ${state.selectedIds.has(item.id) ? 'checked' : ''} /></td>
      <td><span class="item-id-link" data-id="${item.id}">${esc(item.id)}</span></td>
      <td><span class="item-title-link" data-id="${item.id}">${esc(item.title)}</span>${tags ? `<span class="tag-chips">${tags}</span>` : ''}</td>
      <td><span class="badge ${statusClass(item.status)}">${esc(item.status)}</span></td>
      <td>${item.priority ? `<span class="badge ${priorityClass(item.priority)}">${esc(item.priority)}</span>` : ''}</td>
      <td>${item.effort ? `<span class="effort-badge">${esc(item.effort)}</span>` : ''}</td>
      <td>${esc(item.type || '')}</td>
      <td>${formatDate(item.updated || item.created)}</td>
    `;
    tbody.appendChild(tr);
  }
}

// ── Selection mode ─────────────────────────────────────────────────────────

function updateSelectionBar() {
  const bar = document.getElementById('selectionBar');
  const count = document.getElementById('selectionCount');
  if (!bar) return;
  const n = state.selectedIds.size;
  if (n > 0 && state.selectMode) {
    bar.hidden = false;
    if (count) count.textContent = `${n} item${n > 1 ? 's' : ''} selected`;
  } else {
    bar.hidden = true;
  }
}

function toggleRowSelect(id) {
  if (state.selectedIds.has(id)) {
    state.selectedIds.delete(id);
  } else {
    state.selectedIds.add(id);
  }
  updateSelectionBar();
  // update just this row's checkbox
  const cb = document.querySelector(`.row-checkbox[data-id="${id}"]`);
  if (cb) cb.checked = state.selectedIds.has(id);
  const tr = document.querySelector(`tr[data-id="${id}"]`);
  if (tr) tr.classList.toggle('row-selected', state.selectedIds.has(id));
}

function enterSelectMode() {
  state.selectMode = true;
  document.getElementById('selectModeBtn').textContent = 'Cancel';
  updateSelectionBar();
}

function exitSelectMode() {
  state.selectMode = false;
  state.selectedIds.clear();
  const btn = document.getElementById('selectModeBtn');
  if (btn) btn.textContent = 'Select';
  updateSelectionBar();
  renderBoard();
}

// ── Item modal ─────────────────────────────────────────────────────────────

function showItemFormSection(show) {
  const formSec = document.getElementById('itemFormSection');
  const detailSec = document.getElementById('itemDetailSection');
  if (formSec) formSec.hidden = !show;
  if (detailSec) detailSec.hidden = show;
}

function openNewItem() {
  const modal = document.getElementById('itemModal');
  if (!modal) return;
  const form = document.getElementById('itemForm');
  form.reset();
  form.dataset.mode = 'create';
  delete form.dataset.id;
  document.getElementById('itemModalTitle').textContent = 'Create backlog item';
  document.getElementById('itemModalEyebrow').textContent = 'New Item';
  document.getElementById('itemFormSubmit').textContent = 'Create Item';
  // hide status field for create (always starts as Inbox)
  const statusLabel = document.getElementById('itemStatus')?.closest('label');
  if (statusLabel) statusLabel.style.display = 'none';
  showItemFormSection(true);
  modal.hidden = false;
}

function openItemDetail(id) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  const modal = document.getElementById('itemModal');
  const form = document.getElementById('itemForm');
  if (!modal || !form) return;

  form.dataset.mode = 'edit';
  form.dataset.id = id;
  document.getElementById('itemModalTitle').textContent = item.title;
  document.getElementById('itemModalEyebrow').textContent = id;
  document.getElementById('itemFormSubmit').textContent = 'Save Changes';

  // show status field for edit
  const statusLabel = document.getElementById('itemStatus')?.closest('label');
  if (statusLabel) statusLabel.style.display = '';

  setVal('itemType', item.type);
  setVal('itemTitle', item.title);
  setVal('itemStatus', item.status);
  setVal('itemPriority', item.priority);
  setVal('itemEffort', item.effort);
  setVal('itemTags', (item.tags || []).join(', '));
  setVal('itemBlockedBy', (item.blocked_by || []).join(', '));
  setVal('itemSummary', item.summary || '');
  setVal('itemAC', item.acceptanceCriteria || '');
  setVal('itemImplNotes', item.implementationNotes || '');

  showItemFormSection(true);
  modal.hidden = false;
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}

function closeItemModal() {
  const modal = document.getElementById('itemModal');
  if (modal) modal.hidden = true;
}

async function submitItemForm(e) {
  e.preventDefault();
  const form = e.target;
  const mode = form.dataset.mode;
  const id = form.dataset.id;

  const payload = {
    type: getVal('itemType'),
    title: getVal('itemTitle'),
    status: getVal('itemStatus') || 'Inbox',
    priority: getVal('itemPriority'),
    effort: getVal('itemEffort'),
    tags: getVal('itemTags'),
    blocked_by: getVal('itemBlockedBy'),
    summary: getVal('itemSummary'),
    acceptanceCriteria: getVal('itemAC'),
    implementationNotes: getVal('itemImplNotes'),
  };

  const msgEl = document.getElementById('itemFormMsg');
  if (msgEl) msgEl.textContent = '';

  try {
    if (mode === 'create') {
      await api('POST', '/api/backlog/items', payload);
    } else {
      await api('PUT', `/api/backlog/items/${encodeURIComponent(id)}`, payload);
    }
    closeItemModal();
    await loadBacklog();
    renderBoard();
    updateStatusCounts();
  } catch (err) {
    if (msgEl) msgEl.textContent = err.message;
    else showNotice(err.message, 'error');
  }
}

function getVal(id) {
  return document.getElementById(id)?.value ?? '';
}

async function deleteItem(id) {
  if (!confirm(`Delete ${id}? This cannot be undone.`)) return;
  try {
    await api('DELETE', `/api/backlog/items/${encodeURIComponent(id)}`);
    closeItemModal();
    await loadBacklog();
    renderBoard();
    updateStatusCounts();
  } catch (err) {
    showNotice(err.message, 'error');
  }
}

// ── Releases view ──────────────────────────────────────────────────────────

function renderReleaseList() {
  const scroll = document.getElementById('releaseListScroll');
  const emptyEl = document.getElementById('releaseListEmpty');
  const countEl = document.getElementById('releaseCount');
  if (!scroll) return;

  if (countEl) countEl.textContent = state.releases.length;

  if (!state.releases.length) {
    if (emptyEl) emptyEl.hidden = false;
    showReleaseEmpty();
    return;
  }
  if (emptyEl) emptyEl.hidden = true;

  // Build list items inside the scroll container (keep the empty notice element)
  const existing = scroll.querySelectorAll('.release-list-item');
  existing.forEach((el) => el.remove());

  for (const rel of state.releases) {
    const div = document.createElement('div');
    div.className = `release-list-item${state.activeReleaseId === rel.id ? ' active' : ''}`;
    div.dataset.id = rel.id;
    div.innerHTML = `
      <div class="release-item-header">
        <span class="release-item-title">${esc(rel.title)}</span>
        <span class="dispatch-badge dispatch-badge-${(rel.status || 'draft').toLowerCase()}">${esc(rel.status || 'Draft')}</span>
      </div>
      <div class="release-item-meta">${rel.items?.length || 0} items · ${formatDate(rel.created)}</div>
    `;
    div.addEventListener('click', () => {
      state.activeReleaseId = rel.id;
      renderReleaseList();
      renderReleaseDetail(rel);
    });
    scroll.appendChild(div);
  }

  if (!state.activeReleaseId && state.releases.length) {
    state.activeReleaseId = state.releases[0].id;
  }
  if (state.activeReleaseId) {
    const active = state.releases.find((r) => r.id === state.activeReleaseId);
    if (active) renderReleaseDetail(active);
    else showReleaseEmpty();
  }
}

function showReleaseEmpty() {
  const emptyState = document.getElementById('releaseEmptyState');
  const detailContent = document.getElementById('releaseDetailContent');
  if (emptyState) emptyState.hidden = false;
  if (detailContent) detailContent.hidden = true;
}

function renderReleaseDetail(release) {
  const emptyState = document.getElementById('releaseEmptyState');
  const detailContent = document.getElementById('releaseDetailContent');
  if (!detailContent) return;
  if (emptyState) emptyState.hidden = true;
  detailContent.hidden = false;

  // Header
  const titleEl = document.getElementById('releaseDetailTitle');
  const statusEl = document.getElementById('releaseDetailStatus');
  const dateEl = document.getElementById('releaseDetailDate');
  if (titleEl) titleEl.textContent = release.title;
  if (statusEl) {
    statusEl.textContent = release.status || 'Draft';
    statusEl.className = `dispatch-badge dispatch-badge-${(release.status || 'draft').toLowerCase()}`;
  }
  if (dateEl) dateEl.textContent = `Created ${formatDate(release.created)}`;

  // Dispatch button
  const dispatchBtn = document.getElementById('dispatchReleaseBtn');
  if (dispatchBtn) {
    dispatchBtn.textContent = release.status === 'Dispatched' ? '⚡ Re-dispatch' : '⚡ Dispatch to Claude Code';
    dispatchBtn.disabled = release.status === 'Done';
    dispatchBtn.dataset.id = release.id;
  }

  const deleteBtn = document.getElementById('deleteReleaseBtn');
  if (deleteBtn) deleteBtn.dataset.id = release.id;

  const editTitleBtn = document.getElementById('editReleaseTitleBtn');
  if (editTitleBtn) editTitleBtn.dataset.id = release.id;

  // Item count
  const itemCount = document.getElementById('releaseItemCount');
  if (itemCount) itemCount.textContent = `${release.items?.length || 0}`;

  // Items list
  const itemsList = document.getElementById('releaseItemsList');
  if (itemsList) {
    if (!release.items?.length) {
      itemsList.innerHTML = `<div class="empty" style="padding:10px 0;color:var(--muted)">No items. Add some below.</div>`;
    } else {
      itemsList.innerHTML = (release.items || []).map((id) => {
        const item = state.items.find((i) => i.id === id);
        if (!item) return `<div class="release-item-row missing">${esc(id)} <span style="color:var(--muted)">(not found)</span></div>`;
        return `
          <div class="release-item-row">
            <span class="badge ${statusClass(item.status)}" style="flex-shrink:0">${esc(item.status)}</span>
            <span class="item-id-link release-item-id" data-id="${item.id}">${esc(item.id)}</span>
            <span class="release-row-title">${esc(item.title)}</span>
            <button class="link-button remove-item-btn" data-release-id="${release.id}" data-item-id="${item.id}" title="Remove">×</button>
          </div>
        `;
      }).join('');
      itemsList.querySelectorAll('.item-id-link').forEach((el) => {
        el.addEventListener('click', () => openItemDetail(el.dataset.id));
      });
      itemsList.querySelectorAll('.remove-item-btn').forEach((btn) => {
        btn.addEventListener('click', () => removeItemFromRelease(btn.dataset.releaseId, btn.dataset.itemId));
      });
    }
  }

  // Item picker (add to release)
  populateItemPicker(release);

  // Work package section
  const wpSection = document.getElementById('workPackageSection');
  const wpPreview = document.getElementById('workPackagePreview');
  if (wpSection && wpPreview) {
    if (release.workPackagePath) {
      wpSection.hidden = false;
      wpPreview.textContent = 'Loading…';
      api('GET', `/api/releases/${encodeURIComponent(release.id)}/work-package`)
        .then((data) => { wpPreview.textContent = data.content || ''; })
        .catch(() => { wpPreview.textContent = '(could not load work package)'; });
    } else {
      wpSection.hidden = true;
    }
  }
}

function populateItemPicker(release) {
  const picker = document.getElementById('releaseItemPicker');
  if (!picker) return;
  const inRelease = new Set(release.items || []);
  const candidates = state.items.filter((i) => !inRelease.has(i.id) && i.status !== 'Done');
  picker.innerHTML = '<option value="">Add an item to this release…</option>'
    + candidates.map((i) => `<option value="${i.id}">[${i.status}] ${esc(i.id)} — ${esc(i.title)}</option>`).join('');
}

async function removeItemFromRelease(releaseId, itemId) {
  const rel = state.releases.find((r) => r.id === releaseId);
  if (!rel) return;
  const items = (rel.items || []).filter((id) => id !== itemId);
  try {
    await api('PUT', `/api/releases/${encodeURIComponent(releaseId)}`, { items });
    await loadReleases();
    renderReleaseList();
  } catch (err) {
    showNotice(err.message, 'error');
  }
}

async function addItemToRelease(releaseId) {
  const picker = document.getElementById('releaseItemPicker');
  const itemId = picker?.value;
  if (!itemId) return;
  const rel = state.releases.find((r) => r.id === releaseId);
  if (!rel) return;
  const items = [...new Set([...(rel.items || []), itemId])];
  try {
    await api('PUT', `/api/releases/${encodeURIComponent(releaseId)}`, { items });
    await loadReleases();
    renderReleaseList();
  } catch (err) {
    showNotice(err.message, 'error');
  }
}

async function dispatchRelease(releaseId) {
  const btn = document.getElementById('dispatchReleaseBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Dispatching…'; }
  try {
    const result = await api('POST', `/api/releases/${encodeURIComponent(releaseId)}/dispatch`);
    await Promise.all([loadBacklog(), loadReleases()]);
    updateStatusCounts();
    renderBoard();
    state.activeReleaseId = releaseId;
    renderReleaseList();
    if (result.workPackage) {
      try { await navigator.clipboard.writeText(result.workPackage); } catch {}
      showNotice('Dispatched! Work package copied to clipboard.');
    } else {
      showNotice('Dispatched!');
    }
  } catch (err) {
    showNotice(err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = '⚡ Dispatch to Claude Code'; }
  }
}

async function deleteRelease(releaseId) {
  if (!confirm('Delete this release? Items will not be affected.')) return;
  try {
    await api('DELETE', `/api/releases/${encodeURIComponent(releaseId)}`);
    state.activeReleaseId = null;
    await loadReleases();
    renderReleaseList();
  } catch (err) {
    showNotice(err.message, 'error');
  }
}

async function renameRelease(releaseId) {
  const rel = state.releases.find((r) => r.id === releaseId);
  const newTitle = prompt('New release name:', rel?.title || '');
  if (!newTitle?.trim() || newTitle.trim() === rel?.title) return;
  try {
    await api('PUT', `/api/releases/${encodeURIComponent(releaseId)}`, { title: newTitle.trim() });
    await loadReleases();
    renderReleaseList();
  } catch (err) {
    showNotice(err.message, 'error');
  }
}

// ── New release modal ──────────────────────────────────────────────────────

function openNewReleaseModal(preselectedIds) {
  const modal = document.getElementById('newReleaseModal');
  if (!modal) return;
  const input = document.getElementById('newReleaseTitle');
  if (input) input.value = '';
  const note = document.getElementById('newReleaseItemsNote');
  if (note) {
    const n = preselectedIds?.size || 0;
    note.textContent = n > 0
      ? `${n} item${n > 1 ? 's' : ''} will be included in this release.`
      : 'No items currently selected. You can add items after creating the release.';
  }
  modal.hidden = false;
  if (input) input.focus();
}

function closeNewReleaseModal() {
  const modal = document.getElementById('newReleaseModal');
  if (modal) modal.hidden = true;
}

async function saveNewRelease() {
  const input = document.getElementById('newReleaseTitle');
  const title = input?.value?.trim();
  const msgEl = document.getElementById('newReleaseMsg');
  if (!title) {
    if (msgEl) msgEl.textContent = 'Please enter a release name.';
    return;
  }
  if (msgEl) msgEl.textContent = '';

  const items = [...state.selectedIds];
  try {
    const data = await api('POST', '/api/releases', { title, items });
    const relId = data.id || data.release?.id;
    exitSelectMode();
    await loadReleases();
    state.activeReleaseId = relId;
    closeNewReleaseModal();
    switchView('releases');
  } catch (err) {
    if (msgEl) msgEl.textContent = err.message;
  }
}

// ── Settings view ──────────────────────────────────────────────────────────

function renderSettings() {
  renderProjectList();
  renderColorPicker(PROJECT_COLORS[0]);
}

function renderProjectList() {
  const list = document.getElementById('projectList');
  const emptyEl = document.getElementById('projectListEmpty');
  if (!list) return;
  const projects = state.config?.projects || [];
  const activeId = state.config?.activeProjectId;

  if (!projects.length) {
    list.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    return;
  }
  if (emptyEl) emptyEl.hidden = true;

  list.innerHTML = '';
  for (const proj of projects) {
    const isActive = proj.id === activeId;
    const li = document.createElement('li');
    li.className = `project-row${isActive ? ' project-row-active' : ''}`;
    li.innerHTML = `
      <span class="project-swatch" style="background:${esc(proj.color || '#253858')}"></span>
      <div class="project-info">
        <strong>${esc(proj.label || proj.id)}</strong>
        <span class="project-path">${esc(proj.path)}</span>
      </div>
      <div class="project-row-actions">
        ${isActive
          ? '<span class="active-badge">Active</span>'
          : `<button class="secondary small-button activate-project-btn" data-id="${proj.id}">Switch</button>`}
        <button class="link-button danger remove-project-btn" data-id="${proj.id}" title="Remove">×</button>
      </div>
    `;
    list.appendChild(li);
  }

  list.querySelectorAll('.activate-project-btn').forEach((btn) => {
    btn.addEventListener('click', () => activateProject(btn.dataset.id));
  });
  list.querySelectorAll('.remove-project-btn').forEach((btn) => {
    btn.addEventListener('click', () => removeProject(btn.dataset.id));
  });
}

function renderColorPicker(selected) {
  const picker = document.getElementById('colorChoiceList');
  if (!picker) return;
  picker.innerHTML = PROJECT_COLORS.map((c) => `
    <label class="color-choice${c === selected ? ' selected' : ''}">
      <input type="radio" name="projectColor" value="${c}" ${c === selected ? 'checked' : ''} />
      <span class="color-swatch" style="background:${c}"></span>
    </label>
  `).join('');
}

async function activateProject(id) {
  try {
    await api('PUT', '/api/config/active-project', { activeProjectId: id });
    await loadAll();
    renderNavProject();
    renderProjectList();
    renderBoard();
    updateStatusCounts();
    renderReleaseList();
  } catch (err) {
    showNotice(err.message, 'error');
  }
}

async function removeProject(id) {
  if (!confirm('Remove this project from the list? Files will not be deleted.')) return;
  const projects = (state.config?.projects || []).filter((p) => p.id !== id);
  try {
    await api('PUT', '/api/config', { projects });
    await loadConfig();
    renderProjectList();
  } catch (err) {
    showNotice(err.message, 'error');
  }
}

async function submitProjectForm(e) {
  e.preventDefault();
  const label = getVal('projectLabel').trim();
  const projectPath = getVal('projectPath').trim();
  const colorInput = document.querySelector('input[name="projectColor"]:checked');
  const color = colorInput?.value || PROJECT_COLORS[0];

  if (!label || !projectPath) {
    showNotice('Label and path are required.', 'error');
    return;
  }

  try {
    await api('POST', '/api/projects', { label, path: projectPath, color });
    e.target.reset();
    renderColorPicker(PROJECT_COLORS[0]);
    await loadConfig();
    renderProjectList();
    showNotice('Project added.');
  } catch (err) {
    showNotice(err.message, 'error');
  }
}

// ── Nav project picker ─────────────────────────────────────────────────────

function renderNavProject() {
  const projects = state.config?.projects || [];
  const activeId = state.config?.activeProjectId;
  const active = projects.find((p) => p.id === activeId) || projects[0];
  const swatch = document.getElementById('navProjectSwatch');
  const name = document.getElementById('navProjectName');
  if (swatch) swatch.style.background = active?.color || '#253858';
  if (name) name.textContent = active?.label || active?.id || 'No project';
}

function renderProjectPicker() {
  const menu = document.getElementById('projectPickerMenu');
  if (!menu) return;
  const projects = state.config?.projects || [];
  const activeId = state.config?.activeProjectId;
  if (!projects.length) {
    menu.innerHTML = `<div style="padding:.5rem .75rem;color:var(--fg-muted);font-size:.8125rem">No projects</div>`;
    return;
  }
  menu.innerHTML = projects.map((p) => `
    <button class="project-picker-option${p.id === activeId ? ' active' : ''}" data-id="${p.id}">
      <span class="project-picker-swatch" style="background:${esc(p.color || '#253858')}"></span>
      ${esc(p.label || p.id)}
    </button>
  `).join('');
  menu.querySelectorAll('.project-picker-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      activateProject(btn.dataset.id);
      closeProjectPicker();
    });
  });
}

function openProjectPicker() {
  const menu = document.getElementById('projectPickerMenu');
  const btn = document.getElementById('projectPickerBtn');
  if (!menu || !btn) return;
  renderProjectPicker();
  menu.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
}

function closeProjectPicker() {
  const menu = document.getElementById('projectPickerMenu');
  const btn = document.getElementById('projectPickerBtn');
  if (menu) menu.hidden = true;
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

// ── Utilities ──────────────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showNotice(msg, type = 'info') {
  let notice = document.getElementById('globalNotice');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'globalNotice';
    notice.className = 'global-notice';
    document.body.appendChild(notice);
  }
  notice.textContent = msg;
  notice.className = `global-notice global-notice-${type}`;
  notice.hidden = false;
  clearTimeout(notice._timer);
  notice._timer = setTimeout(() => { notice.hidden = true; }, 3500);
}

// ── Event wiring ───────────────────────────────────────────────────────────

function wire() {
  // Nav links
  document.querySelectorAll('[data-view-target]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.viewTarget));
  });

  // Board filters
  document.getElementById('filterSearch')?.addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    renderBoard();
  });
  document.getElementById('filterStatus')?.addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    renderBoard();
  });
  document.getElementById('filterType')?.addEventListener('change', (e) => {
    state.filters.type = e.target.value;
    renderBoard();
  });
  document.getElementById('filterPriority')?.addEventListener('change', (e) => {
    state.filters.priority = e.target.value;
    renderBoard();
  });
  document.getElementById('filterTag')?.addEventListener('input', (e) => {
    state.filters.tag = e.target.value;
    renderBoard();
  });
  document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
    state.filters = { search: '', status: '', type: '', priority: '', tag: '' };
    ['filterSearch', 'filterTag'].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['filterStatus', 'filterType', 'filterPriority'].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
    renderBoard();
  });

  // Status pill filters
  document.querySelectorAll('.status-pill[data-filter-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const s = btn.dataset.filterStatus;
      state.filters.status = state.filters.status === s ? '' : s;
      const sel = document.getElementById('filterStatus');
      if (sel) sel.value = state.filters.status;
      renderBoard();
    });
  });

  // Board table clicks
  document.getElementById('backlogBody')?.addEventListener('click', (e) => {
    const checkbox = e.target.closest('.row-checkbox');
    if (checkbox) {
      if (!state.selectMode) enterSelectMode();
      toggleRowSelect(checkbox.dataset.id);
      return;
    }
    const link = e.target.closest('.item-id-link, .item-title-link');
    if (link) openItemDetail(link.dataset.id);
  });

  // Select all checkbox
  document.getElementById('selectAll')?.addEventListener('change', (e) => {
    const filtered = getFilteredItems();
    if (e.target.checked) {
      if (!state.selectMode) enterSelectMode();
      filtered.forEach((item) => state.selectedIds.add(item.id));
    } else {
      filtered.forEach((item) => state.selectedIds.delete(item.id));
    }
    renderBoard();
    updateSelectionBar();
  });

  // Select mode toggle
  document.getElementById('selectModeBtn')?.addEventListener('click', () => {
    if (state.selectMode) exitSelectMode();
    else enterSelectMode();
  });
  document.getElementById('cancelSelectBtn')?.addEventListener('click', exitSelectMode);
  document.getElementById('createReleaseFromSelectionBtn')?.addEventListener('click', () => {
    openNewReleaseModal(state.selectedIds);
  });

  // New item
  document.getElementById('newItemBtn')?.addEventListener('click', openNewItem);

  // Item modal
  document.getElementById('itemModalClose')?.addEventListener('click', closeItemModal);
  document.getElementById('itemModalBackdrop')?.addEventListener('click', closeItemModal);
  document.getElementById('itemForm')?.addEventListener('submit', submitItemForm);
  document.getElementById('itemFormCancel')?.addEventListener('click', closeItemModal);
  document.getElementById('itemDeleteBtn')?.addEventListener('click', () => {
    const id = document.getElementById('itemForm')?.dataset.id;
    if (id) deleteItem(id);
  });

  // Release view
  document.getElementById('newReleaseBtn')?.addEventListener('click', () => openNewReleaseModal(state.selectedIds));
  document.getElementById('dispatchReleaseBtn')?.addEventListener('click', () => {
    const id = document.getElementById('dispatchReleaseBtn')?.dataset.id;
    if (id) dispatchRelease(id);
  });
  document.getElementById('deleteReleaseBtn')?.addEventListener('click', () => {
    const id = document.getElementById('deleteReleaseBtn')?.dataset.id;
    if (id) deleteRelease(id);
  });
  document.getElementById('editReleaseTitleBtn')?.addEventListener('click', () => {
    const id = document.getElementById('editReleaseTitleBtn')?.dataset.id;
    if (id) renameRelease(id);
  });
  document.getElementById('addItemToReleaseBtn')?.addEventListener('click', () => {
    if (state.activeReleaseId) addItemToRelease(state.activeReleaseId);
  });
  document.getElementById('copyWorkPackageBtn')?.addEventListener('click', async () => {
    const pre = document.getElementById('workPackagePreview');
    if (pre?.textContent) {
      await navigator.clipboard.writeText(pre.textContent);
      showNotice('Copied to clipboard!');
    }
  });

  // New release modal
  document.getElementById('newReleaseClose')?.addEventListener('click', closeNewReleaseModal);
  document.getElementById('newReleaseBackdrop')?.addEventListener('click', closeNewReleaseModal);
  document.getElementById('newReleaseSaveBtn')?.addEventListener('click', saveNewRelease);
  document.getElementById('newReleaseCancelBtn')?.addEventListener('click', closeNewReleaseModal);
  document.getElementById('newReleaseTitle')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveNewRelease();
  });

  // Project picker
  document.getElementById('projectPickerBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = document.getElementById('projectPickerMenu');
    if (menu?.hidden) openProjectPicker();
    else closeProjectPicker();
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#projectPicker')) closeProjectPicker();
  });

  // Settings project form
  document.getElementById('addProjectForm')?.addEventListener('submit', submitProjectForm);

  // Sort columns
  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (state.sort.key === key) {
        state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort.key = key;
        state.sort.dir = 'asc';
      }
      renderBoard();
    });
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeItemModal();
      closeNewReleaseModal();
      closeProjectPicker();
    }
  });
}

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  wire();
  try {
    await loadAll();
    renderNavProject();
    renderBoard();
    updateStatusCounts();
  } catch (err) {
    showNotice(`Failed to load: ${err.message}`, 'error');
  }
}

init();
