import { Dimensions } from "react-native";

// 获取设备屏幕的宽度和高度
// width: deviceWidth - 设备屏幕宽度
// height: deviceHeight - 设备屏幕高度
const {width: deviceWidth, height: deviceHeight} = Dimensions.get('window');

/**
 * 将字符串中每个单词的首字母转换为大写
 * @param {string} str - 需要处理的字符串
 * @returns {string} - 处理后的字符串，每个单词首字母大写
 */
export const capitalize = str=>{
    return str.replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * 将百分比转换为设备宽度的像素值
 * 用于实现响应式布局，确保UI在不同屏幕尺寸下保持一致的比例
 * @param {number} percentage - 宽度百分比
 * @returns {number} - 计算后的像素值
 */
export const wp = (percentage) => {
    return (percentage * deviceWidth) / 100;
};

/**
 * 将百分比转换为设备高度的像素值
 * 用于实现响应式布局，确保UI在不同屏幕尺寸下保持一致的比例
 * @param {number} percentage - 高度百分比
 * @returns {number} - 计算后的像素值
 */
export const hp = (percentage) => {
    return (percentage * deviceHeight) / 100;
};

/**
 * 去除字符串中的所有HTML标签
 * 用于从富文本内容中提取纯文本
 * @param {string} html - 包含HTML标签的字符串
 * @returns {string} - 去除HTML标签后的纯文本
 */
export const stripHtmlTags = (html) => {
    return html.replace(/<[^>]*>?/gm, '');
};