import { decode } from "base64-arraybuffer";
import { supabase } from "../lib/supabase";

export const uploadFile = async (fileName, base64Data)=>{
    try{
        let imageData = await decode(base64Data);
        const { data, error } = await supabase
        .storage
        .from('uploads')
        .upload(fileName, imageData, {
            cacheControl: '3600',
            upsert: true,
            contentType: "image/*",
        });
        if(error){
            return {success: false, msg: 'Could not upload the file'};
        }
            
        return {success: true, data: data.path};
    }catch(error){
        console.log('got error: ', error);
        return {success: false, msg: error.message};
    }
}

export const getProfeilImagePath = ()=>{
    return '/profiles/'+(new Date()).getTime()+'.png';
}

export const getUserImageSrc = (imagePath)=>{
    if(imagePath){
        return {uri: 'https://wzrothbtakwqbnhhlvkz.supabase.co/storage/v1/object/public/uploads/'+imagePath};
    }else{
        return require('../assets/images/defaultUser.png');
    }
}