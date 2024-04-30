import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

const StartPage = () => {
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //     // triggers on app loads, does not trigger automatically 
    //     console.log('got sessions here');
    //     setSession(session);
    //     if (session) {
    //         router.replace("/home");
    //     } else {
    //         console.log("no user");
    //         // router.replace('/login')
    //     }
    // })

    // triggers automatically when auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
        //   setSession(session)
        console.log('got session');
        setSession(session);
        if (session) {
            router.replace("/home");
        } else {
            console.log("no user");
            router.replace('/welcome')
        }
    })
  }, []);

  if(!session) return null;
  return (
    <ScreenWrapper>
      <Text>StartPage</Text>
    </ScreenWrapper>
  )
}

export default StartPage