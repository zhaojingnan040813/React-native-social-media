import { View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity, Alert, FlatList, RefreshControl } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { hp, wp } from '../../helpers/common'
import { useAuth } from '../../contexts/AuthContext'
import { theme } from '../../constants/theme'
import { Feather, Ionicons, SimpleLineIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { getUserImageSrc } from '../../services/imageService'
import { Image } from 'expo-image';
import Header from '../../components/Header'
import ScreenWrapper from '../../components/ScreenWrapper'
import Icon from '../../assets/icons'
import Avatar from '../../components/Avatar'
import { fetchPosts } from '../../services/postService'
import PostCard from '../../components/PostCard'
import Loading from '../../components/Loading'

const Profile = () => {
  const {user, logout} = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [limit, setLimit] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // 添加 useEffect 钩子来在组件挂载时获取帖子
  useEffect(() => {
    // 初次加载时获取帖子
    getPosts();
  }, []); // 空依赖数组表示仅在组件挂载时执行一次

  const getPosts = async () => {
    if(!hasMore) return null; // if no more posts then don't call the api
    const newLimit = limit + 10; // get 10 more posts everytime
    setLimit(newLimit);
    // console.log('fetching posts: ', limit);
    let res = await fetchPosts(newLimit, user.id);
    if(res.success){
      if(posts.length==res.data.length) setHasMore(false);
      setPosts(res.data);
    }
  }
  
  // 添加下拉刷新处理函数
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLimit(0);
    setHasMore(true);
    try {
      const res = await fetchPosts(10, user.id);
      if(res.success){
        setPosts(res.data);
      }
    } catch (error) {
      console.error('刷新时出错:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user.id]);
  
  const onLogout = async () => {
    const result = await logout();
    if (!result.success) {
      Alert.alert("退出登录失败", result.msg);
    } else {
      // 退出成功后跳转到登录页
      router.replace('/login');
    }
  }

  const handleLogout = ()=>{
    Alert.alert('确认', '您确定要退出登录吗？', [
        {
          text: '取消',
          onPress: () => {/* console.log('Cancel') */},
          style: 'cancel',
        },
        {
            text: '退出登录', 
            onPress: () => onLogout(),
            style: 'destructive'
        },
    ]);
  }

  return (
    <ScreenWrapper bg="white">
      {/* first create UserHeader and use it here, then move it to header comp when implementing user posts */}
      {/* posts */}
      <FlatList
        data={posts}
        ListHeaderComponent={<UserHeader user={user} handleLogout={handleLogout} router={router} />}
        ListHeaderComponentStyle={{marginBottom: 30}}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listStyle}
        keyExtractor={(item, index) => item.id.toString()}
        renderItem={({ item }) => <PostCard 
          item={item} 
          currentUser={user}
          router={router} 
        />}
        onEndReached={() => {
          getPosts();
          // console.log('got to the end');
        }}
        onEndReachedThreshold={0} //  Specifies how close to the bottom the user must scroll before endreached is triggers, 0 -> 1
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListFooterComponent={hasMore? (
            <View style={{marginTop: posts.length==0? 100: 30}}>
              <Loading />
            </View>
          ):(
            <View style={{marginVertical: 30}}>
              <Text style={styles.noPosts}>您没有更多的帖子了</Text>
            </View>
          )
        }
      />
    </ScreenWrapper>
  )
}

const UserHeader = ({user, handleLogout, router})=>{
  return (
    <View style={{flex: 1, backgroundColor:'white'}}> 
        <View>
          <Text style={styles.profileTitle}>个人资料</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={26} color={theme.colors.rose} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.container}>
          <View style={{gap: 15}}>
            {/* avatar */}
            <View style={styles.avatarContainer}>
              <Avatar
                uri={user?.image}
                size={hp(12)}
                rounded={theme.radius.xxl*1.4}
              />
              {/* <Image source={getUserImageSrc(user?.image)} style={styles.avatar} /> */}
              <Pressable style={styles.editIcon} onPress={()=> router.push('/editProfile')}>
                <Icon name="edit" strokeWidth={2.5} size={20} />
              </Pressable>
            </View>
          

            {/* username & address */}
            <View style={{alignItems: 'center', gap: 4}}>
              <Text style={styles.userName}> { user && user.name } </Text>
              <Text style={styles.infoText}> {user && user.address} </Text>
            </View>

            {/* email, phone */}
            <View style={{gap: 10}}>
              
              <View style={styles.info}>
                <Icon name="mail" size={20} color={theme.colors.textLight} />
                <Text style={[styles.infoText, {fontSize: hp(1.8)}]}> 
                    {user && user.email}
                  </Text>
              </View>
              {
                user && user.phoneNumber && (
                  <View style={styles.info}>
                    <Icon name="call" size={20} color={theme.colors.textLight} />
                    <Text style={[styles.infoText, {fontSize: hp(1.8)}]}> 
                        {
                          user.phoneNumber
                        } 
                    </Text>
                  </View>
                )
              }
              
              {
                user && user.bio && (
                  <Text style={[styles.infoText]}>{user.bio}</Text>
                )
              }
              
            </View>
          </View>
          
        </View>
      </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginHorizontal: wp(4), 
    marginBottom: 20
  },
  headerShape: {
    width: wp(100),
    height: hp(20)
  },  
  avatarContainer: {
    height: hp(12),
    width: hp(12),
    alignSelf: 'center'
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: -12,
    padding: 7,
    borderRadius: 50,
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7
  },
  userName: {
    fontSize: hp(3),
    fontWeight: '500',
    color: theme.colors.textDark
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: theme.colors.textLight
  },
  profileTitle: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginVertical: 15
  },
  logoutButton: {
    position: 'absolute',
    right: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: '#fee2e2'
  },
  listStyle: {
    paddingHorizontal: wp(4),
    paddingBottom: 30,

  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.text
  }
})

export default Profile