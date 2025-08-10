<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 免责声明弹窗状态
const showDisclaimer = ref(false)
const disclaimerAccepted = ref(false)

// 检查是否已同意免责声明
const checkDisclaimerStatus = () => {
  const accepted = localStorage.getItem('disclaimerAccepted')
  if (!accepted) {
    showDisclaimer.value = true
  } else {
    disclaimerAccepted.value = true
  }
}

// 同意免责声明
const acceptDisclaimer = () => {
  localStorage.setItem('disclaimerAccepted', 'true')
  disclaimerAccepted.value = true
  showDisclaimer.value = false
}

// 拒绝免责声明
const rejectDisclaimer = () => {
  alert('您必须同意免责声明才能使用本工具')
}

// 组件挂载时检查免责声明状态
onMounted(() => {
  checkDisclaimerStatus()
})

const plugins = ref([
  {
    id: 1,
    title: '小红书插件',
    description: '小红书数据抓取和分析工具集合',
    icon: '📝',
    route: '/xiaohongshu',
    features: ['笔记抓取', '博主分析', '数据导出', '关键词搜索'],
    status: '可用'
  }
  // 抖音、微博、知乎插件已隐藏
  // {
  //   id: 2,
  //   title: '抖音插件',
  //   description: '抖音数据抓取和分析工具集合',
  //   icon: '🎵',
  //   route: '/douyin',
  //   features: ['视频抓取', '用户分析', '热门趋势', '数据统计'],
  //   status: '可用'
  // },
  // {
  //   id: 3,
  //   title: '微博插件',
  //   description: '微博数据抓取和分析工具',
  //   icon: '📱',
  //   route: '/weibo',
  //   features: ['微博抓取', '用户分析', '话题监控', '情感分析'],
  //   disabled: true,
  //   status: '开发中'
  // },
  // {
  //   id: 4,
  //   title: '知乎插件',
  //   description: '知乎问答和文章数据抓取',
  //   icon: '🤔',
  //   route: '/zhihu',
  //   features: ['问答抓取', '文章分析', '用户画像', '话题追踪'],
  //   disabled: true,
  //   status: '敬请期待'
  // }
])

const navigateToPlugin = (plugin) => {
  if (!disclaimerAccepted.value) {
    alert('请先同意免责声明')
    return
  }
  if (!plugin.disabled) {
    router.push(plugin.route)
  }
}
</script>

<template>
  <div class="home-container">
    <div class="header">
      <h1 class="title">平台插件集合</h1>
      <p class="subtitle">选择您需要使用的平台插件</p>
    </div>
    
    <div class="plugins-grid">
      <div 
        v-for="plugin in plugins" 
        :key="plugin.id"
        class="plugin-card"
        :class="{ 'plugin-disabled': plugin.disabled }"
        @click="navigateToPlugin(plugin)"
      >
        <div class="plugin-icon">{{ plugin.icon }}</div>
        <div class="plugin-content">
          <div class="plugin-header">
            <h3 class="plugin-title">{{ plugin.title }}</h3>
            <span 
              class="status-badge"
              :class="{ 
                'status-available': !plugin.disabled,
                'status-disabled': plugin.disabled 
              }"
            >
              {{ plugin.status }}
            </span>
          </div>
          <p class="plugin-description">{{ plugin.description }}</p>
          <div class="plugin-features">
            <span 
              v-for="feature in plugin.features" 
              :key="feature"
              class="feature-tag"
            >
              {{ feature }}
            </span>
          </div>
        </div>
        <div class="plugin-arrow">→</div>
      </div>
    </div>
    
    <div class="footer">
      <p class="footer-text">请确保您已获得相应的数据抓取授权</p>
    </div>

    <!-- 免责声明弹窗 -->
    <div v-if="showDisclaimer" class="disclaimer-overlay">
      <div class="disclaimer-dialog">
        <div class="disclaimer-header">
          <h2 class="disclaimer-title">免责声明</h2>
        </div>
        <div class="disclaimer-content">
          <div class="disclaimer-text">
            <p>本工具仅供学习交流使用，不得用于任何商业目的。</p>
            <p>使用本工具获取的数据，用户应当遵守相关法律法规，不得用于侵犯他人合法权益。</p>
            <p>用户在使用本工具时，应当尊重数据来源平台的服务条款和使用协议。</p>
            <p>开发者对使用本工具产生的任何后果不承担责任，包括但不限于数据准确性、合法性以及由此产生的任何损失。</p>
            <p>继续使用本工具即表示您已阅读、理解并同意遵守以上条款。</p>
          </div>
        </div>
        <div class="disclaimer-footer">
          <button class="disclaimer-btn disclaimer-reject" @click="rejectDisclaimer">不同意</button>
          <button class="disclaimer-btn disclaimer-accept" @click="acceptDisclaimer">同意并继续</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* 用户信息显示区域 */
