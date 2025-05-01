import { View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { hp, wp } from '../../helpers/common'
import { useAuth } from '../../contexts/AuthContext'
import { theme } from '../../constants/theme'
import { Feather, Ionicons, SimpleLineIcons, FontAwesome5 } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { getUserImageSrc } from '../../services/imageService'
import { Image } from 'expo-image';
import Header from '../../components/Header'
import ScreenWrapper from '../../components/ScreenWrapper'
import Icon from '../../assets/icons'
import Avatar from '../../components/Avatar'
import moment from 'moment'

const Profile = () => {
  const {user, logout} = useAuth();
  const router = useRouter();
  
  const onLogout = async () => {
    const result = await logout();
    if (!result.success) {
      Alert.alert("退出登录失败", result.msg);
    } else {
      // 退出成功后跳转到登录页
      router.replace('/login');
    }
  }

  const handleLogout = () => {
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
  
  // 格式化生日显示
  const formatBirthday = (dateString) => {
    if (!dateString) return '';
    return moment(dateString).format('YYYY-MM-DD');
  };

  // 处理点击特性项
  const handleFeatureClick = (feature) => {
    if (feature === '我的帖子') {
      router.push('/myPosts');
    } else if (feature === '消息通知') {
      router.push('/notifications');
    } else if (feature === '我的收藏') {
      router.push('/myBookmarks');
    } else {
      Alert.alert('提示', '该功能正在开发中，敬请期待！');
    }
  };

  // 特性列表数据
  const features = [
    { id: 1, title: '我的帖子', icon: 'document-text', color: '#4ab1fa' },
    { id: 2, title: '消息通知', icon: 'notifications', color: '#4cd964' },
    { id: 3, title: '我的收藏', icon: 'bookmark', color: '#ffcc00' },
    { id: 4, title: '浏览历史', icon: 'time', color: '#34aadc' },
    { id: 5, title: '帮助与反馈', icon: 'help-circle', color: '#ff9500' },
    { id: 6, title: '关于作者', icon: 'information-circle', color: '#ff3b30' },
  ];

  return (
    <ScreenWrapper bg="white">
      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
        <View style={{flex: 1, backgroundColor:'white', paddingHorizontal: wp(4)}}> 
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
                
                {/* 性别图标 */}
                {user?.gender && (
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
                
                <Pressable style={styles.editIcon} onPress={()=> router.push('/editProfile')}>
                  <Icon name="edit" strokeWidth={2.5} size={20} />
                </Pressable>
              </View>
            

              {/* username & address */}
              <View style={{alignItems: 'center', gap: 4}}>
                <Text style={styles.userName}> { user && user.name } </Text>
                <Text style={styles.infoText}> {user && user.address} </Text>
              </View>
              
              {/* 学院和专业信息 */}
              {(user?.college || user?.major) && (
                <View style={styles.educationInfo}>
                  <Icon name="school" size={20} color={theme.colors.textLight} />
                  <Text style={[styles.infoText, {fontSize: hp(1.8)}]}>
                    {user?.college}{user?.major ? ` · ${user.major}` : ''}
                    {user?.grade ? ` · ${user.grade}` : ''}
                  </Text>
                </View>
              )}
              
              {/* 学号信息 */}
              {user?.StudentIdNumber && (
                <View style={styles.info}>
                  <Icon name="idCard" size={20} color={theme.colors.textLight} />
                  <Text style={[styles.infoText, {fontSize: hp(1.8)}]}>
                    {user.StudentIdNumber}
                  </Text>
                </View>
              )}
              
              {/* 生日信息 */}
              {user?.birthday && (
                <View style={styles.info}>
                  <Icon name="calendar" size={20} color={theme.colors.textLight} />
                  <Text style={[styles.infoText, {fontSize: hp(1.8)}]}>
                    {formatBirthday(user.birthday)}
                  </Text>
                </View>
              )}

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
                    <View style={styles.bioContainer}>
                      <Icon name="info" size={20} color={theme.colors.textLight} />
                      <Text style={[styles.infoText, {fontSize: hp(1.8)}]}>{user.bio}</Text>
                    </View>
                  )
                }
                
              </View>
              
              {/* 功能列表 */}
              <View style={styles.featuresContainer}>
                {features.map((feature) => (
                  <TouchableOpacity 
                    key={feature.id} 
                    style={styles.featureItem}
                    onPress={() => handleFeatureClick(feature.title)}
                  >
                    <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20' }]}>
                      <Ionicons name={feature.icon} size={24} color={feature.color} />
                    </View>
                    <Text style={styles.featureText}>{feature.title}</Text>
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.gray} />
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* 退出登录按钮 */}
              <TouchableOpacity 
                style={styles.logoutBtn}
                onPress={handleLogout}
              >
                <Text style={styles.logoutBtnText}>退出登录</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 30,
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
  genderIcon: {
    position: 'absolute',
    bottom: 0,
    left: -5,
    padding: 6,
    borderRadius: 50,
    backgroundColor: 'rgba(100, 149, 237, 0.9)', // 默认蓝色(男)
  },
  educationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  bioContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 5,
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
    padding: 8,
    borderRadius: 10,
  },
  featuresContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.gray + '30',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: hp(1.8),
    fontWeight: '500',
    color: theme.colors.text,
  },
  logoutBtn: {
    marginTop: 20,
    backgroundColor: '#fee2e2',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutBtnText: {
    color: theme.colors.rose,
    fontWeight: '600',
    fontSize: hp(1.8),
  },
})

export default Profile