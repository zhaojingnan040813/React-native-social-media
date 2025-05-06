import { View, Text } from 'react-native'
import React from 'react'
import Home from './Home';
import Mail from './Mail';
import Lock from './Lock';
import User from './User';
import Heart from './Heart';
import Plus from './Plus';
import Search from './Search';
import Location from './Location';
import Call from './Call';
import { theme } from '../../constants/theme';
import Camera from './Camera';
import Edit from './Edit';
import ArrowLeft from './ArrowLeft';
import ThreeDotsCircle from './ThreeDotsCircle';
import ThreeDotsHorizontal from './ThreeDotsHorizontal';
import Comment from './Comment';
import Share from './Share';
import Send from './Send';
import Delete from './Delete';
import Logout from './logout';
import Image from './Image';
import Video from './Video';
import Eye from './Eye';
import EyeOff from './EyeOff';
import Calendar from './Calendar';
import Bookmark from './Bookmark';
import BookmarkFill from './BookmarkFill';
import Github from './Github';
import QQ from './QQ';
import QQPenguin from './QQPenguin';
import Mic from './Mic';
import Keyboard from './Keyboard';


const icons = {
    home: Home,
    mail: Mail,
    lock: Lock,
    user: User,
    heart: Heart,
    plus: Plus,
    search: Search,
    location: Location,
    call: Call,
    camera: Camera,
    edit: Edit,
    arrowLeft: ArrowLeft,
    threeDotsCircle: ThreeDotsCircle,
    threeDotsHorizontal: ThreeDotsHorizontal,
    comment: Comment,
    share: Share,
    send: Send,
    delete: Delete,
    logout: Logout,
    image: Image,
    video: Video,
    eye: Eye,
    eyeOff: EyeOff,
    calendar: Calendar,
    bookmark: Bookmark,
    'bookmark-fill': BookmarkFill,
    github: Github,
    qq: QQ,
    qqPenguin: QQPenguin,
    mic: Mic,
    keyboard: Keyboard,
}

const Icon = ({name, ...props}) => {
    const IconComponent = icons[name];

    if(!IconComponent) return null;

    return (
    <IconComponent 
        height={props.size || 24} 
        width={props.size || 24} 
        strokeWidth={props.strokeWidth || 1.9} 
        color={theme.colors.textLight}
        {...props} 
    />
    );
}

export default Icon;