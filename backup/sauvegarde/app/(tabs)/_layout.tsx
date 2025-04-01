import { Tabs } from 'expo-router';
import { Timer, ChartBar as BarChart3, QrCode, Settings, Chrome as Home } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const iconColor = theme === 'dark' ? '#fff' : '#000';

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: iconColor,
        headerStyle: {
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        },
        headerTintColor: iconColor,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tableau de bord',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tâches',
          tabBarIcon: ({ color, size }) => <Timer size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => <QrCode size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analyses',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}