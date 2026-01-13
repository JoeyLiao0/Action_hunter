/**
 * 文档生成器
 * 将项目转换为单文件HTML文档
 * 所有媒体资源（图片/视频）转换为Base64嵌入
 */

class DocumentGenerator {
  /**
   * 生成HTML文档
   * @param {Object} project - 项目对象
   * @returns {string} 完整的HTML字符串
   */
  generate(project) {
    if (!project || !project.name) {
      throw new Error('无效的项目对象');
    }

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this._escapeHtml(project.name)} - 操作文档</title>
  ${this._generateStyles()}
</head>
<body>
  <div class="container">
    ${this._generateHeader(project)}
    ${this._generateContent(project)}
    ${this._generateFooter(project)}
  </div>
  ${this._generateScripts()}
</body>
</html>`;

    return html;
  }

  /**
   * 生成文档头部
   */
  _generateHeader(project) {
    const date = new Date(project.createdAt).toLocaleString('zh-CN');
    const stats = this._getStatistics(project);

    return `
    <header class="doc-header">
      <h1>${this._escapeHtml(project.name)}</h1>
      <div class="metadata">
        <div class="meta-item">
          <span class="meta-label">生成时间：</span>
          <span class="meta-value">${date}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">步骤数量：</span>
          <span class="meta-value">${stats.total}个</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">内容：</span>
          <span class="meta-value">
            ${stats.screenshots}张截图 | 
            ${stats.videos}段视频 | 
            ${stats.texts}条说明
          </span>
        </div>
      </div>
    </header>`;
  }

  /**
   * 生成主要内容
   */
  _generateContent(project) {
    if (!project.steps || project.steps.length === 0) {
      return '<div class="empty-state">暂无步骤</div>';
    }

    let content = '<main class="doc-content">';

    project.steps.forEach((step, index) => {
      content += this._generateStep(step, index + 1);
    });

    content += '</main>';
    return content;
  }

  /**
   * 生成单个步骤
   */
  _generateStep(step, index) {
    const type = step.type;
    const description = this._escapeHtml(step.description || '');

    let stepContent = `
    <section class="step">
      <div class="step-header">
        <div class="step-number">${index}</div>
        <h2 class="step-title">${description || `步骤 ${index}`}</h2>
      </div>`;

    // 根据类型生成内容
    if (type === 'screenshot') {
      stepContent += this._generateScreenshot(step);
    } else if (type === 'video') {
      stepContent += this._generateVideo(step);
    } else if (type === 'text') {
      stepContent += this._generateText(step);
    }

    stepContent += `</section>`;
    return stepContent;
  }

  /**
   * 生成截图
   */
  _generateScreenshot(step) {
    const base64 = step.data ? step.data.toString('base64') : '';
    
    return `
      <div class="media-container">
        <img src="data:image/png;base64,${base64}" 
             alt="${this._escapeHtml(step.description || '截图')}" 
             class="screenshot" />
      </div>`;
  }

  /**
   * 生成视频
   */
  _generateVideo(step) {
    const base64 = step.data ? step.data.toString('base64') : '';
    
    return `
      <div class="media-container">
        <video class="recording" 
               autoplay 
               loop 
               muted 
               playsinline 
               controls>
          <source src="data:video/webm;base64,${base64}" type="video/webm">
          您的浏览器不支持视频播放
        </video>
        <div class="video-hint">
          💡 提示：点击视频可暂停/播放，右键可调整速度
        </div>
      </div>`;
  }

  /**
   * 生成文本说明
   */
  _generateText(step) {
    const text = this._escapeHtml(step.data || step.description || '');
    const formattedText = text.replace(/\n/g, '<br>');
    
    return `
      <div class="text-content">
        <div class="text-icon">📝</div>
        <div class="text-body">${formattedText}</div>
      </div>`;
  }

  /**
   * 生成页脚
   */
  _generateFooter(project) {
    return `
    <footer class="doc-footer">
      <p>由 <strong>ActionHunter</strong> 自动生成</p>
      <p class="footer-note">本文档为单文件HTML，包含所有图片和视频，便于分享和归档</p>
    </footer>`;
  }

  /**
   * 生成样式
   */
  _generateStyles() {
    return `<style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      line-height: 1.8;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
    }
    
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    
    .doc-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .doc-header h1 {
      font-size: 36px;
      margin-bottom: 20px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .metadata {
      display: flex;
      justify-content: center;
      gap: 30px;
      flex-wrap: wrap;
      margin-top: 20px;
      font-size: 14px;
      opacity: 0.95;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
    }
    
    .meta-label {
      font-weight: 600;
      margin-right: 5px;
    }
    
    .doc-content {
      padding: 40px;
    }
    
    .step {
      margin-bottom: 60px;
      animation: fadeIn 0.5s ease-in;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .step-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .step-number {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      margin-right: 20px;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .step-title {
      font-size: 24px;
      color: #2c3e50;
    }
    
    .media-container {
      margin: 20px 0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .screenshot,
    .recording {
      width: 100%;
      display: block;
    }
    
    .video-hint {
      background: #f8f9fa;
      padding: 12px 20px;
      text-align: center;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
    
    .text-content {
      display: flex;
      gap: 15px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .text-icon {
      font-size: 24px;
      flex-shrink: 0;
    }
    
    .text-body {
      flex: 1;
      color: #555;
      line-height: 1.8;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
      font-size: 18px;
    }
    
    .doc-footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #e9ecef;
    }
    
    .doc-footer strong {
      color: #667eea;
    }
    
    .footer-note {
      margin-top: 10px;
      font-size: 12px;
      opacity: 0.7;
    }
    
    @media (max-width: 768px) {
      body {
        padding: 20px 10px;
      }
      
      .container {
        border-radius: 8px;
      }
      
      .doc-header {
        padding: 30px 20px;
      }
      
      .doc-header h1 {
        font-size: 28px;
      }
      
      .metadata {
        flex-direction: column;
        gap: 10px;
      }
      
      .doc-content {
        padding: 30px 20px;
      }
      
      .step-number {
        width: 40px;
        height: 40px;
        font-size: 20px;
      }
      
      .step-title {
        font-size: 20px;
      }
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
      }
      
      .recording {
        display: none;
      }
      
      .media-container::after {
        content: "（视频内容，请查看电子版）";
        display: block;
        padding: 40px;
        text-align: center;
        background: #f5f5f5;
        color: #999;
      }
      
      .video-hint {
        display: none;
      }
    }
    </style>`;
  }

  /**
   * 生成脚本
   */
  _generateScripts() {
    return `<script>
    // 页面加载完成
    document.addEventListener('DOMContentLoaded', function() {
      console.log('✅ ActionHunter 文档加载完成');
      
      // 统计信息
      const steps = document.querySelectorAll('.step').length;
      const videos = document.querySelectorAll('video').length;
      const images = document.querySelectorAll('.screenshot').length;
      
      console.log('📊 文档统计:', {
        总步骤数: steps,
        视频数: videos,
        截图数: images
      });
      
      // 视频加载监听
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach((video, index) => {
        video.addEventListener('loadeddata', function() {
          console.log(\`视频 \${index + 1} 加载完成\`);
        });
      });
    });
    </script>`;
  }

  /**
   * 获取统计信息
   */
  _getStatistics(project) {
    const stats = {
      total: 0,
      screenshots: 0,
      videos: 0,
      texts: 0
    };

    if (project.steps) {
      stats.total = project.steps.length;
      project.steps.forEach(step => {
        if (step.type === 'screenshot') stats.screenshots++;
        else if (step.type === 'video') stats.videos++;
        else if (step.type === 'text') stats.texts++;
      });
    }

    return stats;
  }

  /**
   * HTML转义
   */
  _escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

module.exports = { DocumentGenerator };
