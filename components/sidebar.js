// ============================================
// components/sidebar.js - 课程侧边栏
// ============================================

const SidebarComponent = {
  render(activeLessonId, activeChapterId) {
    const totalProgress = App.getTotalProgress();
    const chapters = App.courseData;

    let html = `
      <div class="sidebar-progress-wrap">
        <div class="sp-title">总体进度</div>
        <div class="progress-label">
          <span>学习进度</span><span>${totalProgress}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${totalProgress}%"></div>
        </div>
      </div>`;

    chapters.forEach((chapter, idx) => {
      const isUnlocked = App.isChapterUnlocked(chapter.id);
      const isOpen = App.isChapterOpen(chapter.id);
      const isActive = chapter.id === activeChapterId;
      const chapterProgress = App.getChapterProgress(chapter.id);
      const isQuizPassed = App.isQuizPassed(chapter.id);
      const shouldShow = isActive || isOpen;

      html += `
        <div class="sidebar-chapter">
          <div class="sidebar-chapter-header ${isActive ? 'active open' : ''} ${!isUnlocked || !isOpen ? 'locked' : ''}"
               onclick="SidebarComponent.toggleChapter(this, '${chapter.id}')">
            <span class="ch-num">${idx + 1}</span>
            <span style="flex:1;font-size:12px">${chapter.title}</span>
            ${!isUnlocked ? '<span style="font-size:11px">🔒</span>' : ''}
            ${isQuizPassed ? '<span style="font-size:11px;color:var(--success)">✓</span>' : ''}
            <span class="ch-arrow">▶</span>
          </div>
          <div class="sidebar-lessons" style="display:${isActive ? 'block' : 'none'}">`;

      chapter.lessons.forEach(lesson => {
        const isCompleted = App.isLessonCompleted(lesson.id);
        const isLessonActive = lesson.id === activeLessonId;
        const canAccess = isUnlocked && isOpen;

        html += `
          <div class="sidebar-lesson ${isLessonActive ? 'active' : ''} ${!canAccess ? 'locked' : ''} ${isCompleted ? 'completed' : ''}"
               onclick="${canAccess ? `SidebarComponent.goLesson('${chapter.id}', '${lesson.id}')` : 'Toast.warning(\"请先解锁本章节\")'}"
               title="${lesson.title}">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lesson.title}</span>
            <span class="lesson-check">${isCompleted ? '✅' : ''}</span>
          </div>`;
      });

      // 章节测验入口
      if (isUnlocked && isOpen) {
        const allDone = chapter.lessons.every(l => App.isLessonCompleted(l.id));
        html += `
          <div class="sidebar-lesson ${!allDone ? 'locked' : ''} ${isQuizPassed ? 'completed' : ''}"
               onclick="${allDone ? `SidebarComponent.goQuiz('${chapter.id}')` : 'Toast.warning(\"请先完成本章所有课时\")'}"
               style="color:${isQuizPassed ? 'var(--success)' : 'var(--warning)'}">
            <span>📝 章节测验</span>
            <span class="lesson-check">${isQuizPassed ? '✅' : (allDone ? '→' : '🔒')}</span>
          </div>`;
      }

      html += `</div></div>`;
    });

    return html;
  },

  toggleChapter(header, chapterId) {
    const lessons = header.nextElementSibling;
    const isOpen = lessons.style.display !== 'none';
    // 先收起所有
    document.querySelectorAll('.sidebar-lessons').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.sidebar-chapter-header').forEach(el => el.classList.remove('open'));
    // 切换当前
    if (!isOpen) {
      lessons.style.display = 'block';
      header.classList.add('open');
    }
  },

  goLesson(chapterId, lessonId) {
    Router.setHash('lesson', { chapter: chapterId, lesson: lessonId });
    Router.navigate('lesson', { chapter: chapterId, lesson: lessonId });
  },

  goQuiz(chapterId) {
    Router.setHash('quiz', { chapter: chapterId });
    Router.navigate('quiz', { chapter: chapterId });
  }
};
