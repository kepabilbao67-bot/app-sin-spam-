import React from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import DashboardScreen from '../screens/DashboardScreen';
import BlockedScreen from '../screens/BlockedScreen';
import RulesScreen from '../screens/RulesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatsScreen from '../screens/StatsScreen';
import WhatsAppScreen from '../screens/WhatsAppScreen';
import AssistantScreen from '../screens/AssistantScreen';
import PremiumScreen from '../screens/PremiumScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const headerBase = {
  headerStyle: { backgroundColor: COLORS.surface, borderBottomColor: COLORS.border, borderBottomWidth: 1 } as any,
  headerTitleStyle: { color: COLORS.text, fontWeight: '700' as const },
  headerTintColor: COLORS.primary,
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerBase,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: 1, height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Dashboard: ['shield-checkmark', 'shield-checkmark-outline'],
            Bloqueados: ['ban', 'ban-outline'],
            WhatsApp: ['chatbubbles', 'chatbubbles-outline'],
            Asistente: ['sparkles', 'sparkles-outline'],
            Ajustes: ['settings', 'settings-outline'],
          };
          const [active, inactive] = icons[route.name] || ['help', 'help-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={({ navigation }) => ({
          title: 'Anti-Spam IA',
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('Estadísticas')} style={{ marginRight: 16 }}>
              <Ionicons name="bar-chart-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen
        name="Bloqueados"
        component={BlockedScreen}
        options={({ navigation }) => ({
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('Reglas')} style={{ marginRight: 16 }}>
              <Ionicons name="filter-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen name="WhatsApp" component={WhatsAppScreen} options={{ title: 'Analizador WhatsApp' }} />
      <Tab.Screen name="Asistente" component={AssistantScreen} options={{ title: 'Asistente IA', headerShown: false }} />
      <Tab.Screen name="Ajustes" component={SettingsScreen} options={{ title: 'Configuración' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ ...headerBase }}>
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Estadísticas" component={StatsScreen} options={{ title: 'Estadísticas' }} />
        <Stack.Screen name="Reglas" component={RulesScreen} options={{ title: 'Reglas personalizadas' }} />
        <Stack.Screen name="Premium" component={PremiumScreen} options={{ title: 'Premium' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
