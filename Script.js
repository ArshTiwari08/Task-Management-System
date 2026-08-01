// =========================================================
// LEDGER — Task Manager
// =========================================================

const STORAGE_KEY = 'ledger_tasks_v1';
const THEME_KEY = 'ledger_theme_v1';

// ---------- State ----------
let tasks = loadTasks();
let currentFilter = 'all';        // all | pending | completed
let currentCategory = 'all';
let searchTerm = '';
let dragSrcId = null;

// ---------- DOM refs ----------
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const dueDateInput = document.getElementById('dueDate');
const priorityInput = document.getElementById('priority');
const categoryInput = document.getElementById('category');

const taskListEl = document.getElementById('taskList');
const emptyStateEl = document.getElementById('emptyState');

const searchInput = document.getElementById('searchInput');
const filterTabs = document.getElementById('filterTabs');
const categoryFilter = document.getElementById('categoryFilter');
const clearAllBtn = document.getElementById('clearAllBtn');

const statTotal = document.getElementById('statTotal');
const statActive = document.getElementById('statActive');
const statDone = document.getElementById('statDone');
const progressFill = document.getElementById('progressFill');
const progressPct = document.getElementById('progressPct');
const progressTrack = document.getElementById('progressTrack');

const themeToggle = document.getElementById('themeToggle');
const iconSun = document.getElementById('iconSun');
const iconMoon = document.getElementById('iconMoon');

const editModalOverlay = document.getElementById('editModalOverlay');
const editForm = document.getElementById('editForm');
const editId = document.getElementById('editId');
const editText = document.getElementById('editText');
const editDue = document.getElementById('editDue');
const editPriority = document.getElementById('editPriority');
const editCategory = document.getElementById('editCategory');
const cancelEdit = document.getElementById('cancelEdit');

// ---------- Storage helpers ----------
function loadTasks(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Failed to load tasks', e);
    return [];
  }
}

function saveTasks(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }catch(e){
    console.error('Failed to save tasks', e);
  }
}

// ---------- Theme ----------
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  iconSun.style.display = theme === 'dark' ? 'inline' : 'none';
  iconMoon.style.display = theme === 'dark' ? 'none' : 'inline';
  localStorage.setItem(THEME_KEY, theme);
}

