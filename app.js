// Konfigurasi
const SUPABASE_URL = "https://bawlxbtnocmangcblngu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZZvJjet_A_XfGmqfNJhPOg_-P3z_snJ"; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentWorker = localStorage.getItem('worker_name') || '';

function handleLogin() {
  const input = document.getElementById('usernameInput');
  if (!input || !input.value.trim()) return alert('Nama wajib diisi!');
  localStorage.setItem('worker_name', input.value.trim());
  currentWorker = input.value.trim();
  checkSession();
}

function checkSession() {
  const loginPanel = document.getElementById('login-panel');
  const mainTracker = document.getElementById('main-tracker');
  
  if (currentWorker) {
    if (loginPanel) loginPanel.classList.add('hidden');
    if (mainTracker) mainTracker.classList.remove('hidden');
    // Tambahan untuk load data
    if (typeof fetchTasks === 'function') fetchTasks();
  } else {
    if (loginPanel) loginPanel.classList.remove('hidden');
    if (mainTracker) mainTracker.classList.add('hidden');
  }
}

// Pastikan fungsi ini didefinisikan agar tidak error
window.handleLogin = handleLogin;
window.checkSession = checkSession;

document.addEventListener('DOMContentLoaded', () => {
    console.log("App initialized");
    checkSession();
});
