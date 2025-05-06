import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator,
  Alert,
  Vibration
} from 'react-native';
import { Audio } from 'expo-av';
import { theme } from '../constants/theme';
import Icon from '../assets/icons';
import { formatAudioDuration } from '../services/audioService';
import * as FileSystem from 'expo-file-system';

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
  const [localAudioUri, setLocalAudioUri] = useState(null);
  const [failCount, setFailCount] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  
  // 用于演示模式的计时器
  const demoTimerRef = useRef(null);
  // 通过ref跟踪组件是否挂载，避免内存泄漏
  const isMounted = useRef(true);
  
  // 组件挂载时，尝试预下载音频文件或设置演示模式
  useEffect(() => {
    let mounted = true;
    
    const checkAudioAccess = async () => {
      if (audioUrl && !audioUrl.startsWith('file://')) {
        // 先简单测试URL是否可访问
        try {
          console.log('测试音频URL可访问性:', audioUrl);
          const response = await fetch(audioUrl, { method: 'HEAD' });
          
          if (!response.ok) {
            console.log('音频URL无法访问, 状态码:', response.status);
            if (mounted) {
              // 如果URL无法访问，直接切换到演示模式
              setDemoMode(true);
              setError('无法访问音频（自动切换到演示模式）');
            }
          } else {
            console.log('音频URL可以访问，尝试下载');
            if (mounted) {
              downloadAudioIfNeeded();
            }
          }
        } catch (error) {
          console.error('测试音频URL失败:', error);
          if (mounted) {
            setDemoMode(true);
            setError('无法访问音频文件');
          }
        }
      }
    };
    
    checkAudioAccess();
    
    return () => {
      mounted = false;
      
      // 清理临时文件
      if (localAudioUri && localAudioUri.startsWith(FileSystem.cacheDirectory)) {
        FileSystem.deleteAsync(localAudioUri, { idempotent: true }).catch(() => {});
      }
      
      // 卸载声音
      if (sound) {
        sound.unloadAsync();
      }
      
      // 清理演示模式计时器
      if (demoTimerRef.current) {
        clearInterval(demoTimerRef.current);
        demoTimerRef.current = null;
      }
    };
  }, [audioUrl]);
  
  // 卸载之前的声音对象
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  /**
   * 下载音频文件到本地缓存
   */
  const downloadAudioIfNeeded = async () => {
    if (!audioUrl) return;
    
    try {
      // 为远程URL创建本地缓存文件
      const fileName = `audio-${Date.now()}.m4a`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      console.log('下载音频文件:', audioUrl);
      
      // 下载文件
      const downloadResult = await FileSystem.downloadAsync(
        audioUrl,
        fileUri
      );
      
      console.log('音频下载结果:', downloadResult);
      
      if (downloadResult.status === 200) {
        setLocalAudioUri(fileUri);
        setError(null);
      } else {
        console.log('下载音频失败，状态码:', downloadResult.status);
        setError(`下载音频失败 (${downloadResult.status})`);
      }
    } catch (err) {
      console.error('下载音频文件失败:', err);
      setError('下载音频失败');
    }
  };
  
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
   * 演示模式 - 模拟音频播放
   */
  const startDemoPlayback = () => {
    // 确保没有正在运行的计时器
    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
    }
    
    // 振动反馈
    Vibration.vibrate(50);
    
    // 重置位置
    setPlaybackPosition(0);
    setIsPlaying(true);
    onPlayStateChange(true);
    
    const totalDuration = duration * 1000; // 转换为毫秒
    const updateInterval = 100; // 更新频率(毫秒)
    let currentPosition = 0;
    
    // 创建计时器来模拟播放进度
    demoTimerRef.current = setInterval(() => {
      if (!isMounted.current) {
        clearInterval(demoTimerRef.current);
        return;
      }
      
      currentPosition += updateInterval;
      setPlaybackPosition(currentPosition);
      
      // 完成播放
      if (currentPosition >= totalDuration) {
        clearInterval(demoTimerRef.current);
        demoTimerRef.current = null;
        setIsPlaying(false);
        onPlayStateChange(false);
        setPlaybackPosition(0);
        
        // 完成时的振动反馈
        Vibration.vibrate(100);
      }
    }, updateInterval);
  };
  
  /**
   * 停止演示模式播放
   */
  const stopDemoPlayback = () => {
    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    
    setIsPlaying(false);
    onPlayStateChange(false);
    setPlaybackPosition(0);
    
    // 停止时的振动反馈
    Vibration.vibrate(50);
  };
  
  /**
   * 播放或暂停音频
   */
  const togglePlayback = async () => {
    // 如果是演示模式
    if (demoMode) {
      if (isPlaying) {
        stopDemoPlayback();
      } else {
        startDemoPlayback();
      }
      return;
    }
    
    // 如果已经尝试了3次，切换到演示模式
    if (failCount >= 3) {
      setDemoMode(true);
      Alert.alert(
        '切换到演示模式',
        '由于无法播放真实音频，已切换到演示模式。',
        [{ text: '确定' }]
      );
      startDemoPlayback();
      return;
    }
    
    // 如果当前有错误，尝试重新加载
    if (error) {
      setError(null);
      // 如果是在线URL，尝试重新下载
      if (audioUrl && !audioUrl.startsWith('file://')) {
        await downloadAudioIfNeeded();
      }
    }
    
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
        
        // 选择最佳的URI来源
        const bestAudioUri = localAudioUri || audioUrl;
        console.log('使用音频源:', bestAudioUri);
        
        try {
          // 加载音频
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: bestAudioUri },
            { shouldPlay: true },
            onPlaybackStatusUpdate
          );
          
          setSound(newSound);
          setIsPlaying(true);
          setIsLoading(false);
          onPlayStateChange(true);
        } catch (loadError) {
          console.error('播放音频失败:', loadError);
          
          // 如果使用本地缓存失败，尝试直接使用原始URL
          if (localAudioUri && bestAudioUri !== audioUrl) {
            console.log('本地缓存播放失败，尝试直接使用原始URL');
            
            const { sound: fallbackSound } = await Audio.Sound.createAsync(
              { uri: audioUrl },
              { shouldPlay: true },
              onPlaybackStatusUpdate
            );
            
            setSound(fallbackSound);
            setIsPlaying(true);
            setIsLoading(false);
            onPlayStateChange(true);
          } else {
            throw loadError; // 重新抛出错误以便被外部catch块捕获
          }
        }
      }
    } catch (error) {
      console.error('播放音频失败:', error);
      setError(`无法播放语音: ${error.message}`);
      setIsLoading(false);
      onPlayStateChange(false);
      setFailCount(prev => prev + 1);
      
      // 显示用户友好的错误提示
      if (failCount >= 2) {
        Alert.alert(
          '播放问题',
          '无法播放该语音消息。是否切换到演示模式？',
          [
            { 
              text: '是', 
              onPress: () => {
                setDemoMode(true);
                startDemoPlayback();
              }
            },
            { text: '否' }
          ]
        );
      } else {
        Alert.alert(
          '播放问题',
          '无法播放该语音消息。请检查网络连接或稍后再试。',
          [{ text: '知道了' }]
        );
      }
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

  // 设置图标
  let iconName = isPlaying ? "pause" : "play";
  if (error) iconName = "warning";
  if (demoMode) iconName = isPlaying ? "pause" : "volumes";
  
  return (
    <TouchableOpacity 
      style={containerStyle}
      onPress={togglePlayback}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {/* 播放/暂停按钮 */}
      <View style={styles.iconContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Icon 
            name={iconName} 
            size={22} 
            color={error && !demoMode ? (isCurrentUser ? theme.colors.white : theme.colors.error) : textColor} 
          />
        )}
      </View>
      
      {/* 进度条和时长 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarContainer}>
          <View style={progressBarStyle} />
        </View>
        <View style={styles.durationRow}>
          <Text style={[styles.durationText, { color: textColor }]}>
            {formatAudioDuration(duration * 1000)}
          </Text>
          
          {demoMode && (
            <Text style={[styles.demoText, { color: textColor }]}>
              (演示模式)
            </Text>
          )}
        </View>
      </View>
      
      {/* 错误消息 - 仅在调试模式下显示详细错误 */}
      {error && __DEV__ && (
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
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
  },
  demoText: {
    fontSize: 10,
    opacity: 0.8,
    fontStyle: 'italic',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 10,
    marginTop: 4,
  },
});

export default AudioMessage; 