---
name: vscode-extension-monorepo-dev
description: 在这个 vscode-monorepo 项目里从 0 到 1 开发、修改、重构、排查并打包新的 VS Code 插件时必须优先使用本技能。只要用户提到“做一个新的 vscode 插件 / extension / 插件功能 / 命令 / webview / explorer 菜单 / 编辑器右键 / 打包 vsix / scaffold 新扩展 / 修改 apps 下某个扩展”，就应触发本技能。该技能会自动按本仓库规范执行：先读模板与规则、遵守 monorepo 架构、必要时先规划、避免过度设计、优先 extension host 命令方案、按要求构建 / typecheck / lint / package，并在最终回复中给出关键文件与验证结果。
version: 1.0.0
---

# VS Code Extension Monorepo Development

此技能用于当前仓库中新的 VS Code 插件从 0 到 1 开发，以及现有插件的增量功能开发、Bug 修复、重构、构建与打包。

目标不是泛泛地“写一个 VS Code 插件”，而是**在本仓库约束下**完成工作：遵守 monorepo 结构、模板实现方式、规则体系、命令流程与收尾检查。

## 适用范围

出现以下任务时应直接使用本技能：

- 新建一个 VS Code 插件
- 在 `apps/*` 下扩展现有插件能力
- 添加编辑器命令、Explorer 菜单、快捷键、webview、面板、消息桥接
- 做插件打包、构建失败修复、manifest 调整
- 设计插件架构并实施
- 需要在当前 monorepo 中判断功能应放在 app 还是 packages

如果用户只是问某个 VS Code API 是什么、某个接口如何定义、某个类型签名是什么，优先再配合 `vscode-api` 技能，而不是只靠本技能。

---

## 一、先理解仓库，而不是直接写代码

开始实施前，先读取并吸收这些项目约束：

- `CLAUDE.md`
- `.claude/rules/common/*`
- `.claude/rules/typescript/*`
- 参考模板：`apps/template-plugin/*`
- 公共包：
  - `packages/vscode-utils`
  - `packages/webview-bridge`
  - `packages/shared-types`
  - `packages/shared-ui`

尤其要明确以下事实：

1. 这是 **npm workspaces + Turborepo** 的 VS Code 扩展 monorepo。
2. 新扩展应以 `apps/template-plugin` 为参考，而不是自己发明结构。
3. 扩展宿主入口在 `apps/<extension>/src/extension.ts`。
4. webview 只是可选层，不是默认主路径。
5. 当前仓库默认没有成熟测试基础设施；如果用户没明确要求扩展测试框架，就不要为了“显得完整”而过度扩展范围。

---

## 二、默认工作原则

### 1. 先判断是否需要 Plan Mode

符合以下任一条件，优先进入计划/设计思路：

- 新功能不是 1-2 行的小改动
- 会修改多个文件
- 需要决定是 extension host 还是 webview 负责
- 需要新增命令、菜单、消息协议、共享类型
- 涉及 Explorer / Editor / Webview / Clipboard / Workspace 等多 API 协同

如果任务非常直接，例如只改一个 manifest 字段或改一个命令标题，可以直接实施。

### 2. 强制避免过度设计

除非用户明确要求，否则不要主动加入这些内容：

- 不必要的 webview
- 不必要的 React UI
- 不必要的共享 package 抽象
- 不必要的测试框架接入
- 不必要的配置项泛化
- 不必要的 helper / util 层级
- 不必要的向后兼容垫片
- 不必要的 README / docs 新文件

优先做“刚好满足当前需求”的最小实现。

### 3. 文件必须先读后改

对任何准备修改的文件，先读取再编辑。不要对未读文件提出具体改法。

### 4. 高频使用 TodoWrite

复杂实现时，始终把任务拆成明确步骤并实时更新状态。尤其要包含：

- 研究模板与目标文件
- 实施功能
- 校验构建
- 打包/验证
- 复核与收尾

---

## 三、这个仓库里开发新插件的标准流程

### Phase 1：确认落点

先确认功能应该放在哪一层：

- **extension host**：
  - VS Code commands
  - clipboard
  - workspace/file system
  - Explorer 选择
  - editor selection
  - diagnostics / commands / output channel
- **webview**：
  - UI 展示
  - 表单交互
  - 复杂可视化
