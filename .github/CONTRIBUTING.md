# Contributing to OpenGemCutting

感谢你帮助改进 OpenGemCutting。We welcome reproducible bug reports, faceting examples, documentation, tests, and focused code changes.

## 不需要先学 Git · Contribute with Codex

安装 OpenGemCutting Companion 后，可以让 Codex 打开社区中心，帮你浏览 Discussions、整理问题或建议、检查本地改动，并准备 Fork、分支和 Pull Request。它会在任何公开发布、push 或 PR 创建前展示最终预览并等待你的明确确认。

With the OpenGemCutting Companion installed, ask Codex to open the community hub. It can guide GitHub onboarding, browse categorized Discussions, route a faceting question or idea, review local changes, run the repository checks, and prepare a Pull Request while preserving contributor attribution. Nothing is published without a final preview and explicit confirmation.

Installation instructions are in the [Companion lifecycle guide](../plugins/opengemcutting-companion/LIFECYCLE.md). Traditional GitHub participation remains fully supported.

## 开始之前 · Before you start

- 开放式问题、产品想法和切型展示优先放在 [GitHub Discussions](https://github.com/yuyou-dev/OpenGemCutting/discussions)；可复现的缺陷使用 Issue。
- Bug 请提供最小复现、浏览器/系统信息、期望与实际结果；涉及几何时附上可公开的 JSON。
- 新功能请先描述切磨场景、操作流程和可验收结果，再讨论实现。
- 安全问题或疑似凭据泄露不要放进公开 Issue，按 `.github/SECURITY.md` 私下报告。
- 自 v2.1.1 起采用新的许可范围，见 [许可范围](../docs/legal/LICENSING.md)。既有贡献继续保留原许可；新受限代码请先取得针对准确代码范围的书面贡献许可，不因提交自动推定版权转让或重新授权。
- Reports and original descriptions remain welcome. Before publishing new restricted project code, obtain written permission covering the exact contribution and the maintainer’s right to distribute it under the proposed project license. Earlier MIT grants remain valid.

## Pull request workflow

1. 涉及新受限内容时先确认书面贡献许可；取得许可后再用 Fork／分支准备准确范围的贡献。已有 MIT 内容继续按其许可办理。避免夹带无关格式化或重构。
2. 阅读 `AGENTS.md` 和 `docs/architecture/design-system.md`，保持 CUT 状态机、几何符号与视觉约定。
3. 为领域行为增加或更新 Node.js 测试；可见界面变化附真实截图。
4. 运行 `npm run check`，并在 PR 中写明命令结果和未覆盖风险。
5. 保持依赖最小；新增依赖需要说明现有代码无法简洁解决的问题。

Companion 只会将这些步骤变成对话式流程，不改变 GitHub 的 Fork、审查和作者记录。

## Project contracts

- 初始晶体 `stock` 与 `CUT STACK` 共同构成唯一几何数据源；编辑必须在原布尔序列位置替换。
- `normal · point <= offset`、`+Z` 朝冠部、索引 `0` 显示为 `96`。
- CUT 空闲/新建/编辑/群组四态由 `src/domain/cutSession.js` 统一管理。
- 开发与预览只绑定 `127.0.0.1`，端口由操作系统分配。
- 保留 SUVA / 切磨工作台 / Facet 96 品牌拼写，不得写成 SUWA。
- 不提交密钥、个人绝对路径、私有主机、内部仓库信息、`dist/`、`tmp/` 或 `output/`。

## Commit and PR notes

提交信息建议使用简短祈使句。PR 需要说明：用户可见结果、动机、验证、视觉证据（如适用）以及有意不处理的范围。参与即表示同意遵守 `.github/CODE_OF_CONDUCT.md`。

## 技术支持与反馈

官方团队：**SUVA / 地质大学博士说AI / 苏哇科技**。工作台顶部“技术支持”可查看团队介绍、使用许可和测试群二维码（余博士开源技术群）。[打开技术支持](https://yuyou-dev.github.io/OpenGemCutting/#support)。

- 遇到故障：[提交 Issue](https://github.com/yuyou-dev/OpenGemCutting/issues/new?template=bug_report.yml)，提供复现步骤、期望和实际结果。可从“反馈与技术支持”查看并复制诊断信息；不会自动上传设计文件。
- 操作疑问或改进想法：[在 Discussions 发帖](https://github.com/yuyou-dev/OpenGemCutting/discussions)，说明想完成的切型设计任务及障碍。
- 安全漏洞或敏感信息：按 [安全报告说明](SECURITY.md) 私下报告，不放入公开 Issue。

Issue 和 Discussions 发帖需要 GitHub 账号。仅附你愿意公开的内容；软件贡献须符合上面的许可边界。
