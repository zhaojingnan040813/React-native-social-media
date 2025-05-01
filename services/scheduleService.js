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

    // 获取用户所有课程安排 - 不使用嵌套查询
    const { data: courseItems, error: itemsError } = await supabase
      .from('course_items')
      .select('*')
      .eq('user_id', userId);

    if (itemsError) throw itemsError;

    // 手动关联课程信息到课程安排
    const enhancedCourseItems = courseItems.map(item => {
      const relatedCourse = courses.find(course => course.course_id === item.course_id) || {};
      return {
        ...item,
        courses: relatedCourse // 保持与原代码一致的结构
      };
    });

    return {
      courses,
      courseItems: enhancedCourseItems,
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
      .order('slot_id', { ascending: true });

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
    // 获取符合条件的课程安排
    const { data: courseItems, error: itemsError } = await supabase
      .from('course_items')
      .select('*')
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek)
      .lte('start_slot', slotId)
      .gte('end_slot', slotId);

    if (itemsError) throw itemsError;

    if (!courseItems || courseItems.length === 0) {
      return [];
    }

    // 获取相关的课程信息
    const courseIds = [...new Set(courseItems.map(item => item.course_id))];
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .in('course_id', courseIds);

    if (coursesError) throw coursesError;

    // 手动关联课程信息
    const enhancedCourseItems = courseItems.map(item => {
      const relatedCourse = courses.find(course => course.course_id === item.course_id) || {};
      return {
        ...item,
        courses: relatedCourse
      };
    });

    return enhancedCourseItems;
  } catch (error) {
    console.error('获取特定时间课程失败:', error.message);
    throw error;
  }
};

/**
 * 按月份获取用户课程数据
 * @param {string} userId - 用户ID
 * @param {string} semester - 学期（春季/秋季）
 * @param {Array<number>} weeks - 周次数组
 * @param {number} year - 年份
 * @returns {Promise<Object>} - 课表数据
 */
export const getUserCoursesByMonth = async (userId, semester, weeks, year) => {
  try {
    // 获取所有课程
    const { data: allCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', userId);

    if (coursesError) throw coursesError;

    // 如果是暑假或寒假等没有课程的月份
    if (!weeks || weeks.length === 0) {
      return {
        courses: allCourses,
        courseItems: []
      };
    }

    // 获取所有课程安排
    const { data: allItems, error: allItemsError } = await supabase
      .from('course_items')
      .select('*')
      .eq('user_id', userId);

    if (allItemsError) throw allItemsError;

    // 手动筛选符合条件的课程
    const filteredItems = allItems.filter(item => {
      // 检查周次范围是否与指定周次有交集
      const itemStartWeek = item.week_start || 1;
      const itemEndWeek = item.week_end || 20;
      
      // 判断是否有交集
      return weeks.some(week => 
        week >= itemStartWeek && week <= itemEndWeek
      );
    });

    // 手动关联课程信息
    const enhancedItems = filteredItems.map(item => {
      const relatedCourse = allCourses.find(course => course.course_id === item.course_id) || {};
      return {
        ...item,
        courses: relatedCourse
      };
    });

    return {
      courses: allCourses,
      courseItems: enhancedItems
    };
  } catch (error) {
    console.error('按月份获取课表失败:', error.message);
    throw error;
  }
}; 