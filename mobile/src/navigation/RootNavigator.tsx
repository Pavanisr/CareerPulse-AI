import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import DashboardScreen from '../modules/dashboard/DashboardScreen';
import DecksScreen from '../modules/flashcards/DecksScreen';
import FlashcardReviewScreen from '../modules/flashcards/FlashcardReviewScreen';
import InterviewSessionScreen from '../modules/interview/InterviewSessionScreen';
import InterviewSetupScreen from '../modules/interview/InterviewSetupScreen';
import { colors } from '../theme/theme';
import { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarIcon: ({ color, size }) => <Ionicons name={route.name === 'Dashboard' ? 'speedometer-outline' : 'layers-outline'} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Decks" component={DecksScreen} />
    </Tab.Navigator>
  );
}

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary, card: colors.surface, text: colors.ink, border: colors.line } };

export default function RootNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="InterviewSetup" component={InterviewSetupScreen} options={{ title: 'New interview' }} />
        <Stack.Screen name="InterviewSession" component={InterviewSessionScreen} options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="FlashcardReview" component={FlashcardReviewScreen} options={{ title: 'Review' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
