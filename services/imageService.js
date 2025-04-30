import { decode } from "base64-arraybuffer";
import { supabase } from "../lib/supabase";
import * as FileSystem from 'expo-file-system';
import { Share } from 'react-native';
import { supabaseUrl } from "../constants";





// 上传文件
export const uploadFile = async (folderName, fileUri, isImage=true)=>{
    try{
        let fileName = getFilePath(folderName, isImage);

        const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        let imageData = await decode(fileBase64);
        const { data, error } = await supabase
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