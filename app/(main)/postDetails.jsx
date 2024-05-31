import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import PostCard from '../../components/PostCard'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { wp } from '../../helpers/common';

const PostDetails = () => {
    const params = useLocalSearchParams();
    const item = JSON.parse(params.data);
    const router = useRouter();
    const {user} = useAuth(); 
    // console.log('got item: ', item);
  return (
    <View style={styles.container}>
      <PostCard
        item={item} 
        currentUser={user}
        router={router} 
        showMoreIcon={false}
        hasShadow={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: wp(4),
        paddingVertical: wp(7),
    }
})

export default PostDetails