import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { router } from 'expo-router';
import { NavigationUtils } from '@/utils/navigation';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Report to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        errorType: 'react_error_boundary',
        location: 'navigation',
      },
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error }: { error?: Error }) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textPrimary');

  const handleRestart = () => {
    // Try to reset navigation state to recover from error
    if (typeof NavigationUtils !== 'undefined' && NavigationUtils.reset) {
      NavigationUtils.reset();
    } else {
      router.replace('/(tabs)/(prayers)');
    }
    console.log('Restart requested');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedText style={[styles.title, { color: textColor }]}>
        Something went wrong
      </ThemedText>
      <ThemedText style={[styles.message, { color: textColor }]}>
        We're sorry, but something unexpected happened. Please try again.
      </ThemedText>
      {__DEV__ && error && (
        <ThemedText style={[styles.errorText, { color: textColor }]}>
          {error.message}
        </ThemedText>
      )}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: textColor }]}
        onPress={handleRestart}
      >
        <Text style={[styles.buttonText, { color: backgroundColor }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export const ErrorBoundary = Sentry.withErrorBoundary(ErrorBoundaryClass, {
  fallback: (errorData) => (
    <ErrorFallback
      error={errorData.error instanceof Error ? errorData.error : undefined}
    />
  ),
});
