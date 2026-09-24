# TeamAI Skills 技能手册（详细版）

> Comware 开发全流程技能速查 · 内容提取自各 SKILL.md 全文（工作流 / 参数 / 限制）· 2026-09
>
> 共 **54** 个技能，分 **8** 大类。

**阅读说明**

- **触发徽章**：【自动】= 对话中描述相关需求时 AI 可自动调用，也可 `/命令` 手动调用；【仅手动】= 必须输入斜杠命令（frontmatter 含 `disable-model-invocation: true`，避免重流程技能被误触发）；【附脚本】= skill 目录自带可执行脚本。
- **通用参数约定**：`-f 模块名` 指定模块；`-m 模块名` 指定编码目标模块；`-sow / -ke / -dds` 指定输入文档；`-u / -p` SVN 账号密码。
- **目录约定**：需求文档在 `docs/requirement/`，概设在 `docs/hld/`，KE 在 `docs/KE/<模块>/`，详设在 `dds/`，外部材料拉取到 `~/project/reference/`，文档根目录 `~/project/document`。
- **V7/V9 判定**：多数技能用 `svn info` 判定项目版本（文件头注释不可靠），编码前会自动分支。

---

## 目录

- [① 需求与设计（11）](#-需求与设计11)
- [② 编码实现（16）](#-编码实现16)
- [③ 编译 · 测试 · 质量（7）](#-编译--测试--质量7)
- [④ Code Review 专项（1）](#-code-review-专项1)
- [⑤ 代码分析与理解（8）](#-代码分析与理解8)
- [⑥ 问题定位与修复（3）](#-问题定位与修复3)
- [⑦ 文档与资料处理（3）](#-文档与资料处理3)
- [⑧ 流程与辅助工具（5）](#-流程与辅助工具5)
- [使用方式与推荐链路](#使用方式与推荐链路)
- [附录：模型选择说明](#附录模型选择说明)

---

## ① 需求与设计（11）

> SOW 工作任务书 → 澄清 → 概要设计（HLD）→ KE 知识文档 → 详细设计（DDS）的完整链路。

### requirement 【澄清重写 SOW】

- **用途**：把 Comware SOW（工作任务书）中矛盾、描述不清晰的部分转成描述清晰的"澄清后的 SOW"，作为后续概要设计的输入。不是需求重写——需求内容本身不变，只做澄清。
- **命令**：`/requirement`（未指定路径时按优先级找 `工作任务书.docm/.docx`）。
- **输入 → 输出**：SOW（.docm/.docx/.md/.txt，Word 先用 MarkItDown 转 .md）+ `docs/KE/` + `platform/` 代码 → `docs/requirement/<特性名>-澄清后 SOW.md`。
- **流程**：① 定位输入文件 → ② Word 转 markdown → ③ 通读并识别"已填实例 vs 空模板"、提取模块/函数名 → ④ 探索式代码验证（subAgent 验证函数/结构体，矛盾时交互提问）→ ⑤ 按原 SOW 章节逐章澄清改写 → ⑥ 写文件。
- **限制**：一次只问一个问题（禁止批量提问）；剥离封面/密级等流程性内容，"不涉及"章节整段不写；保留原文术语照抄；只输出最终方案，不写"原方案有误"。
- **场景**：拿到 .docm 工作任务书，要"提取开发要点 / 澄清需求 / 准备做概设"时。

### clarify-requirements 【生成澄清问题清单】

- **用途**：从 SOW/CLI 需求材料生成澄清问题清单（JSON + Markdown），找出影响测试设计与验收的信息缺口。
- **命令**：`/clarify-requirements <SOW路径> [CLI路径]`
- **输入 → 输出**：SOW(.docx/.docm)/CLI 文档 → `clarification_questions.json`（机读）+ `clarification_questions.md`（人读）+ SOW 为 .docm 时附带 `design.md`（第 6 章，供 cmw-dds-creator 消费）。
- **流程**：① 读 hints.md（若存在）→ ② docx2text.sh 转 txt（失败回退 unzip 取 XML）→ ②.5 .docm 提取设计文档 → ③ 分段通读材料 → ④ 按 9 个通用维度评估 → ⑤ 语义去重生成 JSON+MD → ⑥ validate_output.py 校验（最多重试 3 次）。
- **注意**：JSON 禁代码块包裹/中文引号/尾逗号；category 仅 9 个枚举值，netconf 未涉及时不硬凑；大文档（≥50KB）按标题分块 ≤15000 字符；hints.md 与 SOW 冲突时以 SOW 为准。
- **场景**：为需求组产出"澄清问题清单"供需求方答复。

### sow-cli-extractor 【Word 变更章节提取】

- **用途**：自动发现并提取 Word 文档（.docm/.doc/.docx）中的变更章节，生成纯净 Markdown 变更文档。
- **命令**：`/sow-cli-extractor [目录路径]`；脚本：`sow_docm2md.py /path/to/sow.docm -o sow.md -t`（-t 启用模板过滤）、`cli_docm2md.py /path/to/cli.docm -o cli.md`。
- **输入 → 输出**：自动扫描目录，按文件名智能识别 SOW（含 sow/工作任务书/需求）和 CLI 变更手册（含 cli/命令行/变更手册）→ 同名 .md，保留标题层级/列表/表格/代码块。
- **流程**：① 识别文档类型 → ② pandoc 转 Markdown → ③ 按章节提取（SOW：背景介绍/系统分析/接口设计/项目实现分析；CLI：【命令】【缺省情况】【视图】【参数】【使用指导】【举例】）→ ④ JSON 模板过滤标准模板内容。
- **注意**：模板过滤依赖章节标题精确匹配，不一致会漏提取（可关过滤）；全程 UTF-8；1-2 个文档自动处理，更多时询问用户。
- **场景**：批量把 SOW/CLI 手册从 Word 转成结构化 Markdown 供后续环节使用。

### sow-clarify 【SOW 转设计文档】

- **用途**：对 SOW 做需求澄清并生成设计方案，提取第 6 章（项目实现分析），最终产出 `sow-fininal-<时间戳>.md`。
- **命令**：`/sow-clarify <sow文档>`；脚本 `sow2design.py /path/to/sow.docm [--project 路径] [--batch] [--update] [--json] [--draft]`（--json 输出供 cmw-develop-auto 消费）。
- **输入 → 输出**：SOW（.docm/.doc/.docx）→ `z-cmw-sow-clarify/process/<sow名>_process.md`（设计/命令行澄清/功能澄清/元数据四部分）+ `_result.json` + `sow-fininal-<时间戳>.md`。
- **流程**：Phase A（脚本）：解析 Word ZIP → 提取第 6 章 → 命令行澄清（关键字表匹配+Commit 检查）→ 功能澄清（grep DBM/驱动/ISSU）。Phase B（架构师整合）：B.1.5 需求澄清交互（每次最多 4 问、封顶 3 轮）→ B.2 逐节智能整合 → B.3 整体 review → B.4 写最终文档。
- **注意**：阻塞级缺失未澄清完不得进入 B.2，3 轮后降级为待办；批量/JSON 场景自动静默、未决项标"待确认"；基于内容 hash 幂等、支持断点续传。
- **场景**：SOW 变更后更新设计文档，或给 cmw-dds-creator 提供结构化设计输入。

### hld 【生成概要设计】

- **用途**：基于澄清后 SOW 生成概要设计说明书（HLD）和修改文件清单 JSON。
- **命令**：`/hld <特性名>-澄清后SOW.md`（说"生成概要设计/概设/HLD"即可触发）。
- **输入 → 输出**：`docs/requirement/<特性名>-澄清后 SOW.md`（必需）→ `docs/hld/<特性名>-概要设计.md` + `docs/hld/modified_files.json`（`{"path","type":"add|modify|delete","summary"}`）。
- **流程**：① 读澄清后 SOW → ② 提取模块/函数清单 → ②.5 sub-agent 从 references/ 筛选 14 个分类参考（CLI/XML/资源/消息/DBM/转发/定时器等）→ ③ Grep/Ls 在 platform/、public/ 查证真实路径 → ④-⑤ 生成概设与 JSON → ⑥ 一致性校验 → ⑦ 写文件。
- **三大 gate**：① 每个 path 必须真实命中，禁止占位符编路径、禁止空清单；② 头文件↔实现、.rc+resource.h、NETCONF xsd/yang、save/recover 成对核对，模块 7 个标准子目录（app/cliplugin/lib/include/fwdplugin/xmluiplugin/resource）必须扫全；③ 多方案待决时每个方案的文件面都要展开；新增子模块文件名必须由同类目录+KE/SOW 推导；SOW 约束"不新加进程"时 modify 项必须有 Grep 命中。
- **场景**：澄清后 SOW 完成，需要概设 + 待改文件清单作为详设/编码输入。

### cmw-ke-creator 【生成模块 KE 文档】

- **用途**：分析 Comware 模块代码，生成架构设计文档风格的 KE（Knowledge Extract）文档。
- **命令**：`/cmw-ke-creator -f <模块名>`（AI 深度分析生成新文档）；`/cmw-ke-creator -f <模块名> -improve`（问答式完善现有文档）；脚本模式 `analyze_module.py -f <模块名> [--json|--update|--checkpoint]`。
- **输入 → 输出**：标准模块目录（platform/.../\<模块\>，含 app/cliplugin/lib/include）→ `docs/KE/<模块名>/<模块名>_ke.md`，5 章结构：模块概览/架构详解/线程模型/通信机制/业务功能。
- **流程**：阶段 1 模块发现与代码扫描（按 _main.c/_msg.c/_cli.c/_bdr.c 文件模式识别）→ 阶段 2 AI 分章分析（第 4 章通信机制用 7 步法追 LIPC 链路，第 5 章业务功能用 LSP 分析调用链）→ 阶段 3 按模板生成。
- **注意**：优先 codebase-memory-mcp（list_projects/search_graph/trace_path，未索引先 index_repository），grep 仅兜底；产出是架构设计文档而非代码索引；第 5 章需 AI 重点深度分析。
- **场景**：新人上手模块、架构评审前生成知识文档，或为 cmw-dds-creator 准备输入。

### cmw-dds-creator 【生成详细设计 DDS】

- **用途**：基于 KE 文档、SOW 澄清文档和代码生成模块详细设计文档（DDS），支持 CLI 命令行详细设计。
- **命令**：`/cmw-dds-creator -f <需求文件>` / `-i`（终端输入需求）/ `-rf <模块名>`（先调 cmw-ke-creator 生成 KE）。
- **输入 → 输出**：自动收集 `z-cmw-sow-clarify/sow-fininal-*.md` + `docs/KE/<模块名>/` + 模块代码 → `dds/YYYYMMDD-{模块名}-{功能关键词}-dds.md`，11 章结构（背景目标/现状分析/详细规格/YANG 模型/流程图/配置示例/ISSU/约束/修改文件清单/验收点/风险遗留）。
- **流程**：Step 0 自动材料收集 → Step 1 准备 KE（-rf 或按 svn info 判 V7/V9 后 clone 对应 KE 仓库）→ Step 1.5 按 5 类场景智能探索代码（KE 已介绍/框架依赖/V4→V6/V6→V4/泛化兜底）→ Step 2 分析方案 → Step 3 生成 11 章 DDS；CLI 需求先搜相似命令实现，再生成 MOR/lipc/BuildRun 设计。
- **注意**：编号一致性自检——MOR 表号/DBM 类型/MOR_XML 编号须读现有最大值续编，不得留"待手工分配"；缺省值跨 CLI/消息/DBM/BuildRun/YANG 各层一致；§9 修改文件清单 + §10 验收点是 cmw-code-run 的直接编码输入，须全量可执行；代码探索必须含真实文件锚点与代码快照。
- **场景**：概设确定后生成可编码级详设，或为新 CLI 命令生成含 MOR 注册、LIPC 消息、BuildRun 回显的完整设计。

### cmw-cliapp-msg 【CLI↔APP 通信分析】

- **用途**：分析模块 CLI（cliplugin）与守护进程（app）之间的 LIPC 通信机制，生成 KE 分析文档和 DDS。
- **命令**：`/cmw-cliapp-msg -cmd "display ddns policy"`（可选 `-module <模块名>`、`-ke-only` 仅生成 KE）。
- **输入 → 输出**：命令原型 + 模块代码 → `references/KE/{module}_cli_to_app_msg_KE.md`（8 节：概述/LIPC 端口/通信函数/子消息类型/cliplugin 侧/app 侧/流程图/数据结构）+ `dds/{module}_{feature}_dds.md`。
- **流程**：Phase 1 从命令提取模块名并检查已有 KE → Phase 2 六步代码分析（LIPC 端口定义 → 通信函数调用栈 → 子消息类型枚举 → cliplugin 侧 cmd_/cfg_ → app 侧消息分发表 → 生成 KE）→ Phase 3 按 KE 生成 DDS（MOR 宏、注册函数、OP 枚举、TLV 结构、gs_ 处理函数）→ Phase 4 输出。
- **注意**：MOR 框架（mor.h、MOR_RegCallBack）是外部库黑盒，禁止在模块仓库内搜其实现；所有宏/常量/MOR 取值必须标注来源（文件:行号），禁止臆造数值；消息宏需搜 _REQ/_RESP 变体及 app 侧注册回调；LIPC CreateServer/CreateClient 端口与服务名必须一致。
- **场景**：为新命令行梳理 CLI→MOR→LIPC→APP 完整通信链路。

### code-architect 【功能架构方案设计】

- **用途**：分析现有代码库的结构模式与编码规范，输出可落地的功能架构设计方案。
- **命令**：`/code-architect`（纯 Read/Grep 只读分析）。
- **输入 → 输出**：功能需求描述 + 现有代码库（可结合 code-explorer 结果）→ `docs/code-architect/[功能名称]-architecture-plan.md`：设计背景/设计决策/文件规划（新建/修改文件表，P0-P2 优先级）/数据流/接口定义/开发构建顺序/依赖关系图/测试策略/风险评估。
- **流程**：① 代码模式分析（目录结构、命名规范、架构模式）→ ② 架构方案设计（贴合现有风格、最简合理）→ ③ 落地实施方案（每个核心组件的路径/职责/接口/依赖）→ ④ 开发构建顺序（类型定义→核心逻辑→集成适配→界面层→测试→文档）。
- **注意**：杜绝过度抽象与超前设计，仅在项目已有同类实践时复用抽象能力；新架构必须无缝贴合现有风格；方案必须保存为 Markdown 文档（强制）。
- **场景**：需求明确后、编码前，需要带文件规划和开发顺序的架构方案。

### generate-cli-modification-doc 【命令行变更手册】

- **用途**：根据 SOW 为 Comware 模块生成命令行变更手册（.md + .docx）。
- **命令**：`/generate-cli-modification-doc`；转换：`md2docx.py <input.md> <output.docx>`（需 pip install python-docx）。
- **输入 → 输出**：sow.md + 模块 cliplugin/、resource/ 代码 → 项目根目录 `comware-cmd-modification/xxx 命令行变更.md` → 同名 .docx（格式与 cli-doc-template.md 模板完全一致）。
- **流程**：Step 1 阅读 sow.md 整理需新增的命令行 → Step 2 阅读模块 cliplugin 与 resource 目录，通过 CLI_RegOpSet（CLI_OPSET_S）学习已有命令命名与资源文件名词解释风格 → Step 3 按模板生成 md → 转 docx。
- **限制**：只生成文档，禁止编码；只做 skill 明确要求的任务；模块文件夹未提供时必须问用户，不许盲找。
- **场景**：SOW 定稿后向资料/测试团队交付"本次新增/变更了哪些命令行"的手册。

### yang-xsd-validator 【YANG/XSD 一致性校验】

- **用途**：YANG 与 XSD 模型文件的离线兼容性与一致性批量校验（NETCONF 插件开发场景）。
- **命令**：`yang_validator.py [-yang_dir <dir>] [-xsd_dir <dir>] [-t all|consistency|namespace|enum] [-o_consistency <file>] [-o_compatibility <file>]`（默认目录 `public/PUBLIC/yang`、`public/PUBLIC/xsd`，必须是目录不是单文件）。
- **输入 → 输出**：YANG/XSD 目录（按文件名自动配对，可选白名单）→ 两份 Markdown 报告：`yang_xsd_check.md`（一致性）+ `yang_imcompatible.md`（兼容性），含错误/警告统计与结论。
- **检查项**：CHECK01 XSD 节点在 YANG 中有对应定义；CHECK02 枚举值范围匹配；CHECK03 整数类型范围匹配；CHECK05 YANG 命名空间重复；CHECK06 私有命名空间规范；CHECK07/08 deviations 命名空间与文件名后缀；CHECK09 event 文件事件表命名空间一致；CHECK10 OEM 敏感关键字。
- **注意**：依赖 Python 3.8+、pyang、lxml；YANG 必须 UTF-8；choice/case 结构可能误报，用白名单过滤。
- **场景**：NETCONF 插件新合入 YANG/XSD 前的规范性检查、CI 离线批量校验。

---

## ② 编码实现（16）

> 基于 SOW/DDS 的智能编码，以及按接口类型（CLI / XML / BuildRun / DBM / DUMP / Epoll / 定时器）的专用代码生成工作流。

### cmw-code-run 【SOW/DDS 智能编码】

- **用途**：基于 SOW 或 DDS 文档在指定模块中完成智能编码，含强制完成度核查，是编码主入口。
- **命令**：
  - 模式 1/2：`/cmw-code-run -sow <sow文件> -m <模块名> [-ke <KE文件>]`（-sow/-m 必填，-ke 路径 `./references/KE/`）
  - 模式 3：`/cmw-code-run -dds <文件>`（DDS 在 `./dds/`，与 -sow/-ke/-m 互斥）
- **输入 → 输出**：SOW/KE/DDS → 代码变更 + `.claude/skills/cmw-code-run/.workspace/` 下的任务清单、task_status.json、子 agent 报告、completeness_report.md。
- **流程**：SOW 模式：解析文档 → 模块分析（MCP 优先，ctags/grep 兜底）→ 编码 → 强制完成度核查。DDS 模式：按任务类型顺序调 clireg → buildrun → xmlui（DDS 含 NETCONF 时强制）→ 守护进程业务逻辑 → 质量门禁：completeness_check.py 三方对比 + 重读文档复核易遗漏项（错误码/日志宏/RBM/ISSU/DBM 字段/定时器/Makefile），未覆盖为 0 才能结束。v1.3 强制经 Agent 工具 spawn 子 agent，大任务（>10 项）按类型分组并行。
- **限制**：禁止主会话直接 Edit 编码；XMLUI 必产出 yang/tree.xml（目录按模块 xmlplugin/ 或 xmluiplugin/）；使用前须 mkdir .workspace 并清理旧报告。
- **场景**：拿到 SOW 或 DDS 后在 ipaddr/dns 等模块落地完整编码任务。

### cmw-coder-step 【渐进式逐点编码】

- **用途**：基于 DDS 渐进式编码，每次只实现一个功能点，循环迭代完成模块开发，节奏可控。
- **命令**：`cmw-coder-step analyze -d <dds路径>`（生成任务清单）；`cmw-coder-step code -d <dds> -m <模块> [-y | --task N]`（-y 非交互自动完成，--task 跳转指定任务）；`cmw-coder-step status` 查看进度。
- **输入 → 输出**：DDS 文档（按 ##/### 章节切分任务）→ 结构体/枚举/宏/函数/MOR/CLI 代码，任务清单含 checkbox。
- **流程**：① analyze 解析 DDS 提取数据结构、函数接口、错误码并输出任务列表 → ② 逐个展示任务卡片（功能/输入/输出/检查/流程）等待 Y/n 确认 → ③ 按 Comware V7 规范生成代码（标准注释块；参数检查→有效性→冲突检查→DBM 插入→内核下发→失败回滚 DBM→RBM 同步的错误处理模式）→ ④ 完成一个自动进入下一个。
- **注意**：每次只写一个点；每个函数生成后建议立即编译；保持 DDS 与代码同步。
- **场景**：需要逐步确认、可控节奏的新模块开发。

### cmw-develop-auto 【一站式自动开发】

- **用途**：Comware V7/V9 模块全流程自动化开发：SOW → 设计 → 编码 → 质量门禁 → 编译 → 质量报告的一站式流水线。
- **命令**：`/cmw-develop-auto`（输入 SOW 路径或口头需求）；Phase C 内部调 `/cmw-code-run -dds <路径>`，Phase D 调 `/codex_report -f <模块> -u <用户> -p <密码>`。
- **输入 → 输出**：SOW 或口头需求 → ./design/、./clarify/、KE、DDS、代码、codex_report/、.ipe 包、`.cmw-develop-auto-quality-report.md`（11 章）；状态文件 `.cmw-develop-auto-state.json`。
- **流程**：Step1-5 强制启动门禁（需求分类 → AskUserQuestion 确认细则 → 任务规划 → 启动两个监控脚本验证存活 → 校验模型必须为 glm-5.2）→ Phase A 澄清（sow2design.py + 逐项确认 CLI/undo/Commit/分布式/DBM/驱动/ISSU）→ Phase B 设计（KE + DDS；manual 模式暂停等用户 review，用户改过的 DDS 不得覆盖）→ Phase C 编码（必须 Agent 工具调 cmw-code-run，禁止主任务直接 Edit）→ Phase D codex 静态检查新增告警清零（失败按 AUTH/NETWORK/CMD 分类阻塞，禁止造假为 0）→ Phase E abuild 迭代至 SUCCESS → Phase F 生成质量报告。迭代上限：A/B/F 3 次、C/D/E 5 次。
- **注意**：阶段门禁不可绕过；SVN 密码经 preflight 脚本写成 B64，绝不存明文；上下文超 80% 主动 /compact 并从状态文件恢复。
- **场景**：SOW 驱动的一站式特性开发、质量优先的全自动流水线。

### cmw-code-change-analyzer 【改码前影响评估】

- **用途**：评估代码修改指令复杂度：简单指令直接改，复杂任务先做影响分析并请求确认。
- **命令**：无参数，由"修改/重构/优化 xxx"类指令自然触发。
- **流程**：① 解析修改目标与内容 → ② 复杂度评估（简单：单函数逻辑、加日志/空指针检查；复杂：改函数签名/结构体/宏、跨文件、重构、改全局接口）→ ③ 复杂任务影响分析（调 c-analyzer 获取结构，grep 函数定义/调用方/头文件声明/相似实现）→ ④ 决策：简单直接改；复杂输出定义位置、N 处调用方、修改计划与验证点，请求确认后执行。
- **注意**：影响范围确认必须在首次 Edit 前完成；头文件声明必须同步修改；大型重构建议拆步渐进确认。
- **场景**：接到"把某函数参数改成 struct xxx*"这类牵一发动全身的修改前评估。

### codegen 【按文档生成代码】

- **用途**：按固定目录下的设计/需求文档生成 Comware 代码，做最小范围修改并项目原生验证。
- **命令**：`/codegen`（文档根目录固定 `~/project/document`，docm 兜底目录 `~/project/reference/sow`）。
- **输入 → 输出**：优先 *.md 详细设计 → 其次需求设计.md → 最后工作任务书/命令行变更手册 .docm（经 sow-cli-extractor 转 md）→ 代码改动 + 简洁验证汇报。
- **流程**：① 建立实现合同（文档来源、目标/验收/约束/影响面，冲突先澄清）→ ② 按需求类型分流：CLI→generating-comware-clireg、buildrun→buildrun、netconf→xmlui → ③ 映射需求到现有文件/函数/验证手段 → ④ 保守实现：垂直切片、复用现有模式、不回滚用户改动 → ⑤ 验证（abuild/codex_report）并汇报。
- **限制**：不把仓库下 document/sow 相对路径当默认输入；不做无关重构、不另起平行实现；汇报不贴长日志和大段 diff。
- **场景**：用户说"按文档实现/补齐特性/修缺陷"时，把需求文档映射成具体代码改动。

### generating-comware-clireg 【CLI 注册代码开发】

- **用途**：Comware CLI 命令行注册与解析代码的规范化开发工作流。
- **命令**：`/generating-comware-clireg`（输入为 SOW 或用户澄清的命令行需求）。
- **输入 → 输出**：SOW/需求描述 → cliplugin 下命令注册、MOR 解析、消息同步等代码及资源文件。
- **流程**：第一步需求分析与确认：读 CLI 概念文档、确认 V7/V9、分析命令格式/视图划分/资源定义/MOR 定义与消息同步接口；第二步按 tasks 编码：头文件定义 → 插件初始化 → 命令模板注册/注销 → 命令行注册/注销 → MOR 解析 →（可选）视图切换、字节序转换、配置回滚 → 配置消息同步 → 资源文件完整性检查 → 能力集定制 → 遗漏检查。
- **限制**：必须用 ctags 加速检索并保持 tags 最新；需求必须经 SOW 或交互完全澄清后才开始；遵循 ISSU 规范保证向后兼容。
- **场景**："帮我完成 xxx 命令的 CLI 代码开发"、调试命令解析问题。

### generating-comware-xmlui 【NETCONF 插件开发】

- **用途**：NETCONF/XMLUI 插件开发：yang/xsd/tree.xml 生成、MOR 解析与 .c 代码实现，支持从 DDS/SOW 自动检测需求。
- **命令**：说"帮我完成 xxx 表节点的 XML 代码开发"；辅助脚本：`scan_dds_sow.py [--project 路径] [--json]` 扫描 dds/ 与 sow-fininal-*.md 中 yang/NETCONF 关键词；`tree2yang.py -f <tree.xml> --yang --xsd [--auto-namespace]` 反向生成；低代码 `xml_parse.py -f <tree.xml> [-v v9] [-t <表名>]`。
- **流程**：扫描提取需求 → 确认 V7/V9 → 任务 0 检查现有代码（XML_RegOpSet/MOR_RegCallBack 已存在则只补缺失）→ 任务 1 yang（pyang 校验）→ 任务 2 xsd → 任务 3 tree.xml 并确定 IPC 方式（inproc/reusePort/usock 推荐/lipc 不建议）→ 任务 4 yang-xsd-validator 一致性校验 → 分流：低代码表（list 有 ipc 属性）走 xml_parse.py 自动生成（需 protoc-c；Create 语义=已存在且只下发索引列返回 NO_CREATION，Merge=不存在时允许创建后 Set）；存量手动表走路径 B → 完整性检查。
- **限制**：XSD/tree.xml 节点名必须与 YANG 完全一致（禁止大小写转换）；顶级节点是 YANG 顶层 container 而非 module 名；枚举用名称不用 value；targetNamespace 的 OEM 占位符必须替换为 www.h3c.com；禁 goto；ISSU 结构体字段只能末尾追加且 4 字节对齐；DBM 前后要转序。
- **场景**：新增 NETCONF 表/模块，"DDS 里有 yang 修改，生成 xmlui 代码"。

### generating-comware-buildrun 【配置回显代码开发】

- **用途**：BuildRun 配置显示代码开发：把 DBM 二进制配置还原为命令行字符串（display this / display current-configuration）。
- **命令**：`/generating-comware-buildrun`（输入为 SOW 或澄清后的配置回显需求）。
- **输入 → 输出**：SOW/DBM 结构与命令定义 → cliplugin/\*_bdrn.c 等 BuildRun 回调与输出代码。
- **流程**：第一步需求分析：确认 V7/V9、CLI 命令格式与视图、DBM 数据结构/Key 命名/存储方式、Handle 选择/字节序/默认值逻辑；第二步按 tasks 编码：头文件数据结构 → 插件初始化 → BuildRun 回调注册/注销 → DBM 访问 → 配置读取 → 字节序转换 → 命令行字符串生成 → 默认值处理 → 能力集定制 → 输出 → 遗漏检查。
- **注意**：正确选择生效库/未生效库；网络序到主机序必须正确转换；配置不存在或为默认值时的输出逻辑要正确；及时释放 DBM 迭代器与句柄，大数据用批量读取 API。
- **场景**："帮我完成 xxx 命令的 BuildRun 开发"、排查 display this 回显缺失。

### generate-dbm-operation-code 【DBM 交互代码】

- **用途**：实现业务模块与 DBM（Database in Memory）的交互：配置保存、buildrun（bdr/bdrn）、二进制恢复。
- **命令**：无参数；触发于"命令行配置消息保存 DBM / 实现 buildrun / 实现配置二进制恢复"；模块目录未提供必须询问用户，禁止盲找。
- **流程**：Step1 在模块目录查 DBM_Open，取 Effective-config 句柄 → Step2 保存配置（判断新增 key 还是已有 key 加字段，新增 key 按 ke_dbm.md 选数据类型）→ Step3 配置恢复（保证读取与保存同一份数据、类型一致）→ Step4 buildrun（查 BDR_RegOpSet 入口，模板命令需注册模板信息 + CLI_BUILDRUNTYPE_SUBTEMPLET，所有命令在 pfRegBuildRun 内有 CLI_BUILDRUNTYPE_CALLBACK 读 DBM；CLI_RegBuildRun 的 level 越小越优先）→ Step5 新增模板命令时检查 CLI_RegCmdTemplet 的 CLI_GetModeAndCmdGroup_PF 回调与 Step2 一致。
- **限制**：套路代码必须充分参考已有实现、禁止自由发挥；不需要编译；完成即停止，不优化、不重构、不补充。
- **场景**：为新命令行落地 DBM 持久化与 display 回显数据链路。

### generate-dump-code 【DUMP 导出框架】

- **用途**：为 Comware 模块生成通用 DUMP（批量数据导出，供 display 命令取数）代码框架。
- **命令**：方式一：`generate_dump.py -m <模块> -t <数据类型> -f <字段1,字段2,...> [-o <输出目录>]`；方式二：直接告知 AI 模块名、数据类型、字段列表。
- **输入 → 输出**：字段前缀推断类型（ui/ul→UINT、us→USHORT、uc→UCHAR、sz/pc→CHAR[]、st→INET_ADDR_S）→ xxx_dump.h（命令字/消息头/游标/导出结构/回调声明）+ xxx_kernel_dump.c（内核态）+ xxx_cli_dump.c（用户态）。
- **流程**：① 运行脚本或让 AI 生成框架 → ② 修改 TODO 填入实际数据结构 → ③ 头文件放 include，内核态放内核源码目录，用户态放 CLI 插件目录 → ④ 模块初始化调 XXX_DumpRegister()，退出调 XXX_DumpUnRegister()。
- **注意**：跨内核/用户态数据需大小端转换；游标内核态分配、DumpDone 释放；读共享数据加 RCU 等锁；内核态 kzalloc_tag/kfree、用户态 malloc/free；所有指针检查。
- **场景**："为 XX 模块添加 display 命令"、"导出模块状态信息"。

### cmw-createpoll 【epoll 轮询框架】

- **用途**：为模块创建 epoll 轮询（事件监听）框架代码：epoll 创建、事件注册、轮询处理。
- **命令**：`/cmw-createpoll -f <模块名>`（如 -f ns4、-f l2）。
- **输入 → 输出**：模块名 → `app/<模块名>_epoll.c/.h` + makefile 修改 + 初始化/主循环接入。
- **流程**：① svn info 判断 V7/V9（文件头注释不可靠）→ ② grep epoll_create|epoll_ctl|epoll_wait 检查模块是否已有 epoll，已有则终止；盘点现有事件源（接口 fd、timerfd、socket/pipe）→ ③ 参考 examples/ns_epoll 创建头文件（EPOLL_ENTRY_S 结构、Init/Add/Del/Schedule）与实现文件（epoll_create 建实例、HASH 建表存条目、Add/Del 封装 epoll_ctl、主循环 epoll_wait+分发回调）→ 修改 makefile → 主入口调 Init()、主循环调 Schedule()。
- **限制**：已存在 epoll 机制则终止，不得重复创建；事件完整性检查与回调验证必做；遵循 ISSU 向后兼容。
- **场景**：新模块守护进程需要统一事件调度框架。

### cmw-creattimer 【定时器创建】

- **用途**：在模块中创建定时器文件，基于模块现有 epoll 机制精确编码（手动分析，非脚本）。
- **命令**：`/cmw-creattimer -m <模块名>`。
- **输入 → 输出**：模块名 → `{module}_timer.h/.c`（TWL 定时器封装 + timerfd + epoll 接入）。
- **流程**：① 检查 app/\*timer\* 已存在则终止 → ② 核心分析：grep EPOLL 提取模块 epoll 结构体/注册注销函数/初始化宏/无效 fd/事件类型，完整阅读一个注册示例 → ③ 创建头文件（{MODULE}_TIMER_MAX_NUM/_SCALE 宏、Create/Delete/Refresh/Init/Exit 声明）→ ④ 创建实现：Init 依次 Timer_Initialize→CreateTimerFd→EPOLLENTRY_SET→FdEpollCtl(ADD)；Exit 反向清理；回调读 timerfd 后调 Timer_Tick_Announce → ⑤ 验证头文件包含、Init/Exit 配对、风格一致。
- **注意**：无效 fd 用模块自定义宏（如 IP6ADDR_INVALID_FD）不用 -1；先包含模块头文件再包含自定义头文件；Init 失败按相反顺序清理资源；文档内含 IPTS/DNS/IP6ADDR/通用四类 epoll 风格对照表。
- **场景**：给模块补定时器能力并与现有 epoll 调度无缝集成。

### cmw-regifevent 【接口事件注册】

- **用途**：为模块生成接口事件（Register Event）注册与回调处理代码。
- **命令**：`/cmw-regifevent -f <模块名>`（如 -f ns4、-f l2）。
- **输入 → 输出**：模块名 → `app/<模块名>_if.c/.h` + makefile 修改 + 主入口注册调用。
- **流程**：① svn info 判断 V7/V9 → ② grep IF_Event_Init 检查是否已注册，已注册则终止；确认事件类型（IF_IFMSG_\* 接口、IF_LINKMSG_\* 链路、IF_NETMSG_\* 网络层）→ ③ 编码：创建事件数组（g_auiXXIfEvent[]）、事件回调（xx_if_EventCallBack）、注册函数（IF_Event_Init 初始化连接 → IF_RegIfEvent 注册 → fd 加入 epoll 监听）→ 修改 makefile → 模块初始化函数中调用注册函数。
- **限制**：已注册则终止避免重复；开发后验证所有事件注册完整、每个回调有测试。
- **场景**：模块需要感知接口创建/删除/激活等状态变化。

### cmw-transplant-code 【代码移植辅助】

- **用途**：Comware 代码移植辅助：问题单移植与项目移植两套工作流，含进度追踪与用户确认点。
- **命令**：`cmw-transplant-code -f <模块> -diff <文件> [-id <问题单号>]`（问题单移植）；`cmw-transplant-code -f <模块> -sow | -project`（项目移植）；无参数时询问选择。
- **输入 → 输出**：diff/SOW/详设/KE → 问题单流：`<问题单号>_澄清.md`、移植方案、代码；项目流：`原项目资料_<模块>_<日期>/`（01-06 分类归档）+ `.transplant_progress.md` + 移植报告/计划/代码移植报告。
- **流程**：问题单流：KE 生成（子 Agent）→ 逐个确认问题单号/问题/根因/方案 → 澄清文档 → 差异对比/冲突检测/数据依赖链分析出移植方案 → 用户确认（diff>500 行或 >5 文件先评估工作量与风险）→ 子 Agent 编码 → 验证（svn status/diff 确认落盘、patch --dry-run -R 验证 hunk 全合入、编译）。项目流五阶段：资料归档 → KE 准备 → 分析出报告与计划（含回滚方案）→ 用户澄清 → 子 Agent 执行移植。
- **限制**：工程 GBK 编码需留意；禁止整目录覆盖、禁止修改 #include 路径、用户已手动改过的代码须重新 Read 不得凭记忆覆盖；ISSU 字段只能追加；CLI/MOR/消息移植须核对注册→MOR→分发→BuildRun→DBM 全链路。
- **场景**：跨分支/版本搬移单个补丁或整项目特性。

### cmw-issu-version-bump 【ISSU 版本号递增】

- **用途**：Comware V7 ISSU 兼容文件 issu.c 中交付件版本号 Z 列自动 +1。
- **命令**：`/cmw-issu-version-bump -f <模块名> -u <SVN账号> -p <密码>`。
- **输入 → 输出**：模块名 + SVN 凭据 + 工作副本改动 → `public/PUBLIC/init/all/issu.c` 对应交付件行 Z 列递增。
- **流程**：① svn info 取 URL → ② checkout init/all → ③ svn status 找出修改的 .c 与 Makefile → ④ 分析 Makefile 确定修改文件编译进的交付件（模块名与交付件名可能不一致）→ ⑤ 修改 issu.c（如 `{"xmlcfgd", {1,1,1,781}}` 的第 4 个数字 +1，同一交付件多行都要加）→ ⑥ svn diff 验证。
- **注意**：只改确定交付件对应行、不动格式；并发修改前先更新到最新 SVN 版本；修改前建议备份 issu.c。
- **场景**：模块代码修改后、发布前递增 ISSU 兼容版本。

### connect-cloudnet 【云简平台对接】

- **用途**：模块与云简（Cloud Management）平台交互开发指南：云连接建立、云端配置消息处理、WebSocket 隧道。
- **命令**：参考手册型，无命令行参数；核心接口 `#include <sys/cmtnlmgr.h>`，全局 CMTNL_HANDLE + CMTNL_INTF_S。
- **流程**：① Init：CMTNL_GetHandle 取接口并检查有效性，失败 ReleaseHandle → ② 连接云端：选云模块 → 注册事件/收数回调 → CloudConnect 建连 → ③ 事件回调处理 CONNECTED/DISCONNECTED（触发重连）→ ④ 收数据：pfCmtnlStringToJson 解析后处理，用完 pfCmtnlFreeJsonMsg → ⑤ 发数据：AllocJsonMsg → SetMsgOpType/SetMsgModName → AppendJsonData → JsonToString → pfCmtnlSendCloudData → ⑥ Fini：Disconnect → ModuleFini → ReleaseHandle。
- **核心禁令**：禁止使用 json-c 原生接口（json_object_\* 等），必须用 CMTNL_INTF_S 函数指针（云简模块 dlopen 动态加载，原生接口调不通）；使用前检查所有函数指针有效；JSON 资源必须 FreeJsonMsg 释放；实现自动重连。参考实现：WCLT/STAMGR/WSA/APMGR 各 cloud 文件。
- **场景**：开发设备与云简平台的配置下发/状态上报功能。

---

## ③ 编译 · 测试 · 质量（7）

### abuild 【sim 增量编译】

- **用途**：提交 C 工程 abuild 增量编译任务（simware 模拟器版本），成功返回版本路径，失败返回编译错误辅助修码。
- **命令**：`/abuild -e <ipe包名> -uko`（如 `/abuild -e 64sim7cen -uko`）。-u 用户态 -k 内核态 -o obj，-uko 为推荐默认；-r release 模式；`--modules <列表>` 限定范围（仅限白名单模块，否则退回全量）。
- **输入 → 输出**：platform/public 下 svn info 判 V7/V9 → 构建 IPE 包名（64sim7cen/64sim9cen）→ Jenkins 任务 URL + JSON（result/version_path/error_info）；结果归档到 `~/project/reference/abuild_{日期_时间}/`（full.log + summary.txt）。
- **流程**：① svn info 判分支与 IPE 包名 → ② 执行 abuild -uko（Jenkins 建任务，shadow branch 自动提交本地改动并自动清理，无需 svn commit）→ ③ 阻塞等待任务 URL → ④ 用 jenkins_text_fetcher.py 拉 consoleText → ⑤ 失败按 error: 关键字定位首个错误修码，成功提取 IPE 信息 → ⑥ 归档。
- **注意**：仅支持 simware 模拟器版本，B64 产品 .ipe 用 fullbuild；Jenkins 日志唯一可靠获取方式是 jenkins_text_fetcher.py（WebFetch/curl 被 401 拦截）；必须用具体构建号，禁用 lastBuild（多用户共享会拿错日志）；任务未结束不允许新起编译任务。
- **场景**：编码后验证 sim 版本编译，或根据编译错误日志定位修复代码。

### fullbuild 【产品完整编译】

- **用途**：提交产品版本完整编译任务（B64 产品线，如 8048、wx2500x 等 .ipe），返回版本路径或错误日志。
- **命令**：`/fullbuild -e <ipe包名>`（必填）；`-r` release 模式（默认 debug）；`--build-all` 编译所有模块；`--modules <列表>` 指定模块。**禁止手动传 -s**（自动注入影子分支参数，重复报错）。
- **流程**：① svn info 判 V7/V9 → ② 构建 IPE 包名 → ③ 确定模块列表（全模块用 --build-all）→ ④ 执行 fullbuild（Jenkins 任务）→ ⑤ 返回 Job completed: SUCCESS 可提前停止 → ⑥ jenkins_text_fetcher.py 取日志并修码。
- **分工**：与 abuild 分工——产品版本走 fullbuild，simware 走 abuild；切分支应先 svn switch 再执行，而非用 -s。
- **场景**：需要编译 8048、wx2500x 等产品 .ipe 版本时。

### testgen 【生成测试用例】

- **用途**：根据 SOW 文档或 JSON 项目自动生成测试点/测试用例，支持模块级结构与共享 test_background。
- **命令**：`main_testcase.py --sow_path <SOW目录>`（单项目，默认 3 轮生成+审计，需后台运行）或 `--folder_path <JSON文件夹>`（批量）；`--user` 用户名、`--project_path` 输出目录（默认 ~/project/reference/testcasegen）。
- **输入 → 输出**：SOW 文档目录（默认 ~/project/reference/sow）→ `testCase.json`（模块级结构）、`testCase.md`（拓扑/接口/配置/用例列表）、`generation_summary.md`。
- **流程**：① 读取 SOW/JSON → ② 生成测试点 → ③ 模块级结构检测：同一模块的多个用例从第一个用例提取 test_background（拓扑、接口连接、基础配置）提升到模块级共享，避免重复配置 → ④ 输出新格式（module_name + test_background + test_cases），旧格式向后兼容。
- **注意**：bash 等待超时不要主动关闭程序；test_background 只从第一个用例提取；模块基于配置手册自动识别。
- **场景**：拿到 SOW 或配置手册后批量产出结构化测试用例。

### testrun 【ITC 单测提交】

- **用途**：基于最近一次成功 abuild 的版本向 ITC 提交单测运行任务，轮询结果，通过后衔接 analyse。
- **命令**：`/testrun`；脚本 `testrun.py --preview`（生成 payload 预览）→ `--submit --payload <文件>`（提交并轮询）；补参 `--nvid/--user/--modified-file/--version-path`；`--no-poll` 只提交不轮询、`--no-analyse` 成功后不自动 analyse。
- **输入 → 输出**：svn diff --summarize 得 modifyFileList、document/NVID、abuild 日志解析 versionPath、document/testcase 测试点 → `~/project/reference/testrun/payload-<时间戳>.json`、`result-<taskId>-<时间戳>.json`。
- **流程**：① --preview 生成 payload 并落盘 → ② 展示 nvid/user/modifyFileList/versionPath/testcase 来源，**用户确认后才能提交** → ③ --submit 调 testRun API 解析 taskId → ④ 轮询 testResult 至 itc_task_state=done → ⑤ 优先用 itc_task_id 调 analyse → ⑥ 超轮询上限保存结果并报错。
- **注意**：用户未确认 payload 前禁止提交真实任务；请求体所有字段按字符串发送；不要写出 FTP 密码；versionPath 有固定拼接规则（TARGET/{debug|release}_simware{7|9}\{ipe}）。
- **场景**：abuild 编译成功后提交 ITC 单测并跟踪结果、衔接结果分析。

### codex_report 【静态检查报告】

- **用途**：执行 CodeX 静态代码检查并将 HTML 报告转换为 Markdown 报告。
- **命令**：`/codex_report -f <模块名>`（-f 必填，模块名须与项目目录结构匹配；Jenkins 认证内置，无需用户提供）。
- **输入 → 输出**：模块下存在 SVN 变更的文件 → `./codex_report/<时间戳>_<模块>_report.md`（构建失败时用失败报告模板）。
- **流程**：Step 1 运行 codex（自动 shadow branch → Jenkins CodeX 任务 → 清理；JSON 在输出最后一行；建议 timeout 600000ms 或后台运行）→ Step 2 解析 result（0 成功/-1 失败/-2 监控超时，-2 时禁止重跑，用认证 curl 轮询 api/json）→ Step 3 下载 HTML 报告（403 时从 /usr/local/bin/codex 提取 API Token 做 Basic Auth；仍 404 则下载 consoleText 定位根因）→ Step 4 按模板生成 Markdown（概览/问题分布/详细列表/改进建议）。
- **注意**：CodeX 是**增量检查**，只查 SVN diff 变更文件，模块无修改直接 FAILURE；禁止在未拿到真实报告时用手工源码阅读冒充 Codex 报告；修复后必须重跑 codex/abuild 验证通过才能声明完成。
- **场景**：编译前对模块做静态质量检查并产出可读报告。

### cmw-dds-verify 【详设完成度核验】

- **用途**：校验 platform/public 下的代码修改是否按详设（DDS）文档完成，识别未完成功能点。
- **命令**：直接输入详设文件名触发（如 `xxx_dds.md`、`xxx 详设.docx`），或"检查代码修改是否按照 platform_dds.md 完成"。
- **输入 → 输出**：详设文档（.md/.docx/.doc，Word 需先经 word2md.py 转换）+ svn status/log/diff → `[DDS 验证报告]`（功能点总数、已完成/部分完成/未完成清单、详设外修改）。
- **流程**：① 定位并解析详设，提取功能点清单（涉及文件、修改类型、描述）→ ② **每次验证必须重新执行** svn status/diff/log 获取最新差异（禁止复用缓存），逐文件覆盖所有 M 标记文件（含跨模块联动文件）→ ③ 匹配分析：文件级（含 .rc/.xml 非代码文件、A/D 状态）+ 代码级（接口先 Grep 存在性校验防幻觉接口，用 c-analyzer 识别新增函数/结构体/宏）→ ④ 完成度评估并输出报告。
- **注意**：禁止复用缓存的 diff 分析；.c/.h 为 UTF-8（由 /usr/local/bin/svn 自动 GBK↔UTF-8 转码），无需手动转码；详设可能未明确文件路径需模糊推断；验证失败须记录具体原因。
- **场景**：编码完成后核对 DDS 功能点是否全部落地、有无遗漏。

### cmw-svn-diff-analyzer 【SVN 变更总结】

- **用途**：分析 SVN 代码修改并生成 Markdown 总结报告。
- **命令**：必填 `path`（本地工作副本或 SVN URL）；可选 `revision`（如 1234:1236、BASE:HEAD）、`target_path`（子目录/文件）。用户未指定时默认全量修改、整个路径。
- **输入 → 输出**：svn info/diff/status（本地）或 `svn diff <url1> <url2>` → Markdown 报告（基本信息、变更概览统计表、文件变更列表、详细代码分析、关键变更、风险提示、建议）。
- **流程**：① 与用户确认路径类型/revision/范围 → ② 获取差异与状态 → ③ 解析文件级变更（A/D/M/重命名）、代码级变更（新增/修改/删除函数、结构体、配置项）与行数统计 → ④ 对 C/C++ 用 ctags 或 tree-sitter 深入分析结构 → ⑤ 生成报告。
- **注意**：工程代码主要为 GBK 编码，读取优先 GBK/GB18030 再 UTF-8，报告输出 UTF-8；diff 超 10000 行时先给概览、按模块分组并建议缩小范围；跳过二进制文件仅报文件名。
- **场景**：代码审查前了解分支/revision 的修改范围，或生成变更总结供评审。

---

## ④ Code Review 专项（1）

### comware-code-review 【代码 Review】

- **用途**：Comware C 代码 Review，支持 diff 增量、整模块全量、模块自动定位、静态分析结果判级四种模式。
- **命令**：
  - `review <路径>`（默认仅 Step 2 规范审查）
  - `--all-steps <路径>`（Step 1~3 全量）
  - `--showall`（显示全部 valid 告警，默认过滤整数溢出/边界检查）
  - `-f <模块名>`（自动定位模块+基线 diff，锁定 all-steps：最旧提交含 CMO mkdir/cmo create bugfix → `svn diff -r 基线`，否则按新增模块全量）
  - `-f <模块名> --full`（跳过基线整目录全量）
  - `--triage xx.log`（离线判级，输出 xx_triage_result.md，valid 按 fatal.md 分致命 P0/严重 P1 两档）
- **输入 → 输出**：文件/目录/svn diff/代码片段 → 主报告 `review/<模块名>_<日期>.md`；目录下另有 `<模块名>.log`、`_depend.log`、`_valid/_incon/_invalid.log`、`process.log`、`code_graph.db` 等。
- **流程**（Step 0~6）：Step 0 准备（识别模块名、1000 行+函数边界分块、diff 模式把命中函数完整拷入聚合文件、build_graph.py 建图谱、unit_priority.py 优先级排序、支持 process.log 断点恢复）→ Step 1 函数内漏洞（仅 all-steps）→ Step 2 规范合规（always，11 大类，diff 模式审完整函数体而非 ±5 行）→ Step 3 跨文件依赖（仅 all-steps，图谱查询替代 grep）→ Step 4 统一判级（规则前置匹配+大模型复核，分流 valid/incon/invalid）→ Step 5 误告警规则剔除 → Step 6 逐条子 agent 自主取证复核。严格分阶段，最多 3 并发 Agent。
- **注意**：默认仅 Step 2 以控制耗时与误告警；误告警直接从报告删除；svn 认证失败必须问用户要账号密码（密码不落盘）；GBK 注释先 iconv 转码。
- **场景**：提交前 review SVN 增量改动，或对模块做全量规范/漏洞排查。

---

## ⑤ 代码分析与理解（8）

### c-analyzer 【C 结构精确解析】

- **用途**：C/C++ 源码结构分析：提取 .c 函数大纲与 .h 数据结构定义，是其他分析技能的精确解析后端。
- **命令**：`get_c_outline.py /path/to/file.c`（tree-sitter 提取函数大纲）；`get_h_data_struct.py /path/to/file.h`（提取结构体/联合体/枚举）；ctags 备选：`ctags -x --kinds-c=f file.c`；工程级索引（仅 ctags）：`ctags --language-force-c -R <project>` 后查 tags。
- **输入 → 输出**：.c/.cpp/.h/.hpp 文件 → 标准输出，格式 `开始行号:结束行号 函数定义` 或结构体定义及行号范围。
- **依赖**：Python3 + tree-sitter/tree-sitter-c，或 universal-ctags；优先 tree-sitter，ctags 仅作备选；工程级索引搜索只有 ctags 后端支持。
- **场景**：精确 AST 解析 C 代码结构、列函数清单、提取结构体定义。

### cmw-function-analyzer 【函数语义分析】

- **用途**：用 grep+Read 原生工具分析 C/C++ 函数的功能语义、参数、调用关系与数据依赖。
- **命令**：无独立脚本；组合原生命令：`grep -rn "^<返回类型>\s*<函数名>\s*(" --include="*.c" -r <目录>` 定位定义，反向 grep 查调用者。
- **输入 → 输出**：函数名 + 搜索目录 → Markdown 分析报告（基本信息/功能/参数返回值/调用者/被调函数/全局变量/模块角色/注意事项）。
- **流程**：① 定位定义与声明 → ② 分段阅读实现（禁止整读超大文件）→ ③ 反向 grep 找所有调用者 → ④ 分析被调函数 → ⑤ 分析全局变量依赖 → ⑥ 按模板综合输出。
- **注意**：重名函数需按文件路径区分；函数指针/宏函数难以静态分析；Comware 头文件与实现可能分属 public/ 与 platform/，需两处都搜；未穷尽拼写变体前不得下"无引用"结论。
- **场景**：分析某函数功能、排查特定符号使用情况、梳理接口调用链。

### cmw-datastruct-analyzer 【结构体引用分析】

- **用途**：分析数据结构（struct/union/enum）的引用关系，输出调用链条与每个结构的作用。
- **命令**：无独立脚本，用 grep+Read：grep "struct \<名\>" 定位定义；grep 实例化（malloc/sizeof）；grep ".field|->field" 查字段访问。
- **输入 → 输出**：结构体名 + 搜索目录 → Markdown 报告：定义代码、成员说明表、实例化位置、字段读写统计表、调用链流程图、相关 API 表。
- **流程**：① 定位定义（搜不到则扩展到项目根）→ ② 分析成员含义 → ③ 查实例化（全局/静态/动态）→ ④ 分析字段读写 → ⑤ 分析参数/返回值传递 → ⑥ 构建"创建→处理→销毁"调用链 → ⑦ 生成报告。
- **注意**：工程代码多为 GBK 编码，grep 注意编码；注意 typedef 前向声明；嵌套结构需递归分析；计算结构体大小时禁止手工累加字段宽度（须解析 #pragma pack）。
- **场景**：分析某配置结构体、消息结构体的完整流动路径和生命周期。

### cmw-code-similarity-finder 【相似代码查找】

- **用途**：针对指定函数/结构体/宏查找相似或完全相同的代码实现，发现重复造轮子和复用机会。
- **命令**：`code_similarity_finder.py --type function|struct|macro --name <名称> --search-dir <目录>`；参数：`--threshold`（相似度阈值默认 0.6）、`--max-results`（默认 20）、`--exact`（精确匹配）、`--code-file`（用代码片段做参考）、`--show-diff`、`--include/--exclude`。
- **输入 → 输出**：符号名或参考代码文件 + 搜索目录 → text/JSON 结果列表（相似度、匹配类型、文件行号范围、代码片段）。
- **流程**：① 按类型选匹配策略（函数：AST 精确/CFG 结构/语义三级；结构体：字段名/类型/顺序/内存布局；宏：编辑距离+参数+模式）→ ② 扫描解析 AST → ③ 计算相似度按阈值过滤 → ④ 输出排序结果。
- **注意**：依赖 tree-sitter + python-Levenshtein；源文件需 UTF-8；避免搜整个代码库（性能差），应指定具体目录。
- **场景**：写新函数前查重、重构前找所有相似实现保证一致性。

### code-function-finder 【按功能搜实现】

- **用途**：根据自然语言功能描述（而非具体符号名）语义搜索现有代码实现，并推荐最佳参考实现。
- **命令**：`code_function_finder.py --desc "<功能描述>" --search-dir <目录>`；参数：`--type function|struct|macro|all`、`--threshold`（默认 0.5）、`--recommend`（质量评分推荐）、`--adapt --target-name <新函数名>`（生成适配指南）。
- **输入 → 输出**：自然语言描述（中英文混合更佳）→ 匹配结果列表（匹配度、文件、符号、质量分）；--recommend 输出推荐理由与对比；--adapt 输出 TODO 代码骨架。
- **流程**：① 关键词映射到函数名/注释模式 → ② 加权评分：名称 50% + 注释 25% + 语义 15% + 类别 10% → ③ 可选质量评分（注释 30 + API 位置 25 + 错误处理 20 + 长度 25）→ ④ 可生成适配骨架。
- **区别**：本工具用于编码前调研（输入是功能描述），cmw-code-similarity-finder 用于编码后对比（输入是符号名）。
- **场景**：编码前调研项目里是否已有类似功能实现、找最佳参考实现。

### code-explorer 【代码库探索报告】

- **用途**：新开发前深入探索现有代码库，追踪执行路径、映射架构层级、记录依赖，产出探索报告。
- **命令**：`/code-explorer`（三并发 Explorer subagent 探索仓库）。
- **输入 → 输出**：功能名称/领域描述 + 仓库目录 → **必须**落盘 `docs/code-explorer/[功能名称]-exploration-report.md`，不能只在对话输出。
- **流程**：① 入口点发现（三并发 subagent，从用户操作/事件逐层追踪）→ ② 执行路径追踪（完整调用链、分支、异步边界）→ ③ 架构层级映射（通信方式、反模式）→ ④ 模式识别（设计模式、命名规范）→ ⑤ 依赖关系记录（外部库、内部模块、可复用资源）。
- **注意**：verfiysuite 目录是工具生成不可手动修改；报告需含入口点、调用链、设计模式/反模式、核心文件表、依赖树、新开发建议。
- **场景**：新开发工作启动前摸清现有功能运行机制。

### cmw-search-knowledge 【Comware 文档导出】

- **用途**：用 sirchmunk MCP 搜索 Comware V7 参考文档并将完整文件内容导出到 ./comware_docs/。
- **命令**：`/cmw-search-knowledge -target "<文档名>"`，如 `-target "Comware V7 命令行插件编程手册"`。
- **输入 → 输出**：-target 文档名/关键词 → ./comware_docs/ 下多个 Markdown 文件（含文档标题、Source File、完整原文），每个命中文件单独一个 md。
- **流程**：① 配置 sirchmunk MCP server（http://10.113.36.111:9888/mcp，仅一次）→ ② 解析 -target → ③ sirchmunk_search（mode=DEEP、top_k_files=5、max_depth=10）→ ④ 读取每个命中文件的完整内容 → ⑤ 逐文件写出并报告结果。
- **注意**：关键要求是导出完整内容，严禁摘要/缩略；多文件命中时各自单独成文件。
- **场景**：需要查找/导出 Comware 文档、手册、KE/DDS 规格全文时。

### find-header-file 【编译补头文件】

- **用途**：根据 C 编译错误（宏/结构体/类型未定义、隐式声明）找到并添加正确的头文件包含。
- **命令**：无脚本；触发于编译报错，优先 LSP goToDefinition 定位，Grep 兜底（宏搜 #define、类型搜 typedef、函数搜函数名）。
- **输入 → 输出**：编译报错（'XXX' undeclared / unknown type name / implicit declaration）+ 出错 .c → 修改后的 .c（新增 include，按分类排序），LSP 验证无诊断错误。
- **流程**：① 定位符号定义（LSP 优先/Grep 兜底）→ ② 计算到头文件的相对路径 → ③ 按 standard → system public（public/include/comware）→ module private（从外到内）顺序添加 → ④ LSP 验证。
- **注意**：头文件不允许包含其他头文件，所有 include 只写 .c；常见位置：QUEUE_MSG_S→tqueue.h、DTQ_\*→sys/list.h、DL_NODE_S/HASH_NODE_S→sys/hash.h、BITMAP_S→sys/bitmap.h、TLV_HANDLE→sys/tlv.h。
- **场景**：编译报 undefined macro/unknown type，快速补对头文件。

---

## ⑥ 问题定位与修复（3）

### analyse 【拉取问题单分析】

- **用途**：拉取 IDMS 问题单详情或 ITC 单测结果到本地，结合最近修改代码定位问题；IDMS 只存结果，ITC 额外发邮件。
- **命令**：`/analyse <problemId>` / `/analyse itc <taskId>`（自动识别：19|20 开头 12 位判定 IDMS，其余 ITC）；脚本 `analyse.py --id <id>` 或显式 `--kind idms --problem-id <id>` / `--kind itc --task-id <id> [--nvid NVIDXXX]`；落盘根目录固定 `~/project/reference/analyse`。
- **输入 → 输出**：IDMS → `idms-<problemId>-<时间戳>/`（problem-details.json/.md）；ITC → `{nvid}_{problemId}_{时间戳}/`（FTP 原始文件 + itc-download.md）；两者均写 `analysis.md`；ITC 另发邮件（标题 `[Analyse][ITC <id>] <nvid>`）。
- **流程**：① 运行 analyse.py 拉取材料 → ② 读 case-dir 材料 → ③ svn diff 查看当前修改 → ④ 将问题描述/失败输出映射到最近修改的文件函数 → ⑤ 分析写入 analysis.md → ⑥ 仅 ITC 发邮件（按 nvid 查收件人 reportTo/reportCc 后 POST 邮件接口）。
- **注意**：IDMS 绝不发邮件，只有 ITC 发；不要在回复或文件中写出 FTP 密码（用 ANALYSE_FTP_PASSWORD 环境变量）；无证据不得声称已定位根因。
- **场景**：给出 problemId/itc ID 要求拉取分析，或把单测失败原因映射到最近代码改动并邮件通知。

### cmw-bug-analysis 【问题根因分析】

- **用途**：根据 IDMS 问题单或问题现象做模块级定位、根因分析、方案设计，可编译验证。
- **命令**：`/cmw-bug-analysis -f <module> <problem_id>`（12 位单号，-f 可选跳过模块识别）；`/cmw-bug-analysis -f <module> prompt`（按提示词找相关问题单）；`/cmw-bug-analysis -f <module> <现象描述>`（非 12 位数字不调 IDMS，直接基于现象分析）。
- **输入 → 输出**：单号/现象 + 本地 SVN 工作副本 → Markdown 分析报告（问题单信息/现象/模块定位/根因/方案对比/影响范围/验证建议）。
- **流程**：① 有单号则 query_idms.py 收集信息并判断完整性 → ② 模块定位 + 架构分析（MCP 优先 get_architecture/trace_path）→ ③ 根因分析：症状分类 → 按问题类型映射子目录（cliplugin/xmluiplugin/app/lib/resource）→ L4 行为→L0 资源分层逐层证伪 → ④ 方案设计（至少两方案对比）→ ⑤ 用户确认后实施并 abuild 编译验证。
- **注意**：绝不执行 svn commit，由用户确认后自行提交；代码修改必须过 abuild 编译门禁；根因必须 Read 到真实 .c/.h 并引用行号，不得臆造；锁问题必须先列出全部加解锁点逐路径配对。
- **场景**："帮我分析原始单 xxxx"，或无单号只有现象（如配置地址 1::/64 失败）需要根因定位。

### crash-analyzer 【崩溃堆栈定位】

- **用途**：综合 GDB 回溯日志、系统日志、进程状态及模块 KE/DDS 文档，定位程序崩溃（crash/coredump）根因。
- **命令**：对话提供日志/上下文触发；常用：`gdb -c core <executable> -ex "bt full"`、`dmesg | grep -i "segfault\|oom"`、KE/DDS 文档搜索 `find . -name "*KE*.md"`。
- **输入 → 输出**：GDB bt 输出 + 崩溃信号类型 + 系统日志（可选 KE/DDS 文档）→ 崩溃分析报告：核心问题/症状/信号/调用链/可能原因表（含可能性与验证方法）/排查步骤/参考源码位置。
- **流程**：① 收集关键信息并查找 KE/DDS 文档 → ② 症状分析（启动即崩/运行一段时间/特定命令/偶发/高负载）→ ③ 信号类型分析（SIGSEGV/SIGABRT/SIGBUS）→ ④ 堆栈分析（定位崩溃帧、结合 KE 确认线程职责、DDS 检查设计逻辑）→ ⑤ 资源诊断（线程数超限、OOM）→ ⑥ 多信息源交叉验证。
- **注意**：优先分析业务代码帧，系统库帧通常只是表象；KE/DDS 文档优先，分析前先查找；多线程问题需结合所有线程状态；资源问题要区分泄漏还是配置限制。
- **场景**：守护进程 SIGSEGV 异常退出、特定 CLI 命令触发崩溃、偶发段错误或 OOM。

---

## ⑦ 文档与资料处理（3）

### cmw-pdf2md 【PDF 转 Markdown】

- **用途**：将完整 PDF 转为干净的结构化 Markdown，便于全量上下文加载。
- **命令**：`/cmw-pdf2md <pdf 文件名>`；实际执行两步：首次用 uv 创建 .venv 并安装 pymupdf/pymupdf4llm，再运行 `scripts/pdf_to_md.py "<pdf路径>"`。
- **输入 → 输出**：PDF 文件 → `<pdf文件名>.md`（带 source/total_pages/extracted_at frontmatter）+ 同目录 `images/`（文末附图片摘要表）。
- **流程**：① 检查/创建虚拟环境并装依赖 → ② 运行转换脚本（保留标题层级、粗斜体、代码、表格、列表，图片提取并相对路径引用）→ ③ 读取输出。
- **注意**：首次运行需网络；大 PDF 可能需数分钟；有缓存机制（~/.cache/pdf-to-markdown/，二次转换瞬间完成，源文件变更或脚本升级自动失效）；复杂表格可改用 --docling 模式（需装 docling）。
- **场景**：把 OMA LwM2M 等协议/规范 PDF 转成 Markdown 喂给上下文阅读。

### cloc 【代码行数统计】

- **用途**：统计代码行数，支持文件/目录统计与 SVN 版本间增量对比。
- **命令**：`./cloc <file|dir>`（bundled cloc）；`--json` 输出 JSON；增量场景输入格式为 `路径:版本号`（如 `/path/to/agv:1976733`）。
- **输入 → 输出**：文件/目录路径，或"路径:SVN版本号" → files/blank/comment/code 四列统计表（按语言分行，含 SUM）。
- **流程**：场景 1 直接 cloc 统计；场景 2 解析"路径:版本号" → 创建临时目录，`svn cat <file>@REV` 导出旧版文件 → `./cloc --diff /tmp/svn_xxx/ /本地目录` 对比两版本差异。
- **注意**：增量统计显示的是两版本间代码行数差异；访问 SVN 旧版本需经 svn-utils 包装器认证。
- **场景**：汇报模块代码规模，或统计本次修改相对某基线版本的增量代码量。

### cmw-annotate-function-header 【函数头注释模板】

- **用途**：为 Comware V7 项目一键配置统一的 C 函数头注释模板（写入 CLAUDE.md，影响后续生成代码）。
- **命令**：`/cmw-annotate-function-header`；触发词如"设置函数注释"、"配置代码规范"、"添加作者信息"。
- **输入 → 输出**：作者名称（如 "chenglei c23406"，@author 原样填入）+ 项目 CLAUDE.md 路径 → 在 CLAUDE.md 的 `# 代码风格与规范` 章节追加标准函数注释模板（Func Name/Date Created/Author/Description/Input/Output/Return/Caution/Modification History）。
- **流程**：① 询问作者名称 → ② 确认 CLAUDE.md 路径（不存在则询问是否创建）→ ③ 检查是否已有 `# 代码风格与规范` 章节 → ④ 已有则并列追加、没有则文末新建完整章节 → ⑤ 写入模板（@date 用当前日期 YYYY-MM-DD）→ ⑥ 告知后续生成的 C 函数自动应用。
- **注意**：只修改 CLAUDE.md，不改动现有代码文件；永远追加模式，不覆盖现有内容。
- **场景**：新环境初始化时，让之后所有 AI 生成的 C 函数自带团队标准头注释。

---

## ⑧ 流程与辅助工具（5）

### cmw-prompt-refiner 【指令澄清扩写】

- **用途**：对模糊指令做需求澄清与规范化扩写，用户确认后基于扩写提示词继续执行任务。
- **命令**：`/cmw-prompt-refiner`（针对当前用户指令，无额外参数）。
- **输入 → 输出**：模糊/简略的原始指令（如"优化一下性能"）→ 结构化提示词（任务目标/背景上下文/具体需求/约束条件/验收标准/交付物）→ 确认后执行实际任务。
- **流程**：阶段 1 需求分析（意图、范围、约束、验收标准、上下文依赖 5 维度）→ 阶段 2 澄清追问（针对模糊动词/范围不明/歧义术语，一次不超过 3-5 个问题，问题具体、提供选项、相互独立）→ 阶段 3 按模板扩写提示词 → 阶段 4 询问用户确认后再执行。内置代码开发/文档编写/问题分析三类模板。
- **注意**：指令已足够清晰时不过度追问直接执行；扩写后必须获得用户确认才开始执行；记住用户已回答的内容不重复问。
- **场景**：用户指令模糊/缺范围/有歧义时，先澄清再干活，避免返工。

### customize-workflow 【定制默认工作流】

- **用途**：定制 Comware 开发默认工作流（编码→Review→编译→静态检查→SVN 提交），并在各步骤完成后提醒是否继续。
- **命令**：无命令行参数；配置位于 CLAUDE.md 的 `## Workflow` 章节（快速开发/仅开发/标准开发/深度重构模式，各定义步骤序列与适用场景）。
- **流程**：① 开发任务开始时 grep CLAUDE.md 的 Workflow 章节，未定义则询问用户并建议写入 → ② 跟踪进度逐步询问（编码完成→是否 Review？→是否提交编译？编译 SUCCESS→是否 CodeX？静态检查通过→是否 SVN 提交？）→ ③ SVN 提交为危险动作：必须确认编译通过（提供 BUILD_FULL 构建号）、svn status/diff --summarize 确认变更、按模板准备提交说明，最后以"是否执行 SVN 提交？(是/否)"取得用户明确确认。
- **注意**：**SVN 提交任何时候必须用户明确确认，不得自动提交**；建议所有 C 代码变更都经编译验证；建议用 shadow branch 先做 abuild 验证。
- **场景**：团队统一"编码-审查-编译-检查-提交"节奏，或为新工作区固化默认开发流程。

### task-butler 【定时任务托管】

- **用途**：通用单次定时任务托管管家——到点自动执行任务，自检、断点续传并迭代到完成。
- **命令**：触发词 TaskButler/定时任务/计划任务/延迟执行；通过 AskUserQuestion 收集 4 项配置：启动时间（立即/明天 9:00/自定义）、任务内容、Edit 权限（Yes 编辑/No 只读）、验收标准（可多选）。
- **输入 → 输出**：4 项配置 → `.taskbutler-state.json`（config/progress/monitor/logs）→ 标准《处理报告》（自检结果、执行过程、完成度评估、迭代记录、副作用说明）。
- **流程**：Phase 1 必须弹表单收集配置（不得猜默认值）→ Phase 2 解析时间并用 CronCreate 单次调度 → Phase 3 到点执行 4 步自检（断点检查、时间同步、环境就绪、过程双向验证、副作用评估），并按 Claude Code 版本选托管路径：≥2.1.183 用 /goal 原生模式；<2.1.183 启动外部监控脚本（nohup 后台 30 秒轮询状态文件，last_updated 超阈值则调 claude 恢复，最多 5 次防死循环）→ Phase 3.5 完成度双重判定（Claude 自评 ≥80% 且用户验收标准全满足）→ Phase 3.6 未完成自动迭代 → Phase 4 输出报告后杀掉监控进程并退出。
- **注意**：ReadOnly 模式严禁任何写操作；每个子任务前后必须更新 last_updated（防监控误判中断形成死循环）；任务完成后必须立即退出不留后台进程；不适用于周期性任务（应使用系统 cron）。
- **场景**："明早 9 点跑编译/测试并出报告"这类延迟执行、无人值守任务。

### publish-plugin 【打包发布插件】

- **用途**：把写好的 skill 或 agent 打包成 Claude Code 插件，并创建新插件市场或加入已有市场。
- **命令**：`/publish-plugin <skill或agent目录>`；`/publish-plugin <目录> --marketplace <已有marketplace的git路径>`。
- **输入 → 输出**：含有效 SKILL.md（frontmatter 有 name/description）或 agent .md 的源目录 → 完整 marketplace 目录（`.claude-plugin/marketplace.json`、`plugins/<插件名>/{plugin.json, skills/<插件名>/, agents/, README.md}`），并可发布到 Gitea（10.113.36.121:3001）。
- **流程**：① 判断创建新市场还是加入已有市场（未指定则询问）→ ② 校验源目录含有效 skill/agent → ③ 用 AskUserQuestion 一次性收集插件名、描述、市场名、作者（默认取系统用户名）、目标路径 → ④ 模式 A 创建新市场（已有插件则版本号递增如 1.0.0→1.1.0；skill 复制到 `plugins/<插件名>/skills/<插件名>/`）；模式 B git clone 已有市场、检查重名、追加条目 → ⑤ 校验 JSON 与 frontmatter → ⑥ 询问是否发布 + Gitea 账号/密码，curl API 建空仓库后 git push → ⑦ README 写入安装方式（`/plugin marketplace add <仓库url>.git`、`/plugin install <插件>@<市场>`）。
- **注意**：skills/agents 必须放插件根目录，不能放 .claude-plugin/ 里；插件安装时复制到 ~/.claude/plugins/cache/，内部不能引用外部路径文件；scripts/references 子目录须一并复制。
- **场景**：团队内分享自研 skill，让成员通过 /plugin install 安装使用。

### using-skills 【技能使用总纲】

- **用途**：Comware 环境的技能使用总纲——强制在响应前检查并调用相关技能，并提供技能索引与开发工作流。
- **命令**：指导型技能（无业务参数）；核心规则是"哪怕只有 1% 可能适用也必须调用 Skill 工具"，并声明"使用 [技能] 来 [目的]"。
- **核心规则**：收到消息 → 判断是否有技能可能适用 → 调用 Skill 工具（不要用 Read 读技能文件）→ 有检查清单则为每项建 Todo → 严格遵循技能。指令优先级：用户明确指令（CLAUDE.md/直接请求）> 技能 > 默认系统提示。给出任务类型→技能映射（SVN 操作必调 /svn、运行时 bug 必调 /cmw-bug-analysis、架构分析必调 /cmw-ke-creator 等）与 Comware 8 阶段开发工作流（KE 生成→需求澄清→DDS→编码→Review→CodeX→abuild→测试分析）。
- **注意**：内网离线禁止 curl 公网（GitHub/npm/Google）；遇 Unknown skill 先 /reload-plugins 再查本地市场；作为子代理被派遣执行特定任务时跳过本技能；流程类技能（刚性）严格遵循，分析类（柔性）可按上下文调整。
- **场景**：作为环境级守门技能，确保开发任务走标准技能流程而非绕过技能直接操作。

---

## 使用方式与推荐链路

### 调用方式

- **调用方式：`/ + skill 名称`**，如 `/requirement`、`/abuild -e 64sim7cen -uko`、`/cmw-code-run -dds xxx-dds.md`。带【仅手动】标记的 skill 只能这样调用。
- **自然语言**：直接描述需求，带【自动】标记的 skill 会自动触发，如"帮我提交编译"→ abuild，"分析问题单 a12345"→ analyse / cmw-bug-analysis。

### 典型开发流程推荐

- **Phase 1 前置 · 需求澄清**：requirement —— 把 SOW 中矛盾、描述不清晰的部分转成描述清晰的"澄清后的 SOW"（Word 先转 Markdown）。
- **Phase 2 需求澄清**：sow-clarify —— 需求澄清，生成设计方案。
- **Phase 3 详细设计**：cmw-ke-creator → cmw-dds-creator —— 生成 KE 文档 + 详细设计文档
- **Phase 4 编码实现**：cmw-code-run（-dds 模式）—— 必须通过 Agent 工具以子 agent 调用，禁止主任务直接编码
- **Phase 5 内部**：generating-comware-clireg / generating-comware-buildrun / generating-comware-xmlui —— 由 cmw-code-run 根据任务类型自动调用的子技能：CLI→clireg、BuildRun→buildrun、Netconf/XMLUI→xmlui
- **Phase 7 编译/检查**：abuild，codex —— 编译和静态代码检查
- **Phase 8 质量门禁**：comware-code-review-version1 —— Comware 规范代码审查，循环至 critical/high=0


---

## 附录：模型选择说明

### 目的

帮助用户根据自己的实际需求（能力、速度、图文识别等）挑选合适的模型。**总体原则：模型能力越强，响应速度越慢。** 请在"能力"与"速度"之间权衡选择。

### 已弃用的模型名（请勿再使用）

| 弃用模型名 |
| --- |
| comware-model |
| comware-model-air |
| claude-sonnet-4-6 |
| claude-opus-4-6 |

> 如果配置中仍在使用以上模型名，请尽快切换到下文推荐的模型。

### 推荐使用的模型

**1. 自动路由模型（推荐优先使用）**

| 模型名 | 特点 | 实际后端模型 | 适用场景 |
| --- | --- | --- | --- |
| **auto-model-standard** | 资源最多，**推荐默认** | glm-5.3-flash、qwen3.8-27b | 日常通用任务，能力与速度均衡 |
| **auto-model-pro** | 能力较强，但响应较慢 | glm-5.3、glm-5.3-flash | 复杂推理、高质量输出要求 |
| **auto-model-fast** | 响应速度快 | ornith-1.5-35b | 对延迟敏感、简单快速任务 |
| **auto-model-vl** | 支持图文识别 | ornith-1.5-35b、qwen3.8-27b | 需要识别图片/多模态输入 |

**2. 具体实际模型名（直接指定后端）**

| 模型名 | 说明 |
| --- | --- |
| **qwen3.8-27b** | 通义千问，综合能力较好 |
| **glm-5.3-flash** | GLM 快速版，速度较快 |
| **glm-5.3** | GLM 完整版，能力最强，速度较慢 |

### 如何选择（速查）

```
不知道选什么？          → auto-model-standard   （默认推荐，资源最多）
需要更强的能力，能接受慢？ → auto-model-pro        （能力较强，较慢）
追求响应速度？           → auto-model-fast        （最快）
需要识别图片？           → auto-model-vl          （图文识别）
想固定用某个具体模型？     → 直接填 qwen3.8-27b / glm-5.3-flash / glm-5.3
```

### API Key 获取（红区）

红区用户请访问以下地址，输入域账号即可查询自己的 API Key：

> **http://10.113.36.131:8081/newapi/query/**

### 在 Claude Code 中切换模型

**方式一：使用 `/model` 命令（会话内切换，临时生效）**

在 Claude Code 交互界面中直接输入：

```
/model
```

- 执行后会弹出模型选择列表，选择列表中的模型，或直接输入推荐的模型名（如 `auto-model-standard`）后回车即可。
- 该方式只对**当前会话**生效，退出后恢复默认配置，适合临时试用不同模型。

**方式二：修改项目配置文件（持久生效，推荐）**

编辑项目目录下的 `.claude/settings.local.json`（即 `~/project/.claude/settings.local.json`），在 `env` 字段中设置模型环境变量：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://10.113.36.131:8081",
    "ANTHROPIC_AUTH_TOKEN": "sk-你的APIKey",
    "ANTHROPIC_MODEL": "auto-model-standard",
    "ANTHROPIC_SMALL_FAST_MODEL": "auto-model-fast"
  }
}
```

| 环境变量 | 作用 | 推荐值 |
| --- | --- | --- |
| `ANTHROPIC_MODEL` | 主模型（对话/编码主力） | `auto-model-standard` |
| `ANTHROPIC_SMALL_FAST_MODEL` | 后台轻量任务模型（摘要、生成提交信息等） | `auto-model-fast` |
| `ANTHROPIC_BASE_URL` | API 服务地址 | 红区网关地址 |
| `ANTHROPIC_AUTH_TOKEN` | 认证 Token（即 API Key） | 从红区查询地址获取 |

> 注：较新版本 Claude Code 中，后台轻量模型变量名为 `ANTHROPIC_DEFAULT_HAIKU_MODEL`，与 `ANTHROPIC_SMALL_FAST_MODEL` 作用相同，按你的版本二选一即可。

操作步骤：

1. 打开（没有则新建）项目根目录下的 `.claude/settings.local.json`；
2. 按上面示例填写 `env` 中的环境变量；
3. 将 `ANTHROPIC_MODEL` 的值改为想要的模型名（如 `auto-model-pro`、`auto-model-vl`、`glm-5.3` 等）；
4. 保存后**重启 Claude Code**（或新开会话）即可生效。

> 提示：
> - `settings.local.json` 仅对当前项目、当前用户生效，且默认不进 Git，适合个人本地配置；
> - 若想对项目所有成员统一生效，可写入 `.claude/settings.json`（会进版本库）；
> - API Key 请通过红区查询地址获取：http://10.113.36.131:8081/newapi/query/

### 注意事项

1. **能力与速度不可兼得**：能力越强的模型（如 glm-5.3）推理越慢，请按需选择。
2. **优先使用 auto-model 系列别名**：自动路由模型会根据负载自动调度，稳定性更好。
3. **弃用模型名会逐步下线**：请尽快迁移，避免服务中断。

---

*共 54 个 skill · 生成于 2026-09-20 · 来源：TeamAI/skills 各 SKILL.md 全文（frontmatter + 正文工作流/参数/限制）*
