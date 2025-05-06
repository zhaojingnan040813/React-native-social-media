import { Audio } from 'expo-av';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';

// 使用一个全局变量来跟踪当前的录音实例
let activeRecording = null;

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
    // 先检查是否有活跃的录音实例，如果有则先释放
    if (activeRecording) {
      try {
        await activeRecording.stopAndUnloadAsync();
      } catch (error) {
        console.log('释放之前的录音实例失败，可能已经被释放', error);
      }
      activeRecording = null;
    }

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
    
    // 保存为活跃的录音实例
    activeRecording = recording;

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
    
    // 检查录音状态，只有在未停止状态才停止
    const status = await recording.getStatusAsync();
    if (status.isRecording) {
      // 停止录音
      await recording.stopAndUnloadAsync();
    } else {
      console.log('录音已经停止，无需再次停止');
    }
    
    // 清除活跃录音引用
    if (activeRecording === recording) {
      activeRecording = null;
    }
    
    // 重置音频模式
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    // 获取录音URI
    const uri = recording.getURI();
    
    // 如果没有URI，表示录音失败
    if (!uri) {
      return {
        uri: null,
        durationMillis: 0,
        success: false,
        error: '获取录音URI失败'
      };
    }
    
    // 获取录音信息
    try {
      const { sound, status } = await recording.createNewLoadedSoundAsync();
      return { 
        uri, 
        durationMillis: status.durationMillis || 0, 
        success: true, 
        error: null 
      };
    } catch (error) {
      console.log('获取录音时长失败，使用默认值', error);
      // 如果无法获取时长，但有URI，仍然返回成功
      return {
        uri,
        durationMillis: 5000, // 默认5秒
        success: true,
        error: null
      };
    }
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

    console.log('开始上传录音文件...', uri);
    
    // 存储桶名称 - 使用public存储桶，该存储桶通常已配置为允许公开访问
    const BUCKET_NAME = 'public';
    
    // 生成文件路径 - 使用时间戳确保唯一性
    const filePath = `audio_messages/${Date.now()}.m4a`;
    console.log('目标文件路径:', filePath);
    
    // 检查文件是否存在
    const fileInfo = await FileSystem.getInfoAsync(uri);
    console.log('文件信息:', fileInfo);
    
    if (!fileInfo.exists) {
      return {
        path: null,
        url: null,
        success: false,
        error: '录音文件不存在'
      };
    }

    try {
      // 读取文件内容为Base64
      console.log('开始读取文件内容...');
      const fileBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('文件内容已读取为Base64, 长度:', fileBase64.length);
      
      // 解码Base64为ArrayBuffer
      const fileData = decode(fileBase64);
      console.log('Base64已解码为ArrayBuffer');
      
      // 上传文件到public存储桶
      console.log(`尝试上传文件到 ${BUCKET_NAME} 存储桶...`);
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileData, {
          contentType: 'audio/m4a',
          cacheControl: '3600',
          upsert: true,
        });
      
      if (error) {
        console.error('上传录音失败:', error);
        // 尝试备用上传方法
        const backupResult = await uploadToBackupLocation(fileData, filePath);
        if (!backupResult.success) {
          return { 
            path: null, 
            url: null, 
            success: false, 
            error: error.message || '上传失败' 
          };
        }
        
        // 使用备用方法的结果
        return backupResult;
      }

      // 获取公共URL
      // 优先使用签名URL来避免RLS限制
      try {
        console.log('尝试获取签名URL...');
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7天有效期
        
        if (!signedUrlError && signedUrlData?.signedUrl) {
          console.log('获取签名URL成功:', signedUrlData.signedUrl);
          
          // 测试签名URL是否可访问
          try {
            const response = await fetch(signedUrlData.signedUrl, { method: 'HEAD' });
            if (response.ok) {
              console.log('签名URL可以访问');
              return {
                path: filePath,
                url: signedUrlData.signedUrl,
                success: true,
                error: null
              };
            } else {
              console.log('签名URL不可访问，尝试获取公共URL');
            }
          } catch (testError) {
            console.log('测试签名URL失败:', testError);
          }
        } else {
          console.log('获取签名URL失败:', signedUrlError);
        }
      } catch (signedUrlError) {
        console.error('创建签名URL时出错:', signedUrlError);
      }
      
      // 如果签名URL不可用，尝试公共URL
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
      
      const publicUrl = publicUrlData?.publicUrl;
      console.log('上传成功，公开URL:', publicUrl);
      
      return { 
        path: filePath,
        url: publicUrl,
        success: true, 
        error: null 
      };
    } catch (uploadError) {
      console.error('文件处理或上传失败:', uploadError);
      return {
        path: null,
        url: null,
        success: false,
        error: uploadError.message
      };
    }
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
 * 备用上传位置 (当主存储桶上传失败时使用)
 */
const uploadToBackupLocation = async (fileData, filePath) => {
  try {
    console.log('尝试使用备用存储桶上传...');
    
    // 尝试不同的存储桶
    const BACKUP_BUCKETS = ['public', 'uploads', 'audio', 'media'];
    
    for (const bucket of BACKUP_BUCKETS) {
      console.log(`尝试上传到 ${bucket} 存储桶...`);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileData, {
          contentType: 'audio/m4a',
          cacheControl: '3600',
          upsert: true,
        });
      
      if (!error) {
        console.log(`成功上传到 ${bucket} 存储桶`);
        
        // 尝试获取签名URL
        try {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, 60 * 60 * 24); // 1天有效期
          
          if (!signedUrlError && signedUrlData?.signedUrl) {
            return {
              path: filePath,
              url: signedUrlData.signedUrl,
              success: true,
              error: null
            };
          }
        } catch (e) {
          console.log('创建签名URL失败:', e);
        }
        
        // 如果签名URL不可用，尝试公共URL
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        
        return {
          path: filePath,
          url: publicUrlData?.publicUrl,
          success: true,
          error: null
        };
      }
    }
    
    // 所有存储桶都失败，返回本地URI作为临时解决方案
    console.log('所有存储桶都上传失败，以Base64编码形式内联存储');
    
    // 注意：这只是临时解决方案，Base64 URL仅适用于小文件
    return {
      path: null,
      // 创建本地数据URI，适用于较短的音频
      url: `data:audio/m4a;base64,${FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      })}`,
      success: true,
      error: null,
      isDataUrl: true // 标记为数据URL
    };
  } catch (error) {
    console.error('备用上传失败:', error);
    return { data: null, error, success: false };
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