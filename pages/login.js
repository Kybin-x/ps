// ============================================
// pages/login.js - 登录页
// ============================================

function renderLoginPage() {
  NavbarComponent.render();
  render(`
    <div class="auth-page">
      <div class="auth-bg-decor">
        <div class="decor-circle"></div>
        <div class="decor-circle"></div>
      </div>
      <div class="auth-box">
        <div class="auth-logo">
          <div class="logo-ps">PS</div>
          <div class="logo-name">电商PS设计学堂</div>
        </div>
        <h2 class="auth-title">欢迎回来 👋</h2>
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input class="form-input" id="login-username" type="text" placeholder="请输入用户名" autocomplete="username" />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input class="form-input" id="login-password" type="password" placeholder="请输入密码" autocomplete="current-password" />
        </div>
        <button class="btn btn-primary btn-block btn-lg" id="login-btn" onclick="handleLogin()">
          登录
        </button>
        <div class="auth-footer">
          还没有账号？<a onclick="Router.setHash('register'); Router.navigate('register')">立即注册</a>
        </div>
      </div>
    </div>
  `);

  // 回车登录
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('login-username').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('login-password').focus();
  });
}

async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');

  if (!username || !password) {
    Toast.warning('请输入用户名和密码');
    return;
  }

  btn.disabled = true;
  btn.textContent = '登录中...';

  const result = await Auth.login(username, password);

  if (result.success) {
    Toast.success('登录成功，欢迎回来！');
    NavbarComponent.render();
    setTimeout(() => {
      Router.setHash('home');
      Router.navigate('home');
    }, 300);
  } else {
    Toast.error(result.message);
    btn.disabled = false;
    btn.textContent = '登录';
  }
}
