// Simple Working JS
const STORAGE_KEY = 'ledger_tasks_v1';
const THEME_KEY = 'ledger_theme_v1';
// State
let tasks = loadTasks();
let currentFilter = 'all';        // all | pending | completed
let currentCategory = 'all';
let searchTerm = '';
let dragSrcId = null;

// DOM Reference
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

// Storage helpers