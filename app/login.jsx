import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../components/ScreenWrapper';

const Login = () => {

  return (
    <ScreenWrapper>
      <Text>Login</Text>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
})

export default Login