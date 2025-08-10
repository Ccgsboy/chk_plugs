<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getTableList, refreshTableList, isBitableEnvironment } from '../utils/bitableUtils.js'

const router = useRouter()

// 当前活动的工具
const activeToolId = ref(null)

// WebSocket相关
const ws = ref(null)
const isConnected = ref(false)
const currentProcessId = ref('')
const isProcessing = ref(false)
const processLogs = ref([])
const processProgress = ref(0)
const processStatus = ref('')
const currentStep = ref('')
const processedCount = ref(0)
const totalCount = ref(0)

// 附件上传进度
const uploadProgress = ref({ current: 0, total: 0, url: '' })

// 弹窗状态
const showStopConfirm = ref(false)
const isTaskCompleted = ref(false) // 标记任务是否已完成
const isLogExpanded = ref(false)

// 表单数据
const searchForm = ref({
  keyword: '',
  cookie: '',
  queryCount: 60, // 默认60条
  noteType: 0, // 0=全部，1=视频，2=图文
  sort: 'general', // general=综合，time=最新，popularity_descending=最热
  selectedTableId: '',
  personalBaseToken: '', // 新增多维表格授权码字段
  maxPages: 3, // 默认3页
  intervalTime: 2, // 间隔时间（秒），默认2秒
  delayRange: '8~20', // 间隔时间范围（秒）
  delayMin: '8', // 最小间隔时间
  delayMax: '20' // 最大间隔时间
})

const bloggerForm = ref({
  bloggerUrls: '',
  cookie: '',
  selectedTableId: '',
  personalBaseToken: '', // 新增多维表格授权码字段
  enableAttachmentUpload: true, // 启用附件上传
  // cozeToken现在从后端配置文件读取，不再需要前端输入
  delayMin: '8', // 最小延迟时间
  delayMax: '15' // 最大延迟时间
})

const noteDetailForm = ref({
  cookie: '',
  selectedTableId: '',
  personalBaseToken: '', // 多维表格授权码字段
  noteUrlField: '', // 笔记地址字段
  processingMode: 'manual', // 处理方式：filter（字段过滤）或 manual（手动选择）
  filterFields: [], // 过滤字段（支持多选）
  selectedRecordIds: [], // 手动选择的记录ID列表
  // cozeToken现在从后端配置文件读取，不再需要前端输入
  delayMin: '8', // 最小延迟时间
  delayMax: '15' // 最大延迟时间
})

// 表格列表
const tableMetaList = ref([])

// 表格字段列表
const tableFields = ref([])

// 字段选择状态 - 笔记搜索
const searchFieldOptions = ref([
  { key: 'noteId', label: '笔记ID', required: true, checked: true, fieldName: '笔记ID' },
  { key: 'noteUrl', label: '笔记地址', required: false, checked: true, fieldName: '笔记地址' },
  { key: 'author', label: '笔记作者', required: false, checked: true, fieldName: '笔记作者' },
  { key: 'authorHomepage', label: '主页地址', required: false, checked: true, fieldName: '主页地址' },
  { key: 'title', label: '笔记标题', required: false, checked: true, fieldName: '笔记标题' },
  { key: 'content', label: '笔记内容', required: false, checked: true, fieldName: '笔记内容' },
  { key: 'collectedCount', label: '收藏数', required: false, checked: true, fieldName: '收藏数' },
  { key: 'noteLikedCount', label: '点赞数', required: false, checked: true, fieldName: '点赞数' },
  { key: 'commentCount', label: '评论数', required: false, checked: true, fieldName: '评论数' },
  { key: 'shareCount', label: '分享数', required: false, checked: true, fieldName: '分享数' },
  { key: 'noteTags', label: '笔记标签', required: false, checked: true, fieldName: '笔记标签' },
  { key: 'attachments', label: '附件', required: false, checked: true, fieldName: '附件' },
  { key: 'attachmentUrls', label: '附件地址', required: false, checked: true, fieldName: '附件地址' },
  { key: 'matchKeyword', label: '匹配词', required: false, checked: true, fieldName: '匹配词' }
])

// 字段选择状态 - 笔记详情（基于搜索字段但排除笔记地址、笔记ID和匹配词）
const noteDetailFieldOptions = ref([
  { key: 'author', label: '笔记作者', required: false, checked: true, fieldName: '笔记作者' },
  { key: 'authorHomepage', label: '主页地址', required: false, checked: true, fieldName: '主页地址' },
  { key: 'title', label: '笔记标题', required: false, checked: true, fieldName: '笔记标题' },
  { key: 'content', label: '笔记内容', required: false, checked: true, fieldName: '笔记内容' },
  { key: 'attachmentUrls', label: '附件地址', required: false, checked: true, fieldName: '附件地址' },
  { key: 'attachments', label: '附件', required: false, checked: true, fieldName: '附件' },
  { key: 'noteTags', label: '笔记标签', required: false, checked: true, fieldName: '笔记标签' },
  { key: 'noteLikedCount', label: '点赞数', required: false, checked: true, fieldName: '点赞数' },
  { key: 'collectedCount', label: '收藏数', required: false, checked: true, fieldName: '收藏数' },
  { key: 'commentCount', label: '评论数', required: false, checked: true, fieldName: '评论数' },
  { key: 'shareCount', label: '分享数', required: false, checked: true, fieldName: '分享数' },
  { key: 'publishDate', label: '笔记发布日期', required: false, checked: true, fieldName: '笔记发布日期' },
  { key: 'noteLastUpdateTime', label: '笔记更新日期', required: false, checked: true, fieldName: '笔记更新日期' }
])

// 字段选择状态 - 博主笔记（按照后端GetBloggerNotesRequiredFields的顺序）
const bloggerFieldOptions = ref([
  { key: 'noteId', label: '笔记ID', required: true, checked: true, fieldName: '笔记ID' },
  { key: 'noteUrl', label: '笔记地址', required: false, checked: true, fieldName: '笔记地址' },
  { key: 'authorId', label: '博主ID', required: false, checked: true, fieldName: '博主ID' },
  { key: 'authorNickname', label: '博主昵称', required: false, checked: true, fieldName: '博主昵称' },
  { key: 'authorHomepage', label: '首页地址', required: false, checked: true, fieldName: '首页地址' },
  { key: 'title', label: '笔记标题', required: false, checked: true, fieldName: '笔记标题' },
  { key: 'content', label: '笔记内容', required: false, checked: true, fieldName: '笔记内容' },
  { key: 'noteTags', label: '笔记标签', required: false, checked: true, fieldName: '笔记标签' },
  { key: 'attachmentUrls', label: '附件地址', required: false, checked: true, fieldName: '附件地址' },
  { key: 'attachments', label: '附件', required: false, checked: true, fieldName: '附件' },
  { key: 'collectedCount', label: '收藏数', required: false, checked: true, fieldName: '收藏数' },
  { key: 'noteLikedCount', label: '点赞数', required: false, checked: true, fieldName: '点赞数' },
  { key: 'commentCount', label: '评论数', required: false, checked: true, fieldName: '评论数' },
  { key: 'shareCount', label: '分享数', required: false, checked: true, fieldName: '分享数' },
  { key: 'isLiked', label: '是否点赞', required: false, checked: true, fieldName: '是否点赞' },
  { key: 'isCollected', label: '是否收藏', required: false, checked: true, fieldName: '是否收藏' },
  { key: 'publishDate', label: '笔记发布日期', required: false, checked: true, fieldName: '笔记发布日期' },
  { key: 'noteLastUpdateTime', label: '笔记更新日期', required: false, checked: true, fieldName: '笔记更新日期' }
])

