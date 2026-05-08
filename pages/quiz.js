// ============================================
// pages/quiz.js - 章节测验页
// ============================================

let quizState = {
  chapterId: null,
  questions: [],
  current: 0,
  answers: {},  // questionIndex -> optionIndex
  submitted: false,
  score: 0
};

function renderQuizPage(params) {
  const chapterId = params.chapter;
  const chapter = App.courseData.find(c => c.id === chapterId);
  if (!chapter) { Router.navigate('home'); return; }

  // 检查是否所有课时已完成
  const allDone = chapter.lessons.every(l => App.isLessonCompleted(l.id));
  if (!allDone) {
    render(`
      <div class="page-wrap">
        <div class="quiz-page">
          <div class="empty-state">
            <div class="empty-icon">🔒</div>
            <div class="empty-title">请先完成本章所有课时</div>
            <div class="empty-desc" style="margin-bottom:24px">完成所有课时后才能参加章节测验</div>
            <button class="btn btn-primary" onclick="Router.setHash('home');Router.navigate('home')">返回首页</button>
          </div>
        </div>
      </div>`);
    return;
  }

  // 检查是否已通过
  const alreadyPassed = App.isQuizPassed(chapterId);

  // 获取题目（来自quizzes.js）
  const allQuizzes = typeof QUIZZES_DATA !== 'undefined' ? QUIZZES_DATA : {};
  const questions = allQuizzes[chapterId] || [];

  if (questions.length === 0) {
    render(`
      <div class="page-wrap">
        <div class="quiz-page">
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <div class="empty-title">测验题目暂未配置</div>
            <button class="btn btn-primary" onclick="Router.setHash('home');Router.navigate('home')" style="margin-top:16px">返回首页</button>
          </div>
        </div>
      </div>`);
    return;
  }

  // 初始化测验状态
  quizState = { chapterId, questions, current: 0, answers: {}, submitted: false, score: 0 };

  renderQuizQuestion(chapter, alreadyPassed);
}

function renderQuizQuestion(chapter, alreadyPassed) {
  const { questions, current } = quizState;
  const q = questions[current];
  const totalQ = questions.length;
  const progress = Math.round(((current) / totalQ) * 100);

  const optionLabels = ['A', 'B', 'C', 'D'];
  const selectedAnswer = quizState.answers[current];
  const isSubmitted = quizState.submitted;

  render(`
    <div class="page-wrap">
      <div class="quiz-page">
        <div class="quiz-header">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <button class="btn btn-ghost btn-sm" onclick="Router.setHash('home');Router.navigate('home')">← 返回</button>
            <div>
              <div class="quiz-title">📝 ${chapter ? chapter.title : ''} · 章节测验</div>
              <div class="quiz-sub">共 ${totalQ} 道题，答对 60% 即可通过解锁下一章</div>
            </div>
          </div>
          <div class="quiz-progress-wrap">
            <div class="progress-label">
              <span>第 ${current + 1} / ${totalQ} 题</span>
              <span>${progress}%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
          </div>
        </div>

        <div class="quiz-question">
          <div class="quiz-q-num">Q${current + 1} / ${totalQ}</div>
          <div class="quiz-q-text">${q.question}</div>
          <div class="quiz-options">
            ${q.options.map((opt, i) => {
              let cls = '';
              if (selectedAnswer !== undefined && isSubmitted) {
                if (i === q.answer) cls = 'correct';
                else if (i === selectedAnswer && i !== q.answer) cls = 'wrong';
              } else if (selectedAnswer === i) {
                cls = 'selected';
              }
              return `
                <div class="quiz-option ${cls}" onclick="${!isSubmitted ? `selectAnswer(${i})` : ''}">
                  <span class="opt-label">${optionLabels[i]}</span>
                  <span>${opt}</span>
                  ${isSubmitted && i === q.answer ? '<span style="margin-left:auto;font-size:16px">✓</span>' : ''}
                </div>`;
            }).join('')}
          </div>
          ${isSubmitted && q.explain ? `
            <div class="quiz-explain show">
              <div class="explain-label">💡 解析</div>
              <div>${q.explain}</div>
            </div>` : ''}
        </div>

        <div class="quiz-actions">
          ${!isSubmitted
            ? `<button class="btn btn-primary" onclick="submitAnswer()" ${selectedAnswer === undefined ? 'disabled' : ''}>
                 确认答案
               </button>`
            : current < totalQ - 1
              ? `<button class="btn btn-primary" onclick="nextQuestion()">下一题 →</button>`
              : `<button class="btn btn-primary" onclick="showQuizResult()">查看结果 →</button>`
          }
        </div>
      </div>
    </div>`);
}

