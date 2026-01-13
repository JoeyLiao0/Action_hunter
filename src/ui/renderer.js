/**
 * 渲染进程 - UI交互逻辑
 * 处理所有UI交互、测试功能和业务调用
 */

// ========== ProjectManager 类（内联） ==========
class ProjectManager {
  constructor() {
    this.currentProject = null;
    this.isRecording = false;
  }

  createProject(name) {
    if (!name || name.trim() === '') {
      throw new Error('项目名称不能为空');
    }

    this.currentProject = {
      name: name.trim(),
      createdAt: new Date(),
      steps: []
    };

    this.isRecording = true;
    console.log('✅ 项目创建成功:', this.currentProject.name);
    
    return this.currentProject;
  }

  getCurrentProject() {
    return this.currentProject;
  }

  hasActiveProject() {
    return this.currentProject !== null && this.isRecording;
  }

  addStep(step) {
    if (!this.hasActiveProject()) {
      throw new Error('没有活动项目');
    }

    if (!step.type || !['screenshot', 'video', 'text'].includes(step.type)) {
      throw new Error('无效的步骤类型');
    }

    const fullStep = {
      ...step,
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      index: this.currentProject.steps.length + 1
    };

    this.currentProject.steps.push(fullStep);
    console.log(`✅ 添加步骤 ${fullStep.index}:`, fullStep.type);
    
    return fullStep;
  }

  getSteps() {
    if (!this.currentProject) {
      return [];
    }
    return this.currentProject.steps;
  }

  getStepCount() {
    return this.currentProject ? this.currentProject.steps.length : 0;
  }

  deleteStep(stepId) {
    if (!this.hasActiveProject()) {
      throw new Error('没有活动项目');
    }

    const index = this.currentProject.steps.findIndex(s => s.id === stepId);
    if (index === -1) {
      throw new Error('步骤不存在');
    }

    this.currentProject.steps.splice(index, 1);
    
    this.currentProject.steps.forEach((step, idx) => {
      step.index = idx + 1;
    });

    console.log(`✅ 删除步骤:`, stepId);
  }

  finishProject() {
    if (!this.hasActiveProject()) {
      throw new Error('没有活动项目');
    }

    this.isRecording = false;
    console.log('✅ 项目录制完成:', this.currentProject.name);
    
    return this.currentProject;
  }

  exportProject() {
    if (!this.currentProject) {
      throw new Error('没有项目可导出');
    }

    return {
      ...this.currentProject,
      exportedAt: new Date()
    };
  }

  reset() {
    this.currentProject = null;
    this.isRecording = false;
    console.log('✅ 项目管理器已重置');
  }

  getStatistics() {
    if (!this.currentProject) {
      return {
        totalSteps: 0,
        screenshots: 0,
        videos: 0,
        texts: 0
      };
    }

    const stats = {
      totalSteps: this.currentProject.steps.length,
      screenshots: 0,
      videos: 0,
      texts: 0
    };

    this.currentProject.steps.forEach(step => {
      if (step.type === 'screenshot') stats.screenshots++;
      else if (step.type === 'video') stats.videos++;
      else if (step.type === 'text') stats.texts++;
    });

    return stats;
  }
}

// ========== DocumentGenerator 类（内联） ==========
class DocumentGenerator {
  generate(project) {
    if (!project || !project.name) {
      throw new Error('无效的项目对象');
    }

    // 准备项目数据用于嵌入（包含完整的steps数据）
    const projectData = this._prepareProjectData(project);

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
  
  <!-- 项目数据（用于重新导入编辑） -->
  <script type="application/json" id="action-hunter-project-data">
${JSON.stringify(projectData, null, 2)}
  </script>
  
  ${this._generateScripts()}
</body>
</html>`;

    return html;
  }

  /**
   * 准备用于嵌入HTML的项目数据
   */
  _prepareProjectData(project) {
    const preparedSteps = project.steps.map(step => {
      const preparedStep = {
        id: step.id,
        type: step.type,
        description: step.description,
        timestamp: step.timestamp
      };

      // 处理不同类型的数据格式
      if (step.type === 'screenshot' || step.type === 'video') {
        // 确保数据是base64字符串
        if (typeof step.data === 'string') {
          preparedStep.dataBase64 = step.data;
        } else if (step.data._base64) {
          preparedStep.dataBase64 = step.data._base64;
        } else if (step.data instanceof ArrayBuffer || step.data instanceof Uint8Array) {
          preparedStep.dataBase64 = this._bufferToBase64(step.data);
        }
      } else if (step.type === 'text') {
        // 保存 title 和 content 字段
        preparedStep.title = step.title || '';
        preparedStep.content = step.content || step.data || ''; // 兼容旧版本
      }

      return preparedStep;
    });

    return {
      version: '1.0',
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      steps: preparedSteps
    };
  }

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

  _generateStep(step, index) {
    const type = step.type;
    const description = this._escapeHtml(step.description || '');

    let stepContent = `
    <section class="step">
      <div class="step-header">
        <div class="step-number">${index}</div>
        <h2 class="step-title">${description || `步骤 ${index}`}</h2>
      </div>`;

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

  _generateScreenshot(step) {
    let base64 = '';
    
    // 支持多种数据格式
    if (step.data) {
      if (typeof step.data === 'string') {
        base64 = step.data; // 直接是 base64 字符串
      } else if (step.data._base64) {
        base64 = step.data._base64; // 对象包装的 base64
      } else if (step.data instanceof ArrayBuffer || step.data instanceof Uint8Array) {
        base64 = this._bufferToBase64(step.data); // ArrayBuffer
      }
    }
    
    return `
      <div class="media-container">
        <img src="data:image/png;base64,${base64}" 
             alt="${this._escapeHtml(step.description || '截图')}" 
             class="screenshot" 
             onclick="this.classList.toggle('fullscreen-doc')"
             title="点击查看原图" />
        <div class="media-hint">💡 点击图片查看原图</div>
      </div>`;
  }

  _generateVideo(step) {
    let base64 = '';
    
    // 支持多种数据格式
    if (step.data) {
      if (typeof step.data === 'string') {
        base64 = step.data;
      } else if (step.data._base64) {
        base64 = step.data._base64;
      } else if (step.data instanceof ArrayBuffer || step.data instanceof Uint8Array) {
        base64 = this._bufferToBase64(step.data);
      }
    }
    
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

  _generateText(step) {
    // 新版本：使用 title 和 content 字段
    // title 是可选的，content 是必填的
    const content = step.content || step.data || ''; // 兼容旧数据
    
    if (!content) {
      return '';
    }
    
    // 内容区域始终显示完整内容
    const escapedText = this._escapeHtml(content);
    const formattedText = escapedText.replace(/\n/g, '<br>');
    
    return `
      <div class="text-content">
        <div class="text-body">${formattedText}</div>
      </div>`;
  }

  _generateFooter(project) {
    return `
    <footer class="doc-footer">
      <p>由 <strong>ActionHunter</strong> 自动生成</p>
      <p class="footer-note">本文档为单文件HTML，包含所有图片和视频，便于分享和归档</p>
    </footer>`;
  }

  _generateStyles() {
    return `<style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    
    .doc-header {
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      padding: 40px;
    }
    
    .doc-header h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #222;
      letter-spacing: 0.5px;
    }
    
