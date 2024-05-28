import { View, Text, StyleSheet, ScrollView, Pressable, Image as RNImage, Alert } from 'react-native'
import React, { useCallback, useRef, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import { getFilePath, getUserImageSrc, uploadFile } from '../../services/imageService'
import { Image } from 'expo-image'
import RichTextEditor from '../../components/RichTextEditor'
import Button from '../../components/Button'
import { AntDesign, FontAwesome, FontAwesome6, Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker';
import { Video, AVPlaybackStatus } from 'expo-av';
import { createPost } from '../../services/postService'
import Header from '../../components/Header'
import { useRouter } from 'expo-router'


const NewPost = () => {
  const {user} = useAuth();
  // const videoRef = useRef(null);
  const [file, setFile] = useState(null);
  const bodyRef = useRef('');
  const [loading, setLoading] = useState(false);
  const editorRef = useRef(null);
  const router = useRouter();

  const onPick = async (isImage) => {
    // No permissions request is necessary for launching the image library
    let mediaConfig = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true
    }

    if(!isImage){
      mediaConfig = {
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        base64: true
      }
    }
    let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);

    if (!result.canceled) {
      console.log({...result.assets[0], base64: null});
      setFile(result.assets[0]);
    }
  };

  const onSubmit = async ()=>{

    // validate data
    if(!bodyRef.current && !file){
      Alert.alert('Post', "Please choose an image or add post body!");
      return;
    }

    setLoading(true);
    let post = {
      file,
      body: bodyRef.current,
      userId: user?.id,
    }
    let res = await createPost(post);
    setLoading(false);
    if(res.success){
      setFile(null);
      bodyRef.current = '';
      editorRef.current?.setContentHTML('');
      router.back();
    }else{
      Alert.alert('Post', res.msg);
    }

  }

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header title="Create Post" mb={15} />
          
        <ScrollView contentContainerStyle={{gap: 20}}>
          {/* header */}
          <View style={styles.header}>
              <Image source={getUserImageSrc(user?.image)} style={styles.avatar} />
              <View style={{gap: 2}}>
                <Text style={styles.username}>{user && user.name}</Text>
                <Text style={styles.publicText}>Public</Text>
              </View>
          </View>
          <View style={styles.textEditor}>
            <RichTextEditor editorRef={editorRef} onChange={body=> bodyRef.current = body} />
          </View>
          {
            file && (
              <View style={styles.file}>
                {
                  file?.type=='video'? (
                    <Video
                      // ref={videoRef}
                      style={{flex: 1}}
                      source={{
                        uri: file?.uri,
                      }}
                      useNativeControls
                      resizeMode="cover"
                      isLooping
                      // onPlaybackStatusUpdate={status => setStatus(() => status)}
                    />
                  ):(
                    <RNImage source={{uri: file?.uri}} resizeMode='cover' style={{flex: 1}} />
                  )
                }
                
                <Pressable style={styles.closeIcon} onPress={()=> setFile(null)}>
                  <AntDesign name="closecircle" size={25} color="rgba(255, 0,0,0.6)" />
                </Pressable>
              </View>
            )
          }   
          <View style={styles.media}>
            <Text style={styles.addImageText}>Add to your post</Text>
            <View style={styles.mediaIcons}>
              <Pressable onPress={()=> onPick(true)}>
                <Ionicons name="image" size={27} color={theme.colors.text} />
              </Pressable>
              <Pressable onPress={()=> onPick(false)}>
                <FontAwesome6 name="video" size={27} color={theme.colors.text} />
              </Pressable>
            </View>
            
          </View> 
        </ScrollView>
        <Button 
          buttonStyle={{height: hp(6.2)}} 
          title="Post" 
          loading={loading}
          hasShadow={false} 
          onPress={onSubmit}
        />
        
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'red',
    marginBottom: 30,
    paddingHorizontal: wp(4),
    gap: 15,
  },
  title: {
    // marginBottom: 10,
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    textAlign: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  avatar: {
    height: hp(6.5),
    width: hp(6.5),
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  publicText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
  },

  textEditor: {
    // marginTop: 10,
  },

  media: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray
  },
  mediaIcons: {
    flexDirection: 'row',
    gap: 15
  },

  addImageText: {
    fontSize: hp(1.9),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  imageIcon: {
    // backgroundColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    // padding: 6,
  },
  file: {
    height: hp(30),
    width: '100%',
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderCurve: 'continuous'
  },
  video: {

  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    // shadowColor: theme.colors.textLight,
    // shadowOffset: {width: 0, height: 3},
    // shadowOpacity: 0.6,
    // shadowRadius: 8
  }

})

export default NewPost