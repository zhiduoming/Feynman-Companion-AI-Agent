DIJKSTRA_GROUND_TRUTH = {
    "knowledge_point": "Dijkstra算法",
    "category": "数据结构-图论",
    "ground_truth": {
        "concept_prerequisite": {
            "name": "概念前提",
            "content": (
                "Dijkstra算法适用于边权非负的带权图。负权边会破坏"
                "已访问节点最短路径已经确定这一核心结论。"
            ),
        },
        "core_mechanism": {
            "name": "核心机制",
            "content": (
                "算法基于贪心策略：每次从未访问节点中选择当前距离起点最近的节点，"
                "将其标记为已访问，并用它的当前距离松弛相邻节点。"
            ),
        },
        "principle_proof": {
            "name": "原理证明",
            "content": (
                "正确性依赖非负权前提。因为边权非负，当前距离最小的未访问节点"
                "之后不可能再通过其他未访问节点得到更短路径。"
            ),
        },
        "common_misunderstandings": {
            "name": "常见误区",
            "content": [
                "认为Dijkstra算法可以处理负权图",
                "只记住步骤，无法解释贪心策略正确性",
                "混淆松弛操作的作用",
                "误以为每次选的是边权最小的边",
            ],
        },
    },
}


INITIAL_GUIDE_TEXT = "请你向我讲解一下 Dijkstra 算法的核心原理，讲得越详细越好。"
