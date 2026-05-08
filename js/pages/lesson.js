// ============================================
// pages/lesson.js - 课时详情页
// ============================================

function renderLessonPage(params) {
  const chapterId = params.chapter;
  const lessonId = params.lesson;

  const chapter = App.courseData.find(c => c.id === chapterId);
  if (!chapter) { Router.navigate('home'); return; }

  const lesson = chapter.lessons.find(l => l.id === lessonId);
  if (!lesson) { Router.navigate('home'); return; }

  const isCompleted = App.isLessonCompleted(lessonId);
  const lessonIndex = chapter.lessons.findIndex(l => l.id === lessonId);
  const prevLesson = lessonIndex > 0 ? chapter.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < chapter.lessons.length - 1 ? chapter.lessons[lessonIndex + 1] : null;
  const isLastLesson = lessonIndex === chapter.lessons.length - 1;
  const allLessonsDone = chapter.lessons.every(l => App.isLessonCompleted(l.id));
  const isQuizPassed = App.isQuizPassed(chapterId);

  // 渲染内容块
  const contentHtml = renderLessonContent(lesson);

  // 渲染实战练习
  const practiceHtml = lesson.practice ? renderPractice(lesson.practice) : '';

  // 下一步按钮
  let nextBtnHtml = '';
  if (isLastLesson && !isQuizPassed) {
    nextBtnHtml = `
      <button class="btn btn-primary" onclick="goToQuiz('${chapterId}')" ${!allLessonsDone ? 'disabled title="请先完成本章所有课时"' : ''}>
        📝 参加章节测验 →
      </button>`;
  } else if (isLastLesson && isQuizPassed) {
    nextBtnHtml = `
      <button class="btn btn-success" onclick="Router.setHash('home');Router.navigate('home')">
        ✅ 本章已完成，返回首页
      </button>`;
  } else if (nextLesson) {
    nextBtnHtml = `
      <button class="btn btn-primary" onclick="SidebarComponent.goLesson('${chapterId}','${nextLesson.id}')">
        下一课：${nextLesson.title} →
      </button>`;
  }

  const sidebar = SidebarComponent.render(lessonId, chapterId);
  const content = `
    <div class="lesson-header">
      <div class="lesson-breadcrumb">
        <span onclick="Router.setHash('home');Router.navigate('home')">首页</span>
        <span>›</span>
        <span>${chapter.title}</span>
        <span>›</span>
        <span style="color:var(--text2)">${lesson.title}</span>
      </div>
      <h1 class="lesson-title">${lesson.title}</h1>
      <div class="lesson-meta">
        <span class="badge ${['tag-ch1','tag-ch2','tag-ch3','tag-ch4','tag-ch5'][App.courseData.indexOf(chapter)]}">${chapter.title}</span>
        <span style="font-size:13px;color:var(--text3)">⏱ 约 ${lesson.duration || '20分钟'}</span>
        ${isCompleted ? '<span class="badge badge-green">✅ 已完成</span>' : ''}
      </div>
    </div>

    <!-- 学习目标 -->
    <div class="lesson-objectives">
      <div class="obj-title">🎯 学习目标</div>
      <ul>${(lesson.objectives || lesson.goals || []).map(o => `<li>${o}</li>`).join('')}</ul>
    </div>

    <!-- 课程内容 -->
    ${contentHtml}

    <!-- 实战练习 -->
    ${practiceHtml}

    <!-- 完成打卡 -->
    <div class="complete-btn-wrap">
      <button class="complete-btn ${isCompleted ? 'done' : ''}" id="complete-btn"
              onclick="${isCompleted ? '' : `markComplete('${chapterId}','${lessonId}')`}">
        ${isCompleted ? '✅ 已完成打卡' : '✅ 完成本节，打卡！'}
      </button>
      ${isCompleted ? '<div style="margin-top:8px;font-size:13px;color:var(--text3)">继续学习下一节吧～</div>' : ''}
    </div>

    <!-- 课时导航 -->
    <div class="lesson-nav">
      <div>
        ${prevLesson ? `<button class="btn btn-outline" onclick="SidebarComponent.goLesson('${chapterId}','${prevLesson.id}')">← ${prevLesson.title}</button>` : '<span></span>'}
      </div>
      <div>${nextBtnHtml}</div>
    </div>
  `;

  renderWithSidebar(sidebar, content);
}

