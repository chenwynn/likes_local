# Likes Local

![系统截图 / App Screenshot](./docs/screenshot.png)
> 将你的系统截图放到 `docs/screenshot.png`（你发我截图后我也可以帮你直接放进去）。

一个纯前端项目，通过开放 API 展示你的 [Likes](https://my.likes.com.cn) 运动数据。支持一键本地运行或部署到 Vercel。

> A pure frontend app to visualize your Likes fitness data via Open API. Run locally or deploy to Vercel in one click.

---

## ✨ 功能 Features

- 🏃 **活动列表** — 按类型、日期范围筛选，支持分页
- 📊 **数据分析** — 周/月里程趋势图、运动类型分布（ECharts）
- 🔍 **活动详情** — 完整运动指标：配速、心率、功率、爬升、训练区间、HRV、分段
- ⚙️ **个人设置** — API Key 配置、应用名称、语言、主题颜色、暗色模式、访问密码
- 🌓 **暗色模式** — 系统主题自动跟随，可手动切换
- 🌍 **双语支持** — 中文 / English
- 🎨 **主题颜色** — 6 种预设颜色，实时切换
- 🔐 **访问密码** — 可选的本地访问密码保护

---

## 🚀 快速开始 Quick Start

### 1. 获取 API Key

登录 [Likes 设置页](https://my.likes.com.cn/settings) → **申请 API Key**，复制以 `lt_` 开头的密钥。

### 2. 一条命令安装并启动

```bash
git clone https://github.com/chenwynn/likes_local.git && cd likes_local && npm install && npm run dev
```

启动后访问 http://localhost:5173，然后在「设置」页填入 API Key 即可使用。

### 3. 构建生产版本

```bash
npm run build
npm run preview  # 本地预览生产版本
```

---

## 🌐 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chenwynn/likes_local)

**手动部署步骤：**

1. Fork 此仓库到你的 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量：

| 变量 | 必填 | 说明 |
|------|------|------|
| `VITE_API_KEY` | ✅ | 你的 API Key (lt_xxx...) |
| `VITE_API_BASE_URL` | 可选 | API 地址，默认 `https://my.likes.com.cn` |
| `VITE_APP_NAME` | 可选 | 应用名称，默认 `Likes Local` |
| `VITE_APP_PASSWORD` | 可选 | 访问密码（留空禁用） |
| `VITE_LOCALE` | 可选 | 语言 `zh` 或 `en`，默认 `zh` |

4. 点击 Deploy

> ⚠️ **CORS 说明**：Vercel 部署时前端直接调用 `my.likes.com.cn` API，需要后端开启跨域支持。本地开发通过 Vite 代理自动处理 CORS，无需额外配置。

---

## ⚙️ 环境变量 .env

```env
# API Key（在 Likes 设置中申请）
VITE_API_KEY=lt_your_api_key_here

# API 地址（有私有部署时修改）
VITE_API_BASE_URL=https://my.likes.com.cn

# 应用名称
VITE_APP_NAME=Likes Local

# 访问密码（可选）
VITE_APP_PASSWORD=

# 默认语言（zh / en）
VITE_LOCALE=zh
```

> 📌 `.env` 文件已加入 `.gitignore`，不会被提交到 Git，API Key 安全。

---

## 📁 项目结构

```
src/
├── views/
│   ├── ActivitiesView.vue    # 活动列表
│   ├── ActivityDetailView.vue # 活动详情
│   ├── AnalysisView.vue      # 数据分析（ECharts）
│   ├── SettingsView.vue      # 设置
│   └── LockView.vue          # 访问密码锁屏
├── components/
│   ├── AppLayout.vue         # 整体布局
│   ├── NavBar.vue            # 导航栏（桌面侧边 + 移动底部）
│   ├── ActivityCard.vue      # 活动卡片
│   └── StatCard.vue          # 数据统计卡片
├── services/api.ts           # API 请求 + 缓存
├── stores/
│   ├── app.ts                # 主题、语言、应用名
│   └── auth.ts               # API Key、密码
├── i18n/index.ts             # 中英文翻译
└── utils/format.ts           # 数据格式化工具
```

---

## 🔌 使用的 API 接口

| 接口 | 说明 |
|------|------|
| `GET /api/open/activity` | 活动列表（支持筛选、分页） |
| `GET /api/open/activity/detail` | 单次活动详情 |

所有请求在 `X-API-Key` 头中携带你的 API Key。

> 速率限制：活动列表接口每个 Key 每 1 分钟最多 1 次。本应用内置缓存（90秒）自动处理。

---

## 🛣️ 路线图 Roadmap

- [x] 活动列表与详情
- [x] 数据分析图表
- [x] 主题/语言/密码设置
- [ ] 账号设置直接编辑（需后端新增 `/api/open/profile` 接口）
  - [ ] 紧急联系人
  - [ ] 时区与隐私
  - [ ] 第三方绑定状态（WeChat / Apple / Google）

---

## 📦 技术栈

- [Vue 3](https://vuejs.org/) + TypeScript + Composition API
- [Vite 6](https://vitejs.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [ECharts 5](https://echarts.apache.org/)
- [Pinia](https://pinia.vuejs.org/) + [Vue Router 4](https://router.vuejs.org/)
- [Axios](https://axios-http.com/)
