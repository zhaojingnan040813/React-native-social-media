module.exports = function (api) {
  api.cache(true);
  
  // 判断当前环境
  const isProd = process.env.NODE_ENV === 'production';
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 只在生产环境移除控制台日志
      isProd && 'transform-remove-console',
    ].filter(Boolean),
  };
};
