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
  const { data: lessonAccess } = await DB.getLessonAccess();
  const chapters = App.courseData;
  const icons = ['🎨','🖼️','📦','🎉','✨'];

  const getLessonOpen = (lessonId) => {
    const rec = (lessonAccess || []).find(r => r.lesson_id === lessonId);
    return rec ? rec.is_open !== false : true;
  };

  content.innerHTML = `
    <div class="admin-section-title">章节管理</div>
    <div class="admin-section-desc">
      点击章节可展开查看并单独控制每节课时的开放状态；章节总开关关闭时，所有课时对学员不可见。
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${chapters.map((ch, idx) => {
        const dbCh = (dbChapters || []).find(d => d.chapter_id === ch.id);
        const chOpen = dbCh ? dbCh.is_open !== false : true;
        const openCount = ch.lessons.filter(l => getLessonOpen(l.id)).length;

        return `
          <div class="chapter-access-card" id="chcard-${ch.id}" style="
            background:var(--card); border:1.5px solid var(--border);
            border-radius:var(--radius); overflow:hidden; box-shadow:var(--shadow-card);">

            <!-- 章节头部行 -->
            <div style="display:flex;align-items:center;gap:16px;padding:16px 20px;cursor:pointer"
                 onclick="toggleChapterCard('${ch.id}')">
              <div style="font-size:28px;flex-shrink:0">${icons[idx]}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:15px;font-weight:700;color:var(--text)">
                  第${idx+1}章 · ${ch.title}
                </div>
                <div style="font-size:12px;color:var(--text3);margin-top:3px">
                  共 ${ch.lessons.length} 课时 &nbsp;·&nbsp;
                  <span id="open-count-${ch.id}" style="color:${chOpen ? 'var(--success)' : 'var(--red)'}">
                    ${chOpen ? `${openCount}/${ch.lessons.length} 课时已开放` : '章节已全部关闭'}
                  </span>
                </div>
              </div>
              <!-- 章节总开关 -->
              <div style="display:flex;align-items:center;gap:10px;flex-shrink:0" onclick="event.stopPropagation()">
                <span style="font-size:12px;color:var(--text3)">整章</span>
                <label class="toggle">
                  <input type="checkbox" id="chtoggle-${ch.id}" ${chOpen ? 'checked' : ''}
                    onchange="toggleChapter('${ch.id}', this.checked, ${JSON.stringify(ch.lessons.map(l=>l.id))})" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <!-- 展开箭头 -->
              <div id="chcarrow-${ch.id}" style="font-size:12px;color:var(--text3);transition:transform 0.2s;flex-shrink:0">▶</div>
            </div>

            <!-- 课时列表（默认折叠） -->
            <div id="chbody-${ch.id}" style="display:none;border-top:1px solid var(--border)">
              <!-- 批量操作行 -->
              <div style="display:flex;align-items:center;gap:12px;padding:10px 20px;background:var(--bg2)">
                <span style="font-size:12px;color:var(--text3);flex:1">批量操作：</span>
                <button class="btn btn-sm btn-outline" style="border-radius:6px;font-size:12px"
                  onclick="batchSetLessons('${ch.id}', ${JSON.stringify(ch.lessons.map(l=>l.id))}, true)">全部开放</button>
                <button class="btn btn-sm btn-danger" style="border-radius:6px;font-size:12px"
                  onclick="batchSetLessons('${ch.id}', ${JSON.stringify(ch.lessons.map(l=>l.id))}, false)">全部关闭</button>
              </div>
              <!-- 课时列表 -->
              ${ch.lessons.map((lesson, li) => {
                const lOpen = getLessonOpen(lesson.id);
                return `
                  <div style="display:flex;align-items:center;gap:14px;padding:11px 20px 11px 56px;
                    border-bottom:1px solid var(--border);transition:background 0.15s"
                    onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
                    <div style="width:20px;height:20px;border-radius:50%;background:var(--gradient);
                      color:#fff;display:flex;align-items:center;justify-content:center;
                      font-size:10px;font-weight:700;flex-shrink:0">${li+1}</div>
                    <div style="flex:1;font-size:13px;color:var(--text)">${lesson.title}</div>
                    <div style="font-size:12px;color:var(--text3);margin-right:8px">${lesson.duration || ''}</div>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                      <span id="lstatus-${lesson.id}" style="font-size:11px;color:${lOpen ? 'var(--success)' : 'var(--red)'}">
                        ${lOpen ? '开放' : '关闭'}
                      </span>
                      <label class="toggle" style="width:36px;height:20px">
                        <input type="checkbox" id="ltoggle-${lesson.id}" ${lOpen ? 'checked' : ''}
                          onchange="toggleLesson('${lesson.id}', '${ch.id}', this.checked)" />
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>`;
              }).join('')}
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

