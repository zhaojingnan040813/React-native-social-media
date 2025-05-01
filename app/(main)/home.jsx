import { View, Text, Button, Alert, StyleSheet, Pressable, ScrollView, FlatList, RefreshControl } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { supabase } from '../../lib/supabase'
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

// 初始加载的帖子数量
const initialLimit = 10;

const HomeScreen = () => {
    const {user, setAuth} = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false); // 添加加载状态
    const [refreshing, setRefreshing] = useState(false); // 下拉刷新状态
    const [limit, setLimit] = useState(initialLimit);
    const [activeTag, setActiveTag] = useState(null); // 当前激活的标签过滤

    const handlePostEvent = async (payload)=>{
      // console.log('got post event: ', payload);
      if(payload.eventType == 'INSERT' && payload?.new?.id){
        let newPost = {...payload.new};
        let res = await getUserData(newPost.userId);
        newPost.user = res.success? res.data: {};
        newPost.postLikes = []; // while adding likes
        newPost.comments = [{count: 0}] // while adding comments
        setPosts(prevPosts=> [newPost, ...prevPosts]);
      }

      if(payload.eventType == 'DELETE' && payload?.old?.id){
        setPosts(prevPosts=> {
          let updatedPosts = prevPosts.filter(post=> post.id!=payload.old.id);
          return updatedPosts;
        })
      }

      if(payload.eventType == 'UPDATE' && payload?.new?.id){
        setPosts(prevPosts=> {
          let updatedPosts = prevPosts.map(post=> {
            if(post.id==payload.new.id){
              post.body = payload.new.body;
              post.file = payload.new.file;
            }
            return post;
          });
          return updatedPosts;
        })
      }
    }

    useEffect(()=>{
      // listen all events on a table
      let postChannel = supabase
      .channel('posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePostEvent)
      .subscribe();

      // 首次加载帖子
      getPosts();

      return ()=>{
        supabase.removeChannel(postChannel);
      }

    },[]);
    
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
    
    // 更新获取帖子函数，考虑标签过滤
    const getPosts = async () => {
      // 如果已经没有更多数据或者正在加载中，直接返回
      if(!hasMore || isLoading) return;

      setIsLoading(true);
      
      try {
        // 根据是否有激活的标签决定获取方式
        let res;
        if (activeTag) {
          res = await searchPostsByTag(activeTag, limit);
        } else {
          res = await fetchPosts(limit);
        }
        
        if(res.success){
          // 如果获取的数据数量与当前显示的一样，说明没有更多数据了
          if(posts.length > 0 && posts.length === res.data.length) {
            setHasMore(false);
          } else {
            setPosts(res.data);
            // 如果返回的数据少于请求的数量，也说明没有更多数据了
            if(res.data.length < limit) {
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
          onEndReached={() => {
            if (hasMore && !isLoading) {
              getPosts();
            }
          }}
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