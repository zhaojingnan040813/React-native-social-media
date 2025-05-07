module.exports = function (api) {
  api.cache(true);
  
  // 判断当前环境
  const isProd = process.env.NODE_ENV === 'production';
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [],
  };
};
