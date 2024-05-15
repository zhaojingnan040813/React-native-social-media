import { View, Text, StyleSheet } from 'react-native'
import React, { useCallback, useRef } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import { getUserImageSrc } from '../../services/imageService'
import { Image } from 'expo-image'
import {actions, getContentCSS, RichEditor, RichToolbar} from 'react-native-pell-rich-editor';

const NewPost = () => {
  const {user} = useAuth();
  const richTextRef = useRef(null);
  const contentRef = useRef('');

  const handleContentChange = content=>{
    console.log('content: ', content);
    contentRef.current = content;
  }

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Text style={styles.title}>Create Post</Text>
        {/* header */}
        <View style={styles.header}>
            <Image source={getUserImageSrc(user?.image)} style={styles.avatar} />
            <View style={{gap: 2}}>
              <Text style={styles.username}>{user && user.name}</Text>
              <Text style={styles.publicText}>Public</Text>
            </View>
        </View>

        <View style={styles.textEditor}>
        <RichToolbar
            actions={[
              // actions.undo,
              // actions.redo,
              // actions.insertVideo,
              // actions.insertImage,
              actions.setStrikethrough,
              actions.removeFormat,
              actions.setBold,
              actions.setItalic,
              actions.checkboxList,
              actions.insertOrderedList,
              actions.blockquote,
              actions.alignLeft,
              actions.alignCenter,
              actions.alignRight,
              actions.code,
              actions.line,
              actions.heading1,
              actions.heading4,
              // 'fontSize',
            ]}
            iconMap={{
              [actions.heading1]: ({tintColor}) => <Text style={{color: tintColor}}>H1</Text>,
              [actions.heading4]: ({tintColor}) => <Text style={{color: tintColor}}>H4</Text>,
            }}
            style={styles.richBar}
            flatContainerStyle={styles.flatStyle}
            editor={richTextRef}
            // iconSize={22}
            disabled={false}
            // fontSize={handleFontSize}
            selectedIconTint={theme.colors.primaryDark}
          />
          <RichEditor
            ref={richTextRef}
            style={styles.rich}
            editorStyle={styles.contentStyle} // default light style
            placeholder={"What's on your mind?"}
            onChange={handleContentChange}
            // initialContentHTML={'Hello <b>World</b> <p>this is a new paragraph</p> <p>this is another new paragraph</p>'}
            editorInitializedCallback={() => {}}
          />
        </View>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    gap: 10,
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    textAlign: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  avatar: {
    height: hp(6.5),
    width: hp(6.5),
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  publicText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
  },

  textEditor: {
    marginTop: 10,
  },

  ///////////
  rich: {
    // padding: 5,
    minHeight: 300,
    flex: 1,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomRightRadius: theme.radius.xl,
    borderBottomLeftRadius: theme.radius.xl,
    borderColor: theme.colors.gray,
    padding: 5,
    // backgroundColor: 'rgba(0,0,0,0.1)',

  },
  contentStyle: {
    // backgroundColor: 'rgba(0,0,0,0.01)',
    color: theme.colors.textDark,
    // caretColor: theme.colors.primaryDark,
    placeholderColor: 'gray',
    // contentCSSText: 'font-size: 16px', // initial valid
  },

  richBar: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    // backgroundColor: 'red',
    backgroundColor: theme.colors.gray
  },

  flatStyle: {
    paddingHorizontal: 8,
    // marginTop: 10,
    // height: 50,
    gap: 3,
  },
})

export default NewPost