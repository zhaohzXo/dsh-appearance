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

````markdown
## 插件信息

- **GitHub 仓库地址**：https://github.com/2BingLing/dsh-appearance
- **插件类型**：cordis-plugin
- **一句话简介**：给 DeepSeek Harness 换窗口壁纸（6 张内置壁纸 / 本地图片 / 图片 URL，可缩放、拖拽取景）并自定义每次启动的开场动画，全部在「设置 → 外观」里配置。
- **作者自述简介**：[自己写的插件，起因是想要一个「开机有仪式感、桌面能换壁纸」的 Harness：设置里多了一页「外观」，壁纸支持本地图片、图片 URL 和 6 张内置壁纸（暮色山脉、黎明海岸、极光夜空、深空星云、黄昏沙丘、极光渐变），可以缩放、拖拽取景、调遮罩；选了壁纸后外壳自动变成半透明磨砂，卡片和弹窗保持不透明，文字不会糊。开场动画有四套预设、四种强调色，时长/标题/是否可跳过都能改，还能先预览。深色和浅色主题都逐项量过对比度，欢迎试用后给我反馈。]
- **是否已打 dsh-plugin 相关 topic**：已打 `dsh-plugin`、`deepseek-harness`、`dsh`

## 补充说明（可选）

- **独特功能**：6 张内置壁纸是 canvas 现场绘制（2400×1350），不打包任何图片文件，单张存进 localStorage 约 20–115 KB；壁纸与配置分开存储，拖动取景只重写几十字节。下拉菜单、开关都是自绘的，深色主题下不会闪出系统白底弹层。
- **配置**：不需要 API Key，插件本身不联网（只有你主动填的图片 URL 会联网），数据全部存在浏览器本地。
- **截图**：仓库 `docs/screenshots/` 有内置壁纸样张、深色设置页、开场动画、应用壁纸后的主界面。
````

## 四、收录之后

- 次日 06:00 管道跑完，issue 会被自动回复并关闭，插件出现在 <https://dsh.market/>。
- 需要补写「作者自述」或改简介：提一个 [`[数据修正]` issue](https://github.com/2BingLing/dsh-market/issues/new?template=data_fix.md)，格式见 <https://github.com/2BingLing/dsh-market/blob/master/CONTRIBUTING.md>。
- 收录后可以给 README 顶部挂徽章（见 `dsh-market/PLUGIN-BADGE.md`）：

  ```markdown
  [![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-zh.svg)](https://dsh.market/)
  ```
