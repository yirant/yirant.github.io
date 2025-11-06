<template>
  <div class="mysql-table-container">
    <!-- 范围信息显示 -->
    <div v-if="showRangeInfo" class="range-info">
      <span class="range-badge">
        📊 {{ rangeInfo }}
      </span>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <!-- 搜索面板 -->
      <div class="search-panel">
        <div class="search-row">
          <div class="search-group-full">
            <div class="search-input-wrapper-full">
              <input
                id="search-input"
                v-model="searchText"
                placeholder="输入关键词搜索，用空格分隔多个关键词..."
                :disabled="loading"
                class="search-input-full"
              />
              <button 
                v-if="searchText" 
                @click="clearSearch" 
                class="clear-search-btn"
                title="清除搜索"
              >
                ✕
              </button>
            </div>
          </div>
          
          <!-- 每页显示条数选择 -->
          <div class="page-size-selector">
            <select
              id="page-size-select"
              v-model="pageSize"
              @change="onPageSizeChange"
              :disabled="loading"
              class="page-size-select"
            >
              <option value="10">显示 10 条</option>
              <option value="20">显示 20 条</option>
            </select>
          </div>

          <!-- 刷新按钮 -->
          <button 
            @click="refreshData" 
            :disabled="loading"
            class="btn btn-info refresh-btn"
            title="刷新数据"
          >
            <span v-if="loading">🔄</span>
            <span v-else>🔄 刷新</span>
          </button>
        </div>
      </div>

      <!-- 搜索统计 -->
      <div v-if="hasSearch" class="search-stats">
        <div class="search-info">
          <span class="search-badge">
            🔍 搜索结果:  {{ displayData.length }} / {{ filteredData.length }} 
          </span>
          <span class="search-query">
            关键词 "<strong>{{ searchTerms.join(', ') }}</strong>"
          </span>
        </div>
        <button 
          @click="clearSearch" 
          class="btn-link"
          title="清除搜索条件"
        >
          清除
        </button>
      </div>
    </div>

    <!-- 状态显示 -->
    <div v-if="statusMessage" :class="['status-message', statusType]">
      <div class="status-content">
        <span class="status-icon">
          <span v-if="statusType === 'loading'">⏳</span>
          <span v-else-if="statusType === 'error'">❌</span>
          <span v-else-if="statusType === 'success'">✅</span>
          <span v-else>ℹ️</span>
        </span>
        <span class="status-text">{{ statusMessage }}</span>
        <span v-if="performanceInfo" class="performance-info">{{ performanceInfo }}</span>
      </div>
    </div>

    <!-- 数据表格 -->
    <div v-if="!loading && displayData.length > 0" class="data-section">
      <div class="table-header">
        <h4>数据记录</h4>
        <div class="table-info">
          <span v-if="!hasSearch">共 {{ data.length }} 条记录</span>
          <span v-else>搜索到 {{ filteredData.length }} 条记录</span>
          <span>•</span>
          <span>最后更新: {{ lastUpdate }}</span>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th 
                v-for="column in displayedColumns" 
                :key="column"
                :title="getColumnTitle(column)"
              >
                <div class="column-header">
                  {{ getColumnDisplayName(column) }}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in displayData" :key="index">
              <td v-for="column in displayedColumns" :key="column">
                <span 
                  class="cell-text"
                  v-html="highlightSearch(row[column])"
                ></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页控件 -->
      <div class="pagination-section">
        <div class="pagination-info">
          显示第 {{ startIndex }} - {{ endIndex }} 条记录
          <span v-if="hasSearch">(搜索到 {{ filteredData.length }} 条)</span>
          <span v-else>共 {{ data.length }} 条</span>
        </div>
        
        <div class="pagination-controls">
          <button 
            @click="goToPage(1)" 
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            ⏮️ 首页
          </button>
          
          <button 
            @click="goToPage(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            ◀️ 上一页
          </button>

          <div class="page-numbers">
            <span 
              v-for="page in visiblePages" 
              :key="page"
              :class="['page-number', { active: page === currentPage }]"
              @click="goToPage(page)"
            >
              {{ page }}
            </span>
          </div>

          <button 
            @click="goToPage(currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            下一页 ▶️
          </button>
          
          <button 
            @click="goToPage(totalPages)" 
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            末页 ⏭️
          </button>
        </div>

        <div class="page-jump">
          <span>跳转到:</span>
          <input 
            type="number" 
            v-model.number="jumpPage" 
            :min="1" 
            :max="totalPages"
            @keyup.enter="goToPage(jumpPage)"
          >
          <span>/ {{ totalPages }} 页</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading && hasSearch && displayData.length === 0" class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">🔍</div>
        <h4>未找到匹配的记录</h4>
        <p>没有找到包含 "<strong>{{ searchText }}</strong>" 的记录</p>
        <button @click="clearSearch" class="btn btn-primary">查看所有数据</button>
      </div>
    </div>

    <!-- 初始状态 -->
    <div v-else-if="!loading" class="initial-state">
      <div class="initial-content">
        <div class="initial-icon">📊</div>
        <h4>数据加载完成</h4>
        <p>共 {{ data.length }} 条记录</p>
        <div class="feature-list">
          <div class="feature-item">
            <span class="feature-icon">🔍</span>
            <span>在结果中搜索</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📋</span>
            <span>分页浏览数据</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

