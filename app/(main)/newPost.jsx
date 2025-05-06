import { View, Text, StyleSheet, ScrollView, Pressable, Image as RNImage, Alert, TouchableOpacity, TextInput, Platform, Keyboard, KeyboardAvoidingView } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import { getFilePath, getSupabaseFileUrl, getUserImageSrc, uploadFile } from '../../services/imageService'
import { Image } from 'expo-image'
import RichTextEditor from '../../components/RichTextEditor'
import Button from '../../components/Button'
import { AntDesign, FontAwesome, FontAwesome6, Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { createOrUpdatePost } from '../../services/postService'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Avatar from '../../components/Avatar'
import Icon from '../../assets/icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

const NewPost = () => {
  const {user} = useAuth();
  const post = useLocalSearchParams();
  const [file, setFile] = useState(null);
  const bodyRef = useRef('');
  const [loading, setLoading] = useState(false);
  const editorRef = useRef(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // 添加标签相关状态
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  
  useEffect(()=>{
    if(post && post.id){
      bodyRef.current = post.body;
      setFile(post.file || null);
      // 如果是编辑帖子，加载已有标签
      if(post.tags) {
        try {
          const parsedTags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags;
          setTags(Array.isArray(parsedTags) ? parsedTags : []);
        } catch(e) {
          // console.error('解析标签失败:', e);
          setTags([]);
        }
      }
      setTimeout(() => {
        editorRef?.current?.setContentHTML(post.body);
      }, (300));
    }
  },[])
  
  // 处理返回按钮点击
  const handleGoBack = () => {
    router.back();
  };
  
  // 处理添加标签
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    // 将输入内容按空格或逗号分割成多个标签
    const newTags = tagInput.trim().split(/[\s,]+/).filter(tag => tag !== '');
    
    // 合并现有标签和新标签，去重，并限制最多6个
    const updatedTags = [...new Set([...tags, ...newTags])].slice(0, 6);
    
    setTags(updatedTags);
    setTagInput(''); // 清空输入框
  };
  
  // 移除标签
  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const onPick = async (isImage) => {
    // No permissions request is necessary for launching the image library
    let mediaConfig = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    }

    if(!isImage){
      mediaConfig = {
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
      }
    }
    let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);

    if (!result.canceled) {
      setFile(result.assets[0]);
    }
  };

  const onSubmit = async ()=>{
    // validate data
    if(!bodyRef.current && !file){
      Alert.alert('提示', "请选择图片或添加帖子内容!");
      return;
    }

    setLoading(true);
    let data = {
      file,
      body: bodyRef.current,
      userId: user?.id,
      tags: tags // 添加标签数据
    }
    if(post && post.id) data.id = post.id;

    let res = await createOrUpdatePost(data);
    setLoading(false);
    if(res.success){
      setFile(null);
      bodyRef.current = '';
      setTags([]);
      editorRef.current?.setContentHTML('');
      router.back();
    }else{
      Alert.alert('帖子', res.msg);
    }
  }

  const isLocalFile = file=>{
    if(!file) return null;

    if(typeof file == 'object') return true;
    return false;
  }

  const getFileType = file=>{
    if(!file) return null;

    if(isLocalFile(file)){
      return file.type;
    }
    
    if(file.includes('postImages')){
      return 'image';
    }

    return 'video';
  }

  const getFileUri = file=>{
    if(!file) return null;
    if(isLocalFile(file)){
      return file.uri;
    }else{
      return getSupabaseFileUrl(file)?.uri;
    }
  }

  // 计算底部按钮的高度（包括安全区域）
  const bottomHeight = hp(7) + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar style="dark" />
      
      {/* 顶部导航栏 */}
      <View style={[styles.headerContainer, { marginTop: insets.top }]}>
        <TouchableOpacity 
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>创建帖子</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* 内容区 - 给底部按钮留出固定空间 */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          gap: 20,
          paddingBottom: bottomHeight + hp(2) // 为底部按钮预留空间
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 用户信息 */}
        <View style={styles.header}>
          <Avatar
            uri={user?.image}
            size={hp(6.5)}
            rounded={theme.radius.xl}
          />
          <View style={{gap: 2}}>
            <Text style={styles.username}>{user && user.name}</Text>
            <Text style={styles.publicText}>公开</Text>
          </View>
        </View>
        
        {/* 编辑器 */}
        <View style={styles.textEditor}>
          <RichTextEditor editorRef={editorRef} onChange={body=> bodyRef.current = body} />
        </View>
        
        {/* 媒体预览 */}
        {file && (
          <View style={styles.file}>
            {getFileType(file) === 'video' ? (
              (() => {
                const videoSource = { uri: getFileUri(file) };
                const player = useVideoPlayer(videoSource, player => {
                  player.loop = true;
                });
                
                return (
                  <VideoView
                    style={{ flex: 1 }}
                    player={player}
                    allowsFullscreen
                    nativeControls
                  />
                );
              })()
            ) : (
              <Image source={{ uri: getFileUri(file) }} resizeMode='cover' style={{ flex: 1 }} />
            )}
            
            <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
              <AntDesign name="closecircle" size={25} color="rgba(255, 0,0,0.6)" />
            </Pressable>
          </View>
        )}
        
        {/* 媒体选择区域 */}
        <View style={styles.media}>
          <Text style={styles.addImageText}>您还可以传图片或视频</Text>
          <View style={styles.mediaIcons}>
            <TouchableOpacity onPress={() => onPick(true)}>
              <Icon name="image" size={30} color={theme.colors.dark} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onPick(false)}>
              <Icon name="video" size={33} color={theme.colors.dark} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 标签区域 */}
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsLabel}>添加标签</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="输入标签，用空格分隔 (最多6个)"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            <TouchableOpacity 
              style={styles.addTagButton}
              onPress={handleAddTag}
            >
              <AntDesign name="plus" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {tags.length > 0 && (
            <View style={styles.tagsList}>
              {tags.map((tag, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.tagChip}
                  onPress={() => removeTag(index)}
                >
                  <Text style={styles.tagText}>#{tag}</Text>
                  <AntDesign name="close" size={16} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* 固定在底部的发布按钮 - 完全固定，不会被键盘影响 */}
      <View style={[
        styles.buttonFixedContainer,
        { height: bottomHeight }
      ]}>
        <Button 
          buttonStyle={{ height: hp(6.2) }}
          title={post && post.id ? "更新" : "发布"}
          loading={loading}
          hasShadow={false}
          onPress={onSubmit}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray,
    backgroundColor: theme.colors.white,
  },
  backButton: {
    padding: 5,
  },
  placeholder: {
    width: 24, // 为了让标题居中，设置与返回按钮相同宽度的占位元素
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    textAlign: 'center'
  },
  buttonFixedContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.white,
    paddingHorizontal: wp(4),
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray,
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: wp(4),
    marginTop: 10,
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  publicText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
  },

  textEditor: {
    paddingHorizontal: wp(4),
  },

  media: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    padding: 12,
    paddingHorizontal: 18,
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray,
    marginHorizontal: wp(4),
  },
  mediaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },

  addImageText: {
    fontSize: hp(1.9),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  imageIcon: {
    borderRadius: theme.radius.md,
  },
  file: {
    height: hp(30),
    width: '100%',
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderCurve: 'continuous',
    marginHorizontal: wp(4),
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  
  // 添加标签样式
  tagsContainer: {
    marginVertical: 5,
    paddingHorizontal: wp(4),
  },
  tagsLabel: {
    fontSize: hp(1.9),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray,
    overflow: 'hidden',
  },
  tagInput: {
    flex: 1,
    padding: 12,
    fontSize: hp(1.8),
  },
  addTagButton: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 142, 239, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  tagText: {
    fontSize: hp(1.7),
    color: theme.colors.primary,
  },
})

export default NewPost