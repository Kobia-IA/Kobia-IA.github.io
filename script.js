// script.js - Modern Vibrant Edition
const STORAGE_KEY_MEMBERS = 'CLASS_GROUP_MEMBERS_V4';
const STORAGE_KEY_INFO = 'CLASS_GROUP_INFO_V4';
const STORAGE_KEY_POLLS = 'CLASS_GROUP_POLLS_V4';
const STORAGE_KEY_ATTENDANCE = 'CLASS_GROUP_ATTENDANCE_V4';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Felix',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Liam',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sophia',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Alex',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Brian'
];

const DEFAULT_GROUP_INFO = {
  name: 'Tổ 1 - Lớp KTPM',
  motto: 'Học hết sức - Chơi hết mình 🚀',
  notice: '🎉 Thông báo quan trọng: Chiều thứ 6 tuần này cả tổ đi ăn liên hoan nhé. Các bạn chú ý tham gia bình chọn địa điểm!'
};

const DEFAULT_MEMBERS = [
  { id: 'm1', username: 'totruong', password: '123', fullName: 'Nguyễn Hữu Khánh', role: 'LEADER', canManage: true, duty: 'Tổ trưởng / Điều hành chung', phone: '0901 234 567', avatar: PRESET_AVATARS[0] },
  { id: 'm2', username: 'topho', password: '123', fullName: 'Lê Minh Tâm', role: 'MEMBER', canManage: true, duty: 'Tổ phó / Quản lý quỹ', phone: '0912 345 678', avatar: PRESET_AVATARS[1] },
  { id: 'm3', username: 'thanhvien', password: '123', fullName: 'Trần Hải Đăng', role: 'MEMBER', canManage: false, duty: 'Thành viên / Trực nhật', phone: '0923 456 789', avatar: PRESET_AVATARS[2] }
];

let members = [], groupInfo = {}, polls = [], attendances = [];
let currentUser = null;

window.addEventListener('DOMContentLoaded', () => {
  loadDataFromStorage();
  renderPresetAvatars();

  // Luôn bắt đầu ở màn hình đăng nhập
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    login(document.getElementById('login-username').value.trim(), document.getElementById('login-password').value.trim());
  });
});

function loadDataFromStorage() {
  members = JSON.parse(localStorage.getItem(STORAGE_KEY_MEMBERS)) || JSON.parse(JSON.stringify(DEFAULT_MEMBERS));
  groupInfo = JSON.parse(localStorage.getItem(STORAGE_KEY_INFO)) || JSON.parse(JSON.stringify(DEFAULT_GROUP_INFO));
  polls = JSON.parse(localStorage.getItem(STORAGE_KEY_POLLS)) || [];
  attendances = JSON.parse(localStorage.getItem(STORAGE_KEY_ATTENDANCE)) || [];
  saveDataToStorage();
}

function saveDataToStorage() {
  localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
  localStorage.setItem(STORAGE_KEY_INFO, JSON.stringify(groupInfo));
  localStorage.setItem(STORAGE_KEY_POLLS, JSON.stringify(polls));
  localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(attendances));
}

function login(username, password) {
  const user = members.find(m => m.username.toLowerCase() === username.toLowerCase() && m.password === password);
  const errEl = document.getElementById('login-error');
  if (!user) { errEl.textContent = '❌ Tên đăng nhập hoặc mật khẩu chưa đúng.'; errEl.classList.remove('hidden'); return; }
  errEl.classList.add('hidden');
  currentUser = user;
  
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  
  enterApp();
  showToast(`Chào mừng ${user.fullName} đã trở lại! 🎉`, 'success');
}

function logout() {
  currentUser = null;
  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

function enterApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  refreshUI();
  switchTab('overview');
}

