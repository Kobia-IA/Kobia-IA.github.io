// script.js - Premium Edition + Bổ sung Bình chọn & Điểm danh
const STORAGE_KEY_MEMBERS = 'CLASS_GROUP_MEMBERS_V3';
const STORAGE_KEY_INFO = 'CLASS_GROUP_INFO_V3';
// Loại bỏ lưu session vào localStorage để yêu cầu đăng nhập mỗi lần truy cập
const STORAGE_KEY_POLLS = 'CLASS_GROUP_POLLS_V3';
const STORAGE_KEY_ATTENDANCE = 'CLASS_GROUP_ATTENDANCE_V3';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/notionists/svg?seed=A',
  'https://api.dicebear.com/7.x/notionists/svg?seed=B',
  'https://api.dicebear.com/7.x/notionists/svg?seed=C',
  'https://api.dicebear.com/7.x/notionists/svg?seed=D',
  'https://api.dicebear.com/7.x/notionists/svg?seed=E'
];

const DEFAULT_GROUP_INFO = {
  name: 'Tổ 1 - KTPM',
  motto: 'Kỷ luật - Sáng tạo - Trách nhiệm',
  notice: 'Họp chốt danh sách đồ án vào thứ 6 lúc 14:00. Yêu cầu có mặt đầy đủ.'
};

const DEFAULT_MEMBERS = [
  { id: 'm1', username: 'totruong', password: '123', fullName: 'Nguyễn Hữu Khánh', role: 'LEADER', canManage: true, duty: 'Điều hành & Quản lý', phone: '0901 234 567', avatar: PRESET_AVATARS[0] },
  { id: 'm2', username: 'topho', password: '123', fullName: 'Lê Minh Tâm', role: 'MEMBER', canManage: true, duty: 'Phó tổ chuyên môn', phone: '0912 345 678', avatar: PRESET_AVATARS[1] },
  { id: 'm3', username: 'thanhvien', password: '123', fullName: 'Trần Hải Đăng', role: 'MEMBER', canManage: false, duty: 'Thành viên hỗ trợ', phone: '0923 456 789', avatar: PRESET_AVATARS[2] }
];

let members = [], groupInfo = {}, polls = [], attendances = [];
let currentUser = null;

