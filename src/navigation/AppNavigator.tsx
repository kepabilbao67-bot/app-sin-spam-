import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import DashboardScreen from '../screens/DashboardScreen';
import BlockedScreen from '../screens/BlockedScreen';
import RulesScreen from '../screens/RulesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatsScreen from '../screens/StatsScreen';
import WhatsAppScreen from '../screens/WhatsAppScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: COLORS.surface, borderBottomColor: COLORS.border, borderBottomWidth: 1 },
          headerTitleStyle: { color: COLORS.text, fontWeight: '700' },
          tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: 1, height: 60, paddingBottom: 8 },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ focused, color, size }) => {
            const icons: Record<string, [string, string]> = {
              Dashboard: ['shield-checkmark', 'shield-checkmark-outline'],
              Bloqueados: ['ban', 'ban-outline'],
              WhatsApp: ['chatbubbles', 'chatbubbles-outline'],
              Estadísticas: ['bar-chart', 'bar-chart-outline'],
              Ajustes: ['settings', 'settings-outline'],
            };
            const [active, inactive] = icons[route.name] || ['help', 'help-outline'];
            return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Anti-Spam IA' }} />
        <Tab.Screen name="Bloqueados" component={BlockedScreen} />
        <Tab.Screen name="WhatsApp" component={WhatsAppScreen} />
        <Tab.Screen name="Estadísticas" component={StatsScreen} />
        <Tab.Screen name="Ajustes" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