// Props 定义
const props = defineProps({
  tableName: {
    type: String,
    required: true
  },
  fields: {
    type: String,
    default: ''
  },
  orderBy: {
    type: String,
    default: ''
  },
  fieldAliases: {
    type: Object,
    default: () => ({})
  },
  // 新增：数据范围控制
  dataRange: {
    type: [String, Number, Object],
    default: null
  }
})

// API 配置
const API_BASE = 'https://api.yirant.com/api'

// 响应式数据
const data = ref([])
const availableFields = ref([])
const loading = ref(false)
const error = ref('')
const lastUpdate = ref('')
const currentPage = ref(1)
const jumpPage = ref(1)
const performanceInfo = ref('')
const pageSize = ref(10) // 默认10条

// 搜索相关
const searchText = ref('')

// 范围信息
const rangeInfo = ref('')
const showRangeInfo = ref(false)

// 计算属性
const displayedColumns = computed(() => {
  if (props.fields) {
    return props.fields.split(',').map(field => field.trim()).filter(field => field)
  }
  return availableFields.value
})

const hasSearch = computed(() => {
  return searchText.value.trim() !== ''
})

const searchTerms = computed(() => {
  return searchText.value.trim().split(/\s+/).filter(term => term.length > 0)
})

const filteredData = computed(() => {
  let result = data.value

  // 应用搜索过滤
  if (hasSearch.value) {
    const terms = searchTerms.value
    result = result.filter(row => {
      return terms.every(term => {
        const searchTerm = term.toLowerCase()
        return Object.values(row).some(value => 
          String(value || '').toLowerCase().includes(searchTerm)
        )
      })
    })
  }

  // 应用数据范围限制
  const rangeConfig = parseDataRange(props.dataRange)
  if (rangeConfig.type === 'limit') {
    // 限制条数
    result = result.slice(0, rangeConfig.value)
  } else if (rangeConfig.type === 'days' && rangeConfig.dateField) {
    // 按日期范围过滤
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - rangeConfig.value)
    
    result = result.filter(row => {
      const rowDate = parseDate(row[rangeConfig.dateField])
      return rowDate && rowDate >= cutoffDate
    })
  }

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / pageSize.value)
})

const displayData = computed(() => {
  // 分页显示数据
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredData.value.slice(startIndex, endIndex)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageSize.value + 1
})

