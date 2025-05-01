import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { hp, wp } from '../../helpers/common'
import { useAuth } from '../../contexts/AuthContext'
import { theme } from '../../constants/theme'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../../components/ScreenWrapper'
import Icon from '../../assets/icons'
import { fetchPosts } from '../../services/postService'
import PostCard from '../../components/PostCard'
import Loading from '../../components/Loading'

const MyPosts = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [limit, setLimit] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  
  // 首次加载帖子
  useEffect(() => {
    loadPosts();
  }, []);
  
  // 加载帖子函数
  const loadPosts = async (reset = false) => {
    setLoading(true);
    const newLimit = reset ? 10 : limit + 10;
    
    try {
      const res = await fetchPosts(newLimit, user.id);
      if (res.success) {
        setPosts(res.data || []);
        // 检查是否还有更多帖子
        if (res.data && res.data.length < newLimit) {
          setHasMore(false);
        } else {
          setLimit(newLimit);
        }
      } else {
        Alert.alert('提示', '获取帖子失败');
      }
    } catch (error) {
      console.error('加载帖子出错:', error);
      Alert.alert('错误', '加载帖子时出现错误');
    } finally {
      setLoading(false);
    }
  };
  
  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setHasMore(true);
    setLimit(10);
    await loadPosts(true);
    setRefreshing(false);
  }, []);
  
  // 处理删除帖子
  const handleDelete = async (post) => {
    // 简单移除前端显示，实际删除逻辑应该在PostCard组件中实现
    setPosts(posts.filter(p => p.id !== post.id));
  };
  
  // 处理编辑帖子
  const handleEdit = (post) => {
    router.push({
      pathname: '/newPost',
      params: post
    });
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push('/profile')}
        >
          <Icon name="arrowLeft" strokeWidth={2.5} size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的帖子</Text>
      </View>
      
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            currentUser={user}
            router={router}
            showDelete={true}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={() => {
          if (hasMore && !loading) {
            loadPosts();
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>您还没有发布任何帖子</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <Loading />
            </View>
          ) : hasMore ? null : (
            <Text style={styles.noMoreText}>没有更多帖子了</Text>
          )
        }
      />
    </ScreenWrapper>
  )
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
  listContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
  },
  emptyText: {
    fontSize: hp(2),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noMoreText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    paddingVertical: 20,
    fontSize: hp(1.8),
  },
})

export default MyPosts 