import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export function MadeInIndiaFooter() {
  return (
    <View style={styles.container}>
      <Text style={styles.line1}>MADE WITH ❤️ IN INDIA</Text>
      <Text style={styles.line2}>MADE BY DARSHAN SATBHAI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
    marginTop: 16,
  },
  line1: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  line2: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