    .metadata {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      margin-top: 16px;
      font-size: 13px;
      color: #666;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
    }
    
    .meta-label {
      font-weight: 500;
      margin-right: 4px;
      color: #888;
    }
    
    .meta-value {
      color: #333;
    }
    
    .doc-content {
      padding: 48px 40px;
    }
    
    .step {
      margin-bottom: 48px;
      padding-bottom: 48px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .step:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .step-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .step-number {
      width: 32px;
      height: 32px;
      background: #f5f5f5;
      color: #666;
      border: 2px solid #e0e0e0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 600;
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .step-title {
      font-size: 18px;
      font-weight: 500;
      color: #222;
      letter-spacing: 0.3px;
    }
    
    .media-container {
      margin: 16px 0;
      border: 1px solid #e0e0e0;
      background: #fafafa;
    }
    
    .screenshot,
    .recording {
      max-width: 100%;
      height: auto;
      display: block;
      background: white;
      cursor: pointer;
    }
    
    .screenshot.fullscreen-doc {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) !important;
      max-width: 95vw;
      max-height: 95vh;
      z-index: 10000;
      box-shadow: 0 8px 48px rgba(0,0,0,0.5);
      cursor: zoom-out;
    }
    
    .video-hint,
    .media-hint {
      background: #f5f5f5;
      padding: 8px 16px;
      text-align: center;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #e0e0e0;
    }
    
    .text-content {
      padding: 16px;
      background: #fafafa;
      border-left: 3px solid #666;
      color: #444;
      line-height: 1.7;
    }
    
    .text-body {
      color: #444;
      line-height: 1.7;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #aaa;
      font-size: 14px;
    }
    
    .doc-footer {
      background: #fafafa;
      padding: 24px 40px;
      text-align: center;
      color: #888;
      font-size: 12px;
      border-top: 1px solid #e0e0e0;
    }
    
    .doc-footer strong {
      color: #333;
    }
    
    .footer-note {
      margin-top: 8px;
      font-size: 11px;
      color: #aaa;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
      }
    }
    
    @media (max-width: 768px) {
      body {
        padding: 20px 10px;
      }
      
      .doc-header {
        padding: 24px 20px;
      }
      
      .doc-header h1 {
        font-size: 24px;
      }
      
      .metadata {
        flex-direction: column;
        gap: 8px;
      }
      
      .doc-content {
        padding: 32px 20px;
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

  _generateScripts() {
    return `<script>
    document.addEventListener('DOMContentLoaded', function() {
      console.log('✅ ActionHunter 文档加载完成');
      
      const steps = document.querySelectorAll('.step').length;
      const videos = document.querySelectorAll('video').length;
      const images = document.querySelectorAll('.screenshot').length;
      
      console.log('📊 文档统计:', {
        总步骤数: steps,
        视频数: videos,
        截图数: images
      });
      
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach((video, index) => {
        video.addEventListener('loadeddata', function() {
          console.log(\`视频 \${index + 1} 加载完成\`);
        });
      });
    });
    </script>`;
  }

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

  _bufferToBase64(buffer) {
    if (buffer instanceof ArrayBuffer) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
    // 如果是Node.js Buffer对象，转换为ArrayBuffer
    if (buffer.buffer) {
      return this._bufferToBase64(buffer.buffer);
    }
    return '';
  }
}

// 初始化管理器
const projectManager = new ProjectManager();
const docGenerator = new DocumentGenerator();

// 全局状态
let currentSourceId = null;
let currentSource = null; // 保存完整的source对象
let currentAction = null; // 'screenshot' | 'video'
let recordingSessionId = null;

// 缓存区项目列表（会话期间有效，包含新建和导入的所有项目）
let cacheProjects = [];
let currentCacheIndex = null; // 当前正在编辑的缓存项目索引

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', async () => {
  console.log('✅ ActionHunter 渲染进程已加载');
  
  // 检查开发模式
  const platformInfo = await window.electronAPI.getPlatformInfo();
  // 初始化检查权限
  await checkInitialPermissions();
  
  // 更新缓存区项目列表
  updateCacheProjectsList();
  
  // 绑定事件监听器
  bindEventListeners();
  
  // 注册全局快捷键监听器
  registerGlobalShortcutListeners();
});

