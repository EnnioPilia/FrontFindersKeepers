import { useColorScheme } from '@/src/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useAuth } from './auth/authContext';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { logout } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const [currentRoute, setCurrentRoute] = useState('/' + segments.join('/'));

  useEffect(() => {
    setCurrentRoute('/' + segments.join('/'));
  }, [segments]);

  const handleLogout = async () => {
    alert('Voulez-vous vraiment vous déconnecter ?');
    await logout();
    router.replace('/auth/login');
  };

  const excludedRoutes = ['/', '/auth/login', '/auth/register'];
  const showLogout = !excludedRoutes.includes(currentRoute);
  const isHome = currentRoute === '/';

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        key={currentRoute}
        screenOptions={{
          headerShown: true,
          headerRight: () =>
            showLogout ? (
              <Pressable onPress={handleLogout} style={{ marginRight: 15 }}>
                <MaterialIcons
                  name="logout"
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              </Pressable>
            ) : null,
          headerBackVisible: !isHome,
          headerTitleStyle: {
            color: colorScheme === 'dark' ? 'white' : 'black',  // Texte titre header
          },
          headerTintColor: colorScheme === 'dark' ? 'white' : 'black', // Couleur des boutons back, etc.
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" options={{ title: 'Page non trouvée' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Toast />
    </ThemeProvider>
  );
}
