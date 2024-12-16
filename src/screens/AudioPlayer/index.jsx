import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect,useState } from 'react'
import MediaPlayer from '../../components/MediaPlayer/MediaPlayer'
const ProfileScreen = (navigation) => {
  return (
    <View style={styles.container}>
        <MediaPlayer filePath={navigation.route.params.data.path}/>
    </View>
  )
}

export default ProfileScreen

const styles = StyleSheet.create({
  container:{
    height: '100%',
  }
})
