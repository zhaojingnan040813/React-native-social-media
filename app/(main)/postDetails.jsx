import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Pressable, Keyboard, Platform, RefreshControl, InputAccessoryView } from 'react-native'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import PostCard from '../../components/PostCard'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';
import Loading from '../../components/Loading';
import { createComment, fetchPostDetails, removeComment, removePost } from '../../services/postService';
import { supabase, channelManager } from '../../lib/supabase';
import CommentItem from '../../components/CommentItem';
import { getUserData } from '../../services/userService';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { createNotification, createCommentNotification } from '../../services/notificationService';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { FlatList } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 缓存键前缀
const POST_DETAILS_CACHE_PREFIX = 'post_details_cache_';

const PostDetails = () => {
    const params = useLocalSearchParams();
    const postId = params.postId;
    const timestamp = params.t;
    const inputAccessoryViewID = "commentInput";
    
    const [post, setPost] = useState(null);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const {user} = useAuth();  
    const commentRef = useRef("");
    const inputRef = useRef(null);
    const [startLoading, setStartLoading] = useState(true);
    const [comment, setComment] = useState(''); 
    const [sending, setSending] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    
    // 使用ref跟踪组件是否已卸载
    const isMountedRef = useRef(true);
    
    // 获取特定帖子的缓存键
    const getCacheKey = (id) => `${POST_DETAILS_CACHE_PREFIX}${id}`;
    
    // 监听键盘事件
    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          setKeyboardVisible(true);
        }
      );
      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setKeyboardVisible(false);
        }
      );
  
      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }, []);

    const handleNewComment = async payload => {
        // 如果组件已卸载，不处理事件
        if (!isMountedRef.current) return;
        
        if (payload.new) {
            let newComment = {...payload.new};
            let res = await getUserData(newComment.userId);
            newComment.user = res.success ? res.data : {};
            setPost(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    comments: [newComment, ...prev.comments]
                }
            });
        }
    }
    
    // 尝试从缓存加载帖子详情
    const loadFromCache = async (id) => {
        try {
            const cachedData = await AsyncStorage.getItem(getCacheKey(id));
            if (cachedData) {
                const { post: cachedPost, timestamp } = JSON.parse(cachedData);
                // 如果缓存不超过2分钟，使用缓存数据
                if (Date.now() - timestamp < 2 * 60 * 1000) {
                    setPost(cachedPost);
                    setStartLoading(false);
                    return true;
                }
            }
        } catch (error) {
            console.error('Error loading post details from cache:', error);
        }
        return false;
    };

    // 保存数据到缓存
    const saveToCache = async (id, postData) => {
        try {
            const data = {
                post: postData,
                timestamp: Date.now()
            };
            await AsyncStorage.setItem(getCacheKey(id), JSON.stringify(data));
        } catch (error) {
            console.error('Error saving post details to cache:', error);
        }
    };

    useEffect(() => {
        // 设置挂载状态
        isMountedRef.current = true;
        
        // console.log(`帖子详情页面挂载/更新，帖子ID: ${postId}`);
        
        setPost(null);
        setStartLoading(true);
        
        if (postId) {
            // 先尝试从缓存加载
            loadFromCache(postId).then(cacheHit => {
                if (!cacheHit) {
                    getPostDetails();
                }
            });
            
            // 使用通道管理器获取或创建通道
            const channelName = `comments-${postId}`;
            const channel = channelManager.getOrCreateChannel(channelName, null);
            
            // 添加评论变更监听
            channel
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'comments',
                    filter: `postId=eq.${postId}`,
                }, handleNewComment);
            
            return () => {
                // 标记组件已卸载
                isMountedRef.current = false;
                
                // 移除通道订阅
                channelManager.removeChannelSubscriber(channelName);
            }
        }
    }, [postId, timestamp]);

    // 下拉刷新处理函数
    const onRefresh = useCallback(async () => {
        if (!postId) return;
        
        setRefreshing(true);
        try {
            await getPostDetails();
        } catch (error) {
            console.error('刷新帖子详情出错:', error);
            Alert.alert('提示', '刷新数据失败，请稍后再试');
        } finally {
            setRefreshing(false);
        }
    }, [postId]);

    const getPostDetails = async () => {
        // console.log(`开始获取帖子详情数据，ID: ${postId}`);
        try {
            const res = await fetchPostDetails(postId);
            // console.log(`帖子详情获取结果:`, res.success ? '成功' : '失败');
            
            // 确保组件仍然挂载
            if (!isMountedRef.current) return;
            
            setStartLoading(false);
            if (res.success) {
                setPost(res.data);
                // 保存到缓存
                saveToCache(postId, res.data);
            } else {
                Alert.alert('提示', '获取帖子详情失败');
            }
        } catch (error) {
            console.error('获取帖子详情出错:', error);
            if (isMountedRef.current) {
                setStartLoading(false);
                Alert.alert('错误', '获取帖子详情时发生错误');
            }
        }
    }

    const onNewComment = async () => {
        if (!comment.trim()) return null;
        
        let data = {
            userId: user?.id,
            postId: post?.id,
            text: comment,
        };

        setSending(true);
        let res = await createComment(data);
        
        // 确保组件仍然挂载
        if (!isMountedRef.current) return;
        
        setSending(false);
        if (res.success) {
            // 如果发表评论的用户不是帖子作者，创建评论通知
            if (user.id !== post.userId) {
                // 使用新的通知服务创建评论通知
                await createCommentNotification(
                    user.id,           // 评论者ID
                    post.userId,       // 帖子作者ID
                    post.id,           // 帖子ID
                    res?.data?.id,     // 评论ID
                    comment.trim()     // 评论内容
                );
            }

            setComment('');
            commentRef.current = '';
        } else {
            Alert.alert('评论', res.msg);
        }
    }

    const onDeleteComment = async (comment) => {
        let res = await removeComment(comment.id);
        
        // 确保组件仍然挂载
        if (!isMountedRef.current) return;
        
        if (res.success) {
            setPost(prevPost => {
                let updatedPost = {...prevPost};
                updatedPost.comments = updatedPost.comments.filter(c => c.id != comment.id);
                return updatedPost;
            });
            
            // 更新缓存
            if (post) {
                const updatedPost = {
                    ...post,
                    comments: post.comments.filter(c => c.id != comment.id)
                };
                saveToCache(postId, updatedPost);
            }
        } else {
            Alert.alert('Comment', res.msg);
        }
    }

    const onDeletePost = async () => {
        let res = await removePost(post.id);
        
        // 确保组件仍然挂载
        if (!isMountedRef.current) return;
        
        if (res.success) {
            // 删除缓存
            try {
                await AsyncStorage.removeItem(getCacheKey(postId));
            } catch (error) {
                console.error('Error removing post from cache:', error);
            }
            
            router.back();
        } else {
            Alert.alert('Post', res.msg);
        }
    }
    
    const onEditPost = async () => {
        router.back();
        router.push({pathname: 'newPost', params: {...post}});
    }

    if (startLoading) {
        return (
            <View style={styles.center}>
                <Loading />
            </View>
        )
    }

    if (!post) {
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
                          keyboardVerticalOffset={Platform.OS === 'ios' ? hp(10) : 0}
                        >
                            <FlatList
                                data={post?.comments || []}
                                contentContainerStyle={{
                                  gap: 10, 
                                  paddingBottom: keyboardVisible ? hp(25) : hp(16) // 根据键盘状态动态调整
                                }}
                                showsVerticalScrollIndicator={true}
                                keyboardShouldPersistTaps="handled"
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={onRefresh}
                                        colors={[theme.colors.primary]}
                                        tintColor={theme.colors.primary}
                                        title="下拉刷新"
                                        titleColor={theme.colors.textLight}
                                    />
                                }
                                ListHeaderComponent={<>
                                  <PostCard
                                      item={{
                                        ...post,
                                        comments: Array.isArray(post.comments) ? [{ count: post.comments.length }] : [{ count: 0 }]
                                      }}
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

                            {/* 使用绝对定位保证输入框悬浮在底部导航栏上方 */}
                            <View style={[
                              styles.inputContainer, 
                              { bottom: Platform.OS === 'ios' ? (keyboardVisible ? hp(35) : hp(8)) : hp(8) }
                            ]}>
                              <View style={styles.commentInput}>
                                <TextInput 
                                    placeholder='写下您的评论...'
                                    style={styles.input}
                                    value={comment}
                                    onChangeText={(val)=>{
                                        setComment(val);
                                        commentRef.current = val;
                                    }}
                                    ref={inputRef}
                                    inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
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
                            </View>
                            
                            {/* 为iOS添加输入辅助视图 */}
                            {Platform.OS === 'ios' && (
                              <InputAccessoryView nativeID={inputAccessoryViewID}>
                                <View style={styles.inputAccessory}>
                                  <TouchableOpacity 
                                    style={styles.doneButton} 
                                    onPress={() => Keyboard.dismiss()}
                                  >
                                    <Text style={styles.doneButtonText}>完成</Text>
                                  </TouchableOpacity>
                                </View>
                              </InputAccessoryView>
                            )}
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
    inputContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        zIndex: 1000,
    },
    commentInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        paddingVertical: 10,
        gap: 10,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray,
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
    },
    inputAccessory: {
        height: 45,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: '#f1f1f1',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingHorizontal: 10,
    },
    doneButton: {
        padding: 10,
    },
    doneButtonText: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    }
})

export default PostDetails