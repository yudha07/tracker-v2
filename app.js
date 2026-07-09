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
        // Stringify aman untuk data JSON
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

// =======================================================
// LOGIN & SESSION
// =======================================================
window.handleLogin = function() {
    const name = document.getElementById('usernameInput').value.trim();
    if (!name) return alert('Nama wajib diisi!');
    localStorage.setItem('worker_name', name);
    currentWorker = name;
    checkSession();
};

function checkSession() {
    const worker = localStorage.getItem('worker_name');
    if (worker) {
        document.getElementById('login-panel').classList.add('hidden');
        document.getElementById('main-tracker').classList.remove('hidden');
        document.getElementById('currentUserDisplay').innerText = worker;
        document.getElementById('avatarLetter').innerText = worker.charAt(0).toUpperCase();
        fetchTasks();
    }
}

window.updateStatus = async (taskId, newStatus) => {
    await supabaseClient.from('tasks').update({ status: newStatus }).eq('id', taskId);
    fetchTasks();
};

document.addEventListener('DOMContentLoaded', checkSession);
