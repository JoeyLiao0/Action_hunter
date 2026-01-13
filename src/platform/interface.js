/**
 * 平台抽象接口
 * 所有平台实现必须遵循这个接口
 * 
 * 这个接口定义了屏幕捕获功能的标准API
 * macOS、Windows、Linux等平台需要实现这些方法
 */

class IPlatformCapture {
  /**
   * 获取所有可用的屏幕和窗口源
   * @returns {Promise<Array<Source>>}
   * 
   * Source结构：
   * {
   *   id: string,           // 源ID（用于后续操作）
   *   name: string,         // 显示名称
   *   type: 'screen' | 'window',  // 类型
   *   thumbnail: string,    // Base64缩略图
   *   bounds: {x, y, width, height} | null  // 屏幕位置和大小
   * }
   */
  async getSources() {
    throw new Error('必须实现 getSources()');
  }

  /**
   * 获取指定源的媒体流
   * @param {string} sourceId - 源ID
   * @param {Object} options - 选项 {area: {x, y, width, height}}
   * @returns {Promise<MediaStream>}
   */
  async getMediaStream(sourceId, options = {}) {
    throw new Error('必须实现 getMediaStream()');
  }

  /**
   * 截图
   * @param {Object} options - {sourceId: string, area?: {x, y, width, height}}
   * @returns {Promise<Buffer>} - PNG格式图片Buffer
   */
  async takeScreenshot(options) {
    throw new Error('必须实现 takeScreenshot()');
  }

  /**
   * 开始录制视频
   * @param {Object} options - {sourceId: string, area?: {x, y, width, height}, duration?: number}
   * @returns {Promise<string>} - 录制会话ID
   */
  async startRecording(options) {
    throw new Error('必须实现 startRecording()');
  }

  /**
   * 停止录制
   * @param {string} sessionId - 录制会话ID
   * @returns {Promise<Buffer>} - WebM格式视频Buffer
   */
  async stopRecording(sessionId) {
    throw new Error('必须实现 stopRecording()');
  }

  /**
   * 检查平台权限
   * @returns {Promise<boolean>}
   */
  async checkPermissions() {
    throw new Error('必须实现 checkPermissions()');
  }

  /**
   * 请求权限
   * @returns {Promise<boolean>}
   */
  async requestPermissions() {
    throw new Error('必须实现 requestPermissions()');
  }
}

/**
 * TypeScript风格的类型定义（JSDoc）
 * 
 * @typedef {Object} Source
 * @property {string} id - 源ID
 * @property {string} name - 显示名称
 * @property {'screen'|'window'} type - 类型
 * @property {string} thumbnail - Base64缩略图
 * @property {{x: number, y: number, width: number, height: number}|null} bounds - 屏幕位置和大小
 * 
 * @typedef {Object} CaptureOptions
 * @property {string} sourceId - 源ID
 * @property {{x: number, y: number, width: number, height: number}} [area] - 指定区域
 * @property {number} [duration] - 录制时长（秒），默认15秒
 */

module.exports = { IPlatformCapture };
