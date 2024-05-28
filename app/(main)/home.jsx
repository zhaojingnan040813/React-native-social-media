import { View, Text, Button, Alert, StyleSheet, Pressable, ScrollView } from 'react-native'
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

const HomeScreen = () => {
    const {user, setAuth} = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const onLogout = async () => {
        setAuth(null);
        const {error} = await supabase.auth.signOut();
        if (error) {
          Alert.alert("Error Signing Out User", error.message);
        }
    }

    useEffect(()=>{
      getPosts();
    },[]);
    
    const getPosts = async ()=>{
      let res = await fetchPosts();
      if(res.success){
        setPosts(res.data);
      }
    }

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          <Pressable style={styles.avatar} onPress={()=> router.push('/profile')}>
            <Image source={getUserImageSrc(user?.image)} style={styles.avatarImage} />
          </Pressable>
          <View style={styles.icons}>
            <Pressable>
              <Icon name="heart" size={hp(3.5)} strokeWidth={2} color={theme.colors.text}  />
            </Pressable>
            <Pressable>
              <Icon name="search" size={hp(3.5)} strokeWidth={2} color={theme.colors.text}  />
            </Pressable>
            <Pressable onPress={()=> router.push('newPost')}>
              <Icon name="plus" size={hp(3.5)} strokeWidth={2} color={theme.colors.text}  />
            </Pressable>
          </View>
        </View>

        {/* posts */}

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
        >
          {
            posts.map((item, index)=>{
              return (
                <PostCard 
                  item={item}
                  key={item?.id}
                  index={index}
                  isLast={posts.length==index+1}
                />
              )
            })
          }
          <View style={{marginTop: posts.length==0? 200: 30}}>
            <Loading />
          </View>
        </ScrollView>

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
  avatar: {
    height: hp(5.5),
    width: hp(5.5),
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    padding: 3,
    backgroundColor: theme.colors.gray,
  },
  avatarImage: {
    flex: 1, 
    borderRadius: theme.radius.lg-3,
    borderCurve: 'continuous',
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 22
  },
  listStyle: {
    paddingTop: 20,
    paddingHorizontal: wp(4)
  }
})

export default HomeScreen