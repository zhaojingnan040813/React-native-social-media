import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { theme } from '../../constants/theme'
import { hp } from '../../helpers/common'

const Messages = () => {
  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Text style={styles.title}>消息</Text>
        <View style={styles.content}>
          <Text style={styles.message}>功能正在开发中，敬请期待！</Text>
        </View>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  title: {
    fontSize: hp(3),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 10
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  message: {
    fontSize: hp(2.2),
    color: theme.colors.textLight,
    textAlign: 'center'
  }
})

export default Messages 