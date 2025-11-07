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
            :disabled="loading || isRefreshDisabled"
            class="btn btn-info refresh-btn"
            title="刷新数据（刷新间隔至少1秒）"
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

    <!-- 数据统计面板 -->
    <div v-if="showStatistics && filteredData.length > 0" class="statistics-panel">
      <div class="statistics-header">
        <h4 class="statistics-title">📈 数据统计</h4>
      </div>
      <div class="statistics-content">
        <!-- 如果存在 itemName 字段，显示按道具分组统计 -->
        <div v-if="hasItemNameField" class="stat-item-group">
          <div class="stat-group-header">
            <span class="stat-label">按道具统计 (共 {{ itemStatistics.length }} 项):</span>
          </div>
          <div class="item-statistics">
            <div 
              v-for="(item, index) in paginatedItemStatistics" 
              :key="item.name"
              class="item-stat-item"
            >
              <span class="item-name">{{ item.name }}</span>
              <span class="item-count">{{ item.count }}</span>
            </div>
          </div>
          <!-- 道具统计分页 -->
          <div v-if="itemStatisticsPages > 1" class="statistics-pagination">
            <button 
              @click="goToItemPage(itemStatisticsCurrentPage - 1)" 
              :disabled="itemStatisticsCurrentPage === 1"
              class="pagination-btn"
            >
              ◀️ 上一页
            </button>
            <span class="pagination-info">
              第 {{ itemStatisticsCurrentPage }} / {{ itemStatisticsPages }} 页
            </span>
            <button 
              @click="goToItemPage(itemStatisticsCurrentPage + 1)" 
              :disabled="itemStatisticsCurrentPage === itemStatisticsPages"
              class="pagination-btn"
            >
              下一页 ▶️
            </button>
          </div>
        </div>

        <!-- 高品质 蓝宝石 玩家排名统计 -->
        <div v-if="hasItemNameField && hasPcNameField" class="stat-item-group">
          <div class="stat-group-header">
            <span class="stat-label">"高品质 蓝宝石" 玩家排名 (共 {{ gemPlayerStatistics.length }} 名):</span>
          </div>
          <div class="item-statistics">
            <div 
              v-for="(player, index) in paginatedGemPlayerStatistics" 
              :key="player.name"
              class="item-stat-item"
            >
              <span class="item-name">{{ player.name }}</span>
              <span class="item-count">{{ player.count }}</span>
            </div>
          </div>
          <!-- 玩家排名分页 -->
          <div v-if="gemPlayerStatisticsPages > 1" class="statistics-pagination">
            <button 
              @click="goToGemPlayerPage(gemPlayerCurrentPage - 1)" 
              :disabled="gemPlayerCurrentPage === 1"
              class="pagination-btn"
            >
              ◀️ 上一页
            </button>
            <span class="pagination-info">
              第 {{ gemPlayerCurrentPage }} / {{ gemPlayerStatisticsPages }} 页
            </span>
            <button 
              @click="goToGemPlayerPage(gemPlayerCurrentPage + 1)" 
              :disabled="gemPlayerCurrentPage === gemPlayerStatisticsPages"
              class="pagination-btn"
            >
              下一页 ▶️
            </button>
          </div>
        </div>

        <!-- PK 相关统计 -->
        <!-- 今天胜者排行 -->
        <div v-if="isPKTable && todayWinnerStatistics.length > 0" class="stat-item-group">
          <div class="stat-group-header">
            <span class="stat-label">今天胜者排行 (共 {{ todayWinnerStatistics.length }} 名):</span>
          </div>
          <div class="item-statistics">
            <div 
              v-for="(winner, index) in paginatedTodayWinnerStatistics" 
              :key="winner.name"
              class="item-stat-item"
            >
              <span class="item-name">{{ winner.name }}</span>
              <span class="item-count">{{ winner.count }}</span>
            </div>
          </div>
          <!-- 今天胜者排行分页 -->
          <div v-if="todayWinnerStatisticsPages > 1" class="statistics-pagination">
            <button 
              @click="goToTodayWinnerPage(todayWinnerCurrentPage - 1)" 
              :disabled="todayWinnerCurrentPage === 1"
              class="pagination-btn"
            >
              ◀️ 上一页
            </button>
            <span class="pagination-info">
              第 {{ todayWinnerCurrentPage }} / {{ todayWinnerStatisticsPages }} 页
            </span>
            <button 
              @click="goToTodayWinnerPage(todayWinnerCurrentPage + 1)" 
              :disabled="todayWinnerCurrentPage === todayWinnerStatisticsPages"
              class="pagination-btn"
            >
              下一页 ▶️
            </button>
          </div>
        </div>

        <!-- 今天败者排行 -->
        <div v-if="isPKTable && todayLoserStatistics.length > 0" class="stat-item-group stat-item-group-loser">
          <div class="stat-group-header">
            <span class="stat-label">今天败者排行 (共 {{ todayLoserStatistics.length }} 名):</span>
          </div>
          <div class="item-statistics">
            <div 
              v-for="(loser, index) in paginatedTodayLoserStatistics" 
              :key="loser.name"
              class="item-stat-item"
            >
              <span class="item-name">{{ loser.name }}</span>
              <span class="item-count item-count-loser">{{ loser.count }}</span>
            </div>
          </div>
          <!-- 今天败者排行分页 -->
          <div v-if="todayLoserStatisticsPages > 1" class="statistics-pagination">
            <button 
              @click="goToTodayLoserPage(todayLoserCurrentPage - 1)" 
              :disabled="todayLoserCurrentPage === 1"
              class="pagination-btn"
            >
              ◀️ 上一页
            </button>
            <span class="pagination-info">
              第 {{ todayLoserCurrentPage }} / {{ todayLoserStatisticsPages }} 页
            </span>
            <button 
              @click="goToTodayLoserPage(todayLoserCurrentPage + 1)" 
              :disabled="todayLoserCurrentPage === todayLoserStatisticsPages"
              class="pagination-btn"
            >
              下一页 ▶️
            </button>
          </div>
        </div>

        <!-- 昨天胜者排行 -->
        <div v-if="isPKTable && yesterdayWinnerStatistics.length > 0" class="stat-item-group">
          <div class="stat-group-header">
            <span class="stat-label">昨天胜者排行 (共 {{ yesterdayWinnerStatistics.length }} 名):</span>
          </div>
          <div class="item-statistics">
            <div 
              v-for="(winner, index) in paginatedYesterdayWinnerStatistics" 
              :key="winner.name"
              class="item-stat-item"
            >
              <span class="item-name">{{ winner.name }}</span>
              <span class="item-count">{{ winner.count }}</span>
            </div>
          </div>
          <!-- 昨天胜者排行分页 -->
          <div v-if="yesterdayWinnerStatisticsPages > 1" class="statistics-pagination">
            <button 
              @click="goToYesterdayWinnerPage(yesterdayWinnerCurrentPage - 1)" 
              :disabled="yesterdayWinnerCurrentPage === 1"
              class="pagination-btn"
            >
              ◀️ 上一页
            </button>
            <span class="pagination-info">
              第 {{ yesterdayWinnerCurrentPage }} / {{ yesterdayWinnerStatisticsPages }} 页
            </span>
            <button 
              @click="goToYesterdayWinnerPage(yesterdayWinnerCurrentPage + 1)" 
              :disabled="yesterdayWinnerCurrentPage === yesterdayWinnerStatisticsPages"
              class="pagination-btn"
            >
              下一页 ▶️
            </button>
          </div>
        </div>

        <!-- 昨天败者排行 -->
        <div v-if="isPKTable && yesterdayLoserStatistics.length > 0" class="stat-item-group stat-item-group-loser">
          <div class="stat-group-header">
            <span class="stat-label">昨天败者排行 (共 {{ yesterdayLoserStatistics.length }} 名):</span>
          </div>
          <div class="item-statistics">
            <div 
              v-for="(loser, index) in paginatedYesterdayLoserStatistics" 
              :key="loser.name"
              class="item-stat-item"
            >
              <span class="item-name">{{ loser.name }}</span>
              <span class="item-count item-count-loser">{{ loser.count }}</span>
            </div>
          </div>
          <!-- 昨天败者排行分页 -->
          <div v-if="yesterdayLoserStatisticsPages > 1" class="statistics-pagination">
            <button 
              @click="goToYesterdayLoserPage(yesterdayLoserCurrentPage - 1)" 
              :disabled="yesterdayLoserCurrentPage === 1"
              class="pagination-btn"
            >
              ◀️ 上一页
            </button>
            <span class="pagination-info">
              第 {{ yesterdayLoserCurrentPage }} / {{ yesterdayLoserStatisticsPages }} 页
            </span>
            <button 
              @click="goToYesterdayLoserPage(yesterdayLoserCurrentPage + 1)" 
              :disabled="yesterdayLoserCurrentPage === yesterdayLoserStatisticsPages"
              class="pagination-btn"
            >
              下一页 ▶️
            </button>
          </div>
        </div>

        <!-- 时间范围信息 -->
        <div v-if="timeRangeInfo" class="stat-item">
          <span class="stat-label">时间范围:</span>
          <span class="stat-value">{{ timeRangeInfo }}</span>
        </div>
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
  },
  // 新增：是否显示统计信息
  showStatistics: {
    type: Boolean,
    default: false
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

// 刷新限制相关
const lastRefreshTime = ref(0) // 上次刷新时间

// 刷新限制配置
const MIN_REFRESH_INTERVAL = 1000 // 最小刷新间隔：1秒

// 是否禁用刷新
const isRefreshDisabled = computed(() => {
  const now = Date.now()
  // 检查最小刷新间隔（1秒）
  return now - lastRefreshTime.value < MIN_REFRESH_INTERVAL
})

// 统计相关
const hasCountField = computed(() => {
  return displayedColumns.value.includes('count')
})

const hasItemNameField = computed(() => {
  return displayedColumns.value.includes('itemName')
})

const hasPcNameField = computed(() => {
  return displayedColumns.value.includes('pcName')
})

const hasNacNameField = computed(() => {
  return displayedColumns.value.includes('nacName')
})

// 判断是否是 PK 表
const isPKTable = computed(() => {
  return props.tableName.includes('killpc') || 
         (hasPcNameField.value && hasNacNameField.value)
})

// 按道具分组统计
const itemStatistics = computed(() => {
  if (!hasItemNameField.value || !hasCountField.value) return []
  
  const stats = {}
  filteredData.value.forEach(row => {
    const itemName = row.itemName || '未知道具'
    const count = parseInt(row.count) || 0
    if (stats[itemName]) {
      stats[itemName] += count
    } else {
      stats[itemName] = count
    }
  })
  
  return Object.entries(stats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// 道具统计分页相关
const itemStatisticsPageSize = ref(10)
const itemStatisticsCurrentPage = ref(1)

const itemStatisticsPages = computed(() => {
  return Math.ceil(itemStatistics.value.length / itemStatisticsPageSize.value)
})

const paginatedItemStatistics = computed(() => {
  const start = (itemStatisticsCurrentPage.value - 1) * itemStatisticsPageSize.value
  const end = start + itemStatisticsPageSize.value
  return itemStatistics.value.slice(start, end)
})

function goToItemPage(page) {
  if (page >= 1 && page <= itemStatisticsPages.value) {
    itemStatisticsCurrentPage.value = page
  }
}

// 高品质 蓝宝石 玩家排名统计
const gemPlayerStatistics = computed(() => {
  if (!hasItemNameField.value || !hasPcNameField.value || !hasCountField.value) return []
  
  const targetItem = '高品质 蓝宝石'
  const stats = {}
  
  filteredData.value.forEach(row => {
    const itemName = row.itemName || ''
    const pcName = row.pcName || '未知玩家'
    const count = parseInt(row.count) || 0
    
    if (itemName === targetItem) {
      if (stats[pcName]) {
        stats[pcName] += count
      } else {
        stats[pcName] = count
      }
    }
  })
  
  return Object.entries(stats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// 玩家排名分页相关
const gemPlayerPageSize = ref(10)
const gemPlayerCurrentPage = ref(1)

const gemPlayerStatisticsPages = computed(() => {
  return Math.ceil(gemPlayerStatistics.value.length / gemPlayerPageSize.value)
})

const paginatedGemPlayerStatistics = computed(() => {
  const start = (gemPlayerCurrentPage.value - 1) * gemPlayerPageSize.value
  const end = start + gemPlayerPageSize.value
  return gemPlayerStatistics.value.slice(start, end)
})

function goToGemPlayerPage(page) {
  if (page >= 1 && page <= gemPlayerStatisticsPages.value) {
    gemPlayerCurrentPage.value = page
  }
}

// PK 相关统计
// 获取今天的数据
const todayPKData = computed(() => {
  if (!isPKTable.value) return []
  
  const timeField = displayedColumns.value.find(col => 
    col === 'time' || col.toLowerCase().includes('time')
  )
  if (!timeField) return []
  
  const todayRange = getTodayRange()
  
  return filteredData.value.filter(row => {
    const rowDate = parseDate(row[timeField])
    return isDateInRange(rowDate, todayRange)
  })
})

// 获取昨天的数据
const yesterdayPKData = computed(() => {
  if (!isPKTable.value) return []
  
  const timeField = displayedColumns.value.find(col => 
    col === 'time' || col.toLowerCase().includes('time')
  )
  if (!timeField) return []
  
  const yesterdayRange = getYesterdayRange()
  
  return filteredData.value.filter(row => {
    const rowDate = parseDate(row[timeField])
    return isDateInRange(rowDate, yesterdayRange)
  })
})

// 今天胜者排行统计
const todayWinnerStatistics = computed(() => {
  if (!isPKTable.value || !hasPcNameField.value) return []
  
  const stats = {}
  todayPKData.value.forEach(row => {
    const pcName = row.pcName || '未知玩家'
    if (stats[pcName]) {
      stats[pcName] += 1
    } else {
      stats[pcName] = 1
    }
  })
  
  return Object.entries(stats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// 今天胜者排行分页相关
const todayWinnerPageSize = ref(10)
const todayWinnerCurrentPage = ref(1)

const todayWinnerStatisticsPages = computed(() => {
  return Math.ceil(todayWinnerStatistics.value.length / todayWinnerPageSize.value)
})

const paginatedTodayWinnerStatistics = computed(() => {
  const start = (todayWinnerCurrentPage.value - 1) * todayWinnerPageSize.value
  const end = start + todayWinnerPageSize.value
  return todayWinnerStatistics.value.slice(start, end)
})

function goToTodayWinnerPage(page) {
  if (page >= 1 && page <= todayWinnerStatisticsPages.value) {
    todayWinnerCurrentPage.value = page
  }
}

// 昨天胜者排行统计
const yesterdayWinnerStatistics = computed(() => {
  if (!isPKTable.value || !hasPcNameField.value) return []
  
  const stats = {}
  yesterdayPKData.value.forEach(row => {
    const pcName = row.pcName || '未知玩家'
    if (stats[pcName]) {
      stats[pcName] += 1
    } else {
      stats[pcName] = 1
    }
  })
  
  return Object.entries(stats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// 昨天胜者排行分页相关
const yesterdayWinnerPageSize = ref(10)
const yesterdayWinnerCurrentPage = ref(1)

const yesterdayWinnerStatisticsPages = computed(() => {
  return Math.ceil(yesterdayWinnerStatistics.value.length / yesterdayWinnerPageSize.value)
})

const paginatedYesterdayWinnerStatistics = computed(() => {
  const start = (yesterdayWinnerCurrentPage.value - 1) * yesterdayWinnerPageSize.value
  const end = start + yesterdayWinnerPageSize.value
  return yesterdayWinnerStatistics.value.slice(start, end)
})

function goToYesterdayWinnerPage(page) {
  if (page >= 1 && page <= yesterdayWinnerStatisticsPages.value) {
    yesterdayWinnerCurrentPage.value = page
  }
}

// 今天败者排行统计
const todayLoserStatistics = computed(() => {
  if (!isPKTable.value || !hasNacNameField.value) return []
  
  const stats = {}
  todayPKData.value.forEach(row => {
    const nacName = row.nacName || '未知玩家'
    if (stats[nacName]) {
      stats[nacName] += 1
    } else {
      stats[nacName] = 1
    }
  })
  
  return Object.entries(stats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// 今天败者排行分页相关
const todayLoserPageSize = ref(10)
const todayLoserCurrentPage = ref(1)

const todayLoserStatisticsPages = computed(() => {
  return Math.ceil(todayLoserStatistics.value.length / todayLoserPageSize.value)
})

const paginatedTodayLoserStatistics = computed(() => {
  const start = (todayLoserCurrentPage.value - 1) * todayLoserPageSize.value
  const end = start + todayLoserPageSize.value
  return todayLoserStatistics.value.slice(start, end)
})

function goToTodayLoserPage(page) {
  if (page >= 1 && page <= todayLoserStatisticsPages.value) {
    todayLoserCurrentPage.value = page
  }
}

// 昨天败者排行统计
const yesterdayLoserStatistics = computed(() => {
  if (!isPKTable.value || !hasNacNameField.value) return []
  
  const stats = {}
  yesterdayPKData.value.forEach(row => {
    const nacName = row.nacName || '未知玩家'
    if (stats[nacName]) {
      stats[nacName] += 1
    } else {
      stats[nacName] = 1
    }
  })
  
  return Object.entries(stats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// 昨天败者排行分页相关
const yesterdayLoserPageSize = ref(10)
const yesterdayLoserCurrentPage = ref(1)

const yesterdayLoserStatisticsPages = computed(() => {
  return Math.ceil(yesterdayLoserStatistics.value.length / yesterdayLoserPageSize.value)
})

const paginatedYesterdayLoserStatistics = computed(() => {
  const start = (yesterdayLoserCurrentPage.value - 1) * yesterdayLoserPageSize.value
  const end = start + yesterdayLoserPageSize.value
  return yesterdayLoserStatistics.value.slice(start, end)
})

function goToYesterdayLoserPage(page) {
  if (page >= 1 && page <= yesterdayLoserStatisticsPages.value) {
    yesterdayLoserCurrentPage.value = page
  }
}

// 获取今天的开始和结束时间
function getTodayRange() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return { start: today, end: tomorrow }
}

// 获取昨天的开始和结束时间
function getYesterdayRange() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const today = new Date(yesterday)
  today.setDate(today.getDate() + 1)
  return { start: yesterday, end: today }
}

// 判断日期是否在范围内
function isDateInRange(date, range) {
  if (!date) return false
  return date >= range.start && date < range.end
}

// 时间范围信息
const timeRangeInfo = computed(() => {
  if (filteredData.value.length === 0) return null
  
  const timeField = displayedColumns.value.find(col => 
    col === 'time' || col.toLowerCase().includes('time')
  )
  
  if (!timeField) return null
  
  const times = filteredData.value
    .map(row => parseDate(row[timeField]))
    .filter(date => date !== null)
    .sort((a, b) => a - b)
  
  if (times.length === 0) return null
  
  const startTime = times[0]
  const endTime = times[times.length - 1]
  
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }
  
  return `${formatDate(startTime)} 至 ${formatDate(endTime)}`
})

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
  const now = Date.now()
  
  // 检查最小刷新间隔（1秒）
  if (now - lastRefreshTime.value < MIN_REFRESH_INTERVAL) {
    return
  }
  
  // 记录刷新时间
  lastRefreshTime.value = now
  
  // 执行刷新
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
  itemStatisticsCurrentPage.value = 1
  gemPlayerCurrentPage.value = 1
  todayWinnerCurrentPage.value = 1
  yesterdayWinnerCurrentPage.value = 1
  todayLoserCurrentPage.value = 1
  yesterdayLoserCurrentPage.value = 1
})

// 监听数据变化，重置分页
watch(() => filteredData.value, () => {
  itemStatisticsCurrentPage.value = 1
  gemPlayerCurrentPage.value = 1
  todayWinnerCurrentPage.value = 1
  yesterdayWinnerCurrentPage.value = 1
  todayLoserCurrentPage.value = 1
  yesterdayLoserCurrentPage.value = 1
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
  margin-top: 16px;
}

/* 数据统计面板样式 */
.statistics-panel {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 20px;
  margin: 16px 24px;
}

.statistics-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #86efac;
}

.statistics-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #166534;
}

.statistics-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #d1fae5;
}

.stat-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  min-width: 100px;
}

.stat-value {
  font-size: 16px;
  color: #059669;
  font-weight: 500;
}

.stat-value.highlight {
  font-size: 20px;
  font-weight: 700;
  color: #047857;
}

.stat-item-group {
  background: white;
  border-radius: 6px;
  border: 1px solid #d1fae5;
  padding: 12px;
}

/* 败者排行红色配色 */
.stat-item-group-loser {
  border: 1px solid #fecaca;
}

.stat-item-group-loser .stat-group-header {
  border-bottom: 1px solid #fecaca;
}

.stat-item-group-loser .item-stat-item {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.stat-group-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #d1fae5;
}

.item-statistics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.item-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 4px;
  border: 1px solid #bbf7d0;
}

.item-name {
  font-size: 14px;
  color: #374151;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.item-count {
  font-size: 14px;
  font-weight: 600;
  color: #047857;
  background: #d1fae5;
  padding: 2px 8px;
  border-radius: 4px;
  min-width: 50px;
  text-align: right;
}

/* 败者排行数量红色配色 */
.item-count-loser {
  color: #dc2626;
  background: #fee2e2;
}

/* 统计分页样式 */
.statistics-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #d1fae5;
}

.statistics-pagination .pagination-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  color: #374151;
}

.statistics-pagination .pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.statistics-pagination .pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.statistics-pagination .pagination-info {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
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

  .statistics-panel {
    padding: 16px;
    margin: 16px;
  }

  .statistics-title {
    font-size: 16px;
  }

  .item-statistics {
    grid-template-columns: 1fr;
  }

  .stat-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .stat-label {
    min-width: auto;
  }

  .statistics-pagination {
    flex-direction: column;
    gap: 12px;
  }

  .statistics-pagination .pagination-info {
    order: -1;
  }
}
</style>