<template>
  <div id="app">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          飞书多维表格插件中心
          <span v-if="currentPluginName" class="plugin-name-separator"> - {{ currentPluginName }}</span>
        </h1>
        <div class="user-info">
          <div class="user-avatar" @click="toggleUserMenu" ref="userAvatarRef">
            {{ userInitial }}
          </div>
          <!-- 用户菜单 -->
          <div v-if="showUserMenu" class="user-menu" ref="userMenuRef">
            <!-- 充值会员和会员有效期字段已隐藏 -->
            <div class="menu-item debug-item" @click="handleDebugInfo">
              <span>🔧 调试信息</span>
            </div>
          </div>
        </div>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>

    <!-- 调试信息弹窗 -->
    <div v-if="showDebugDialog" class="debug-dialog-overlay" @click="closeDebugDialog">
      <div class="debug-dialog-content" @click.stop>
        <div class="debug-dialog-header">
          <h3 class="debug-dialog-title">🔧 多维表格调试信息</h3>
          <button class="debug-close-btn" @click="closeDebugDialog">×</button>
        </div>
        <div class="debug-dialog-body">
          <div class="debug-info-item">
            <label class="debug-info-label">User ID:</label>
            <span class="debug-info-value">{{ debugInfo.userId || '未获取到' }}</span>
          </div>
          <div class="debug-info-item">
            <label class="debug-info-label">Base ID:</label>
            <span class="debug-info-value">{{ debugInfo.baseId || '未获取到' }}</span>
          </div>
          <div class="debug-info-item">
            <label class="debug-info-label">Table ID:</label>
            <span class="debug-info-value">{{ debugInfo.tableId || '未选择' }}</span>
          </div>
          <div class="debug-info-item">
            <label class="debug-info-label">Field ID:</label>
            <span class="debug-info-value">{{ debugInfo.fieldId || '未选择' }}</span>
          </div>
          <div class="debug-info-item">
            <label class="debug-info-label">View ID:</label>
            <span class="debug-info-value">{{ debugInfo.viewId || '未选择' }}</span>
          </div>
          <div class="debug-info-item">
            <label class="debug-info-label">Record ID:</label>
            <span class="debug-info-value">{{ debugInfo.recordId || '未选择' }}</span>
          </div>
        </div>
        <div class="debug-dialog-footer">
          <button class="debug-confirm-btn" @click="closeDebugDialog">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, provide } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const userName = ref('加载中...')
const userInitial = ref('U')
const showUserMenu = ref(false)
const userAvatarRef = ref(null)
const userMenuRef = ref(null)
const currentPluginName = ref('')

// 调试信息相关状态
const showDebugDialog = ref(false)
const debugInfo = ref({
  userId: null,
  baseId: null,
  tableId: null,
  fieldId: null,
  viewId: null,
  recordId: null
})

// 提供调试信息给子组件
provide('debugInfo', {
  showDebugDialog,
  debugInfo,
  openDebugDialog: () => {
    showDebugDialog.value = true
  }
})

// 根据路由更新插件名称
const updatePluginName = () => {
  const routeToPluginName = {
    '/xiaohongshu': '小红书插件',
    '/douyin': '抖音插件'
  }
  currentPluginName.value = routeToPluginName[route.path] || ''
}

// 监听路由变化
watch(() => route.path, updatePluginName, { immediate: true })

// 切换用户菜单显示
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

// 处理充值会员点击
const handleRecharge = () => {
  alert('充值会员功能开发中...')
  showUserMenu.value = false
}

// 处理调试信息点击
const handleDebugInfo = async () => {
  showUserMenu.value = false
  await getBitableSelection()
  showDebugDialog.value = true
}

