# AIGC 工具箱（aigc-toolbox）

VSCode/WebIDE 插件：活动栏提供「AIGC 工具箱」侧边栏，包含四个功能入口：

| 入口 | 说明 | 内容来源 |
| --- | --- | --- |
| 🧩 Skill 介绍 | 团队技能手册（左树右详情导航页） | 远端优先，内置兜底 |
| 🤖 模型选择和介绍 | 模型选择指南与可用模型说明 | 远端优先，内置兜底 |
| 📢 通知公告 | 版本更新 / 维护计划，展示最新 5 篇 | 远端，内置兜底 |
| ❌ 问题反馈 | 故障 / 咨询 / 需求 / 建议，提交到 Jenkins | — |

## 远端内容机制（核心）

三个介绍类页面的内容统一维护在 GitHub 仓库
`SerenNoble/vscode-team-notices`，**更新内容不需要重装插件**：

```
vscode-team-notices/
├── skills_overview.md   ← Skill 介绍（Skill 手册，保持解析格式）
├── model.js             ← 模型选择和介绍（JS 数据模块，只写数据不写逻辑！）
└── notices/             ← 通知公告：每个公告一个 年-月-日.md
    ├── 2026-09-25.md
    ├── 2026-09-24.md
    └── ...
```

### 拉取方式

插件不使用 `api.github.com`（部分内网该域名被 DNS 污染，不可达），
而是从 `codeload.github.com` 下载仓库 tar.gz 一次性解析：

- Skill 页 / 模型页：打开页面时拉取 —— 先渲染内置兜底内容，后台拉远端，成功后热更新页面
- 公告页：打开时拉取 + **每 2 分钟轮询**（`extension.js` 里 `NOTICES_POLL_MS`）
- 拉取失败（断网 / 超时 20s / 包超过 10MB）时静默回退内置内容，不报错不打扰

### 通知公告的提醒机制

1. 轮询发现远端内容指纹（sha256 前 16 位）与「已读指纹」不一致 →
   活动栏图标出现 `1` 角标 + 右下角弹窗（带最新公告日期）
2. **同一条公告只弹一次窗**：点「忽略」后记录「已提醒指纹」，不再重复弹；角标保持到用户点开公告页
3. 点开公告页 → 立即清角标 → 后台拉最新内容热更新 → 记录「已读指纹」

### 如何更新内容

| 要更新什么 | 操作 |
| --- | --- |
| 发新公告 | 往 `notices/` 加 `年-月-日.md`（日期晚于现有文件即置顶），push |
| 模型增减/弃用 | 改 `model.js`（照现有结构改文字/增删条目），push |
| 技能手册更新 | 改 `skills_overview.md`，push（保持解析格式，见下） |

push 后在线用户最多 2 分钟内收到公告提醒；Skill/模型页用户下次打开即为最新。
注意 codeload 的 tar.gz 有约 20 秒缓存延迟，push 后立刻拉可能还是旧包，稍等即可。

### 模型介绍为什么用 JS 数据模块而不是 markdown

模型页的内容是典型的「名称 + 说明」条目（键值对卡片、代码块示例、弃用标签），
`content.js` 的结构化 block（`kv` / `note` / `code` / `chips` / `link`）正好一一对应，
插件端直接交给现成的逐块模板渲染，**不存在 markdown 语法兼容问题**
（此前 model.md 用 markdown 表格/代码围栏，迷你渲染器不支持，页面排版错乱，已废弃）。

远端 `model.js` 的格式（照抄现有结构改文字即可）：

```js
module.exports = {
  subtitle: '页面副标题',
  sections: [
    { heading: '章节标题',
      blocks: [
        { t: 'kv',   v: [['模型名', '说明', '可选标签']] },
        { t: 'note', v: '提示框文字' },
        { t: 'code', v: '多行\n代码' },
        { t: 'list', v: ['条目1', '条目2'] },
        { t: 'chips', v: [['标签文字', 'danger']] },
      ] },
  ],
};
```

插件端会做格式校验，远端文件写坏时自动回退内置兜底内容，不会白屏。

### ⚠️ 远端 model.js 的安全约定（必读）

`model.js` 会被**每个用户的插件执行**（下载后 `new Function` 取数据），等于
「有仓库 push 权限的人可以在全员 VSCode 里执行代码」。因此：

- **文件里只准写数据（`module.exports = {...}`），严禁写函数、读文件、发请求等任何逻辑**
- 仓库 push 权限只授予可信维护者
- 插件端已做格式校验兜底，但约定本身是第一道防线

