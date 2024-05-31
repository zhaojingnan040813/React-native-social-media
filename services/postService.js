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


export const fetchPosts = async (limit=10)=>{
    try{

        // .select(`
        //     id,
        //     body,
        //     file, 
        //     users ( id, name, image )
        // `);

        // add postLikes later when wroking on post like

        // .limit(limit); // later when implementing pagination
        const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            user: users ( id, name, image ),
            postLikes (*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

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

export const createPostLike = async (postLike)=>{
    try{
        
        const { data, error } = await supabase
        .from('postLikes')
        .insert(postLike)
        .select()
        .single();

        if(error){
            console.log('postLike error: ', error);
            return {success: false, msg: "Could not like this post"};
        }
        return {success: true, data: data};

    }catch(error){
        console.log('postLike error: ', error);
        return {success: false, msg: "Could not like this post"};
    }
}
export const removePostLike = async (postId, userId)=>{
    try{
        
        const { error } = await supabase
        .from('postLikes')
        .delete()
        .eq('userId', userId)
        .eq('postId', postId)

        if(error){
            console.log('postLike error: ', error);
            return {success: false, msg: "Could not remove post like"};
        }
        return {success: true, data: {postId, userId}};

    }catch(error){
        console.log('postLike error: ', error);
        return {success: false, msg: "Could not remove post like"};
    }
}