function refreshUI() {
  if (!currentUser) return;
  currentUser = members.find(m => m.id === currentUser.id) || currentUser;

  document.getElementById('header-group-name').textContent = groupInfo.name;
  document.getElementById('header-group-motto').textContent = groupInfo.motto;
  document.getElementById('current-user-avatar').src = currentUser.avatar;
  document.getElementById('current-user-name').textContent = currentUser.fullName;

  const badgeEl = document.getElementById('current-user-badge');
  if (currentUser.role === 'LEADER') {
    badgeEl.textContent = 'Tổ Trưởng'; badgeEl.className = 'text-[10px] uppercase font-bold tracking-wider rounded-md px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm';
  } else if (currentUser.canManage) {
    badgeEl.textContent = 'Ban Cán Sự'; badgeEl.className = 'text-[10px] uppercase font-bold tracking-wider rounded-md px-2 py-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-sm';
  } else {
    badgeEl.textContent = 'Thành Viên'; badgeEl.className = 'text-[10px] uppercase font-bold tracking-wider rounded-md px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200';
  }

  document.getElementById('stat-total-members').textContent = members.length;
  document.getElementById('stat-admin-members').textContent = members.filter(m => m.role === 'LEADER' || m.canManage).length;
  document.getElementById('stat-notice').textContent = groupInfo.notice;

  renderMembers();
  renderPolls();
  renderAttendances();

  document.getElementById('profile-preview-avatar').src = currentUser.avatar;
  document.getElementById('profile-fullname').value = currentUser.fullName;
  document.getElementById('profile-phone').value = currentUser.phone || '';
  document.getElementById('profile-duty').value = currentUser.duty || '';
  document.getElementById('profile-password').value = currentUser.password || '';

  const hasAdmin = currentUser.role === 'LEADER' || currentUser.canManage;
  
  document.getElementById('tab-btn-admin').classList.toggle('hidden', !hasAdmin);
  document.getElementById('mob-tab-admin').classList.toggle('hidden', !hasAdmin);
  
  const pollBtnContainer = document.getElementById('btn-show-create-poll-container');
  if (pollBtnContainer) pollBtnContainer.classList.toggle('hidden', !hasAdmin);
  
  const attendanceBtnContainer = document.getElementById('btn-create-attendance-container');
  if (attendanceBtnContainer) attendanceBtnContainer.classList.toggle('hidden', !hasAdmin);

  if (hasAdmin) {
    document.getElementById('admin-group-name').value = groupInfo.name;
    document.getElementById('admin-group-motto').value = groupInfo.motto;
    document.getElementById('admin-group-notice').value = groupInfo.notice;
    renderAdminTable();
  }
}

function switchTab(tabName) {
  if (tabName === 'admin' && !(currentUser.role === 'LEADER' || currentUser.canManage)) return;
  ['overview', 'polls', 'attendance', 'profile', 'admin'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== tabName);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (btn) btn.classList.toggle('active', t === tabName);
    
    // Mobile Tab handling
    const mBtn = document.getElementById(`mob-tab-${t}`);
    if (mBtn) {
      if (t === tabName) { 
        mBtn.className = `shrink-0 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 transition-colors ${t==='admin'?'':'block'}`;
      } else { 
        mBtn.className = `shrink-0 px-4 py-2 text-xs font-bold rounded-xl text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors ${t==='admin' && !(currentUser.role === 'LEADER' || currentUser.canManage) ? 'hidden':'block'}`;
      }
    }
  });
}