- **packages/**：
  - 只有在明确跨多个扩展复用时，才考虑抽公共层

默认原则：

- 能在 extension host 完成，就不要先上 webview。
- 只在“真的有界面需求”时使用 webview。

### Phase 2：新建扩展

如果是新插件，优先使用仓库根命令：

```bash
npm run new-extension -- --name my-plugin --display "My Plugin"
```

然后基于新生成的 app 做定制，不直接污染 `apps/template-plugin`。

### Phase 3：替换模板内容

新扩展创建后，通常要检查并修改：

- `apps/<name>/package.json`
- `apps/<name>/src/extension.ts`
- 如保留 webview，再看：
  - `apps/<name>/webview/index.tsx`
  - `apps/<name>/webview/App.tsx`

重点替换：

- command id
- title/category
- activation events
- menus
- keybindings
- build/typecheck/lint/package 是否仍适配当前实现

### Phase 4：按功能最小化实现

实施时遵守：

- 小文件、高内聚
- 函数尽量短小
- 只提取真正复用的逻辑
- 尽量把 VS Code API 绑定逻辑与纯字符串/格式化逻辑分开
- 不在生产代码里留 `console.log`

### Phase 5：校验

至少执行并汇报：

```bash
npm run build --workspace <extension-name>
npm run typecheck --workspace <extension-name>
npm run lint --workspace <extension-name>
npm run package --workspace <extension-name>
```

如果仓库整体依赖尚未安装，先处理 `npm install` 或最小化 workspace 依赖问题，再继续。

### Phase 6：最终交付

最终回复必须包含：

1. 做了什么
2. 改了哪些关键文件
3. 构建 / typecheck / lint / package 结果
4. 产物路径（如 `.vsix`）
5. 仍需用户测试的场景

引用代码位置时使用 `file_path:line_number` 格式。

---

## 四、manifest 与命令设计规范

在本项目中设计 VS Code 插件命令时，优先遵守以下原则：

### commands

- command id 保持稳定且语义清晰
- 使用扩展名前缀，如：`myPlugin.doSomething`
- title 面向用户，简洁直接
- category 使用扩展 display/category

### activationEvents

- 尽量按命令激活：`onCommand:...`
- 不要无意义扩大激活范围

### menus

只在真正需要的入口暴露命令：

- `editor/context`
- `explorer/context`
- `commandPalette`
- 其他 menu 仅按需使用

### keybindings

- 只有用户明确要求快捷键时才添加
- 要加 `when` 条件，避免全局污染

---

## 五、extension host 与 webview 的决策准则

遇到需求时，先做下面这个判断：

### 应放 extension host 的典型场景

- 复制路径、行列范围、资源定位
- 操作工作区文件
- 调用 VS Code 命令
- 监听编辑器选区/活动文档/Explorer 资源
- 调用 `vscode.env.clipboard`
- 输出通知 / output channel

### 应放 webview 的典型场景

- 真正需要 UI 面板
- 配置表单
- 结果可视化
- 多步骤交互工作流

### 如果使用 webview

必须遵守仓库现有模式：

- 使用 `WebviewPanelManager` 统一创建面板
  - `packages/vscode-utils/src/webview-panel.ts:19`
- 使用共享桥接与 hooks，而不是手写原始消息监听
- UI 通过 `WebviewApp` 与主题桥接接入

如果不需要这些，就不要为了“完整”而加 webview。

---

## 六、代码与架构规范

### 1. 不可变更新

遵循仓库规则：不要原地修改对象；优先返回新对象。

### 2. 错误处理

- 对 VS Code API、文件系统、clipboard 等边界操作显式 try/catch
- 对用户显示友好错误提示
- 对 output channel 记录必要上下文
- 不要静默吞错

### 3. 输入边界验证

重点边界包括：

- command 参数
- Explorer 传入的 URI
- editor selection
- 外部文件/非 workspace 资源
- 用户配置项

### 4. 安全要求

绝不：

- 硬编码 secrets
- 把敏感路径、剪贴板内容、凭证直接打到日志
- 在错误提示中泄露不必要的本地环境细节

完成实现后，如果改动非平凡，优先做一次安全/代码复核。

---

## 七、测试与验证策略

这个仓库当前没有现成统一测试脚本，因此默认策略是：

1. **先保证 build/typecheck/lint/package 全通过**
2. **再给出清晰的手工验证清单**

不要为了遵守形式上的 TDD 而强行引入一整套测试框架，除非：

- 用户明确要求
- 或当前功能已经非常适合抽出纯函数并新增轻量测试

如果用户要求引入测试，优先把测试集中在纯逻辑上，例如：

- 路径格式化
- range 格式化
- 去重与排序
- workspace-relative 路径计算

---

## 八、推荐使用的 agents / skills

根据仓库规则，非平凡开发任务优先考虑这些协作方式：

- **planner / Plan agent**：复杂功能设计、分阶段方案
- **tdd-guide**：新功能或 bug 修复时，用于测试策略建议
- **code-reviewer**：代码改完后立即复核
- **security-reviewer**：提交前或涉及路径/输入/外部数据时复核
- **build-error-resolver**：构建失败时快速定位修复
- **vscode-api**：当需要查 VS Code API 定义、兼容性、接口用法时

如果多个检查彼此独立，尽量并行调用。

---

## 九、输出要求

当你完成一次插件开发任务，最终回复至少要包含：

### 1. 实施摘要

- 新增了什么功能
- 是否新建了 extension app
- 是否刻意做了 V1 最小化

### 2. 关键文件

使用代码引用格式，例如：

- `apps/my-plugin/src/extension.ts:12`
- `apps/my-plugin/package.json:24`

### 3. 校验结果

明确列出：

- build 是否通过
- typecheck 是否通过
- lint 是否通过
- package 是否通过

### 4. 产物

如果生成了 VSIX，给出完整路径。

### 5. 待用户验证项

给出 3-8 条具体场景，而不是泛泛地说“请测试”。

---

## 十、一个推荐执行模板

当用户说“帮我在这个仓库开发一个新的 VS Code 插件，需求如下……”时，按这个顺序工作：

1. 读取 `CLAUDE.md`、模板 app、相关 rules
2. 用 TodoWrite 拆任务
3. 判断是否需要先规划
4. 判断功能是在 extension host 还是 webview
5. 如需新建扩展，使用 `npm run new-extension`
6. 修改 `package.json` 与 `src/extension.ts`
7. 只在必要时保留/添加 webview
8. 实施最小可行功能
9. 做代码审查与安全复查
10. 运行 build / typecheck / lint / package
11. 返回关键文件、结果与产物路径

---

## 十一、特别提醒

- 不要脱离本 monorepo 既有架构另起炉灶。
- 不要跳过读取模板与规则这一步。
- 不要为了“完整性”加入与用户目标无关的 UI、抽象或测试框架。
- 不要只给计划不落地；若用户要求直接实施，就完整实施到可构建、可打包。
- 不要在没有验证的情况下声称成功，必须以实际命令结果为准。

如果用户同时要求“查一下 VS Code API 应该怎么用”，立刻配合启用 `vscode-api` 技能。
