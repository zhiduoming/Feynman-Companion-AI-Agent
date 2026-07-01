import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { chatWithAgent, fetchGreeting } from '@/api/feynman'

/**
 * 消息结构
 * @typedef {Object} Message
 * @property {'user' | 'ai' | 'system'} role
 * @property {string} content
 * @property {number} ts 时间戳
 */

/**
 * 报告卡片 / 详阅数据
 * @typedef {Object} ReportData
 * @property {object} cardPreview
 * @property {object} finalReport
 */

export const useChatStore = defineStore('chat', {
  state: () => ({
    /** 当前会话 id */
    sessionId: '',
    /** 消息列表 */
    messages: /** @type {Message[]} */ ([]),
    /** 是否锁定输入（发送中 / 已结束） */
    isLocked: false,
    /** 报告是否已生成（用于决定是否显示卡片） */
    isReportReady: false,
    /** 报告数据 */
    reportData: /** @type {ReportData | null} */ (null),
    /** 错误信息（Toast 用） */
    errorMsg: ''
  }),

  getters: {
    hasMessages: (state) => state.messages.length > 0,
    isFinished: (state) => state.isReportReady
  },

  actions: {
    /**
     * 初始化：生成 sessionId，拉取首屏引导语
     */
    async bootstrap() {
      // 每次进入都重置一次，避免热更新后状态错位
      this.resetSession()
      try {
        const greeting = await fetchGreeting()
        this.pushMessage('ai', greeting.reply_text)
      } catch (e) {
        this.errorMsg = e.message || '初始化失败'
      }
    },

    /**
     * 用户发送消息并请求 AI 响应
     */
    async sendUserMessage(text) {
      const content = (text || '').trim()
      if (!content || this.isLocked) return

      // 1. 上屏用户消息
      this.pushMessage('user', content)
      // 2. 锁定输入
      this.isLocked = true
      this.errorMsg = ''

      try {
        // 3. 请求后端
        const data = await chatWithAgent(this.sessionId, content)
        this.handleAgentResponse(data)
      } catch (e) {
        this.pushMessage(
          'system',
          '网络异常：' + (e.message || '请稍后再试')
        )
        this.isLocked = false
        this.errorMsg = e.message || '请求失败'
      }
    },

    /**
     * 根据 next_action 分发响应
     */
    handleAgentResponse(data) {
      if (!data) {
        this.isLocked = false
        return
      }

      const { next_action, reply_text, card_preview, final_report } = data

      // 1. AI 总结话术先上屏
      if (reply_text) {
        this.pushMessage('ai', reply_text)
      }

      if (next_action === 'generate_report') {
        this.isReportReady = true
        this.reportData = {
          cardPreview: card_preview || null,
          finalReport: final_report || null
        }
        // 报告就绪后保持锁定，开放"重新开始"
      } else if (next_action === 'follow_up') {
        this.isLocked = false
      } else {
        // 未知 action：保守解锁，避免页面卡死
        this.isLocked = false
      }
    },

    pushMessage(role, content) {
      this.messages.push({
        id: uuidv4(),
        role,
        content,
        ts: Date.now()
      })
    },

    setError(msg) {
      this.errorMsg = msg
    },

    /**
     * 重新开始：清空状态、换 sessionId、重新拉问候语
     */
    async resetSession() {
      this.sessionId = uuidv4()
      this.messages = []
      this.isLocked = false
      this.isReportReady = false
      this.reportData = null
      this.errorMsg = ''
    }
  }
})
