import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native'
import React, { useState, useCallback, useEffect } from 'react'
import { hp, wp } from '../../helpers/common'
import { useAuth } from '../../contexts/AuthContext'
import { theme } from '../../constants/theme'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../../components/ScreenWrapper'
import Icon from '../../assets/icons'
import Loading from '../../components/Loading'
import { fetchUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../../services/notificationService'
import { timeAgo } from '../../helpers/dateHelper'
import { useNotification } from '../../contexts/NotificationContext'

const Notifications = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // 使用通知上下文
  const { fetchUnreadCount } = useNotification();

  // 获取通知列表
  const getNotifications = async () => {
    if (!user?.id) return;
    
    try {
      const result = await fetchUserNotifications(user.id);
      if (result.success) {
        setNotifications(result.data || []);
      } else {
        console.error('获取通知失败', result.error);
      }
    } catch (error) {
      console.error('获取通知出错:', error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取通知
  useEffect(() => {
    getNotifications();
  }, [user?.id]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getNotifications();
    // 刷新未读通知数量
    fetchUnreadCount();
    setRefreshing(false);
  }, [user?.id]);

  // 返回个人资料页面
  const handleGoBack = () => {
    router.push('/(main)/profile');
  };

  // 标记所有通知为已读
  const handleMarkAllAsRead = async () => {
    if (!user?.id || notifications.length === 0) return;

    try {
      const unreadExists = notifications.some(item => !item.isread);
      if (!unreadExists) {
        Alert.alert('提示', '没有未读通知');
        return;
      }

      const result = await markAllNotificationsAsRead(user.id);
      if (result.success) {
        // 更新本地通知状态
        setNotifications(prev => 
          prev.map(item => ({ ...item, isread: true }))
        );
        // 更新全局未读通知数量
        fetchUnreadCount();
        Alert.alert('提示', '已将所有通知标记为已读');
      }
    } catch (error) {
      console.error('标记所有已读失败:', error);
      Alert.alert('提示', '操作失败，请稍后再试');
    }
  };

  // 标记单个通知为已读
  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        // 更新本地通知状态
        setNotifications(prev => 
          prev.map(item => 
            item.id === notificationId ? { ...item, isread: true } : item
          )
        );
        // 更新全局未读通知数量
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 处理通知点击
  const handleNotificationPress = async (notification) => {
    // 如果未读，标记为已读
    if (!notification.isread) {
      await handleMarkAsRead(notification.id);
    }

    // 根据通知类型导航到相应页面
    try {
      const notificationData = notification.data ? JSON.parse(notification.data) : {};
      const { postId } = notificationData;

      if (postId) {
        // 导航到帖子详情页
        router.push({
          pathname: '/(main)/post/[id]',
          params: { id: postId }
        });
      }
    } catch (error) {
      console.error('解析通知数据出错:', error);
      Alert.alert('提示', '无法打开此通知');
    }
  };

  // 渲染通知项
  const renderNotificationItem = ({ item }) => {
    let notificationData;
    try {
      notificationData = JSON.parse(item.data);
    } catch (error) {
      notificationData = {};
    }

    // 获取发送者信息
    const sender = item.sender || {};
    
    // 根据通知类型来定制显示内容
    let content = '';
    let iconName = 'notifications';
    
    switch (item.type) {
      case 'like':
        content = '赞了你的帖子';
        iconName = 'heart';
        break;
      case 'comment':
        const commentText = notificationData.commentText || '';
        const briefText = commentText.length > 30 ? `${commentText.substring(0, 30)}...` : commentText;
        content = `评论了你的帖子: ${briefText}`;
        iconName = 'message-circle';
        break;
      default:
        content = '有新消息';
        break;
    }

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isread && styles.unreadItem
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        {/* 左侧用户头像 */}
        <View style={styles.avatarContainer}>
          {sender.image ? (
            <Image source={{ uri: sender.image }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Icon name="user" size={24} color={theme.colors.gray} />
            </View>
          )}
          <View style={styles.iconOverlay}>
            <Icon name={iconName} size={14} color={theme.colors.white} />
          </View>
        </View>
        
        {/* 通知内容 */}
        <View style={styles.contentContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{sender.name || '用户'}</Text>
            <Text style={styles.timeAgo}>{timeAgo(item.created_at)}</Text>
          </View>
          <Text style={styles.notificationText}>{content}</Text>
          
          {/* 未读标记 */}
          {!item.isread && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
        >
          <Icon name="arrowLeft" strokeWidth={2.5} size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>消息通知</Text>
        {notifications.length > 0 && (
          <TouchableOpacity 
            style={styles.markAllReadButton} 
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllReadText}>全部已读</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="notifications" size={60} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>暂无消息通知</Text>
              <Text style={styles.subText}>收到点赞和评论时将会在这里显示</Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: wp(4),
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray + '20',
  },
  backButton: {
    position: 'absolute',
    left: wp(4),
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: theme.radius.sm,
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  markAllReadButton: {
    position: 'absolute',
    right: wp(4),
    padding: 5,
  },
  markAllReadText: {
    fontSize: hp(1.8),
    color: theme.colors.primary,
  },
  listContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: 10,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(20),
    gap: 8,
  },
  emptyText: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 15,
  },
  subText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray + '10',
  },
  unreadItem: {
    backgroundColor: theme.colors.primary + '05',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    backgroundColor: theme.colors.gray + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOverlay: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: hp(1.8),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  timeAgo: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  notificationText: {
    fontSize: hp(1.7),
    color: theme.colors.text,
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
});

export default Notifications; 