// ============================================
// pages/register.js - 注册页
// ============================================

function renderRegisterPage() {
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
        <h2 class="auth-title">创建账号 ✨</h2>
        <div class="form-group">
          <label class="form-label">真实姓名</label>
          <input class="form-input" id="reg-name" type="text" placeholder="请输入你的真实姓名" />
        </div>
        <div class="form-group">
          <label class="form-label">班级</label>
          <input class="form-input" id="reg-class" type="text" placeholder="例如：电商2301班" />
        </div>
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input class="form-input" id="reg-username" type="text" placeholder="设置登录用户名（字母/数字）" autocomplete="username" />
          <div class="form-hint">用户名只能包含字母、数字和下划线</div>
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input class="form-input" id="reg-password" type="password" placeholder="设置密码（至少6位）" autocomplete="new-password" />
        </div>
        <div class="form-group">
          <label class="form-label">确认密码</label>
          <input class="form-input" id="reg-password2" type="password" placeholder="再次输入密码" autocomplete="new-password" />
        </div>
        <button class="btn btn-primary btn-block btn-lg" id="reg-btn" onclick="handleRegister()">
          注册账号
        </button>
        <div class="auth-footer">
          已有账号？<a onclick="Router.setHash('login'); Router.navigate('login')">返回登录</a>
        </div>
      </div>
    </div>
  `);
}

async function handleRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const className = document.getElementById('reg-class').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;
  const btn = document.getElementById('reg-btn');

  if (!name || !className || !username || !password) {
    Toast.warning('请填写所有字段');
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    Toast.warning('用户名只能包含字母、数字和下划线');
    return;
  }
  if (password.length < 6) {
    Toast.warning('密码至少需要6位');
    return;
  }
  if (password !== password2) {
    Toast.warning('两次输入的密码不一致');
    return;
  }

  btn.disabled = true;
  btn.textContent = '注册中...';

  const result = await Auth.register({ username, password, name, className });

  if (result.success) {
    Toast.success('注册成功！请登录');
    setTimeout(() => {
      Router.setHash('login');
      Router.navigate('login');
    }, 1000);
  } else {
    Toast.error(result.message);
    btn.disabled = false;
    btn.textContent = '注册账号';
  }
}
