import { View, Text, Button } from 'react-native'
import React, { useEffect } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const HomeScreen = () => {
    const {user, setAuth} = useAuth();
    const onLogout = async () => {
        setAuth(null);
        const {error} = await supabase.auth.signOut();
        if (error) {
          Alert.alert("Error Signing Out User", error.message);
        }
    }

    useEffect(()=>{

    },[]);

    
  return (
    <ScreenWrapper>
      <Text>HomeScreen</Text>
      <Button onPress={onLogout} title="Logout" />
    </ScreenWrapper>
  )
}

export default HomeScreen