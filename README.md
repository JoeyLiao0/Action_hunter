# ActionHunter

内部提效工具 - 操作录制与文档自动生成器

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式运行（显示测试面板）
npm run dev

# 正常运行
npm start
```

## macOS 首次使用

首次运行时需要授予屏幕录制权限：
1. 系统会弹出权限请求，点击"好"
2. 如果被拒绝，到"系统偏好设置 → 安全性与隐私 → 屏幕录制"中手动勾选

## 项目结构

```
action-hunter/
├── main.js                      # Electron主进程
├── preload.js                   # 安全桥接
├── src/
│   ├── ui/                      # 界面层
│   │   ├── index.html
│   │   ├── renderer.js
│   │   └── styles.css
│   ├── core/                    # 业务逻辑
│   │   ├── ProjectManager.js
│   │   └── DocumentGenerator.js
│   └── platform/                # 平台抽象层
│       ├── interface.js
│       ├── factory.js
│       ├── macos/
│       │   └── ScreenCapture.js
│       └── windows/
│           └── ScreenCapture.js
```

## 功能特性

- ✅ 模块化录制（截图/15秒视频/文本说明）
- ✅ 预先输入说明，录制更有条理
- ✅ 自动生成单文件HTML文档
- ✅ 视频Base64嵌入，便于分享
- ✅ 完整的测试面板，模块化验证
- ✅ 跨平台架构（macOS已实现，Windows预留接口）
