# 内存FAE助理工程师 · 成长手册

> 汇钜存储 · 12周训练 + M4-M6深化期 + 1-3年职业路径

Vue 3 打造的每日学习手册：**69 天任务 + 108 篇讲义 + 每日笔记 + 进度追踪**。

## 🚀 在线访问

部署到 GitHub Pages 后访问：`https://<你的用户名>.github.io/fae-handbook/`

## 🛠️ 本地开发

```bash
npm install
npm run dev       # 开发模式 http://localhost:5173
npm run validate  # 校验数据（weeks.js）
npm run lint      # 代码规范检查
npm run build     # 构建到 dist/
```

## 📦 部署

### GitHub Pages（自动）
1. 推送到 GitHub 仓库 main 分支（.github/workflows/deploy.yml 自动构建发布）
2. 在仓库 Settings → Pages：Source 选 "GitHub Actions"
3. 等待 Actions 完成，访问生成的 URL

### Docker / K8s / NAS
见 `deploy/` 目录（Dockerfile、K8s 清单、docker-compose.yml、DEPLOY_PROMPT.md）。

## 📁 项目结构

```
src/
├── App.vue               # 应用装配层（瘦身）
├── components/           # SidebarNav / WeekSection / DayCard / DetailPage / ErrorBoundary
├── composables/useStore.js  # 逻辑层（进度/笔记/导出导入/路由）
├── data/weeks.js         # 内容数据（15周/69天/282任务/108讲义）
└── assets/style.css      # 全部样式
```

## ⚙️ 说明

- 进度/笔记保存在浏览器 localStorage（可用侧边栏"导出进度/笔记"备份）
- 内容修改入口：`src/data/weeks.js`（改后跑 `npm run validate` 校验）