// 渲染课时内容块（兼容两种格式）
// 格式A: lesson.sections = [{ icon, title, text, steps, tips, keypoints }]  ← chapter1-3
// 格式B: lesson.steps = [{ title, desc, img, imgAlt }] + lesson.keyOps = [...] ← chapter4-5
function renderLessonContent(lesson) {
  // 格式A：有 sections
  if (lesson.sections && lesson.sections.length) {
    let output = lesson.sections.map(section => {
      let html = `<div class="content-section">`;
      html += `<h2 class="section-title"><span class="section-icon">${section.icon || '📖'}</span>${section.title}</h2>`;

      if (section.text) {
        html += `<p style="font-size:14px;color:var(--text2);line-height:1.8;margin-bottom:16px">${section.text}</p>`;
      }

      if (section.steps) {
        section.steps.forEach((step, i) => {
          html += renderStepBlock(step, i);
        });
      }

      if (section.tips) {
        section.tips.forEach(tip => {
          html += `<div class="key-tip"><span class="tip-icon">⚡</span><span>${tip}</span></div>`;
        });
      }

      if (section.keypoints) {
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-top:12px">`;
        section.keypoints.forEach(kp => {
          html += `
            <div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px">
              <div style="font-size:20px;margin-bottom:6px">${kp.icon}</div>
              <div style="font-size:13px;font-weight:600;margin-bottom:4px">${kp.title}</div>
              <div style="font-size:12px;color:var(--text3)">${kp.desc}</div>
            </div>`;
        });
        html += `</div>`;
      }

      html += `</div>`;
      return html;
    }).join('');

    // lesson 级别的 keyOps（chapter2/3 格式）
    if (lesson.keyOps && lesson.keyOps.length) {
      output += `<div class="content-section">`;
      output += `<h2 class="section-title"><span class="section-icon">⌨️</span>常用操作速查</h2>`;
      output += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">`;
      lesson.keyOps.forEach(op => {
        output += `
          <div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px">
            <div style="font-size:20px;margin-bottom:6px">${op.icon}</div>
            <div style="font-size:13px;font-weight:600;margin-bottom:2px">${op.title}</div>
            <div style="font-size:11px;color:var(--accent);margin-bottom:4px">${op.tag}</div>
            <div style="font-size:12px;color:var(--text3)">${op.desc}</div>
          </div>`;
      });
      output += `</div></div>`;
    }

    return output;
  }

  // 格式B：直接有 steps（chapter4/5 格式）
  if (lesson.steps && lesson.steps.length) {
    let html = `<div class="content-section">`;
    html += `<h2 class="section-title"><span class="section-icon">📖</span>课程内容</h2>`;
    lesson.steps.forEach((step, i) => {
      html += renderStepBlock(step, i);
    });

    // keyOps（常用操作）
    if (lesson.keyOps && lesson.keyOps.length) {
      html += `<div style="margin-top:20px"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px;color:var(--text2)">⌨️ 常用操作速查</h3>`;
      html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">`;
      lesson.keyOps.forEach(op => {
        html += `
          <div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px">
            <div style="font-size:20px;margin-bottom:6px">${op.icon}</div>
            <div style="font-size:13px;font-weight:600;margin-bottom:2px">${op.title}</div>
            <div style="font-size:11px;color:var(--accent);margin-bottom:4px">${op.tag}</div>
            <div style="font-size:12px;color:var(--text3)">${op.desc}</div>
          </div>`;
      });
      html += `</div></div>`;
    }

    html += `</div>`;
    return html;
  }

  return '';
}

// 渲染单个步骤块
function renderStepBlock(step, i) {
  return `
    <div class="step-block">
      <div class="step-num">${i + 1}</div>
      <div class="step-body">
        <div class="step-title">${step.title}</div>
        <div class="step-desc">${step.desc || step.text || ''}</div>
        ${step.tip ? `<div class="key-tip" style="margin-top:12px"><span class="tip-icon">💡</span><span>${step.tip}</span></div>` : ''}
        ${step.shortcut ? `<div style="margin-top:8px;font-size:13px;color:var(--text3)">快捷键：<span class="kbd">${step.shortcut}</span></div>` : ''}
        ${step.img ? `
          <div class="step-img">
            <img src="${step.img}" alt="${step.imgAlt || step.title}" onerror="this.parentElement.innerHTML='<div class=\\"img-placeholder\\"><div class=\\"img-icon\\">🖼️</div><span>操作截图：${step.title}</span></div>'" />
          </div>` : `
          <div class="step-img">
            <div class="img-placeholder">
              <div class="img-icon">🖼️</div>
              <span>操作截图：${step.title}</span>
            </div>
          </div>`}
      </div>
    </div>`;
}

