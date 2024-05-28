import { supabase } from "../lib/supabase";
import { uploadFile } from "./imageService";

export const createPost = async (post)=>{
    try{

        if(post.file){
            let isImage = post?.file?.type=='image';
            let folderName = isImage? 'postImages': 'postVideos';
            let fileResult = await uploadFile(folderName, post?.file?.uri, isImage);
            if(fileResult.success) post.file = fileResult.data;
            else {
                return fileResult;
            }
        }
        
        const { data, error } = await supabase
        .from('posts')
        .insert(post)
        .select()
        .single();

        

        if(error){
            console.log('createPost error: ', error);
            return {success: false, msg: "Could not create your post"};
        }
        return {success: true, data: data};

    }catch(error){
        console.log('createPost error: ', error);
        return {success: false, msg: "Could not create your post"};
    }
}


export const fetchPosts = async ()=>{
    try{
        const { data, error } = await supabase
        .from('posts')
        // .select(`
        //     id,
        //     body,
        //     file, 
        //     users ( id, name, image )
        // `);
        .select(`
            *,
            user: users ( id, name, image )
        `)
        .order('created_at', { ascending: false })

        if(error){
            console.log('fetchPosts error: ', error);
            return {success: false, msg: "Could not fetch the posts"};
        }
        return {success: true, data: data};

    }catch(error){
        console.log('fetchPosts error: ', error);
        return {success: false, msg: "Could not fetch the posts"};
    }
}