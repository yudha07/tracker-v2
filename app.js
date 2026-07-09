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
// MODAL CONTROLLER
// =======================================================
window.openModal = () => document.getElementById('taskModal').classList.remove('hidden');
window.closeModal = () => document.getElementById('taskModal').classList.add('hidden');

window.submitModalTask = async () => {
    const title = document.getElementById('modalTaskTitle').value;
    const notes = document.getElementById('modalTaskNotes').value;
    const deadline = document.getElementById('modalTaskDeadline').value;
    
    if (!title) return alert("Judul wajib diisi!");
    const { error } = await supabaseClient.from('tasks').insert([{ title, notes, deadline, status: 'todo', worker_name: currentWorker }]);
    if (error) alert(error.message);
    else { closeModal(); fetchTasks(); }
};

window.submitMasterNote = async (taskId) => {
    const note = document.getElementById(`master-input-${taskId}`).value;
    const { error } = await supabaseClient.from('tasks').update({ master_notes: note }).eq('id', taskId);
    if (error) alert(error.message);
    else alert("Arahan disimpan!");
};

window.openDetailModal = (task) => {
    document.getElementById('detailTitle').innerText = task.title;
    document.getElementById('detailNotes').innerText = task.notes || '-';
    document.getElementById('detailMasterNotes').innerText = task.master_notes || 'Belum ada arahan.';
    document.getElementById('detailModal').classList.remove('hidden');
};

// =======================================================
// SESSION & NAVIGATION
// =======================================================
window.handleLogin = function() {
    const name = document.getElementById('usernameInput').value.trim();
    if (!name) return alert('Nama wajib diisi!');
    localStorage.setItem('worker_name', name);
    currentWorker = name;
    checkSession();
};

window.handleLogout = function() {
    localStorage.removeItem('worker_name');
    window.location.reload(); 
};

function checkSession() {
    const worker = localStorage.getItem('worker_name');
    if (worker) {
        document.getElementById('login-panel').classList.add('hidden');
        document.getElementById('main-tracker').classList.remove('hidden');
        document.getElementById('currentUserDisplay').innerText = worker + (isMasterUser() ? " (Master)" : "");
        document.getElementById('avatarLetter').innerText = worker.charAt(0).toUpperCase();
        fetchTasks();
    }
}

window.switchTab = function(tabName) {
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
};

// =======================================================
// FETCH & RENDER
// =======================================================
async function fetchTasks() {
    const { data: tasks, error } = await supabaseClient.from('tasks').select('*').order('created_at', { ascending: false });
    if (error) console.error("Error:", error);
    else renderTasks(tasks);
}

async function fetchProjects() {
    const { data: tasks, error } = await supabaseClient.from('tasks').select('*').order('created_at', { ascending: false });
    if (error) console.error("Error:", error);
    else renderVerticalProjects(tasks);
}

function renderTasks(tasks) {
    const lists = { 'todo': document.getElementById('todo-list'), 'in_progress': document.getElementById('inprogress-list'), 'done': document.getElementById('done-list') };
    Object.values(lists).forEach(l => { if(l) l.innerHTML = '' });
    
    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = "bg-white p-4 rounded-xl border shadow-sm";
        const safeTask = JSON.stringify(task).replace(/"/g, '&quot;');
        
        card.innerHTML = `
            <div class="cursor-pointer" onclick="openDetailModal(${safeTask})">
                <p class="font-bold text-sm">${task.title}</p>
                <p class="text-[11px] text-slate-500 mt-1">${task.notes || ''}</p>
                ${task.deadline ? `<p class="text-[10px] text-rose-600 font-bold mt-1">🗓️ ${task.deadline}</p>` : ''}
            </div>
            <div class="mt-3 pt-2 border-t">
                ${isMasterUser() ? `
                    <input type="text" id="master-input-${task.id}" value="${task.master_notes || ''}" class="w-full text-[10px] p-1 border rounded mb-1" placeholder="Arahan master...">
                    <button onclick="submitMasterNote(${task.id})" class="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded w-full">Simpan Arahan</button>
                ` : `<p class="text-[10px] text-slate-400 italic mb-1">${task.master_notes ? 'Master: ' + task.master_notes : ''}</p>`}
                <button onclick="updateStatus(${task.id}, '${task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo'}')" class="mt-2 w-full text-[10px] font-bold text-blue-600 bg-blue-50 py-1 rounded">Next →</button>
            </div>
        `;
        if (lists[task.status]) lists[task.status].appendChild(card);
    });
}

function renderVerticalProjects(tasks) {
    const container = document.getElementById('projects-vertical-list');
    if(!container) return;
    container.innerHTML = tasks.map(t => `
        <div class="bg-white p-4 rounded-xl border flex justify-between items-center">
            <p class="font-bold text-sm">${t.title}</p>
            <span class="text-[10px] bg-slate-100 px-2 py-1 rounded">${t.worker_name || 'Anon'}</span>
        </div>
    `).join('');
}

window.updateStatus = async (taskId, newStatus) => {
    await supabaseClient.from('tasks').update({ status: newStatus }).eq('id', taskId);
    fetchTasks();
};

document.addEventListener('DOMContentLoaded', checkSession);
