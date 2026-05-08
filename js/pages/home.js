// ============================================
// pages/home.js - 首页（课程列表 + 进度总览）
// ============================================

function renderHomePage() {
  const user = App.user;
  const totalProgress = App.getTotalProgress();
  const chapters = App.courseData;
  const totalLessons = chapters.reduce((s, c) => s + c.lessons.length, 0);
  const completedLessons = App.progress.filter(p => p.completed).length;
  const passedQuizzes = App.quizResults.filter(r => r.passed).length;

  const chapterColors = ['tag-ch1', 'tag-ch2', 'tag-ch3', 'tag-ch4', 'tag-ch5'];
  const chapterIcons = ['🎨', '🖼️', '📦', '🎉', '✨'];
  const chapterTags = ['入门', '进阶', '进阶', '高阶', '高阶'];
  const tagColors = ['badge-green', 'badge-orange', 'badge-blue', 'badge-red', 'badge-gray'];

  let chaptersHtml = '';
  chapters.forEach((chapter, idx) => {
    const isUnlocked = App.isChapterUnlocked(chapter.id);
    const isOpen = App.isChapterOpen(chapter.id);
    const canAccess = isUnlocked && isOpen;
    const progress = App.getChapterProgress(chapter.id);
    const isQuizPassed = App.isQuizPassed(chapter.id);

    chaptersHtml += `
      <div class="chapter-card ${!canAccess ? 'locked' : ''}"
           onclick="${canAccess ? `goToChapter('${chapter.id}')` : (!isOpen ? 'Toast.info("该章节暂未开放")' : 'Toast.info("请先通过上一章节测验解锁")')}">
        <span class="chapter-num">${idx + 1}</span>
        <div>
          <div class="chapter-tag">
            <span class="badge ${tagColors[idx]}">${chapterIcons[idx]} ${chapterTags[idx]}</span>
            ${isQuizPassed ? '<span class="badge badge-green">✓ 已通关</span>' : ''}
            ${!isOpen ? '<span class="badge badge-gray">🔒 未开放</span>' : ''}
            ${isOpen && !isUnlocked ? '<span class="badge badge-gray">🔒 待解锁</span>' : ''}
          </div>
          <div class="chapter-title">${chapter.title}</div>
          <div class="chapter-desc">${chapter.desc}</div>
          <div style="margin-bottom:12px">
            <div class="progress-label">
              <span style="font-size:11px">${progress}% 完成</span>
              <span style="font-size:11px">${chapter.lessons.filter(l => App.isLessonCompleted(l.id)).length}/${chapter.lessons.length} 课时</span>
            </div>
            <div class="progress-bar sm"><div class="progress-fill" style="width:${progress}%"></div></div>
          </div>
          <div class="chapter-meta">
            <span>📚 ${chapter.lessons.length} 课时</span>
            <span>⏱ 约 ${chapter.duration}</span>
            <span class="${chapterColors[idx]}" style="padding:2px 8px;border-radius:4px;font-size:11px">${chapter.tag}</span>
          </div>
        </div>
      </div>`;
  });

  render(`
    <div class="page-wrap">
      <div class="home-hero">
        <div class="container">
          <div class="hero-eyebrow">🏆 备战市级·省级技能竞赛</div>
          <h1 class="hero-title">
            用 <span>Photoshop</span><br>设计你的电商未来
          </h1>
          <p class="hero-sub">从零开始，系统学习PS操作，掌握电商设计全流程，备战技能竞赛</p>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="stat-num">5</div>
              <div class="stat-label">学习章节</div>
            </div>
            <div class="hero-stat">
              <div class="stat-num">${totalLessons}</div>
              <div class="stat-label">课时内容</div>
            </div>
            <div class="hero-stat">
              <div class="stat-num">${totalProgress}%</div>
              <div class="stat-label">完成进度</div>
            </div>
          </div>
        </div>
      </div>

      <div class="container" style="padding-bottom:60px">
        <!-- 进度总览 -->
        <div class="progress-overview">
          <div style="display:flex;align-items:flex-start;gap:40px;flex-wrap:wrap">
            <div>
              <div class="overview-title">👋 你好，${user.name || user.username}！</div>
              <div class="overview-num">${totalProgress}%</div>
              <div class="overview-sub">总体学习进度 · 已完成 ${completedLessons}/${totalLessons} 课时</div>
              <div class="progress-bar lg"><div class="progress-fill" style="width:${totalProgress}%"></div></div>
            </div>
            <div style="display:flex;gap:24px;flex-wrap:wrap;padding-top:8px">
              <div style="text-align:center">
                <div style="font-size:28px;font-weight:800;color:var(--orange)">${completedLessons}</div>
                <div style="font-size:12px;color:var(--text3)">已完成课时</div>
              </div>
              <div style="text-align:center">
                <div style="font-size:28px;font-weight:800;color:var(--success)">${passedQuizzes}</div>
                <div style="font-size:12px;color:var(--text3)">通过测验</div>
              </div>
              <div style="text-align:center">
                <div style="font-size:28px;font-weight:800;color:var(--info)">${totalLessons - completedLessons}</div>
                <div style="font-size:12px;color:var(--text3)">剩余课时</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 章节标题 -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <h2 style="font-size:20px;font-weight:800">📚 课程章节</h2>
          <span style="font-size:13px;color:var(--text3)">完成章节测验可解锁下一章</span>
        </div>

        <!-- 章节卡片 -->
        <div class="chapter-grid">${chaptersHtml}</div>

        <!-- 竞赛训练营 -->
        <div style="margin-top:16px">
          <div class="camp-banner" onclick="Router.setHash('camp'); Router.navigate('camp')">
            <div class="camp-icon">🏆</div>
            <div class="camp-body">
              <div class="camp-label">COMPETITION TRAINING</div>
              <div class="camp-title">竞赛训练营</div>
              <div class="camp-desc">模拟赛题 · 限时实战 · 评分标准 · 历年优秀作品</div>
            </div>
            <div class="camp-arrow">→</div>
          </div>
        </div>
      </div>
    </div>
  `);
}

function goToChapter(chapterId) {
  // 找第一个未完成的课时
  const chapter = App.getChapter(App.courseData.findIndex(c => c.id === chapterId));
  if (!chapter) return;
  const firstLesson = chapter.lessons[0];
  if (firstLesson) {
    Router.setHash('lesson', { chapter: chapterId, lesson: firstLesson.id });
    Router.navigate('lesson', { chapter: chapterId, lesson: firstLesson.id });
  }
}
