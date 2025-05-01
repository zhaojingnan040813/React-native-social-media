import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Alert } from 'react-native'
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

// 时间段定义
const DEFAULT_TIME_SLOTS = [
  { slot_id: 1, slot_name: '1-2节', start_time: '08:00', end_time: '09:40' },
  { slot_id: 2, slot_name: '3-4节', start_time: '10:00', end_time: '11:30' },
  { slot_id: 3, slot_name: '5-6节', start_time: '13:30', end_time: '15:10' },
  { slot_id: 4, slot_name: '7-8节', start_time: '15:20', end_time: '17:00' },
  { slot_id: 5, slot_name: '9-10节', start_time: '17:10', end_time: '19:50' },
  { slot_id: 6, slot_name: '11-12节', start_time: '19:10', end_time: '21:00' }
];

// 颜色映射
const COLOR_MAP = {
  blue: 'rgba(106, 191, 240, 0.8)',
  green: 'rgba(72, 207, 173, 0.8)',
  purple: 'rgba(155, 89, 182, 0.8)',
  yellow: 'rgba(241, 196, 15, 0.8)',
  orange: 'rgba(230, 126, 34, 0.8)'
};

const Schedule = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState(DEFAULT_TIME_SLOTS);
  const [courses, setCourses] = useState([]);
  const [courseItems, setCourseItems] = useState([]);
  const [currentWeek, setCurrentWeek] = useState('5月');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // 获取课表数据
  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      
      // 获取时间段定义
      const slots = await scheduleService.getTimeSlots()
        .catch(() => DEFAULT_TIME_SLOTS);
      setTimeSlots(slots);
      
      // 获取用户课程数据
      if (user?.id) {
        const { courses, courseItems } = await scheduleService.getUserCourses(user.id);
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
      fetchScheduleData();
      return () => {};
    }, [user?.id])
  );

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
            {/* 星期几标题 */}
            <View style={styles.weekdayRow}>
              {weekdays.map((day, index) => (
                <View key={index} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{day}</Text>
                </View>
              ))}
            </View>
            
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

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.addButton} onPress={showImportModal}>
            <AntDesign name="plus" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.weekSelector}>
            <TouchableOpacity style={styles.weekNav}>
              <AntDesign name="left" size={20} color="#6c8eef" />
            </TouchableOpacity>
            <View style={styles.currentWeek}>
              <Text style={styles.currentWeekText}>{currentWeek}</Text>
            </View>
            <TouchableOpacity style={styles.weekNav}>
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
        
        {/* 添加课程模态框 - 简化版，实际实现中应该有表单 */}
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
                onPress={() => setAddModalVisible(false)}
              >
                <AntDesign name="close" size={24} color="#999" />
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>添加课程</Text>
              
              {selectedSlot && (
                <View style={styles.courseDetails}>
                  <Text style={styles.detailLabel}>上课时间</Text>
                  <Text style={styles.detailValue}>
                    周{weekdays[selectedSlot.day - 1]} {' '}
                    {selectedSlot.slot.slot_name}
                  </Text>
                  
                  <Text style={styles.message}>课程添加功能正在开发中...</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 10,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: '50%',
    marginLeft: -50,
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
  },
  currentWeekText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timetable: {
    flex: 1,
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
  message: {
    fontSize: hp(2),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 20,
  }
})

export default Schedule 