import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { hp, wp } from '../../helpers/common'
import { fetchNotifications } from '../../services/notificationService'
import { useAuth } from '../../contexts/AuthContext'
import NotificationItem from '../../components/NotificationItem'
import { theme } from '../../constants/theme'
import { useRouter } from 'expo-router'
import Icon from '../../assets/icons'

const Notifications = () => {

  const [notifications, setNotifications] = useState([]);
  const {user} = useAuth();
  const router = useRouter();

  useEffect(()=>{
    getNotifications();
  },[]);

  const getNotifications = async ()=>{
    let res = await fetchNotifications(user.id);
    if(res.success) setNotifications(res.data);
  }

  // 自定义返回功能，直接导航到个人资料页面
  const handleGoBack = () => {
    router.push('/profile');
  };

  return (
    <ScreenWrapper >
      <View style={styles.container}>
        {/* 自定义Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleGoBack}
          >
            <Icon name="arrowLeft" strokeWidth={2.5} size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>通知</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listStyle}>
          {
            notifications.map(item=>{
              return (
                <NotificationItem 
                  key={item.id}
                  item={item} 
                  router={router}
                />
              )
            })
          }
          {
            notifications.length==0 && (
              <Text style={styles.noData}>暂无通知</Text>
            )
          }
        </ScrollView>
      </View>
      
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    position: 'relative',
    marginTop: 5,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: theme.radius.sm,
  },
  headerTitle: {
    fontSize: hp(2.7),
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  listStyle: {
    paddingVertical: 20,
    gap: 10
  },
  noData: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.text,
    textAlign: 'center',
  }
})
export default Notifications