import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import Icon from '../assets/icons'

const Input = (props) => {
  const [secureTextVisible, setSecureTextVisible] = useState(false);
  
  // 判断是否为密码输入框
  const isPasswordInput = props.secureTextEntry !== undefined;
  
  return (
    <View style={[styles.container, props.containerStyle && props.containerStyle]}>
        {
            props.icon && props.icon
        }
        <TextInput
            style={{flex: 1}}
            placeholderTextColor={theme.colors.textLight}
            ref={props.inputRef && props.inputRef}
            {...props}
            secureTextEntry={isPasswordInput && !secureTextVisible}
        />
        {isPasswordInput && (
          <TouchableOpacity 
            onPress={() => setSecureTextVisible(!secureTextVisible)}
            style={styles.eyeIcon}
          >
            <Icon 
              name={secureTextVisible ? "eye" : "eyeOff"} 
              size={22} 
              color={theme.colors.textLight}
            />
          </TouchableOpacity>
        )}
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: hp(7.2),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.4,
        borderColor: theme.colors.text,
        borderRadius: theme.radius.xxl,
        borderCurve: 'continuous',
        paddingHorizontal: 18,
        gap: 12
    },
    eyeIcon: {
        padding: 4
    }
})

export default Input;