// 获取多维表格选择信息
const getBitableSelection = async () => {
  try {
    const { bitable } = await import('@lark-base-open/js-sdk')
    
    if (bitable && bitable.base) {
      const selection = await bitable.base.getSelection()
      console.log('获取到多维表格选择信息:', selection)
      
      // 获取用户ID
      let userId = null
      try {
        if (bitable.bridge) {
          userId = await bitable.bridge.getBaseUserId()
        }
      } catch (userError) {
        console.warn('获取用户ID失败:', userError)
      }
      
      debugInfo.value = {
        userId: userId || userName.value,
        baseId: selection.baseId,
        tableId: selection.tableId,
        fieldId: selection.fieldId,
        viewId: selection.viewId,
        recordId: selection.recordId
      }
    } else {
      console.warn('不在多维表格环境中')
      // 开发环境模拟数据
      debugInfo.value = {
        userId: userName.value || 'mock_user_id',
        baseId: 'mock_base_id_12345',
        tableId: 'mock_table_id_67890',
        fieldId: null,
        viewId: 'mock_view_id_11111',
        recordId: null
      }
    }
  } catch (error) {
    console.error('获取多维表格信息失败:', error)
    // 使用模拟数据
    debugInfo.value = {
      userId: userName.value || 'error_user_id',
      baseId: 'error_base_id',
      tableId: null,
      fieldId: null,
      viewId: null,
      recordId: null
    }
  }
}

// 关闭调试信息弹窗
const closeDebugDialog = () => {
  showDebugDialog.value = false
}

// 点击外部关闭菜单
const handleClickOutside = (event) => {
  if (userAvatarRef.value && userMenuRef.value) {
    if (!userAvatarRef.value.contains(event.target) && !userMenuRef.value.contains(event.target)) {
      showUserMenu.value = false
    }
  }
}

onMounted(async () => {
  // 添加全局点击事件监听
  document.addEventListener('click', handleClickOutside)
  
  try {
    // 尝试动态导入飞书 SDK
    const { bitable } = await import('@lark-base-open/js-sdk')
    
    // 检查是否在飞书环境中
    if (typeof window !== 'undefined' && window.parent !== window) {
      // 尝试获取用户信息
      if (bitable && bitable.bridge) {
        try {
          // 使用正确的 API 获取用户 ID
          const userId = await bitable.bridge.getBaseUserId()
          
          if (userId) {
            // 显示用户 ID 的最后两个字符
            userName.value = userId
            userInitial.value = userId.slice(-2).toUpperCase()
          } else {
            userName.value = '飞书用户'
            userInitial.value = '飞书'
          }
        } catch (apiError) {
          console.warn('获取用户 ID 失败:', apiError)
          userName.value = '飞书用户'
          userInitial.value = '飞书'
        }
      } else {
        userName.value = '飞书用户'
        userInitial.value = '飞书'
      }
    } else {
      // 开发环境模拟用户
      userName.value = '开发者'
      userInitial.value = 'DE'
    }
  } catch (error) {
    console.error('SDK 初始化失败:', error)
    // 使用默认用户信息
    userName.value = '游客用户'
    userInitial.value = 'GU'
  }
})

onUnmounted(() => {
  // 移除全局点击事件监听
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 600;
}

.plugin-name-separator {
  font-weight: 400;
  opacity: 0.9;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-avatar:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.user-menu {
  position: absolute;
  top: 50px;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  z-index: 1000;
  overflow: hidden;
  animation: fadeInDown 0.3s ease;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #f8f9fa;
}

.expire-date {
  color: #1890ff;
  font-weight: 600;
}

.user-name {
  font-size: 1rem;
  font-weight: 500;
}

.app-main {
  flex: 1;
  padding: 0;
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
    height: 60px;
  }
  
  .app-title {
    font-size: 1.2rem;
  }
  
  .user-avatar {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
  
  .user-name {
    font-size: 0.9rem;
  }
}

/* 调试菜单项样式 */
.debug-item {
  border-top: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.debug-item:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
}

/* 调试信息弹窗样式 */
.debug-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: debugFadeIn 0.3s ease;
}

@keyframes debugFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.debug-dialog-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: debugSlideIn 0.3s ease;
}

@keyframes debugSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.debug-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 0 24px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 24px;
}

.debug-dialog-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2329;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.debug-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.debug-close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.debug-dialog-body {
  padding: 0 24px;
  max-height: 400px;
  overflow-y: auto;
}

.debug-info-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f9fafb;
}

.debug-info-item:last-child {
  border-bottom: none;
}

.debug-info-label {
  font-weight: 600;
  color: #374151;
  min-width: 100px;
  margin-right: 16px;
}

.debug-info-value {
  color: #6b7280;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: #f9fafb;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  word-break: break-all;
  flex: 1;
}

.debug-dialog-footer {
  padding: 24px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.debug-confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.debug-confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}
</style>