// ========== 全局快捷键监听 ==========

/**
 * 注册全局快捷键监听器
 */
function registerGlobalShortcutListeners() {
  // 监听截图快捷键
  window.electronAPI.onShortcutScreenshot(() => {
    console.log('🔥 全局快捷键：截图');
    handleGlobalShortcut('screenshot');
  });
  
  // 监听录制视频快捷键
  window.electronAPI.onShortcutVideo(() => {
    console.log('🔥 全局快捷键：录制视频');
    handleGlobalShortcut('video');
  });
  
  // 监听添加文字快捷键
  window.electronAPI.onShortcutText(() => {
    console.log('🔥 全局快捷键：添加文字');
    handleGlobalShortcut('text');
  });
  
  console.log('✅ 全局快捷键监听器已注册');
  console.log('💡 快捷键：');
  console.log('  - Cmd/Ctrl + Shift + 1: 截图');
  console.log('  - Cmd/Ctrl + Shift + 2: 录制视频');
  console.log('  - Cmd/Ctrl + Shift + 3: 添加文字');
  console.log('  - Cmd/Ctrl + Shift + H: 显示/隐藏主窗口');
}

/**
 * 处理全局快捷键触发
 */
function handleGlobalShortcut(action) {
  // 检查是否有活跃项目
  if (!projectManager.hasActiveProject()) {
    alert('请先创建或打开一个项目后再使用快捷键');
    // 显示主窗口
    window.electronAPI.showMainWindow();
    return;
  }
  
  // 确保主窗口已创建并显示
  window.electronAPI.showMainWindow();
  
  // 根据操作类型执行相应功能
  if (action === 'screenshot' || action === 'video') {
    // 延迟执行，确保窗口已显示
    setTimeout(() => {
      startAddStep(action);
    }, 100);
  } else if (action === 'text') {
    // 延迟执行，确保窗口已显示
    setTimeout(() => {
      addTextStep();
    }, 100);
  }
}

// ========== 权限检查 ==========
async function checkInitialPermissions() {
  try {
    const hasPermission = await window.electronAPI.checkPermissions();
    if (!hasPermission) {
      updateStatus('需要权限', 'warning');
      const granted = await window.electronAPI.requestPermissions();
      if (granted) {
        updateStatus('就绪', 'ready');
      } else {
        updateStatus('权限被拒绝', 'error');
        alert('需要屏幕录制权限才能使用本工具。\n\n请到系统设置中授予权限后重启应用。');
      }
    } else {
      updateStatus('就绪', 'ready');
    }
  } catch (error) {
    console.error('权限检查失败:', error);
    updateStatus('权限检查失败', 'error');
  }
}

// ========== 事件监听器 ==========
function bindEventListeners() {
  // 项目管理
  document.getElementById('createProjectBtn').addEventListener('click', createProject);
  document.getElementById('importProjectBtn').addEventListener('click', importProject);
  document.getElementById('backToHomeBtn').addEventListener('click', backToHome);
  document.getElementById('exportDocBtn').addEventListener('click', exportDocument);
  
  // 添加步骤
  document.getElementById('addScreenshotBtn').addEventListener('click', () => startAddStep('screenshot'));
  document.getElementById('addVideoBtn').addEventListener('click', () => startAddStep('video'));
  document.getElementById('addTextBtn').addEventListener('click', addTextStep);
  
  // 文件导入
  document.getElementById('importImageBtn').addEventListener('click', importImage);
  document.getElementById('importVideoBtn').addEventListener('click', importVideo);
  
  // 模态框关闭
  document.getElementById('sourceModalClose').addEventListener('click', () => closeModal('sourceModal'));
  document.getElementById('descriptionModalClose').addEventListener('click', () => closeModal('descriptionModal'));
  document.getElementById('previewModalClose').addEventListener('click', () => closeModal('previewModal'));
  document.getElementById('textModalClose').addEventListener('click', () => closeModal('textModal'));
  
  // 说明确认/取消
  document.getElementById('descriptionConfirm').addEventListener('click', confirmDescription);
  document.getElementById('descriptionCancel').addEventListener('click', () => closeModal('descriptionModal'));
  
  // 文字说明确认/取消
  document.getElementById('textConfirm').addEventListener('click', confirmTextStep);
  document.getElementById('textCancel').addEventListener('click', () => closeModal('textModal'));
  
  // Enter键提交项目名称
  document.getElementById('projectNameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      createProject();
    }
  });
}

// ========== 已导入项目管理（内存） ==========

/**
 * 加载历史项目列表
 */
/**
 * 更新缓存区项目列表
 */
