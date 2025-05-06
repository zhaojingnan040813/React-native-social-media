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
import { supabase } from '../../lib/supabase';

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
  const subscription = useRef(null);
  
  // 加载消息并订阅实时更新
  useEffect(() => {
    loadMessages();
    
    // 设置实时订阅
    setupMessagesSubscription();
    
    // 清理函数
    return () => {
      if (subscription.current) {
        supabase.removeChannel(subscription.current);
      }
    };
  }, [conversationId]);
  
  // 加载对话消息
  const loadMessages = async () => {
    try {
      setLoading(true);
      
      // 验证必要参数
      if (!conversationId || !user?.id) {
        console.error('缺少必要参数：', { conversationId, userId: user?.id });
        Alert.alert('提示', '无法加载对话，请返回重试');
        router.back();
        return;
      }
      
      const response = await getConversationMessages(conversationId);
      
      if (response.success) {
        setMessages(response.data);
        
        // 标记消息为已读
        await markMessagesAsRead(conversationId, user.id);
      } else {
        console.error('加载消息失败:', response.msg);
        Alert.alert('提示', '无法加载消息: ' + response.msg);
      }
    } catch (error) {
      console.error('加载消息出错:', error);
      Alert.alert('错误', '加载消息时出现问题');
    } finally {
      setLoading(false);
    }
  };
  
  // 设置消息实时订阅
  const setupMessagesSubscription = () => {
    try {
      if (!conversationId) return;
      
      const channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            // 添加新消息到列表
            setMessages((prev) => [...prev, payload.new]);
            
            // 如果消息接收者是当前用户，标记为已读
            if (payload.new.receiverId === user.id) {
              markMessagesAsRead(conversationId, user.id);
            }
          }
        )
        .subscribe();
      
      subscription.current = channel;
    } catch (error) {
      console.error('设置实时订阅失败:', error);
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
    
    try {
      setSending(true);
      
      const response = await sendMessage(
        conversationId,
        user.id,
        userId,
        inputMessage.trim()
      );
      
      if (response.success) {
        setInputMessage('');
        
        // 滚动到底部
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.error('发送消息失败:', response.msg);
        Alert.alert('发送失败', '无法发送消息，请稍后再试：' + response.msg);
      }
    } catch (error) {
      console.error('发送消息出错:', error);
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
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMyMessage && (
          <Avatar source={null} size={36} style={styles.messageAvatar} />
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
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
            keyExtractor={(item) => item.id.toString()}
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
});

export default Conversation; 