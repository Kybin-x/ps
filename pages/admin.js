// ============================================
// pages/admin.js - 管理员后台
// ============================================

let adminTab = 'overview';

function renderAdminPage(params) {
  if (!Auth.isAdmin()) {
    Toast.error('无权限访问管理后台');
    Router.navigate('home');
    return;
  }

  adminTab = params.tab || 'overview';

  const tabs = [
    { id: 'overview', icon: '📊', label: '数据总览' },
    { id: 'students', icon: '👥', label: '学员管理' },
    { id: 'chapters', icon: '📚', label: '章节管理' },
    { id: 'settings', icon: '⚙️', label: '系统设置' },
  ];

  const navHtml = tabs.map(t => `
    <div class="admin-nav-item ${adminTab === t.id ? 'active' : ''}"
         onclick="switchAdminTab('${t.id}')">
      <span class="admin-nav-icon">${t.icon}</span>
      <span>${t.label}</span>
    </div>`).join('');

  render(`
    <div class="page-wrap">
      <div class="admin-layout">
        <div class="admin-sidebar">
          <div class="admin-title">管理后台</div>
          ${navHtml}
        </div>
        <div class="admin-main" id="admin-content">
          <div class="loading-wrap"><div class="spinner"></div></div>
        </div>
      </div>
    </div>`);

  loadAdminTab(adminTab);
}

function switchAdminTab(tab) {
  adminTab = tab;
  document.querySelectorAll('.admin-nav-item').forEach(el => {
    el.classList.toggle('active', el.textContent.trim().includes(
      { overview: '数据总览', students: '学员管理', chapters: '章节管理', settings: '系统设置' }[tab]
    ));
  });
  loadAdminTab(tab);
}

async function loadAdminTab(tab) {
  const content = document.getElementById('admin-content');
  if (!content) return;
  content.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';

  switch (tab) {
    case 'overview': await renderOverviewTab(content); break;
    case 'students': await renderStudentsTab(content); break;
    case 'chapters': await renderChaptersTab(content); break;
    case 'settings': await renderSettingsTab(content); break;
  }
}

// ---- 数据总览 ----
async function renderOverviewTab(content) {
  const [usersRes, progressRes, quizRes] = await Promise.all([
    DB.getAllUsers(),
    DB.getAllProgress(),
    DB.getAllQuizResults()
  ]);
  const users = (usersRes.data || []).filter(u => u.role !== 'admin');
  const progress = progressRes.data || [];
  const quizResults = quizRes.data || [];
  const activeUsers = users.filter(u => u.is_active !== false);
  const totalLessons = App.courseData.reduce((s, c) => s + c.lessons.length, 0);

  // 按学员聚合进度
  const userProgressMap = {};
  users.forEach(u => { userProgressMap[u.id] = 0; });
  progress.forEach(p => {
    if (p.completed && userProgressMap[p.user_id] !== undefined) userProgressMap[p.user_id]++;
  });
  const avgProgress = users.length > 0
    ? Math.round(users.reduce((s, u) => s + (userProgressMap[u.id] || 0), 0) / users.length / totalLessons * 100) : 0;

  content.innerHTML = `
    <div class="admin-section-title">数据总览</div>
    <div class="admin-section-desc">实时查看平台学习数据</div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">注册学员</div>
        <div class="stat-value orange">${users.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">活跃账号</div>
        <div class="stat-value green">${activeUsers.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">打卡记录</div>
        <div class="stat-value red">${progress.filter(p => p.completed).length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">测验通过</div>
        <div class="stat-value green">${quizResults.filter(r => r.passed).length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均进度</div>
        <div class="stat-value orange">${avgProgress}%</div>
      </div>
    </div>

    <h3 style="font-size:16px;font-weight:700;margin-bottom:16px">学员进度排行</h3>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>姓名</th><th>班级</th><th>完成课时</th><th>进度</th><th>通过测验</th>
          </tr>
        </thead>
        <tbody>
          ${users.sort((a,b) => (userProgressMap[b.id]||0) - (userProgressMap[a.id]||0)).slice(0,20).map(u => {
            const done = userProgressMap[u.id] || 0;
            const pct = Math.round(done / totalLessons * 100);
            const passed = quizResults.filter(r => r.user_id === u.id && r.passed).length;
            return `
              <tr>
                <td><strong>${u.name || '-'}</strong> <span style="color:var(--text3);font-size:11px">@${u.username}</span></td>
                <td>${u.class_name || '-'}</td>
                <td>${done} / ${totalLessons}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px;min-width:120px">
                    <div class="progress-bar sm" style="flex:1"><div class="progress-fill" style="width:${pct}%"></div></div>
                    <span style="font-size:12px;color:var(--text3)">${pct}%</span>
                  </div>
                </td>
                <td><span class="badge ${passed > 0 ? 'badge-green' : 'badge-gray'}">${passed} 章</span></td>
              </tr>`;
          }).join('')}
          ${users.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:32px">暂无学员数据</td></tr>' : ''}
        </tbody>
      </table>
    </div>`;
}

