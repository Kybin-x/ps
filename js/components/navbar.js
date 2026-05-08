// ============================================
// components/navbar.js - 顶部导航
// ============================================

const NavbarComponent = {
  render() {
    const root = document.getElementById('navbar-root');
    if (!App.user) {
      root.innerHTML = `
        <nav class="navbar">
          <div class="navbar-brand" onclick="Router.navigate('home')">
            <span class="brand-ps">PS</span>
            <span class="brand-name">电商PS设计学堂</span>
          </div>
        </nav>`;
      return;
    }

    const initial = (App.user.name || App.user.username || '?').charAt(0).toUpperCase();
    const isAdmin = Auth.isAdmin();

    root.innerHTML = `
      <nav class="navbar">
        <div class="navbar-brand" onclick="Router.setHash('home'); Router.navigate('home')">
          <span class="brand-ps">PS</span>
          <span class="brand-name">电商PS设计学堂</span>
        </div>
        <div class="navbar-nav">
          <span class="nav-link" data-route="home" onclick="Router.setHash('home'); Router.navigate('home')">🏠 首页</span>
          <span class="nav-link" data-route="camp" onclick="Router.setHash('camp'); Router.navigate('camp')">🏆 竞赛训练营</span>
          ${isAdmin ? `<span class="nav-link" data-route="admin" onclick="Router.setHash('admin'); Router.navigate('admin')">⚙️ 管理后台</span>` : ''}
        </div>
        <div class="navbar-spacer"></div>
        <div class="navbar-dropdown" id="user-dropdown">
          <div class="navbar-user" onclick="NavbarComponent.toggleDropdown()">
            <div class="avatar">${initial}</div>
            <span>${App.user.name || App.user.username}</span>
            <span style="font-size:10px;color:var(--text3)">▼</span>
          </div>
          <div class="navbar-dropdown-menu" id="user-menu">
            <div class="dropdown-item">
              <span>👤</span>
              <span>${App.user.class_name ? App.user.class_name + ' · ' : ''}${isAdmin ? '管理员' : '学生'}</span>
            </div>
            <div class="divider" style="margin:4px 0"></div>
            <div class="dropdown-item danger" onclick="Auth.logout()">
              <span>🚪</span><span>退出登录</span>
            </div>
          </div>
        </div>
      </nav>`;

    // 点击外部关闭下拉
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('user-dropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        const menu = document.getElementById('user-menu');
        if (menu) menu.classList.remove('open');
      }
    });
  },

  toggleDropdown() {
    const menu = document.getElementById('user-menu');
    if (menu) menu.classList.toggle('open');
  },

  updateActive(path) {
    document.querySelectorAll('.nav-link[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === path);
    });
  }
};