const tools = ref([
  {
    id: 1,
    title: '笔记搜索抓取',
    description: '根据关键词搜索并抓取小红书笔记数据',
    icon: '🔍',
    features: ['关键词搜索', '批量抓取', '数据导出', '字段自定义']
  },
  {
    id: 2,
    title: '博主笔记抓取',
    description: '抓取指定博主的所有笔记数据',
    icon: '👤',
    features: ['博主主页抓取', '笔记详情获取', '批量处理', '游标分页']
  },
  {
    id: 3,
    title: '笔记详情获取',
    description: '根据多维表格中的笔记地址获取详细信息',
    icon: '📝',
    features: ['地址字段选择', '详情批量获取', '数据更新', '时间间隔控制']
  },
  // 热门话题分析功能已隐藏
  // {
  //   id: 4,
  //   title: '热门话题分析',
  //   description: '分析小红书热门话题和趋势',
  //   icon: '📈',
  //   features: ['话题监控', '趋势分析', '数据可视化', '报告生成'],
  //   disabled: true
  // }
])

// WebSocket连接
const connectWebSocket = () => {
  if (ws.value) {
    ws.value.close()
  }
  
  const wsUrl = 'wss://www.nlav.cn/api/bitable/data'
  ws.value = new WebSocket(wsUrl)
  
  ws.value.onopen = () => {
    isConnected.value = true
  }
  
  ws.value.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data)
      handleWebSocketMessage(message)
    } catch (error) {
      console.error('解析WebSocket消息失败:', error)
    }
  }
  
  ws.value.onclose = () => {
    isConnected.value = false
    // 只有在非正常完成时才重置处理状态
    if (processStatus.value !== 'completed' && processStatus.value !== 'failed' && processStatus.value !== 'stopped') {
      isProcessing.value = false
      currentProcessId.value = ''
    }
  }
  
  ws.value.onerror = (error) => {
    console.error('WebSocket错误:', error)
    isConnected.value = false
    isProcessing.value = false
  }
}

// 处理WebSocket消息
const handleWebSocketMessage = (message) => {
  switch (message.type) {
    case 'connected':
      break
      
    case 'process_started':
      currentProcessId.value = message.data.process_id
      isProcessing.value = true
      isTaskCompleted.value = false
      processLogs.value = []
      processProgress.value = 0
      processedCount.value = 0
      totalCount.value = 0
      uploadProgress.value = { current: 0, total: 0, url: '' }
      break
      
    case 'log':
      processLogs.value.push({
        time: message.data.time,
        level: message.data.level,
        message: message.data.message
      })
      // 自动滚动到底部
      setTimeout(() => {
        const logContainer = document.querySelector('.log-container')
        if (logContainer) {
          logContainer.scrollTop = logContainer.scrollHeight
        }
      }, 100)
      break
      
    case 'progress_update':
      processProgress.value = message.data.progress || 0
      currentStep.value = message.data.current_step || ''
      processedCount.value = message.data.processed_count || 0
      totalCount.value = message.data.total_count || 0
      processStatus.value = message.data.status || ''
      break
      
    case 'upload_progress':
      uploadProgress.value = {
        current: message.data.current || 0,
        total: message.data.total || 0,
        url: message.data.url || ''
      }
      break
      
    case 'process_completed':
      isProcessing.value = false
      processProgress.value = 100
      processStatus.value = 'completed'
      uploadProgress.value = { current: 0, total: 0, url: '' }
      // 任务正常完成，直接关闭WebSocket连接
      closeWebSocket()
      break
      
    case 'process_failed':
      isProcessing.value = false
      processStatus.value = 'failed'
      uploadProgress.value = { current: 0, total: 0, url: '' }
      console.error('进程失败:', message.data.error)
      // 关闭WebSocket连接
      closeWebSocket()
      break
      
    case 'process_stopped':
      isProcessing.value = false
      processStatus.value = 'stopped'
      uploadProgress.value = { current: 0, total: 0, url: '' }
      // 关闭WebSocket连接
      closeWebSocket()
      break
      
    case 'error':
      console.error('WebSocket错误:', message.data.message)
      alert('错误: ' + message.data.message)
      break
  }
}

// 关闭WebSocket连接
const closeWebSocket = () => {
  if (ws.value) {
    ws.value.close()
    ws.value = null
  }
  isConnected.value = false
  currentProcessId.value = ''
}

// 发送WebSocket消息
const sendWebSocketMessage = (type, data) => {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({ type, data }))
  } else {
    console.error('WebSocket未连接')
  }
}

// 获取多维表格列表
const getTableMetaList = async () => {
  try {
    const tableList = await getTableList()
    tableMetaList.value = tableList
    
    // 自动选择第一个表格
    if (tableList.length > 0) {
      const firstTable = tableList[0]
      searchForm.value.selectedTableId = firstTable.id
      bloggerForm.value.selectedTableId = firstTable.id
      noteDetailForm.value.selectedTableId = firstTable.id
      // 自动获取第一个表格的字段
      await getTableFields(firstTable.id)
    }
  } catch (error) {
    console.error('获取表格列表失败:', error)
    // 使用降级数据
    tableMetaList.value = [
      { id: 'table1', name: '小红书数据表' },
      { id: 'table2', name: '用户数据表' },
      { id: 'table3', name: '内容分析表' }
    ]
  }
}

// 下拉框获得焦点时刷新表格列表
const onTableSelectFocus = async () => {
  try {
    const tableList = await refreshTableList()
    tableMetaList.value = tableList
  } catch (error) {
    console.error('刷新表格列表失败:', error)
  }
}

// 获取表格字段列表
const getTableFields = async (tableId) => {
  if (!tableId) {
    tableFields.value = []
    return
  }
  
  try {
    const { bitable } = await import('@lark-base-open/js-sdk')
    
    if (bitable && bitable.base) {
      const table = await bitable.base.getTableById(tableId)
      if (table) {
        const fieldMetaList = await table.getFieldMetaList()
        tableFields.value = fieldMetaList.map(field => ({
          id: field.id,
          name: field.name,
          type: field.type
        }))
      }
    }
  } catch (error) {
    console.error('获取表格字段失败:', error)
    tableFields.value = []
  }
}

// 监听笔记详情表格选择变化
const onNoteDetailTableChange = async (tableId) => {
  await getTableFields(tableId)
  // 清空之前选择的字段和记录
  noteDetailForm.value.noteUrlField = ''
  noteDetailForm.value.filterFields = []
  noteDetailForm.value.selectedRecordIds = []
}

// 选择记录方法
const selectRecords = async () => {
  if (!noteDetailForm.value.selectedTableId) {
    alert('请先选择数据表')
    return
  }
  
  try {
    const { bitable } = await import('@lark-base-open/js-sdk')
    
    if (bitable && bitable.ui && bitable.ui.selectRecordIdList) {
      // 获取当前表的默认视图ID
      const table = await bitable.base.getTableById(noteDetailForm.value.selectedTableId)
      const viewMetaList = await table.getViewMetaList()
      const defaultView = viewMetaList[0] // 使用第一个视图作为默认视图
      
      // 调用选择记录API
      const selectedRecordIds = await bitable.ui.selectRecordIdList(
        noteDetailForm.value.selectedTableId,
        defaultView.id
      )
      
      if (selectedRecordIds && selectedRecordIds.length > 0) {
        noteDetailForm.value.selectedRecordIds = selectedRecordIds
      } else {
        noteDetailForm.value.selectedRecordIds = []
      }
    } else {
      alert('当前环境不支持记录选择功能，请确保在多维表格环境中运行')
    }
  } catch (error) {
    console.error('选择记录失败:', error)
    alert('选择记录失败，请重试')
  }
}

