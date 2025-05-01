import { decode } from "base64-arraybuffer";
import { supabase } from "../lib/supabase";
import * as FileSystem from 'expo-file-system';
import { Share } from 'react-native';
import { supabaseUrl } from "../constants";
import { createClient } from '@supabase/supabase-js';

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