// ============================================
// pages/course.js - 章节详情页（课时列表）
// ============================================

function renderCoursePage(params) {
  const chapterId = params && params.chapter;

  // 如果没有指定章节，找第一个可访问的章节
  let chapter = null;
  if (chapterId) {
    chapter = App.courseData.find(c => c.id === chapterId);
  }
  if (!chapter) {
    chapter = App.courseData.find(c => App.isChapterUnlocked(c.id) && App.isChapterOpen(c.id));
  }
  if (!chapter) {
    Router.navigate('home');
    return;
  }

  const chapterIdx = App.courseData.indexOf(chapter);
  const chapterColors = ['tag-ch1', 'tag-ch2', 'tag-ch3', 'tag-ch4', 'tag-ch5'];
  const isQuizPassed = App.isQuizPassed(chapter.id);
  const progress = App.getChapterProgress(chapter.id);
  const allLessonsDone = chapter.lessons.every(l => App.isLessonCompleted(l.id));

  // 课时列表
  let lessonsHtml = '';
  chapter.lessons.forEach((lesson, i) => {
    const isCompleted = App.isLessonCompleted(lesson.id);
    const isLocked = false; // 课时内部不锁，章节解锁后全部可访问

    lessonsHtml += `
      <div class="lesson-card ${isCompleted ? 'completed' : ''}"
           onclick="Router.setHash('lesson',{chapter:'${chapter.id}',lesson:'${lesson.id}'});Router.navigate('lesson',{chapter:'${chapter.id}',lesson:'${lesson.id}'})">
        <div class="lesson-card-left">
          <div class="lesson-num ${isCompleted ? 'done' : ''}">${isCompleted ? '✓' : i + 1}</div>
          <div>
            <div class="lesson-card-title">${lesson.title}</div>
            <div class="lesson-card-meta">
              <span>⏱ ${lesson.duration || '约30分钟'}</span>
              ${(lesson.objectives || lesson.goals || []).length ? `<span>🎯 ${(lesson.objectives || lesson.goals).length} 个目标</span>` : ''}
            </div>
          </div>
        </div>
        <div class="lesson-card-right">
          ${isCompleted
            ? '<span class="badge badge-green">✅ 已完成</span>'
            : '<span style="font-size:18px;color:var(--text3)">›</span>'}
        </div>
      </div>`;
  });

  // 测验入口
  const quizSection = `
    <div class="quiz-entry ${!allLessonsDone ? 'locked' : ''}"
         onclick="${allLessonsDone ? `goToQuizFromCourse('${chapter.id}')` : 'Toast.info(\"请先完成本章所有课时\")'}">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:28px">${isQuizPassed ? '🏆' : '📝'}</div>
        <div>
          <div style="font-size:15px;font-weight:700;margin-bottom:2px">
            ${isQuizPassed ? '章节测验（已通过）' : '章节测验'}
          </div>
          <div style="font-size:13px;color:var(--text3)">
            ${isQuizPassed
              ? '✅ 恭喜通过！下一章已解锁'
              : allLessonsDone
                ? '完成全部课时，参加测验解锁下一章 →'
                : `还需完成 ${chapter.lessons.filter(l => !App.isLessonCompleted(l.id)).length} 个课时才能参加测验`}
          </div>
        </div>
      </div>
      ${isQuizPassed
        ? '<span class="badge badge-green" style="font-size:13px">已通过</span>'
        : allLessonsDone
          ? '<span class="badge badge-orange" style="font-size:13px">去测验 →</span>'
          : '<span style="font-size:18px;color:var(--text3)">🔒</span>'}
    </div>`;

  const sidebar = SidebarComponent.render(null, chapter.id);
  const content = `
    <div class="lesson-header">
      <div class="lesson-breadcrumb">
        <span onclick="Router.setHash('home');Router.navigate('home')" style="cursor:pointer">首页</span>
        <span>›</span>
        <span style="color:var(--text2)">${chapter.title}</span>
      </div>
      <h1 class="lesson-title">${chapter.title}</h1>
      <div class="lesson-meta">
        <span class="badge ${chapterColors[chapterIdx]}">${chapter.tag || '学习中'}</span>
        <span style="font-size:13px;color:var(--text3)">📚 ${chapter.lessons.length} 课时</span>
        <span style="font-size:13px;color:var(--text3)">⏱ ${chapter.duration || '约3小时'}</span>
      </div>
    </div>

    <!-- 章节描述 -->
    <div class="content-section" style="margin-bottom:16px">
      <p style="font-size:14px;color:var(--text2);line-height:1.8">${chapter.desc}</p>

      <!-- 总体进度 -->
      <div style="margin-top:16px;padding:16px;background:var(--card2);border-radius:var(--radius-sm);border:1px solid var(--border)">
        <div class="progress-label" style="margin-bottom:8px">
          <span style="font-weight:600;font-size:14px">本章学习进度</span>
          <span style="font-size:13px;color:var(--text3)">${chapter.lessons.filter(l => App.isLessonCompleted(l.id)).length} / ${chapter.lessons.length} 课时完成</span>
        </div>
        <div class="progress-bar" style="height:10px"><div class="progress-fill" style="width:${progress}%"></div></div>
        <div style="margin-top:8px;font-size:12px;color:var(--text3)">
          ${progress === 100 ? '🎉 全部课时完成！' : `已完成 ${progress}%`}
        </div>
      </div>
    </div>

    <!-- 课时列表 -->
    <div class="content-section">
      <h2 class="section-title"><span class="section-icon">📚</span>课时列表</h2>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${lessonsHtml}
      </div>
    </div>

    <!-- 章节测验 -->
    <div class="content-section">
      <h2 class="section-title"><span class="section-icon">📝</span>章节测验</h2>
      ${quizSection}
    </div>
  `;

  renderWithSidebar(sidebar, content);
}

function goToQuizFromCourse(chapterId) {
  Router.setHash('quiz', { chapter: chapterId });
  Router.navigate('quiz', { chapter: chapterId });
}
