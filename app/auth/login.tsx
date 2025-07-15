import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "./authContext";
import Toast from "react-native-toast-message";

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.fromRegister === "success") {
      Toast.show({
        type: "success",
        text1: "Inscription réussie",
        text2:
          "Un email de validation vous a été envoyé. Veuillez cliquer sur le lien dans cet email pour activer votre compte.",
        position: "bottom",
        visibilityTime: 10000, // 10 secondes
      });
    }
  }, [params.fromRegister]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://192.168.1.26:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuthenticated(true);
        await AsyncStorage.setItem("token", data.token ?? "");
        Alert.alert("Succès", data.message || "Connexion réussie !");
        router.replace("/home/home");
      } else if (response.status === 401) {
        const errorData = await response.json();
        Alert.alert("Erreur", errorData.error || "Identifiants invalides");
      } else if (response.status === 403) {
        const errorData = await response.json();
        Alert.alert(
          "Compte non activé",
          errorData.error ||
            "Veuillez activer votre compte via le lien reçu par email."
        );
      } else {
        Alert.alert("Erreur", "Une erreur est survenue");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de joindre le serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Connexion" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Connexion</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Pressable
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Connexion..." : "Se connecter"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push("/auth/forgot-password")}>
          <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
        </Pressable>
      </View>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2e86de",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  forgotPassword: {
    color: "#2e86de",
    marginTop: 16,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