### Skill 手册的解析格式

`skills_overview.md` 被 `skillpage.js` 解析成左树右详情页，编辑时保持：

- `## 一、分类名` → 左树分类（h2 章节带锚点，目录可跳转）
- `### 技能名 简介` → 技能卡片（h3，开头的命令名会以代码样式突出）
- 文中 `【自动】/【仅手动】/【附脚本】` 标记 → 渲染成彩色徽章
- 支持 `**加粗**`、`` `行内代码` ``、`> 提示框`、`- 列表`

## 通知公告轮询注意事项

- 轮询间隔 2 分钟，即每个用户每天约 480 次请求（每次约 60KB 压缩包），个人规模无压力；
  用户量大时调大 `NOTICES_POLL_MS` 即可
- 弹窗依赖内容指纹变化：只改公告文件的空格/标点也会触发提醒，属预期行为

## 问题反馈表单

- 字段：来源区（黄区/红区/绿区）、类型（故障/咨询/需求/建议）、紧急勾选、
  域账号（默认系统用户名，记住修改）、描述（≤500 字）
- 提交链路：

```
表单 → 插件后台(Node http) → GET /crumbIssuer/api/json 取 CSRF crumb（含会话 cookie）
    → POST /job/AIGC_Issu_report/buildWithParameters（表单参数 urlencoded）
    → Jenkins 201 = 触发成功
```

- **涉密检查**：提交前先过模型网关检查描述内容，疑似涉密直接阻止；
  检查异常时放行但在结果里明示「未经审查」
- **带代码限制**：连续 2 次提交含代码的反馈会被阻止，引导改用文字描述

Jenkins 地址与认证在 `jenkins.js` 顶部集中定义；管理员需给任务
`AIGC_Issu_report` 的 **Anonymous** 开 Read + Build 权限。

## 联调测试（不用连真实 Jenkins / GitHub）

```bash
node dev/mock_jenkins.js          # 本地 mock Jenkins，默认 127.0.0.1:18080
```

VSCode 设置覆盖项（测完清空即恢复内置正式地址）：

| 设置项 | 用途 |
| --- | --- |
| `aigcToolbox.jenkinsBase` | Jenkins 根地址 |
| `aigcToolbox.noticesTarball` | 公告/手册仓库 tar.gz 地址 |
| `aigcToolbox.apiKey` | 涉密检查的模型网关 Key 覆盖 |

## 打包与安装

```bash
npm test          # 跑全部测试（entries / page / announcements）
npm run package   # 自动版本号 +1，然后打包 vsix
```

`npm run package` 会先执行 `scripts/bump-version.js` 把 `package.json`
的补丁版本 +1（0.0.1 → 0.0.2 → …），再调用 vsce 打包，产物如
`aigc-toolbox-0.0.6.vsix`。发大版本时手动改一下 `version` 即可。

安装：命令面板 → `Extensions: Install from VSIX...`，目标环境 VSCode 内核 ≥ 1.70。

**已知限制**：带脚本的 Webview 在部分定制版桌面 VSCode 上不可用
（`$loadForeignModule` 报错），反馈表单页属此类；浏览器型 WebIDE 不受影响。

## 新增入口

编辑 `entries.js` 往 `ENTRIES` 数组加条目（侧边栏自动出现）：

```js
{
  id: 'kb', icon: '📚', label: '知识库', desc: 'AIGC 知识库平台',
  type: 'url',                     // 内嵌网页型（经本地代理剥 X-Frame-Options）
  url: 'https://xxx.example.com',
},
```

介绍页内容集中在 `content.js`（支持段落/列表/键值对卡片/提示框/链接/代码块，
文件头有格式说明）。

## 代码结构

```
extension.js       入口：面板/树视图/消息路由/公告轮询与角标
announcements.js   远端内容客户端：tar.gz 下载、解包、公告目录解析、内容指纹
entries.js         工具入口清单
content.js         介绍页文案与远端地址配置（Skill / 模型 / 公告）
jenkins.js         Jenkins 提交客户端（可单测）
page.js            HTML 构造（表单页/介绍页/内嵌页/迷你 markdown 渲染，可单测）
skillpage.js       Skill 手册解析与左树右详情页
proxy.js           内嵌网页用的本地代理（url 型入口用）
sensitive.js       涉密检查客户端
docs/              内置兜底内容（skills_overview.md、announcements.md）
scripts/           bump-version.js（打包前自动递增版本号）
dev/               mock Jenkins 等联调工具（不打包）
tests/             迷你测试（node tests/xxx.js 直接运行）
```