// 开始执行
const startExecution = async (toolId) => {
  if (toolId === 1) {
    // 笔记搜索抓取
    if (!searchForm.value.keyword.trim()) {
      alert('请输入搜索关键词')
      return
    }
    if (!searchForm.value.cookie.trim()) {
      alert('请输入Cookie配置')
      return
    }
    if (!searchForm.value.selectedTableId) {
      alert('请选择数据表')
      return
    }
    if (!searchForm.value.personalBaseToken.trim()) {
      alert('请输入多维表格授权码')
      return
    }
    
    // 连接WebSocket
    connectWebSocket()
    
    // 等待连接建立
    setTimeout(async () => {
      if (isConnected.value) {
        // 计算总页数
        const totalPages = Math.ceil(searchForm.value.queryCount / 20)
        
        // 获取App Token (baseId)
        let appToken = ''
        try {
          // 使用与App.vue相同的方法获取baseId
          const { bitable } = await import('@lark-base-open/js-sdk')
          
          if (bitable && bitable.base) {
            const selection = await bitable.base.getSelection()
            if (selection && selection.baseId) {
              appToken = selection.baseId
            }
          } else {
            console.warn('不在多维表格环境中')
            // 备用方法：从URL获取
            const location = window.location.href
            const baseIdMatch = location.match(/base\/([a-zA-Z0-9]+)/)
            if (baseIdMatch && baseIdMatch[1]) {
              appToken = baseIdMatch[1]
            }
          }
        } catch (error) {
          console.error('获取App Token失败:', error)
          // 最后的备用方法：从URL获取
          try {
            const location = window.location.href
            const baseIdMatch = location.match(/base\/([a-zA-Z0-9]+)/)
            if (baseIdMatch && baseIdMatch[1]) {
              appToken = baseIdMatch[1]
            }
          } catch (urlError) {
            console.error('从URL获取baseId也失败:', urlError)
          }
        }
        
        if (!appToken) {
          alert('无法获取App Token，请确保在多维表格环境中运行')
          return
        }
        
        // 构建消息数据
        const messageData = {
          app_token: appToken,
          table_id: searchForm.value.selectedTableId,
          personal_base_token: searchForm.value.personalBaseToken,
          keyword: searchForm.value.keyword,
          page_size: 20, // 固定每页20条
          max_pages: totalPages,
          total_count: searchForm.value.queryCount, // 添加总条数
          sort: searchForm.value.sort,
          note_type: searchForm.value.noteType,
          cookie: searchForm.value.cookie,
          interval_time: searchForm.value.intervalTime, // 保持兼容性
          delay_range: searchForm.value.delayRange, // 添加间隔时间范围
          delay_min: parseInt(searchForm.value.delayMin) || 8, // 最小延迟时间
          delay_max: parseInt(searchForm.value.delayMax) || 20 // 最大延迟时间
        }
        
        // 发送开始处理消息
        
        // 发送开始处理消息
        sendWebSocketMessage('start_process', messageData)
      } else {
        alert('WebSocket连接失败，请重试')
      }
    }, 1000)
    
  } else if (toolId === 2) {
    // 博主笔记抓取
    if (!bloggerForm.value.bloggerUrls.trim()) {
      alert('请输入博主主页地址')
      return
    }
    if (!bloggerForm.value.cookie.trim()) {
      alert('请输入Cookie配置')
      return
    }
    if (!bloggerForm.value.selectedTableId) {
      alert('请选择数据表')
      return
    }
    if (!bloggerForm.value.personalBaseToken.trim()) {
      alert('请输入多维表格授权码')
      return
    }
    // cozeToken现在从后端配置文件读取，不再需要前端验证
    
    // 连接WebSocket
    connectWebSocket()
    
    // 等待连接建立
    setTimeout(async () => {
      if (isConnected.value) {
        // 获取App Token (baseId)
        let appToken = ''
        try {
          // 使用与App.vue相同的方法获取baseId
          const { bitable } = await import('@lark-base-open/js-sdk')
          
          if (bitable && bitable.base) {
            const selection = await bitable.base.getSelection()
            if (selection && selection.baseId) {
              appToken = selection.baseId
            }
          } else {
            console.warn('不在多维表格环境中')
            // 备用方法：从URL获取
            const location = window.location.href
            const baseIdMatch = location.match(/base\/([a-zA-Z0-9]+)/)
            if (baseIdMatch && baseIdMatch[1]) {
              appToken = baseIdMatch[1]
            }
          }
        } catch (error) {
          console.error('获取App Token失败:', error)
          // 最后的备用方法：从URL获取
          try {
            const location = window.location.href
            const baseIdMatch = location.match(/base\/([a-zA-Z0-9]+)/)
            if (baseIdMatch && baseIdMatch[1]) {
              appToken = baseIdMatch[1]
            }
          } catch (urlError) {
            console.error('从URL获取baseId也失败:', urlError)
          }
        }
        
        if (!appToken) {
          alert('无法获取App Token，请确保在多维表格环境中运行')
          return
        }
        
        // 解析博主URL列表
        const bloggerUrls = bloggerForm.value.bloggerUrls
          .split('\n')
          .map(url => url.trim())
          .filter(url => url.length > 0)
        
        // 构建消息数据
        const messageData = {
          app_token: appToken,
          table_id: bloggerForm.value.selectedTableId,
          personal_base_token: bloggerForm.value.personalBaseToken,
          enable_attachment_upload: bloggerForm.value.enableAttachmentUpload,
          blogger_urls: bloggerUrls,
          cookie: bloggerForm.value.cookie,
          // coze_token现在从后端配置文件读取，不再从前端传递
          delay_min: parseInt(bloggerForm.value.delayMin) || 1,
          delay_max: parseInt(bloggerForm.value.delayMax) || 3
        }
        
        // 发送博主笔记处理消息
        
        // 发送开始处理消息
        sendWebSocketMessage('start_blogger_notes_process', messageData)
      } else {
        alert('WebSocket连接失败，请重试')
      }
    }, 1000)
    
  } else if (toolId === 3) {
    // 笔记详情获取
    if (!noteDetailForm.value.cookie.trim()) {
      alert('请输入Cookie配置')
      return
    }
    if (!noteDetailForm.value.selectedTableId) {
      alert('请选择数据表')
      return
    }
    if (!noteDetailForm.value.personalBaseToken.trim()) {
      alert('请输入多维表格授权码')
      return
    }
    if (!noteDetailForm.value.noteUrlField) {
      alert('请选择笔记地址字段')
      return
    }
    if (!noteDetailForm.value.processingMode) {
      alert('请选择处理方式')
      return
    }
    if (noteDetailForm.value.processingMode === 'manual' && (!noteDetailForm.value.selectedRecordIds || noteDetailForm.value.selectedRecordIds.length === 0)) {
      alert('手动选择模式下，请先选择要处理的记录')
      return
    }
    
    // 设置处理状态
    isProcessing.value = true
    
    // 连接WebSocket
    connectWebSocket()
    
    // 等待连接建立
    setTimeout(async () => {
      if (isConnected.value) {
        // 获取App Token (baseId)
        let appToken = ''
        try {
          // 使用与App.vue相同的方法获取baseId
          const { bitable } = await import('@lark-base-open/js-sdk')
          
          if (bitable && bitable.base) {
            const selection = await bitable.base.getSelection()
            if (selection && selection.baseId) {
              appToken = selection.baseId
            }
          } else {
            console.warn('不在多维表格环境中')
            // 备用方法：从URL获取
            const location = window.location.href
            const baseIdMatch = location.match(/base\/([a-zA-Z0-9]+)/)
            if (baseIdMatch && baseIdMatch[1]) {
              appToken = baseIdMatch[1]
            }
          }
        } catch (error) {
          console.error('获取App Token失败:', error)
          // 最后的备用方法：从URL获取
          try {
            const location = window.location.href
            const baseIdMatch = location.match(/base\/([a-zA-Z0-9]+)/)
            if (baseIdMatch && baseIdMatch[1]) {
              appToken = baseIdMatch[1]
            }
          } catch (urlError) {
            console.error('从URL获取baseId也失败:', urlError)
          }
        }
        
        if (!appToken) {
          alert('无法获取App Token，请确保在多维表格环境中运行')
          return
        }
        
        // 获取选中的字段列表
        const selectedFields = noteDetailFieldOptions.value
          .filter(field => field.checked)
          .map(field => field.key)
        
        // 构建消息数据
        const messageData = {
          app_token: appToken,
          table_id: noteDetailForm.value.selectedTableId,
          personal_base_token: noteDetailForm.value.personalBaseToken,
          note_url_field: noteDetailForm.value.noteUrlField,
          processing_mode: noteDetailForm.value.processingMode,
          filter_fields: noteDetailForm.value.processingMode === 'filter' ? noteDetailForm.value.filterFields : [],
          selected_record_ids: noteDetailForm.value.processingMode === 'manual' ? noteDetailForm.value.selectedRecordIds : [],
          display_fields: selectedFields,
          cookie: noteDetailForm.value.cookie,
          // coze_token现在从后端配置文件读取，不再从前端传递
          delay_min: parseInt(noteDetailForm.value.delayMin) || 8,
          delay_max: parseInt(noteDetailForm.value.delayMax) || 15
        }
        
        // 发送笔记详情获取处理消息
        
        // 发送开始处理消息
        sendWebSocketMessage('start_note_detail_process', messageData)
      } else {
        alert('WebSocket连接失败，请重试')
      }
    }, 1000)
  }
}