.user-info-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(135deg, #667eea 0%, #764ba2 100%) border-box;
}

.user-avatar-display {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 1.4rem;
  font-weight: 600;
  color: #1f2329;
  margin: 0 0 4px 0;
}

.user-status {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.header {
  text-align: center;
  margin-bottom: 60px;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2329;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.2rem;
  color: #6b7280;
  margin: 0;
}

.plugins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
}

.plugin-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
  overflow: hidden;
}

.plugin-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.plugin-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.plugin-card:hover::before {
  transform: scaleX(1);
}

.plugin-icon {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  flex-shrink: 0;
}

.plugin-content {
  flex: 1;
}

.plugin-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.plugin-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2329;
  margin: 0;
  flex: 1;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-available {
  background: #d1fae5;
  color: #065f46;
}

.status-disabled {
  background: #fef3c7;
  color: #d97706;
}

.plugin-description {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.plugin-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-tag {
  background: #f3f4f6;
  color: #374151;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.plugin-arrow {
  font-size: 1.5rem;
  color: #9ca3af;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.plugin-card:hover .plugin-arrow {
  color: #667eea;
  transform: translateX(4px);
}

.plugin-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.plugin-disabled:hover {
  transform: none;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-color: transparent;
}

.plugin-disabled:hover::before {
  transform: scaleX(0);
}

.plugin-disabled:hover .plugin-arrow {
  color: #9ca3af;
  transform: none;
}

.plugin-disabled .plugin-icon {
  background: #9ca3af;
}

.plugin-disabled .plugin-title,
.plugin-disabled .plugin-description {
  color: #9ca3af;
}

.plugin-disabled .feature-tag {
  background: #f9fafb;
  color: #9ca3af;
}

.footer {
  text-align: center;
  padding-top: 40px;
  border-top: 1px solid #e5e7eb;
}

.footer-text {
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0;
}

/* 免责声明弹窗样式 */
.disclaimer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: disclaimerFadeIn 0.3s ease;
}

@keyframes disclaimerFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.disclaimer-dialog {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 85vh;
  overflow: hidden;
  animation: disclaimerSlideIn 0.3s ease;
  display: flex;
  flex-direction: column;
}

@keyframes disclaimerSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.disclaimer-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  text-align: center;
}

.disclaimer-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

.disclaimer-content {
  padding: 32px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.disclaimer-text {
  line-height: 1.8;
  color: #374151;
}

.disclaimer-text p {
  margin: 0 0 16px 0;
  font-size: 1rem;
}

.disclaimer-text p:last-child {
  margin-bottom: 0;
  font-weight: 600;
  color: #1f2329;
}

.disclaimer-footer {
  padding: 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  flex-shrink: 0;
}

.disclaimer-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.disclaimer-reject {
  background: #f3f4f6;
  color: #374151;
}

.disclaimer-reject:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.disclaimer-accept {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.disclaimer-accept:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* 小屏幕和窄窗口适配 */
@media (max-width: 900px) {
  .disclaimer-dialog {
    width: 95%;
    max-width: 500px;
    margin: 10px;
    max-height: 90vh;
  }
  
  .disclaimer-footer {
    flex-direction: column;
    gap: 12px;
  }
  
  .disclaimer-btn {
    width: 100%;
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .plugins-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .plugin-card {
    padding: 1rem;
  }
  
  .plugin-title {
    font-size: 1.1rem;
  }
  
  .plugin-description {
    font-size: 0.85rem;
  }
  
  .disclaimer-dialog {
    width: 98%;
    margin: 5px;
    max-height: 95vh;
  }
  
  .disclaimer-header {
    padding: 16px;
  }
  
  .disclaimer-title {
    font-size: 1.3rem;
  }
  
  .disclaimer-content {
    padding: 20px;
  }
  
  .disclaimer-footer {
    padding: 16px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .disclaimer-dialog {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
    margin: 0;
  }
  
  .disclaimer-header {
    padding: 12px;
  }
  
  .disclaimer-title {
    font-size: 1.2rem;
  }
  
  .disclaimer-content {
    padding: 16px;
  }
  
  .disclaimer-footer {
    padding: 12px;
  }
  
  .disclaimer-btn {
    padding: 14px 20px;
    font-size: 1rem;
  }
}
</style>