# 电商PS设计学堂 · 部署说明

## 项目信息
- **网站名称**：电商PS设计学堂
- **最终域名**：ps.kybin.top
- **技术栈**：原生 HTML + CSS + JavaScript（无需构建工具）
- **数据库**：Supabase（已配置）
- **部署平台**：Cloudflare Pages

---

## 一、Supabase 数据库初始化

1. 登录 [Supabase 控制台](https://supabase.com)
2. 进入项目 `hakdgutcjjvaokebaltm`
3. 左侧菜单 → **SQL Editor**
4. 复制 `supabase-setup.sql` 内容粘贴执行
5. 执行后在 Table Editor 确认：5 张表均已创建，users 表有管理员 `kyb`

---

## 二、Cloudflare Pages 部署

### GitHub 连接（推荐）
```bash
cd ps-learning
git init && git add . && git commit -m "初始部署"
git remote add origin https://github.com/你的用户名/ps-learning.git
git push -u origin main
```
然后在 Cloudflare Pages → Connect to Git → 选仓库 → 框架选 None → 部署

### 直接上传
将整个文件夹压缩为 zip，在 Cloudflare Pages 选 Upload assets 上传

---

## 三、管理员账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| kyb | kyb123456 | admin |

---

## 四、图片素材
图片放在 img/ch1/ ~ img/ch5/ 对应目录下，文件名见各章节 js 文件中的 refImg 字段。
图片缺失时页面显示占位符，不影响功能，可后续逐步补充。
