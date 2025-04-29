import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Pressable, Keyboard, Platform } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import PostCard from '../../components/PostCard'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';
import Loading from '../../components/Loading';
import { createComment, fetchPostDetails, removeComment, removePost } from '../../services/postService';
import { supabase } from '../../lib/supabase';
import CommentItem from '../../components/CommentItem';
import { getUserData } from '../../services/userService';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { createNotification } from '../../services/notificationService';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { FlatList } from 'react-native-gesture-handler';

const PostDetails = () => {
    const {postId, commentId} = useLocalSearchParams();

    /// later we need to update the comments, thats why we used a sate for item
    // const [item, setItem] = useState(JSON.parse(params.data)); 
    const [post, setPost] = useState(null);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const {user} = useAuth();  
    const commentRef = useRef("");
    const inputRef = useRef(null);
    const [startLoading, setStartLoading] = useState(true);
    const [comment, setComment] = useState(''); 
    const [sending, setSending] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    // console.log('got item: ', item);

    const handleNewComment = async payload=>{
        console.log('got new comment: ', payload.new)
        if(payload.new){
            let newComment = {...payload.new};
            let res = await getUserData(newComment.userId);
            newComment.user = res.success? res.data: {};
            setPost(prev=> {
                return {
                    ...prev,
                    comments: [newComment, ...prev.comments]
                }
            });
        }
    }

    useEffect(()=>{

        getPostDetails();

        let channel = supabase
        .channel('comments')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'comments',
            filter: `postId=eq.${postId}`,
        }, handleNewComment)
        .subscribe();

        // getPosts();

        return ()=>{
            supabase.removeChannel(channel)
        }
    },[]);

    const getPostDetails = async ()=>{
        let res = await fetchPostDetails(postId);
        // console.log('res: ', res);
        setStartLoading(false);
        if(res.success) setPost(res.data);
    }


    const onNewComment = async ()=>{
        if(!commentRef.current) return null;
        let data = {
            userId: user?.id,
            postId: post?.id,
            text: commentRef.current,
        };

        setLoading(true);
        let res = await createComment(data);
        setLoading(false);
        // console.log('result: ', res);
        if(res.success){
            if(user.id!=post.userId){
                // send notification
                let notify = {
                    senderId: user.id,
                    receiverId: post.userId,
                    title: 'commented on your post',
                    data: JSON.stringify({postId: post.id, commentId: res?.data?.id})
                }
                createNotification(notify);
            }

            inputRef?.current?.clear();
            commentRef.current="";
        }else{
            Alert.alert('Comment', res.msg);
        }
    }

    const onDeleteComment = async (comment)=>{
        let res = await removeComment(comment.id);
        if(res.success){
            setPost(prevPost=>{
                let updatedPost = {...prevPost};
                updatedPost.comments = updatedPost.comments.filter(c=> c.id != comment.id);
                return updatedPost;
            })
        }else{
            Alert.alert('Comment', res.msg);
        }
    }

    const onDeletePost = async ()=>{
        let res = await removePost(post.id);
        if(res.success){
            router.back();
        }else{
            Alert.alert('Post', res.msg);
        }
    }
    const onEditPost = async ()=>{
        router.back();
        router.push({pathname: 'newPost', params: {...post}});
        
    }

    if(startLoading){
        return (
            <View style={styles.center}>
                <Loading />
            </View>
        )
    }

    if(!post){
        return (
            <View style={[styles.center, {justifyContent: 'flex-start', marginTop: 100}]}>
                <Text style={styles.notFound}>Post not found !</Text>
            </View>     
        )
        
    }
    
  return (
    <ScreenWrapper bg="white">
    <View style={styles.container}>
            <Header title="帖子详情" />
            {/* <BackButton router={router} /> */}
            {
                loading? (
                    <View style={{marginTop: hp(20)}}>
                        <Loading />
                    </View>
                ): (
                    post && (
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{flex: 1}}
                        >
                            <FlatList
                                data={post?.comments || []}
                                contentContainerStyle={{gap: 10, paddingBottom: 30}}
                                showsVerticalScrollIndicator={true}
                                ListHeaderComponent={<>
            <PostCard
                                        item={post}
                currentUser={user}
                                        showMoreIcon={false}
                router={router} 
                showDelete={true}
                onDelete={onDeletePost}
                onEdit={onEditPost}
            />
                                    <View style={styles.divider} />

                                    <Text style={styles.subtitle}>评论</Text>

                                </>}
                                renderItem={({item})=> <CommentItem 
                                    item={item} 
                                    currentUser={user}
                                    onDelete={onDeleteComment}
                                />}
                                keyExtractor={(item, idx)=> item?.id?.toString()}
                            />


            {/* comment input */}
                            <View style={styles.commentInput}>
                                <TextInput 
                                    placeholder='写下您的评论...'
                                    style={styles.input}
                                    value={comment}
                                    onChangeText={(val)=>setComment(val)}
                />
                                {
                                    sending? (
                                        <View style={styles.sendButton}>
                            <Loading size="small" />
                        </View>
                                    ): (
                                        <Pressable style={styles.sendButton} onPress={onNewComment}>
                                            <Icon name="send" size={hp(3)} color={comment? theme.colors.primary: theme.colors.textLight} />
                                        </Pressable>
                    )
                }
                
            </View>
                        </KeyboardAvoidingView>
                    )
                    )
                }
            </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: wp(4),
        paddingBottom: 20,
    },
    divider: {
        height: 1.5,
        backgroundColor: theme.colors.gray,
        marginTop: 20
    },
    subtitle: {
        color: theme.colors.text,
        fontSize: hp(2.6),
        fontWeight: theme.fonts.bold,
        marginTop: 20,
        marginBottom: 15,
    },
    commentInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        paddingVertical: 10,
        gap: 10,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray
    },
    input: {
        flex: 1,
        backgroundColor: 'white',
        paddingVertical: Platform.OS=='ios'? 12: 6,
        paddingHorizontal: 15,
        borderRadius: theme.radius.lg,
        fontWeight: theme.fonts.medium,
        fontSize: hp(1.9),
        borderWidth: 1,
        borderColor: theme.colors.gray
    },
    sendButton: {
        width: hp(5),
        height: hp(5),
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: {
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center'
    },
    notFound: {
        fontSize: hp(2.5),
        color: theme.colors.text,
        fontWeight: theme.fonts.medium,
    },
    loading: {
        height: hp(5.8), 
        width: hp(5.8), 
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{scale: 1.3}]
    }
})

export default PostDetails