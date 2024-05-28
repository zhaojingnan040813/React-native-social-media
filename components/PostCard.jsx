import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme';
import { Image } from 'expo-image';
import { getImageSource, getUserImageSrc } from '../services/imageService';
import { hp, wp } from '../helpers/common';
import moment from 'moment';
import RenderHtml from 'react-native-render-html';
import Icon from '../assets/icons';

const PostCard = ({
  item,
  index,
  isLast
}) => {
  console.log('item.id: ', item);
  const createdAt = moment(item?.created_at).format('MMM D');
  const htmlBody = { html: item?.body };

  const tagsStyles = {
    div: {
      color: theme.colors.textDark
    },
    p: {
      color: theme.colors.textDark
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* user info and post time */}
        <View style={styles.userInfo}>
          <Image source={getUserImageSrc(item?.user?.image)} style={styles.avatarImage} />
          <View style={{gap: 2}}>
            <Text style={styles.username}>{item?.user?.name}</Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </View>

        {/* actions icon */}
        <TouchableOpacity>
          <Icon name="threeDotsHorizontal" size={32} color={'rgba(0,0,0,0.35)'} />
        </TouchableOpacity>
        
      </View>

      {/* post image & body */}
      <View style={styles.content}>
        <View style={styles.postBody}>
          {
            item?.body && (
              <RenderHtml
                contentWidth={wp(100)}
                source={htmlBody}
                tagsStyles={tagsStyles}
              />
            )
          }
        </View>
        
        
        {
          item?.file && item?.file?.includes('postImages') && (
            <Image 
              source={getImageSource(item?.file)}
              style={styles.postImage}
              contentFit='cover'
            />
          )
        }
      </View>
      
      {/* { !isLast && <View style={styles.separator} /> } */}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 20,
    borderWidth: 0.8,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.xxl*1.1,
    borderCurve: 'continuous',
    padding: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },  
  avatarImage: {
    height: hp(5),
    width: hp(5),
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
  },
  username: {
    fontSize: hp(1.8),
    color: theme.colors.textDark,
    fontWeight: theme.fonts.medium,
  },
  postTime: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    fontWeight: theme.fonts.medium,
  },
  content: {
    gap: 5,
    // marginBottom: 10,
  },
  postImage: {
    height: hp(40),
    width: '100%',
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous'
  },
  postBody: {
    marginLeft: 5,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.gray
  },


})

export default PostCard