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
// FETCH DATA (Pusat Data)
// =======================================================
async function fetchTasks() {
  const { data: tasks, error } = await supabaseClient.from('tasks').select('*').order('created_at', { ascending: false });
  if (error) console.error("Error fetch tasks:", error);
  else renderTasks(tasks);
}

async function fetchProjects() {
  const { data: tasks, error } = await supabaseClient.from('tasks').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetch projects:", error);
  } else {
    renderVerticalProjects(tasks);
  }
}

// =======================================================
// RENDERING
// =======================================================
function renderTasks(tasks) {
  const lists = { 'todo': document.getElementById('todo-list'), 'in_progress': document.getElementById('inprogress-list'), 'done': document.getElementById('done-list') };
  Object.values(lists).forEach(list => { if(list) list.innerHTML = '' });
  
  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = "bg-white p-4 rounded-xl border border-slate-100 shadow-sm";
    card.innerHTML = `
      <p class="font-bold text-sm">${task.title || 'Tanpa Judul'}</p>
      <p class="text-[11px] text-slate-400">${task.notes || ''}</p>
      <button onclick="updateStatus(${task.id}, '${task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo'}')" class="mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Next →</button>
    `;
    if (lists[task.status]) lists[task.status].appendChild(card);
  });
}

function renderVerticalProjects(tasks) {
  const container = document.getElementById('projects-vertical-list');
  if(!container) return;
  
  if (tasks.length === 0) {
    container.innerHTML = `<p class="text-sm text-slate-400 p-4">Belum ada project.</p>`;
    return;
  }

  container.innerHTML = tasks.map(t => `
    <div class="bg-white p-4 rounded-xl border flex justify-between items-center">
      <div>
        <p class="font-bold text-sm">${t.title}</p>
        <p class="text-[11px] text-slate-400">Status: ${t.status}</p>
      </div>
      <span class="text-[10px] bg-slate-100 px-2 py-1 rounded">${t.worker_name || 'Anon'}</span>
    </div>
  `).join('');
}

// =======================================================
// ACTIONS & NAVIGATION
// =======================================================
function switchTab(tabName) {
  const boardsView = document.getElementById('boards-view-container');
  const projectsPage = document.getElementById('projects-page');
  const customTitle = document.getElementById('customTitle');

  if (tabName === 'boards') {
    boardsView.classList.remove('hidden');
    projectsPage.classList.add('hidden');
    customTitle.innerText = "Dashboards";
    fetchTasks();
  } else {
    boardsView.classList.add('hidden');
    projectsPage.classList.remove('hidden');
    customTitle.innerText = "All Projects";
    fetchProjects();
  }
}

async function updateStatus(taskId, newStatus) {
  await supabaseClient.from('tasks').update({ status: newStatus }).eq('id', taskId);
  fetchTasks();
  fetchProjects();
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    fetchTasks(); // Load data awal
});
