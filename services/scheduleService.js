import { supabase } from '../lib/supabase';

/**
 * 获取用户课表中的所有课程
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} - 课表数据
 */
export const getUserCourses = async (userId) => {
  try {
    // 获取用户所有课程
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', userId);

    if (coursesError) throw coursesError;

    // 获取用户所有课程安排
    const { data: courseItems, error: itemsError } = await supabase
      .from('course_items')
      .select(`
        *, 
        courses(*)
      `)
      .eq('user_id', userId);

    if (itemsError) throw itemsError;

    return {
      courses,
      courseItems,
    };
  } catch (error) {
    console.error('获取课表失败:', error.message);
    throw error;
  }
};

/**
 * 添加新课程
 * @param {Object} courseData - 课程数据
 * @returns {Promise<Object>} - 新增的课程
 */
export const addCourse = async (courseData) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('添加课程失败:', error.message);
    throw error;
  }
};

/**
 * 添加课程安排
 * @param {Object} courseItemData - 课程安排数据
 * @returns {Promise<Object>} - 新增的课程安排
 */
export const addCourseItem = async (courseItemData) => {
  try {
    const { data, error } = await supabase
      .from('course_items')
      .insert([courseItemData])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('添加课程安排失败:', error.message);
    throw error;
  }
};

/**
 * 更新课程信息
 * @param {string} courseId - 课程ID
 * @param {Object} courseData - 课程更新数据
 * @returns {Promise<Object>} - 更新后的课程
 */
export const updateCourse = async (courseId, courseData) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('course_id', courseId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('更新课程失败:', error.message);
    throw error;
  }
};

/**
 * 更新课程安排
 * @param {string} itemId - 课程安排ID
 * @param {Object} itemData - 课程安排更新数据
 * @returns {Promise<Object>} - 更新后的课程安排
 */
export const updateCourseItem = async (itemId, itemData) => {
  try {
    const { data, error } = await supabase
      .from('course_items')
      .update(itemData)
      .eq('item_id', itemId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('更新课程安排失败:', error.message);
    throw error;
  }
};

/**
 * 删除课程
 * @param {string} courseId - 课程ID
 * @returns {Promise<void>}
 */
export const deleteCourse = async (courseId) => {
  try {
    // 先删除相关的课程安排
    const { error: itemsError } = await supabase
      .from('course_items')
      .delete()
      .eq('course_id', courseId);

    if (itemsError) throw itemsError;

    // 再删除课程
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('course_id', courseId);

    if (error) throw error;
  } catch (error) {
    console.error('删除课程失败:', error.message);
    throw error;
  }
};

/**
 * 删除课程安排
 * @param {string} itemId - 课程安排ID
 * @returns {Promise<void>}
 */
export const deleteCourseItem = async (itemId) => {
  try {
    const { error } = await supabase
      .from('course_items')
      .delete()
      .eq('item_id', itemId);

    if (error) throw error;
  } catch (error) {
    console.error('删除课程安排失败:', error.message);
    throw error;
  }
};

/**
 * 获取时间段定义
 * @returns {Promise<Array>} - 时间段列表
 */
export const getTimeSlots = async () => {
  try {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('获取时间段失败:', error.message);
    throw error;
  }
};

/**
 * 根据周几和时间段获取课程
 * @param {string} userId - 用户ID
 * @param {number} dayOfWeek - 周几 (1-7)
 * @param {number} slotId - 时间段ID
 * @returns {Promise<Array>} - 符合条件的课程
 */
export const getCoursesByDayAndSlot = async (userId, dayOfWeek, slotId) => {
  try {
    const { data, error } = await supabase
      .from('course_items')
      .select(`
        *,
        courses(*)
      `)
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek)
      .lte('start_slot', slotId)
      .gte('end_slot', slotId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('获取特定时间课程失败:', error.message);
    throw error;
  }
}; 