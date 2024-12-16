import { Text, StyleSheet, View } from 'react-native'
import React, { Component } from 'react'

export default class Card extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>Card</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
    container:{
        width: '100%',
        borderRadius: '5px',
        color:"transparent",
        
    }
})