// 停止执行
const stopExecution = () => {
  if (currentProcessId.value && !isTaskCompleted.value) {
    sendWebSocketMessage('stop_process', {
      process_id: currentProcessId.value
    })
  }
  
  // 重置所有状态
  showStopConfirm.value = false
  isTaskCompleted.value = false
  isProcessing.value = false
  currentProcessId.value = ''
  processStatus.value = ''
}

// 显示停止确认
const showStopConfirmDialog = () => {
  showStopConfirm.value = true
}



// 获取进程状态
const getProcessStatus = () => {
  if (currentProcessId.value) {
    sendWebSocketMessage('get_process_status', {
      process_id: currentProcessId.value
    })
  }
}

// 显示工具配置
const showToolConfig = (toolId) => {
  if (tools.value.find(t => t.id === toolId)?.disabled) {
    return
  }
  activeToolId.value = toolId
}

// 返回工具列表
const backToTools = () => {
  activeToolId.value = null
  // 如果有正在进行的进程，询问是否停止
  if (isProcessing.value) {
    if (confirm('有正在进行的抓取任务，是否停止？')) {
      stopExecution()
    }
  }
}

// 返回主页
const goBack = () => {
  // 如果有正在进行的进程，询问是否停止
  if (isProcessing.value) {
    if (confirm('有正在进行的抓取任务，是否停止？')) {
      stopExecution()
      setTimeout(() => {
        router.push('/')
      }, 1000)
    }
  } else {
    router.push('/')
  }
}

// 格式化日志级别
const formatLogLevel = (level) => {
  const levelMap = {
    'info': '信息',
    'warn': '警告',
    'error': '错误',
    'debug': '调试'
  }
  return levelMap[level] || level
}

// 获取日志级别样式
const getLogLevelClass = (level) => {
  return `log-${level}`
}

// 监听delayRange变化，同步更新delayMin和delayMax
watch(() => searchForm.value.delayRange, (newVal) => {
  if (newVal && newVal.includes('~')) {
    const [min, max] = newVal.split('~')
    searchForm.value.delayMin = min
    searchForm.value.delayMax = max
  }
})

// 监听delayMin和delayMax变化，更新delayRange
watch(() => searchForm.value.delayMin, () => {
  updateDelayRange()
})

watch(() => searchForm.value.delayMax, () => {
  updateDelayRange()
})

// 监听博主表单的delayMin和delayMax变化
watch(() => bloggerForm.value.delayMin, () => {
  updateBloggerDelayRange()
})

watch(() => bloggerForm.value.delayMax, () => {
  updateBloggerDelayRange()
})

// 更新delayRange
const updateDelayRange = () => {
  if (searchForm.value.delayMin && searchForm.value.delayMax) {
    const min = parseInt(searchForm.value.delayMin)
    const max = parseInt(searchForm.value.delayMax)
    
    // 验证输入值
    if (min >= max) {
      return
    }
    
    if (min < 1 || max > 60) {
      return
    }
    
    searchForm.value.delayRange = `${searchForm.value.delayMin}~${searchForm.value.delayMax}`
  }
}

// 更新博主表单的delayRange
const updateBloggerDelayRange = () => {
  if (bloggerForm.value.delayMin && bloggerForm.value.delayMax) {
    const min = parseInt(bloggerForm.value.delayMin)
    const max = parseInt(bloggerForm.value.delayMax)
    
    // 验证输入值
    if (min >= max) {
      alert('最小间隔时间必须小于最大间隔时间')
      return
    }
    
    if (min < 1 || max > 60) {
      alert('间隔时间必须在1-60秒之间')
      return
    }
  }
}

// 切换日志展开状态
const toggleLogExpanded = () => {
  isLogExpanded.value = !isLogExpanded.value
}

// 清空日志
const clearLogs = () => {
  processLogs.value = []
}

// 只允许输入数字
const onlyNumbers = (event) => {
  const char = String.fromCharCode(event.which)
  if (!/[0-9]/.test(char)) {
    event.preventDefault()
  }
}

// 组件挂载时获取表格列表
onMounted(() => {
  getTableMetaList()
})

// 组件卸载时关闭WebSocket
onUnmounted(() => {
  closeWebSocket()
})
</script>

