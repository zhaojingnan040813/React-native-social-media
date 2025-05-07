# 欢迎使用你的Expo应用 👋

这是一个使用[`create-expo-app`](https://www.npmjs.com/package/create-expo-app)创建的[Expo](https://expo.dev)项目。

## 开始使用

1. 安装依赖

   ```bash
   npm install
   ```

2. 启动应用

   ```bash
    npx expo start
   ```

在输出中，你会找到以下打开应用的选项：

- [开发构建版](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android模拟器](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS模拟器](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)，一个用于尝试Expo应用开发的有限沙盒环境

你可以通过编辑**app**目录中的文件开始开发。这个项目使用[基于文件的路由](https://docs.expo.dev/router/introduction)。

## 获取一个全新项目

当你准备好时，运行：

```bash
npm run reset-project
```

这个命令会将初始代码移动到**app-example**目录，并创建一个空白的**app**目录，你可以在这里开始开发。

## 了解更多

要了解更多关于使用Expo开发项目的信息，请查看以下资源：

- [Expo文档](https://docs.expo.dev/)：学习基础知识，或通过我们的[指南](https://docs.expo.dev/guides)探索高级主题。
- [学习Expo教程](https://docs.expo.dev/tutorial/introduction/)：按照分步教程创建一个可在Android、iOS和Web上运行的项目。

## 加入社区

加入我们的开发者社区，共同创建通用应用。

- [GitHub上的Expo](https://github.com/expo/expo)：查看我们的开源平台并做出贡献。
- [Discord社区](https://chat.expo.dev)：与Expo用户聊天并提问。


后续我在开发一个页面，请选择你的方向，有前端，后端两个选项，然后会有一个转盘，会弹出来Vue , React , GO , Spring Boot 这样相关的文章

你需要保证UI风格一致

## 项目功能

### 社交功能
- 用户注册与登录：使用学号和密码进行身份验证
- 帖子发布：用户可以发布文字、图片内容
- 评论互动：对帖子进行评论
- 点赞功能：对帖子进行点赞
- 收藏功能：收藏感兴趣的帖子
- 通知系统：接收点赞、评论等互动通知

### 私信功能
- 私信列表：显示所有注册用户，方便快速开始对话
- 一对一聊天：支持与其他用户进行私聊
- 实时消息：通过Supabase实时订阅接收新消息
- 已读状态：显示消息的已读/未读状态
- 聊天记录：保存完整的聊天历史

### 课表功能
- 个人课表管理：添加、编辑和查看课程安排
- 课程时间安排：设置课程时间、地点、教师等信息

## 技术栈
- 前端：React Native、Expo
- 后端：Supabase (PostgreSQL)
- 认证：基于JWT的身份验证
- 存储：Supabase Storage存储图片等媒体文件
- 实时功能：Supabase Realtime提供实时消息和通知

## Supabase Realtime 配置指南

为了使私信功能中的实时消息更新正常工作，需要在 Supabase 控制台中启用相关表的实时功能：

1. 登录 Supabase 控制台 (https://supabase.com)
2. 进入你的项目
3. 在左侧菜单栏中找到 "Database" > "Replication"
4. 点击 "Tables" 标签
5. 找到以下两个表，并确保它们的 "Realtime" 列已勾选启用：
   - `messages` (必须启用)
   - `conversations` (必须启用)
6. 如果任何表没有启用实时功能，点击对应行的切换开关将其打开
7. 保存更改

启用实时功能后，私信功能将能够：
- 实时接收新消息
- 实时更新消息已读状态
- 在网络中断后自动重新连接

## 更新日志

### 2023年X月X日
- 修复了录音功能的多个问题:
  - 解决了"只能有一个录音实例被准备"的错误，通过添加全局录音实例管理
  - 修复了录音上传权限问题，添加了替代上传方法以绕过行级安全策略限制
  - 修复了"无法卸载已卸载的录音"错误，添加了更健壮的状态检查
  - 改进了录音UI，添加了处理中状态和更好的错误处理
  - 优化了录音资源的清理逻辑，确保在组件卸载时正确释放资源

### 2023年X月X日
- 修复了语音消息播放问题:
  - 解决了音频播放时出现"Response code: 400"错误的问题
  - 添加了本地缓存机制，优先从本地缓存播放音频文件
  - 增强了错误处理，添加了多次失败后的友好提示
  - 实现了演示模式，在无法播放真实音频时提供替代体验
  - 优化了URL处理，确保生成正确的Supabase Storage URL

## 应用打包说明

### 日志控制

- 本项目原先使用了`babel-plugin-transform-remove-console`插件自动移除生产环境中的控制台日志。现已移除该插件，生产环境和开发环境的日志输出行为一致。
- 如需管理日志输出，请使用`helpers/logHelper.js`中提供的日志辅助函数。

### 打包命令

我们提供了以下打包命令，确保在打包时正确设置环境变量：

# 生产环境打包 (移除所有控制台日志)
npm run build:android

# 预览版打包 (移除所有控制台日志)
npm run build:android:preview

# 开发环境打包 (保留控制台日志)
npm run build:android:dev

### 验证构建模式

如果您想验证当前的构建模式，可以运行：

```bash
npm run check-build-mode
```

这将显示当前环境设置和是否启用了日志移除功能。

### 日志辅助函数

为了更好地管理日志，我们提供了一组日志辅助函数，位于`helpers/logHelper.js`：

```javascript
import { logDebug, logInfo, logWarn, logError } from '../helpers/logHelper';

// 使用示例
logDebug('组件名', '调试信息', { 额外数据 });
logInfo('组件名', '普通信息');
logWarn('组件名', '警告信息');
logError('组件名', '错误信息', error对象);
```

这些函数在开发环境中正常工作，在生产环境中会被自动移除，无需手动处理。