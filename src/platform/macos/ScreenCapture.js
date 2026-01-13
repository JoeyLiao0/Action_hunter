/**
 * macOS 平台屏幕捕获实现
 * 使用 Electron 的 desktopCapturer API
 */

const { IPlatformCapture } = require('../interface');
const { desktopCapturer, systemPreferences } = require('electron');

class MacOSCapture extends IPlatformCapture {
  constructor() {
    super();
    // 维护录制会话
    this.recordingSessions = new Map();
  }

  /**
   * 获取所有屏幕和窗口
   */
  async getSources() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 300, height: 200 }
      });

      return sources.map(source => ({
        id: source.id,
        name: source.name,
        type: source.id.startsWith('screen') ? 'screen' : 'window',
        thumbnail: source.thumbnail.toDataURL(),
        bounds: this._getDisplayBounds(source.display_id)
      }));
    } catch (error) {
      console.error('获取源失败:', error);
      throw new Error(`获取屏幕源失败: ${error.message}`);
    }
  }

  /**
   * 获取媒体流（内部方法）
   */
  async getMediaStream(sourceId, options = {}) {
    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          minWidth: 1280,
          maxWidth: 1920,
          minHeight: 720,
          maxHeight: 1080
        }
      }
    };

    try {
      // 注意：这个方法需要在渲染进程中调用
      // 在主进程中，我们只是返回配置
      return constraints;
    } catch (error) {
      console.error('获取媒体流失败:', error);
      throw new Error(`获取媒体流失败: ${error.message}`);
    }
  }

  /**
   * 截图
   */
  async takeScreenshot(options) {
    const { sourceId, area } = options;
    
    try {
      // 获取高分辨率截图
      const sources = await desktopCapturer.getSources({
        types: [sourceId.startsWith('screen') ? 'screen' : 'window'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      const source = sources.find(s => s.id === sourceId);
      if (!source) {
        throw new Error('未找到指定的源');
      }

      let image = source.thumbnail;

      // 如果指定了区域，裁剪
      if (area) {
        image = this._cropImage(image, area);
      }

      return image.toPNG();
    } catch (error) {
      console.error('截图失败:', error);
      throw new Error(`截图失败: ${error.message}`);
    }
  }

  /**
   * 开始录制（主进程端）
   * 实际录制逻辑在渲染进程，这里返回配置
   */
  async startRecording(options) {
    const { sourceId, area, duration = 15 } = options;
    const sessionId = `rec_${Date.now()}`;

    // 保存会话信息
    this.recordingSessions.set(sessionId, {
      sourceId,
      area,
      duration,
      startTime: Date.now()
    });

    return { sessionId, sourceId, area, duration };
  }

  /**
   * 停止录制
   */
  async stopRecording(sessionId) {
    const session = this.recordingSessions.get(sessionId);
    if (!session) {
      throw new Error('录制会话不存在');
    }

    // 清理会话
    this.recordingSessions.delete(sessionId);
    
    // 实际的视频数据将从渲染进程返回
    return { sessionId };
  }

  /**
   * 检查权限
   */
  async checkPermissions() {
    if (process.platform !== 'darwin') return true;
    
    try {
      const status = systemPreferences.getMediaAccessStatus('screen');
      console.log('macOS屏幕录制权限状态:', status);
      return status === 'granted';
    } catch (error) {
      console.error('检查权限失败:', error);
      return false;
    }
  }

  /**
   * 请求权限
   */
  async requestPermissions() {
    if (process.platform !== 'darwin') return true;
    
    try {
      const status = systemPreferences.getMediaAccessStatus('screen');
      
      if (status === 'not-determined') {
        // 首次请求
        const granted = await systemPreferences.askForMediaAccess('screen');
        console.log('权限请求结果:', granted);
        return granted;
      }
      
      if (status === 'denied') {
        console.log('权限被拒绝，需要手动到系统设置中开启');
        return false;
      }
      
      return status === 'granted';
    } catch (error) {
      console.error('请求权限失败:', error);
      return false;
    }
  }

  // ============= 私有辅助方法 =============

  /**
   * 获取显示器边界信息
   */
  _getDisplayBounds(displayId) {
    try {
      const { screen } = require('electron');
      const displays = screen.getAllDisplays();
      const display = displays.find(d => d.id === displayId);
      return display ? display.bounds : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 裁剪图片
   */
  _cropImage(image, area) {
    try {
      return image.crop(area);
    } catch (error) {
      console.error('裁剪图片失败:', error);
      return image;
    }
  }
}

module.exports = MacOSCapture;
