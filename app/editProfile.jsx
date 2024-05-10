import { View, Text, StyleSheet, Image, ScrollView, Pressable, TextInput, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { hp, wp } from '../helpers/common'
import { useAuth } from '../contexts/AuthContext'
import { theme } from '../constants/theme'
import { Feather, FontAwesome, Ionicons, SimpleLineIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import Button from '../components/Button'
import BackButton from '../components/BackButton'
import * as ImagePicker from 'expo-image-picker';


const EditProfile = () => {
  const {user: currentUser} = useAuth();
  const router = useRouter();
  const [profileModal, toggleProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({
    name: '',
    phoneNumber: '',
    image: null,
    bio: '',
    address: '',
  });

  useEffect(()=>{
    if(currentUser){
        setUser({
            name: currentUser.name || '',
            phoneNumber: currentUser.phoneNumber || '',
            image: user.image || null,
            address: currentUser.address || '',
            bio: currentUser.bio || '',
        });
    }
  },[currentUser]);
  


  const onPickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    console.log(result);

    if (!result.canceled) {
      setUser({...user, image: result.assets[0].uri});
    }
  };

  const onSubmit = async ()=>{
    let {name, phoneNumber, address, image, bio} = user;
    if(!name || !phoneNumber || !address || !image || !bio){
        Alert.alert('Profile', "Please fill all the fields");
        return;
    }

    // good to go
  }

  let imageSource = user.image? {uri: user.image}: require('../assets/images/defaultUser.png');
  
  return (
    <ScreenWrapper>
        <View style={styles.container}>
            <ScrollView style={{flex: 1}}>   
                <View>
                    <BackButton router={router} />
                </View> 
                <Text style={styles.editProfileText}>Edit Profile</Text>
                {/* form */}
                <View style={styles.form}>
                    <View style={styles.avatar}>
                        <Image source={imageSource} style={{width: '100%', height: '100%', borderRadius: 100}} />
                        <Pressable style={styles.cameraIcon} onPress={onPickImage}>
                            <Feather name="camera" size={20} color={theme.colors.textLight} />
                        </Pressable>
                    </View>
                    <Text style={{fontSize: hp(1.5), color: theme.colors.text}}>
                        Please fill your profile details
                    </Text>
                    <View style={styles.input}>
                        <FontAwesome name="user-o" size={25} color={theme.colors.textLight} />
                        <TextInput
                            style={{flex: 1}}
                            placeholder='Enter your name'
                            placeholderTextColor={theme.colors.textLight}
                            value={user.name}
                            onChangeText={value=> setUser({...user, name: value})}
                        />
                    </View>
                    <View style={styles.input}>
                        <Feather name="phone" size={25} color={theme.colors.textLight} />
                        <TextInput
                            style={{flex: 1}}
                            placeholder='Enter your phone number'
                            placeholderTextColor={theme.colors.textLight}
                            value={user.phoneNumber}
                            onChangeText={value=> setUser({...user, phoneNumber: value})}
                        />
                    </View>
                    <View style={styles.input}>
                        <Feather name="map-pin" size={25} color={theme.colors.textLight} />
                        <TextInput 
                            style={{flex: 1}}
                            placeholder='Enter your address'
                            placeholderTextColor={theme.colors.textLight}
                            value={user.address}
                            onChangeText={value=> setUser({...user, address: value})}
                        />
                    </View>

                    <View style={styles.bio}>
                        <TextInput
                            value={user.bio}
                            style={{flex: 1}}
                            placeholder='Enter your bio'
                            placeholderTextColor={theme.colors.textLight}
                            onChangeText={value=> setUser({...user, bio: value})}
                            multiline={true}
                            // underlineColorAndroid='transparent'
                        />
                    </View>

                    {/* button */}
                    <Button title="Update" loading={loading} onPress={onSubmit} />
                </View>
                    
            </ScrollView>
        </View>
      
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4)
  },  
  avatar: {
    height: hp(14),
    width: hp(14),
    alignSelf: 'center'
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 7,
    borderRadius: 50,
    backgroundColor: theme.colors.darkLight,
    shadowColor: theme.colors.textLight,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.7,
    shadowRadius: 5
  },
  form: {
    gap: 18,
    marginTop: 20,
  },
  input: {
    flexDirection: 'row',
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    borderRadius: 100,
    padding: 18,
    paddingHorizontal: 20,
    gap: 15
  },
  editProfileText: {
    position: 'absolute',
    alignSelf: 'center',
    marginTop: 4,
    fontSize: hp(3),
    fontWeight: '600',
    color: theme.colors.textDark
  },
  bio: {
    flexDirection: 'row',
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    borderRadius: 25,
    padding: 15,
    height: hp(15),
    paddingHorizontal: 20,
    gap: 15
  }

  
})

export default EditProfile