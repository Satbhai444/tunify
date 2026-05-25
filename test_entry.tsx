import { registerRootComponent } from 'expo';
import React from 'react';
import { View, Text } from 'react-native';

function TestApp() {
  console.log('🔴 METRO IS FINALLY USING THE NEW ENTRY FILE!');
  return (
    <View style={{ flex: 1, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 24 }}>NEW ENTRY WORKING</Text>
    </View>
  );
}

registerRootComponent(TestApp);
