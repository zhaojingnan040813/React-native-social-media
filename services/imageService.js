import { decode } from "base64-arraybuffer";
import { supabase } from "../lib/supabase";
import * as FileSystem from 'expo-file-system';
import { Share } from 'react-native';
import { supabaseUrl } from "../constants";
import { createClient } from '@supabase/supabase-js';
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync } from "expo-image-manipulator";

// 使用服务器角色密钥创建一个管理员级客户端实例（这会绕过RLS策略）
// 注意：在实际生产环境中，应该谨慎使用此方法，这里仅作为个人应用的简化方案
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2a2Nldm9venVtcHdwYm9qa2N4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTgwODczMiwiZXhwIjoyMDYxMzg0NzMyfQ.QWHyg1_Lr1reXnEa941idqMPYkfpU-fyU36c2DBPkm4';

// 创建一个使用服务角色密钥的客户端，用于绕过RLS策略的操作
const adminSupabase = createClient(supabaseUrl, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 上传文件 - 使用adminSupabase绕过RLS策略
export const uploadFile = async (folderName, fileUri, isImage=true)=>{
    try{
        let fileName = getFilePath(folderName, isImage);

        const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        let imageData = await decode(fileBase64);
        // 使用管理员客户端而不是普通客户端
        const { data, error } = await adminSupabase
        .storage
        .from('uploads')
        .upload(fileName, imageData, {
            cacheControl: '3600',
            upsert: true,
            contentType: isImage? "image/*": "video/*",
        });
        if(error){
            console.log('file upload error: ', error);
            return {success: false, msg: "Could not upload media"};
        }
            
        return {success: true, data: data.path};
    }catch(error){
        console.log('file upload error: ', error);
        return {success: false, msg: "Could not upload media"};
    }
}

// 获取文件路径
export const getFilePath = (folderName, isImage=true)=>{
    return `/${folderName}/${(new Date()).getTime()}${isImage? '.png': '.mp4'}`;
}

// 获取用户图片源
export const getUserImageSrc = (imagePath)=>{
    if(imagePath){
        return getSupabaseFileUrl(imagePath);
    }else{
        return require('../assets/images/defaultUser.png');
    }
}

// 获取 Supabase 文件 URL
export const getSupabaseFileUrl = filePath=>{
    if(filePath)
        return {uri: `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}`};
    return null;
}

// 下载文件
export const downloadFile = async (url)=>{
    try {
        // Start the download
        const { uri } = await FileSystem.downloadAsync(url, getLocalFilePath(url));
        return uri;
    } catch (e) {
        return null;
    }
}

// 获取本地文件路径 
const getLocalFilePath = filePath=>{
    let fileName = filePath.split('/').pop();
    return `${FileSystem.documentDirectory}${fileName}`;
}

/**
 * 选择图片并上传到存储桶
 * @param {string} folderName - 图片存储的文件夹名称
 * @param {number} quality - 图片质量，范围0-1
 * @param {number} maxWidth - 最大宽度 (像素)
 * @param {number} maxHeight - 最大高度 (像素)
 * @param {boolean} allowsMultipleSelection - 是否允许多选
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const pickImage = async (folderName, quality = 0.7, maxWidth = 1080, maxHeight = 1080, allowsMultipleSelection = false) => {
  try {
    // 请求媒体库权限
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    // 用户拒绝权限
    if (status !== "granted") {
      return { success: false, data: null, error: "需要相册访问权限才能选择图片" };
    }
    
    // 打开图片选择器
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      allowsMultipleSelection,
    });
    
    // 用户取消选择
    if (result.canceled) {
      return { success: false, data: null, error: "用户取消了选择" };
    }
    
    // 处理选择的资源
    const assets = result.assets || [];
    if (assets.length === 0) {
      return { success: false, data: null, error: "没有选择任何图片" };
    }
    
    // 最终上传结果
    const uploadResults = [];
    
    // 处理每个选择的图片
    for (const asset of assets) {
      try {
        // 压缩图片
        const processedImage = await manipulateAsync(
          asset.uri,
          [{ resize: { width: maxWidth, height: maxHeight } }],
          { compress: quality, format: 'jpeg' }
        );
        
        // 准备上传数据
        const filePath = getFilePath(folderName);
        
        // 处理图片数据
        const imageData = await convertUriToBase64(processedImage.uri);
        
        // 上传到 Supabase 存储
        const { data, error } = await supabase.storage
          .from(folderName)
          .upload(filePath, imageData, {
            contentType: "image/jpeg",
            cacheControl: "3600",
            upsert: true,
          });
        
        if (error) {
          // console.error("上传图片错误:", error.message);
          uploadResults.push({
            success: false,
            error: error.message,
            uri: asset.uri,
          });
        } else {
          const imageUrl = getImageUrl(folderName, filePath);
          uploadResults.push({
            success: true,
            data: {
              path: data.path,
              url: imageUrl,
              width: processedImage.width,
              height: processedImage.height,
            },
            uri: asset.uri,
          });
        }
      } catch (err) {
        // console.error("处理图片错误:", err.message);
        uploadResults.push({
          success: false,
          error: err.message,
          uri: asset.uri,
        });
      }
    }
    
    // 如果是单张图片，返回第一个结果
    if (!allowsMultipleSelection) {
      const firstResult = uploadResults[0];
      return {
        success: firstResult.success,
        data: firstResult.data,
        error: firstResult.error,
      };
    }
    
    // 返回多张图片的结果
    return {
      success: true,
      data: uploadResults,
      error: null,
    };
  } catch (error) {
    // console.error("选择图片错误:", error.message);
    return { success: false, data: null, error: error.message };
  }
};

// 获取图片URL
export const getImageUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// 将文件URI转换为Base64
const convertUriToBase64 = async (uri) => {
  // 针对iOS和Android的不同URI格式处理
  if (Platform.OS === 'ios') {
    // 如果是iOS，需要加载文件数据
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  } else {
    // Android可以直接从URI获取文件
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  }
};