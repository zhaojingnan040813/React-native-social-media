import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Audio } from 'expo-av';
import { theme } from '../constants/theme';
import Icon from '../assets/icons';
import { formatAudioDuration } from '../services/audioService';

/**
 * 音频消息组件
 * @param {Object} props
 * @param {string} props.audioUrl - 音频文件URL
 * @param {number} props.duration - 音频时长(秒)
 * @param {boolean} props.isCurrentUser - 是否为当前用户发送的消息
 * @param {function} props.onPlayStateChange - 播放状态改变回调
 */
const AudioMessage = ({ audioUrl, duration, isCurrentUser, onPlayStateChange = () => {} }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 通过ref跟踪组件是否挂载，避免内存泄漏
  const isMounted = useRef(true);
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);
  
  // 卸载之前的声音对象
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  /**
   * 播放状态更新处理
   */
  const onPlaybackStatusUpdate = (status) => {
    if (!isMounted.current) return;
    
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setIsPlaying(status.isPlaying);
      
      // 播放完成
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
        onPlayStateChange(false);
      }
    } else if (status.error) {
      console.error(`音频播放错误: ${status.error}`);
      setError(`播放失败: ${status.error}`);
      setIsPlaying(false);
      setIsLoading(false);
      onPlayStateChange(false);
    }
  };
  
  /**
   * 播放或暂停音频
   */
  const togglePlayback = async () => {
    try {
      // 已经有声音对象
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
          onPlayStateChange(false);
        } else {
          setIsLoading(true);
          await sound.playAsync();
          setIsPlaying(true);
          setIsLoading(false);
          onPlayStateChange(true);
        }
      } 
      // 首次播放，需要加载音频
      else {
        setIsLoading(true);
        setError(null);
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        
        setSound(newSound);
        setIsPlaying(true);
        setIsLoading(false);
        onPlayStateChange(true);
      }
    } catch (error) {
      console.error('播放音频失败:', error);
      setError(`无法播放语音: ${error.message}`);
      setIsLoading(false);
      onPlayStateChange(false);
    }
  };
  
  /**
   * 计算进度百分比
   */
  const getProgressPercentage = () => {
    if (!duration) return 0;
    const totalDuration = duration * 1000; // 转为毫秒
    return Math.min(100, (playbackPosition / totalDuration) * 100);
  };
  
  // 基于发送者设置不同的样式
  const containerStyle = isCurrentUser 
    ? [styles.container, styles.currentUserContainer]
    : [styles.container, styles.otherUserContainer];
    
  const progressBarStyle = {
    ...styles.progressBar,
    width: `${getProgressPercentage()}%`,
    backgroundColor: isCurrentUser ? theme.colors.white : theme.colors.primary,
  };
  
  const textColor = isCurrentUser ? theme.colors.white : theme.colors.primary;
  
  return (
    <TouchableOpacity 
      style={containerStyle}
      onPress={togglePlayback}
      disabled={isLoading}
    >
      {/* 播放/暂停按钮 */}
      <View style={styles.iconContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Icon 
            name={isPlaying ? "pause" : "play"} 
            size={22} 
            color={textColor} 
          />
        )}
      </View>
      
      {/* 进度条和时长 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarContainer}>
          <View style={progressBarStyle} />
        </View>
        <Text style={[styles.durationText, { color: textColor }]}>
          {formatAudioDuration(duration * 1000)}
        </Text>
      </View>
      
      {/* 错误消息 */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: '80%',
  },
  currentUserContainer: {
    backgroundColor: theme.colors.primary,
  },
  otherUserContainer: {
    backgroundColor: theme.colors.greyLight,
  },
  iconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  progressContainer: {
    flex: 1,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  durationText: {
    fontSize: 12,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 10,
    marginTop: 4,
  },
});

export default AudioMessage; 