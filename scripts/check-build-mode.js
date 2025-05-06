/**
 * 检查构建模式脚本
 * 用于在构建前确认当前是否为生产环境
 */

// 获取当前环境
const isProd = process.env.NODE_ENV === 'production';
const env = process.env.NODE_ENV || '未设置';

// 彩色输出
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// 输出分隔线
console.log('\n' + '='.repeat(50));
console.log(`${BOLD}应用构建模式检查${RESET}`);
console.log('='.repeat(50));

// 显示当前环境
console.log(`当前环境: ${BOLD}${env === 'production' ? GREEN : YELLOW}${env}${RESET}`);

// 显示控制台日志状态
if (isProd) {
  console.log(`${GREEN}✓ 已启用生产模式${RESET}`);
  console.log(`${GREEN}✓ 控制台日志将被移除${RESET}`);
  console.log(`${GREEN}✓ 应用性能已优化${RESET}`);
} else {
  console.log(`${YELLOW}⚠ 警告: 非生产模式构建${RESET}`);
  console.log(`${YELLOW}⚠ 控制台日志不会被移除${RESET}`);
  console.log(`${YELLOW}⚠ 应用性能未优化${RESET}`);
  console.log(`\n${RED}为生产环境构建，请使用以下命令:${RESET}`);
  console.log(`${BOLD}npm run build:android${RESET} - 生产环境构建`);
}

console.log('='.repeat(50) + '\n');

// 如果是非生产环境，暂停5秒确认
if (!isProd) {
  console.log(`构建将在5秒后继续...`);
  console.log(`按Ctrl+C取消构建`);
  
  let count = 5;
  const interval = setInterval(() => {
    count--;
    if (count === 0) {
      clearInterval(interval);
      console.log(`继续构建...`);
    } else {
      process.stdout.write(`${count}... `);
    }
  }, 1000);
  
  // 等待5秒
  setTimeout(() => {
    clearInterval(interval);
  }, 6000);
} else {
  // 在生产环境中直接继续
  process.exit(0);
} 