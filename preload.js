/**
 * Preload 脚本
 * 在渲染进程和主进程间建立安全桥梁
 * 使用 contextBridge 暴露安全的 API
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * 暴露安全的 Electron API 给渲染进程
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 获取平台信息
   */
  getPlatformInfo: () => ipcRenderer.invoke('get-platform-info'),
  
  /**
   * 权限管理
   */
  checkPermissions: () => ipcRenderer.invoke('check-permissions'),
  requestPermissions: () => ipcRenderer.invoke('request-permissions'),
  
  /**
   * 屏幕源操作
   */
  getSources: () => ipcRenderer.invoke('get-sources'),
  
  /**
   * 截图
   */
  takeScreenshot: (options) => ipcRenderer.invoke('take-screenshot', options),
  
  /**
   * 录屏
   */
  startRecording: (options) => ipcRenderer.invoke('start-recording', options),
  stopRecording: (sessionId) => ipcRenderer.invoke('stop-recording', sessionId),
  
  /**
   * 文件操作
   */
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openInBrowser: (filePath) => ipcRenderer.invoke('open-in-browser', filePath),
  
  /**
   * 窗口管理
   */
  showMainWindow: () => ipcRenderer.invoke('show-main-window'),
  hideMainWindow: () => ipcRenderer.invoke('hide-main-window'),
  moveFloatingWindow: (deltaX, deltaY) => ipcRenderer.invoke('move-floating-window', { deltaX, deltaY }),
  
  /**
   * 录制边框
   */
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  showBorder: (bounds) => ipcRenderer.invoke('show-border', bounds),
  hideBorder: () => ipcRenderer.invoke('hide-border'),
  
  /**
   * 文件选择
   */
  openImageFile: () => ipcRenderer.invoke('open-image-file'),
  openVideoFile: () => ipcRenderer.invoke('open-video-file'),
  openProjectFile: () => ipcRenderer.invoke('open-project-file'),
  
  /**
   * 全局快捷键监听
   */
  onShortcutScreenshot: (callback) => {
    ipcRenderer.on('global-shortcut-screenshot', callback);
  },
  onShortcutVideo: (callback) => {
    ipcRenderer.on('global-shortcut-video', callback);
  },
  onShortcutText: (callback) => {
    ipcRenderer.on('global-shortcut-text', callback);
  },
});

console.log('✅ Preload 脚本加载完成');
