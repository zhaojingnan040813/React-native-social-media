import { StyleSheet, Text, View } from 'react-native'
import React, { memo } from 'react'
import { hp, wp } from '../helpers/common';
import { theme } from '../constants/theme';
import RenderHtml from 'react-native-render-html';

const PostBody = ({htmlBody}) => {

    const textStyle = {
        color: theme.colors.dark,
        fontSize: hp(1.75)
    }
      
    const tagsStyles = {
        div: textStyle,
        p: textStyle,
        ol: textStyle,
        h1: {
            color: theme.colors.dark
        },
        h4: {
            color: theme.colors.dark
        },
    };
  return (
    <RenderHtml
        contentWidth={wp(100)}
        source={htmlBody}
        tagsStyles={tagsStyles}
        render
    />
  )
}

export default memo(PostBody);

const styles = StyleSheet.create({});