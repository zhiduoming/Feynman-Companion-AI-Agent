/**
 * Mock 响应数据
 * 直接复用 PRD §四 中给出的标准 JSON（场景 A / 场景 B）
 * 真实联调时 USE_MOCK=false 即可走真实后端
 */

export const MOCK_FOLLOW_UP = {
  code: 200,
  msg: 'success',
  data: {
    next_action: 'follow_up',
    reply_text:
      '确实如此！那除了边权不能为负数，你能不能解释一下，为什么没访问过的节点里，当前距离最小的那个点，它的最短路径就确定了呢？',
    card_preview: null,
    final_report: null
  }
}

export const MOCK_GENERATE_REPORT = {
  code: 200,
  msg: 'success',
  data: {
    next_action: 'generate_report',
    reply_text:
      '听你讲完，我对 Dijkstra 的逻辑彻底明白了！今天的对练先到这里，我帮我们整理了一份诊断报告：',
    card_preview: {
      total_score: 8.5,
      tagline: '逻辑整体严密，在贪心原理的本质解释上可进一步深化',
      main_vulnerability: '贪心最优子结构解释不够直观'
    },
    final_report: {
      summary:
        '经过 3 轮交互，你准确指出了负权边限制与松弛操作核心，但在证明贪心最优选择时的逻辑略欠连贯。',
      dimensions: {
        understanding_depth: 9,
        expression_completeness: 8,
        logic_coherence: 8,
        structure_ability: 9
      },
      student_tricky_points: [
        '为什么不能用来解决带有负权边的最短路问题？',
        '在没有负权的前提下，为什么局部最短可以推导出全局最短？'
      ],
      user_vulnerabilities: [
        {
          type: '推导表达略欠直观',
          detail: '解释贪心策略时直接抛出了结论，缺乏对反证法的口语化通俗说明。'
        }
      ],
      deep_analysis:
        'Dijkstra 算法能成功的本质在于图论中的三角不等式：在非负权图中，任意一条经过未确定节点的最短路径，其最后一段必然不短于该节点的当前最短估计。换句话说，一旦某个节点被弹出"已确定集合"，就不存在更短的路径还能"绕路"回到它，从而保证了贪心选择的全局最优性。'
    }
  }
}

/**
 * 引导语（首屏 AI 消息）
 * 等同于一次"后端主动发起的 follow_up"，但不带 sessionId
 */
export const MOCK_GREETING = {
  code: 200,
  msg: 'success',
  data: {
    next_action: 'follow_up',
    reply_text:
      '同学你好！我是一个刚开始学数据结构的小白。请用费曼学习法，用大白话向我解释一下 Dijkstra 算法是怎么保证一定能找到最短路径的？',
    card_preview: null,
    final_report: null
  }
}