(function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if(saved){
    applyTheme(saved);
  }else{
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
})();

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ---------- Utilities ----------
function uid(){
  return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function todayISO(){
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}

function formatDue(dateStr){
  if(!dateStr) return null;
  const [y,m,d] = dateStr.split('-').map(Number);
  const date = new Date(y, m-1, d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(task){
  if(!task.due || task.completed) return false;
  return task.due < todayISO();
}

function escapeHTML(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Rendering ----------
function render(){
  // Filter
  let visible = tasks.filter(t => {
    if(currentFilter === 'pending' && t.completed) return false;
    if(currentFilter === 'completed' && !t.completed) return false;
    if(currentCategory !== 'all' && t.category !== currentCategory) return false;
    if(searchTerm && !t.text.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  taskListEl.innerHTML = '';

  if(visible.length === 0){
    emptyStateEl.classList.add('show');
  }else{
    emptyStateEl.classList.remove('show');
  }

  visible.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-row' + (task.completed ? ' completed' : '');
    li.draggable = true;
    li.dataset.id = task.id;

    const overdue = isOverdue(task);
    const dueLabel = formatDue(task.due);

    li.innerHTML = `
      <span class="drag-handle" title="Drag to reorder">⠿</span>
      <span class="checkbox" role="checkbox" aria-checked="${task.completed}" tabindex="0" title="Mark ${task.completed ? 'pending' : 'complete'}">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </span>
      <div class="task-main">
        <div class="task-text">${escapeHTML(task.text)}</div>
        <div class="task-meta">
          <span class="chip priority-${task.priority}">${task.priority}</span>
          <span class="chip category">${escapeHTML(task.category)}</span>
          ${dueLabel ? `<span class="chip due ${overdue ? 'overdue' : ''}">${overdue ? '⚠ ' : '📅 '}${dueLabel}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn edit-btn" title="Edit">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="icon-btn delete delete-btn" title="Delete">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
        </button>
      </div>
    `;

    // Checkbox toggle
    li.querySelector('.checkbox').addEventListener('click', () => toggleComplete(task.id));
    li.querySelector('.checkbox').addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggleComplete(task.id); }
    });

    // Edit / Delete
    li.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task.id));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

    // Drag and drop
    li.addEventListener('dragstart', onDragStart);
    li.addEventListener('dragover', onDragOver);
    li.addEventListener('dragleave', onDragLeave);
    li.addEventListener('drop', onDrop);
    li.addEventListener('dragend', onDragEnd);

    taskListEl.appendChild(li);
  });

  renderStats();
}

function renderStats(){
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const active = total - done;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  statTotal.textContent = total;
  statActive.textContent = active;
  statDone.textContent = done;
  progressFill.style.width = pct + '%';
  progressPct.textContent = pct + '%';
  progressTrack.setAttribute('aria-valuenow', pct);
}

// ---------- CRUD ----------
function addTask(text, due, priority, category){
  tasks.unshift({
    id: uid(),
    text: text.trim(),
    due: due || null,
    priority,
    category,
    completed: false,
    createdAt: Date.now()
  });
  saveTasks();
  render();
}

function deleteTask(id){
  const row = taskListEl.querySelector(`[data-id="${id}"]`);
  if(row){
    row.style.transition = 'opacity .15s ease, transform .15s ease';
    row.style.opacity = '0';
    row.style.transform = 'translateX(8px)';
  }
  setTimeout(() => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
  }, 120);
}

function toggleComplete(id){
  const task = tasks.find(t => t.id === id);
  if(task){
    task.completed = !task.completed;
    saveTasks();
    render();
  }
}

function updateTask(id, data){
  const task = tasks.find(t => t.id === id);
  if(task){
    Object.assign(task, data);
    saveTasks();
    render();
  }
}

function clearAllTasks(){
  if(tasks.length === 0) return;
  const ok = confirm('Clear all entries? This cannot be undone.');
  if(!ok) return;
  tasks = [];
  saveTasks();
  render();
}

// ---------- Edit modal ----------
function openEditModal(id){
  const task = tasks.find(t => t.id === id);
  if(!task) return;
  editId.value = task.id;
  editText.value = task.text;
  editDue.value = task.due || '';
  editPriority.value = task.priority;
  editCategory.value = task.category;
  editModalOverlay.classList.add('show');
  setTimeout(() => editText.focus(), 50);
}

function closeEditModal(){
  editModalOverlay.classList.remove('show');
}

cancelEdit.addEventListener('click', closeEditModal);
editModalOverlay.addEventListener('click', e => {
  if(e.target === editModalOverlay) closeEditModal();
});
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && editModalOverlay.classList.contains('show')) closeEditModal();
});

editForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = editText.value.trim();
  if(!text) return;
  updateTask(editId.value, {
    text,
    due: editDue.value || null,
    priority: editPriority.value,
    category: editCategory.value
  });
  closeEditModal();
});

// ---------- Drag and drop reorder ----------
function onDragStart(e){
  dragSrcId = this.dataset.id;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcId);
}

function onDragOver(e){
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if(this.dataset.id !== dragSrcId) this.classList.add('drag-over');
}

function onDragLeave(){
  this.classList.remove('drag-over');
}

function onDrop(e){
  e.preventDefault();
  this.classList.remove('drag-over');
  const targetId = this.dataset.id;
  if(!dragSrcId || dragSrcId === targetId) return;

  const srcIndex = tasks.findIndex(t => t.id === dragSrcId);
  const targetIndex = tasks.findIndex(t => t.id === targetId);
  if(srcIndex === -1 || targetIndex === -1) return;

  const [moved] = tasks.splice(srcIndex, 1);
  tasks.splice(targetIndex, 0, moved);

  saveTasks();
  render();
}

function onDragEnd(){
  this.classList.remove('dragging');
  document.querySelectorAll('.task-row.drag-over').forEach(el => el.classList.remove('drag-over'));
  dragSrcId = null;
}

// ---------- Form submit ----------
taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if(!text) return;
  addTask(text, dueDateInput.value, priorityInput.value, categoryInput.value);
  taskForm.reset();
  priorityInput.value = 'medium';
  taskInput.focus();
});

// ---------- Search / filter / category ----------
searchInput.addEventListener('input', () => {
  searchTerm = searchInput.value;
  render();
});

filterTabs.addEventListener('click', e => {
  const btn = e.target.closest('.tab');
  if(!btn) return;
  currentFilter = btn.dataset.filter;
  [...filterTabs.querySelectorAll('.tab')].forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  render();
});

categoryFilter.addEventListener('change', () => {
  currentCategory = categoryFilter.value;
  render();
});

clearAllBtn.addEventListener('click', clearAllTasks);

// ---------- Init ----------
render();