// ---- 学员管理 ----
async function renderStudentsTab(content) {
  const { data: users } = await DB.getAllUsers();
  const students = (users || []).filter(u => u.role !== 'admin');

  content.innerHTML = `
    <div class="admin-section-title">学员管理</div>
    <div class="admin-section-desc">管理学员账号，可批量导入或单独停用</div>

    <div class="admin-toolbar">
      <div class="admin-search" style="flex:1">
        <input class="form-input" id="student-search" placeholder="搜索姓名或用户名..." oninput="filterStudents(this.value)" />
      </div>
      <button class="btn btn-outline btn-sm" onclick="showImportModal()">📥 导入名单</button>
      <button class="btn btn-primary btn-sm" onclick="showAddStudentModal()">+ 添加学员</button>
    </div>

    <div class="table-wrap">
      <table class="data-table" id="students-table">
        <thead>
          <tr><th>姓名</th><th>用户名</th><th>班级</th><th>注册时间</th><th>账号状态</th><th>操作</th></tr>
        </thead>
        <tbody id="students-tbody">
          ${renderStudentRows(students)}
        </tbody>
      </table>
    </div>`;

  // 保存学员列表供搜索使用
  window._allStudents = students;
}

function renderStudentRows(students) {
  if (students.length === 0) return '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:32px">暂无学员</td></tr>';
  return students.map(u => `
    <tr id="student-row-${u.id}">
      <td><strong>${u.name || '-'}</strong></td>
      <td><span style="font-family:var(--font-mono);font-size:12px">@${u.username}</span></td>
      <td>${u.class_name || '-'}</td>
      <td style="font-size:12px;color:var(--text3)">${u.created_at ? new Date(u.created_at).toLocaleDateString('zh-CN') : '-'}</td>
      <td>
        <span class="badge ${u.is_active !== false ? 'badge-green' : 'badge-red'}">
          ${u.is_active !== false ? '正常' : '已停用'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm ${u.is_active !== false ? 'btn-outline' : 'btn-success'}"
                onclick="toggleStudentStatus('${u.id}', ${u.is_active !== false})">
          ${u.is_active !== false ? '停用' : '启用'}
        </button>
      </td>
    </tr>`).join('');
}

function filterStudents(query) {
  const students = (window._allStudents || []).filter(u =>
    (u.name || '').includes(query) || (u.username || '').includes(query) || (u.class_name || '').includes(query)
  );
  document.getElementById('students-tbody').innerHTML = renderStudentRows(students);
}

async function toggleStudentStatus(userId, currentlyActive) {
  const newStatus = !currentlyActive;
  const { error } = await DB.updateUser(userId, { is_active: newStatus });
  if (error) { Toast.error('操作失败'); return; }
  Toast.success(newStatus ? '账号已启用' : '账号已停用');
  // 更新本地数据
  if (window._allStudents) {
    const u = window._allStudents.find(s => s.id === userId);
    if (u) u.is_active = newStatus;
    document.getElementById('students-tbody').innerHTML = renderStudentRows(window._allStudents);
  }
}

function showImportModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'import-modal';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-title">📥 批量导入学员名单</div>
      <p style="font-size:13px;color:var(--text2);margin-bottom:16px">
        每行一个学员，格式：<code style="font-family:var(--font-mono);background:var(--card2);padding:2px 6px;border-radius:4px">姓名,班级,用户名,密码</code>
      </p>
      <div class="form-group">
        <textarea class="form-input" id="import-text" rows="8" placeholder="张三,电商2301,zhangsan,123456
