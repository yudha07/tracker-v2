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
// MODAL CONTROLLER (ADD TASK & DETAIL)
// =======================================================
window.openModal = () => document.getElementById('taskModal').classList.remove('hidden');
window.closeModal = () => document.getElementById('taskModal').classList.add('hidden');

window.submitModalTask = async () => {
    const title = document.getElementById('modalTaskTitle').value;
    const notes = document.getElementById('modalTaskNotes').value;
    const deadline = document.getElementById('modalTaskDeadline').value;
    
    if (!title) return alert("Judul wajib diisi!");
    
    const { error } = await supabaseClient.from('tasks').insert([{ 
        title, notes, deadline, status: 'todo', worker_name: currentWorker 
    }]);
    
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
// LOGIN & SESSION LOGIC
// =======================================================
window.handleLogin = function() {
    const input = document.getElementById('usernameInput');
    const name = input ? input.value.trim() : '';
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
    const loginPanel = document.getElementById('login-panel');
    const mainTracker = document.getElementById('main-tracker');
    if (currentWorker) {
        if (loginPanel) loginPanel.classList.add('hidden');
        if (mainTracker) mainTracker.classList.remove('hidden');
        const userDisplay = document.getElementById('currentUserDisplay');
        const avatarLetter = document.getElementById('avatarLetter');
        if (userDisplay) userDisplay.innerText = currentWorker + (isMasterUser() ? " (Master)" : "");
        if (avatarLetter) avatarLetter.innerText = currentWorker.charAt(0).toUpperCase();
        fetchTasks();
    } else {
        if (loginPanel) loginPanel.classList.remove('hidden');
        if (mainTracker) mainTracker.classList.add('hidden');
    }
}

// =======================================================
// FETCH & RENDER
// =======================================================
async function fetchTasks() {
    const { data: tasks, error } = await supabaseClient.from('tasks').select('*').order('created_at', { ascending: false });
    if (error) console.error("Error:", error);
    else renderTasks(tasks);
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
                ${task.deadline ? `<p class="text-[10px] text-rose-600 font-bold">🗓️ ${task.deadline}</p>` : ''}
            </div>
            ${isMasterUser() ? `<input type="text" id="master-input-${task.id}" class="w-full text-[10px] p-1 border rounded my-1" placeholder="Arahan master...">
            <button onclick="submitMasterNote(${task.id})" class="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded">Simpan</button>` : ''}
            <button onclick="updateStatus(${task.id}, '${task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo'}')" class="mt-2 w-full text-[10px] font-bold text-blue-600 bg-blue-50 py-1 rounded">Next →</button>
        `;
        if (lists[task.status]) lists[task.status].appendChild(card);
    });
}

window.switchTab = function(tabName) {
    document.getElementById('boards-view-container').classList.toggle('hidden', tabName !== 'boards');
    document.getElementById('projects-page').classList.toggle('hidden', tabName === 'boards');
    document.getElementById('customTitle').innerText = tabName === 'boards' ? "Dashboards" : "All Projects";
    if (tabName === 'boards') fetchTasks();
    else fetchProjects();
};

window.updateStatus = async function(taskId, newStatus) {
    await supabaseClient.from('tasks').update({ status: newStatus }).eq('id', taskId);
    fetchTasks();
};

document.addEventListener('DOMContentLoaded', checkSession);
