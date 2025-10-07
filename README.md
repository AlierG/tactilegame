# 在 Render 上部署实时协作触觉游戏

本文档介绍如何把当前的 Node.js + Socket.IO 应用部署到 [Render](https://render.com/) 上，使其能够在网上为多个玩家提供协作服务。

## 前置条件
- 一个 Render 账号，并已登录控制台。
- 已将本仓库推送到 GitHub、GitLab 或 Bitbucket 等受支持的 Git 仓库。

## 部署步骤

1. **创建新的 Web Service**
   1. 登录 Render 控制台，点击 **New** → **Web Service**。
   2. 选择存放本项目的 Git 仓库，并授权 Render 访问。
   3. 在服务设置中填写以下关键信息：
      - **Name**：自定义服务名称，例如 `tactilegame`。
      - **Region**：选择离目标玩家较近的地区。
      - **Branch**：要部署的仓库分支。
      - **Root Directory**：仓库根目录（保留默认的 `/`）。
      - **Environment**：选择 `Node`。
      - **Build Command**：填写 `npm install`。Render 会在每次部署时自动安装依赖。
      - **Start Command**：填写 `npm start`，它会运行 `server.js` 来启动 Express + Socket.IO 服务。
   4. 保持默认的 `Free` 或其他合适的实例类型，点击 **Create Web Service**。

2. **等待构建与部署**
   - Render 会拉取代码、执行 `npm install` 安装依赖，并通过 `npm start` 启动服务。
   - 在日志中确认启动日志包含 `Server listening` 等信息，表示部署成功。

3. **访问应用**
   - 部署完成后，Render 会提供一个公共 URL，例如 `https://tactilegame.onrender.com`。
   - 在浏览器打开该 URL，就可以看到 `web/index.html` 中的游戏界面。
   - 多位玩家访问同一个房间码，即可共享同一个会话，实时同步操作。

## 静态资源说明
- `server.js` 会通过 Express 将 `web` 目录作为静态文件目录，确保浏览器可以加载 `index.html`、`styles.css` 和 `script.js`。
- Socket.IO 服务与页面在同一个域下运行，无需额外配置。

## 常见问题
- **依赖安装失败**：Render 默认可以访问 npm。若看到 `403 Forbidden` 等错误，请检查是否误用了私有 npm 仓库或网络策略。
- **服务长时间未响应**：确保 `Start Command` 使用 `npm start`，并且 `server.js` 在启动后监听了 `process.env.PORT`（该文件已处理）。

## 后续步骤
- 如需自定义域名，可在 Render 服务设置中绑定自定义域。
- 若用户量增大，可在 Render 控制台升级实例类型或启用自动伸缩。

祝部署顺利！
