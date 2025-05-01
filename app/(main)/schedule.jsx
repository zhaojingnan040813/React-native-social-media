import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Alert, TextInput } from 'react-native'
import React, { useState, useEffect } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { theme } from '../../constants/theme'
import { hp, wp } from '../../helpers/common'
import { AntDesign, MaterialIcons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'

import * as scheduleService from '../../services/scheduleService'
import { useFocusEffect } from '@react-navigation/native'

// 周几标题
const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

// 月份数据
const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 月份对应的周次映射（每个月4周）
const MONTH_TO_WEEKS = {
  0: { semester: '春季', weeks: [1, 2, 3, 4] },      // 1月
  1: { semester: '春季', weeks: [5, 6, 7, 8] },      // 2月
  2: { semester: '春季', weeks: [9, 10, 11, 12] },   // 3月
  3: { semester: '春季', weeks: [13, 14, 15, 16] },  // 4月
  4: { semester: '春季', weeks: [17, 18, 19, 20] },  // 5月
  5: { semester: '春季', weeks: [21, 22, 23, 24] },  // 6月
  6: { semester: '秋季', weeks: [1, 2, 3, 4] },      // 7月
  7: { semester: '秋季', weeks: [5, 6, 7, 8] },      // 8月
  8: { semester: '秋季', weeks: [9, 10, 11, 12] },   // 9月
  9: { semester: '秋季', weeks: [13, 14, 15, 16] },  // 10月
  10: { semester: '秋季', weeks: [17, 18, 19, 20] }, // 11月
  11: { semester: '秋季', weeks: [21, 22, 23, 24] }  // 12月
};

// 时间段定义
const DEFAULT_TIME_SLOTS = [
  { slot_id: 1, slot_name: '1-2节', start_time: '08:00', end_time: '09:40' },
  { slot_id: 2, slot_name: '3-4节', start_time: '10:00', end_time: '11:30' },
  { slot_id: 3, slot_name: '5-6节', start_time: '13:30', end_time: '15:10' },
  { slot_id: 4, slot_name: '7-8节', start_time: '15:20', end_time: '17:00' },
  { slot_id: 5, slot_name: '9-10节', start_time: '17:10', end_time: '18:50' }, 
];

// 颜色映射
const COLOR_MAP = {
  blue: 'rgba(106, 191, 240, 0.8)',
  green: 'rgba(72, 207, 173, 0.8)',
  purple: 'rgba(155, 89, 182, 0.8)',
  yellow: 'rgba(241, 196, 15, 0.8)',
  orange: 'rgba(230, 126, 34, 0.8)'
};

// 计算当前日期应该显示的周索引
const getCurrentWeekIndex = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  
  // 简单算法：将月份分为4段，根据当前日期判断在第几周
  // 例如：1-7日是第一周，8-14日是第二周，15-21是第三周，22及以后是第四周
  const weekInMonth = Math.min(Math.floor((currentDate - 1) / 7), 3);
  return weekInMonth;
};

