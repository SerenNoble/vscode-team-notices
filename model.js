// 模型选择和介绍（远端数据文件）
// 约定：本文件只允许写数据（module.exports = {...}），不要写任何逻辑代码。
// 插件会下载本文件并执行以获取结构化数据，渲染逻辑在插件端 infoHtml。
// block 类型：p 段落 / list 列表 / kv 键值对卡片 / note 提示框 / code 代码块 / chips 标签 / link 链接
module.exports = {
  subtitle: '模型选择说明 · 总体原则：能力越强，响应速度越慢 —— 请在「能力」与「速度」之间权衡',
  sections: [
    {
      heading: '推荐：自动路由模型',
      blocks: [
        {
          t: 'kv',
          v: [
            ['auto-model-standard', '后端 glm-5.3-flash / qwen3.8-27b。资源最多，能力与速度均衡，日常通用任务首选。', '推荐默认'],
            ['auto-model-pro', '后端 glm-5.3 / glm-5.3-flash。能力较强但响应较慢，适合复杂推理、高质量输出要求。'],
            ['auto-model-fast', '后端 ornith-1.5-35b。响应速度最快，适合对延迟敏感、简单快速的任务。'],
            ['auto-model-vl', '后端 ornith-1.5-35b / qwen3.8-27b。支持图文识别，适合需要识别图片/多模态输入的场景。'],
          ],
        },
        { t: 'note', v: '优先使用 auto-model 系列别名：自动路由模型会根据负载自动调度，稳定性更好。' },
      ],
    },
    {
      heading: '具体模型名（直接指定后端）',
      blocks: [
        {
          t: 'kv',
          v: [
            ['qwen3.8-27b', '通义千问，综合能力较好。'],
            ['glm-5.3-flash', 'GLM 快速版，速度较快。'],
            ['glm-5.3', 'GLM 完整版，能力最强，速度较慢。'],
          ],
        },
      ],
    },
    {
      heading: '如何选择（速查）',
      blocks: [
        {
          t: 'list',
          v: [
            '不知道选什么？→ auto-model-standard（默认推荐，资源最多）',
            '需要更强的能力，能接受慢？→ auto-model-pro（能力较强，较慢）',
            '追求响应速度？→ auto-model-fast（最快）',
            '需要识别图片？→ auto-model-vl（图文识别）',
            '想固定用某个具体模型？→ 直接填 qwen3.8-27b / glm-5.3-flash / glm-5.3',
          ],
        },
      ],
    },
    {
      heading: 'API Key 获取（红区）',
      blocks: [
        { t: 'p', v: '红区用户访问以下地址，输入域账号即可查询自己的 API Key：' },
        { t: 'link', v: ['打开 API Key 查询页', 'http://10.113.36.131:8081/newapi/query/'] },
      ],
    },
    {
      heading: '注意事项',
      blocks: [
        {
          t: 'list',
          v: [
            '能力与速度不可兼得：能力越强的模型（如 glm-5.3）推理越慢，请按需选择。',
            '弃用模型名会逐步下线，请尽快迁移。',
          ],
        },
      ],
    },
    {
      heading: '在 Claude Code 中切换模型',
      blocks: [
        {
          t: 'list',
          v: [
            '方式一（临时生效）：会话内输入 /model，在列表中选择或直接输入模型名（如 auto-model-standard）回车。仅当前对话生效，退出后恢复默认。',
            '方式二（持久生效，推荐）：编辑 ~/project/.claude/settings.local.json，在 env 中设置环境变量，保存后重启 Claude Code（或新开会话）。对所有会话生效。',
          ],
        },
        {
          t: 'kv',
          v: [
            ['ANTHROPIC_BASE_URL', 'API 服务地址 → http://newmodel.h3c.com'],
            ['ANTHROPIC_AUTH_TOKEN', '认证 Token（即 API Key），从红区查询地址获取'],
            ['ANTHROPIC_MODEL', '主模型（对话/编码主力）→ auto-model-standard'],
            ['ANTHROPIC_DEFAULT_HAIKU_MODEL', '后台轻量任务模型（摘要、提交信息等）→ auto-model-fast'],
          ],
        },
        { t: 'p', v: 'settings.local.json 完整配置示例（可直接复制修改）：' },
        {
          t: 'code',
          v: [
            '{',
            '  "env": {',
            '    "ANTHROPIC_BASE_URL": "http://newmodel.h3c.com",',
            '    "ANTHROPIC_MODEL": "auto-model-standard",',
            '    "ANTHROPIC_DEFAULT_OPUS_MODEL": "auto-model-standard",',
            '    "ANTHROPIC_DEFAULT_SONNET_MODEL": "auto-model-pro",',
            '    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "auto-model-fast",',
            '    "H3CCODECLI_VERSION": "v3.0.0",',
            '    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFF": "1",',
            '    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "200000",',
            '    "DISABLE_AUTOUPDATER": "1",',
            '    "API_TIMEOUT_MS": "30000000",',
            '    "ANTHROPIC_AUTH_TOKEN": "sk-你的APIKey"',
            '  },',
            '}',
          ].join('\n'),
        },
        {
          t: 'note',
          v: 'settings.local.json 仅对当前项目、当前用户生效，且默认不进 Git，适合个人本地配置；要对项目所有成员统一生效可写入 .claude/settings.json。较新版本 Claude Code 中后台轻量模型变量名为 ANTHROPIC_DEFAULT_HAIKU_MODEL，与 ANTHROPIC_SMALL_FAST_MODEL 作用相同，二选一即可。',
        },
      ],
    },
    {
      heading: '已弃用的模型名（请勿再使用）',
      blocks: [
        {
          t: 'chips',
          v: [
            ['comware-model', 'danger'],
            ['comware-model-air', 'danger'],
            ['claude-sonnet-4-6', 'danger'],
            ['claude-opus-4-6', 'danger'],
          ],
        },
        { t: 'note', v: '以上模型名已弃用、将逐步下线。如果配置中仍在使用，请尽快切换到上文推荐的模型，避免服务中断。' },
      ],
    },
  ],
};
