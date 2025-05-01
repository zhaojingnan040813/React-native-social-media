import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { hp, wp } from '../../helpers/common'
import { useAuth } from '../../contexts/AuthContext'
import { theme } from '../../constants/theme'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../../components/ScreenWrapper'
import Icon from '../../assets/icons'
import PostCard from '../../components/PostCard'
import Loading from '../../components/Loading'
import { getUserBookmarks } from '../../services/bookmarkService'

const MyBookmarks = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 首次加载收藏帖子
  useEffect(() => {
    loadBookmarks();
  }, []);

  // 加载收藏帖子
  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const res = await getUserBookmarks(user.id);
      if (res.success) {
        setBookmarks(res.data || []);
      } else {
        Alert.alert('提示', '获取收藏失败');
      }
    } catch (error) {
      console.error('加载收藏出错:', error);
      Alert.alert('错误', '加载收藏时出现错误');
    } finally {
      setLoading(false);
    }
  };

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookmarks();
    setRefreshing(false);
  }, []);

  // 返回个人资料页面
  const handleGoBack = () => {
    router.push('/(main)/profile');
  };

  // 处理取消收藏，从列表中移除对应帖子
  const handlePostRemoved = (postId) => {
    setBookmarks(bookmarks.filter(post => post.id !== postId));
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
        <Text style={styles.headerTitle}>我的收藏</Text>
      </View>

      {loading && bookmarks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          renderItem={({ item }) => (
            <PostCard
              item={item}
              currentUser={user}
              router={router}
              onBookmarkChange={() => handlePostRemoved(item.id)}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="bookmark" size={60} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>您还没有收藏任何帖子</Text>
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
  listContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: 10,
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
    gap: 15,
  },
  emptyText: {
    fontSize: hp(2),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});

export default MyBookmarks; 