const Schedule = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState(DEFAULT_TIME_SLOTS);
  const [courses, setCourses] = useState([]);
  const [courseItems, setCourseItems] = useState([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth()); // 默认当前月份
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // 当前年份
  const [currentWeekIndex, setCurrentWeekIndex] = useState(getCurrentWeekIndex()); // 根据当前日期计算周索引
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [courseName, setCourseName] = useState('');
  const [courseLocation, setCourseLocation] = useState('');
  const [courseColor, setCourseColor] = useState('blue');
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false); // 添加保存状态

  // 获取当前周次
  const getCurrentWeek = () => {
    return MONTH_TO_WEEKS[currentMonthIndex].weeks[currentWeekIndex];
  };

  // 获取课表数据
  const fetchScheduleData = async (monthIndex = currentMonthIndex, year = currentYear, weekIndex = currentWeekIndex) => {
    try {
      setLoading(true);
      
      // 获取时间段定义
      const slots = await scheduleService.getTimeSlots()
        .catch(() => DEFAULT_TIME_SLOTS);
      setTimeSlots(slots);
      
      // 获取用户课程数据
      if (user?.id) {
        // 获取月份对应的周次信息
        const monthInfo = MONTH_TO_WEEKS[monthIndex];
        const currentWeek = monthInfo.weeks[weekIndex];
        
        // 获取课程数据，只传入当前周次
        const { courses, courseItems } = await scheduleService.getUserCoursesByWeek(
          user.id,
          monthInfo.semester,
          currentWeek,
          year
        );
        
        setCourses(courses || []);
        setCourseItems(courseItems || []);
      }
    } catch (error) {
      console.error('加载课表失败:', error);
      Alert.alert('提示', '加载课表数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 页面聚焦时重新加载数据
  useFocusEffect(
    React.useCallback(() => {
      // 首次进入时，确保加载当前日期对应的月份和周次
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      const weekIndex = getCurrentWeekIndex();
      
      // 预先设置状态，确保UI显示正确
      setCurrentMonthIndex(month);
      setCurrentYear(year);
      setCurrentWeekIndex(weekIndex);
      
      // 加载课表数据
      fetchScheduleData(month, year, weekIndex);
      
      return () => {};
    }, [user?.id]) // 只在用户ID变化或组件挂载时执行
  );

  // 处理周次切换
  const handlePrevWeek = () => {
    if (currentWeekIndex > 0) {
      // 同月上一周
      const newWeekIndex = currentWeekIndex - 1;
      setCurrentWeekIndex(newWeekIndex);
      fetchScheduleData(currentMonthIndex, currentYear, newWeekIndex);
    } else {
      // 上个月的最后一周
      const prevMonthIndex = currentMonthIndex > 0 ? currentMonthIndex - 1 : 11;
      const prevYear = currentMonthIndex > 0 ? currentYear : currentYear - 1;
      
      // 设置为上个月的最后一周
      const lastWeekIndex = 3; // 每个月固定4周，索引0-3
      setCurrentMonthIndex(prevMonthIndex);
      setCurrentYear(prevYear);
      setCurrentWeekIndex(lastWeekIndex);
      fetchScheduleData(prevMonthIndex, prevYear, lastWeekIndex);
    }
  };

  const handleNextWeek = () => {
    if (currentWeekIndex < 3) { // 每个月固定4周，索引0-3
      // 同月下一周
      const newWeekIndex = currentWeekIndex + 1;
      setCurrentWeekIndex(newWeekIndex);
      fetchScheduleData(currentMonthIndex, currentYear, newWeekIndex);
    } else {
      // 下个月的第一周
      const nextMonthIndex = currentMonthIndex < 11 ? currentMonthIndex + 1 : 0;
      const nextYear = currentMonthIndex < 11 ? currentYear : currentYear + 1;
      
      // 设置为下个月的第一周
      setCurrentMonthIndex(nextMonthIndex);
      setCurrentYear(nextYear);
      setCurrentWeekIndex(0);
      fetchScheduleData(nextMonthIndex, nextYear, 0);
    }
  };

  // 查找指定时间段和星期的课程
  const getCourseByDayAndSlot = (day, slotId) => {
    // day是从1开始的（周一）
    return courseItems.find(item => 
      item.day_of_week === day && 
      item.start_slot <= slotId &&
      item.end_slot >= slotId
    );
  };

  // 渲染课程卡片
  const renderCourseCard = (day, slot) => {
    const courseItem = getCourseByDayAndSlot(day, slot.slot_id);
    
    // 如果已经渲染过这个课程了（跨越多个时间段），则不重复渲染
    if (courseItem && slot.slot_id > courseItem.start_slot) {
      return null;
    }
    
    if (courseItem) {
      // 查找对应的课程信息
      const course = courseItem.courses || 
        courses.find(c => c.course_id === courseItem.course_id) || {};
      
      // 计算卡片高度（占用的时间段数量）
      const slotSpan = courseItem.end_slot - courseItem.start_slot + 1;
      const height = slotSpan * 160 - 4; // 减去边距
      
      return (
        <TouchableOpacity
          style={[
            styles.courseCard, 
            { 
              backgroundColor: COLOR_MAP[course.color] || COLOR_MAP.blue,
              height
            }
          ]}
          onPress={() => {
            setSelectedCourse({...courseItem, course});
            setModalVisible(true);
          }}
        >
          <Text style={styles.courseTime}>{slot.slot_name}</Text>
          <Text style={styles.courseName}>{course.course_name}</Text>
          <Text style={styles.courseLocation}>{courseItem.location}</Text>
        </TouchableOpacity>
      );
    }
    
    // 没有课程，渲染空白格子
    return (
      <TouchableOpacity 
        style={styles.emptyCell}
        onPress={() => {
          setSelectedSlot({ day, slot });
          setAddModalVisible(true);
        }}
      />
    );
  };

  // 渲染课表
  const renderTimetable = () => {
    return (
      <View style={styles.timetable}>
        {/* 星期几标题栏 */}
        <View style={styles.weekdayHeaderContainer}>
          <View style={styles.timeColumnHeader}>
            <Text style={styles.timeHeaderText}>时间</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.weekdayRow}>
              {weekdays.map((day, index) => (
                <View key={index} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{day}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
        
        {/* 课表内容区域 - 支持垂直滚动 */}
        <ScrollView style={styles.tableContent} showsVerticalScrollIndicator={false}>
          <View style={styles.tableContentInner}>
            {/* 时间栏 */}
            <View style={styles.timeColumn}>
              {timeSlots.map((slot) => (
                <View key={slot.slot_id} style={styles.timeSlot}>
                  <Text style={styles.slotLabel}>{slot.slot_name}</Text>
                  <Text style={styles.slotTime}>
                    {slot.start_time.substring(0, 5)}{'\n'}
                    {slot.end_time.substring(0, 5)}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* 课程网格 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.courseGrid}>
                {/* 课程卡片行 */}
                {timeSlots.map((slot) => (
                  <View key={slot.slot_id} style={styles.courseRow}>
                    {weekdays.map((_, dayIndex) => (
                      <View key={dayIndex} style={styles.courseCell}>
                        {renderCourseCard(dayIndex + 1, slot)}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    );
  };

  // 显示导入模态框
  const showImportModal = () => {
    setImportModalVisible(true);
  };

  // 提示功能开发中
  const showFeatureInDevelopment = () => {
    Alert.alert('提示', '该功能正在开发中，敬请期待');
    setImportModalVisible(false);
  };

  // 删除课程
  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      const courseId = selectedCourse.course_id;
      if (!courseId) {
        Alert.alert('提示', '无法删除课程，未找到课程ID');
        return;
      }

      Alert.alert(
        '确认删除',
        '确定要删除这个课程吗？',
        [
          {
            text: '取消',
            style: 'cancel'
          },
          {
            text: '确定',
            style: 'destructive',
            onPress: async () => {
              try {
                setModalVisible(false);
                setLoading(true);
                
                // 删除课程安排
                await scheduleService.deleteCourseItem(selectedCourse.item_id);
                
                // 重新获取数据
                await fetchScheduleData();
                
                Alert.alert('成功', '课程已删除');
              } catch (error) {
                console.error('删除课程失败:', error);
                Alert.alert('错误', '删除课程失败，请重试');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('删除课程发生错误:', error);
      Alert.alert('错误', '操作失败，请重试');
    }
  };

  // 编辑课程 - 简化版，只显示提示
  const handleEditCourse = () => {
    Alert.alert('提示', '课程编辑功能正在开发中，敬请期待');
    setModalVisible(false);
  };

  // 添加课程
  const handleAddCourse = async () => {
    if (!selectedSlot) return;
    
    try {
      if (!courseName.trim()) {
        Alert.alert('提示', '请输入课程名称');
        return;
      }
      
      setSavingCourse(true); // 开始保存，显示加载状态
      
      // 创建新的课程
      const newCourse = {
        user_id: user.id,
        course_name: courseName.trim(),
        color: courseColor
      };
      
      // 保存课程到数据库
      const course = await scheduleService.addCourse(newCourse);
      
      // 获取当前周次
      const currentWeek = getCurrentWeek();
      
      // 创建课程安排
      const courseItem = {
        user_id: user.id,
        course_id: course.course_id,
        day_of_week: selectedSlot.day,
        start_slot: selectedSlot.slot.slot_id,
        end_slot: selectedSlot.slot.slot_id,  // 假设课程只占一个时间段，可根据需要调整
        location: courseLocation.trim(),
        week_start: currentWeek,
        week_end: currentWeek
      };
      
      // 保存课程安排到数据库
      await scheduleService.addCourseItem(courseItem);
      
      // 重新加载数据
      await fetchScheduleData(currentMonthIndex, currentYear, currentWeekIndex);
      
      // 重置表单并关闭模态框
      setCourseName('');
      setCourseLocation('');
      setCourseColor('blue');
      setAddModalVisible(false);
      
      Alert.alert('成功', '课程添加成功');
    } catch (error) {
      console.error('添加课程失败:', error);
      Alert.alert('错误', '添加课程失败，请重试');
    } finally {
      setSavingCourse(false); // 结束保存，取消加载状态
      setLoading(false);
    }
  };
  
  // 渲染颜色选择器
  const renderColorPicker = () => {
    const colors = [
      { name: '蓝色', value: 'blue' },
      { name: '绿色', value: 'green' },
      { name: '紫色', value: 'purple' },
      { name: '黄色', value: 'yellow' },
      { name: '橙色', value: 'orange' }
    ];
    
    return (
      <View style={styles.colorPickerContainer}>
        {colors.map((color) => (
          <TouchableOpacity
            key={color.value}
            style={[
              styles.colorOption,
              { backgroundColor: COLOR_MAP[color.value] },
              courseColor === color.value && styles.selectedColorOption
            ]}
            onPress={() => {
              setCourseColor(color.value);
              setColorPickerVisible(false);
            }}
          >
            <Text style={styles.colorOptionText}>{color.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.addButton} onPress={showImportModal}>
            <AntDesign name="plus" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.weekSelector}>
            <TouchableOpacity style={styles.weekNav} onPress={handlePrevWeek}>
              <AntDesign name="left" size={20} color="#6c8eef" />
            </TouchableOpacity>
            <View style={styles.currentWeek}>
              <Text style={styles.currentWeekText}>
                {currentYear}年{months[currentMonthIndex]} 第{currentWeekIndex + 1}周
              </Text>
            </View>
            <TouchableOpacity style={styles.weekNav} onPress={handleNextWeek}>
              <AntDesign name="right" size={20} color="#6c8eef" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 课表主体 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>加载课表中...</Text>
          </View>
        ) : (
          renderTimetable()
        )}
        
        {/* 查看/编辑课程模态框 */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <AntDesign name="close" size={24} color="#999" />
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>课程详情</Text>
              
              {selectedCourse && (
                <View style={styles.courseDetails}>
                  <Text style={styles.detailLabel}>课程名称</Text>
                  <Text style={styles.detailValue}>{selectedCourse.course?.course_name || selectedCourse.courses?.course_name || '未命名课程'}</Text>
                  
                  <Text style={styles.detailLabel}>上课地点</Text>
                  <Text style={styles.detailValue}>{selectedCourse.location || '未设置'}</Text>
                  
                  <Text style={styles.detailLabel}>上课时间</Text>
                  <Text style={styles.detailValue}>
                    周{weekdays[selectedCourse.day_of_week - 1]} {' '}
                    {timeSlots.find(s => s.slot_id === selectedCourse.start_slot)?.slot_name}
                  </Text>
                  
                  <View style={styles.buttonRow}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={handleEditCourse}
                    >
                      <Text style={styles.editButtonText}>编辑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={handleDeleteCourse}
                    >
                      <Text style={styles.deleteButtonText}>删除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
        
        {/* 导入课表模态框 */}
        <Modal
          visible={importModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setImportModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setImportModalVisible(false)}
              >
                <AntDesign name="close" size={24} color="#999" />
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>导入课程</Text>
              
              <TouchableOpacity 
                style={styles.importOption}
                onPress={showFeatureInDevelopment}
              >
                <MaterialIcons name="school" size={24} color="#666" />
                <Text style={styles.importOptionText}>从教务系统导入</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.importOption}
                onPress={showFeatureInDevelopment}
              >
                <AntDesign name="qrcode" size={24} color="#666" />
                <Text style={styles.importOptionText}>扫码导入</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        {/* 添加课程模态框 */}
        <Modal
          visible={addModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setAddModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setAddModalVisible(false);
                  setCourseName('');
                  setCourseLocation('');
                  setCourseColor('blue');
                  setColorPickerVisible(false);
                }}
              >
                <AntDesign name="close" size={24} color="#999" />
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>添加课程</Text>
              
              {selectedSlot && (
                <View style={styles.courseForm}>
                  <Text style={styles.formLabel}>课程名称</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="请输入课程名称"
                    value={courseName}
                    onChangeText={setCourseName}
                  />
                  
                  <Text style={styles.formLabel}>上课地点</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="请输入上课地点"
                    value={courseLocation}
                    onChangeText={setCourseLocation}
                  />
                  
                  <Text style={styles.formLabel}>上课时间</Text>
                  <View style={styles.timeDisplay}>
                    <Text style={styles.timeDisplayText}>
                      周{weekdays[selectedSlot.day - 1]} {' '}
                      {selectedSlot.slot.slot_name}
                    </Text>
                  </View>
                  
                  <Text style={styles.formLabel}>上课周次</Text>
                  <View style={styles.timeDisplay}>
                    <Text style={styles.timeDisplayText}>
                      {months[currentMonthIndex]} 第{currentWeekIndex + 1}周 (第{getCurrentWeek()}教学周)
                    </Text>
                  </View>
                  
                  <Text style={styles.formLabel}>课程颜色</Text>
                  <TouchableOpacity
                    style={[styles.colorSelector, { backgroundColor: COLOR_MAP[courseColor] }]}
                    onPress={() => setColorPickerVisible(!colorPickerVisible)}
                  >
                    <Text style={styles.colorSelectorText}>{
                      courseColor === 'blue' ? '蓝色' :
                      courseColor === 'green' ? '绿色' :
                      courseColor === 'purple' ? '紫色' :
                      courseColor === 'yellow' ? '黄色' : '橙色'
                    }</Text>
                    <AntDesign name="down" size={16} color="white" />
                  </TouchableOpacity>
                  
                  {colorPickerVisible && renderColorPicker()}
                  
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleAddCourse}
                    disabled={savingCourse}
                  >
                    {savingCourse ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>保存</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 10,
    position: 'relative',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4cd964',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: -7,
    zIndex: 10
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  weekNav: {
    padding: 5,
  },
  currentWeek: {
    backgroundColor: '#6c8eef',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginHorizontal: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  currentWeekText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timetable: {
    flex: 1,
    flexDirection: 'column',
  },
  weekdayHeaderContainer: {
    flexDirection: 'row',
    height: 40,
  },
  timeColumnHeader: {
    width: wp(15),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  timeHeaderText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  tableContent: {
    flex: 1,
  },
  tableContentInner: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: wp(15),
  },
  timeSlot: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  slotLabel: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  slotTime: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  courseGrid: {
    flex: 1,
  },
  weekdayRow: {
    flexDirection: 'row',
    height: 40,
    backgroundColor: 'white',
  },
  weekdayCell: {
    width: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  courseRow: {
    flexDirection: 'row',
    height: 160,
  },
  courseCell: {
    width: wp(12),
    padding: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  courseCard: {
    flex: 1,
    padding: 5,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseTime: {
    fontSize: 10,
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 5,
  },
  courseName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 3,
  },
  courseLocation: {
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
  },
  emptyCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: hp(2),
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '70%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  modalTitle: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  courseDetails: {
    width: '100%',
  },
  detailLabel: {
    fontSize: hp(1.8),
    color: '#777',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: hp(2),
    marginBottom: 15,
    paddingLeft: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 2,
    marginRight: 10,
  },
  editButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
  },
  deleteButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  importOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  importOptionText: {
    fontSize: hp(2),
    marginLeft: 15,
  },
  courseForm: {
    width: '100%',
  },
  formLabel: {
    fontSize: hp(1.8),
    color: '#777',
    marginBottom: 5,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: hp(2),
  },
  timeDisplay: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  timeDisplayText: {
    fontSize: hp(2),
    color: '#666',
  },
  colorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 5,
    padding: 10,
    marginBottom: 5,
  },
  colorSelectorText: {
    fontSize: hp(2),
    color: 'white',
    fontWeight: 'bold',
  },
  colorPickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    overflow: 'hidden',
  },
  colorOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedColorOption: {
    borderLeftWidth: 5,
    borderLeftColor: 'white',
  },
  colorOptionText: {
    fontSize: hp(2),
    color: 'white',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: hp(2),
  },
})

export default Schedule 