-- ============================================
-- 电商PS设计学堂 - Supabase 数据库初始化脚本
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  class_name TEXT DEFAULT '',
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 章节配置表
CREATE TABLE IF NOT EXISTS chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id TEXT UNIQUE NOT NULL,
  order_num INTEGER NOT NULL,
  is_open BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 学习进度表
CREATE TABLE IF NOT EXISTS progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- 4. 测验结果表
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- 5. 全局设置表
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 初始化数据
-- ============================================

-- 插入管理员账号（密码: kyb123456）
-- password_hash 通过 hashPassword('kyb123456') 计算
INSERT INTO users (username, password_hash, name, class_name, role, is_active)
VALUES ('kyb', '78pktgl', '管理员', '教师', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- 插入章节配置
INSERT INTO chapters (chapter_id, order_num, is_open) VALUES
  ('ch1', 1, true),
  ('ch2', 2, true),
  ('ch3', 3, true),
  ('ch4', 4, true),
  ('ch5', 5, true)
ON CONFLICT (chapter_id) DO NOTHING;

-- 插入默认设置
INSERT INTO settings (key, value) VALUES
  ('register_open', 'true')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 禁用 Row Level Security（简化版，生产环境请启用）
-- ============================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
