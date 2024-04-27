import { View, Text, StyleSheet, Pressable } from 'react-native'
import React from 'react'
import { hp } from '../helpers/common'
import { theme } from '../constants/theme'

const Button = ({
    buttonStyle,
    textStyle,
    title='',
    onPress=()=>{},
    hasShadow=true,
}) => {

    const shadowStyle = {
        shadowColor: theme.colors.primary,
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.3,
        shadowRadius: 10
    }
  return (
    <Pressable onPress={onPress} style={[styles.button, buttonStyle, hasShadow && shadowStyle]}>
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.primary,
        padding: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
    },
    text: {
        fontSize: hp(2.5),
        color: 'white',
        fontWeight: theme.fonts.bold
    }
})

export default Button;