<template>
  <div class="xiaohongshu-plugin">
    <!-- 工具列表视图 -->
    <div v-if="!activeToolId" class="tools-view">
      <!-- 返回按钮 -->
      <div class="back-section">
        <button @click="goBack" class="back-btn">
          ← 返回主页
        </button>
      </div>

      <!-- 工具网格 -->
      <div class="tools-grid">
        <div 
          v-for="tool in tools" 
          :key="tool.id" 
          class="tool-card"
          :class="{ 'tool-disabled': tool.disabled }"
          @click="showToolConfig(tool.id)"
        >
          <div class="tool-icon">{{ tool.icon }}</div>
          <div class="tool-content">
            <div class="tool-header">
              <h3 class="tool-title">{{ tool.title }}</h3>
              <span v-if="tool.disabled" class="status-badge">即将推出</span>
            </div>
            <p class="tool-description">{{ tool.description }}</p>
            <div class="tool-features">
              <span v-for="feature in tool.features" :key="feature" class="feature-tag">
                {{ feature }}
              </span>
            </div>
          </div>
          <div v-if="!tool.disabled" class="tool-arrow">→</div>
        </div>
      </div>
    </div>

    <!-- 笔记搜索抓取配置 -->
    <div v-if="activeToolId === 1" class="plugin-card">
      <div class="card-header">
        <button @click="backToTools" class="simple-back-btn">
          ← 返回
        </button>
        <span class="plugin-title">笔记搜索抓取</span>
      </div>

      <div class="plugin-form">
        <div class="form-item">
          <label>搜索关键词 <span class="required-mark">*</span></label>
          <input 
            v-model="searchForm.keyword" 
            type="text" 
            placeholder="关键字检索，多个关键词可用逗号（英文）分割开"
            class="form-input"
            :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
          />
        </div>
        
        <div class="form-item">
          <label>多维表格授权码 <span class="required-mark">*</span> 
            <a href="https://bytedance.larkoffice.com/sync/SdiGdL8ETsVRKjbDBDQcY1g8nrb?from=from_copylink" 
               target="_blank" 
               class="help-link" 
               title="点击查看获取操作指引">
              📖 获取指引
            </a>
          </label>
          <input 
            v-model="searchForm.personalBaseToken" 
            type="text" 
            placeholder="输入多维表格授权码"
            class="form-input"
            :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
          />
        </div>
        
        <div class="form-item">
          <label>Cookie配置 <span class="required-mark">*</span></label>
          <textarea 
            v-model="searchForm.cookie" 
            placeholder="输入小红书cookie（必填）"
            class="form-textarea"
            rows="3"
            :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
          ></textarea>
        </div>

        <div class="form-item">
          <label>笔记类型</label>
          <el-select 
            v-model="searchForm.noteType" 
            placeholder="请选择笔记类型"
            size="large"
            style="width: 100%"
            :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
          >
            <el-option label="全部" :value="0" />
            <el-option label="视频" :value="1" />
            <el-option label="图文" :value="2" />
          </el-select>
        </div>
        
        <div class="form-item">
          <label>排序方式</label>
          <el-select 
            v-model="searchForm.sort" 
            placeholder="请选择排序方式"
            size="large"
            style="width: 100%"
            :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
          >
            <el-option label="综合" value="general" />
            <el-option label="最新" value="time" />
            <el-option label="最热" value="popularity_descending" />
          </el-select>
        </div>

        <div class="form-item">
          <label>抓取数量</label>
          <input 
            v-model.number="searchForm.queryCount" 
            type="number" 
            :min="20"
            :max="500"
            :step="20"
            class="form-input"
            :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
          />
          <div class="form-tip">后端每页20条数据，将自动计算所需页数</div>
        </div>

        <div class="form-item">
          <label>请求间隔时间 <span class="required-mark">*</span></label>
          <div class="delay-range-input">
            <input 
              type="text" 
              v-model="searchForm.delayMin" 
              @input="updateDelayRange"
              @blur="updateDelayRange"
              @keypress="onlyNumbers"
              class="delay-input-left"
              placeholder="8"
              maxlength="3"
              :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
            />
            <span class="delay-separator">~</span>
            <input 
              type="text" 
              v-model="searchForm.delayMax" 
              @input="updateDelayRange"
              @blur="updateDelayRange"
              @keypress="onlyNumbers"
              class="delay-input-right"
              placeholder="20"
              :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
              maxlength="3"
            />
          </div>
          <div class="form-tip">设置每次请求之间的随机间隔时间，避免请求过于频繁</div>
        </div>

        <div class="form-item">
          <label>选择导入字段</label>
          <div class="field-selection">
            <div class="field-grid">
              <label 
                v-for="field in searchFieldOptions" 
                :key="field.key" 
                class="field-checkbox"
              >
                <input 
                  type="checkbox" 
                  v-model="field.checked"
                  :disabled="field.required || isProcessing"
                />
                <span class="field-text">{{ field.label }}</span>
                <span v-if="field.required" class="required-mark">*</span>
              </label>
            </div>
          </div>
        </div>

        <div class="form-item">
          <label>选择数据表 <span class="required-mark">*</span></label>
          <el-select 
            v-model="searchForm.selectedTableId" 
            placeholder="请选择要保存数据的表格"
            size="large"
            style="width: 100%"
            @focus="onTableSelectFocus"
            :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
          >
            <el-option
              v-for="table in tableMetaList"
              :key="table.id"
              :label="table.name"
              :value="table.id"
            />
          </el-select>
        </div>

        <div class="form-item">
          <button 
            @click="startExecution(1)" 
            :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
            class="execute-btn"
          >
            {{ isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped' ? '正在抓取数据...' : '开始执行' }}
          </button>
        </div>
        
        <!-- 执行过程中的停止按钮 -->
        <div v-if="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'" class="form-item">
          <button 
            @click="showStopConfirm = true" 
            class="enhanced-stop-btn"
          >
            停止抓取
          </button>
        </div>
        

      </div>

      <!-- 进度显示 -->
      <div v-if="isProcessing || processLogs.length > 0" class="progress-section">
        <div v-if="isProcessing" class="progress-header">
          <h4>抓取进度：{{ processProgress }}%</h4>
          <div class="progress-count">{{ processedCount }}/{{ totalCount }}</div>
        </div>
        <div v-if="isProcessing" class="progress-bar">
          <div class="progress-fill" :style="{ width: processProgress + '%' }"></div>
        </div>
        
        <!-- 附件上传进度 -->
        <div v-if="uploadProgress.total > 0" class="upload-progress-section">
          <div class="upload-progress-header">
            <h4>附件上传进度：{{ Math.round((uploadProgress.current / uploadProgress.total) * 100) }}%</h4>
            <div class="upload-progress-count">{{ uploadProgress.current }}/{{ uploadProgress.total }}</div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (uploadProgress.current / uploadProgress.total) * 100 + '%' }"></div>
          </div>
          <div v-if="uploadProgress.url" class="current-upload-url">
            <span class="upload-label">当前上传：</span>
            <span class="upload-url">{{ uploadProgress.url }}</span>
          </div>
        </div>
        
        <!-- 实时日志区域 -->
        <div class="latest-log-section">
           <div class="log-header">
              <span class="log-title">实时日志</span>
              <div class="log-actions">
                <button @click="clearLogs" class="clear-log-btn" title="清空日志">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button @click="toggleLogExpanded" class="log-toggle-btn">
                  <img v-if="!isLogExpanded" src="/src/static/icon-down.svg" class="toggle-icon" alt="展开">
                  <img v-else src="/src/static/icon-on.svg" class="toggle-icon" alt="收起">
                </button>
              </div>
            </div>
          
          <div v-if="processLogs.length > 0" class="current-log">
            <div class="log-entry">
              <span class="log-time">{{ processLogs[processLogs.length - 1].time }}</span>
              <span class="log-level" :class="getLogLevelClass(processLogs[processLogs.length - 1].level)">
                {{ formatLogLevel(processLogs[processLogs.length - 1].level) }}
              </span>
              <span class="log-content">{{ processLogs[processLogs.length - 1].message }}</span>
            </div>
          </div>
          <div v-else class="empty-log">
            <span class="search-icon">🔍</span>
            <span>搜索日志...</span>
          </div>
        </div>
        
        <!-- 实时日志 - 可展开/收起 -->
        <div v-if="isLogExpanded" class="log-section">
          <h5>实时日志</h5>
          <div class="log-container">
            <div 
              v-for="(log, index) in processLogs.slice(-50)" 
              :key="index"
              class="log-item"
              :class="getLogLevelClass(log.level)"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-level">[{{ formatLogLevel(log.level) }}]</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 博主笔记抓取配置 -->
    <div v-if="activeToolId === 2" class="plugin-card">
      <div class="card-header">
        <button @click="backToTools" class="simple-back-btn">
          ← 返回
        </button>
        <span class="plugin-title">博主笔记抓取</span>
      </div>

      <div class="plugin-form">
        <div class="form-item">
           <label>博主主页地址 <span class="required-mark">*</span></label>
           <input 
              v-model="bloggerForm.bloggerUrls" 
              type="text" 
              placeholder="输入博主主页地址"
              class="form-input"
            />
         </div>
        
        <div class="form-item">
          <label>多维表格授权码 <span class="required-mark">*</span> 
            <a href="https://bytedance.larkoffice.com/sync/SdiGdL8ETsVRKjbDBDQcY1g8nrb?from=from_copylink" 
               target="_blank" 
               class="help-link" 
               title="点击查看获取操作指引">
              📖 获取指引
            </a>
          </label>
          <input 
            v-model="bloggerForm.personalBaseToken" 
            type="text" 
            placeholder="输入多维表格授权码"
            class="form-input"
          />
        </div>
        
        <div class="form-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="bloggerForm.enableAttachmentUpload"
              class="form-checkbox"
            />
            <span class="checkbox-text">启用附件上传</span>
          </label>
          <div class="form-tip">启用后将图片URL上传到飞书云空间作为真实附件</div>
        </div>

        <div class="form-item">
          <label>Cookie配置 <span class="required-mark">*</span></label>
          <textarea 
            v-model="bloggerForm.cookie" 
            placeholder="输入小红书cookie（必填）"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>
        
        <!-- Coze Token现在从后端配置文件读取，不再需要前端输入 -->

        <div class="form-item">
          <label>请求间隔时间</label>
          <div class="delay-range-input">
            <input 
              type="text" 
              v-model="bloggerForm.delayMin" 
              @keypress="onlyNumbers"
              class="delay-input-left"
              placeholder="1"
              maxlength="2"
              :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
            />
            <span class="delay-separator">~</span>
            <input 
              type="text" 
              v-model="bloggerForm.delayMax" 
              @keypress="onlyNumbers"
              class="delay-input-right"
              placeholder="3"
              :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
              maxlength="2"
            />
          </div>
          <div class="form-tip">设置每次请求之间的随机间隔时间，避免请求过于频繁</div>
        </div>

        <div class="form-item">
           <label>选择导入字段</label>
           <div class="field-selection">
             <div class="field-grid">
               <label 
                 v-for="field in bloggerFieldOptions" 
                 :key="field.key" 
                 class="field-checkbox"
               >
                 <input 
                   type="checkbox" 
                   v-model="field.checked"
                   :disabled="field.required"
                 />
                 <span class="field-text">{{ field.label }}</span>
                 <span v-if="field.required" class="required-mark">*</span>
               </label>
             </div>
           </div>
         </div>

        <div class="form-item">
          <label>选择数据表 <span class="required-mark">*</span></label>
          <el-select 
            v-model="bloggerForm.selectedTableId" 
            placeholder="请选择要保存数据的表格"
            size="large"
            style="width: 100%"
            @focus="onTableSelectFocus"
          >
            <el-option
              v-for="table in tableMetaList"
              :key="table.id"
              :label="table.name"
              :value="table.id"
            />
          </el-select>
        </div>

        <div class="form-item">
          <button 
            @click="startExecution(2)" 
            :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
            class="execute-btn"
          >
            {{ isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped' ? '正在抓取数据...' : '开始执行' }}
          </button>
        </div>
        
        <!-- 执行过程中的停止按钮 -->
        <div v-if="isProcessing" class="form-item">
          <button 
            @click="showStopConfirm = true" 
            class="enhanced-stop-btn"
          >
            停止抓取
          </button>
        </div>
        

      </div>

      <!-- 进度显示 -->
      <div v-if="(isProcessing && activeToolId === 2) || (processLogs.length > 0 && activeToolId === 2)" class="progress-section">
        <div v-if="isProcessing" class="progress-header">
          <h4>抓取进度：{{ processProgress }}%</h4>
          <div class="progress-count">{{ processedCount }}/{{ totalCount }}</div>
        </div>
        <div v-if="isProcessing" class="progress-bar">
          <div class="progress-fill" :style="{ width: processProgress + '%' }"></div>
        </div>
        
        <!-- 实时日志区域 -->
        <div class="latest-log-section">
           <div class="log-header">
              <span class="log-title">实时日志</span>
              <div class="log-actions">
                <button @click="clearLogs" class="clear-log-btn" title="清空日志">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button @click="toggleLogExpanded" class="log-toggle-btn">
                  <img v-if="!isLogExpanded" src="/src/static/icon-down.svg" class="toggle-icon" alt="展开">
                  <img v-else src="/src/static/icon-on.svg" class="toggle-icon" alt="收起">
                </button>
              </div>
            </div>
          
          <div v-if="processLogs.length > 0" class="current-log">
            <div class="log-entry">
              <span class="log-time">{{ processLogs[processLogs.length - 1].time }}</span>
              <span class="log-level" :class="getLogLevelClass(processLogs[processLogs.length - 1].level)">
                {{ formatLogLevel(processLogs[processLogs.length - 1].level) }}
              </span>
              <span class="log-content">{{ processLogs[processLogs.length - 1].message }}</span>
            </div>
          </div>
          <div v-else class="empty-log">
            <span class="search-icon">🔍</span>
            <span>搜索日志...</span>
          </div>
        </div>
        
        <!-- 实时日志 - 可展开/收起 -->
        <div v-if="isLogExpanded" class="log-section">
          <h5>实时日志</h5>
          <div class="log-container">
            <div 
              v-for="(log, index) in processLogs.slice(-50)" 
              :key="index"
              class="log-item"
              :class="getLogLevelClass(log.level)"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-level">[{{ formatLogLevel(log.level) }}]</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
            <div v-if="processLogs.length === 0" class="no-logs">
              暂无日志信息
            </div>
          </div>
          

        </div>
      </div>
    </div>

    <!-- 笔记详情获取配置 -->
    <div v-if="activeToolId === 3" class="plugin-card">
      <div class="card-header">
        <button @click="backToTools" class="simple-back-btn">
          ← 返回
        </button>
        <span class="plugin-title">笔记详情获取</span>
      </div>

      <div class="plugin-form">
        <div class="form-item">
          <label>多维表格授权码 <span class="required-mark">*</span> 
            <a href="https://bytedance.larkoffice.com/sync/SdiGdL8ETsVRKjbDBDQcY1g8nrb?from=from_copylink" 
               target="_blank" 
               class="help-link" 
               title="点击查看获取操作指引">
              📖 获取指引
            </a>
          </label>
          <input 
            v-model="noteDetailForm.personalBaseToken" 
            type="text" 
            placeholder="输入多维表格授权码"
            class="form-input"
            :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
          />
        </div>
        
        <div class="form-item">
          <label>Cookie配置 <span class="required-mark">*</span></label>
          <textarea 
            v-model="noteDetailForm.cookie" 
            placeholder="输入小红书cookie（必填）"
            class="form-textarea"
            rows="3"
            :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
          ></textarea>
        </div>

        <!-- CozeToken现在从后端配置文件读取，不再需要前端输入 -->

        <div class="form-item">
          <label>数据表 <span class="required-mark">*</span></label>
          <el-select 
            v-model="noteDetailForm.selectedTableId" 
            placeholder="请选择数据表"
            size="large"
            style="width: 100%"
            :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
            @focus="onTableSelectFocus"
            @change="onNoteDetailTableChange"
          >
            <el-option 
              v-for="table in tableMetaList" 
              :key="table.id" 
              :label="table.name" 
              :value="table.id"
            />
          </el-select>
        </div>

        <div class="form-item">
          <label>笔记地址字段 <span class="required-mark">*</span></label>
          <el-select 
            v-model="noteDetailForm.noteUrlField" 
            placeholder="请先选择数据表，然后选择包含笔记地址的字段"
            size="large"
            style="width: 100%"
            :disabled="(isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped') || !noteDetailForm.selectedTableId"
            @focus="() => getTableFields(noteDetailForm.selectedTableId)"
          >
            <el-option 
              v-for="field in tableFields" 
              :key="field.id" 
              :label="field.name" 
              :value="field.name"
            />
          </el-select>
          <div class="form-tip">选择多维表格中包含小红书笔记地址的字段</div>
        </div>

        <!-- 数据处理配置区域 -->
        <div class="processing-config-container">
          <div class="config-header">
            <h3 class="config-title">数据处理配置</h3>
            <div class="config-subtitle">选择数据处理方式并进行相应配置</div>
          </div>
          
          <!-- Tab 样式的处理方式选择 -->
          <div class="processing-tabs">
            <button 
              class="tab-button"
              :class="{ active: noteDetailForm.processingMode === 'manual' }"
              @click="noteDetailForm.processingMode = 'manual'"
              :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
            >
              <svg class="tab-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              手动选择模式
            </button>
            <button 
              class="tab-button"
              :class="{ active: noteDetailForm.processingMode === 'filter' }"
              @click="noteDetailForm.processingMode = 'filter'"
              :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
            >
              <svg class="tab-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              字段过滤模式
            </button>
          </div>

          <!-- Tab 内容区域 -->
          <div class="tab-content">
            <!-- 手动选择模式配置 -->
            <div v-if="noteDetailForm.processingMode === 'manual'" class="tab-panel">
              <div class="panel-header">
                <h4 class="panel-title">手动选择记录</h4>
                <p class="panel-description">精确选择需要处理的具体记录</p>
              </div>
              <div class="manual-selection">
                <button 
                  @click="selectRecords" 
                  :disabled="(isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped') || !noteDetailForm.selectedTableId"
                  class="select-records-btn"
                >
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  选择要处理的记录
                </button>
                <div v-if="noteDetailForm.selectedRecordIds && noteDetailForm.selectedRecordIds.length > 0" class="selected-records-info">
                  <svg class="info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  已选择 <strong>{{ noteDetailForm.selectedRecordIds.length }}</strong> 条记录
                </div>
              </div>
            </div>

            <!-- 字段过滤模式配置 -->
            <div v-if="noteDetailForm.processingMode === 'filter'" class="tab-panel">
              <div class="panel-header">
                <h4 class="panel-title">字段过滤配置</h4>
                <p class="panel-description">根据字段内容自动筛选需要处理的记录</p>
              </div>
              <div class="filter-config">
                <label class="filter-label">过滤字段</label>
                <el-select 
                  v-model="noteDetailForm.filterFields" 
                  placeholder="请选择过滤字段（可选，支持多选）"
                  size="large"
                  style="width: 100%"
                  :disabled="(isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped') || !noteDetailForm.selectedTableId"
                  multiple
                  clearable
                  collapse-tags
                  collapse-tags-tooltip
                  @focus="() => getTableFields(noteDetailForm.selectedTableId)"
                >
                  <el-option 
                    v-for="field in tableFields" 
                    :key="field.id" 
                    :label="field.name" 
                    :value="field.name"
                  />
                </el-select>
                <div class="filter-tip">
                  <svg class="tip-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  选择的所有字段都为空时才获取笔记详情，任一字段不为空时跳过
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-item">
          <label>请求间隔时间（秒）</label>
          <div class="delay-range-input">
            <input 
              type="text" 
              v-model="noteDetailForm.delayMin" 
              @keypress="onlyNumbers"
              class="delay-input-left"
              placeholder="8"
              maxlength="2"
              :disabled="isProcessing"
            />
            <span class="delay-separator">~</span>
            <input 
              type="text" 
              v-model="noteDetailForm.delayMax" 
              @keypress="onlyNumbers"
              class="delay-input-right"
              placeholder="15"
              maxlength="2"
              :disabled="isProcessing"
            />
          </div>
          <div class="form-tip">设置获取笔记详情的时间间隔，避免请求过于频繁</div>
        </div>

        <div class="form-item">
          <label>选择导入字段</label>
          <div class="field-selection">
            <div class="field-grid">
              <label 
                v-for="field in noteDetailFieldOptions" 
                :key="field.key" 
                class="field-checkbox"
              >
                <input 
                  type="checkbox" 
                  v-model="field.checked"
                  :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
                />
                <span class="field-text">{{ field.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="form-item">
          <button 
            @click="startExecution(3)" 
            :disabled="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'"
            class="execute-btn"
          >
            {{ isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped' ? '正在获取详情...' : '开始执行' }}
          </button>
        </div>
        
        <!-- 执行过程中的停止按钮 -->
        <div v-if="isProcessing && processStatus !== 'completed' && processStatus !== 'failed' && processStatus !== 'stopped'" class="form-item">
          <button 
            @click="showStopConfirm = true" 
            class="enhanced-stop-btn"
          >
            停止获取
          </button>
        </div>
      </div>

      <!-- 进度显示 -->
      <div v-if="(isProcessing && activeToolId === 3) || (processLogs.length > 0 && activeToolId === 3)" class="progress-section">
        <div v-if="isProcessing" class="progress-header">
          <h4>获取进度：{{ processProgress }}%</h4>
          <div class="progress-count">{{ processedCount }}/{{ totalCount }}</div>
        </div>
        <div v-if="isProcessing" class="progress-bar">
          <div class="progress-fill" :style="{ width: processProgress + '%' }"></div>
        </div>
        
        <!-- 实时日志区域 -->
        <div class="latest-log-section">
           <div class="log-header">
              <span class="log-title">实时日志</span>
              <div class="log-actions">
                <button @click="clearLogs" class="clear-log-btn" title="清空日志">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button @click="toggleLogExpanded" class="log-toggle-btn">
                  <img v-if="!isLogExpanded" src="/src/static/icon-down.svg" class="toggle-icon" alt="展开">
                  <img v-else src="/src/static/icon-on.svg" class="toggle-icon" alt="收起">
                </button>
              </div>
            </div>
          
          <div v-if="processLogs.length > 0" class="current-log">
            <div class="log-entry">
              <span class="log-time">{{ processLogs[processLogs.length - 1].time }}</span>
              <span class="log-level" :class="getLogLevelClass(processLogs[processLogs.length - 1].level)">
                {{ formatLogLevel(processLogs[processLogs.length - 1].level) }}
              </span>
              <span class="log-content">{{ processLogs[processLogs.length - 1].message }}</span>
            </div>
          </div>
          <div v-else class="empty-log">
            <span class="search-icon">🔍</span>
            <span>获取日志...</span>
          </div>
        </div>
        
        <!-- 实时日志 - 可展开/收起 -->
        <div v-if="isLogExpanded" class="log-section">
          <h5>实时日志</h5>
          <div class="log-container">
            <div 
              v-for="(log, index) in processLogs.slice(-50)" 
              :key="index"
              class="log-item"
              :class="getLogLevelClass(log.level)"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-level">[{{ formatLogLevel(log.level) }}]</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
            <div v-if="processLogs.length === 0" class="no-logs">
              暂无日志信息
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 停止确认弹窗 -->
    <div v-if="showStopConfirm" class="modal-overlay" @click="showStopConfirm = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isTaskCompleted ? '任务完成' : '确认停止' }}</h3>
          <button @click="showStopConfirm = false; isTaskCompleted = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <p>{{ isTaskCompleted ? '抓取任务已完成！是否停止当前任务？' : '确定要停止当前的抓取任务吗？' }}</p>
          <div class="modal-actions">
            <button @click="showStopConfirm = false; isTaskCompleted = false" class="cancel-btn">{{ isTaskCompleted ? '继续' : '取消' }}</button>
            <button @click="stopExecution" class="confirm-btn">{{ isTaskCompleted ? '确认停止' : '确认停止' }}</button>
          </div>
        </div>
      </div>
    </div>


    

  </div>
</template>

<style scoped>
.xiaohongshu-plugin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.back-section {
  margin-bottom: 30px;
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.back-btn:hover {
  background: #e5e7eb;
  transform: translateX(-2px);
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
}

.tool-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 2px solid transparent;
}

.tool-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.tool-card.tool-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tool-card.tool-disabled:hover {
  transform: none;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-color: transparent;
}

.tool-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.tool-content {
  flex: 1;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.tool-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.status-badge {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tool-description {
  margin: 0 0 16px 0;
  color: #6b7280;
  line-height: 1.5;
}

.tool-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-tag {
  background: #eff6ff;
  color: #2563eb;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tool-arrow {
  font-size: 1.5rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.plugin-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 30px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.simple-back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.simple-back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.plugin-title {
  font-size: 1.5rem;
  font-weight: 600;
  flex: 1;
}

.process-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.process-status-inline {
  margin-top: 20px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.status-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.status-text {
  color: #059669;
  font-weight: 500;
  font-size: 0.9rem;
}

.progress-info {
  color: #64748b;
  font-size: 0.85rem;
}

.latest-log {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 12px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  line-height: 1.4;
}

.log-time {
  color: #64748b;
  font-size: 0.8rem;
  min-width: 80px;
}

.log-level {
  font-weight: 500;
  min-width: 50px;
}

.log-message {
  flex: 1;
  color: #374151;
}

.log-info .log-level {
  color: #3b82f6;
}

.log-warn .log-level {
  color: #f59e0b;
}

.log-error .log-level {
  color: #ef4444;
}

.log-debug .log-level {
  color: #64748b;
}

.stop-btn {
  transition: all 0.2s ease;
}

.stop-btn:hover {
  background: #dc2626 !important;
  transform: translateY(-1px);
}

.info-btn, .stop-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

/* 进程按钮组样式 */
.process-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.process-buttons .stop-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  flex: 1;
}

.process-buttons .stop-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}





/* 间隔时间范围输入样式 */
.delay-range-input {
  display: flex;
  align-items: center;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 0;
  background-color: #fff;
  transition: border-color 0.2s;
  height: 40px;
  width: 100%;
}

.delay-range-input:hover {
  border-color: #c0c4cc;
}

.delay-range-input:focus-within {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.delay-input-left,
.delay-input-right {
  width: 40%;
  min-width: 40px;
  border: none;
  outline: none;
  padding: 8px 12px;
  font-size: 14px;
  text-align: center;
  background: transparent;
}

.delay-input-left {
  border-radius: 4px 0 0 4px;
}

.delay-input-right {
  border-radius: 0 4px 4px 0;
}

.delay-separator {
  color: #606266;
  font-weight: 500;
  padding: 0 8px;
  user-select: none;
  background-color: #f5f7fa;
  border-left: 1px solid #e4e7ed;
  border-right: 1px solid #e4e7ed;
}

/* 最新日志区域样式 */
.latest-log-section {
  margin-top: 16px;
}

.log-header {
   display: flex;
   align-items: center;
   justify-content: space-between;
   margin-bottom: 8px;
 }
 
 .log-title {
   font-size: 14px;
   font-weight: 500;
   color: #333;
 }
 
 .log-actions {
   display: flex;
   align-items: center;
   gap: 8px;
 }
 
 .clear-log-btn {
   background: none;
   border: none;
   cursor: pointer;
   padding: 4px;
   color: #666;
   display: flex;
   align-items: center;
   border-radius: 4px;
   transition: all 0.2s ease;
 }
 
 .clear-log-btn:hover {
   background-color: #f5f7fa;
   color: #409eff;
 }
 
 .log-toggle-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
  }
  
  .toggle-icon {
    width: 16px;
    height: 16px;
    transition: opacity 0.2s ease;
  }
  
  .toggle-icon:hover {
    opacity: 0.7;
  }
  
  .current-log {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 16px 20px;
    margin-bottom: 4px;
    min-height: 60px;
  }

.log-entry {
   display: flex;
   align-items: center;
   gap: 10px;
   font-size: 14px;
   line-height: 1.6;
   padding: 4px 0;
 }
 
 .log-time {
   color: #999;
   font-size: 12px;
   min-width: 85px;
 }
 
 .log-level {
   font-weight: 500;
   font-size: 12px;
   padding: 2px 6px;
   border-radius: 3px;
   min-width: 45px;
   text-align: center;
 }
 
 .log-content {
   color: #333;
   flex: 1;
   font-size: 13px;
 }

.empty-log {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #999;
  font-size: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.search-icon {
   font-size: 12px;
 }

.log-toggle-btn:hover {
  color: #409eff;
  border-color: #409eff;
  background-color: #ecf5ff;
}

.log-toggle-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.progress-percentage {
   color: #409eff;
   font-weight: 500;
   margin-left: 8px;
 }

 /* 停止确认弹窗样式 */
 .modal-overlay {
   position: fixed;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   background-color: rgba(0, 0, 0, 0.5);
   display: flex;
   justify-content: center;
   align-items: center;
   z-index: 1000;
 }
 
 .modal-content {
   background: white;
   border-radius: 8px;
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
   max-width: 400px;
   width: 90%;
   max-height: 80vh;
   overflow-y: auto;
 }
 
 .modal-header {
   display: flex;
   justify-content: space-between;
   align-items: center;
   padding: 16px 20px;
   border-bottom: 1px solid #e2e8f0;
 }
 
 .modal-header h3 {
   margin: 0;
   color: #374151;
   font-size: 1.1rem;
 }
 
 .close-btn {
   background: none;
   border: none;
   font-size: 1.5rem;
   color: #6b7280;
   cursor: pointer;
   padding: 0;
   width: 24px;
   height: 24px;
   display: flex;
   align-items: center;
   justify-content: center;
 }
 
 .close-btn:hover {
   color: #374151;
 }
 
 .modal-body {
   padding: 20px;
 }
 
 .modal-body p {
   margin: 0 0 20px 0;
   color: #4b5563;
   line-height: 1.5;
 }
 
 .modal-actions {
   display: flex;
   gap: 12px;
   justify-content: flex-end;
 }
 
 .cancel-btn, .confirm-btn {
   padding: 8px 16px;
   border: none;
   border-radius: 4px;
   cursor: pointer;
   font-size: 0.9rem;
   transition: all 0.2s;
 }
 
 .cancel-btn {
   background: #f3f4f6;
   color: #374151;
 }
 
 .cancel-btn:hover {
   background: #e5e7eb;
 }
 
 .confirm-btn {
   background: #ef4444;
   color: white;
 }
 
 .confirm-btn:hover {
   background: #dc2626;
 }
 
 .info-btn:hover {
   background: rgba(255, 255, 255, 0.3);
}

.stop-btn:hover {
  background: rgba(239, 68, 68, 0.8);
}

.plugin-form {
  padding: 30px;
}

.form-item {
  margin-bottom: 24px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.required-mark {
  color: #ef4444;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled, .form-textarea:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-tip {
  margin-top: 4px;
  font-size: 0.8rem;
  color: #6b7280;
}

.field-selection {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-height: 32px;
}

.field-checkbox:hover {
  background: #e5e7eb;
}

.field-checkbox input[type="checkbox"] {
  margin: 0;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  vertical-align: middle;
}

.field-text {
  font-size: 0.9rem;
  color: #374151;
}

.execute-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.execute-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.execute-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.progress-section {
  padding: 20px 30px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-header h4 {
  margin: 0;
  color: #374151;
}

.progress-text {
  font-weight: 600;
  color: #3b82f6;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  transition: width 0.3s ease;
}

.progress-header {
   display: flex;
   justify-content: space-between;
   align-items: center;
   margin-bottom: 12px;
 }

 .progress-count {
   background: #f3f4f6;
   color: #374151;
   padding: 8px 16px;
   border-radius: 6px;
   font-size: 0.9rem;
   font-weight: 500;
   border: 1px solid #e5e7eb;
 }
 


.log-section {
  margin-top: 20px;
}

.log-section h5 {
  margin: 0 0 10px 0;
  color: #374151;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px;
}

.log-item {
  display: flex;
  gap: 10px;
  padding: 4px 0;
  font-size: 0.8rem;
  font-family: 'Courier New', monospace;
  border-bottom: 1px solid #f3f4f6;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #6b7280;
  flex-shrink: 0;
}

.log-level {
  font-weight: 600;
  flex-shrink: 0;
  width: 60px;
}

.log-message {
  flex: 1;
}

.log-info .log-level {
  color: #3b82f6;
}

.log-warn .log-level {
  color: #f59e0b;
}

.log-error .log-level {
  color: #ef4444;
}

.log-debug .log-level {
  color: #6b7280;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #374151;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 20px;
}

.process-info {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 500;
  color: #374151;
}

.status-connected {
  color: #10b981;
  font-weight: 500;
}

.status-disconnected {
  color: #ef4444;
  font-weight: 500;
}

.status-running {
  color: #3b82f6;
  font-weight: 500;
}

.status-completed {
  color: #10b981;
  font-weight: 500;
}

.status-failed {
  color: #ef4444;
  font-weight: 500;
}

.status-stopped {
  color: #f59e0b;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}



.refresh-btn, .cancel-btn, .confirm-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.refresh-btn {
  background: #f3f4f6;
  color: #374151;
  padding: 8px 12px;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  background: #e5e7eb;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.confirm-btn {
  background: #ef4444;
  color: white;
}

.confirm-btn:hover {
  background: #dc2626;
}

/* 增强的停止按钮样式 - 与开始执行按钮保持一致 */
.enhanced-stop-btn {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.enhanced-stop-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(248, 113, 113, 0.3);
}

/* 附件上传进度样式 */
.upload-progress-section {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.upload-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.upload-progress-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.upload-progress-count {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.current-upload-url {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.upload-label {
  font-weight: 500;
  margin-right: 4px;
}

.upload-url {
  word-break: break-all;
  color: #3b82f6;
}

.enhanced-stop-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 数据处理配置容器样式 */
.processing-config-container {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.config-header {
  margin-bottom: 20px;
  text-align: center;
}

.config-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.config-subtitle {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  font-weight: 400;
}

/* Tab 样式 */
.processing-tabs {
  display: flex;
  background: #ffffff;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 20px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-button:hover:not(:disabled) {
  color: #475569;
  background: #f8fafc;
}

.tab-button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.tab-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-icon {
  width: 18px;
  height: 18px;
}

/* Tab 内容区域 */
.tab-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-panel {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-title {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.panel-description {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
}

/* 手动选择样式 */
.manual-selection {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.select-records-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

.select-records-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.select-records-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.selected-records-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1px solid #3b82f6;
  border-radius: 8px;
  color: #1e40af;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
}

.info-icon {
  width: 16px;
  height: 16px;
  color: #3b82f6;
}

/* 字段过滤配置样式 */
.filter-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.filter-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  font-size: 13px;
  color: #92400e;
  line-height: 1.4;
}

.tip-icon {
  width: 16px;
  height: 16px;
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 1px;
}

/* 帮助链接样式 */
.help-link {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  padding: 2px 6px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(16, 185, 129, 0.2);
}

.help-link:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
  text-decoration: none;
  color: white;
}

.help-link:active {
  transform: translateY(0);
}

</style>