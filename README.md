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