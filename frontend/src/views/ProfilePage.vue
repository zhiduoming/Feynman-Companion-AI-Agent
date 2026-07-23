<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getKnowledgeTree, getSessionList } from '@/api/feynman'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('materials')
const materials = ref([])
const sessions = ref([])
const reports = ref([])
const loading = ref(false)

const tabs = [
  { key: 'materials', label: '我的教材', icon: 'book' },
  { key: 'history', label: '历史对话', icon: 'message' },
  { key: 'reports', label: '历史报告', icon: 'chart' }
]

const isLoggedIn = computed(() => authStore.isLoggedIn)
const username = computed(() => authStore.username)

async function loadMaterials() {
  loading.value = true
  try {
    const USE_MOCK = import.meta.env.VITE_USE_MATERIAL_MOCK !== 'false'
    
    if (USE_MOCK) {
      await delay(500)
      materials.value = [
        {
          id: 'mat-demo',
          name: '数据结构教材.pdf',
          subject: '计算机',
          chapters: 2,
          kps: 3,
          createdAt: '2026-07-20'
        }
      ]
    } else {
      const tree = await getKnowledgeTree('computer')
      materials.value = tree.map(m => ({
        id: m.material_id,
        name: m.title + '.pdf',
        subject: '计算机',
        chapters: m.chapters.length,
        kps: m.chapters.reduce((sum, ch) => sum + ch.knowledge_points.length, 0),
        createdAt: '2026-07-20'
      }))
    }
  } catch (e) {
    materials.value = []
  } finally {
    loading.value = false
  }
}

async function loadHistorySessions() {
  loading.value = true
  try {
    const USE_MOCK = import.meta.env.VITE_USE_FEYNMAN_MOCK !== 'false'
    
    if (USE_MOCK) {
      await delay(500)
      sessions.value = [
        {
          id: 'ses-demo',
          kpName: 'Dijkstra 算法',
          materialTitle: '数据结构教材',
          createdAt: '2026-07-20 10:30',
          messageCount: 5
        }
      ]
    } else {
      const data = await getSessionList()
      sessions.value = data.map(session => ({
        id: session.session_id,
        kpName: session.kp_name || '未知知识点',
        materialTitle: session.material_title || '未知教材',
        createdAt: new Date(session.created_at).toLocaleString(),
        messageCount: null
      }))
    }
  } catch (e) {
    sessions.value = []
  } finally {
    loading.value = false
  }
}

async function loadReports() {
  loading.value = true
  try {
    const USE_MOCK = import.meta.env.VITE_USE_FEYNMAN_MOCK !== 'false'
    
    if (USE_MOCK) {
      await delay(500)
      reports.value = [
        {
          id: 'report-1',
          kpName: 'Dijkstra 算法',
          materialTitle: '数据结构教材',
          score: 34,
          createdAt: '2026-07-20 10:35'
        }
      ]
    } else {
      reports.value = []
    }
  } catch (e) {
    reports.value = []
  } finally {
    loading.value = false
  }
}

function handleTabChange(key) {
  activeTab.value = key
  if (key === 'materials') {
    loadMaterials()
  } else if (key === 'history') {
    loadHistorySessions()
  } else if (key === 'reports') {
    loadReports()
  }
}

function goToMaterialKnowledge(material) {
  router.push(`/knowledge?materialId=${material.id}&subject=${material.subject}&name=${encodeURIComponent(material.name)}`)
}

function goToChat(session) {
  router.push('/home')
}

function goToUpload() {
  router.push('/upload')
}

