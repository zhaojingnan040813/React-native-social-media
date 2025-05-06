import { Audio } from 'expo-av';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';

/**
 * 请求麦克风权限
 * @returns {Promise<boolean>} 是否获得权限
 */
export const requestAudioPermission = async () => {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('请求录音权限失败:', error);
    return false;
  }
};

/**
 * 开始录音
 * @returns {Promise<{recording: Audio.Recording, success: boolean, error: string|null}>}
 */
export const startRecording = async () => {
  try {
    // 请求录音权限
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) {
      return { 
        recording: null, 
        success: false, 
        error: '需要麦克风权限才能录音' 
      };
    }

    // 设置音频模式
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // 创建录音实例
    console.log('开始录音...');
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    return { 
      recording, 
      success: true, 
      error: null 
    };
  } catch (error) {
    console.error('开始录音失败:', error);
    return { 
      recording: null, 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * 停止录音并获取录音结果
 * @param {Audio.Recording} recording - 录音实例
 * @returns {Promise<{uri: string, durationMillis: number, success: boolean, error: string|null}>}
 */
export const stopRecording = async (recording) => {
  try {
    if (!recording) {
      return { 
        uri: null, 
        durationMillis: 0, 
        success: false, 
        error: '没有录音实例' 
      };
    }

    console.log('停止录音...');
    
    // 停止录音
    await recording.stopAndUnloadAsync();
    
    // 重置音频模式
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    // 获取录音URI
    const uri = recording.getURI();
    
    // 获取录音信息
    const { sound, status } = await recording.createNewLoadedSoundAsync();
    
    return { 
      uri, 
      durationMillis: status.durationMillis || 0, 
      success: true, 
      error: null 
    };
  } catch (error) {
    console.error('停止录音失败:', error);
    return { 
      uri: null, 
      durationMillis: 0, 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * 上传录音文件到 Supabase Storage
 * @param {string} uri - 录音文件的本地URI
 * @returns {Promise<{path: string, url: string, success: boolean, error: string|null}>}
 */
export const uploadAudioFile = async (uri) => {
  try {
    if (!uri) {
      return { 
        path: null, 
        url: null, 
        success: false, 
        error: '没有录音文件URI' 
      };
    }

    console.log('上传录音文件...');
    
    // 生成文件路径 - 使用时间戳确保唯一性
    const filePath = `audio_messages/${Date.now()}.m4a`;
    
    // 读取文件内容为Base64
    const fileBase64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // 解码Base64为ArrayBuffer
    const fileData = decode(fileBase64);
    
    // 上传文件到Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filePath, fileData, {
        contentType: 'audio/m4a',
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      console.error('上传录音失败:', error);
      return { 
        path: null, 
        url: null, 
        success: false, 
        error: error.message 
      };
    }

    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);
    
    return { 
      path: data.path,
      url: urlData.publicUrl,
      success: true, 
      error: null 
    };
  } catch (error) {
    console.error('上传录音文件失败:', error);
    return { 
      path: null, 
      url: null, 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * 播放音频文件
 * @param {string} uri - 音频文件URI或URL
 * @param {Function} onPlaybackStatusUpdate - 播放状态更新回调
 * @returns {Promise<{sound: Audio.Sound, success: boolean, error: string|null}>}
 */
export const playAudio = async (uri, onPlaybackStatusUpdate = null) => {
  try {
    if (!uri) {
      return { 
        sound: null, 
        success: false, 
        error: '无效的音频文件URI' 
      };
    }

    console.log('加载音频文件...', uri);
    
    // 加载音频
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true }, // 自动播放
      onPlaybackStatusUpdate // 状态更新回调
    );
    
    return { 
      sound, 
      success: true, 
      error: null 
    };
  } catch (error) {
    console.error('播放音频失败:', error);
    return { 
      sound: null, 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * 格式化音频时长为可读格式
 * @param {number} durationMillis - 时长(毫秒)
 * @returns {string} 格式化后的时长 (mm:ss)
 */
export const formatAudioDuration = (durationMillis) => {
  if (!durationMillis) return '00:00';
  
  const totalSeconds = Math.floor(durationMillis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}; 