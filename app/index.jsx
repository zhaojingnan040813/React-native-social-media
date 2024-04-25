import { View, Text, Button } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router';

const StartPage = () => {
  const router = useRouter();
  return (
    <View style={{paddingTop: 40}}>
      <Text>StartPage</Text>
      <Button title="Login" onPress={()=> router.push('/login')} />
    </View>
  )
}

export default StartPage