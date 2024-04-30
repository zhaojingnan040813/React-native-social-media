import { View, Text, Button } from 'react-native'
import React from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { supabase } from '../../lib/supabase'

const HomeScreen = () => {

    const onLogout = async () => {
        const {error} = await supabase.auth.signOut();
        if (error) {
          Alert.alert("Error Signing Out User", error.message);
        }
    }
  return (
    <ScreenWrapper>
      <Text>HomeScreen</Text>
      <Button onPress={onLogout} title="Logout" />
    </ScreenWrapper>
  )
}

export default HomeScreen