// ================= THÀNH VIÊN =================
function renderMembers() {
  const keyword = (document.getElementById('search-member')?.value || '').toLowerCase();
  const filter = document.getElementById('filter-role')?.value || 'ALL';
  const grid = document.getElementById('member-grid');

  const filtered = members.filter(m => {
    const match = m.fullName.toLowerCase().includes(keyword) || m.username.toLowerCase().includes(keyword);
    if (!match) return false;
    if (filter === 'LEADER') return m.role === 'LEADER';
    if (filter === 'MANAGER') return m.role === 'LEADER' || m.canManage;
    if (filter === 'MEMBER') return m.role !== 'LEADER' && !m.canManage;
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">Không tìm thấy ai phù hợp 🧐</div>`;
    return;
  }

  grid.innerHTML = filtered.map(m => {
    let badge = `<span class="text-[10px] font-bold tracking-wider px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">Thành viên</span>`;
    let borderColors = 'border-slate-100 hover:border-indigo-200';
    
    if (m.role === 'LEADER') {
      badge = `<span class="text-[10px] font-bold tracking-wider px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg shadow-sm"><i class="fa-solid fa-crown mr-1"></i>Tổ Trưởng</span>`;
      borderColors = 'border-amber-100 hover:border-amber-300';
    } else if (m.canManage) {
      badge = `<span class="text-[10px] font-bold tracking-wider px-2.5 py-1 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-lg shadow-sm"><i class="fa-solid fa-shield-halved mr-1"></i>Ban Cán Sự</span>`;
      borderColors = 'border-emerald-100 hover:border-emerald-300';
    }

    return `
      <div class="bg-white rounded-3xl border-2 ${borderColors} p-5 hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden">
        <div class="flex items-center space-x-4 mb-4 relative z-10">
          <div class="relative">
             <img src="${m.avatar}" class="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md bg-slate-50 group-hover:rotate-3 transition-transform" />
             ${m.role === 'LEADER' ? '<div class="absolute -top-2 -right-2 text-amber-500 text-lg drop-shadow"><i class="fa-solid fa-crown"></i></div>' : ''}
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-extrabold text-slate-800 text-lg truncate">${m.fullName}</h4>
            <p class="text-xs font-bold text-indigo-400 mb-2">@${m.username}</p>
            ${badge}
          </div>
        </div>
        <div class="pt-4 border-t border-slate-100 text-sm space-y-2 mt-auto relative z-10">
          <div class="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
            <span class="text-slate-400 font-bold text-xs"><i class="fa-solid fa-briefcase mr-1"></i> Nhiệm vụ</span>
            <span class="font-bold text-slate-700 text-right truncate w-32" title="${m.duty || '-'}">${m.duty || '-'}</span>
          </div>
          <div class="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
            <span class="text-slate-400 font-bold text-xs"><i class="fa-solid fa-phone mr-1"></i> Liên hệ</span>
            <span class="font-bold text-indigo-600 text-right">${m.phone || '-'}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ================= BÌNH CHỌN =================
function togglePollForm() {
  const form = document.getElementById('form-create-poll');
  form.classList.toggle('hidden');
}

function createNewPoll(e) {
  e.preventDefault();
  const title = document.getElementById('poll-title').value.trim();
  const optionsText = document.getElementById('poll-options').value.trim();
  
  if (!title || !optionsText) return showToast('Vui lòng điền đủ thông tin', 'error');
  
  const options = optionsText.split('\n').map(opt => opt.trim()).filter(opt => opt !== '').map((opt, idx) => ({
    id: 'opt_' + Date.now() + '_' + idx,
    text: opt,
    votes: []
  }));

  if (options.length < 2) return showToast('Cần ít nhất 2 lựa chọn', 'error');

  polls.unshift({
    id: 'poll_' + Date.now(),
    title,
    options,
    createdBy: currentUser.id,
    createdAt: Date.now()
  });

  saveDataToStorage();
  renderPolls();
  
  document.getElementById('poll-title').value = '';
  document.getElementById('poll-options').value = '';
  togglePollForm();
  showToast('Đã tạo bình chọn mới 🎯', 'success');
}

function votePoll(pollId, optionId) {
  const poll = polls.find(p => p.id === pollId);
  if (!poll) return;

  poll.options.forEach(opt => { opt.votes = opt.votes.filter(uid => uid !== currentUser.id); });
  const selectedOpt = poll.options.find(o => o.id === optionId);
  if (selectedOpt) selectedOpt.votes.push(currentUser.id);

  saveDataToStorage();
  renderPolls();
}

function deletePoll(pollId) {
  if (!confirm('Bạn có chắc chắn muốn xóa bình chọn này?')) return;
  polls = polls.filter(p => p.id !== pollId);
  saveDataToStorage();
  renderPolls();
  showToast('Đã xóa bình chọn 🗑️', 'success');
}

function renderPolls() {
  const container = document.getElementById('polls-list');
  if (polls.length === 0) {
    container.innerHTML = `<div class="col-span-full py-16 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">Chưa có bình chọn nào đang mở 📪</div>`;
    return;
  }

  const hasAdmin = currentUser.role === 'LEADER' || currentUser.canManage;

  container.innerHTML = polls.map(p => {
    const totalVotes = p.options.reduce((acc, opt) => acc + opt.votes.length, 0);
    const creator = members.find(m => m.id === p.createdBy)?.fullName || 'Ẩn danh';
    const dateStr = new Date(p.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    // Xác định max vote để highlight
    let maxVote = 0;
    p.options.forEach(o => { if(o.votes.length > maxVote) maxVote = o.votes.length; });

    const optionsHtml = p.options.map(opt => {
      const isVotedByMe = opt.votes.includes(currentUser.id);
      const isTop = opt.votes.length === maxVote && maxVote > 0;
      const percent = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100);
      
      let barColor = isVotedByMe ? 'bg-indigo-500' : (isTop ? 'bg-purple-400' : 'bg-slate-200');
      let textColor = isVotedByMe ? 'text-white' : 'text-slate-700';

      return `
        <div class="relative cursor-pointer group mb-3 overflow-hidden rounded-xl bg-slate-50 border ${isVotedByMe ? 'border-indigo-500 shadow-md' : 'border-slate-200 hover:border-indigo-300'} transition-all" onclick="votePoll('${p.id}', '${opt.id}')">
          <div class="absolute top-0 left-0 h-full ${barColor} opacity-20 transition-all duration-700 ease-out" style="width: ${percent}%"></div>
          <div class="relative flex justify-between items-center p-4">
            <div class="flex items-center space-x-3 z-10">
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center ${isVotedByMe ? 'border-indigo-600 bg-indigo-100' : 'border-slate-300 bg-white group-hover:border-indigo-400'}">
                ${isVotedByMe ? '<div class="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>' : ''}
              </div>
              <span class="font-bold ${isVotedByMe ? 'text-indigo-800' : 'text-slate-700 group-hover:text-indigo-600'}">${opt.text} ${isTop ? '🔥' : ''}</span>
            </div>
            <span class="text-sm font-extrabold ${isVotedByMe ? 'text-indigo-600' : 'text-slate-500'} z-10">${percent}% <span class="text-xs font-semibold text-slate-400">(${opt.votes.length})</span></span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col relative">
        <div class="flex justify-between items-start mb-6">
          <div class="pr-6">
            <h4 class="font-extrabold text-slate-800 text-xl leading-tight mb-2">${p.title}</h4>
            <p class="text-xs text-indigo-400 font-bold bg-indigo-50 inline-block px-2 py-1 rounded-md">Tạo bởi ${creator} • ${dateStr}</p>
          </div>
          ${hasAdmin ? `<button onclick="deletePoll('${p.id}')" class="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition shadow-sm"><i class="fa-solid fa-trash-can"></i></button>` : ''}
        </div>
        <div class="flex-1">
          ${optionsHtml}
        </div>
        <p class="text-xs font-bold text-slate-400 mt-4 text-center">Tổng cộng: ${totalVotes} lượt bình chọn</p>
      </div>
    `;
  }).join('');
}

// ================= ĐIỂM DANH =================
function createNewAttendance() {
  const title = prompt('Nhập tiêu đề điểm danh (VD: Sinh hoạt lớp 20/11):');
  if (!title) return;

  attendances.unshift({
    id: 'att_' + Date.now(),
    title,
    presentIds: [],
    createdBy: currentUser.id,
    createdAt: Date.now()
  });

  saveDataToStorage();
  renderAttendances();
  showToast('Đã mở phiên điểm danh mới 📝', 'success');
}

function checkIn(attId) {
  const att = attendances.find(a => a.id === attId);
  if (!att) return;

  if (!att.presentIds.includes(currentUser.id)) {
    att.presentIds.push(currentUser.id);
    saveDataToStorage();
    renderAttendances();
    showToast('Điểm danh thành công! ✋', 'success');
  }
}

function deleteAttendance(attId) {
  if (!confirm('Bạn có chắc chắn muốn xóa phiên điểm danh này?')) return;
  attendances = attendances.filter(a => a.id !== attId);
  saveDataToStorage();
  renderAttendances();
  showToast('Đã xóa phiên điểm danh 🗑️', 'success');
}

function renderAttendances() {
  const container = document.getElementById('attendance-list');
  if (attendances.length === 0) {
    container.innerHTML = `<div class="py-16 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">Chưa có phiên điểm danh nào.</div>`;
    return;
  }

  const hasAdmin = currentUser.role === 'LEADER' || currentUser.canManage;

  container.innerHTML = attendances.map(att => {
    const creator = members.find(m => m.id === att.createdBy)?.fullName || 'Ẩn danh';
    const dateStr = new Date(att.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const isCheckedIn = att.presentIds.includes(currentUser.id);
    const presentCount = att.presentIds.length;
    const totalCount = members.length;
    const percent = totalCount === 0 ? 0 : Math.round((presentCount / totalCount) * 100);

    let adminViewHtml = '';
    if (hasAdmin) {
      const presentNames = att.presentIds.map(id => {
        const m = members.find(x => x.id === id);
        return m ? m.fullName : 'Unknown';
      });
      adminViewHtml = `
        <div class="mt-6 pt-5 border-t border-slate-100">
          <div class="flex justify-between items-center mb-3">
             <p class="text-xs font-bold text-slate-500 uppercase">Đã có mặt (${presentCount}/${totalCount})</p>
             <span class="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">${percent}%</span>
          </div>
          <div class="flex flex-wrap gap-2">
            ${presentNames.length > 0 
              ? presentNames.map(name => `<span class="text-xs font-bold bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg shadow-sm flex items-center"><div class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></div>${name}</span>`).join('') 
              : `<span class="text-xs text-slate-400 font-semibold italic bg-slate-50 px-3 py-1.5 rounded-lg">Chưa có ai điểm danh</span>`}
          </div>
        </div>
      `;
    }

    return `
      <div class="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border ${isCheckedIn && !hasAdmin ? 'border-emerald-300 ring-4 ring-emerald-50' : 'border-slate-100'} relative overflow-hidden">
        ${isCheckedIn && !hasAdmin ? '<div class="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0"></div>' : ''}
        
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-5 relative z-10">
          <div>
            <h4 class="font-extrabold text-slate-800 text-xl leading-tight flex items-center gap-2">
              ${att.title}
              ${isCheckedIn ? '<i class="fa-solid fa-circle-check text-emerald-500 text-2xl drop-shadow-sm" title="Đã điểm danh"></i>' : ''}
            </h4>
            <p class="text-xs font-bold text-emerald-500 bg-emerald-50 inline-block px-2 py-1 rounded-md mt-3">Tạo bởi ${creator} • ${dateStr}</p>
          </div>
          
          <div class="flex items-center gap-3 shrink-0">
            ${!isCheckedIn 
              ? `<button onclick="checkIn('${att.id}')" class="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition active:scale-[0.98]"><i class="fa-solid fa-hand-sparkles mr-1.5"></i> Có mặt!</button>`
              : `<span class="px-6 py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-extrabold cursor-default shadow-sm"><i class="fa-solid fa-check-double mr-1.5"></i> Đã Ghi Nhận</span>`
            }
            ${hasAdmin ? `<button onclick="deleteAttendance('${att.id}')" class="w-12 h-12 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition shadow-sm bg-rose-50 border border-rose-100"><i class="fa-solid fa-trash-can"></i></button>` : ''}
          </div>
        </div>
        
        ${hasAdmin ? `
        <div class="mt-5 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div class="bg-gradient-to-r from-emerald-400 to-teal-500 h-2.5 rounded-full transition-all duration-1000" style="width: ${percent}%"></div>
        </div>` : ''}

        ${adminViewHtml}
      </div>
    `;
  }).join('');
}

// ================= HỒ SƠ & QUẢN TRỊ =================
function renderPresetAvatars() {
  document.getElementById('preset-avatars').innerHTML = PRESET_AVATARS.map(url => 
    `<img src="${url}" onclick="updateAvatar('${url}')" class="w-12 h-12 rounded-xl border-2 border-slate-200 hover:border-indigo-500 bg-white cursor-pointer transition transform hover:scale-110 object-cover" />`
  ).join('');
}

function applyAvatarUrl() {
  const url = document.getElementById('profile-avatar-url').value.trim();
  if (url) { updateAvatar(url); document.getElementById('profile-avatar-url').value = ''; }
}

function handleAvatarFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 300;
      const ctx = canvas.getContext('2d');
      const minDim = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - minDim) / 2, (img.height - minDim) / 2, minDim, minDim, 0, 0, 300, 300);
      updateAvatar(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateAvatar(url) {
  members.find(m => m.id === currentUser.id).avatar = url;
  saveDataToStorage(); refreshUI(); showToast('Đổi ảnh đại diện thành công ✨', 'success');
}

function saveMyProfile(e) {
  e.preventDefault();
  const m = members.find(m => m.id === currentUser.id);
  m.fullName = document.getElementById('profile-fullname').value.trim();
  m.phone = document.getElementById('profile-phone').value.trim();
  m.duty = document.getElementById('profile-duty').value.trim();
  m.password = document.getElementById('profile-password').value.trim();
  saveDataToStorage(); refreshUI(); showToast('Đã lưu hồ sơ cá nhân 💾', 'success');
}

function saveGroupInfo(e) {
  e.preventDefault();
  groupInfo.name = document.getElementById('admin-group-name').value.trim();
  groupInfo.motto = document.getElementById('admin-group-motto').value.trim();
  groupInfo.notice = document.getElementById('admin-group-notice').value.trim();
  saveDataToStorage(); refreshUI(); showToast('Đã lưu cấu hình chung ⚙️', 'success');
}

function addNewMember(e) {
  e.preventDefault();
  const username = document.getElementById('new-username').value.trim().toLowerCase();
  if (members.some(m => m.username.toLowerCase() === username)) return showToast('Tên đăng nhập đã bị trùng!', 'error');

  members.push({
    id: 'm_' + Date.now(),
    username,
    password: document.getElementById('new-password').value.trim(),
    fullName: document.getElementById('new-fullname').value.trim(),
    role: 'MEMBER',
    canManage: document.getElementById('new-can-manage').checked,
    duty: document.getElementById('new-duty').value.trim(),
    phone: '',
    avatar: PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]
  });
  saveDataToStorage(); refreshUI(); document.getElementById('add-member-form').reset(); document.getElementById('new-password').value = '123';
  showToast('Đã thêm thành viên mới 🎉', 'success');
}

function renderAdminTable() {
  document.getElementById('admin-member-tbody').innerHTML = members.map(m => {
    const isLeader = m.role === 'LEADER';
    return `
      <tr class="hover:bg-slate-50 transition group">
        <td class="py-4 px-6 border-b border-slate-100">
          <div class="flex items-center space-x-4">
            <img src="${m.avatar}" class="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm" />
            <div>
              <p class="font-extrabold text-slate-800">${m.fullName}</p>
              <p class="text-xs font-bold text-indigo-400">@${m.username}</p>
            </div>
          </div>
        </td>
        <td class="py-4 px-6 border-b border-slate-100">
          <p class="text-sm font-bold text-slate-700">${m.duty || '-'}</p>
          <p class="text-xs font-semibold text-rose-500 bg-rose-50 inline-block px-1.5 rounded mt-1">MK: ${m.password}</p>
        </td>
        <td class="py-4 px-6 border-b border-slate-100 text-center">
          ${isLeader ? `<span class="text-[10px] font-bold tracking-wider uppercase text-amber-500 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">Owner</span>` : `
            <label class="inline-flex items-center cursor-pointer">
              <input type="checkbox" ${m.canManage ? 'checked' : ''} onchange="togglePerm('${m.id}')" class="sr-only peer">
              <div class="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all relative peer-checked:bg-indigo-600 shadow-inner"></div>
            </label>`}
        </td>
        <td class="py-4 px-6 border-b border-slate-100 text-right">
          ${isLeader || m.id === currentUser.id ? `<span class="text-xs font-bold text-slate-300">-</span>` : `
            <button onclick="kick('${m.id}')" class="w-8 h-8 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition opacity-0 group-hover:opacity-100 ml-auto">
              <i class="fa-solid fa-trash-can"></i>
            </button>`}
        </td>
      </tr>`;
  }).join('');
}

function togglePerm(id) {
  const t = members.find(m => m.id === id); if (!t || t.role === 'LEADER') return;
  t.canManage = !t.canManage; saveDataToStorage(); refreshUI();
}

function kick(id) {
  if (!confirm(`Xóa vĩnh viễn tài khoản của ${members.find(m=>m.id===id)?.fullName}?`)) return;
  members = members.filter(m => m.id !== id); saveDataToStorage(); refreshUI(); showToast('Đã xóa thành viên', 'success');
}

function resetDemoData() {
  if (!confirm('⚠ CẢNH BÁO: Mọi dữ liệu hiện tại sẽ bị xóa sạch và khôi phục về mẫu gốc. Bạn có chắc không?')) return;
  localStorage.removeItem(STORAGE_KEY_MEMBERS); 
  localStorage.removeItem(STORAGE_KEY_INFO);
  localStorage.removeItem(STORAGE_KEY_POLLS);
  localStorage.removeItem(STORAGE_KEY_ATTENDANCE);
  loadDataFromStorage(); refreshUI(); showToast('Đã khôi phục dữ liệu mẫu', 'success');
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const bg = type === 'error' ? 'bg-rose-500' : 'bg-slate-900';
  const icon = type === 'error' ? 'fa-triangle-exclamation' : 'fa-bell';
  
  toast.className = `toast-enter ${bg} text-white px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold flex items-center space-x-3 mb-3`;
  toast.innerHTML = `<i class="fa-solid ${icon} text-lg"></i><span>${msg}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}