import { View, Text, StyleSheet, TouchableOpacity, Alert, ToastAndroid, Platform, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { theme } from '../constants/theme';
import { Image } from 'expo-image';
import { downloadFile, getSupabaseFileUrl, getUserImageSrc } from '../services/imageService';
import { hp, stripHtmlTags, wp } from '../helpers/common';
import moment from 'moment';
import { WebView } from 'react-native-webview';
import Icon from '../assets/icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { createPostLike, removePostLike, searchPostsByTag } from '../services/postService';
import { Share } from 'react-native';
import Loading from './Loading';
import Avatar from './Avatar';
import { addBookmark, isPostBookmarked, removeBookmark } from '../services/bookmarkService';

const textStyle = {
  color: theme.colors.dark,
  fontSize: hp(1.75)
}

const tagsStyles = {
  div: textStyle,
  p: textStyle,
  ol: textStyle,
  h1: {
    color: theme.colors.dark
  },
  h4: {
    color: theme.colors.dark
  },
};

const wrapHtmlContent = (htmlContent) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            font-size: ${hp(1.75)}px;
            color: ${theme.colors.dark};
            margin: 0;
            padding: 0;
          }
          p, div, ol { 
            font-size: ${hp(1.75)}px;
            color: ${theme.colors.dark};
            margin-top: 0;
          }
          h1, h4 { 
            color: ${theme.colors.dark};
          }
        </style>
      </head>
      <body>${htmlContent || ''}</body>
    </html>
  `;
};

const PostCard = ({
  item,
  currentUser,
  router,
  showMoreIcon=true,
  hasShadow=true,
  showDelete=false,
  onDelete=()=>{},
  onEdit=()=>{},
  onTagPress,
  onBookmarkChange=()=>{}
}) => {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(50);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const liked = likes.filter(like=> like.userId==currentUser?.id)[0]? true: false;
  const createdAt = moment(item?.created_at).format('M月D日');
  const htmlContent = wrapHtmlContent(item?.body);
  const shadowStyles = {
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  }

  const injectedJavaScript = `
    window.ReactNativeWebView.postMessage(document.body.scrollHeight);
    true;
  `;

  useEffect(()=>{
    setLikes(item?.postLikes);
    
    // 检查帖子是否已被收藏
    const checkBookmarkStatus = async () => {
      const res = await isPostBookmarked(currentUser?.id, item?.id);
      if (res.success) {
        setIsBookmarked(res.bookmarked);
      }
    };
    
    checkBookmarkStatus();
  },[]);

  const onLike = async ()=>{
    if(liked){
      let updatedLikes = likes.filter(like=> like.userId!=currentUser?.id);
      setLikes([...updatedLikes]);

      let res = await removePostLike(item?.id, currentUser?.id);
      if(!res.success){
        Alert.alert('帖子', '出现了问题！')
      }
    }else{
      let data = {
        userId: currentUser?.id,
        postId: item?.id,
      }

      setLikes([...likes, data]);
      let res = await createPostLike(data);
      if(!res.success){
        Alert.alert('帖子', '出现了问题！')
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
  
  // 显示临时Toast消息
  const showTemporaryToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravityAndOffset(
        message,
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
        0,
        100
      );
    } else {
      // iOS自定义Toast
      setToastMessage(message);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 1000);
    }
  };
  
  // 处理收藏/取消收藏
  const handleBookmark = async () => {
    setBookmarkLoading(true);
    
    if (isBookmarked) {
      // 取消收藏
      const res = await removeBookmark(currentUser?.id, item?.id);
      if (res.success) {
        setIsBookmarked(false);
        onBookmarkChange(item?.id); // 通知父组件收藏状态变化
        showTemporaryToast('已取消收藏');
      } else {
        Alert.alert('提示', '取消收藏失败');
      }
    } else {
      // 添加收藏
      const res = await addBookmark(currentUser?.id, item?.id);
      if (res.success) {
        setIsBookmarked(true);
        onBookmarkChange(item?.id); // 通知父组件收藏状态变化
        showTemporaryToast('收藏成功');
      } else {
        Alert.alert('提示', '收藏失败');
      }
    }
    
    setBookmarkLoading(false);
  };

  const handlePostDelete = ()=>{
    Alert.alert('确认', '您确定要删除这个帖子吗?', [
        {
          text: '取消',
          onPress: () => {/* console.log('取消删除') */},
          style: 'cancel',
        },
        {
            text: '删除', 
            onPress: () => onDelete(item),
            style: 'destructive'
        },
    ]);
  }

  const openPostDetails = ()=>{
    const timestamp = new Date().getTime();
    // console.log(`正在打开帖子：${item?.id}，时间戳：${timestamp}`);
    router.replace(`/postDetails?postId=${item?.id}&t=${timestamp}`);
  }

  const handleTagPress = (tag) => {
    if (onTagPress) {
      onTagPress(tag);
    } else {
      console.log('Tag pressed:', tag);
    }
  };

  return (
    <View style={[styles.container, hasShadow && shadowStyles]}>
      <View style={styles.header}>
        {/* user info and post time */}
        <View style={styles.userInfo}>
          <Avatar 
            size={hp(4.5)}
            uri={item?.user?.image}
            rounded={theme.radius.md}
          />
          <View style={{gap: 2}}>
            <Text style={styles.username}>{item?.user?.name}</Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </View>

        {/* actions */}
        {
          showMoreIcon && (
            <TouchableOpacity onPress={openPostDetails}>
              <Icon name="threeDotsHorizontal" size={hp(3.4)} strokeWidth={3} color={theme.colors.text} />
            </TouchableOpacity>
          )
        }
        {
          showDelete && currentUser.id==item.userId && (
            <View style={styles.actions}>
              <TouchableOpacity onPress={()=> onEdit(item)}>
                <Icon name="edit" size={hp(2.5)} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePostDelete}>
                <Icon name="delete" size={hp(2.5)} color={theme.colors.rose} />
              </TouchableOpacity>
            </View>
          )
        }
      </View>

      {/* post image & body */}
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={openPostDetails} 
        style={styles.content}
      >
        <View style={styles.postBody}>
          {
            item?.body && (
              <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={{ width: '100%', height: webViewHeight }}
                scrollEnabled={false}
                injectedJavaScript={injectedJavaScript}
                onMessage={(event) => {
                  const height = parseInt(event.nativeEvent.data);
                  setWebViewHeight(height + 10);
                }}
                showsVerticalScrollIndicator={false}
                automaticallyAdjustContentInsets={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            )
          }
        </View>
        
        {item?.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {Array.isArray(item.tags) && item.tags.map((tag, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.tagChip}
                onPress={() => handleTagPress(tag)}
              >
                <Text style={styles.tagText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* post image */}
        {
          item?.file && item?.file?.includes('postImages') && (
            <Image 
              source={getSupabaseFileUrl(item?.file)}
              transition={100}
              style={styles.postMedia}
              contentFit='cover'
            />
          )
        }

        {/* post video */}
        {
          item?.file && item?.file?.includes('postVideos') && (
            <>
              {(() => {
                const videoSource = getSupabaseFileUrl(item?.file);
                const player = useVideoPlayer(videoSource, player => {
                  player.loop = true;
                });
                
                return (
                  <VideoView
                    style={[styles.postMedia, {height: hp(30)}]}
                    player={player}
                    allowsFullscreen
                    nativeControls
                  />
                );
              })()}
            </>
          )
        }
      </TouchableOpacity>

      {/* like & comment & bookmark */}
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
            {
              item?.comments[0]?.count
            }
          </Text>
        </View>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={handleBookmark} disabled={bookmarkLoading}>
            {bookmarkLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Icon 
                name={isBookmarked ? "bookmark-fill" : "bookmark"} 
                size={24} 
                color={isBookmarked ? theme.colors.primary : theme.colors.textLight} 
              />
            )}
          </TouchableOpacity>
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

      {/* iOS Toast */}
      {Platform.OS === 'ios' && showToast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
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
    gap: 10,
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center', 
    gap: 18,
  },
  count: {
    color: theme.colors.text,
    fontSize: hp(1.8)
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5,
    gap: 8,
  },
  tagChip: {
    backgroundColor: 'rgba(108, 142, 239, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  tagText: {
    fontSize: hp(1.6),
    color: theme.colors.primary,
  },
  toast: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    color: 'white',
    fontSize: hp(1.8),
  },
})

export default PostCard