import { View, Text, Pressable, StyleSheet } from 'react-native'
import React from 'react'
import { AntDesign } from '@expo/vector-icons'
import { theme } from '../constants/theme'

const BackButton = ({router, size=18}) => {
  return (
    <Pressable onPress={()=> router.back()} style={styles.button}>
        <AntDesign name="arrowleft" size={size} color={theme.colors.textDark} />
    </Pressable>
  )
}
const styles = StyleSheet.create({
    button: {
        alignSelf: 'flex-start',
        padding: 10,
        borderRadius: 50,
        backgroundColor: 'rgba(0,0,0,0.07)'
    }
})

export default BackButton