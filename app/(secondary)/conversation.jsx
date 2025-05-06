import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  InteractionManager,
  Animated,
  Pressable
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import { getConversationMessages, sendMessage, markMessagesAsRead, sendAudioMessage } from '../../services/messageService';
import { subscribeToConversation } from '../../services/realtimeService';
import { getUserData } from '../../services/userService';
import AudioMessage from '../../components/AudioMessage';
import { startRecording, stopRecording, uploadAudioFile } from '../../services/audioService';

const Conversation = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { conversationId, userId, userName } = params;
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  
  // 语音输入相关状态
  const [inputMode, setInputMode] = useState('text'); // 'text' 或 'audio'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingInstance, setRecordingInstance] = useState(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  
  // 录音计时器ref
  const recordingTimer = useRef(null);
  
  const flatListRef = useRef(null);
  const subscriptionRef = useRef(null);
  const messageCache = useRef(new Set()).current; // 消息ID缓存，用于客户端去重
  
  // 分离原生动画和JS动画值
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const [isBackButtonPressed, setIsBackButtonPressed] = useState(false);
  
  // 加载消息并订阅实时更新，同时获取对方用户信息
  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
      
      // 获取对方用户信息
      if (userId) {
        loadOtherUserData();
      }
    }
    
    // 组件卸载时清理订阅和录音
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      // 清理录音实例
      stopRecordingCleanup();
    };
  }, [conversationId, userId]);
  
  // 加载对方用户信息
  const loadOtherUserData = async () => {
    try {
      const result = await getUserData(userId);
      if (result.success) {
        setOtherUser(result.data);
      } else {
        console.log('获取对方用户信息失败:', result.msg);
      }
    } catch (error) {
      console.log('加载对方用户信息出错:', error);
    }
  };
  
  // 加载对话消息
  const loadMessages = async () => {
    try {
      setLoading(true);
      
      // 验证必要参数
      if (!conversationId || !user?.id) {
        Alert.alert('提示', '无法加载对话，请返回重试');
        router.back();
        return;
      }
      
      const response = await getConversationMessages(conversationId);
      
      if (response.success) {
        // 将所有消息ID添加到缓存
        response.data.forEach(msg => {
          messageCache.add(msg.id.toString());
        });
        
        setMessages(response.data);
        
        // 标记消息为已读
        await markMessagesAsRead(conversationId, user.id);
      } else {
        Alert.alert('提示', '无法加载消息: ' + response.msg);
      }
    } catch (error) {
      Alert.alert('错误', '加载消息时出现问题');
    } finally {
      setLoading(false);
    }
  };
  
  // 订阅消息更新
  const subscribeToMessages = () => {
    try {
      // 确保只有一个活跃订阅
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      
      // 处理新消息
      const handleNewMessage = (newMessage) => {
        // 检查消息是否已在缓存中
        if (messageCache.has(newMessage.id.toString())) {
          // console.log(`消息已存在，忽略: ${newMessage.id}`);
          return;
        }
        
        // 如果是自己发送的消息，检查是否有对应的临时消息
        if (newMessage.senderId === user.id) {
          setMessages(prev => {
            // 查找匹配的临时消息
            const tempIndex = prev.findIndex(msg => 
              msg._isTemp && 
              msg.content === newMessage.content &&
              Math.abs(new Date(msg.created_at) - new Date(newMessage.created_at)) < 60000
            );
            
            if (tempIndex >= 0) {
              // 更新临时消息为真实消息
              // console.log(`更新临时消息: ${tempIndex} -> ${newMessage.id}`);
              const updated = [...prev];
              updated[tempIndex] = {
                ...newMessage,
                _wasTemp: true
              };
              return updated;
            }
            
            // 没有找到对应的临时消息，添加新消息
            // console.log(`添加新消息 (发送者): ${newMessage.id}`);
            messageCache.add(newMessage.id.toString());
            return [...prev, newMessage];
          });
        } else {
          // 其他人发送的消息，直接添加
          // console.log(`添加新消息 (接收者): ${newMessage.id}`);
          messageCache.add(newMessage.id.toString());
          setMessages(prev => [...prev, newMessage]);
          
          // 如果是发给当前用户的消息，标记为已读
          if (newMessage.receiverId === user.id) {
            markMessagesAsRead(conversationId, user.id);
          }
        }
      };
      
      // 处理消息更新 (主要是已读状态)
      const handleMessageUpdate = (updatedMessage) => {
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
        ));
      };
      
      // 创建订阅
      subscriptionRef.current = subscribeToConversation(
        conversationId,
        handleNewMessage,
        handleMessageUpdate
      );
      
    } catch (error) {
      // console.error('设置实时订阅失败:', error);
    }
  };
  
  // 处理发送文本消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // 验证必要参数
    if (!conversationId || !user?.id || !userId) {
      Alert.alert('提示', '消息发送失败：缺少必要信息');
      return;
    }
    
    // 保存消息内容，清空输入框
    const messageContent = inputMessage.trim();
    setInputMessage('');
    
    // 生成唯一的临时ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // 创建临时消息对象(用于立即显示)
    const tempMessage = {
      id: tempId,
      conversation_id: conversationId,
      senderId: user.id,
      receiverId: userId,
      content: messageContent,
      type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      _isTemp: true
    };
    
    // 先添加到本地显示
    setMessages(prev => [...prev, tempMessage]);
    
    // 滚动到底部
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
    
    try {
      setSending(true);
      
      const response = await sendMessage(
        conversationId,
        user.id,
        userId,
        messageContent
      );
      
      if (!response.success) {
        // 发送失败，标记消息为失败状态
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, _sendFailed: true } 
            : msg
        ));
        
        Alert.alert('发送失败', '无法发送消息，请稍后再试：' + response.msg);
      }
    } catch (error) {
      // 标记消息为失败状态
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, _sendFailed: true } 
          : msg
      ));
      
      Alert.alert('错误', '发送消息时出现问题：' + error.message);
    } finally {
      setSending(false);
    }
  };
  
  // 切换输入模式（文本/语音）
  const toggleInputMode = () => {
    setInputMode(prev => prev === 'text' ? 'audio' : 'text');
  };
  
  // 开始录音
  const startRecordingHandler = async () => {
    try {
      // 开始录音
      const result = await startRecording();
      
      if (!result.success) {
        Alert.alert('提示', result.error || '无法开始录音');
        return;
      }
      
      // 设置录音状态
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordingInstance(result.recording);
      
      // 开始计时
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('录音失败:', error);
      Alert.alert('错误', '开始录音时出现问题');
    }
  };
  
  // 停止录音并清理资源（不发送）
  const stopRecordingCleanup = async () => {
    // 清除计时器
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    
    // 停止录音实例
    if (recordingInstance) {
      try {
        const status = await recordingInstance.getStatusAsync();
        if (status.isRecording) {
          await recordingInstance.stopAndUnloadAsync();
        }
      } catch (error) {
        console.log('清理录音实例失败，可能已经被释放', error);
      }
    }
    
    // 重置状态
    setRecordingInstance(null);
    setIsRecording(false);
    setRecordingDuration(0);
  };
  
  // 停止录音并发送语音消息
  const stopRecordingAndSend = async () => {
    // 先停止录音计时器
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    
    // 如果没有录音实例，直接返回
    if (!recordingInstance) {
      setIsRecording(false);
      return;
    }
    
    try {
      console.log('停止录音并准备发送...');
      
      // 保存当前录音实例的引用，并立即清除状态中的引用
      const currentRecording = recordingInstance;
      setRecordingInstance(null);
      setIsRecording(false);
      
      // 停止录音并获取文件URI
      const result = await stopRecording(currentRecording);
      
      if (!result.success) {
        console.log('录音停止失败:', result.error);
        Alert.alert('提示', result.error || '录音失败');
        setRecordingDuration(0);
        return;
      }
      
      // 检查录音时长，太短不发送（小于1秒）
      if (result.durationMillis < 1000) {
        Alert.alert('提示', '录音时间太短');
        setRecordingDuration(0);
        return;
      }
      
      // 保存本地URI，用于可能的本地播放
      const localUri = result.uri;
      
      // 生成唯一的临时ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // 创建临时消息对象(用于立即显示)
      const tempMessage = {
        id: tempId,
        conversation_id: conversationId,
        senderId: user.id,
        receiverId: userId,
        content: '',
        type: 'audio',
        is_read: false,
        audio_duration: Math.round(result.durationMillis / 1000) || 5, // 使用默认5秒，避免0
        media_url: result.uri, // 临时使用本地URI
        created_at: new Date().toISOString(),
        _isTemp: true,
        _localUri: localUri // 保存本地URI，方便后续播放
      };
      
      // 先添加到本地显示
      setMessages(prev => [...prev, tempMessage]);
      
      // 滚动到底部
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
      
      // 上传音频文件
      setSending(true);
      
      try {
        console.log('开始上传音频文件...');
        const uploadResult = await uploadAudioFile(result.uri);
        
        if (!uploadResult.success) {
          // 上传失败
          console.log('语音上传失败:', uploadResult.error);
          setMessages(prev => prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, _sendFailed: true } 
              : msg
          ));
          
          Alert.alert('提示', '语音上传失败: ' + (uploadResult.error || '未知错误'));
          setSending(false);
          return;
        }
        
        console.log('音频上传成功，准备发送消息...');
        console.log('音频URL:', uploadResult.url);
        console.log('音频时长:', result.durationMillis);
        
        // 发送语音消息
        const response = await sendAudioMessage(
          conversationId,
          user.id,
          userId,
          uploadResult.url,
          result.durationMillis
        );
        
        console.log('发送语音消息响应:', response);
        
        if (!response.success) {
          // 发送失败
          console.log('发送语音消息失败:', response.msg);
          setMessages(prev => prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, _sendFailed: true } 
              : msg
          ));
          
          Alert.alert('提示', '发送语音失败: ' + response.msg);
        } else {
          console.log('语音消息发送成功');
          
          // 检查是否需要使用本地文件 (Response 中返回 useLocalFile 标志)
          if (response.useLocalFile === true) {
            console.log('服务器建议使用本地文件播放，已保存本地URI');
            
            // 更新消息，添加本地文件标记
            setMessages(prev => prev.map(msg => 
              msg.id === tempId
                ? { 
                    ...msg, 
                    id: response.data.id, 
                    _isTemp: false,
                    _useLocalUri: true,
                    _localUri: localUri // 保存本地URI用于播放
                  }
                : msg
            ));
          } else {
            // 正常更新消息
            setMessages(prev => prev.map(msg => 
              msg.id === tempId
                ? { ...msg, id: response.data.id, _isTemp: false }
                : msg
            ));
          }
        }
      } catch (uploadError) {
        console.error('处理上传或发送过程中出错:', uploadError);
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, _sendFailed: true } 
            : msg
        ));
        Alert.alert('错误', '处理语音消息时出现问题');
      } finally {
        setSending(false);
        setRecordingDuration(0);
      }
    } catch (error) {
      console.error('停止录音过程中出错:', error);
      Alert.alert('错误', '处理语音消息时出现问题');
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };
  
  // 处理音频播放状态变化
  const handleAudioPlayStateChange = (messageId, isPlaying) => {
    // 如果有其他正在播放的消息，先停止它
    if (isPlaying && currentlyPlayingId && currentlyPlayingId !== messageId) {
      // 通知之前的消息停止播放
      setCurrentlyPlayingId(null);
      // 短暂延迟后设置新的播放ID
      setTimeout(() => {
        setCurrentlyPlayingId(messageId);
      }, 50);
    } else {
      setCurrentlyPlayingId(isPlaying ? messageId : null);
    }
  };
  
  const animateBackButton = () => {
    // 标记按钮为按下状态（用于背景色）
    setIsBackButtonPressed(true);
    
    // 缩放动画 - 只使用原生驱动
    Animated.sequence([
      // 缩小 - 缩放比例更大
      Animated.timing(backButtonScale, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      // 恢复
      Animated.timing(backButtonScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      // 动画完成后延迟一点时间再执行返回操作
      setTimeout(() => {
        handleGoBack();
      }, 50);
    });
  };
  
  const handleGoBack = () => {
    // 立即取消可能干扰导航的订阅
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    // 使用更明确的导航方式
    router.replace('/(main)/messages');
  };
  
  // 渲染消息项
  const renderMessageItem = ({ item }) => {
    const isMyMessage = item.senderId === user.id;
    const isTempMessage = item._isTemp === true;
    const sendFailed = item._sendFailed === true;
    
    // 获取用户头像URL
    const myAvatarUrl = user?.user_metadata?.avatar_url || user?.image;
    const otherAvatarUrl = otherUser?.image;
    
    // 如果是语音消息
    if (item.type === 'audio') {
      // 优先使用标记的本地URI（如果有）
      const audioUri = item._useLocalUri ? item._localUri : item.media_url;
      
      // 日志跟踪
      if (item._useLocalUri) {
        console.log('使用本地URI播放音频:', item._localUri);
      }
      
      return (
        <View style={styles.messageRow}>
          {!isMyMessage ? (
            <View style={styles.otherMessageRow}>
              <Avatar 
                uri={otherAvatarUrl} 
                size={36} 
              />
              
              <AudioMessage 
                audioUrl={audioUri}
                localAudioUri={item._localUri} // 传递本地URI作为备用
                duration={item.audio_duration || 0}
                isCurrentUser={false}
                onPlayStateChange={(isPlaying) => handleAudioPlayStateChange(item.id, isPlaying)}
              />
            </View>
          ) : (
            <View style={styles.myMessageRow}>
              <AudioMessage 
                audioUrl={audioUri}
                localAudioUri={item._localUri} // 传递本地URI作为备用
                duration={item.audio_duration || 0}
                isCurrentUser={true}
                onPlayStateChange={(isPlaying) => handleAudioPlayStateChange(item.id, isPlaying)}
              />
              
              <Avatar 
                uri={myAvatarUrl} 
                size={36} 
              />
            </View>
          )}
        </View>
      );
    }
    
    // 文本消息
    return (
      <View style={styles.messageRow}>
        {/* 对方的消息 */}
        {!isMyMessage ? (
          <View style={styles.otherMessageRow}>
            <Avatar 
              uri={otherAvatarUrl} 
              size={36} 
            />
            
            <View style={[
              styles.messageBubble,
              styles.otherMessageBubble,
              isTempMessage && styles.tempMessageBubble,
              sendFailed && styles.failedMessageBubble
            ]}>
              <Text style={[styles.messageText, styles.otherMessageText]}>
                {item.content}
              </Text>
              
              {sendFailed && <Text style={styles.errorText}>发送失败</Text>}
              
              {isTempMessage && !sendFailed && (
                <View style={styles.sendingIndicator}>
                  <ActivityIndicator size="small" color={theme.colors.textLight} />
                </View>
              )}
            </View>
          </View>
        ) : (
          /* 我的消息 */
          <View style={styles.myMessageRow}>
            <View style={[
              styles.messageBubble,
              styles.myMessageBubble,
              isTempMessage && styles.tempMessageBubble,
              sendFailed && styles.failedMessageBubble
            ]}>
              <Text style={[styles.messageText, styles.myMessageText]}>
                {item.content}
              </Text>
              
              {sendFailed && <Text style={styles.errorText}>发送失败</Text>}
              
              {isTempMessage && !sendFailed && (
                <View style={styles.sendingIndicator}>
                  <ActivityIndicator size="small" color="white" />
                </View>
              )}
            </View>
            
            <Avatar 
              uri={myAvatarUrl} 
              size={36} 
            />
          </View>
        )}
      </View>
    );
  };
  
  // 渲染输入区域（语音或文本）
  const renderInputArea = () => {
    // 语音输入模式
    if (inputMode === 'audio') {
      return (
        <View style={styles.inputContainer}>
          {/* 切换到文本输入按钮 */}
          <TouchableOpacity 
            style={styles.modeToggleButton} 
            onPress={toggleInputMode}
            activeOpacity={0.7}
          >
            <Icon name="keyboard" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          
          {/* 录音按钮 */}
          <Pressable
            style={[
              styles.voiceRecordButton,
              isRecording && styles.voiceRecordButtonActive
            ]}
            onPressIn={startRecordingHandler}
            onPressOut={stopRecordingAndSend}
            disabled={sending}
            delayLongPress={200}
          >
            {sending ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color={theme.colors.white} />
                <Text style={styles.voiceRecordText}>处理中...</Text>
              </View>
            ) : (
              <View style={styles.recordingButtonContent}>
                <Text style={[
                  styles.voiceRecordText,
                  isRecording && styles.voiceRecordTextActive
                ]}>
                  {isRecording ? `录音中 ${recordingDuration}s` : '按住 说话'}
                </Text>
                <Icon 
                  name="mic" 
                  size={20} 
                  color={isRecording ? theme.colors.white : theme.colors.text} 
                />
              </View>
            )}
          </Pressable>
        </View>
      );
    }
    
    // 文本输入模式
    return (
      <View style={styles.inputContainer}>
        {/* 切换到语音输入按钮 */}
        <TouchableOpacity 
          style={styles.modeToggleButton} 
          onPress={toggleInputMode}
          activeOpacity={0.7}
        >
          <Icon name="mic" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        
        {/* 文本输入框 */}
        <TextInput
          style={styles.input}
          placeholder="输入消息..."
          placeholderTextColor={theme.colors.textLight}
          value={inputMessage}
          onChangeText={setInputMessage}
          multiline
        />
        
        {/* 发送按钮 */}
        <TouchableOpacity
          style={[
            styles.sendButton, 
            !inputMessage.trim() && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!inputMessage.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <View style={styles.sendIconContainer}>
              <Icon name="send" size={20} color="white" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <ScreenWrapper bg="white">
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButtonWrapper}
          onPress={animateBackButton}
          onPressIn={() => setIsBackButtonPressed(true)}
          onPressOut={() => setIsBackButtonPressed(false)}
          activeOpacity={0.7}
          delayPressIn={0}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Animated.View 
            style={[
              styles.backButtonContainer,
              {
                transform: [{ scale: backButtonScale }],
                backgroundColor: isBackButtonPressed ? '#cce5ff' : '#f0f8ff',
                borderWidth: isBackButtonPressed ? 2 : 1,
                borderColor: isBackButtonPressed ? theme.colors.primary : 'rgba(0,0,0,0.05)',
                elevation: isBackButtonPressed ? 4 : 2,
              }
            ]}
          >
            <Icon 
              name="arrowLeft" 
              size={22} 
              color={isBackButtonPressed ? theme.colors.primary : theme.colors.text} 
            />
          </Animated.View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userName || '对话'}</Text>
        <View style={styles.headerRight} />
      </View>
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* 消息列表 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {/* 输入区域 */}
        {renderInputArea()}
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  backButtonWrapper: {
    padding: 12,
    marginLeft: -10,
    marginRight: 6,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: -36, // 为了视觉上的居中
  },
  headerRight: {
    width: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    width: '100%',
    marginBottom: 16,
  },
  otherMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  myMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '85%',
    minWidth: 40,
    marginHorizontal: 8,
  },
  myMessageBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  otherMessageBubble: {
    backgroundColor: theme.colors.greyLight,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  messageText: {
    fontSize: hp(1.8),
    lineHeight: hp(2.5),
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  tempMessageBubble: {
    opacity: 0.8,
  },
  failedMessageBubble: {
    borderWidth: 1,
    borderColor: 'red',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: hp(1.8),
    backgroundColor: '#f8f8f8',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: theme.colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sendIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  errorText: {
    fontSize: hp(1.4),
    color: 'red',
    marginTop: 4,
  },
  sendingIndicator: {
    position: 'absolute',
    right: 8,
    bottom: 8,
  },
  
  // 新增样式 - 语音输入相关
  modeToggleButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  voiceRecordButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  voiceRecordButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  recordingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceRecordText: {
    marginRight: 8,
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  voiceRecordTextActive: {
    color: theme.colors.white,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Conversation; 