李四,电商2301,lisi,123456
王五,电商2302,wangwu,123456"></textarea>
      </div>
      <div id="import-result" style="display:none"></div>
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="document.getElementById('import-modal').remove()">取消</button>
        <button class="btn btn-primary" onclick="handleImport()">开始导入</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

async function handleImport() {
  const text = document.getElementById('import-text').value.trim();
  if (!text) { Toast.warning('请输入学员数据'); return; }

  const lines = text.split('\n').filter(l => l.trim());
  let success = 0, fail = 0, errors = [];

  for (const line of lines) {
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 4) { fail++; errors.push(`格式错误：${line}`); continue; }
    const [name, className, username, password] = parts;
    if (!name || !username || !password) { fail++; errors.push(`数据不完整：${line}`); continue; }

    const { data: existing } = await DB.getUserByUsername(username);
    if (existing) { fail++; errors.push(`用户名已存在：${username}`); continue; }

    const { error } = await DB.createUser({
      username, name, class_name: className,
      password_hash: Auth.hashPassword(password),
      role: 'student', is_active: true,
      created_at: new Date().toISOString()
    });
    if (error) { fail++; errors.push(`创建失败：${username}`); } else { success++; }
  }

  const resultEl = document.getElementById('import-result');
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div style="background:var(--card2);border-radius:var(--radius-sm);padding:12px;font-size:13px">
      <div style="color:var(--success);margin-bottom:4px">✓ 成功导入 ${success} 人</div>
      ${fail > 0 ? `<div style="color:var(--red);margin-bottom:4px">✕ 失败 ${fail} 人</div>` : ''}
      ${errors.map(e => `<div style="color:var(--text3);font-size:12px">• ${e}</div>`).join('')}
    </div>`;

  if (success > 0) {
    Toast.success(`成功导入 ${success} 名学员`);
    setTimeout(() => {
      document.getElementById('import-modal')?.remove();
      loadAdminTab('students');
    }, 2000);
  }
}

function showAddStudentModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'add-student-modal';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-title">+ 添加学员</div>
      <div class="form-group"><label class="form-label">姓名</label><input class="form-input" id="add-name" placeholder="真实姓名" /></div>
      <div class="form-group"><label class="form-label">班级</label><input class="form-input" id="add-class" placeholder="电商2301班" /></div>
      <div class="form-group"><label class="form-label">用户名</label><input class="form-input" id="add-username" placeholder="登录用户名" /></div>
      <div class="form-group"><label class="form-label">密码</label><input class="form-input" id="add-password" type="password" placeholder="初始密码（至少6位）" /></div>
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="document.getElementById('add-student-modal').remove()">取消</button>
        <button class="btn btn-primary" onclick="handleAddStudent()">添加</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

async function handleAddStudent() {
  const name = document.getElementById('add-name').value.trim();
  const className = document.getElementById('add-class').value.trim();
  const username = document.getElementById('add-username').value.trim();
  const password = document.getElementById('add-password').value;
  if (!name || !username || !password) { Toast.warning('请填写所有字段'); return; }
  if (password.length < 6) { Toast.warning('密码至少6位'); return; }

  const { data: existing } = await DB.getUserByUsername(username);
  if (existing) { Toast.error('用户名已存在'); return; }

  const { error } = await DB.createUser({
    username, name, class_name: className,
    password_hash: Auth.hashPassword(password),
    role: 'student', is_active: true,
    created_at: new Date().toISOString()
  });
  if (error) { Toast.error('添加失败：' + error.message); return; }
  Toast.success('学员添加成功');
  document.getElementById('add-student-modal')?.remove();
  loadAdminTab('students');
}

// ---- 章节管理 ----
async function renderChaptersTab(content) {
  const { data: dbChapters } = await DB.getChapters();
  const chapters = App.courseData;

  content.innerHTML = `
    <div class="admin-section-title">章节管理</div>
    <div class="admin-section-desc">控制各章节对学员的开放状态</div>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${chapters.map((ch, idx) => {
        const dbCh = (dbChapters || []).find(d => d.chapter_id === ch.id);
        const isOpen = dbCh ? dbCh.is_open !== false : true;
        return `
          <div class="card" style="display:flex;align-items:center;gap:20px">
            <div style="font-size:32px">${['🎨','🖼️','📦','🎉','✨'][idx]}</div>
            <div style="flex:1">
              <div style="font-size:15px;font-weight:700">第${idx+1}章 · ${ch.title}</div>
              <div style="font-size:12px;color:var(--text3);margin-top:4px">${ch.lessons.length} 课时 · ${ch.duration}</div>
            </div>
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-size:13px;color:${isOpen ? 'var(--success)' : 'var(--red)'}">${isOpen ? '已开放' : '已关闭'}</span>
              <label class="toggle">
                <input type="checkbox" ${isOpen ? 'checked' : ''} onchange="toggleChapter('${ch.id}', this.checked)" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

async function toggleChapter(chapterId, isOpen) {
  // 先检查是否在DB中有记录，没有则先插入
  const { data: existing } = await DB.getChapters();
  const dbCh = (existing || []).find(d => d.chapter_id === chapterId);

  let error;
  if (dbCh) {
    ({ error } = await DB.updateChapter(dbCh.id, { is_open: isOpen }));
  } else {
    // 插入新记录
    const { error: insertError } = await db.from('chapters').insert({ chapter_id: chapterId, is_open: isOpen, order_num: 0 });
    error = insertError;
  }

  if (error) { Toast.error('操作失败'); return; }

  // 更新本地
  const localCh = App.chapters.find(c => c.chapter_id === chapterId);
  if (localCh) localCh.is_open = isOpen;
  else App.chapters.push({ chapter_id: chapterId, is_open: isOpen });

  Toast.success(isOpen ? '章节已开放' : '章节已关闭');
}

// ---- 系统设置 ----
async function renderSettingsTab(content) {
  const { data: settings } = await DB.getSettings();
  const registerOpen = settings.register_open !== 'false';

  content.innerHTML = `
    <div class="admin-section-title">系统设置</div>
    <div class="admin-section-desc">管理平台全局配置</div>

    <div style="display:flex;flex-direction:column;gap:16px;max-width:500px">
      <div class="card" style="display:flex;align-items:center;gap:20px">
        <div style="flex:1">
          <div style="font-size:15px;font-weight:700;margin-bottom:4px">开放学员注册</div>
          <div style="font-size:13px;color:var(--text2)">关闭后，新用户将无法自行注册账号</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span id="reg-status-text" style="font-size:13px;color:${registerOpen ? 'var(--success)' : 'var(--red)'}">${registerOpen ? '已开放' : '已关闭'}</span>
          <label class="toggle">
            <input type="checkbox" ${registerOpen ? 'checked' : ''} onchange="toggleRegister(this.checked)" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="card">
        <div style="font-size:15px;font-weight:700;margin-bottom:12px">管理员信息</div>
        <div style="font-size:13px;color:var(--text2)">
          <div style="margin-bottom:6px">账号：<strong style="color:var(--text)">${App.user.username}</strong></div>
          <div>姓名：<strong style="color:var(--text)">${App.user.name || '-'}</strong></div>
        </div>
      </div>

      <div class="card">
        <div style="font-size:15px;font-weight:700;margin-bottom:12px">平台数据</div>
        <div style="font-size:13px;color:var(--text2)">
          <div style="margin-bottom:6px">课程章节：<strong style="color:var(--text)">${App.courseData.length} 章</strong></div>
          <div>总课时数：<strong style="color:var(--text)">${App.courseData.reduce((s,c)=>s+c.lessons.length,0)} 课时</strong></div>
        </div>
      </div>
    </div>`;
}

async function toggleRegister(isOpen) {
  const { error } = await DB.setSetting('register_open', String(isOpen));
  if (error) { Toast.error('设置失败'); return; }
  App.settings.register_open = String(isOpen);
  const statusEl = document.getElementById('reg-status-text');
  if (statusEl) {
    statusEl.textContent = isOpen ? '已开放' : '已关闭';
    statusEl.style.color = isOpen ? 'var(--success)' : 'var(--red)';
  }
  Toast.success(isOpen ? '注册通道已开放' : '注册通道已关闭');
}