// 展开/折叠章节卡片
function toggleChapterCard(chapterId) {
  const body = document.getElementById(`chbody-${chapterId}`);
  const arrow = document.getElementById(`chcarrow-${chapterId}`);
  if (!body) return;
  const isOpen = body.style.display === 'none';
  body.style.display = isOpen ? 'block' : 'none';
  if (arrow) arrow.style.transform = isOpen ? 'rotate(90deg)' : '';
}

// 切换章节总开关（同时影响所有课时的显示，但不修改课时单独开关记录）
async function toggleChapter(chapterId, isOpen, lessonIds) {
  const { data: existing } = await DB.getChapters();
  const dbCh = (existing || []).find(d => d.chapter_id === chapterId);

  let error;
  if (dbCh) {
    ({ error } = await DB.updateChapter(dbCh.id, { is_open: isOpen }));
  } else {
    const { error: insertError } = await db.from('chapters').insert({ chapter_id: chapterId, is_open: isOpen, order_num: 0 });
    error = insertError;
  }

  if (error) { Toast.error('操作失败'); return; }

  // 更新本地状态
  const localCh = App.chapters.find(c => c.chapter_id === chapterId);
  if (localCh) localCh.is_open = isOpen;
  else App.chapters.push({ chapter_id: chapterId, is_open: isOpen });

  // 更新UI
  const countEl = document.getElementById(`open-count-${chapterId}`);
  if (countEl) {
    const { data: la } = await DB.getLessonAccess();
    const openCount = (lessonIds || []).filter(id => {
      const rec = (la || []).find(r => r.lesson_id === id);
      return rec ? rec.is_open !== false : true;
    }).length;
    countEl.textContent = isOpen ? `${openCount}/${(lessonIds||[]).length} 课时已开放` : '章节已全部关闭';
    countEl.style.color = isOpen ? 'var(--success)' : 'var(--red)';
  }

  Toast.success(isOpen ? `第章节已整体开放` : `章节已整体关闭`);
}

// 切换单个课时开关
async function toggleLesson(lessonId, chapterId, isOpen) {
  const { error } = await DB.setLessonAccess(lessonId, chapterId, isOpen);
  if (error) { Toast.error('操作失败'); return; }

  // 更新本地 lessonAccess
  const rec = App.lessonAccess.find(r => r.lesson_id === lessonId);
  if (rec) rec.is_open = isOpen;
  else App.lessonAccess.push({ lesson_id: lessonId, chapter_id: chapterId, is_open: isOpen });

  // 更新状态文字
  const statusEl = document.getElementById(`lstatus-${lessonId}`);
  if (statusEl) {
    statusEl.textContent = isOpen ? '开放' : '关闭';
    statusEl.style.color = isOpen ? 'var(--success)' : 'var(--red)';
  }

  // 更新章节统计数
  const ch = App.courseData.find(c => c.id === chapterId);
  if (ch) {
    const openCount = ch.lessons.filter(l => {
      const r = App.lessonAccess.find(x => x.lesson_id === l.id);
      return r ? r.is_open !== false : true;
    }).length;
    const countEl = document.getElementById(`open-count-${chapterId}`);
    if (countEl && App.isChapterOpen(chapterId)) {
      countEl.textContent = `${openCount}/${ch.lessons.length} 课时已开放`;
    }
  }

  Toast.success(isOpen ? '课时已开放' : '课时已关闭');
}

// 批量设置章节内所有课时
async function batchSetLessons(chapterId, lessonIds, isOpen) {
  const { error } = await DB.setChapterLessonsAccess(chapterId, lessonIds, isOpen);
  if (error) { Toast.error('批量操作失败'); return; }

  // 更新本地状态
  lessonIds.forEach(id => {
    const rec = App.lessonAccess.find(r => r.lesson_id === id);
    if (rec) rec.is_open = isOpen;
    else App.lessonAccess.push({ lesson_id: id, chapter_id: chapterId, is_open: isOpen });
  });

  // 更新所有课时UI
  lessonIds.forEach(id => {
    const toggle = document.getElementById(`ltoggle-${id}`);
    const status = document.getElementById(`lstatus-${id}`);
    if (toggle) toggle.checked = isOpen;
    if (status) {
      status.textContent = isOpen ? '开放' : '关闭';
      status.style.color = isOpen ? 'var(--success)' : 'var(--red)';
    }
  });

  // 更新章节统计
  const countEl = document.getElementById(`open-count-${chapterId}`);
  if (countEl && App.isChapterOpen(chapterId)) {
    const openCount = isOpen ? lessonIds.length : 0;
    countEl.textContent = `${openCount}/${lessonIds.length} 课时已开放`;
  }

  Toast.success(isOpen ? `已开放全部 ${lessonIds.length} 课时` : `已关闭全部 ${lessonIds.length} 课时`);
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
