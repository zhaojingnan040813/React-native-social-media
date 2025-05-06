/**
 * 检查当前环境配置脚本
 * 用于确认打包时环境变量是否正确设置
 */
console.log('=== 环境配置检查 ===');
console.log(`NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
console.log(`__DEV__: ${typeof __DEV__ !== 'undefined' ? __DEV__ : '无法在脚本中获取'}`);
console.log('===================');

// 如果NODE_ENV未设置，提醒用户
if (!process.env.NODE_ENV) {
  console.warn('警告: NODE_ENV 环境变量未设置!');
  console.warn('打包可能无法正确移除控制台日志.');
  console.warn('请使用以下命令进行打包:');
  console.warn('npm run build:android           # 生产环境APK');
  console.warn('npm run build:android:preview   # 预览版APK');
}

// 退出脚本
process.exit(0); 