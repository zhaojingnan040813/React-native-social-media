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
  Alert
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import { getConversationMessages, sendMessage, markMessagesAsRead } from '../../services/messageService';
import { subscribeToConversation } from '../../services/realtimeService';

const Conversation = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { conversationId, userId, userName } = params;
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const flatListRef = useRef(null);
  const subscriptionRef = useRef(null);
  const messageCache = useRef(new Set()).current; // 消息ID缓存，用于客户端去重
  
  // 加载消息并订阅实时更新
  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
    }
    
    // 组件卸载时清理订阅
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [conversationId]);
  
  // 加载对话消息
  const loadMessages = async () => {
    try {
      setLoading(true);
      
      // 验证必要参数
      if (!conversationId || !user?.id) {
        // console.error('缺少必要参数：', { conversationId, userId: user?.id });
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
        // console.error('加载消息失败:', response.msg);
        Alert.alert('提示', '无法加载消息: ' + response.msg);
      }
    } catch (error) {
      // console.error('加载消息出错:', error);
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
  
  // 处理发送消息
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
        
        // console.error('发送消息失败:', response.msg);
        Alert.alert('发送失败', '无法发送消息，请稍后再试：' + response.msg);
      } else {
        // console.log(`消息发送成功: ${response.data.id}`);
        // 服务端会通过实时通知更新消息状态，这里不需要额外操作
      }
    } catch (error) {
      // 标记消息为失败状态
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, _sendFailed: true } 
          : msg
      ));
      
      // console.error('发送消息出错:', error);
      Alert.alert('错误', '发送消息时出现问题：' + error.message);
    } finally {
      setSending(false);
    }
  };
  
  // 返回上一页
  const handleGoBack = () => {
    router.back();
  };
  
  // 渲染消息项
  const renderMessageItem = ({ item }) => {
    const isMyMessage = item.senderId === user.id;
    const isTempMessage = item._isTemp === true;
    const sendFailed = item._sendFailed === true;
    
    return (
      <View 
        key={item.id} 
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}
      >
        {!isMyMessage && (
          <Avatar source={null} size={36} style={styles.messageAvatar} />
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          isTempMessage && styles.tempMessageBubble,
          sendFailed && styles.failedMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          
          {sendFailed && (
            <Text style={styles.errorText}>发送失败</Text>
          )}
          
          {isTempMessage && !sendFailed && (
            <View style={styles.sendingIndicator}>
              <ActivityIndicator size="small" color={isMyMessage ? "white" : theme.colors.textLight} />
            </View>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <ScreenWrapper bg="white">
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonContainer}>
            <Icon name="arrowLeft" size={22} color={theme.colors.primary} />
          </View>
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
        
        {/* 底部输入框 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="输入消息..."
            placeholderTextColor={theme.colors.textLight}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
          />
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
  backButton: {
    padding: 2,
  },
  backButtonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
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
    alignItems: 'flex-end',
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
});

export default Conversation; 