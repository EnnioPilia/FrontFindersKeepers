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

import { GestureHandlerRootView } from "react-native-gesture-handler";

function BackToHomeButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.replace("/")}
      style={{ marginLeft: 0, marginRight: 10 }} // bouton collé à gauche
      hitSlop={10}
    >
      <MaterialIcons name="arrow-back" size={24} color="#000" />
    </Pressable>
  );
}

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View style={styles.container}>
          <Stack
            key={currentRoute}
            screenOptions={{
              // Cache le header sur la page d'accueil ("/" et "/home/home")
              headerShown: !["/", "/home/home"].includes(currentRoute),

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

              headerBackVisible: false,
              headerTitleStyle: {
                color: colorScheme === "dark" ? "white" : "black",
                marginLeft: 20, // décale le titre vers la droite
              },
              headerTintColor: colorScheme === "dark" ? "white" : "black",
              headerLeft: () =>
                ["/auth/login", "/auth/register"].includes(currentRoute) ? (
                  <BackToHomeButton />
                ) : null,
            }}
            style={styles.stack}
          >
            {/* Définition des écrans avec titres */}
            <Stack.Screen name="index" options={{ title: "Finders Keepers" }} />
            <Stack.Screen name="auth/login" options={{ title: "Connexion" }} />
            <Stack.Screen
              name="auth/register"
              options={{ title: "Inscription" }}
            />
            <Stack.Screen
              name="auth/forgot-password"
              options={{ title: "Mot de passe oublié" }}
            />
            <Stack.Screen
              name="auth/reset-password"
              options={{ title: "Réinitialisation mot de passe" }}
            />
            <Stack.Screen
              name="conversation/conversation"
              options={{ title: " Mes conversation" }}
            />
            <Stack.Screen name="home/home" options={{ title: "Accueil" }} />
            <Stack.Screen
              name="legal/legal"
              options={{ title: "Mentions légales" }}
            />
            <Stack.Screen
              name="listConversation/listConversation"
              options={{ title: "Conversations" }}
            />
            <Stack.Screen
              name="objectForm/allObjects"
              options={{ title: "Objets" }}
            />
            <Stack.Screen
              name="objectForm/objectDetails"
              options={{ title: "Détails de l’objet" }}
            />
            <Stack.Screen
              name="objectForm/objectForm"
              options={{ title: "Formulaire objet" }}
            />
            <Stack.Screen
              name="profile/editProfile"
              options={{ title: "Modifier profil" }}
            />
            <Stack.Screen
              name="profile/profile"
              options={{ title: "Profil" }}
            />
            <Stack.Screen name="verify" options={{ title: "Vérification" }} />
            <Stack.Screen
              name="+not-found"
              options={{ title: "Page non trouvée" }}
            />
            <Stack.Screen
              name="objectForm/objectEdit"
              options={{ title: "Modifier un objet" }}
            />
          </Stack>

          {/* Footer fixe en bas sauf sur les routes exclues */}
          {!excludedRoutes.includes(currentRoute) && <Footer />}
        </View>

        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Toast />
      </ThemeProvider>
    </GestureHandlerRootView>
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
