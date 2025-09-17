# @jnslkj/vue：Vue 2 衍生版（修复 ReDoS 漏洞）

> ⚠️ 重要声明：本仓库是 **Vue 2 官方仓库（[vuejs/vue](https://github.com/vuejs/vue)）的衍生版本**，基于 MIT 许可证进行修改。核心目的是修复 Vue 2 官方已终止维护（EOL）后暴露的 ReDoS 漏洞（CVE-2024-9506），为无法立即迁移到 Vue 3 的项目提供临时安全支持。


## 衍生版本核心信息
- **原始项目**：[Vue 2 官方仓库](https://github.com/vuejs/vue)（已 EOL，原作者：Yuxi (Evan) You）
- **衍生仓库**：[https://github.com/cfires/vue.git](https://github.com/cfires/vue.git)
- **npm 包名**：`@jnslkj/vue`
- **当前版本**：2.7.16（基于 Vue 2 最后一个官方稳定版 2.7.14 修复）
- **修复内容**：优化 `src/compiler/parser/html-parser.ts` 中处理 `<script>`/`<style>`/`<textarea>` 标签的正则逻辑，解决“灾难性回溯”导致的 ReDoS 漏洞（参考 [CVE-2024-9506](https://www.herodevs.com/vulnerability-directory/cve-2024-9506)）
- **原版权声明**：Copyright (c) 2013-present, Yuxi (Evan) You（完整协议见 [LICENSE 文件](https://github.com/cfires/vue/blob/main/LICENSE)）


## 原 Vue 2 官方 EOL 声明（保留完整信息）
### Vue 2 has reached End of Life
**You are looking at the derivative of the now inactive repository for Vue 2. The actively maintained repository for the latest version of Vue is [vuejs/core](https://github.com/vuejs/core).**

Vue 2 has reached End of Life on December 31st, 2023. It no longer receives new features, updates, or fixes from the official team. However, it is still available on all existing distribution channels (CDNs, package managers, Github, etc).

If you are starting a new project, please start with the latest version of Vue (3.x). We also strongly recommend current Vue 2 users to upgrade ([guide](https://v3-migration.vuejs.org/)), but we also acknowledge that not all users have the bandwidth or incentive to do so. If you have to stay on Vue 2 but also have compliance or security requirements about unmaintained software, check out [Vue 2 NES](https://www.herodevs.com/support/nes-vue?utm_source=vuejs-github&utm_medium=vue2-readme) (official extended support) or use this derivative version for temporary vulnerability fixes.


<p align="center"><a href="https://vuejs.org" target="_blank" rel="noopener noreferrer"><img width="100" src="https://vuejs.org/images/logo.png" alt="Vue logo"></a></p>

<p align="center">
  <a href="https://github.com/cfires/vue/actions"><img src="https://img.shields.io/github/actions/workflow/status/cfires/vue/build.yml?branch=main" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/@jnslkj/vue"><img src="https://img.shields.io/npm/dm/@jnslkj/vue.svg?sanitize=true" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/@jnslkj/vue"><img src="https://img.shields.io/npm/v/@jnslkj/vue.svg?sanitize=true" alt="Version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/npm/l/@jnslkj/vue.svg?sanitize=true" alt="License"></a>
  <a href="https://github.com/cfires/vue/issues"><img src="https://img.shields.io/github/issues/cfires/vue.svg?sanitize=true" alt="Issues"></a>
</p>


## 衍生版本使用指南
### 1. 安装方式
替代原 `vue` 依赖，直接通过 npm/pnpm 安装衍生包：
```bash
# 卸载官方 vue（若已安装）
npm uninstall vue
# 安装衍生版本
npm install @jnslkj/vue --save
# 或使用 pnpm
pnpm add @jnslkj/vue