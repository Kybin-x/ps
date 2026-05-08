// ============================================
// supabase.js - 数据库连接配置
// ============================================

const SUPABASE_URL = 'https://hakdgutcjjvaokebaltm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GT32PnrYceH2V_Jxrw-W8w_6aeJ_GHC';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DB = {
  // 用户相关
  async getUser(id) {
    const { data, error } = await db.from('users').select('*').eq('id', id).single();
    return { data, error };
  },
  async getUserByUsername(username) {
    const { data, error } = await db.from('users').select('*').eq('username', username).maybeSingle();
    return { data, error };
  },
  async getAllUsers() {
    const { data, error } = await db.from('users').select('*').order('created_at', { ascending: false });
    return { data, error };
  },
  async createUser(userData) {
    const { data, error } = await db.from('users').insert(userData).select().single();
    return { data, error };
  },
  async updateUser(id, updates) {
    const { data, error } = await db.from('users').update(updates).eq('id', id).select().single();
    return { data, error };
  },

  // 设置相关
  async getSettings() {
    const { data, error } = await db.from('settings').select('*');
    if (error) return { data: { register_open: 'true' }, error: null };
    const settings = {};
    (data || []).forEach(item => { settings[item.key] = item.value; });
    return { data: settings, error: null };
  },
  async setSetting(key, value) {
    const { data, error } = await db.from('settings').upsert({ key, value: String(value) }, { onConflict: 'key' });
    return { data, error };
  },

  // 章节相关
  async getChapters() {
    const { data, error } = await db.from('chapters').select('*').order('order_num');
    return { data, error };
  },
  async updateChapter(id, updates) {
    const { data, error } = await db.from('chapters').update(updates).eq('id', id);
    return { data, error };
  },

  // 进度相关
  async getUserProgress(userId) {
    const { data, error } = await db.from('progress').select('*').eq('user_id', userId);
    return { data, error };
  },
  async markLessonComplete(userId, lessonId, chapterId) {
    const { data, error } = await db.from('progress').upsert(
      { user_id: userId, lesson_id: lessonId, chapter_id: chapterId, completed: true, completed_at: new Date().toISOString() },
      { onConflict: 'user_id,lesson_id' }
    );
    return { data, error };
  },
  async getAllProgress() {
    const { data, error } = await db.from('progress').select('*, users(username, name, class_name)');
    return { data, error };
  },

  // 测验相关
  async getQuizResult(userId, chapterId) {
    const { data, error } = await db.from('quiz_results').select('*').eq('user_id', userId).eq('chapter_id', chapterId).maybeSingle();
    return { data, error };
  },
  async saveQuizResult(userId, chapterId, score, total, passed) {
    const { data, error } = await db.from('quiz_results').upsert(
      { user_id: userId, chapter_id: chapterId, score, total, passed, completed_at: new Date().toISOString() },
      { onConflict: 'user_id,chapter_id' }
    );
    return { data, error };
  },
  async getAllQuizResults() {
    const { data, error } = await db.from('quiz_results').select('*, users(username, name, class_name)');
    return { data, error };
  }
};