function selectAnswer(index) {
  if (quizState.submitted) return;
  quizState.answers[quizState.current] = index;
  // 重新渲染选项高亮
  document.querySelectorAll('.quiz-option').forEach((el, i) => {
    el.classList.toggle('selected', i === index);
  });
  // 启用确认按钮
  document.querySelector('.quiz-actions button').disabled = false;
}

function submitAnswer() {
  quizState.submitted = true;
  const chapter = App.courseData.find(c => c.id === quizState.chapterId);
  renderQuizQuestion(chapter, false);
}

function nextQuestion() {
  quizState.current++;
  quizState.submitted = false;
  const chapter = App.courseData.find(c => c.id === quizState.chapterId);
  renderQuizQuestion(chapter, false);
}

async function showQuizResult() {
  const { questions, answers, chapterId } = quizState;
  let correct = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.answer) correct++;
  });

  const score = correct;
  const total = questions.length;
  const percent = Math.round((score / total) * 100);
  const passed = percent >= 60;

  // 保存结果到数据库
  await DB.saveQuizResult(App.user.id, chapterId, score, total, passed);

  // 更新本地
  const existing = App.quizResults.find(r => r.chapter_id === chapterId);
  if (existing) {
    Object.assign(existing, { score, total, passed });
  } else {
    App.quizResults.push({ user_id: App.user.id, chapter_id: chapterId, score, total, passed });
  }

  const chapter = App.courseData.find(c => c.id === chapterId);
  const chapterIdx = App.courseData.indexOf(chapter);
  const nextChapter = App.courseData[chapterIdx + 1];

  render(`
    <div class="page-wrap">
      <div class="quiz-page">
        <div class="quiz-result">
          <div class="result-icon">${passed ? '🎉' : '😅'}</div>
          <div class="result-score">${percent}%</div>
          <div class="result-msg">${passed ? '恭喜你，测验通过！' : '本次测验未通过，再试一次吧'}</div>
          <div class="result-sub">
            共 ${total} 题，答对 ${score} 题
            ${passed ? '· ' + (nextChapter ? `下一章「${nextChapter.title}」已解锁 🔓` : '全部章节已完成 🏆') : '· 需要答对60%才能通过'}
          </div>

          <!-- 答题详情 -->
          <div style="text-align:left;margin-bottom:32px">
            ${questions.map((q, i) => {
              const isCorrect = answers[i] === q.answer;
              const optLabels = ['A', 'B', 'C', 'D'];
              return `
                <div style="background:var(--card);border:1px solid ${isCorrect ? 'rgba(82,196,26,0.3)' : 'rgba(255,77,79,0.3)'};border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:8px">
                  <div style="display:flex;align-items:flex-start;gap:10px">
                    <span style="flex-shrink:0;font-size:14px">${isCorrect ? '✅' : '❌'}</span>
                    <div>
                      <div style="font-size:13px;font-weight:600;margin-bottom:4px">Q${i+1}. ${q.question}</div>
                      ${!isCorrect ? `<div style="font-size:12px;color:var(--red)">你的答案：${optLabels[answers[i]] || '未作答'}</div>` : ''}
                      <div style="font-size:12px;color:var(--success)">正确答案：${optLabels[q.answer]}. ${q.options[q.answer]}</div>
                      ${q.explain ? `<div style="font-size:12px;color:var(--text3);margin-top:4px">💡 ${q.explain}</div>` : ''}
                    </div>
                  </div>
                </div>`;
            }).join('')}
          </div>

          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            ${!passed ? `<button class="btn btn-outline" onclick="retakeQuiz()">重新测验</button>` : ''}
            ${passed && nextChapter ? `
              <button class="btn btn-primary" onclick="goToChapterLesson('${nextChapter.id}')">
                开始学习 ${nextChapter.title} →
              </button>` : ''}
            <button class="btn ${passed ? 'btn-primary' : 'btn-outline'}" onclick="Router.setHash('home');Router.navigate('home')">
              返回首页
            </button>
          </div>
        </div>
      </div>
    </div>`);
}

function retakeQuiz() {
  quizState.current = 0;
  quizState.answers = {};
  quizState.submitted = false;
  const chapter = App.courseData.find(c => c.id === quizState.chapterId);
  renderQuizQuestion(chapter, false);
}

function goToChapterLesson(chapterId) {
  const chapter = App.courseData.find(c => c.id === chapterId);
  if (chapter && chapter.lessons[0]) {
    Router.setHash('lesson', { chapter: chapterId, lesson: chapter.lessons[0].id });
    Router.navigate('lesson', { chapter: chapterId, lesson: chapter.lessons[0].id });
  }
}