function goBack() {
  router.push('/select')
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

onMounted(() => {
  if (activeTab.value === 'materials') {
    loadMaterials()
  } else if (activeTab.value === 'history') {
    loadHistorySessions()
  } else {
    loadReports()
  }
})
</script>

<template>
  <div class="profile-page">
    <header class="profile-header">
      <button class="back-btn" @click="goBack">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        返回
      </button>
      <h1 class="page-title">个人中心</h1>
      <div class="header-placeholder"></div>
    </header>

    <main class="profile-main">
      <div class="user-card">
        <div class="user-avatar-large">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div class="user-info">
          <h2 class="user-name">{{ isLoggedIn ? username : '游客用户' }}</h2>
          <p class="user-status">{{ isLoggedIn ? '已登录' : '游客模式' }}</p>
        </div>
        <button v-if="!isLoggedIn" class="login-prompt-btn" @click="router.push('/login')">
          去登录
        </button>
      </div>

      <div class="tabs-container">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === tab.key }"
          @click="handleTabChange(tab.key)"
        >
          <svg v-if="tab.icon === 'book'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <svg v-else-if="tab.icon === 'message'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'materials'">
          <div v-if="loading" class="loading-state">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinner">
              <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-dasharray="16 16" />
            </svg>
            <p>加载中...</p>
          </div>

          <div v-else-if="materials.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <p>暂无教材</p>
            <button class="upload-btn" @click="goToUpload">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>去上传教材</span>
            </button>
          </div>

          <div v-else class="materials-list">
            <div
              v-for="material in materials"
              :key="material.id"
              class="material-card"
              @click="goToMaterialKnowledge(material)"
            >
              <div class="material-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div class="material-info">
                <div class="material-name">{{ material.name }}</div>
                <div class="material-meta">
                  <span>{{ material.chapters }} 章节</span>
                  <span>·</span>
                  <span>{{ material.kps }} 知识点</span>
                </div>
              </div>
              <div class="material-date">{{ material.createdAt }}</div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'history'">
          <div v-if="loading" class="loading-state">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinner">
              <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-dasharray="16 16" />
            </svg>
            <p>加载中...</p>
          </div>

          <div v-else-if="sessions.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p>暂无历史对话</p>
            <button class="start-btn" @click="router.push('/select')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span>开始学习</span>
            </button>
          </div>

          <div v-else class="history-list">
            <div
              v-for="session in sessions"
              :key="session.id"
              class="history-card"
              @click="goToChat(session)"
            >
              <div class="history-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div class="history-info">
                <div class="history-title">{{ session.kpName }}</div>
                <div class="history-subtitle">{{ session.materialTitle }}</div>
              </div>
              <div class="history-meta">
                <div class="history-date">{{ session.createdAt }}</div>
                <div v-if="session.messageCount != null" class="history-count">
                  {{ session.messageCount }} 条消息
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'reports'">
          <div v-if="loading" class="loading-state">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinner">
              <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-dasharray="16 16" />
            </svg>
            <p>加载中...</p>
          </div>

          <div v-else-if="reports.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <p>暂无历史报告</p>
            <button class="start-btn" @click="router.push('/select')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span>开始学习</span>
            </button>
          </div>

          <div v-else class="reports-list">
            <div
              v-for="report in reports"
              :key="report.id"
              class="report-card"
              @click="goToChat(report)"
            >
              <div class="report-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div class="report-info">
                <div class="report-title">{{ report.kpName }}</div>
                <div class="report-subtitle">{{ report.materialTitle }}</div>
              </div>
              <div class="report-score">
                <div class="score-value">{{ report.score }}</div>
                <div class="score-label">总分</div>
              </div>
              <div class="report-date">{{ report.createdAt }}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #F8FAFC;
  display: flex;
  flex-direction: column;
  font-family: 'Noto Sans SC', 'Inter', sans-serif;
}

.profile-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: #FFFFFF;
  border-bottom: 1px solid #E2E8F0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #64748B;
  transition: color 150ms;
}

.back-btn:hover {
  color: #1E293B;
}

.page-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
}

.header-placeholder {
  width: 60px;
}

.profile-main {
  flex: 1;
  padding: 24px 16px;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #E2E8F0;
}

.user-avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563EB;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
}

.user-status {
  margin: 0;
  font-size: 13px;
  color: #64748B;
}

.login-prompt-btn {
  padding: 8px 16px;
  border-radius: 10px;
  background: #2563EB;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  transition: all 150ms;
}

.login-prompt-btn:hover {
  background: #1D4ED8;
}

.tabs-container {
  display: flex;
  gap: 8px;
  background: #FFFFFF;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #64748B;
  transition: all 150ms;
}

.tab-btn--active {
  background: #2563EB;
  color: #FFFFFF;
}

.tab-btn--active svg {
  color: #FFFFFF;
}

.tab-content {
  flex: 1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  gap: 12px;
}

.loading-state .spinner {
  animation: spin 1s linear infinite;
  color: #2563EB;
}

.loading-state p {
  margin: 0;
  font-size: 14px;
  color: #94A3B8;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px;
  gap: 12px;
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #E2E8F0;
}

.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: #64748B;
}

.upload-btn,
.start-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  transition: all 150ms;
}

.upload-btn {
  background: #2563EB;
  color: #FFFFFF;
}

.upload-btn:hover {
  background: #1D4ED8;
}

.start-btn {
  background: #F1F5F9;
  color: #475569;
}

.start-btn:hover {
  background: #E2E8F0;
}

.materials-list,
.history-list,
.reports-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.material-card,
.history-card,
.report-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  transition: all 150ms;
}

.material-card:hover,
.history-card:hover,
.report-card:hover {
  border-color: rgba(37, 99, 235, 0.4);
  background: rgba(37, 99, 235, 0.02);
}

.material-icon,
.history-icon,
.report-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.material-icon {
  background: rgba(37, 99, 235, 0.1);
  color: #2563EB;
}

.history-icon {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.report-icon {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.material-info,
.history-info,
.report-info {
  flex: 1;
  min-width: 0;
}

.material-name,
.history-title,
.report-title {
  font-size: 14px;
  font-weight: 500;
  color: #1E293B;
  margin-bottom: 4px;
}

.material-meta,
.history-subtitle,
.report-subtitle {
  font-size: 13px;
  color: #64748B;
}

.material-meta span {
  margin-right: 4px;
}

.material-date,
.history-date,
.report-date {
  font-size: 12px;
  color: #94A3B8;
  flex-shrink: 0;
}

.history-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.history-count {
  font-size: 12px;
  color: #94A3B8;
}

.report-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 12px;
  background: rgba(37, 99, 235, 0.08);
  border-radius: 8px;
  margin-right: 12px;
}

.score-value {
  font-size: 18px;
  font-weight: 700;
  color: #2563EB;
  line-height: 1;
}

.score-label {
  font-size: 10px;
  color: #64748B;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
