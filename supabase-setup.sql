-- ============================================
-- 电商PS设计学堂 · Supabase 数据库建表脚本
-- 执行顺序：依次运行以下 SQL
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username     TEXT UNIQUE NOT NULL,
  password     TEXT NOT NULL,
  name         TEXT,
  class_name   TEXT,
  role         TEXT NOT NULL DEFAULT 'student',  -- 'student' | 'admin'
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 章节开放控制表
CREATE TABLE IF NOT EXISTS chapters (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id   TEXT UNIQUE NOT NULL,  -- 'ch1' ~ 'ch5'
  order_num    INT NOT NULL,
  is_open      BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 学习进度表
CREATE TABLE IF NOT EXISTS progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id   TEXT NOT NULL,
  lesson_id    TEXT NOT NULL,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- 4. 测验结果表
CREATE TABLE IF NOT EXISTS quiz_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id   TEXT NOT NULL,
  score        INT NOT NULL DEFAULT 0,
  total        INT NOT NULL DEFAULT 5,
  passed       BOOLEAN NOT NULL DEFAULT FALSE,
  taken_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- 5. 全局设置表
CREATE TABLE IF NOT EXISTS settings (
  key          TEXT PRIMARY KEY,
  value        TEXT NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 初始数据
-- ============================================

-- 插入管理员账号（密码明文 kyb123456）
INSERT INTO users (username, password, name, role)
VALUES ('kyb', 'kyb123456', '管理员', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 插入5个章节配置（第1章默认开放）
INSERT INTO chapters (chapter_id, order_num, is_open) VALUES
  ('ch1', 1, TRUE),
  ('ch2', 2, TRUE),
  ('ch3', 3, TRUE),
  ('ch4', 4, TRUE),
  ('ch5', 5, TRUE)
ON CONFLICT (chapter_id) DO NOTHING;

-- 初始设置：注册开关（open = 允许注册）
INSERT INTO settings (key, value) VALUES
  ('register_open', 'true')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Row Level Security（RLS）配置
-- 使用 publishable key 的前端访问需要关闭 RLS
-- 或配置允许匿名读写的策略
-- ============================================

-- 方案A：关闭所有表的 RLS（简单，适合内网/校园使用）
ALTER TABLE users        DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters     DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress     DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings     DISABLE ROW LEVEL SECURITY;

-- 方案B（可选，更安全）：开启 RLS + 配置 anon 策略
-- 如需方案B，注释掉上面的 DISABLE 语句，改用以下策略：
/*
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters     ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings     ENABLE ROW LEVEL SECURITY;

-- 允许 anon 角色全部操作（前端直接用 anon key）
CREATE POLICY "anon_all_users"        ON users        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_chapters"     ON chapters     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_progress"     ON progress     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_quiz_results" ON quiz_results FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_settings"     ON settings     FOR ALL TO anon USING (true) WITH CHECK (true);
*/

-- ============================================
-- 验证查询（执行完上面的语句后运行）
-- ============================================
-- SELECT * FROM users;
-- SELECT * FROM chapters ORDER BY order_num;
-- SELECT * FROM settings;
