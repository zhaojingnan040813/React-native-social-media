/**
 * 日志工具 - 提供集中管理和控制应用中的日志输出
 * 在生产环境中，通过babel插件自动移除所有日志调用
 */

// 是否启用日志输出
const ENABLE_LOGS = __DEV__;

// 日志级别
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// 当前日志级别 - 在开发环境中可以显示所有日志，生产环境只显示错误
const CURRENT_LOG_LEVEL = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;

/**
 * 调试日志 - 仅在开发中使用，发布版本将移除
 * @param {string} tag - 日志标签，用于标识日志来源
 * @param {any} message - 日志消息
 * @param {any} [data] - 附加数据
 */
export const logDebug = (tag, message, data) => {
  if (ENABLE_LOGS && CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
    if (data !== undefined) {
      console.log(`[${tag}] ${message}`, data);
    } else {
      console.log(`[${tag}] ${message}`);
    }
  }
};

/**
 * 信息日志
 * @param {string} tag - 日志标签
 * @param {any} message - 日志消息
 * @param {any} [data] - 附加数据
 */
export const logInfo = (tag, message, data) => {
  if (ENABLE_LOGS && CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
    if (data !== undefined) {
      console.info(`[${tag}] ${message}`, data);
    } else {
      console.info(`[${tag}] ${message}`);
    }
  }
};

/**
 * 警告日志
 * @param {string} tag - 日志标签
 * @param {any} message - 日志消息
 * @param {any} [data] - 附加数据
 */
export const logWarn = (tag, message, data) => {
  if (ENABLE_LOGS && CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
    if (data !== undefined) {
      console.warn(`[${tag}] ${message}`, data);
    } else {
      console.warn(`[${tag}] ${message}`);
    }
  }
};

/**
 * 错误日志 - 在生产环境中依然可用
 * @param {string} tag - 日志标签
 * @param {any} message - 日志消息
 * @param {any} [error] - 错误对象
 */
export const logError = (tag, message, error) => {
  if (ENABLE_LOGS && CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
    if (error !== undefined) {
      console.error(`[${tag}] ${message}`, error);
    } else {
      console.error(`[${tag}] ${message}`);
    }
  }
};

// 替代console对象的方法（可选使用）
export const logger = {
  debug: logDebug,
  log: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
};

export default {
  logDebug,
  logInfo,
  logWarn,
  logError,
  logger,
}; 