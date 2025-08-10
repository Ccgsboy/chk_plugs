import { bitable } from '@lark-base-open/js-sdk'

/**
 * 多维表格工具类
 */
export class BitableUtils {
  /**
   * 获取当前base下的所有数据表
   * @returns {Promise<Array>} 数据表列表
   */
  static async getTableList() {
    try {
      // 检查是否在多维表格环境中
      if (!bitable || !bitable.base) {
        console.warn('不在多维表格环境中，返回模拟数据')
        return this.getMockTableList()
      }

      // 调用SDK获取表格列表
      const tableList = await bitable.base.getTableList()
      
      if (!tableList || !Array.isArray(tableList)) {
        console.warn('获取到的表格列表格式不正确，返回模拟数据')
        return this.getMockTableList()
      }

      // 获取每个表格的详细信息，包括名称
      const tableInfoList = await Promise.all(
        tableList.map(async (table) => {
          try {
            // 获取表格的详细信息
            const tableInfo = await bitable.base.getTableById(table.id)
            const tableName = await tableInfo.getName()
            
            return {
              id: table.id,
              name: tableName || table.name || `表格_${table.id}`
            }
          } catch (error) {
            console.warn(`获取表格 ${table.id} 名称失败:`, error)
            return {
              id: table.id,
              name: table.name || `表格_${table.id}`
            }
          }
        })
      )

      return tableInfoList
    } catch (error) {
      console.error('获取表格列表失败:', error)
      // 降级到模拟数据
      return this.getMockTableList()
    }
  }

  /**
   * 获取指定表格的详细信息
   * @param {string} tableId 表格ID
   * @returns {Promise<Object>} 表格信息
   */
  static async getTableById(tableId) {
    try {
      if (!bitable || !bitable.base) {
        throw new Error('不在多维表格环境中')
      }

      const table = await bitable.base.getTableById(tableId)
      return table
    } catch (error) {
      console.error('获取表格详情失败:', error)
      throw error
    }
  }

  /**
   * 检查是否在多维表格环境中
   * @returns {boolean} 是否在多维表格环境中
   */
  static isBitableEnvironment() {
    return !!(bitable && bitable.base)
  }

  /**
   * 获取模拟数据表列表（用于开发环境或SDK不可用时）
   * @returns {Array} 模拟数据表列表
   */
  static getMockTableList() {
    return [
      { id: 'table1', name: '小红书数据表' },
      { id: 'table2', name: '用户数据表' },
      { id: 'table3', name: '内容分析表' },
      { id: 'table4', name: '博主信息表' },
      { id: 'table5', name: '笔记统计表' }
    ]
  }

  /**
   * 刷新并获取最新的表格列表
   * @returns {Promise<Array>} 最新的数据表列表
   */
  static async refreshTableList() {
    // 每次都重新获取，确保数据是最新的
    return await this.getTableList()
  }
}

/**
 * 导出便捷方法
 */
export const getTableList = () => BitableUtils.getTableList()
export const getTableById = (tableId) => BitableUtils.getTableById(tableId)
export const isBitableEnvironment = () => BitableUtils.isBitableEnvironment()
export const refreshTableList = () => BitableUtils.refreshTableList()

export default BitableUtils