const endIndex = computed(() => {
  return Math.min(currentPage.value * pageSize.value, filteredData.value.length)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

const statusMessage = computed(() => {
  if (loading.value) return '正在查询数据...'
  if (error.value) return error.value
  if (hasSearch.value && filteredData.value.length === 0) return `未找到包含 "${searchText.value}" 的记录`
  if (filteredData.value.length === 0) return '表中暂无数据'
  
  let message = '数据加载完成'
  const rangeConfig = parseDataRange(props.dataRange)
  
  // if (rangeConfig.type === 'limit') {
  //   message += ` (显示最新 ${rangeConfig.value} 条)`
  // } else if (rangeConfig.type === 'days') {
  //   message += ` (显示最近 ${rangeConfig.value} 天)`
  // }
  
  return message
})

const statusType = computed(() => {
  if (loading.value) return 'loading'
  if (error.value) return 'error'
  if (hasSearch.value && filteredData.value.length === 0) return 'empty'
  if (filteredData.value.length === 0) return 'empty'
  if (filteredData.value.length > 0) return 'success'
  return 'info'
})

// 方法
function parseDataRange(dataRange) {
  if (!dataRange) {
    return { type: 'none' }
  }

  // 如果是数字或数字字符串，认为是限制条数
  if (typeof dataRange === 'number' || /^\d+$/.test(dataRange)) {
    return {
      type: 'limit',
      value: parseInt(dataRange)
    }
  }

  // 如果是字符串，尝试解析 "7d" 或 "30d" 格式
  if (typeof dataRange === 'string' && dataRange.endsWith('d')) {
    const days = parseInt(dataRange)
    if (!isNaN(days)) {
      return {
        type: 'days',
        value: days,
        dateField: 'time' // 默认时间字段
      }
    }
  }

  // 如果是对象，支持更详细的配置
  if (typeof dataRange === 'object') {
    if (dataRange.limit) {
      return {
        type: 'limit',
        value: dataRange.limit
      }
    } else if (dataRange.days) {
      return {
        type: 'days',
        value: dataRange.days,
        dateField: dataRange.dateField || 'time'
      }
    }
  }

  return { type: 'none' }
}

function parseDate(dateString) {
  if (!dateString) return null
  
  try {
    // 尝试多种日期格式
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

function highlightSearch(value) {
  if (!hasSearch.value) {
    return formatCellValue(value)
  }
  
  const strValue = String(value || '')
  let highlighted = strValue
  
  // 对每个搜索词进行高亮
  searchTerms.value.forEach(term => {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi')
    highlighted = highlighted.replace(regex, '<mark class="search-highlight">$1</mark>')
  })
  
  return formatCellValue(highlighted)
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getColumnDisplayName(column) {
  // 如果有自定义别名，使用别名，否则使用默认格式化
  return props.fieldAliases[column] || formatColumnName(column)
}

function getColumnTitle(column) {
  // 鼠标悬停时显示原始字段名
  return column
}

async function fetchData() {
  loading.value = true
  error.value = ''
  performanceInfo.value = ''
  showRangeInfo.value = false

  try {
    const startTime = Date.now()
    
    const params = new URLSearchParams({
      table: props.tableName
      // 不传递 limit 参数，让后端返回所有数据
    })

    if (props.fields) {
      params.append('fields', props.fields)
    }

    if (props.orderBy) {
      params.append('orderBy', props.orderBy)
    }

    const response = await fetch(`${API_BASE}/data?${params}`)
    const result = await response.json()

    const endTime = Date.now()
    performanceInfo.value = `查询耗时: ${endTime - startTime}ms`

    if (result.success) {
      data.value = result.data
      
      // 更新可用字段列表
      if (data.value.length > 0 && availableFields.value.length === 0) {
        availableFields.value = Object.keys(data.value[0])
      }
      
      lastUpdate.value = new Date().toLocaleString('zh-CN')
      
      // 设置范围信息显示
      const rangeConfig = parseDataRange(props.dataRange)
      if (rangeConfig.type === 'limit') {
        rangeInfo.value = `显示最新 ${rangeConfig.value} 条记录`
        showRangeInfo.value = true
      } else if (rangeConfig.type === 'days') {
        rangeInfo.value = `显示最近 ${rangeConfig.value} 天记录`
        showRangeInfo.value = true
      }
    } else {
      throw new Error(result.error)
    }
  } catch (err) {
    error.value = err.message
    data.value = []
    availableFields.value = []
  } finally {
    loading.value = false
  }
}

function clearSearch() {
  searchText.value = ''
  currentPage.value = 1
}

function refreshData() {
  fetchData()
}

function goToPage(page) {
  if (page !== '...' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    jumpPage.value = page
  }
}

function onPageSizeChange() {
  currentPage.value = 1
  // 由于是客户端搜索，不需要重新请求数据
}

function formatCellValue(value) {
  // 直接显示原始字符串，不进行任何格式化
  if (value === null || value === undefined) return 'NULL'
  
  const str = String(value)
  
  // 检测是否是 ISO 时间格式（包含 T 和 Z）
  if (str.includes('T') && str.includes('Z')) {
    try {
      // 将 UTC 时间转换为本地时间
      const date = new Date(str)
      // 格式化为 "YYYY-MM-DD HH:mm:ss" 格式
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } catch (e) {
      // 如果转换失败，返回原始字符串
      return str
    }
  }
  
  return str
}

function formatColumnName(column) {
  return column.replace(/_/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase())
}

// 监听当前页变化
watch(currentPage, (newPage) => {
  jumpPage.value = newPage
})

// 监听跳转页变化
watch(jumpPage, (newJumpPage) => {
  if (newJumpPage >= 1 && newJumpPage <= totalPages.value) {
    currentPage.value = newJumpPage
  }
})

// 监听 props 变化
watch(() => props.tableName, () => {
  currentPage.value = 1
  clearSearch()
  fetchData()
})

watch(() => props.fields, () => {
  fetchData()
})

watch(() => props.orderBy, () => {
  fetchData()
})

watch(() => props.dataRange, () => {
  currentPage.value = 1
  fetchData()
})

// 监听搜索文本变化，实时搜索
watch(searchText, () => {
  currentPage.value = 1
})

// 生命周期
onMounted(async () => {
  await fetchData()
})
</script>

<style scoped>
.mysql-table-container {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 24px 0;
}

/* 范围信息样式 */
.range-info {
  padding: 12px 24px;
  background: #f0f9ff;
  border-bottom: 1px solid #bae6fd;
}

.range-badge {
  background: #0ea5e9;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

/* 控制面板样式 */
.control-panel {
  background: #f8fafc;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
}

/* 搜索面板样式 */
.search-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.search-group-full {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-input-wrapper-full {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-input-full {
  padding: 12px 16px;
  padding-right: 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  width: 100%;
}

.search-input-full:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 14px;
}

.clear-search-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* 每页显示条数选择器 */
.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.page-size-selector label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.page-size-select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  min-width: 100px;
}

/* 刷新按钮 */
.refresh-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-info {
  background: #06b6d4;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #0891b2;
}

/* 搜索统计 */
.search-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #eff6ff;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #dbeafe;
}

.search-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-badge {
  background: #3b82f6;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.search-query {
  color: #374151;
  font-size: 14px;
}

.btn-link {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
}

.btn-link:hover {
  color: #374151;
}

/* 按钮样式 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

/* 状态消息样式 */
.status-message {
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.status-message.loading {
  background: #fffbeb;
  border-color: #fcd34d;
}

.status-message.error {
  background: #fef2f2;
  border-color: #fecaca;
}

.status-message.success {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.status-message.info {
  background: #f0f9ff;
  border-color: #bae6fd;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-icon {
  font-size: 18px;
}

.status-text {
  flex: 1;
  font-weight: 500;
}

.performance-info {
  font-size: 12px;
  color: #6b7280;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
}

/* 数据表格样式 */
.data-section {
  padding: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.table-info {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #6b7280;
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 600px;
}

.data-table th {
  background: #f8fafc;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  position: sticky;
  top: 0;
  white-space: nowrap;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
}

.data-table tr:hover {
  background: #f9fafb;
}

/* 单元格样式 */
.cell-text {
  word-break: break-word;
  max-width: 300px;
}

/* 搜索高亮 */
:deep(.search-highlight) {
  background: #fef3c7;
  padding: 2px 1px;
  border-radius: 2px;
  font-weight: bold;
}

/* 分页样式 */
.pagination-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

.pagination-info {
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  min-width: 40px;
  text-align: center;
  transition: all 0.2s;
}

.page-number:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.page-number.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.page-jump {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
}

.page-jump input {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
}

/* 空状态和初始状态 */
.empty-state, .initial-state {
  padding: 60px 24px;
  text-align: center;
}

.empty-content, .initial-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon, .initial-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h4, .initial-state h4 {
  margin: 0 0 8px 0;
  color: #374151;
}

.empty-state p, .initial-state p {
  margin: 0 0 20px 0;
  color: #6b7280;
}

.feature-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
}

.feature-icon {
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .page-size-selector {
    width: 100%;
    justify-content: space-between;
  }
  
  .refresh-btn {
    width: 100%;
    justify-content: center;
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .pagination-controls {
    flex-direction: column;
    gap: 12px;
  }
  
  .feature-list {
    grid-template-columns: 1fr;
  }
  
  .data-table {
    font-size: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 12px;
  }

  .search-stats {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .search-input-full {
    font-size: 14px;
    padding: 10px 14px;
    padding-right: 36px;
  }
}
</style>