function updateCacheProjectsList() {
  const listEl = document.getElementById('cacheProjectsList');
  
  if (!cacheProjects || cacheProjects.length === 0) {
    listEl.innerHTML = '<div class="empty-state">暂无项目，请新建或导入项目</div>';
    return;
  }
  
  listEl.innerHTML = cacheProjects.map((project, index) => {
    const date = new Date(project.createdAt).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const stepCount = project.steps ? project.steps.length : 0;
    const isActive = index === currentCacheIndex;
    
    return `
      <div class="cache-project-item ${isActive ? 'active' : ''}" onclick="openCacheProject(${index})">
        <div class="cache-project-info">
          <div class="cache-project-name">${project.name} ${isActive ? '(编辑中)' : ''}</div>
          <div class="cache-project-meta">
            <span>🕒 ${date}</span>
            <span>📝 ${stepCount} 步骤</span>
          </div>
        </div>
        <div class="cache-project-actions" onclick="event.stopPropagation()">
          <button class="cache-action-btn export" onclick="exportCacheProject(${index})">
            导出
          </button>
          <button class="cache-action-btn remove" onclick="removeCacheProject(${index})">
            移除
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  console.log(`✅ 已显示 ${cacheProjects.length} 个缓存项目`);
}

/**
 * 打开缓存区项目进行编辑
 */
function openCacheProject(index) {
  const project = cacheProjects[index];
  
  if (!project) {
    alert('项目不存在');
    return;
  }
  
  // 如果当前有正在编辑的项目，保存其状态
  if (currentCacheIndex !== null && projectManager.hasActiveProject()) {
    const currentProject = projectManager.exportProject();
    cacheProjects[currentCacheIndex] = currentProject;
  }
  
  // 设置当前编辑索引
  currentCacheIndex = index;
  
  // 加载项目数据
  projectManager.currentProject = {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    steps: [...project.steps] // 复制步骤数组
  };
  projectManager.isRecording = true;
  
  // 更新UI
  document.getElementById('cacheSection').classList.add('hidden');
  document.getElementById('recordingSection').classList.remove('hidden');
  document.getElementById('currentProjectName').textContent = project.name;
  
  updateStepCount();
  updateStepsList();
  updateStatus('编辑中', 'recording');
  
  console.log('✅ 已打开缓存项目:', project.name);
}

/**
 * 导出缓存区项目
 */
async function exportCacheProject(index) {
  try {
    const project = cacheProjects[index];
    
    if (!project) {
      alert('项目不存在');
      return;
    }
    
    // 生成文档
    const html = docGenerator.generate(project);
    
    // 获取当前时间戳用于文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const defaultName = `${project.name}_${timestamp}.html`;
    
    // 保存文件
    const result = await window.electronAPI.showSaveDialog({
      title: '导出文档',
      defaultPath: defaultName,
      filters: [
        { name: 'HTML文件', extensions: ['html'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      await window.electronAPI.saveFile({
        filePath: result.filePath,
        content: html
      });
      
      if (confirm('文档导出成功！\n是否在浏览器中打开查看？')) {
        await window.electronAPI.openInBrowser(result.filePath);
      }
      
      console.log('✅ 缓存项目文档已导出:', result.filePath);
    }
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败: ' + error.message);
  }
}

/**
 * 从缓存区移除项目
 */
function removeCacheProject(index) {
  if (!confirm('确认从缓存区移除这个项目吗？\n（未导出的内容将丢失）')) {
    return;
  }
  
  const projectName = cacheProjects[index].name;
  
  // 如果移除的是当前编辑的项目，需要返回首页
  if (index === currentCacheIndex) {
    backToHome();
    currentCacheIndex = null;
  } else if (currentCacheIndex !== null && index < currentCacheIndex) {
    // 如果移除的是当前项目之前的项目，索引需要调整
    currentCacheIndex--;
  }
  
  cacheProjects.splice(index, 1);
  updateCacheProjectsList();
  
  console.log('✅ 已移除项目:', projectName);
}

// 将缓存区项目相关函数暴露到全局，供HTML onclick使用
window.openCacheProject = openCacheProject;
window.exportCacheProject = exportCacheProject;
window.removeCacheProject = removeCacheProject;

// ========== 项目管理 ==========

/**
 * 返回缓存区（首页）
 */
function backToHome() {
  // 保存当前项目状态到缓存区
  if (currentCacheIndex !== null && projectManager.hasActiveProject()) {
    const currentProject = projectManager.exportProject();
    cacheProjects[currentCacheIndex] = currentProject;
    console.log('✅ 当前项目已自动保存到缓存区');
  }
  
  // 重置UI状态
  projectManager.reset();
  resetProjectUI();
  currentCacheIndex = null;
  
  // 切换UI
  document.getElementById('recordingSection').classList.add('hidden');
  document.getElementById('cacheSection').classList.remove('hidden');
  
  // 更新缓存区列表
  updateCacheProjectsList();
  
  console.log('✅ 已返回缓存区');
}

/**
 * 创建新项目（加入缓存区）
 */
function createProject() {
  const nameInput = document.getElementById('projectNameInput');
  const name = nameInput.value.trim();
  
  if (!name) {
    alert('请输入项目名称');
    nameInput.focus();
    return;
  }
  
  try {
    // 创建项目对象
    const newProject = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      createdAt: new Date(),
      steps: []
    };
    
    // 添加到缓存区
    cacheProjects.push(newProject);
    currentCacheIndex = cacheProjects.length - 1;
    
    // 打开项目编辑
    projectManager.createProject(name);
    
    // 更新UI
    document.getElementById('cacheSection').classList.add('hidden');
    document.getElementById('recordingSection').classList.remove('hidden');
    document.getElementById('currentProjectName').textContent = name;
    document.getElementById('projectNameInput').value = '';
    updateStepCount();
    updateStepsList();
    updateStatus('编辑中', 'recording');
    
    console.log('✅ 项目已创建并加入缓存区:', name);
  } catch (error) {
    alert('创建项目失败: ' + error.message);
  }
}

/**
 * 重置项目UI状态
 */
function resetProjectUI() {
  // 清空步骤列表
  const stepsList = document.getElementById('stepsList');
  if (stepsList) {
    stepsList.innerHTML = '<div class="empty-state">暂无步骤，点击上方按钮开始录制</div>';
  }
  
  // 重置状态显示
  updateStatus('就绪', 'ready');
  
  // 清空输入框
  document.getElementById('projectNameInput').value = '';
}

/**
 * 完成项目
 */
/**
 * 导出当前项目文档（不结束项目）
 */
async function exportDocument() {
  if (!projectManager.hasActiveProject()) {
    alert('当前没有打开的项目');
    return;
  }
  
  const stepCount = projectManager.getStepCount();
  if (stepCount === 0) {
    if (!confirm('当前项目没有任何步骤，确定要导出吗？')) {
      return;
    }
  }
  
  try {
    // 保存当前项目状态到缓存区
    if (currentCacheIndex !== null) {
      const currentProject = projectManager.exportProject();
      cacheProjects[currentCacheIndex] = currentProject;
    }
    
    const project = projectManager.exportProject();
    const html = docGenerator.generate(project);
    
    // 生成带时间戳的文件名（确保不覆盖原文件）
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const defaultFileName = `${project.name}_${timestamp}.html`;
    
    // 显示保存对话框
    const result = await window.electronAPI.showSaveDialog({
      title: '导出文档',
      defaultPath: defaultFileName,
      filters: [
        { name: 'HTML文件', extensions: ['html'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      await window.electronAPI.saveFile({
        filePath: result.filePath,
        content: html
      });
      
      const openNow = confirm('文档已导出成功！\n\n是否立即在浏览器中打开查看？');
      if (openNow) {
        await window.electronAPI.openInBrowser(result.filePath);
      }
      
      console.log('✅ 文档已导出:', result.filePath);
      
      // 更新缓存区列表（导出不结束项目）
      updateCacheProjectsList();
    }
  } catch (error) {
    alert('导出文档失败: ' + error.message);
    console.error('导出失败:', error);
  }
}

// ========== 添加步骤 ==========

/**
 * 开始添加步骤（截图/录屏）
 */
async function startAddStep(type) {
  currentAction = type;
  
  // 显示源选择模态框
  showModal('sourceModal');
  
  // 加载源列表
  try {
    const sources = await window.electronAPI.getSources();
    renderSourceGrid(sources);
  } catch (error) {
    alert('获取屏幕源失败: ' + error.message);
    closeModal('sourceModal');
  }
}

/**
 * 渲染源选择网格
 */
function renderSourceGrid(sources) {
  const grid = document.getElementById('sourceGrid');
  grid.innerHTML = '';
  
  sources.forEach(source => {
    const item = document.createElement('div');
    item.className = 'source-item';
    item.innerHTML = `
      <img src="${source.thumbnail}" class="source-thumbnail" />
      <div class="source-info">
        <div class="source-type">${source.type === 'screen' ? '🖥️' : '🪟'}</div>
        <div class="source-name">${source.name}</div>
      </div>
    `;
    item.addEventListener('click', () => selectSource(source));
    grid.appendChild(item);
  });
}

/**
 * 选择源
 */
function selectSource(source) {
  currentSourceId = source.id;
  currentSource = source; // 保存完整源对象
  closeModal('sourceModal');
  
  // 显示说明输入模态框
  showModal('descriptionModal');
  document.getElementById('descriptionInput').value = '';
  document.getElementById('descriptionInput').focus();
}

/**
 * 确认说明（用于截图和视频）
 */
async function confirmDescription() {
  const description = document.getElementById('descriptionInput').value.trim();
  
  if (!description) {
    alert('请输入说明');
    return;
  }
  
  closeModal('descriptionModal');
  
  // 根据类型执行操作（只处理截图和视频，不处理文本）
  if (currentAction === 'screenshot') {
    await captureScreenshot(description);
  } else if (currentAction === 'video') {
    await recordVideo(description);
  }
}

/**
 * 重新绑定说明确认按钮
 */
function rebindDescriptionConfirm() {
  const confirmBtn = document.getElementById('descriptionConfirm');
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  newConfirmBtn.addEventListener('click', confirmDescription);
}

/**
 * 截图
 */
async function captureScreenshot(description) {
  try {
    const imageBuffer = await window.electronAPI.takeScreenshot({
      sourceId: currentSourceId
    });
    
    // 添加到项目（直接使用 ArrayBuffer）
    projectManager.addStep({
      type: 'screenshot',
      description,
      data: imageBuffer // 直接使用 ArrayBuffer，不用 Buffer
    });
    console.log('✅ 截图已添加');
    
    updateStepsList();
    updateStepCount();
  } catch (error) {
    alert('截图失败: ' + error.message);
  }
}

/**
 * 录制视频
 */
async function recordVideo(description) {
  try {
    // 显示倒计时
    await showCountdown();
    
    // 开始录制
    const progressInterval = showRecordingProgress();
    const videoBuffer = await recordVideoInRenderer(currentSourceId, 30);
    clearInterval(progressInterval);
    closeModal('recordingModal');
    
    // 添加到项目（直接使用 ArrayBuffer）
    projectManager.addStep({
      type: 'video',
      description,
      data: videoBuffer // 直接使用 ArrayBuffer
    });
    console.log('✅ 视频已添加');
    
    updateStepsList();
    updateStepCount();
  } catch (error) {
    closeModal('recordingModal');
    alert('录制失败: ' + error.message);
  }
}

/**
 * 在渲染进程中录制视频
 */
let currentMediaRecorder = null;
let recordingStream = null;
let recordingTimeout = null;

async function recordVideoInRenderer(sourceId, duration) {
  return new Promise(async (resolve, reject) => {
    try {
      // 获取媒体流
      recordingStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId
          }
        }
      });
      
      // 不再使用边框，录制提示已在录制进度窗口中显示
      
      // 创建录制器
      const options = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 2500000 };
      currentMediaRecorder = new MediaRecorder(recordingStream, options);
      
      const chunks = [];
      currentMediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      currentMediaRecorder.onstop = () => {
        recordingStream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunks, { type: 'video/webm' });
        blob.arrayBuffer().then(resolve).catch(reject);
        
        // 清理
        currentMediaRecorder = null;
        recordingStream = null;
        recordingTimeout = null;
      };
      
      currentMediaRecorder.start();
      
      // 定时停止（可被提前停止打断）
      recordingTimeout = setTimeout(() => {
        if (currentMediaRecorder && currentMediaRecorder.state === 'recording') {
          currentMediaRecorder.stop();
        }
      }, duration * 1000);
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 停止录制
 */
function stopRecordingEarly() {
  if (currentMediaRecorder && currentMediaRecorder.state === 'recording') {
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
    }
    currentMediaRecorder.stop();
  }
}

/**
 * 添加文本步骤
 */
function addTextStep() {
  if (!projectManager.hasActiveProject()) {
    alert('请先创建项目');
    return;
  }
  
  showModal('textModal');
  
  // 清空输入框
  document.getElementById('textTitleInput').value = '';
  document.getElementById('textContentInput').value = '';
  document.getElementById('textContentInput').focus();
}

/**
 * 确认文本步骤
 */
function confirmTextStep() {
  const title = document.getElementById('textTitleInput').value.trim();
  const content = document.getElementById('textContentInput').value.trim();
  
  if (!content) {
    alert('请输入内容');
    document.getElementById('textContentInput').focus();
    return;
  }
  
  // 添加文本步骤
  // description 用于步骤列表显示：优先使用标题，否则用内容前50字符
  const description = title || (content.substring(0, 50) + (content.length > 50 ? '...' : ''));
  
  projectManager.addStep({
    type: 'text',
    description: description,
    title: title, // 标题（可选）
    content: content // 内容（必填）
  });
  
  console.log('✅ 文本已添加');
  
  updateStepsList();
  updateStepCount();
  closeModal('textModal');
}

/**
 * 导入图片
 */
async function importImage() {
  if (!projectManager.hasActiveProject()) {
    alert('请先创建项目');
    return;
  }
  
  try {
    // 打开文件选择对话框
    const result = await window.electronAPI.openImageFile();
    
    if (!result) {
      return; // 用户取消
    }
    
    // 显示说明输入模态框
    currentAction = 'import-image';
    showModal('descriptionModal');
    const input = document.getElementById('descriptionInput');
    input.value = '';
    input.placeholder = '请输入图片说明...';
    input.focus();
    
    // 保存文件数据
    window.tempImportData = result.data;
    
    // 重新绑定确认按钮
    const confirmBtn = document.getElementById('descriptionConfirm');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', () => {
      const description = input.value.trim();
      
      if (!description) {
        alert('请输入说明');
        return;
      }
      
      // 添加到项目
      projectManager.addStep({
        type: 'screenshot',
        description,
        data: window.tempImportData
      });
      
      updateStepsList();
      updateStepCount();
      closeModal('descriptionModal');
      
      // 恢复placeholder
      input.placeholder = '请输入这个步骤的说明...';
      
      // 清理临时数据
      delete window.tempImportData;
      
      // 重新绑定标准的确认按钮事件
      rebindDescriptionConfirm();
      
      console.log('✅ 图片已导入');
    });
  } catch (error) {
    console.error('导入图片失败:', error);
    alert('导入图片失败: ' + error.message);
  }
}

/**
 * 导入视频
 */
async function importVideo() {
  if (!projectManager.hasActiveProject()) {
    alert('请先创建项目');
    return;
  }
  
  try {
    // 打开文件选择对话框
    const result = await window.electronAPI.openVideoFile();
    
    if (!result) {
      return; // 用户取消
    }
    
    // 显示说明输入模态框
    currentAction = 'import-video';
    showModal('descriptionModal');
    const input = document.getElementById('descriptionInput');
    input.value = '';
    input.placeholder = '请输入视频说明...';
    input.focus();
    
    // 保存文件数据
    window.tempImportData = result.data;
    
    // 重新绑定确认按钮
    const confirmBtn = document.getElementById('descriptionConfirm');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', () => {
      const description = input.value.trim();
      
      if (!description) {
        alert('请输入说明');
        return;
      }
      
      // 添加到项目
      projectManager.addStep({
        type: 'video',
        description,
        data: window.tempImportData
      });
      
      updateStepsList();
      updateStepCount();
      closeModal('descriptionModal');
      
      // 恢复placeholder
      input.placeholder = '请输入这个步骤的说明...';
      
      // 清理临时数据
      delete window.tempImportData;
      
      // 重新绑定标准的确认按钮事件
      rebindDescriptionConfirm();
      
      console.log('✅ 视频已导入');
    });
  } catch (error) {
    console.error('导入视频失败:', error);
    alert('导入视频失败: ' + error.message);
  }
}

/**
 * 导入项目文件（HTML格式）
 */
async function importProject() {
  try {
    // 打开HTML文件
    const htmlContent = await window.electronAPI.openProjectFile();
    
    if (!htmlContent) {
      return; // 用户取消
    }
    
    // 解析HTML中嵌入的项目数据
    const projectData = parseProjectFromHTML(htmlContent);
    
    if (!projectData) {
      alert('无法识别的项目文件格式，请确保这是由 ActionHunter 导出的文档');
      return;
    }
    
    // 转换数据格式
    const steps = projectData.steps.map(step => {
      const convertedStep = {
        id: step.id,
        type: step.type,
        description: step.description,
        timestamp: step.timestamp
      };
      
      // 对于图片/视频，将base64字符串转回内部格式
      if (step.type === 'screenshot' || step.type === 'video') {
        convertedStep.data = { _base64: step.dataBase64 };
      } else if (step.type === 'text') {
        // 恢复 title 和 content 字段
        convertedStep.title = step.title || '';
        convertedStep.content = step.content || step.data || ''; // 兼容旧版本
      }
      
      return convertedStep;
    });
    
    // 添加到缓存区
    const cacheProject = {
      id: projectData.id,
      name: projectData.name,
      createdAt: projectData.createdAt,
      steps: steps
    };
    cacheProjects.push(cacheProject);
    currentCacheIndex = cacheProjects.length - 1;
    
    // 直接加载为当前项目
    resetProjectUI();
    projectManager.createProject(projectData.name);
    steps.forEach(step => {
      projectManager.addStep(step);
    });
    
    // 更新UI
    document.getElementById('cacheSection').classList.add('hidden');
    document.getElementById('recordingSection').classList.remove('hidden');
    document.getElementById('currentProjectName').textContent = projectData.name;
    
    updateStepCount();
    updateStepsList();
    updateStatus('编辑中', 'recording');
    
    console.log('✅ 项目已导入到缓存区:', projectData.name, '步骤数:', steps.length);
    
  } catch (error) {
    console.error('导入项目失败:', error);
    alert('导入项目失败: ' + error.message);
  }
}

/**
 * 从HTML内容中解析项目数据
 */
function parseProjectFromHTML(htmlContent) {
  try {
    // 查找嵌入的JSON数据
    const match = htmlContent.match(/<script type="application\/json" id="action-hunter-project-data">\s*([\s\S]*?)\s*<\/script>/);
    
    if (!match || !match[1]) {
      return null;
    }
    
    const projectData = JSON.parse(match[1]);
    
    // 验证数据格式
    if (!projectData.name || !projectData.steps || !Array.isArray(projectData.steps)) {
      return null;
    }
    
    return projectData;
    
  } catch (error) {
    console.error('解析项目数据失败:', error);
    return null;
  }
}

// ========== UI辅助函数 ==========

/**
 * 更新状态指示器
 */
function updateStatus(text, type) {
  const indicator = document.getElementById('statusIndicator');
  const dot = indicator.querySelector('.status-dot');
  const textEl = indicator.querySelector('.status-text');
  
  textEl.textContent = text;
  dot.className = 'status-dot';
  
  if (type === 'recording') {
    dot.classList.add('recording');
  }
}

/**
 * 更新步骤计数
 */
function updateStepCount() {
  const count = projectManager.getStepCount();
  document.getElementById('stepCount').textContent = `${count} 个步骤`;
}

/**
 * 更新步骤列表
 */
function updateStepsList() {
  const listEl = document.getElementById('stepsList');
  const steps = projectManager.getSteps();
  
  if (steps.length === 0) {
    listEl.innerHTML = '<div class="empty-state">暂无步骤，点击上方按钮开始录制</div>';
    return;
  }
  
  listEl.innerHTML = steps.map(step => {
    const typeIcons = {
      screenshot: '📸',
      video: '🎬',
      text: '📝'
    };
    
    const typeNames = {
      screenshot: '截图',
      video: '视频',
      text: '文本'
    };
    
    // 生成缩略图（仅对图片/视频）
    let thumbnail = '';
    if (step.type === 'screenshot' || step.type === 'video') {
      let base64 = '';
      if (typeof step.data === 'string') {
        base64 = step.data;
      } else if (step.data && step.data._base64) {
        base64 = step.data._base64;
      } else if (step.data instanceof ArrayBuffer || step.data instanceof Uint8Array) {
        base64 = arrayBufferToBase64(step.data);
      }
      
      if (base64) {
        const mimeType = step.type === 'screenshot' ? 'image/png' : 'video/webm';
        if (step.type === 'screenshot') {
          thumbnail = `<img src="data:${mimeType};base64,${base64}" class="step-thumbnail" alt="缩略图" />`;
        } else {
          thumbnail = `<div class="step-thumbnail video-thumbnail">🎬</div>`;
        }
      }
    }
    
    return `
      <div class="step-item" draggable="true" data-step-id="${step.id}">
        <div class="drag-handle">⋮⋮</div>
        ${thumbnail}
        <div class="step-number">${step.index}</div>
        <div class="step-info">
          <div class="step-type">${typeIcons[step.type]} ${typeNames[step.type]}</div>
          <div class="step-desc">${step.description}</div>
        </div>
        <div class="step-actions">
          <button class="step-action-btn view" onclick="viewStep('${step.id}')">查看</button>
          <button class="step-action-btn delete" onclick="deleteStep('${step.id}')">删除</button>
        </div>
      </div>
    `;
  }).join('');
  
  // 添加拖拽事件监听
  initializeDragAndDrop();
}

/**
 * 初始化拖拽功能
 */
let draggedElement = null;

function initializeDragAndDrop() {
  const stepItems = document.querySelectorAll('.step-item');
  
  stepItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedElement = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
    
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const afterElement = getDragAfterElement(e.clientY);
      const listEl = document.getElementById('stepsList');
      
      if (afterElement == null) {
        listEl.appendChild(draggedElement);
      } else {
        listEl.insertBefore(draggedElement, afterElement);
      }
    });
    
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      reorderSteps();
    });
  });
}

function getDragAfterElement(y) {
  const stepItems = [...document.querySelectorAll('.step-item:not(.dragging)')];
  
  return stepItems.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function reorderSteps() {
  const stepItems = document.querySelectorAll('.step-item');
  const newOrder = Array.from(stepItems).map(item => item.getAttribute('data-step-id'));
  
  // 更新 projectManager 中的顺序
  const steps = projectManager.getSteps();
  const reorderedSteps = newOrder.map(id => steps.find(s => s.id === id));
  
  projectManager.currentProject.steps = reorderedSteps;
  reorderedSteps.forEach((step, idx) => {
    step.index = idx + 1;
  });
  
  updateStepsList();
}

/**
 * 查看步骤
 */
function viewStep(stepId) {
  const steps = projectManager.getSteps();
  const step = steps.find(s => s.id === stepId);
  
  if (!step) return;
  
  let content = '';
  
  if (step.type === 'screenshot') {
    const base64 = typeof step.data === 'string' ? step.data : 
                   (step.data._base64 || arrayBufferToBase64(step.data));
    content = `
      <div class="preview-image-container">
        <img src="data:image/png;base64,${base64}" 
             class="preview-image" 
             onclick="toggleImageFullscreen(this)"
             title="点击查看原图" />
        <div class="preview-hint">💡 点击图片查看原图</div>
      </div>`;
  } else if (step.type === 'video') {
    const base64 = typeof step.data === 'string' ? step.data : 
                   (step.data._base64 || arrayBufferToBase64(step.data));
    content = `
      <div class="preview-video-container">
        <video controls class="preview-video">
          <source src="data:video/webm;base64,${base64}" type="video/webm">
        </video>
      </div>`;
  } else if (step.type === 'text') {
    const textContent = step.content || step.data || '';
    const formattedText = textContent.replace(/\n/g, '<br>');
    content = `
      <div class="preview-text-container">
        <div class="preview-text">${formattedText}</div>
      </div>`;
  }
  
  const modal = document.getElementById('previewModal');
  const container = document.getElementById('previewContainer');
  container.innerHTML = `
    <h3 class="preview-title">${step.description}</h3>
    ${content}
  `;
  showModal('previewModal');
}

/**
 * 切换图片全屏
 */
function toggleImageFullscreen(img) {
  if (img.classList.contains('fullscreen')) {
    img.classList.remove('fullscreen');
    document.body.style.overflow = '';
  } else {
    img.classList.add('fullscreen');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * 删除步骤
 */
function deleteStep(stepId) {
  if (confirm('确认删除这个步骤吗？')) {
    projectManager.deleteStep(stepId);
    updateStepsList();
    updateStepCount();
  }
}

// 将步骤管理相关函数暴露到全局，供HTML onclick使用
window.viewStep = viewStep;
window.deleteStep = deleteStep;
window.toggleImageFullscreen = toggleImageFullscreen;

/**
 * 显示模态框
 */
function showModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

/**
 * 关闭模态框
 */
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

/**
 * 显示倒计时
 */
function showCountdown() {
  return new Promise((resolve) => {
    showModal('countdownModal');
    let count = 3;
    const numberEl = document.getElementById('countdownNumber');
    const skipBtn = document.getElementById('skipCountdownBtn');
    
    // 重置初始状态
    numberEl.textContent = '3';
    
    let interval = null;
    let isSkipped = false;
    
    const cleanup = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      closeModal('countdownModal');
      document.removeEventListener('keydown', keyHandler);
      skipBtn.removeEventListener('click', skipHandler);
    };
    
    const skipHandler = () => {
      if (!isSkipped) {
        isSkipped = true;
        cleanup();
        resolve();
      }
    };
    
    const keyHandler = (e) => {
      if (e.key === 'Enter' && !isSkipped) {
        skipHandler();
      }
    };
    
    // 添加跳过事件监听
    skipBtn.addEventListener('click', skipHandler);
    document.addEventListener('keydown', keyHandler);
    
    interval = setInterval(() => {
      count--;
      if (count > 0) {
        numberEl.textContent = count;
      } else {
        if (!isSkipped) {
          cleanup();
          resolve();
        }
      }
    }, 1000);
  });
}

/**
 * 显示录制进度
 */
function showRecordingProgress() {
  showModal('recordingModal');
  const timerEl = document.getElementById('recordingTimer');
  const progressBar = document.getElementById('progressBar');
  const stopBtn = document.getElementById('stopRecordingBtn');
  
  // 重置初始状态
  timerEl.textContent = '00:00';
  progressBar.style.width = '0%';
  
  let elapsed = 0;
  const duration = 30; // 改为30秒
  
  // 添加停止按钮事件
  const stopHandler = () => {
    stopRecordingEarly();
  };
  stopBtn.addEventListener('click', stopHandler);
  
  const interval = setInterval(() => {
    elapsed += 0.1;
    const seconds = Math.floor(elapsed);
    const ms = Math.floor((elapsed - seconds) * 10);
    timerEl.textContent = `00:${seconds.toString().padStart(2, '0')}`;
    progressBar.style.width = `${(elapsed / duration) * 100}%`;
    
    if (elapsed >= duration) {
      clearInterval(interval);
      stopBtn.removeEventListener('click', stopHandler);
    }
  }, 100);
  
  // 返回interval以便外部可以清理
  return interval;
}

/**
 * 显示预览
 */
function showPreview(html) {
  const container = document.getElementById('previewContainer');
  container.innerHTML = html;
  showModal('previewModal');
}

/**
 * ArrayBuffer转Base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 导出到全局（供HTML内联事件使用）
window.deleteStep = deleteStep;

console.log('✅ Renderer 脚本加载完成');
