// ============================================
// pages/camp.js - 竞赛训练营页（占位）
// ============================================

function renderCampPage() {
  const features = [
    { icon: '🎯', title: '竞赛题型解析', desc: '近年市级/省级赛题分析，掌握出题规律与评分重点' },
    { icon: '⏱', title: '限时实战练习', desc: '模拟赛场环境，60/90分钟限时完成，训练手速与临场发挥' },
    { icon: '📊', title: '作品评分标准', desc: '创意、规范、完成度三维评分，了解评委打分思路' },
    { icon: '🏅', title: '历年优秀作品', desc: '省市级获奖作品展示，学习优秀设计的思路与技巧' },
  ];

  render(`
    <div class="page-wrap">
      <div class="camp-page">
        <div class="camp-hero">
          <div class="camp-badge">COMPETITION TRAINING CAMP</div>
          <h1>🏆 竞赛训练营</h1>
          <p>专为市级、省级电商技能竞赛打造的强化训练模块，模拟真实赛场环境</p>
          <div class="camp-coming">
            <span style="font-size:20px">🚧</span>
            <span>内容即将上线，敬请期待</span>
          </div>
        </div>

        <div class="container" style="padding-bottom:60px">
          <div style="text-align:center;margin-bottom:40px">
            <h2 style="font-size:24px;font-weight:800;margin-bottom:8px">即将上线的功能</h2>
            <p style="color:var(--text2);font-size:14px">我们正在精心准备竞赛专项内容</p>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;margin-bottom:60px">
            ${features.map(f => `
              <div class="card" style="opacity:0.7;position:relative;overflow:hidden">
                <div style="position:absolute;top:12px;right:12px;font-size:11px;background:var(--card2);padding:2px 8px;border-radius:10px;color:var(--text3)">即将上线</div>
                <div style="font-size:36px;margin-bottom:12px">${f.icon}</div>
                <div style="font-size:16px;font-weight:700;margin-bottom:8px">${f.title}</div>
                <div style="font-size:13px;color:var(--text2);line-height:1.6">${f.desc}</div>
              </div>`).join('')}
          </div>

          <!-- 先去学基础 -->
          <div style="text-align:center;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:48px 24px">
            <div style="font-size:48px;margin-bottom:16px">📚</div>
            <h3 style="font-size:20px;font-weight:800;margin-bottom:8px">先打牢基础，再冲竞赛</h3>
            <p style="font-size:14px;color:var(--text2);margin-bottom:24px">完成5个章节的系统学习，是备战竞赛的最好准备</p>
            <button class="btn btn-primary btn-lg" onclick="Router.setHash('home');Router.navigate('home')">
              📚 继续学习课程 →
            </button>
          </div>
        </div>
      </div>
    </div>`);
}
