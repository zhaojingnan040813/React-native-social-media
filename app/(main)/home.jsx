import { View, Text, Button, Alert, StyleSheet, Pressable, ScrollView, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
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
import { fetchPosts } from '../../services/postService'
import PostCard from '../../components/PostCard'
import Loading from '../../components/Loading'
import { getUserData } from '../../services/userService'
import Avatar from '../../components/Avatar'

// 初始加载的帖子数量
const initialLimit = 10;
let limit = initialLimit;

const HomeScreen = () => {
    const {user, setAuth} = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false); // 添加加载状态
    const [notificationCount, setNotificationCount] = useState(0);

    // const onLogout = async () => {
    //     setAuth(null);
    //     const {error} = await supabase.auth.signOut();
    //     if (error) {
    //       Alert.alert("Error Signing Out User", error.message);
    //     }
    // }

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

    const handleNewNotification = payload=>{
      // console.log('got new notification : ', payload);
      if(payload.eventType=='INSERT' && payload?.new?.id){
        setNotificationCount(prev=> prev+1);
      }
    }

    useEffect(()=>{
      
      // // if you want to listen to single event on a table
      // let postsChannel = supabase
      // .channel('posts')
      // .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, handlePostEvent)
      // .subscribe();


      // listen all events on a table
      let postChannel = supabase
      .channel('posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePostEvent)
      .subscribe();

      let notificationChannel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user.id}`, }, handleNewNotification)
      .subscribe();

      // 首次加载帖子
      getPosts();

      return ()=>{
        supabase.removeChannel(postChannel);
        supabase.removeChannel(notificationChannel);
      }

    },[]);
    
    const getPosts = async ()=>{
      // 如果已经没有更多数据或者正在加载中，直接返回
      if(!hasMore || isLoading) return;

      setIsLoading(true);
      // console.log('fetching posts: ', limit);
      
      try {
      let res = await fetchPosts(limit);
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
              // 否则增加下次加载的数量
              limit += initialLimit;
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
          <Pressable>
            <Text style={styles.title}>帖子</Text>
          </Pressable>
          <View style={styles.icons}>
            <Pressable onPress={()=> {
              setNotificationCount(0);
              router.push('notifications');
            }}>
              <Icon name="heart" size={hp(3.2)} strokeWidth={2} color={theme.colors.text}  />
              {
                notificationCount>0 && (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{notificationCount}</Text>
                  </View>
                )
              }
            </Pressable>
            <Pressable onPress={()=> router.push('newPost')}>
              <Icon name="plus" size={hp(3.2)} strokeWidth={2} color={theme.colors.text}  />
            </Pressable>
            <Pressable onPress={()=> router.push('profile')}>
              <Avatar 
                uri={user?.image} 
                size={hp(4.3)}
                rounded={theme.radius.sm}
                style={{borderWidth: 2}}
              />
            </Pressable>
          </View>
        </View>

        {/* posts */}
        <FlatList
          data={posts}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
          keyExtractor={(item, index) => item.id.toString()}
          renderItem={({ item }) => <PostCard 
            item={item} 
            currentUser={user}
            router={router} 
          />}
          onEndReached={() => {
            if (hasMore && !isLoading) {
            getPosts();
            // console.log('got to the end');
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

        {/* <Button onPress={onLogout} title="Logout" /> */}
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
    justifyContent: 'space-between',
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
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18
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
  pill: {
    position: 'absolute',
    right: -10,
    top: -4,
    height: hp(2.2),
    width: hp(2.2),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.roseLight
  },
  pillText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: theme.fonts.bold
  }
})

export default HomeScreen