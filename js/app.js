// ============================================
// app.js - 主路由 + 应用初始化
// ============================================

// 全局应用状态
const App = {
  user: null,         // 当前登录用户
  progress: [],       // 用户进度列表
  quizResults: [],    // 测验结果列表
  chapters: [],       // 章节配置（DB）
  settings: {},       // 全局设置

  // 所有课程数据（来自各章节JS文件）
  get courseData() {
    return [
      typeof CHAPTER1_DATA !== 'undefined' ? CHAPTER1_DATA : null,
      typeof CHAPTER2_DATA !== 'undefined' ? CHAPTER2_DATA : null,
      typeof CHAPTER3_DATA !== 'undefined' ? CHAPTER3_DATA : null,
      typeof CHAPTER4_DATA !== 'undefined' ? CHAPTER4_DATA : null,
      typeof CHAPTER5_DATA !== 'undefined' ? CHAPTER5_DATA : null,
    ].filter(Boolean);
  },

  // 获取章节数据
  getChapter(chapterIndex) {
    return this.courseData[chapterIndex] || null;
  },

  // 获取课时数据
  getLesson(chapterId, lessonId) {
    const ch = this.courseData.find(c => c.id === chapterId);
    if (!ch) return null;
    return ch.lessons.find(l => l.id === lessonId) || null;
  },

  // 检查课时是否已完成
  isLessonCompleted(lessonId) {
    return this.progress.some(p => p.lesson_id === lessonId && p.completed);
  },

  // 检查章节测验是否通过
  isQuizPassed(chapterId) {
    return this.quizResults.some(r => r.chapter_id === chapterId && r.passed);
  },

  // 检查章节是否解锁（第一章默认解锁，之后需通过上一章测验）
  isChapterUnlocked(chapterId) {
    const allChapters = this.courseData;
    const idx = allChapters.findIndex(c => c.id === chapterId);
    if (idx === 0) return true;
    const prevChapter = allChapters[idx - 1];
    return prevChapter ? this.isQuizPassed(prevChapter.id) : false;
  },

  // 检查章节是否在DB中被管理员关闭
  isChapterOpen(chapterId) {
    const dbChapter = this.chapters.find(c => c.chapter_id === chapterId);
    if (!dbChapter) return true; // 默认开放
    return dbChapter.is_open !== false;
  },

  // 计算总进度
  getTotalProgress() {
    const totalLessons = this.courseData.reduce((sum, ch) => sum + ch.lessons.length, 0);
    const completed = this.progress.filter(p => p.completed).length;
    return totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
  },

  // 计算章节进度
  getChapterProgress(chapterId) {
    const ch = this.courseData.find(c => c.id === chapterId);
    if (!ch) return 0;
    const total = ch.lessons.length;
    const done = ch.lessons.filter(l => this.isLessonCompleted(l.id)).length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }
};

// ============================================
// 路由系统
// ============================================
const Router = {
  routes: {},
  current: null,

  register(path, handler) {
    this.routes[path] = handler;
  },

  async navigate(path, params = {}) {
    this.current = { path, params };
    const handler = this.routes[path];
    if (handler) {
      await handler(params);
    } else {
      this.navigate('home');
    }
    // 更新导航高亮
    NavbarComponent.updateActive(path);
    window.scrollTo(0, 0);
  },

  // 从URL hash读取路由
  parseHash() {
    const hash = window.location.hash.slice(1) || '';
    const [path, ...queryParts] = hash.split('?');
    const params = {};
    if (queryParts.length) {
      queryParts.join('?').split('&').forEach(part => {
        const [k, v] = part.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
    return { path: path || 'home', params };
  },

  // 设置URL hash
  setHash(path, params = {}) {
    const query = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    window.location.hash = query ? `${path}?${query}` : path;
  }
};

// ============================================
// 渲染辅助
// ============================================
function render(html) {
  document.getElementById('app-root').innerHTML = html;
}

function renderWithSidebar(sidebarHtml, contentHtml) {
  document.getElementById('app-root').innerHTML = `
    <div class="page-wrap layout-with-sidebar">
      <div class="layout-sidebar">${sidebarHtml}</div>
      <div class="layout-content">${contentHtml}</div>
    </div>
  `;
}

// ============================================
// 应用初始化
// ============================================
async function initApp() {
  // 注册路由
  Router.register('login', () => renderLoginPage());
  Router.register('register', () => renderRegisterPage());
  Router.register('home', () => renderHomePage());
  Router.register('course', (p) => renderCoursePage(p));
  Router.register('lesson', (p) => renderLessonPage(p));
  Router.register('quiz', (p) => renderQuizPage(p));
  Router.register('camp', () => renderCampPage());
  Router.register('admin', (p) => renderAdminPage(p));

  // 监听hash变化
  window.addEventListener('hashchange', () => {
    const { path, params } = Router.parseHash();
    // 需要登录的页面检查
    const publicRoutes = ['login', 'register'];
    if (!publicRoutes.includes(path) && !App.user) {
      Router.navigate('login');
      return;
    }
    Router.navigate(path, params);
  });

  // 检查本地存储的登录状态
  const savedUser = localStorage.getItem('ps_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      // 验证用户是否仍然有效
      const { data, error } = await DB.getUser(user.id);
      if (data && !error && data.is_active !== false) {
        App.user = data;
        await loadUserData();
      } else {
        localStorage.removeItem('ps_user');
      }
    } catch (e) {
      localStorage.removeItem('ps_user');
    }
  }

  // 渲染导航栏
  NavbarComponent.render();

  // 路由跳转
  const { path, params } = Router.parseHash();
  const publicRoutes = ['login', 'register'];

  if (!App.user && !publicRoutes.includes(path)) {
    Router.navigate('login');
  } else if (App.user && publicRoutes.includes(path)) {
    Router.navigate('home');
  } else {
    Router.navigate(path, params);
  }

  // 隐藏加载器
  setTimeout(() => {
    document.getElementById('page-loader').classList.add('hidden');
  }, 600);
}

// 加载用户数据（进度、设置等）
async function loadUserData() {
  if (!App.user) return;

  try {
    const [progressRes, quizRes, settingsRes, chaptersRes] = await Promise.all([
      DB.getUserProgress(App.user.id),
      DB.getAllQuizResults(),
      DB.getSettings(),
      DB.getChapters()
    ]);

    App.progress = progressRes.data || [];
    // 只保留当前用户的测验结果
    App.quizResults = (quizRes.data || []).filter(r => r.user_id === App.user.id);
    App.settings = settingsRes.data || {};
    App.chapters = chaptersRes.data || [];
  } catch (e) {
    console.error('加载用户数据失败', e);
  }
}

// 启动应用
window.addEventListener('DOMContentLoaded', initApp);
