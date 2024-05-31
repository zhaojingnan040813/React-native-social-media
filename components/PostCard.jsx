import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { theme } from '../constants/theme';
import { Image } from 'expo-image';
import { downloadFile, getSupabaseFileUrl, getUserImageSrc } from '../services/imageService';
import { hp, stripHtmlTags, wp } from '../helpers/common';
import moment from 'moment';
import RenderHtml from 'react-native-render-html';
import Icon from '../assets/icons';
import { Video } from 'expo-av';
import { createPostLike, removePostLike } from '../services/postService';
import { Share } from 'react-native';
import Loading from './Loading';

const PostCard = ({
  item,
  currentUser,
  router,
  showMoreIcon=true,
  hasShadow=true,
}) => {

  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);

  const liked = likes.filter(like=> like.userId==currentUser?.id)[0]? true: false;
  const createdAt = moment(item?.created_at).format('MMM D');
  const htmlBody = { html: item?.body };
  const shadowStyles = {
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  }
  

  const tagsStyles = {
    div: {
      color: theme.colors.dark,
      fontSize: hp(1.75)
    },
    p: {
      color: theme.colors.dark,
      fontSize: hp(1.75)
    }
  };

  useEffect(()=>{
    setLikes(item?.postLikes);
  },[]);


  
  const onLike = async ()=>{

    if(liked){
      let updatedLikes = likes.filter(like=> like.userId!=currentUser?.id);
      setLikes([...updatedLikes]);

      let res = await removePostLike(item?.id, currentUser?.id);
      console.log('res: ', res);
      if(!res.success){
        Alert.alert('Post', 'Something went wrong!')
      }
    }else{
      let data = {
        userId: currentUser?.id,
        postId: item?.id,
      }

      setLikes([...likes, data]);
      let res = await createPostLike(data);
      console.log('res: ', res);
      if(!res.success){
        Alert.alert('Post', 'Something went wrong!')
      }
    }
    
  }

  const onShare = async ()=>{
    let content = {message: stripHtmlTags(item?.body)};
    if(item?.file){
      setLoading(true);
      let uri = await downloadFile(getSupabaseFileUrl(item.file).uri);
      content.url = uri;
      setLoading(false);
    }
    Share.share(content);
      
  }

  const openPostDetails = ()=>{
    router.push({pathname: 'postDetails', params: {data: JSON.stringify(item)}})
  }
  return (
    <View style={[styles.container, hasShadow && shadowStyles]}>
      <View style={styles.header}>
        {/* user info and post time */}
        <View style={styles.userInfo}>
          <Image source={getUserImageSrc(item?.user?.image)} style={styles.avatarImage} />
          <View style={{gap: 2}}>
            <Text style={styles.username}>{item?.user?.name}</Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </View>

        {/* actions icon */}
        {
          showMoreIcon && (
            <TouchableOpacity onPress={openPostDetails}>
              <Icon name="threeDotsHorizontal" size={30} strokeWidth={3} color={theme.colors.text} />
            </TouchableOpacity>
          )
        }
      </View>

      {/* post image & body */}
      <View style={styles.content}>
        <View style={styles.postBody}>
          {
            item?.body && (
              <RenderHtml
                contentWidth={wp(100)}
                source={htmlBody}
                tagsStyles={tagsStyles}
                render
              />
            )
          }
        </View>
        
        {/* post image */}
        {
          item?.file && item?.file?.includes('postImages') && (
            <Image 
              source={getSupabaseFileUrl(item?.file)}
              style={styles.postMedia}
              contentFit='cover'
            />
          )
        }

        {/* post video */}
        {
          item?.file && item?.file?.includes('postVideos') && (
            <Video
              style={[styles.postMedia, {height: hp(30)}]}
              source={getSupabaseFileUrl(item?.file)}
              useNativeControls
              resizeMode="cover"
              isLooping
            />
          )
        }
      </View>

      {/* like & comment */}
      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onLike}>
            <Icon name="heart" fill={liked? theme.colors.rose: 'transparent'} size={24} color={liked? theme.colors.rose: theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.count}>
            {
              likes?.length
            }
          </Text>
        </View>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={openPostDetails}>
            <Icon name="comment" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.count}>
            {/* implement after adding post details modal */}
            {/* {
              item?.postComments?.length
            } */}
            0
          </Text>
        </View>
        <View style={styles.footerButton}>
          {
            loading? (
              <Loading size="small" />
            ):(
              <TouchableOpacity onPress={onShare}>
                <Icon name="share" size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            )
          }
          
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 15,
    borderRadius: theme.radius.xxl*1.1,
    borderCurve: 'continuous',
    padding: 10,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: theme.colors.gray,
    shadowColor: '#000'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },  
  avatarImage: {
    height: hp(4.5),
    width: hp(4.5),
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: theme.colors.darkLight
  },
  username: {
    fontSize: hp(1.7),
    color: theme.colors.textDark,
    fontWeight: theme.fonts.medium,
  },
  postTime: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontWeight: theme.fonts.medium,
  },
  content: {
    gap: 5,
    // marginBottom: 10,
  },
  postMedia: {
    height: hp(40),
    width: '100%',
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous'
  },
  postBody: {
    marginLeft: 5,
  },
  footer: {
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 15
  },
  footerButton: {
    marginLeft: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  count: {
    color: theme.colors.text,
    fontSize: hp(1.8)
  }

})

export default PostCard