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
// SESSION & NAVIGATION
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const boardsView = document.getElementById('boards-view-container');
  const projectsPage = document.getElementById('projects-page');
  const customTitle = document.getElementById('customTitle');

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
// FETCH & RENDER
// =======================================================
async function fetchTasks() {
  const { data: tasks, error } = await supabaseClient.from('tasks').select('*').order('created_at', { ascending: true });
  if (!error) renderTasks(tasks);
}

function renderTasks(tasks) {
  const lists = { 'todo': document.getElementById('todo-list'), 'in_progress': document.getElementById('inprogress-list'), 'done': document.getElementById('done-list') };
  Object.values(lists).forEach(l => { if(l) l.innerHTML = '' });
  
  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = "bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 w-full";
    const safeTask = JSON.stringify(task).replace(/"/g, '&quot;');
    
    card.innerHTML = `
      <div class="cursor-pointer" onclick="openDetailModal(${safeTask})">
        <p class="font-bold text-slate-800 text-[14px]">${task.title || 'Tanpa Judul'}</p>
        <p class="text-[11px] text-slate-400">${task.notes || ''}</p>
        ${task.deadline ? `<p class="text-[10px] text-rose-600 font-bold mt-1">🗓️ DL: ${task.deadline}</p>` : ''}
      </div>
      <div class="flex items-center justify-between mt-2 pt-2 border-t">
        <span class="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded">${task.worker_name || 'Anon'}</span>
        <button onclick="updateStatus(${task.id}, '${task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo'}')" class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Next →</button>
      </div>
    `;
    if (lists[task.status]) lists[task.status].appendChild(card);
  });
}

// =======================================================
// MODAL & MASTER ACTIONS
// =======================================================
function openModal() { document.getElementById('taskModal').classList.remove('hidden'); }
function closeModal() { document.getElementById('taskModal').classList.add('hidden'); }

async function submitModalTask() {
  const title = document.getElementById('modalTaskTitle').value;
  const notes = document.getElementById('modalTaskNotes').value;
  const deadline = document.getElementById('modalTaskDeadline').value;
  
  const { error } = await supabaseClient.from('tasks').insert([{ title, notes, deadline, status: 'todo', worker_name: currentWorker }]);
  if (error) alert(error.message);
  else { closeModal(); fetchTasks(); }
}

async function submitMasterNote(taskId) {
  const note = document.getElementById(`master-input-${taskId}`).value;
  const { error } = await supabaseClient.from('tasks').update({ master_notes: note }).eq('id', taskId);
  if (error) alert(error.message);
  else { alert("Arahan disimpan!"); fetchProjects(); }
}

function openDetailModal(task) {
  const modal = document.getElementById('detailModal');
  document.getElementById('detailTitle').innerText = task.title;
  document.getElementById('detailNotes').innerText = task.notes || '-';
  document.getElementById('detailMasterNotes').innerText = task.master_notes || 'Belum ada arahan.';
  modal.classList.remove('hidden');
}

// =======================================================
// UTILS & INIT
// =======================================================
async function updateStatus(taskId, newStatus) {
  await supabaseClient.from('tasks').update({ status: newStatus }).eq('id', taskId);
}

supabaseClient.channel('tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
  fetchTasks();
  fetchProjects();
}).subscribe();

document.addEventListener('DOMContentLoaded', checkSession);
