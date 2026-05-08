// ============================================
// auth.js - 登录 / 注册 / 会话管理
// ============================================

const Auth = {
  // 简单密码哈希（生产环境建议使用更强的方案）
  hashPassword(password) {
    let hash = 0;
    const str = password + 'ps_salt_2024';
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36) + str.length.toString(36);
  },

  // 登录
  async login(username, password) {
    const { data: user, error } = await DB.getUserByUsername(username.trim());
    if (error || !user) {
      return { success: false, message: '用户名或密码错误' };
    }
    if (user.is_active === false) {
      return { success: false, message: '账号已被停用，请联系管理员' };
    }
    if (user.password_hash !== this.hashPassword(password)) {
      return { success: false, message: '用户名或密码错误' };
    }
    // 登录成功
    App.user = user;
    localStorage.setItem('ps_user', JSON.stringify(user));
    await loadUserData();
    return { success: true, user };
  },

  // 注册
  async register(formData) {
    // 检查注册是否开放
    const { data: settings } = await DB.getSettings();
    if (settings.register_open === 'false') {
      return { success: false, message: '注册通道已关闭，请联系管理员' };
    }

    const { username, password, name, className } = formData;

    // 检查用户名是否已存在
    const { data: existing } = await DB.getUserByUsername(username.trim());
    if (existing) {
      return { success: false, message: '用户名已存在，请换一个' };
    }

    // 创建用户
    const { data: user, error } = await DB.createUser({
      username: username.trim(),
      password_hash: this.hashPassword(password),
      name: name.trim(),
      class_name: className.trim(),
      role: 'student',
      is_active: true,
      created_at: new Date().toISOString()
    });

    if (error) {
      return { success: false, message: '注册失败：' + error.message };
    }

    return { success: true, user };
  },

  // 退出登录
  logout() {
    App.user = null;
    App.progress = [];
    App.quizResults = [];
    localStorage.removeItem('ps_user');
    Router.navigate('login');
    NavbarComponent.render();
  },

  // 检查是否是管理员
  isAdmin() {
    return App.user && App.user.role === 'admin';
  }
};
