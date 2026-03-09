---
name: monorepo-release-master
description: 在当前 vscode-monorepo 仓库里处理按 project-name 定向发布时必须优先使用本技能。只要用户提到“发布某个插件”“帮我 commit 并打 tag”“根据改动识别项目并发版”“为某个 apps/* 扩展自动递增版本并推送”“触发 GitHub Release / GitHub Actions 发布 VS Code 插件”，就应触发本技能。该技能会围绕当前仓库的既有规则工作：强调作者身份始终为 namewta，先识别目标 app，再检查改动、确定版本、执行 build/typecheck/lint/package、创建规范 commit、打 `project-name/vx.y.z` 标签、push 分支与 tag，并在最终回复中汇报关键命令、版本决策、风险点和产物路径。
version: 1.0.0
---

# Monorepo Release Master

本技能用于当前仓库中**单个 VS Code 插件 app 的定向提交流程与发布流程**。

它解决的问题不是泛泛的“执行 git 操作”，而是：

- 在 `apps/*` 中识别本次实际变更对应哪个插件
- 明确作者/发布者身份固定为 `namewta`
- 根据该插件历史 tag 自动递增版本号
- 在提交前执行必要校验
- 生成符合仓库规则的 commit
- 创建 `project-name/vx.y.z` 标签
- push 分支与标签，触发现有 GitHub Actions release workflow

---

## 适用范围

出现以下任务时，应直接使用本技能：

- “帮我发布 reference-copier”
- “根据当前改动识别项目并自动发版”
- “帮我 commit、tag、push 这个插件”
- “给某个 app 自动升级版本并触发 release”
- “按当前 monorepo 的规则做 VS Code 插件发布”
- “为某个 apps/* 项目生成 release tag 并推送”

如果用户只是问 Git 基础命令含义，或只想了解 GitHub Actions 原理，而不需要在本仓库里执行 project 级发布，不必使用本技能。

---

## 核心原则

### 1. 作者身份必须一致

当前项目、插件开发者、publisher、仓库身份统一强调为：`namewta`。

执行前后都应检查这一点在关键信息里是否保持一致：

- `apps/<project>/package.json` 中的 `publisher`
- `apps/<project>/package.json` 中的 `author`
- README 或发布说明中的作者描述
- Release 命名或总结中的作者归属

如果发现和 `namewta` 不一致，应先提示用户并确认是否需要修正，再继续发布。

### 2. 只发布一个明确目标项目

每次执行默认只处理一个 `apps/<project-name>`。

即使仓库里有多个 app 同时被改动，也不要擅自为多个项目一起打 tag。应先识别候选项目，再让用户确认目标项目。

### 3. 版本号默认自动递增 patch

默认版本策略：

1. 读取目标项目最近的 tag，格式必须是：`project-name/vx.y.z`
2. 取其中最高/最近版本
3. 自动递增 patch，例如：
   - `reference-copier/v0.0.1` -> `reference-copier/v0.0.2`
4. 如果该项目还没有任何 tag：
   - 优先以 `apps/<project>/package.json` 中的 `version` 为基准
   - 默认创建对应下一个 patch 版本 tag

如果用户明确指定版本，则以用户输入为准，不自动递增。

### 4. 必须先校验再提交

在 commit / tag / push 前，至少对目标项目执行：

```bash
npm run build --workspace <project-name>
npm run typecheck --workspace <project-name>
npm run lint --workspace <project-name>
npm run package --workspace <project-name>
```

如果某个项目没有对应脚本或脚本失败：

- 不要继续打 tag
- 先修复或向用户说明阻塞点

### 5. 标签是发布源，而不是手工回填版本的替代品

本仓库的 GitHub Actions workflow 会根据 tag 解析版本并在 CI 中临时写入目标 app 的 `package.json.version`。

这意味着：

- 本地提交可以不强制改 `package.json` 版本
- 但 tag 命名必须正确
- tag 一旦 push，就会驱动 release 流程

因此，tag 创建前必须确认项目名和版本号无误。

---

## 标准执行流程

## Phase 1：识别目标项目

优先顺序：

1. 用户明确给出 project-name
2. 否则根据 git diff / staged files / 未提交变更识别 `apps/*` 下的受影响项目
3. 若识别出多个候选项目，必须让用户确认目标
4. 若没有任何 `apps/*` 改动，不要猜测发布目标

识别时重点查看：

- `apps/<project>/**`
- 该 app 是否确实存在 `package.json`
- 变更是否真的是该 app 的发布候选，而不是单纯文档或根配置变更

## Phase 2：检查作者与 manifest 身份

读取目标项目的 `apps/<project>/package.json`，确认：

- `publisher` 为 `namewta`
- `author.name` 为 `namewta`
- 如存在仓库链接，应与 `https://github.com/NAMEWTA/vscode-monorepo` 保持一致

如果不一致：

- 向用户指出差异
- 只有在用户要求修正时才修改

## Phase 3：推断下一个版本号

建议顺序：

1. 查询远端和本地标签中与该项目相关的 tag
2. 过滤 `project-name/v*`
3. 找出最高语义化版本
4. 自动递增 patch
5. 生成最终 tag：`project-name/v<next-version>`

示例：

- 当前最新 tag：`template-plugin/v1.4.2`
- 下一个 tag：`template-plugin/v1.4.3`

若没有历史 tag：

- 读取 `apps/<project>/package.json` 的 `version`
- 以该版本为基线递增 patch，或在用户要求下直接使用当前版本

## Phase 4：执行项目级校验

按目标项目逐步执行：

```bash
npm run build --workspace <project-name>
npm run typecheck --workspace <project-name>
npm run lint --workspace <project-name>
npm run package --workspace <project-name>
```

执行要求：

- 一个失败就停止后续发布动作
- 如 build 失败，不要继续 typecheck/lint/package 后的 git 发布步骤
- 如果 package 产出了 `.vsix`，记录完整路径供最终汇报

## Phase 5：整理提交内容

提交前必须检查：

- 当前改动是否只包含本次应发布的内容
- 是否意外包含 `.env`、凭证、临时文件
- 是否混入其他 app 的未完成改动
- 是否混入不应发布的根级实验性修改

如果发现多个项目混在一起：

- 默认不要擅自提交全部
- 先提示用户说明当前提交不够聚焦

## Phase 6：生成 commit message

遵循仓库的 conventional commits 风格：

```text
<type>: <description>
```

推荐类型：

- `feat`: 新功能
- `fix`: 缺陷修复
- `refactor`: 重构
- `docs`: 文档变更
- `chore`: 流程、配置、发布辅助改动
- `ci`: CI/CD 工作流变更

commit message 应该概括“为什么要发布这个项目”，而不是机械罗列文件名。

## Phase 7：打 tag 并推送

在 commit 完成且校验通过后：

1. 创建 tag：`project-name/vx.y.z`
2. push 当前分支
3. push 该 tag

只要 tag 被推送，当前仓库的 workflow：

- `.github/workflows/release-extension.yml`

就会自动为该项目创建 GitHub Release 并上传 `.vsix`。

---

## 注意事项清单

每次执行都应主动检查这些点：

### A. 项目识别

- 不要仅凭用户一句“发版”就猜 project-name
- 如果多个 `apps/*` 都有改动，必须确认目标
- 根目录配置变更不等于某个插件应该发版

### B. 版本策略

- 默认自动递增 patch，不擅自升级 minor/major
- 若历史 tag 不连续，以最高合法 tag 为准
- tag 必须使用 `project-name/vx.y.z`，不能写成 `vx.y.z`

### C. 校验顺序

- 先 build/typecheck/lint/package，后 commit/tag/push
- package 失败时禁止继续发版
- 无法生成 `.vsix` 时不要打发布 tag

### D. Git 安全

- 不要使用 destructive git 命令
- 不要 force push
- 不要跳过 hooks
- 不要把与本项目无关的文件一起提交

### E. 作者身份

- 默认强调并保持作者为 `namewta`
- 若 manifest 中 publisher/author 不一致，应先提示再处理

### F. Release 结果

- push tag 后，要提醒用户去 GitHub Actions / Releases 页面确认结果
- 如果 workflow 已存在，引用其路径：
  - `.github/workflows/release-extension.yml:1`

---

## 推荐输出格式

完成后，最终回复至少要包含以下部分：

### 1. 目标项目

- 本次发布的 project-name
- 本次使用的版本号
- 本次创建的 tag

### 2. 作者身份确认

明确说明：

- 当前项目与插件作者身份为 `namewta`
- 如有检查 manifest，也说明检查结果

### 3. 校验结果

逐项说明：

- build
- typecheck
- lint
- package

### 4. Git 操作结果

说明是否已完成：

- commit
- push branch
- push tag

### 5. 发布触发信息

说明：

- 哪个 workflow 会被触发
- 用户接下来应到哪里看 release 结果

### 6. 关键文件引用

使用 `file_path:line_number` 格式，例如：

- `.github/workflows/release-extension.yml:1`
- `apps/reference-copier/package.json:6`
- `README.md:209`

---

## 示例触发语句

以下用户说法都应触发本技能：

- “帮我把 reference-copier 发一个新版本”
- “根据当前改动识别该发哪个插件，然后 commit、tag、push”
- “帮我把这个 app 自动升级 patch 并发布”
- “把当前 monorepo 里改动的插件打包并推送 release tag”
- “帮我走一遍 namewta 这个仓库的插件发布流程”

---

## 最后提醒

- 本技能面向当前仓库，不是通用 git 发布模板。
- 必须优先围绕 `apps/*` 的单项目发布来工作。
- 识别不清目标项目时，宁可先确认，也不要误发版。
- 在本仓库里，tag 是触发 release 的关键动作，因此 commit 之后的 tag/push 必须足够谨慎。
