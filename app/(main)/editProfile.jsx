import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, TouchableOpacity, Modal } from 'react-native'
import React, { useEffect, useState } from 'react'
import { hp, wp } from '../../helpers/common'
import { useAuth } from '../../contexts/AuthContext'
import { theme } from '../../constants/theme'
import { Feather, FontAwesome, Ionicons, SimpleLineIcons, FontAwesome5 } from '@expo/vector-icons'
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
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

// 学院列表示例
const COLLEGES = ['基础医学院', '临床医学院', '药学院', '护理学院', '公共卫生学院', '医学技术学院', '精神卫生学院', '医学影像学院', '口腔医学院'];

// 年级列表示例
const GRADES = ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博一', '博二', '博三'];

const EditProfile = () => {
  const {user: currentUser, setUserData} = useAuth();
  const router = useRouter();
  const [profileModal, toggleProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderSelection, setShowGenderSelection] = useState(false);
  const [showCollegeSelection, setShowCollegeSelection] = useState(false);
  const [showGradeSelection, setShowGradeSelection] = useState(false);
  
  const [user, setUser] = useState({
    name: '',
    phoneNumber: '',
    image: null,
    bio: '',
    address: '',
    gender: '',
    birthday: null,
    college: '',
    major: '',
    grade: '',
    StudentIdNumber: '',
    email: '',
  });

  useEffect(()=>{
    if(currentUser){
        setUser({
            name: currentUser.name || '',
            phoneNumber: currentUser.phoneNumber || '',
            image: currentUser.image || null,
            address: currentUser.address || '',
            bio: currentUser.bio || '',
            gender: currentUser.gender || '',
            birthday: currentUser.birthday || null,
            college: currentUser.college || '',
            major: currentUser.major || '',
            grade: currentUser.grade || '',
            StudentIdNumber: currentUser.StudentIdNumber || '',
            email: currentUser.email || '',
        });
    }
  },[currentUser]);
  
  // 处理日期选择
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setUser({...user, birthday: selectedDate.toISOString()});
    }
  };
  
  // 格式化日期显示
  const formatDate = (date) => {
    if (!date) return '';
    return moment(date).format('YYYY-MM-DD');
  };

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
    let {name, phoneNumber, address, image, email} = userData;
    
    // 检查必填字段
    if(!name.trim()) {
        Alert.alert('提示', "请输入您的姓名");
        return;
    }
    
    // 验证邮箱格式
    if(email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if(!emailRegex.test(email)) {
        Alert.alert('提示', "请输入有效的邮箱地址");
        return;
      }
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
  
  // 自定义返回函数，直接返回到个人资料页面
  const handleGoBack = () => {
    router.push('/profile');
  };
  
  return (
    <ScreenWrapper bg="white">
        <View style={styles.container}>
            <ScrollView style={{flex: 1}}>   
                <View style={styles.headerContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <Icon name="arrowLeft" strokeWidth={2.5} size={26} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>编辑个人资料</Text>
                </View>
               
                {/* form */}
                <View style={styles.form}>
                    <View style={styles.avatarContainer}>
                        <Image source={imageSource} style={styles.avatar} />
                        
                        {/* 显示性别图标 */}
                        {user.gender && (
                          <View style={[
                            styles.genderIcon, 
                            {backgroundColor: user.gender === '男' ? 'rgba(100, 149, 237, 0.9)' : 'rgba(255, 182, 193, 0.9)'}
                          ]}>
                            <FontAwesome5 
                              name={user.gender === '男' ? 'mars' : 'venus'} 
                              size={16} 
                              color="white" 
                            />
                          </View>
                        )}
                        
                        <Pressable style={styles.cameraIcon} onPress={onPickImage}>
                            <Icon name="camera" strokeWidth={2.5} size={20} />
                        </Pressable>
                    </View>
                    <Text style={{fontSize: hp(1.5), color: theme.colors.text}}>
                        请完善您的个人资料信息
                    </Text>
                    
                    {/* 基本信息 */}
                    <Input
                      icon={<Icon name="user" size={26} />}
                      placeholder='输入您的姓名'
                      placeholderTextColor={theme.colors.textLight}
                      value={user.name}
                      onChangeText={value=> setUser({...user, name: value})}
                    />
                    
                    {/* 性别选择 */}
                    <TouchableOpacity 
                      style={styles.selectInput}
                      onPress={() => setShowGenderSelection(true)}
                    >
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                        <Icon name="gender" size={26} />
                        <Text style={{color: user.gender ? theme.colors.text : theme.colors.textLight}}>
                          {user.gender || '选择性别'}
                        </Text>
                      </View>
                      <Icon name="down" size={16} color={theme.colors.textLight} />
                    </TouchableOpacity>
                    
                    {/* 性别选择弹窗 */}
                    <Modal
                      animationType="slide"
                      transparent={true}
                      visible={showGenderSelection}
                      onRequestClose={() => setShowGenderSelection(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                          <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>选择性别</Text>
                            <TouchableOpacity onPress={() => setShowGenderSelection(false)}>
                              <FontAwesome5 name="times" size={20} color={theme.colors.text} />
                            </TouchableOpacity>
                          </View>
                          
                          <View style={styles.modalContent}>
                            <TouchableOpacity 
                              style={styles.modalItem}
                              onPress={() => {
                                setUser({...user, gender: '男'});
                                setShowGenderSelection(false);
                              }}
                            >
                              <View style={styles.genderOption}>
                                <FontAwesome5 name="mars" size={20} color="#6495ED" />
                                <Text style={[
                                  styles.modalItemText, 
                                  user.gender === '男' && styles.selectedText
                                ]}>男</Text>
                              </View>
                              {user.gender === '男' && (
                                <FontAwesome5 name="check" size={16} color={theme.colors.primary} />
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.modalItem}
                              onPress={() => {
                                setUser({...user, gender: '女'});
                                setShowGenderSelection(false);
                              }}
                            >
                              <View style={styles.genderOption}>
                                <FontAwesome5 name="venus" size={20} color="#FFB6C1" />
                                <Text style={[
                                  styles.modalItemText, 
                                  user.gender === '女' && styles.selectedText
                                ]}>女</Text>
                              </View>
                              {user.gender === '女' && (
                                <FontAwesome5 name="check" size={16} color={theme.colors.primary} />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </Modal>
                    
                    {/* 生日选择 */}
                    <TouchableOpacity 
                      style={styles.selectInput}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                        <Icon name="calendar" size={26} />
                        <Text style={{color: user.birthday ? theme.colors.text : theme.colors.textLight}}>
                          {user.birthday ? formatDate(user.birthday) : '选择生日'}
                        </Text>
                      </View>
                      <Icon name="calendar" size={20} color={theme.colors.textLight} />
                    </TouchableOpacity>
                    
                    {/* 日期选择器 */}
                    {showDatePicker && (
                      <DateTimePicker
                        testID="dateTimePicker"
                        value={user.birthday ? new Date(user.birthday) : new Date()}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                      />
                    )}
                    
                    {/* 学号 */}
                    <Input
                      icon={<Icon name="idCard" size={26} />}
                      placeholder='输入您的学号'
                      placeholderTextColor={theme.colors.textLight}
                      value={user.StudentIdNumber}
                      onChangeText={value=> setUser({...user, StudentIdNumber: value})}
                    />
                    
                    {/* 学院选择 */}
                    <TouchableOpacity 
                      style={styles.selectInput}
                      onPress={() => setShowCollegeSelection(true)}
                    >
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                        <Icon name="school" size={26} />
                        <Text style={{color: user.college ? theme.colors.text : theme.colors.textLight}}>
                          {user.college || '选择学院'}
                        </Text>
                      </View>
                      <Icon name="down" size={16} color={theme.colors.textLight} />
                    </TouchableOpacity>
                    
                    {/* 学院选择弹窗 */}
                    <Modal
                      animationType="slide"
                      transparent={true}
                      visible={showCollegeSelection}
                      onRequestClose={() => setShowCollegeSelection(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                          <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>选择学院</Text>
                            <TouchableOpacity onPress={() => setShowCollegeSelection(false)}>
                              <FontAwesome5 name="times" size={20} color={theme.colors.text} />
                            </TouchableOpacity>
                          </View>
                          
                          <ScrollView style={styles.modalContent}>
                            {COLLEGES.map((college, index) => (
                              <TouchableOpacity 
                                key={index}
                                style={styles.modalItem}
                                onPress={() => {
                                  setUser({...user, college});
                                  setShowCollegeSelection(false);
                                }}
                              >
                                <Text style={[
                                  styles.modalItemText, 
                                  user.college === college && styles.selectedText
                                ]}>
                                  {college}
                                </Text>
                                {user.college === college && (
                                  <FontAwesome5 name="check" size={16} color={theme.colors.primary} />
                                )}
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                    </Modal>
                    
                    {/* 专业 */}
                    <Input
                      icon={<Icon name="book" size={26} />}
                      placeholder='输入您的专业'
                      placeholderTextColor={theme.colors.textLight}
                      value={user.major}
                      onChangeText={value=> setUser({...user, major: value})}
                    />
                    
                    {/* 年级选择 */}
                    <TouchableOpacity 
                      style={styles.selectInput}
                      onPress={() => setShowGradeSelection(true)}
                    >
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                        <Icon name="graduate" size={26} />
                        <Text style={{color: user.grade ? theme.colors.text : theme.colors.textLight}}>
                          {user.grade || '选择年级'}
                        </Text>
                      </View>
                      <Icon name="down" size={16} color={theme.colors.textLight} />
                    </TouchableOpacity>
                    
                    {/* 年级选择弹窗 */}
                    <Modal
                      animationType="slide"
                      transparent={true}
                      visible={showGradeSelection}
                      onRequestClose={() => setShowGradeSelection(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                          <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>选择年级</Text>
                            <TouchableOpacity onPress={() => setShowGradeSelection(false)}>
                              <FontAwesome5 name="times" size={20} color={theme.colors.text} />
                            </TouchableOpacity>
                          </View>
                          
                          <ScrollView style={styles.modalContent}>
                            {GRADES.map((grade, index) => (
                              <TouchableOpacity 
                                key={index}
                                style={styles.modalItem}
                                onPress={() => {
                                  setUser({...user, grade});
                                  setShowGradeSelection(false);
                                }}
                              >
                                <Text style={[
                                  styles.modalItemText, 
                                  user.grade === grade && styles.selectedText
                                ]}>
                                  {grade}
                                </Text>
                                {user.grade === grade && (
                                  <FontAwesome5 name="check" size={16} color={theme.colors.primary} />
                                )}
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                    </Modal>
                    
                    {/* 电话 */}
                    <Input
                      icon={<Icon name="call" size={26} />}
                      placeholder='输入您的电话号码'
                      placeholderTextColor={theme.colors.textLight}
                      value={user.phoneNumber}
                      onChangeText={value=> setUser({...user, phoneNumber: value})}
                    />
                    
                    {/* 邮箱 - 添加在电话号码之后 */}
                    <Input
                      icon={<Icon name="mail" size={26} />}
                      placeholder='输入您的邮箱'
                      placeholderTextColor={theme.colors.textLight}
                      value={user.email}
                      onChangeText={value=> setUser({...user, email: value})}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    
                    {/* 地址 */}
                    <Input
                      icon={<Icon name="location" size={26} />}
                      placeholder='输入您的地址'
                      placeholderTextColor={theme.colors.textLight}
                      value={user.address}
                      onChangeText={value=> setUser({...user, address: value})}
                    />
                    
                    {/* 个人简介 */}
                    <Input
                      placeholder='输入您的个人简介'
                      placeholderTextColor={theme.colors.textLight}
                      onChangeText={value=> setUser({...user, bio: value})}
                      multiline={true}
                      value={user.bio}
                      containerStyle={styles.bio}
                    />

                    {/* 更新按钮 */}
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
  genderIcon: {
    position: 'absolute',
    bottom: 0,
    left: -10,
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'rgba(100, 149, 237, 0.9)', // 默认蓝色(男)
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
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
    padding: 17,
    paddingHorizontal: 18,
  },
  dropdown: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: 8,
    marginTop: -15,
    marginBottom: 10,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.gray,
    gap: 10,
  },
  dropdownText: {
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: hp(2),
    fontWeight: 'bold',
  },
  modalContent: {
    marginTop: 20,
    maxHeight: hp(50),
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.gray,
  },
  modalItemText: {
    fontSize: hp(2),
    color: theme.colors.text,
  },
  selectedText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginVertical: 5,
    position: 'relative',
  },
  backButton: {
    padding: 5,
    position: 'absolute',
    left: 0,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius: theme.radius.sm,
  },
  headerTitle: {
    fontSize: hp(2.7),
    fontWeight: '600',
    color: theme.colors.textDark
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
})

export default EditProfile