// 渲染实战练习
// 渲染实战练习（兼容两种数据格式）
// 格式A: { title, desc, materials, requirements, hints, resultImg, note }  ← chapter1
// 格式B: { task, hints, refImg, refAlt }  ← chapter2-5
function renderPractice(practice) {
  const isTaskFormat = !practice.title && practice.task;
  const title = practice.title || '实战练习';
  const desc = practice.desc || practice.task || '';
  const materials = practice.materials || [];
  const requirements = practice.requirements || [];
  const hints = practice.hints || [];
  const resultImg = practice.resultImg || practice.refImg || '';
  const resultAlt = practice.refAlt || '参考效果图';
  const note = practice.note || '';

  return `
    <div class="practice-section">
      <div class="practice-header">
        <div class="practice-title">🛠️ ${title}</div>
        <span class="practice-badge">实战练习</span>
      </div>

      <div class="practice-tabs">
        <div class="practice-tab active" onclick="switchPracticeTab(this,'ptab-task')">📋 ${isTaskFormat ? '练习任务' : '素材说明'}</div>
        <div class="practice-tab" onclick="switchPracticeTab(this,'ptab-hints')">💡 步骤提示</div>
        <div class="practice-tab" onclick="switchPracticeTab(this,'ptab-result')">🎨 参考效果</div>
      </div>

      <div id="ptab-task" class="practice-content active">
        ${isTaskFormat ? `
          <div style="padding:16px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;color:var(--text2);line-height:1.8">${desc}</div>
        ` : `
          ${desc ? `<p style="font-size:14px;color:var(--text2);margin-bottom:16px">${desc}</p>` : ''}
          <div class="material-list">
            ${materials.map(m => `
              <div class="material-item">
                <span class="mat-icon">${m.icon || '📄'}</span>
                <span class="mat-name">${m.name}</span>
                <span class="mat-note">${m.note || ''}</span>
              </div>`).join('')}
          </div>
          ${requirements.length ? `
            <div style="margin-top:16px;padding:14px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm)">
              <div style="font-size:12px;color:var(--text3);margin-bottom:8px;font-weight:600">📐 作品要求</div>
              ${requirements.map(r => `<div style="font-size:13px;color:var(--text2);padding:3px 0">• ${r}</div>`).join('')}
            </div>` : ''}
        `}
      </div>

      <div id="ptab-hints" class="practice-content">
        <ul class="hint-list">
          ${hints.map((h, i) => `
            <li class="hint-item">
              <span class="hint-num">${i+1}</span>
              <span>${h}</span>
            </li>`).join('')}
        </ul>
      </div>

      <div id="ptab-result" class="practice-content">
        <div class="practice-img-wrap">
          ${resultImg
            ? `<img src="${resultImg}" alt="${resultAlt}" onerror="this.parentElement.innerHTML='<div class=\\"img-placeholder\\"><div style=\\"font-size:36px\\">🎨</div><span>${resultAlt}</span></div>'" />`
            : `<div class="img-placeholder"><div style="font-size:36px">🎨</div><span>${resultAlt}</span></div>`}
        </div>
        ${note ? `<p style="margin-top:12px;font-size:13px;color:var(--text3)">💬 ${note}</p>` : ''}
      </div>
    </div>`;
}

function switchPracticeTab(el, tabId) {
  el.closest('.practice-section').querySelectorAll('.practice-tab').forEach(t => t.classList.remove('active'));
  el.closest('.practice-section').querySelectorAll('.practice-content').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
}

async function markComplete(chapterId, lessonId) {
  const btn = document.getElementById('complete-btn');
  btn.disabled = true;
  btn.textContent = '打卡中...';

  const { error } = await DB.markLessonComplete(App.user.id, lessonId, chapterId);
  if (error) {
    Toast.error('打卡失败，请重试');
    btn.disabled = false;
    btn.textContent = '✅ 完成本节，打卡！';
    return;
  }

  // 更新本地进度
  const existing = App.progress.find(p => p.lesson_id === lessonId);
  if (existing) {
    existing.completed = true;
  } else {
    App.progress.push({ user_id: App.user.id, lesson_id: lessonId, chapter_id: chapterId, completed: true });
  }

  Toast.success('🎉 打卡成功！继续加油！');
  // 重新渲染
  renderLessonPage({ chapter: chapterId, lesson: lessonId });
}

function goToQuiz(chapterId) {
  Router.setHash('quiz', { chapter: chapterId });
  Router.navigate('quiz', { chapter: chapterId });
}
