import { View, Text } from 'react-native'
import React from 'react'
import { ActivityIndicator } from 'react-native-web'
import { theme } from '../constants/theme'

const Loading = ({size="small", style}) => {
  return (
    <View style={style}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
    </View>
  )
}

export default Loading