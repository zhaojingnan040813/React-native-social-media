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
var limit = 0;
const HomeScreen = () => {
    const {user, setAuth} = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);

    const onLogout = async () => {
        setAuth(null);
        const {error} = await supabase.auth.signOut();
        if (error) {
          Alert.alert("Error Signing Out User", error.message);
        }
    }

    const onNewPostInserted = async (payload)=>{
      console.log('got post: ', payload);
      if(payload.new){
        let newPost = {...payload.new};
        let res = await getUserData(newPost.userId);
        newPost.user = res.success? res.data: {};
        newPost.postLikes = [];
        newPost.postComments = [];
        setPosts(prevPosts=> [newPost, ...prevPosts]);
      }
    }

    useEffect(()=>{
      

      let channel = supabase
      .channel('posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, onNewPostInserted)
      .subscribe();

      // getPosts();

      return ()=>{
        supabase.removeChannel(channel)
      }

    },[]);
    
    const getPosts = async ()=>{

      if(!hasMore) return null; // if no more posts then don't call the api
      limit = limit+5;
      console.log('fetching posts: ', limit);
      let res = await fetchPosts(limit);
      if(res.success){
        if(posts.length==res.data.length) setHasMore(false);
        setPosts(res.data);
      }
    }

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          <Pressable>
            <Text style={styles.title}>LinkUp</Text>
          </Pressable>
          <View style={styles.icons}>
            <Pressable>
              <Icon name="heart" size={hp(3.2)} strokeWidth={2} color={theme.colors.text}  />
            </Pressable>
            {/* <Pressable>
              <Icon name="search" size={hp(3.2)} strokeWidth={2} color={theme.colors.text}  />
            </Pressable> */}
            <Pressable onPress={()=> router.push('newPost')}>
              <Icon name="plus" size={hp(3.2)} strokeWidth={2} color={theme.colors.text}  />
            </Pressable>
            <Pressable onPress={()=> router.push('/profile')}>
              <Image source={getUserImageSrc(user?.image)} style={styles.avatarImage} />
            </Pressable>
          </View>
        </View>

        {/* posts */}

        {/* <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
        >
          {
            posts.map((item, index)=>{
              return (
                <PostCard 
                  currentUser={user}
                  item={item}
                  key={item?.id}
                />
              )
            })
          }
          <View style={{marginTop: posts.length==0? 200: 30}}>
            <Loading />
          </View>
        </ScrollView> */}
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
            getPosts();
            console.log('got to the end');
          }}
          onEndReachedThreshold={0} //  Specifies how close to the bottom the user must scroll before 
          ListFooterComponent={hasMore? (
            <View style={{marginTop: posts.length==0? 200: 30}}>
              <Loading />
            </View>
          ):(
            <View style={{marginVertical: 30}}>
             <Text style={styles.noPosts}>No more posts</Text>
            </View>
          )
          }
        />

        <Button onPress={onLogout} title="Logout" />
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
  }
})

export default HomeScreen