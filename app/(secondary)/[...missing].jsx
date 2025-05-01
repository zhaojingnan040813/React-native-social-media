import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import ScreenWrapper from '../../components/ScreenWrapper'
import Icon from '../../assets/icons'

export default function MissingPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // 返回个人资料页面
  const handleGoBack = () => {
    router.push('/(main)/profile');
  };
  
  return (
    <ScreenWrapper bg="white">
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
        >
          <Icon name="arrowLeft" strokeWidth={2.5} size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>页面不存在</Text>
      </View>
      
      <View style={styles.container}>
        <Icon name="info" size={80} color={theme.colors.textLight} />
        <Text style={styles.title}>页面未找到</Text>
        <Text style={styles.message}>
          您尝试访问的页面不存在或正在开发中。
        </Text>
        <Text style={styles.path}>
          路径: {JSON.stringify(params.missing || '未知')}
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleGoBack}
        >
          <Text style={styles.buttonText}>返回个人资料</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: wp(4),
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray + '20',
  },
  backButton: {
    position: 'absolute',
    left: wp(4),
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: theme.radius.sm,
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 20,
  },
  message: {
    fontSize: hp(2),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 10,
  },
  path: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    marginBottom: 30,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: hp(2),
    fontWeight: 'bold',
  }
}); 