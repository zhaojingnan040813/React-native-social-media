import { View, Text, StyleSheet, Pressable, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Image } from 'expo-image'
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import moment from 'moment'
import { getUserImageSrc } from '../services/imageService'
import Avatar from './Avatar'

const CommentItem = ({
    item, 
    currentUser, 
    canDelete,
    onDelete,
    highlight
}) => {
    const [showDelete, setShowDelete] = useState(false);
    const [pressedInfo, setPressedInfo] = useState(false);
    const createdAt = moment(item.created_at).fromNow();

    const deleteModal = ()=>{
        Alert.alert('确认', '您确定要删除此评论吗?', [
            {
              text: '取消',
              onPress: () => console.log('取消删除'),
              style: 'cancel',
            },
            {
                text: '删除', 
                onPress: () => onDelete(item),
                style: 'destructive'
            },
        ]);
    }


    useEffect(()=>{
        if(currentUser.id==item?.userId) setShowDelete(true);
        return ()=>{}
    },[currentUser]);
  return (
    <View style={[styles.container, highlight && styles.highlight]}>
        {/* user */}
        <Avatar 
            uri={item.user?.image} 
            style={{marginTop: 5}} 
            size={hp(4.5)}
            rounded={theme.radius.md}
        />

        <View style={styles.body}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={styles.username}>{item.user?.name}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                    <Text style={styles.time}>{createdAt}</Text>
                    {
                        showDelete && (
                            <Pressable onPress={deleteModal}>
                                <Text style={styles.time}>删除</Text>
                            </Pressable>
                        )
                    }
                </View>
            </View>
            <Text style={styles.comment}>
                {item.body}
            </Text>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 8,
        borderColor: theme.colors.gray,
        paddingTop: 4,
        borderRadius: theme.radius.lg,
        borderCurve: 'continuous'
    },
    avatar: {
        height: hp(4.5),
        width: hp(4.5),
        borderRadius: theme.radius.md,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        marginTop: 5
    },
    body: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.card,
        gap: 5
    },
    username: {
        color: theme.colors.textDark,
        fontWeight: theme.fonts.medium
    },
    comment: {
        color: theme.colors.text,
    },
    highlight: {
        borderWidth: 1,
        padding: 4,
        borderColor: theme.colors.primaryLight,
        backgroundColor: theme.colors.card,
    },
    time: {
        color: theme.colors.textLight,
        fontSize: hp(1.6)
    }
})

export default CommentItem