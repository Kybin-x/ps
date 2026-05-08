// ============================================
// components/progress.js - 进度相关辅助
// ============================================

const ProgressComponent = {
  // 渲染进度条HTML
  bar(percent, size = '') {
    return `
      <div class="progress-bar ${size}">
        <div class="progress-fill" style="width:${percent}%"></div>
      </div>`;
  },

  // 渲染带标签的进度条
  labeled(label, percent) {
    return `
      <div>
        <div class="progress-label"><span>${label}</span><span>${percent}%</span></div>
        ${this.bar(percent)}
      </div>`;
  },

  // 章节进度徽章
  chapterBadge(chapterId) {
    const p = App.getChapterProgress(chapterId);
    if (p === 100) return `<span class="badge badge-green">已完成</span>`;
    if (p > 0) return `<span class="badge badge-orange">进行中 ${p}%</span>`;
    return `<span class="badge badge-gray">未开始</span>`;
  }
};
