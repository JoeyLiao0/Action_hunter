/**
 * 项目管理器
 * 管理项目生命周期和步骤
 */

class ProjectManager {
  constructor() {
    this.currentProject = null;
    this.isRecording = false;
  }

  /**
   * 创建新项目
   * @param {string} name - 项目名称
   * @returns {Object} 项目对象
   */
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

  /**
   * 获取当前项目
   * @returns {Object|null}
   */
  getCurrentProject() {
    return this.currentProject;
  }

  /**
   * 检查是否有活动项目
   * @returns {boolean}
   */
  hasActiveProject() {
    return this.currentProject !== null && this.isRecording;
  }

  /**
   * 添加步骤
   * @param {Object} step - 步骤对象
   * @returns {Object} 添加的步骤
   */
  addStep(step) {
    if (!this.hasActiveProject()) {
      throw new Error('没有活动项目');
    }

    // 验证步骤
    if (!step.type || !['screenshot', 'video', 'text'].includes(step.type)) {
      throw new Error('无效的步骤类型');
    }

    // 添加步骤元数据
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

  /**
   * 获取所有步骤
   * @returns {Array}
   */
  getSteps() {
    if (!this.currentProject) {
      return [];
    }
    return this.currentProject.steps;
  }

  /**
   * 获取步骤数量
   * @returns {number}
   */
  getStepCount() {
    return this.currentProject ? this.currentProject.steps.length : 0;
  }

  /**
   * 删除步骤
   * @param {string} stepId - 步骤ID
   */
  deleteStep(stepId) {
    if (!this.hasActiveProject()) {
      throw new Error('没有活动项目');
    }

    const index = this.currentProject.steps.findIndex(s => s.id === stepId);
    if (index === -1) {
      throw new Error('步骤不存在');
    }

    this.currentProject.steps.splice(index, 1);
    
    // 重新编号
    this.currentProject.steps.forEach((step, idx) => {
      step.index = idx + 1;
    });

    console.log(`✅ 删除步骤:`, stepId);
  }

  /**
   * 结束项目（准备导出）
   * @returns {Object} 项目对象
   */
  finishProject() {
    if (!this.hasActiveProject()) {
      throw new Error('没有活动项目');
    }

    this.isRecording = false;
    console.log('✅ 项目录制完成:', this.currentProject.name);
    
    return this.currentProject;
  }

  /**
   * 导出项目数据
   * @returns {Object}
   */
  exportProject() {
    if (!this.currentProject) {
      throw new Error('没有项目可导出');
    }

    return {
      ...this.currentProject,
      exportedAt: new Date()
    };
  }

  /**
   * 重置（清空当前项目）
   */
  reset() {
    this.currentProject = null;
    this.isRecording = false;
    console.log('✅ 项目管理器已重置');
  }

  /**
   * 获取项目统计
   * @returns {Object}
   */
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

// 单例模式（可选，方便全局使用）
let instance = null;

function getProjectManager() {
  if (!instance) {
    instance = new ProjectManager();
  }
  return instance;
}

module.exports = { ProjectManager, getProjectManager };
