import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { hp, wp } from '../../helpers/common'
import { useAuth } from '../../contexts/AuthContext'
import { theme } from '../../constants/theme'
import { Feather, FontAwesome, Ionicons, SimpleLineIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../../components/ScreenWrapper'
import Button from '../../components/Button'
import BackButton from '../../components/BackButton'
import * as ImagePicker from 'expo-image-picker';
import { updateUser } from '../../services/userService'
import { getFilePath, getUserImageSrc, uploadFile } from '../../services/imageService'
import { Image } from 'expo-image';
import Header from '../../components/Header'
import Icon from '../../assets/icons'
import Input from '../../components/Input'


const EditProfile = () => {
  const {user: currentUser, setUserData} = useAuth();
  const router = useRouter();
  const [profileModal, toggleProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({
    name: '',
    phoneNumber: '',
    image: null,
    bio: '',
    address: '',
  });

  useEffect(()=>{
    if(currentUser){
        setUser({
            name: currentUser.name || '',
            phoneNumber: currentUser.phoneNumber || '',
            image: currentUser.image || null,
            address: currentUser.address || '',
            bio: currentUser.bio || '',
        });
    }
  },[currentUser]);
  


  const onPickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setUser({...user, image: result.assets[0]});
    }
  };

  const onSubmit = async () => {
    let userData = {...user};
    let {name, phoneNumber, address, image, bio} = userData;
    
    // 检查必填字段
    if(!name.trim()) {
        Alert.alert('提示', "请输入您的姓名");
        return;
    }
    
    if(!phoneNumber.trim()) {
        Alert.alert('提示', "请输入您的电话号码");
        return;
    }
    
    if(!address.trim()) {
        Alert.alert('提示', "请输入您的地址");
        return;
    }
    
    if(!bio.trim()) {
        Alert.alert('提示', "请输入您的个人简介");
        return;
    }
    
    if(!image) {
        Alert.alert('提示', "请上传您的头像");
        return;
    }
    
    setLoading(true);
    
    try {
        // 如果是新选择的图片（对象类型），则需要上传
        if(typeof image == 'object'){
            console.log('正在上传图片...');
            let imageResult = await uploadFile('profiles', image?.uri, true);
            
            if(imageResult.success) {
                userData.image = imageResult.data;
                console.log('图片上传成功:', imageResult.data);
            } else {
                // 上传失败但保留旧图片
                console.log('图片上传失败:', imageResult.msg);
                Alert.alert('提示', '头像上传失败，将保持原头像不变');
                userData.image = currentUser.image;
            }
        }
        
        // 更新用户信息
        console.log('正在更新用户信息...');
        const res = await updateUser(currentUser?.id, userData);
        
        if(res.success){
            console.log('用户信息更新成功');
            // 更新全局状态
            setUserData({...currentUser, ...userData});
            Alert.alert('成功', '个人资料已更新', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } else {
            console.log('用户信息更新失败:', res.msg);
            Alert.alert('更新失败', res.msg || '保存个人资料时出错');
        }
    } catch (error) {
        console.error('个人资料更新错误:', error);
        Alert.alert('错误', '更新个人资料时发生未知错误');
    } finally {
        setLoading(false);
    }
  }

  let imageSource = user.image && typeof user?.image == 'object'? user.image.uri: getUserImageSrc(user.image);
  
  return (
    <ScreenWrapper bg="white">
        <View style={styles.container}>
            <ScrollView style={{flex: 1}}>   
                <Header title="编辑个人资料" />
               
                {/* form */}
                <View style={styles.form}>
                    <View style={styles.avatarContainer}>
                        <Image source={imageSource} style={styles.avatar} />
                        <Pressable style={styles.cameraIcon} onPress={onPickImage}>
                            {/* <Feather name="camera" size={20} /> */}
                            <Icon name="camera" strokeWidth={2.5} size={20} />
                        </Pressable>
                    </View>
                    <Text style={{fontSize: hp(1.5), color: theme.colors.text}}>
                        请完善您的个人资料信息
                    </Text>
                    <Input
                      icon={<Icon name="user" size={26} />}
                      placeholder='输入您的姓名'
                      placeholderTextColor={theme.colors.textLight}
                      value={user.name}
                      onChangeText={value=> setUser({...user, name: value})}
                    />
                    <Input
                      icon={<Icon name="call" size={26} />}
                      placeholder='输入您的电话号码'
                      placeholderTextColor={theme.colors.textLight}
                      value={user.phoneNumber}
                      onChangeText={value=> setUser({...user, phoneNumber: value})}
                    />
                    <Input
                      icon={<Icon name="location" size={26} />}
                      placeholder='输入您的地址'
                      placeholderTextColor={theme.colors.textLight}
                      value={user.address}
                      onChangeText={value=> setUser({...user, address: value})}
                    />

                    <Input
                      placeholder='输入您的个人简介'
                      placeholderTextColor={theme.colors.textLight}
                      onChangeText={value=> setUser({...user, bio: value})}
                      multiline={true}
                      value={user.bio}
                      containerStyle={styles.bio}
                    />

                    {/* button */}
                    <Button title="更新" loading={loading} onPress={onSubmit} />
                </View>
                    
            </ScrollView>
        </View>
      
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4)
  },  
  avatarContainer: {
    height: hp(14),
    width: hp(14),
    alignSelf: 'center'
  },
  avatar: {
    width: '100%', 
    height: '100%', 
    borderRadius: theme.radius.xxl*1.8,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: theme.colors.darkLight
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7
  },
  form: {
    gap: 18,
    marginTop: 20,
  },
  input: {
    flexDirection: 'row',
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
    padding: 17,
    paddingHorizontal: 20,
    gap: 15
  },
  bio: {
    flexDirection: 'row',
    height: hp(15),
    alignItems: 'flex-start',
    paddingVertical: 15,
  }

  
})

export default EditProfile