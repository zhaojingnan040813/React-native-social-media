import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native'
import React from 'react'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../../components/ScreenWrapper'
import Icon from '../../assets/icons'

const AboutAuthor = () => {
  const router = useRouter();

  // 返回上一页
  const handleGoBack = () => {
    router.push('/profile');
  };

  // 打开链接
  const openLink = (url) => {
    Linking.openURL(url).catch(err => console.error('打开链接失败:', err));
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
        <Text style={styles.headerTitle}>关于作者</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 作者信息卡片 */}
        <View style={styles.authorCard}>
          <View style={styles.avatarContainer}>
            <Image 
              source={require('../../assets/images/defaultUser.png')} 
              style={styles.avatar}
              defaultSource={require('../../assets/images/defaultUser.png')}
            />
          </View>
          <Text style={styles.authorName}>一名大三的全栈开发者</Text>
          <Text style={styles.authorTitle}>React Native开发</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>关于我</Text>
          
          {/* 使用多个Text组件替代单个长文本，增加可读性 */}
          <View style={styles.paragraphContainer}>
            <Text style={styles.paragraphText}>
              这款APP是我的突发奇想。网上面的好多教程都是Vue、React的Web应用，但是我发现其实生活当中，我们使用最多的还是手机APP，大多数的人并不是经常用电脑。虽然说Uniapp也能开发APP，但是感觉网上面的教程没有讲得很好。
            </Text>
            
            <Text style={styles.paragraphText}>
              再加上之前有次面试被问到了React Native，于是我想用React Native开发一个APP。后期如果做得好的话，也可以拿来当毕业设计。相比与现在市面上好多人的毕业设计都用Spring Boot加Vue来做，我这个选题应该很新颖吧。
            </Text>
            
            <View style={styles.miniDivider} />
            
            <Text style={styles.paragraphText}>
              从需求分析到UI设计，再到后端开发、前端开发、数据库设计、服务器部署，都是我靠Cursor辅助完成的，代码我也看不懂，大概能知道每个文件是干嘛用的就可以了。
            </Text>
            
            <Text style={styles.paragraphText}>
              其实我认为软件开发就三个步骤：数据库设计、后端开发、前端开发。先让AI给你生成产品原型，然后你再根据产品原型，分析需要哪些数据库。当然，人分析的大概率没有AI分析的好，然后根据数据库，生成后端代码，最后生成前端代码。
            </Text>
            
            <View style={styles.highlightSection}>
              <View style={styles.highlightTitleContainer}>
                <Icon name="info" size={20} color={theme.colors.primary} />
                <Text style={styles.highlightTitle}>目前的技术难点：</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  课表如何从教务处进行导入，我推测这里应该要使用到爬虫，但是我没有学过爬虫，所以这个功能我暂时没有实现。
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  私信功能如何实现，我推测是要使用到WebSocket，有了解过，只看了他们官方的一个demo，可以实现双向实时通信。从这两个功能开始就不是CRUD了。
                </Text>
              </View>
            </View>
            
            <View style={styles.callToActionContainer}>
              <Text style={styles.callToAction}>
                如果你想要找到我和我一起做项目，可以加个QQ交流哦！
              </Text>
            </View>
          </View>
          
          <Text style={styles.sectionTitle}>技术栈</Text>
          <View style={styles.tagContainer}>
            {['React Native', 'Expo', 'Supabase', 'JavaScript', 'Node.js', 'PostgreSQL', 'Cursor'].map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.sectionTitle}>联系方式</Text>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openLink('https://wx.mail.qq.com/')}
          >
            <Icon name="mail" size={20} color={theme.colors.primary} />
            <Text style={styles.contactText}>2026617199@qq.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openLink('https://github.com/zhaojingnan040813')}
          >
            <Icon name="github" size={20} color={theme.colors.text} />
            <Text style={styles.contactText}>GitHub</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openLink('mqqapi://card/show_pslcard?src_type=internal&version=1&uin=2026617199&card_type=person&source=sharecard')}
          >
            <Icon name="qq" size={20} color="#12B7F5" />
            <Text style={styles.contactText}>点击这个蓝色的"小企鹅会有意外收获哦"</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openLink('mqqapi://card/show_pslcard?src_type=internal&version=1&uin=2026617199&card_type=person&source=sharecard')}
          >
            <Icon name="qqPenguin" size={26} color="#12B7F5" />
            <Text style={styles.contactText}>QQ：2026617199</Text>
          </TouchableOpacity>

          
          <View style={styles.divider} />
          
          <View style={styles.footerContainer}>
            <Text style={styles.versionText}>版本: 1.0.0</Text>
            <Text style={styles.copyrightText}>© 2025 一个人，也是一个团队</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp(4),
  },
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
  authorCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: hp(12),
    height: hp(12),
    borderRadius: hp(6),
    backgroundColor: '#f0f0f0',
  },
  authorName: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 5,
  },
  authorTitle: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.gray + '30',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
    marginTop: 5,
  },
  paragraphContainer: {
    marginBottom: 15,
  },
  paragraphText: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    lineHeight: hp(2.6),
    marginBottom: 12,
    textAlign: 'justify',
  },
  miniDivider: {
    height: 1,
    backgroundColor: theme.colors.gray + '30',
    marginVertical: 10,
  },
  highlightSection: {
    marginVertical: 10,
    backgroundColor: 'rgba(100, 149, 237, 0.08)',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  highlightTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  highlightTitle: {
    fontSize: hp(1.9),
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 5,
  },
  bulletDot: {
    fontSize: hp(2.2),
    color: theme.colors.primary,
    marginRight: 8,
    marginTop: -5,
  },
  bulletText: {
    flex: 1,
    fontSize: hp(1.8),
    color: theme.colors.text,
    lineHeight: hp(2.4),
  },
  callToActionContainer: {
    marginTop: 5,
    alignItems: 'center',
  },
  callToAction: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontSize: hp(1.9),
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    gap: 8,
  },
  tag: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: hp(1.6),
    color: theme.colors.primary,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  contactText: {
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  versionText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 5,
  },
  copyrightText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});

export default AboutAuthor; 