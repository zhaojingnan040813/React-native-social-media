import { supabase } from "../lib/supabase";

// 根据用户 ID 查询用户信息
export const getUserData = async (userId)=>{
    try{
        const { data, error } = await supabase
        .from('users')
        .select()
        .eq('id', userId)
        .single();

        if(error){
            return {success: false, msg: error?.message};
        }
        return {success: true, data};
    }catch(error){
        console.log('got error: ', error);
        return {success: false, msg: error.message};
    }
}

// 更新用户信息
export const updateUser = async (userId, data)=>{
    try{
        const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', userId);

        if(error){
            return {success: false, msg: error?.message};
        }
        return {success: true};
    }catch(error){
        console.log('got error: ', error);
        return {success: false, msg: error.message};
    }
}

// 根据学号查询用户
export const getUserByStudentId = async (studentId) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select()
            .eq('StudentIdNumber', studentId)
            .single();

        if (error) {
            return { success: false, msg: error?.message };
        }
        return { success: true, data };
    } catch (error) {
        console.log('got error: ', error);
        return { success: false, msg: error.message };
    }
}

/* 
封装与 users 表相关的操作


*/