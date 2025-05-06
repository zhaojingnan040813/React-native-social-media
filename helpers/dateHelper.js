/**
 * 将日期转换为相对时间（如：刚刚、5分钟前、1小时前、昨天等）
 * @param {string|Date} date 日期字符串或日期对象
 * @returns {string} 相对时间字符串
 */
export const timeAgo = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  
  // 计算时间差（毫秒）
  const diffMs = now - past;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // 根据时间差返回相应的描述
  if (diffSeconds < 10) {
    return '刚刚';
  } else if (diffSeconds < 60) {
    return `${diffSeconds}秒前`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    // 超过一周，显示具体日期
    const year = past.getFullYear();
    const month = past.getMonth() + 1;
    const day = past.getDate();
    
    // 如果是当年，只显示月日
    if (year === now.getFullYear()) {
      return `${month}月${day}日`;
    }
    
    // 否则显示年月日
    return `${year}年${month}月${day}日`;
  }
}; 