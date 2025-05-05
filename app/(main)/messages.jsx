import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { theme } from '../../constants/theme'
import { hp, wp } from '../../helpers/common'
import { useAuth } from '../../contexts/AuthContext'
import { getAllUsers } from '../../services/userService'
import { getUserConversations, getOrCreateConversation } from '../../services/messageService'
import Loading from '../../components/Loading'
import Avatar from '../../components/Avatar'
import { useRouter } from 'expo-router'

const Messages = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 初始加载
  useEffect(() => {
    loadData();
  }, []);

  // 加载所有数据
  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadUsers(),
      loadConversations()
    ]);
    setLoading(false);
  };

  // 加载用户列表
  const loadUsers = async () => {
    if (!user?.id) return;
    
    const result = await getAllUsers(user.id);
    if (result.success) {
      setUsers(result.data || []);
    } else {
      console.log('获取用户列表失败:', result.msg);
    }
  };

  // 加载对话列表
  const loadConversations = async () => {
    if (!user?.id) return;
    
    const result = await getUserConversations(user.id);
    if (result.success) {
      setConversations(result.data || []);
    } else {
      console.log('获取对话列表失败:', result.msg);
    }
  };

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // 处理点击用户项
  const handleUserPress = async (selectedUser) => {
    if (!user?.id) return;
    
    // 显示加载中
    setLoading(true);
    
    try {
      // 获取或创建对话
      const result = await getOrCreateConversation(user.id, selectedUser.id);
      
      if (result.success) {
        // 导航到对话页面
        router.push({
          pathname: '/(secondary)/conversation',
          params: { 
            conversationId: result.data.id,
            userId: selectedUser.id,
            userName: selectedUser.name
          }
        });
      } else {
        Alert.alert('提示', '无法创建对话，请稍后再试');
      }
    } catch (error) {
      console.log('处理对话出错:', error);
      Alert.alert('错误', '处理对话时出现问题');
    } finally {
      setLoading(false);
    }
  };

  // 渲染用户项
  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
    >
      <Avatar 
        source={item.image} 
        size={50} 
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userMeta}>
          {item.college && item.major 
            ? `${item.college} · ${item.major}` 
            : item.StudentIdNumber || '学生'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // 显示加载中状态
  if (loading && !refreshing) {
    return (
      <ScreenWrapper bg="white">
        <View style={styles.container}>
          <Text style={styles.title}>私信</Text>
          <Loading />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Text style={styles.title}>私信</Text>
        
        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无其他用户</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  title: {
    fontSize: hp(3),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 10
  },
  listContent: {
    paddingBottom: 20
  },
  userItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center'
  },
  avatar: {
    marginRight: 12
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4
  },
  userMeta: {
    fontSize: hp(1.7),
    color: theme.colors.textLight
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: hp(2.2),
    color: theme.colors.textLight,
    textAlign: 'center'
  }
})

export default Messages 