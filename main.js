/**
 * Electron 主进程
 * 处理窗口创建、权限管理、IPC通信
 */

const { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut, systemPreferences } = require('electron');
const path = require('path');
const fs = require('fs');
const { PlatformFactory } = require('./src/platform/factory');

let mainWindow;
let floatingWindow;
let capture;
let storage;

// 开发模式检测
const isDev = process.argv.includes('--dev');

// ============= 全局快捷键 =============

/**
 * 注册全局快捷键
 */
function registerGlobalShortcuts() {
  const isMac = process.platform === 'darwin';
  const modifier = isMac ? 'Command' : 'Control';
  
  // 快捷键：截图
  const screenshotShortcut = `${modifier}+Shift+1`;
  const screenshotRegistered = globalShortcut.register(screenshotShortcut, () => {
    console.log('快捷键触发：截图');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-shortcut-screenshot');
    }
  });
  
  if (screenshotRegistered) {
    console.log(`✅ 快捷键已注册：${screenshotShortcut} - 截图`);
  } else {
    console.log(`❌ 快捷键注册失败：${screenshotShortcut}`);
  }
  
  // 快捷键：录制视频
  const videoShortcut = `${modifier}+Shift+2`;
  const videoRegistered = globalShortcut.register(videoShortcut, () => {
    console.log('快捷键触发：录制视频');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-shortcut-video');
    }
  });
  
  if (videoRegistered) {
    console.log(`✅ 快捷键已注册：${videoShortcut} - 录制视频`);
  } else {
    console.log(`❌ 快捷键注册失败：${videoShortcut}`);
  }
  
  // 快捷键：添加文字说明
  const textShortcut = `${modifier}+Shift+3`;
  const textRegistered = globalShortcut.register(textShortcut, () => {
    console.log('快捷键触发：添加文字');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-shortcut-text');
    }
  });
  
  if (textRegistered) {
    console.log(`✅ 快捷键已注册：${textShortcut} - 添加文字`);
  } else {
    console.log(`❌ 快捷键注册失败：${textShortcut}`);
  }
  
  // 快捷键：显示/隐藏主窗口
  const toggleWindowShortcut = `${modifier}+Shift+H`;
  const toggleRegistered = globalShortcut.register(toggleWindowShortcut, () => {
    console.log('快捷键触发：显示/隐藏主窗口');
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
  
  if (toggleRegistered) {
    console.log(`✅ 快捷键已注册：${toggleWindowShortcut} - 显示/隐藏主窗口`);
  } else {
    console.log(`❌ 快捷键注册失败：${toggleWindowShortcut}`);
  }
}

// ============= 窗口管理 =============

/**
 * 创建悬浮窗口（收起状态）
 */
function createFloatingWindow() {
  floatingWindow = new BrowserWindow({
    width: 60,
    height: 60,
    x: 100,
    y: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  floatingWindow.loadFile('src/ui/floating.html');
  floatingWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  
  floatingWindow.on('closed', () => {
    floatingWindow = null;
  });
}

/**
 * 创建主窗口（展开状态）
 */
function createMainWindow() {
  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // macOS特定样式
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'ActionHunter'
  });

  mainWindow.loadFile('src/ui/index.html');

  // 窗口关闭时只隐藏，不退出应用
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * 创建录制边框窗口
 */
let borderWindow = null;
function createBorderWindow(bounds) {
  if (borderWindow) {
    borderWindow.close();
  }

  borderWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    focusable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          background: transparent;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .border-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 16px;
          pointer-events: none;
        }
        .border {
          width: 100%;
          height: 100%;
          border: 6px solid #e74c3c;
          box-shadow: 0 0 0 4px rgba(231, 76, 60, 0.3),
                      inset 0 0 0 4px rgba(231, 76, 60, 0.3);
          pointer-events: none;
          animation: pulse 2s ease-in-out infinite;
          border-radius: 8px;
          box-sizing: border-box;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .recording-label {
          position: absolute;
          top: 28px;
          left: 28px;
          background: #e74c3c;
          color: white;
          padding: 10px 16px;
          border-radius: 8px;
          font-family: -apple-system, sans-serif;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
        .countdown-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 40px 50px;
          border-radius: 20px;
          font-family: -apple-system, sans-serif;
          font-size: 120px;
          font-weight: 700;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
          min-width: 200px;
          text-align: center;
        }
        .rec-dot {
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          animation: blink 1.5s ease-in-out infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      </style>
    </head>
    <body>
      <div class="border-container">
        <div class="border"></div>
      </div>
      <div class="recording-label">
        <div class="rec-dot"></div>
        录制中
      </div>
    </body>
    </html>
  `;

  borderWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  borderWindow.setIgnoreMouseEvents(true);
}

function closeBorderWindow() {
  if (borderWindow) {
    borderWindow.close();
    borderWindow = null;
  }
}

/**
 * 初始化平台捕获
 */
function initializeCapture() {
  try {
    capture = PlatformFactory.createCapture();
    console.log('✅ 平台捕获初始化成功');
  } catch (error) {
    console.error('❌ 平台捕获初始化失败:', error);
    dialog.showErrorBox('初始化失败', `平台不支持或初始化失败: ${error.message}`);
  }
}

/**
 * 检查并请求macOS权限
 */
async function checkPermissions() {
  if (!capture) return false;
  
  try {
    const hasPermission = await capture.checkPermissions();
    
    if (!hasPermission) {
      const granted = await capture.requestPermissions();
      
      if (!granted) {
        // 引导用户手动授权
        const result = await dialog.showMessageBox({
          type: 'warning',
          title: '需要屏幕录制权限',
          message: '请在系统设置中授予屏幕录制权限',
          detail: '1. 打开"系统偏好设置"\n2. 选择"安全性与隐私"\n3. 点击"屏幕录制"\n4. 勾选 ActionHunter\n5. 重启应用',
          buttons: ['打开系统设置', '稍后'],
          defaultId: 0
        });
        
        if (result.response === 0) {
          // 打开系统设置
          shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
        }
        
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('权限检查失败:', error);
    return false;
  }
}

// ============= IPC 处理器 =============

/**
 * 获取平台信息
 */
ipcMain.handle('get-platform-info', () => {
  return PlatformFactory.getPlatformInfo();
});

/**
 * 检查权限
 */
ipcMain.handle('check-permissions', async () => {
  if (!capture) return false;
  return await capture.checkPermissions();
});

/**
 * 请求权限
 */
ipcMain.handle('request-permissions', async () => {
  if (!capture) return false;
  return await capture.requestPermissions();
});

/**
 * 获取屏幕源列表
 */
ipcMain.handle('get-sources', async () => {
  if (!capture) {
    throw new Error('平台捕获未初始化');
  }
  
  try {
    const sources = await capture.getSources();
    return sources;
  } catch (error) {
    console.error('获取源失败:', error);
    throw error;
  }
});

/**
 * 截图
 */
ipcMain.handle('take-screenshot', async (event, options) => {
  if (!capture) {
    throw new Error('平台捕获未初始化');
  }
  
  try {
    const imageBuffer = await capture.takeScreenshot(options);
    return imageBuffer;
  } catch (error) {
    console.error('截图失败:', error);
    throw error;
  }
});

/**
 * 开始录制
 */
ipcMain.handle('start-recording', async (event, options) => {
  if (!capture) {
    throw new Error('平台捕获未初始化');
  }
  
  try {
    const result = await capture.startRecording(options);
    return result;
  } catch (error) {
    console.error('开始录制失败:', error);
    throw error;
  }
});

/**
 * 停止录制
 */
ipcMain.handle('stop-recording', async (event, sessionId) => {
  if (!capture) {
    throw new Error('平台捕获未初始化');
  }
  
  try {
    const result = await capture.stopRecording(sessionId);
    return result;
  } catch (error) {
    console.error('停止录制失败:', error);
    throw error;
  }
});

/**
 * 保存文件对话框
 */
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

/**
 * 保存文件
 */
ipcMain.handle('save-file', async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('保存文件失败:', error);
    throw error;
  }
});

/**
 * 在浏览器中打开文件
 */
ipcMain.handle('open-in-browser', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('打开文件失败:', error);
    throw error;
  }
});

// ============= 应用生命周期 =============

/**
 * 应用就绪
 */
app.whenReady().then(async () => {
  // 初始化平台捕获
  initializeCapture();
  
  // 检查权限（macOS）
  if (process.platform === 'darwin') {
    await checkPermissions();
  }
  
  // 注册全局快捷键
  registerGlobalShortcuts();
  
  // 创建悬浮窗口
  createFloatingWindow();
  
  // macOS激活时显示主窗口
  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
      createMainWindow();
    }
  });
});

/**
 * 所有窗口关闭（保持悬浮窗）
 */
app.on('window-all-closed', () => {
  // 不退出，保持悬浮窗
});

/**
 * 应用退出前清理
 */
app.on('before-quit', () => {
  app.isQuitting = true;
  // 取消注册全局快捷键
  globalShortcut.unregisterAll();
  console.log('应用退出中...');
});

// ============= 悬浮窗口IPC =============
ipcMain.handle('show-main-window', () => {
  createMainWindow();
  if (mainWindow) {
    mainWindow.show();
  }
});

ipcMain.handle('hide-main-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.handle('move-floating-window', (event, { deltaX, deltaY }) => {
  if (floatingWindow) {
    const [currentX, currentY] = floatingWindow.getPosition();
    floatingWindow.setPosition(currentX + deltaX, currentY + deltaY);
  }
});

// ============= 录制边框IPC =============
ipcMain.handle('get-displays', () => {
  const { screen } = require('electron');
  return screen.getAllDisplays().map(display => ({
    id: display.id,
    bounds: display.bounds,
    workArea: display.workArea
  }));
});

ipcMain.handle('show-border', (event, bounds) => {
  createBorderWindow(bounds);
});

ipcMain.handle('hide-border', () => {
  closeBorderWindow();
});

// ============= 文件选择IPC =============
ipcMain.handle('open-image-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择图片文件',
    properties: ['openFile'],
    filters: [
      { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const imageBuffer = fs.readFileSync(filePath);
    return {
      filePath,
      data: imageBuffer
    };
  }
  
  return null;
});

ipcMain.handle('open-video-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择视频文件',
    properties: ['openFile'],
    filters: [
      { name: '视频文件', extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const videoBuffer = fs.readFileSync(filePath);
    return {
      filePath,
      data: videoBuffer
    };
  }
  
  return null;
});

// 打开项目文件（HTML格式）
ipcMain.handle('open-project-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择项目文件',
    properties: ['openFile'],
    filters: [
      { name: 'ActionHunter 项目文件', extensions: ['html'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    return htmlContent;
  }
  
  return null;
});
