import { View, Text, Button, Alert, StyleSheet, Pressable, ScrollView, FlatList, RefreshControl } from 'react-native'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { supabase, channelManager } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {Svg, Circle, Path} from 'react-native-svg';
import { theme } from '../../constants/theme'
import Icon from '../../assets/icons'
import { Image } from 'expo-image'
import { getUserImageSrc } from '../../services/imageService'
import { hp, wp } from '../../helpers/common'
import { useRouter } from 'expo-router'
import { fetchPosts, searchPostsByTag } from '../../services/postService'
import PostCard from '../../components/PostCard'
import Loading from '../../components/Loading'
import { getUserData } from '../../services/userService'
import Avatar from '../../components/Avatar'
import AsyncStorage from '@react-native-async-storage/async-storage'

// 初始加载的帖子数量
const initialLimit = 10;
// 数据缓存键
const POSTS_CACHE_KEY = 'home_posts_cache';
// 设置节流延迟时间(毫秒)
const THROTTLE_DELAY = 2000;

const HomeScreen = () => {
    const {user, setAuth} = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [limit, setLimit] = useState(initialLimit);
    const [activeTag, setActiveTag] = useState(null);
    
    // 添加节流控制
    const throttleTimerRef = useRef(null);
    const isLoadingRef = useRef(false);
    
    // 使用ref跟踪组件是否已卸载
    const isMountedRef = useRef(true);

    const handlePostEvent = async (payload) => {
      // 如果组件已卸载，不处理事件
      if (!isMountedRef.current) return;
      
      if (payload.eventType == 'INSERT' && payload?.new?.id) {
        let newPost = {...payload.new};
        let res = await getUserData(newPost.userId);
        newPost.user = res.success ? res.data : {};
        newPost.postLikes = []; // while adding likes
        newPost.comments = [{count: 0}] // while adding comments
        setPosts(prevPosts => [newPost, ...prevPosts]);
      }

      if (payload.eventType == 'DELETE' && payload?.old?.id) {
        setPosts(prevPosts => {
          let updatedPosts = prevPosts.filter(post => post.id!=payload.old.id);
          return updatedPosts;
        });
      }

      if (payload.eventType == 'UPDATE' && payload?.new?.id) {
        setPosts(prevPosts => {
          let updatedPosts = prevPosts.map(post => {
            if (post.id==payload.new.id) {
              post.body = payload.new.body;
              post.file = payload.new.file;
            }
            return post;
          });
          return updatedPosts;
        });
      }
    }

    // 尝试从缓存加载帖子
    const loadFromCache = async () => {
      try {
        const cachedData = await AsyncStorage.getItem(POSTS_CACHE_KEY);
        if (cachedData) {
          const { posts: cachedPosts, timestamp } = JSON.parse(cachedData);
          // 如果缓存不超过5分钟，使用缓存数据
          if (Date.now() - timestamp < 5 * 60 * 1000 && cachedPosts.length > 0) {
            setPosts(cachedPosts);
            return true;
          }
        }
      } catch (error) {
        console.error('Error loading from cache:', error);
      }
      return false;
    };

    // 保存数据到缓存
    const saveToCache = async (postsData) => {
      try {
        const data = {
          posts: postsData,
          timestamp: Date.now()
        };
        await AsyncStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error('Error saving to cache:', error);
      }
    };

    useEffect(() => {
      isMountedRef.current = true;
      
      // 使用通道管理器获取或创建通道
      const postsChannel = channelManager.getOrCreateChannel('posts', null);
      
      // 添加帖子变更事件监听
      postsChannel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePostEvent);
      
      // 使用通道管理器获取或创建评论通道
      const commentsChannel = channelManager.getOrCreateChannel('comments-home', null);
      
      // 添加评论变更事件监听
      commentsChannel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, handleCommentInsert)
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, handleCommentDelete);

      // 尝试从缓存加载，如果缓存不存在或过期，则获取新数据
      loadFromCache().then(cacheHit => {
        if (!cacheHit) {
          getPosts();
        }
      });

      return () => {
        // 标记组件已卸载
        isMountedRef.current = false;
        
        // 移除通道订阅
        channelManager.removeChannelSubscriber('posts');
        channelManager.removeChannelSubscriber('comments-home');
        
        // 清除节流定时器
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
        }
      }
    }, []);
    
    // 节流函数
    const throttle = (func) => {
      if (isLoadingRef.current || throttleTimerRef.current) return;
      
      isLoadingRef.current = true;
      func();
      
      throttleTimerRef.current = setTimeout(() => {
        throttleTimerRef.current = null;
        isLoadingRef.current = false;
      }, THROTTLE_DELAY);
    };
    
    // 处理标签点击
    const handleTagPress = async (tag) => {
      // 如果是同一个标签，取消过滤
      if (activeTag === tag) {
        setActiveTag(null);
        // 重新获取所有帖子
        onRefresh();
        return;
      }
      
      // 设置当前过滤标签
      setActiveTag(tag);
      setIsLoading(true);
      
      try {
        // 获取包含该标签的帖子
        const res = await searchPostsByTag(tag, initialLimit);
        if (res.success) {
          setPosts(res.data);
          // 如果返回的数据少于请求的数量，说明没有更多数据了
          setHasMore(res.data.length >= initialLimit);
        }
      } catch (error) {
        console.error('按标签过滤帖子时出错:', error);
        Alert.alert('提示', '过滤帖子失败，请稍后再试');
      } finally {
        setIsLoading(false);
      }
    };
    
    // 更新下拉刷新处理函数，考虑标签过滤
    const onRefresh = useCallback(async () => {
      setRefreshing(true);
      try {
        // 重置状态
        setLimit(initialLimit);
        setHasMore(true);
        
        // 根据是否有激活的标签决定获取方式
        let res;
        if (activeTag) {
          res = await searchPostsByTag(activeTag, initialLimit);
        } else {
          res = await fetchPosts(initialLimit);
        }
        
        if (res.success) {
          setPosts(res.data);
          // 保存到缓存
          if (!activeTag) {
            saveToCache(res.data);
          }
          // 如果返回的数据少于请求的数量，说明没有更多数据了
          if (res.data.length < initialLimit) {
            setHasMore(false);
          }
        }
      } catch (error) {
        console.error('刷新数据时出错:', error);
        Alert.alert('提示', '刷新数据失败，请稍后再试');
      } finally {
        setRefreshing(false);
      }
    }, [activeTag]);
    
    // 更新获取帖子函数，考虑标签过滤和节流控制
    const getPosts = async () => {
      // 如果已经没有更多数据或者正在加载中，直接返回
      if (!hasMore || isLoading) return;

      setIsLoading(true);
      
      try {
        // 根据是否有激活的标签决定获取方式
        let res;
        if (activeTag) {
          res = await searchPostsByTag(activeTag, limit);
        } else {
          res = await fetchPosts(limit);
        }
        
        if (res.success) {
          // 如果获取的数据数量与当前显示的一样，说明没有更多数据了
          if (posts.length > 0 && posts.length === res.data.length) {
            setHasMore(false);
          } else {
            setPosts(res.data);
            // 保存到缓存（只保存非标签筛选的数据）
            if (!activeTag) {
              saveToCache(res.data);
            }
            // 如果返回的数据少于请求的数量，也说明没有更多数据了
            if (res.data.length < limit) {
              setHasMore(false);
            } else {
              // 否则增加下次加载的数量，使用 setState 更新 limit
              setLimit(prevLimit => prevLimit + initialLimit);
            }
          }
        } else {
          // 请求失败时也设置没有更多数据
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    }

    // 节流加载更多
    const handleLoadMore = () => {
      if (hasMore && !isLoading) {
        throttle(getPosts);
      }
    };

    // 处理评论添加事件
    const handleCommentInsert = async (payload) => {
      // 如果组件已卸载，不处理事件
      if (!isMountedRef.current) return;
      
      const postId = payload.new?.postId;
      
      if (postId) {
        // 获取该帖子的当前评论数
        const { data: comments, error } = await supabase
          .from('comments')
          .select('id')
          .eq('postId', postId);
          
        if (error) {
          console.error('获取评论数量出错:', error);
          return;
        }
        
        const commentCount = comments?.length || 0;
        
        setPosts(prevPosts => {
          return prevPosts.map(post => {
            if (post.id === postId) {
              // 设置最新的评论计数
              return {
                ...post,
                comments: [{ count: commentCount }]
              };
            }
            return post;
          });
        });
      }
    };
    
    // 处理评论删除事件
    const handleCommentDelete = async (payload) => {
      // 如果组件已卸载，不处理事件
      if (!isMountedRef.current) return;
      
      const postId = payload.old?.postId;
      
      if (postId) {
        // 获取该帖子的当前评论数
        const { data: comments, error } = await supabase
          .from('comments')
          .select('id')
          .eq('postId', postId);
          
        if (error) {
          console.error('获取评论数量出错:', error);
          return;
        }
        
        const commentCount = comments?.length || 0;
        
        setPosts(prevPosts => {
          return prevPosts.map(post => {
            if (post.id === postId) {
              // 设置最新的评论计数
              return {
                ...post,
                comments: [{ count: commentCount }]
              };
            }
            return post;
          });
        });
      }
    };

    // 添加一个函数来更新所有帖子的评论计数
    const updateCommentsCount = async () => {
      if (!posts || posts.length === 0) return;
      
      try {
        // 获取所有当前显示的帖子ID
        const postIds = posts.map(post => post.id);
        
        // 从数据库获取最新的评论计数
        const { data: comments, error: commentsError } = await supabase
          .from('comments')
          .select('postId')
          .in('postId', postIds);
          
        if (commentsError) {
          console.error('获取评论计数出错:', commentsError);
          return;
        }
        
        if (!comments || comments.length === 0) {
          return;
        }
        
        // 计算每个帖子的评论数
        const countMap = {};
        comments.forEach(comment => {
          const postId = comment.postId;
          countMap[postId] = (countMap[postId] || 0) + 1;
        });
        
        // 更新帖子数据中的评论计数
        setPosts(prevPosts => {
          return prevPosts.map(post => {
            const commentCount = countMap[post.id] || 0;
            
            // 仅当评论数量有变化时更新
            const currentCount = post.comments?.[0]?.count || 0;
            if (currentCount !== commentCount) {
              return {
                ...post,
                comments: [{ count: commentCount }]
              };
            }
            
            return post;
          });
        });
        
      } catch (error) {
        console.error('更新评论计数出错:', error);
      }
    };
    
    // 组件挂载和第一次加载完成后，更新评论计数
    useEffect(() => {
      if (posts.length > 0 && !isLoading && !refreshing) {
        updateCommentsCount();
      }
    }, [posts.length, isLoading, refreshing]);
    
    // 定期更新评论计数
    useEffect(() => {
      const intervalId = setInterval(() => {
        if (isMountedRef.current && posts.length > 0) {
          updateCommentsCount();
        }
      }, 30000); // 每30秒更新一次
      
      return () => clearInterval(intervalId);
    }, [posts.length]);

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          <Text style={styles.title}>帖子</Text>
        </View>
        
        {/* 当前活跃标签显示 */}
        {activeTag && (
          <View style={styles.activeTagContainer}>
            <Text style={styles.activeTagLabel}>当前筛选: </Text>
            <Pressable 
              style={styles.activeTagChip}
              onPress={() => handleTagPress(activeTag)}
            >
              <Text style={styles.activeTagText}>#{activeTag}</Text>
              <Icon name="close" size={16} color={theme.colors.primary} />
            </Pressable>
          </View>
        )}

        {/* posts */}
        <FlatList
          data={posts}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
          keyExtractor={(item, index) => item.id.toString()}
          renderItem={({ item }) => (
            <PostCard 
              item={item} 
              currentUser={user}
              router={router}
              onTagPress={handleTagPress}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]} // Android
              tintColor={theme.colors.primary} // iOS
              title="下拉刷新" // iOS
              titleColor={theme.colors.textLight} // iOS
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5} // 提前触发加载更多，避免用户滚动太快
          ListFooterComponent={
            posts.length > 0 ? (
              isLoading ? (
                <View style={{marginVertical: 30}}>
                  <Loading />
                </View>
              ) : (
                !hasMore && (
                  <View style={{marginVertical: 30}}>
                    <Text style={styles.noPosts}>没有更多帖子了</Text>
                  </View>
                )
              )
            ) : (
              isLoading ? (
                <View style={{marginVertical: 200}}>
                  <Loading />
                </View>
              ) : (
                <View style={{marginVertical: 200}}>
                  <Text style={styles.noPosts}>暂无帖子</Text>
                </View>
              )
            )
          }
        />
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingHorizontal: wp(4)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginHorizontal: wp(4)
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold
  },
  avatarImage: {
    height: hp(4.3),
    width: hp(4.3),
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray,
    borderWidth: 3
  },
  listStyle: {
    paddingTop: 20,
    paddingHorizontal: wp(4)
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.text
  },
  // 活跃标签样式
  activeTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(4),
    marginBottom: 10,
  },
  activeTagLabel: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
  activeTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 142, 239, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    gap: 5,
  },
  activeTagText: {
    fontSize: hp(1.7),
    color: theme.colors.primary,
  },
})

export default HomeScreen