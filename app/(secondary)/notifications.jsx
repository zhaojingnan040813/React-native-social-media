import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import React, { useState, useCallback } from 'react'
import { hp, wp } from '../../helpers/common'
import { useAuth } from '../../contexts/AuthContext'
import { theme } from '../../constants/theme'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../../components/ScreenWrapper'
import Icon from '../../assets/icons'
import Loading from '../../components/Loading'

const Notifications = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // 模拟加载
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // 返回个人资料页面
  const handleGoBack = () => {
    router.push('/(main)/profile');
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
        >
          <Icon name="arrowLeft" strokeWidth={2.5} size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>消息通知</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={() => null} // 暂无内容
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="notifications" size={60} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>暂无消息通知</Text>
              <Text style={styles.subText}>该功能正在开发中，敬请期待！</Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: wp(4),
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray + '20',
  },
  backButton: {
    position: 'absolute',
    left: wp(4),
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: theme.radius.sm,
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  listContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: 10,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(20),
    gap: 8,
  },
  emptyText: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 15,
  },
  subText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    textAlign: 'center',
  }
});

export default Notifications; 