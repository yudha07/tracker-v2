// =======================================================
// CONFIGURATION
// =======================================================
const SUPABASE_URL = "https://bawlxbtnocmangcblngu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZZvJjet_A_XfGmqfNJhPOg_-P3z_snJ"; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentWorker = localStorage.getItem('worker_name') || '';

const MASTER_USERS = ["yudha", "Yudha", "Jufri", "jufri", "danra", "Danra", "nadya", "Nadya"]; 

function isMasterUser() {
  if (!currentWorker) return false;
  return MASTER_USERS.map(v => v.toLowerCase()).includes(currentWorker.toLowerCase());
}

// =======================================================
// NAVIGATION & SESSION
// =======================================================
function checkSession() {
  const loginPanel = document.getElementById('login-panel');
  const mainTracker = document.getElementById('main-tracker');
  const userDisplay = document.getElementById('currentUserDisplay');
  const avatarLetter = document.getElementById('avatarLetter');

  if (currentWorker) {
    if (loginPanel) loginPanel.classList.add('hidden');
    if (mainTracker) mainTracker.classList.remove('hidden');
    if (userDisplay) userDisplay.innerText = currentWorker + (isMasterUser() ? " (Master)" : "");
    if (avatarLetter) avatarLetter.innerText = currentWorker.charAt(0).toUpperCase();
    switchTab('boards');
  } else {
    if (loginPanel) loginPanel.classList.remove('hidden');
    if (mainTracker) mainTracker.classList.add('hidden');
  }
}

function switchTab(tabName) {
  // Auto scroll ke atas saat pindah tab agar tidak terjebak di bawah pada mobile
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const boardsView = document.getElementById('boards-view-container');
  const projectsPage = document.getElementById('projects-page');
  const customTitle = document.getElementById('customTitle');

  // Update Tampilan
  if (tabName === 'boards') {
    if (boardsView) boardsView.classList.remove('hidden');
    if (projectsPage) projectsPage.classList.add('hidden');
    if (customTitle) customTitle.innerText = "Dashboards";
    fetchTasks();
  } else {
    if (boardsView) boardsView.classList.add('hidden');
    if (projectsPage) projectsPage.classList.remove('hidden');
    if (customTitle) customTitle.innerText = "All Projects";
    fetchProjects();
  }
}

// =======================================================
// RENDERING (Mobile Optimized)
// =======================================================
function renderTasks(tasks) {
  const lists = {
    'todo': document.getElementById('todo-list'),
    'in_progress': document.getElementById('inprogress-list'),
    'done': document.getElementById('done-list')
  };

  Object.values(lists).forEach(list => list.innerHTML = '');
  
  tasks.forEach(task => {
    const card = document.createElement('div');
    // Class dibuat lebih ringkas untuk mobile
    card.className = "bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 w-full hover:shadow-md transition-all";
    
    const isOwner = currentWorker.toLowerCase() === (task.worker_name || '').toLowerCase();
    const safeTaskJson = JSON.stringify(task).replace(/"/g, '&quot;');

    card.innerHTML = `
      <div onclick="openDetailModal(${safeTaskJson})" class="cursor-pointer">
        <p class="font-bold text-slate-800 text-[14px] leading-snug break-words">${task.title || 'Tanpa Judul'}</p>
        <p class="text-[11px] text-slate-400 mt-1 line-clamp-2">${task.notes || ''}</p>
      </div>
      <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
        <span class="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-md">${task.worker_name || 'Anon'}</span>
        ${isOwner ? `<button onclick="updateStatus(${task.id}, '${task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo'}')" class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Next →</button>` : ''}
      </div>
    `;

    if (lists[task.status]) lists[task.status].appendChild(card);
  });
}

// =======================================================
// MODAL & UTILS
// =======================================================
// Fungsi updateStatus, submitModalTask, fetchProjects, dll tetap sama
// Pastikan semua fungsi async memiliki error handling seperti kode lama Anda.

async function updateStatus(taskId, newStatus) {
  const { error } = await supabaseClient.from('tasks').update({ status: newStatus }).eq('id', taskId);
  if (error) alert('Error: ' + error.message);
}

function handleLogin() {
  const name = document.getElementById('usernameInput').value.trim();
  if (!name) return alert('Nama wajib diisi!');
  localStorage.setItem('worker_name', name);
  currentWorker = name;
  checkSession();
}

function handleLogout() {
  localStorage.removeItem('worker_name');
  currentWorker = '';
  checkSession();
}

// Subscribe real-time
supabaseClient.channel('tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
  fetchTasks();
  fetchProjects();
}).subscribe();

document.addEventListener('DOMContentLoaded', checkSession);
