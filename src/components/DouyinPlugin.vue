<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const tools = ref([
  {
    id: 1,
    title: '视频数据抓取',
    description: '抓取抖音视频的详细数据信息',
    icon: '🎬',
    features: ['视频信息', '用户数据', '评论抓取', '数据导出']
  },
  {
    id: 2,
    title: '用户分析工具',
    description: '分析抖音用户的行为和数据',
    icon: '👥',
    features: ['用户画像', '粉丝分析', '内容偏好', '互动数据']
  },
  {
    id: 3,
    title: '热门趋势监控',
    description: '监控抖音平台的热门趋势和话题',
    icon: '🔥',
    features: ['趋势分析', '话题监控', '热门视频', '数据报告'],
    disabled: true
  },
  {
    id: 4,
    title: '直播数据分析',
    description: '分析抖音直播间的数据和表现',
    icon: '📺',
    features: ['直播数据', '观众分析', '互动统计', '收益分析'],
    disabled: true
  }
])

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="plugin-container">
    <div class="plugin-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="plugin-info">
        <div class="plugin-icon">🎵</div>
        <div>
          <h1 class="plugin-title">抖音插件</h1>
          <p class="plugin-subtitle">抖音数据抓取和分析工具集合</p>
        </div>
      </div>
    </div>

    <div class="tools-grid">
      <div 
        v-for="tool in tools" 
        :key="tool.id"
        class="tool-card"
        :class="{ 'tool-disabled': tool.disabled }"
      >
        <div class="tool-icon">{{ tool.icon }}</div>
        <div class="tool-content">
          <h3 class="tool-title">{{ tool.title }}</h3>
          <p class="tool-description">{{ tool.description }}</p>
          <div class="tool-features">
            <span 
              v-for="feature in tool.features" 
              :key="feature"
              class="feature-tag"
            >
              {{ feature }}
            </span>
          </div>
          <button 
            class="tool-btn"
            :disabled="tool.disabled"
          >
            {{ tool.disabled ? '敬请期待' : '开始使用' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plugin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 70px);
}

.plugin-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.back-btn {
  background: #f3f4f6;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e5e7eb;
}

.plugin-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.plugin-icon {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #000000 0%, #434343 100%);
  border-radius: 20px;
}

.plugin-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2329;
  margin: 0 0 8px 0;
}

.plugin-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.tool-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.tool-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.tool-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1f2329;
  margin: 0;
}

.tool-description {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.tool-features {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}

.feature-tag {
  background: #f3f4f6;
  color: #374151;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.tool-btn {
  background: linear-gradient(135deg, #000000 0%, #434343 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.tool-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tool-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.tool-disabled {
  opacity: 0.6;
}

.tool-disabled:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tool-disabled .feature-tag {
  background: #f9fafb;
  color: #9ca3af;
}

@media (max-width: 768px) {
  .plugin-container {
    padding: 20px 16px;
  }
  
  .plugin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .plugin-info {
    flex-direction: column;
    text-align: center;
  }
  
  .plugin-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }
  
  .plugin-title {
    font-size: 1.5rem;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>