/**
 * 平台工厂
 * 根据运行平台自动选择对应的实现
 */

const { IPlatformCapture } = require('./interface');

class PlatformFactory {
  /**
   * 获取当前平台的屏幕捕获实现
   * @returns {IPlatformCapture}
   */
  static createCapture() {
    const platform = process.platform;
    
    switch (platform) {
      case 'darwin':
        // macOS
        const MacOSCapture = require('./macos/ScreenCapture');
        return new MacOSCapture();
        
      case 'win32':
        // Windows
        const WindowsCapture = require('./windows/ScreenCapture');
        return new WindowsCapture();
        
      case 'linux':
        // Linux（暂不实现）
        throw new Error('Linux平台暂不支持，敬请期待');
        
      default:
        throw new Error(`不支持的平台: ${platform}`);
    }
  }
  
  /**
   * 获取平台信息
   * @returns {Object}
   */
  static getPlatformInfo() {
    return {
      platform: process.platform,        // 'darwin' | 'win32' | 'linux'
      arch: process.arch,                // 'x64' | 'arm64' | 'ia32'
      version: process.getSystemVersion(), // 系统版本
      isProduction: !process.argv.includes('--dev')
    };
  }
  
  /**
   * 检查当前平台是否支持
   * @returns {boolean}
   */
  static isPlatformSupported() {
    const platform = process.platform;
    return platform === 'darwin' || platform === 'win32';
  }
}

module.exports = { PlatformFactory };
