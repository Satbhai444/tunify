import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography } from '../theme';
import { MaterialIcon } from './MaterialIcon';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Core Crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <MaterialIcon name="error-outline" size={64} color={colors.primary} />
          <Text style={styles.errorText}>Something went wrong</Text>
          <Text style={styles.subText}>The app encountered a critical error during boot.</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    ...typography.headlineSmall,
    color: '#fff',
    marginTop: 20,
    fontWeight: '700',
  },
  subText: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
