# 提交到 DSH Market

DSH Market（<https://dsh.market/>）只收录 **GitHub** 仓库，两种提交方式：给仓库打 `dsh-plugin` topic（每日自动扫描），或提一个「提交插件」issue。本文件放好两份可直接复制的内容。

---

## 一、仓库侧（做一次）

1. 在 GitHub 建一个公开仓库，例如 `2BingLing/dsh-appearance`（不要勾选自动生成 README / .gitignore）。
2. 推送本仓库：

   ```powershell
   cd D:\workFile\my\dshP\dsh-appearance
   git remote add origin https://github.com/2BingLing/dsh-appearance.git
   git push -u origin master
   ```

3. 仓库页面 → ⚙️ Settings 右侧的 **Topics** → 依次添加：
   `dsh-plugin`、`deepseek-harness`、`dsh`（第一个是市场扫描的关键 topic）。

## 二、market 收录检查清单

市场管道（每日 06:00）对仓库做特征检测，以下条件本仓库都已满足：

| 条件 | 本仓库 |
| --- | --- |
| 公开、非 fork、非归档、非官方本体 | 是 |
| cordis 型标记 | 根目录 `cordis.patch.yml` ✅ |
| `package.json` 含 `dsh` 字段 | ✅ `dsh.bundle` / `dsh.client` |
| 可安装 | `dsh plugin --profile <name> add github:2BingLing/dsh-appearance` |

## 三、issue 正文（复制粘贴）

标题：`[提交插件] DSH 外观（壁纸 + 开场动画）`

正文直接复制 [docs/market-issue.md](./market-issue.md) 的全部内容；Open Issue 页面已经带好模板骨架，把它粘到「插件信息」下面即可。


## 四、收录之后

- 次日 06:00 管道跑完，issue 会被自动回复并关闭，插件出现在 <https://dsh.market/>。
- 需要补写「作者自述」或改简介：提一个 [`[数据修正]` issue](https://github.com/2BingLing/dsh-market/issues/new?template=data_fix.md)，格式见 <https://github.com/2BingLing/dsh-market/blob/master/CONTRIBUTING.md>。
- 收录后可以给 README 顶部挂徽章（见 `dsh-market/PLUGIN-BADGE.md`）：

  ```markdown
  [![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-zh.svg)](https://dsh.market/)
  ```
