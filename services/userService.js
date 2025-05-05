import { supabase } from "../lib/supabase";
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl } from "../constants";

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

// 根据用户 ID 查询用户信息（现在包括新增的个人信息字段）
export const getUserData = async (userId)=>{
    try{
        const { data, error } = await supabase
        .from('users')
        .select(`
            id,
            created_at,
            name,
            image,
            bio,
            StudentIdNumber,
            address,
            phoneNumber,
            password,
            gender,
            birthday,
            college,
            major,
            grade,
            email
        `)
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

// 更新用户信息 - 使用管理员权限
export const updateUser = async (userId, data)=>{
    try{
        // 使用管理员客户端绕过RLS策略
        const { error } = await adminSupabase
        .from('users')
        .update(data)
        .eq('id', userId);

        if(error){
            console.log('updateUser error:', error);
            return {success: false, msg: error?.message};
        }
        return {success: true};
    }catch(error){
        console.log('updateUser error:', error);
        return {success: false, msg: error.message};
    }
}

// 根据学号查询用户
export const getUserByStudentId = async (studentId) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select()
            .eq('"StudentIdNumber"', studentId)
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

// 获取所有用户列表（排除当前用户）
export const getAllUsers = async (currentUserId) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
                id,
                name,
                image,
                StudentIdNumber,
                college,
                major
            `)
            .neq('id', currentUserId);

        if (error) {
            console.log('getAllUsers error:', error);
            return { success: false, msg: error?.message };
        }
        return { success: true, data };
    } catch (error) {
        console.log('getAllUsers error:', error);
        return { success: false, msg: error.message };
    }
}

/* 
封装与 users 表相关的操作


*/