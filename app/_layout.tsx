import { useColorScheme } from "@/src/hooks/useColorScheme";
import { MaterialIcons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../src/context/authContext";

import Footer from "../src/components/Footer";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { logout } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const [currentRoute, setCurrentRoute] = useState("/" + segments.join("/"));

  useEffect(() => {
    setCurrentRoute("/" + segments.join("/"));
  }, [segments]);

  const handleLogout = async () => {
    alert("Voulez-vous vraiment vous déconnecter ?");
    await logout();
    router.replace("/auth/login");
  };

  const excludedRoutes = ["/", "/auth/login", "/auth/register"];
  const showLogout = !excludedRoutes.includes(currentRoute);
  const isHome = currentRoute === "/";

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View style={styles.container}>
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
                    color={colorScheme === "dark" ? "white" : "black"}
                  />
                </Pressable>
              ) : null,
            headerBackVisible: !isHome,
            headerTitleStyle: {
              color: colorScheme === "dark" ? "white" : "black",
            },
            headerTintColor: colorScheme === "dark" ? "white" : "black",
          }}
          style={styles.stack}
        >
          <Stack.Screen name="index" options={{ title: "Page d accueil" }} />
          <Stack.Screen
            name="+not-found"
            options={{ title: "Page non trouvée" }}
          />
        </Stack>

        {/* Footer fixe en bas */}
        <Footer />
      </View>

      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Toast />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stack: {
    flex: 1,
  },
});
