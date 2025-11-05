/**
 * 根据当前时间返回问候语
 */
export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return '早安';
  } else if (hour >= 12 && hour < 18) {
    return '下午好';
  } else if (hour >= 18 && hour < 22) {
    return '晚上好';
  } else {
    return '夜深了';
  }
}

/**
 * 获取格式化的日期字符串
 * @returns 格式: "2025年10月21日 星期二"
 */
export function getFormattedDate(): string {
  const now = new Date();
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

/**
 * 获取简短的日期字符串
 * @returns 格式: "10月21日 周二"
 */
export function getShortDate(): string {
  const now = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekday = weekdays[now.getDay()];

  return `${month}月${day}日 ${weekday}`;
}

/**
 * 获取当前时间字符串
 * @returns 格式: "14:30"
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 获取完整的问候信息
 * @returns 格式: "早安，今天是2025年10月21日 星期二"
 */
export function getFullGreeting(): string {
  return `${getGreeting()}，今天是${getFormattedDate()}`;
}

/**
 * 根据时间段返回对应的 emoji
 */
export function getTimeEmoji(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) {
    return '🌅'; // 日出
  } else if (hour >= 8 && hour < 12) {
    return '☀️'; // 早晨
  } else if (hour >= 12 && hour < 18) {
    return '🌤️'; // 下午
  } else if (hour >= 18 && hour < 20) {
    return '🌆'; // 傍晚
  } else if (hour >= 20 && hour < 22) {
    return '🌙'; // 晚上
  } else {
    return '🌃'; // 深夜
  }
}