window.addEventListener('DOMContentLoaded', () => {
  loadDataFromStorage();
  renderPresetAvatars();

  // Yêu cầu đăng nhập mỗi lần truy cập, luôn hiển thị màn hình đăng nhập
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
  if (!user) { errEl.textContent = 'Sai tài khoản hoặc mật khẩu.'; errEl.classList.remove('hidden'); return; }
  errEl.classList.add('hidden');
  currentUser = user;
  
  // Xóa user/password khỏi form sau khi đăng nhập thành công
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  
  enterApp();
  showToast(`Xin chào, ${user.fullName}`, 'success');
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
    badgeEl.textContent = 'Tổ Trưởng'; badgeEl.className = 'text-[9px] uppercase tracking-widest font-bold bg-zinc-900 text-white px-2 py-0.5 rounded pl-2.5';
  } else if (currentUser.canManage) {
    badgeEl.textContent = 'Quản Lý'; badgeEl.className = 'text-[9px] uppercase tracking-widest font-bold bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded pl-2.5';
  } else {
    badgeEl.textContent = 'Thành Viên'; badgeEl.className = 'text-[9px] uppercase tracking-widest font-bold border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded pl-2.5';
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
  
  // Show/Hide Admin Tab
  document.getElementById('tab-btn-admin').classList.toggle('hidden', !hasAdmin);
  document.getElementById('mob-tab-admin').classList.toggle('hidden', !hasAdmin);
  
  // Show/Hide Create Poll/Attendance buttons
  document.getElementById('btn-show-create-poll').classList.toggle('hidden', !hasAdmin);
  document.getElementById('btn-create-attendance').classList.toggle('hidden', !hasAdmin);

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
    const mBtn = document.getElementById(`mob-tab-${t}`);
    if (mBtn) {
      if (t === tabName) { mBtn.classList.add('text-zinc-900', 'border-zinc-900'); mBtn.classList.remove('text-zinc-500', 'border-transparent');}
      else { mBtn.classList.remove('text-zinc-900', 'border-zinc-900'); mBtn.classList.add('text-zinc-500', 'border-transparent');}
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
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-zinc-400 text-sm">Không tìm thấy kết quả.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(m => {
    let badge = `<span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border border-zinc-200 text-zinc-500 rounded">Thành viên</span>`;
    if (m.role === 'LEADER') badge = `<span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-zinc-900 text-white rounded"><i class="fa-solid fa-crown mr-1"></i>Tổ Trưởng</span>`;
    else if (m.canManage) badge = `<span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded"><i class="fa-solid fa-key mr-1"></i>Quản lý</span>`;

    return `
      <div class="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-md hover:border-zinc-300 transition duration-300 flex flex-col group">
        <div class="flex items-center space-x-4 mb-4">
          <img src="${m.avatar}" class="w-14 h-14 rounded-full object-cover border border-zinc-200 group-hover:scale-105 transition duration-300" />
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-zinc-900 truncate">${m.fullName}</h4>
            <p class="text-xs text-zinc-400 mb-1.5 font-mono">@${m.username}</p>
            ${badge}
          </div>
        </div>
        <div class="pt-4 border-t border-zinc-100 text-sm space-y-2 mt-auto">
          <div class="flex justify-between">
            <span class="text-zinc-400">Nhiệm vụ</span>
            <span class="font-medium text-zinc-700 text-right truncate w-32" title="${m.duty || '-'}">${m.duty || '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-400">Liên hệ</span>
            <span class="font-medium text-zinc-700 text-right">${m.phone || '-'}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ================= BÌNH CHỌN (POLLS) =================
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
  showToast('Đã tạo bình chọn mới', 'success');
}

function votePoll(pollId, optionId) {
  const poll = polls.find(p => p.id === pollId);
  if (!poll) return;

  // Xóa vote cũ của user trong poll này
  poll.options.forEach(opt => {
    opt.votes = opt.votes.filter(uid => uid !== currentUser.id);
  });

  // Thêm vote mới
  const selectedOpt = poll.options.find(o => o.id === optionId);
  if (selectedOpt) {
    selectedOpt.votes.push(currentUser.id);
  }

  saveDataToStorage();
  renderPolls();
}

function deletePoll(pollId) {
  if (!confirm('Bạn có chắc chắn muốn xóa bình chọn này?')) return;
  polls = polls.filter(p => p.id !== pollId);
  saveDataToStorage();
  renderPolls();
  showToast('Đã xóa bình chọn', 'success');
}

function renderPolls() {
  const container = document.getElementById('polls-list');
  if (polls.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-zinc-400 text-sm border border-dashed border-zinc-300 rounded-2xl">Chưa có bình chọn nào.</div>`;
    return;
  }

  const hasAdmin = currentUser.role === 'LEADER' || currentUser.canManage;

  container.innerHTML = polls.map(p => {
    const totalVotes = p.options.reduce((acc, opt) => acc + opt.votes.length, 0);
    const creator = members.find(m => m.id === p.createdBy)?.fullName || 'Ẩn danh';
    const dateStr = new Date(p.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    const optionsHtml = p.options.map(opt => {
      const isVotedByMe = opt.votes.includes(currentUser.id);
      const percent = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100);
      return `
        <div class="relative cursor-pointer group" onclick="votePoll('${p.id}', '${opt.id}')">
          <!-- Background bar -->
          <div class="absolute inset-0 bg-zinc-100 rounded-lg overflow-hidden border ${isVotedByMe ? 'border-zinc-900' : 'border-zinc-200 group-hover:border-zinc-400'} transition">
            <div class="h-full bg-zinc-200 transition-all duration-500" style="width: ${percent}%"></div>
          </div>
          <!-- Content -->
          <div class="relative flex justify-between items-center px-4 py-2.5">
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 rounded-full border flex items-center justify-center ${isVotedByMe ? 'border-zinc-900' : 'border-zinc-300'}">
                ${isVotedByMe ? '<div class="w-2 h-2 bg-zinc-900 rounded-full"></div>' : ''}
              </div>
              <span class="text-sm font-medium ${isVotedByMe ? 'text-zinc-900' : 'text-zinc-700'}">${opt.text}</span>
            </div>
            <span class="text-xs font-semibold text-zinc-500">${opt.votes.length} phiếu (${percent}%)</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col space-y-4">
        <div class="flex justify-between items-start">
          <div>
            <h4 class="font-bold text-zinc-900 text-lg leading-tight">${p.title}</h4>
            <p class="text-[11px] text-zinc-400 mt-1 uppercase tracking-wider font-semibold">Tạo bởi ${creator} • ${dateStr}</p>
          </div>
          ${hasAdmin ? `<button onclick="deletePoll('${p.id}')" class="text-zinc-400 hover:text-red-500 transition"><i class="fa-solid fa-trash-can"></i></button>` : ''}
        </div>
        <div class="space-y-2 flex-1">
          ${optionsHtml}
        </div>
        <p class="text-xs font-semibold text-zinc-500 pt-2 border-t border-zinc-100 text-right">Tổng: ${totalVotes} lượt bình chọn</p>
      </div>
    `;
  }).join('');
}

// ================= ĐIỂM DANH (ATTENDANCE) =================
function createNewAttendance() {
  const title = prompt('Nhập tiêu đề điểm danh (VD: Họp Tổ ngày 20/11):');
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
  showToast('Đã tạo phiên điểm danh mới', 'success');
}

function checkIn(attId) {
  const att = attendances.find(a => a.id === attId);
  if (!att) return;

  if (!att.presentIds.includes(currentUser.id)) {
    att.presentIds.push(currentUser.id);
    saveDataToStorage();
    renderAttendances();
    showToast('Đã điểm danh thành công!', 'success');
  }
}

function deleteAttendance(attId) {
  if (!confirm('Bạn có chắc chắn muốn xóa phiên điểm danh này?')) return;
  attendances = attendances.filter(a => a.id !== attId);
  saveDataToStorage();
  renderAttendances();
  showToast('Đã xóa phiên điểm danh', 'success');
}

function renderAttendances() {
  const container = document.getElementById('attendance-list');
  if (attendances.length === 0) {
    container.innerHTML = `<div class="py-12 text-center text-zinc-400 text-sm border border-dashed border-zinc-300 rounded-2xl">Chưa có phiên điểm danh nào.</div>`;
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

    // Danh sách người đã điểm danh (hiển thị cho Admin)
    let adminViewHtml = '';
    if (hasAdmin) {
      const presentNames = att.presentIds.map(id => {
        const m = members.find(x => x.id === id);
        return m ? m.fullName : 'Unknown';
      });
      adminViewHtml = `
        <div class="mt-4 pt-4 border-t border-zinc-100">
          <p class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Đã có mặt (${presentCount}/${totalCount})</p>
          <div class="flex flex-wrap gap-2">
            ${presentNames.length > 0 
              ? presentNames.map(name => `<span class="text-xs font-medium bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md">${name}</span>`).join('') 
              : `<span class="text-xs text-zinc-400 italic">Chưa có ai điểm danh</span>`}
          </div>
        </div>
      `;
    }

    return `
      <div class="bg-white p-6 rounded-2xl border ${isCheckedIn && !hasAdmin ? 'border-green-200 shadow-sm' : 'border-zinc-200 shadow-sm'}">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h4 class="font-bold text-zinc-900 text-lg leading-tight flex items-center gap-2">
              ${att.title}
              ${isCheckedIn ? '<i class="fa-solid fa-circle-check text-green-500 text-base" title="Bạn đã điểm danh"></i>' : ''}
            </h4>
            <p class="text-[11px] text-zinc-400 mt-1 uppercase tracking-wider font-semibold">Tạo bởi ${creator} • ${dateStr}</p>
          </div>
          
          <div class="flex items-center gap-3 shrink-0">
            ${!isCheckedIn 
              ? `<button onclick="checkIn('${att.id}')" class="bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2 rounded-xl text-sm font-semibold transition active:scale-[0.98]">Xác nhận có mặt</button>`
              : `<span class="px-5 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-semibold cursor-default"><i class="fa-solid fa-check mr-1.5"></i>Đã có mặt</span>`
            }
            ${hasAdmin ? `<button onclick="deleteAttendance('${att.id}')" class="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"><i class="fa-solid fa-trash-can"></i></button>` : ''}
          </div>
        </div>
        
        <!-- Progress bar cho Admin -->
        ${hasAdmin ? `
        <div class="mt-4 flex items-center space-x-3">
          <div class="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div class="h-full bg-zinc-900 rounded-full" style="width: ${percent}%"></div>
          </div>
          <span class="text-xs font-semibold text-zinc-500">${percent}%</span>
        </div>` : ''}

        ${adminViewHtml}
      </div>
    `;
  }).join('');
}


// ================= HỒ SƠ & QUẢN TRỊ (Giữ nguyên) =================
function renderPresetAvatars() {
  document.getElementById('preset-avatars').innerHTML = PRESET_AVATARS.map(url => 
    `<img src="${url}" onclick="updateAvatar('${url}')" class="w-12 h-12 rounded-full border border-zinc-200 hover:border-zinc-900 cursor-pointer transition object-cover" />`
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
      canvas.width = canvas.height = 240;
      const ctx = canvas.getContext('2d');
      const minDim = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - minDim) / 2, (img.height - minDim) / 2, minDim, minDim, 0, 0, 240, 240);
      updateAvatar(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateAvatar(url) {
  members.find(m => m.id === currentUser.id).avatar = url;
  saveDataToStorage(); refreshUI(); showToast('Ảnh đại diện đã được cập nhật', 'success');
}

function saveMyProfile(e) {
  e.preventDefault();
  const m = members.find(m => m.id === currentUser.id);
  m.fullName = document.getElementById('profile-fullname').value.trim();
  m.phone = document.getElementById('profile-phone').value.trim();
  m.duty = document.getElementById('profile-duty').value.trim();
  m.password = document.getElementById('profile-password').value.trim();
  saveDataToStorage(); refreshUI(); showToast('Hồ sơ đã được lưu', 'success');
}

function saveGroupInfo(e) {
  e.preventDefault();
  groupInfo.name = document.getElementById('admin-group-name').value.trim();
  groupInfo.motto = document.getElementById('admin-group-motto').value.trim();
  groupInfo.notice = document.getElementById('admin-group-notice').value.trim();
  saveDataToStorage(); refreshUI(); showToast('Cài đặt chung đã được cập nhật', 'success');
}

function addNewMember(e) {
  e.preventDefault();
  const username = document.getElementById('new-username').value.trim().toLowerCase();
  if (members.some(m => m.username.toLowerCase() === username)) return showToast('Username đã tồn tại!', 'error');

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
  showToast('Tài khoản thành viên đã được tạo', 'success');
}

function renderAdminTable() {
  document.getElementById('admin-member-tbody').innerHTML = members.map(m => {
    const isLeader = m.role === 'LEADER';
    return `
      <tr class="hover:bg-zinc-50 transition group">
        <td class="py-3 px-6 border-b border-zinc-100">
          <div class="flex items-center space-x-3">
            <img src="${m.avatar}" class="w-9 h-9 rounded-full object-cover border border-zinc-200" />
            <div>
              <p class="font-bold text-zinc-900">${m.fullName}</p>
              <p class="text-xs text-zinc-400 font-mono">@${m.username}</p>
            </div>
          </div>
        </td>
        <td class="py-3 px-6 border-b border-zinc-100">
          <p class="text-sm text-zinc-700">${m.duty || '-'}</p>
          <p class="text-xs text-zinc-400">MK: ${m.password}</p>
        </td>
        <td class="py-3 px-6 border-b border-zinc-100 text-center">
          ${isLeader ? `<span class="text-[10px] font-bold tracking-wider uppercase text-zinc-400">Owner</span>` : `
            <label class="inline-flex items-center cursor-pointer">
              <input type="checkbox" ${m.canManage ? 'checked' : ''} onchange="togglePerm('${m.id}')" class="sr-only peer">
              <div class="w-9 h-5 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all relative peer-checked:bg-zinc-900"></div>
            </label>`}
        </td>
        <td class="py-3 px-6 border-b border-zinc-100 text-right">
          ${isLeader || m.id === currentUser.id ? `<span class="text-xs text-zinc-300">-</span>` : `
            <button onclick="kick('${m.id}')" class="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition opacity-0 group-hover:opacity-100">
              Xóa
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
  if (!confirm('Xóa vĩnh viễn tài khoản này?')) return;
  members = members.filter(m => m.id !== id); saveDataToStorage(); refreshUI(); showToast('Tài khoản đã bị xóa', 'success');
}

function resetDemoData() {
  if (!confirm('Khôi phục dữ liệu mẫu ban đầu? Toàn bộ dữ liệu hiện tại sẽ mất.')) return;
  localStorage.removeItem(STORAGE_KEY_MEMBERS); 
  localStorage.removeItem(STORAGE_KEY_INFO);
  localStorage.removeItem(STORAGE_KEY_POLLS);
  localStorage.removeItem(STORAGE_KEY_ATTENDANCE);
  loadDataFromStorage(); refreshUI(); showToast('Đã khôi phục dữ liệu mẫu', 'success');
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const bg = type === 'error' ? 'bg-red-500' : 'bg-zinc-900';
  toast.className = `${bg} text-white px-5 py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-sm font-semibold flex items-center space-x-3 animate-fade-in`;
  toast.innerHTML = `<i class="${type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-check'}"></i><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
