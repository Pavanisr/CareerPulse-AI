import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bootstrap } from './src/app/bootstrap';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bootstrap()
      .then(() => setReady(true))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {error ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>
          <Text style={{ color: colors.danger, fontWeight: '700' }}>Could not open the local database: {error}</Text>
        </View>
      ) : ready ? (
        <RootNavigator />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </SafeAreaProvider>
  );
}
