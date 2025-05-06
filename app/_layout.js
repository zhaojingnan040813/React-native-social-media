// 添加在文件开头
// 在生产环境中覆盖所有控制台方法
if (!__DEV__) {
  // 保留原始的错误日志函数，用于记录严重错误
  const originalConsoleError = console.error;
  
  // 覆盖所有控制台方法
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
  // 对于错误日志，可以选择完全禁用或仅保留错误消息而不打印调用栈
  console.error = (message) => {
    // 可以在这里实现自定义错误处理逻辑
    // 例如：记录到应用内部日志、发送到远程分析服务等
    
    // 如果需要，仍然可以通过原始方法输出错误
    // originalConsoleError(message);
  };
}

// 现有的应用代码... 