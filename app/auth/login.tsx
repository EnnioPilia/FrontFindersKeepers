import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "./authContext";
import Toast from "react-native-toast-message";

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const fromRegister = Array.isArray(params.fromRegister) ? params.fromRegister[0] : params.fromRegister;
  const fromReset = Array.isArray(params.fromReset) ? params.fromReset[0] : params.fromReset;
  const fromForgotPassword = Array.isArray(params.fromForgotPassword) ? params.fromForgotPassword[0] : params.fromForgotPassword;
  const forgotPasswordMessage = Array.isArray(params.message) ? params.message[0] : params.message;

  useEffect(() => {
    if (fromRegister === "success") {
      Toast.show({
        type: "success",
        text1: "Inscription réussie",
        text2:
          "Un email de validation vous a été envoyé. Veuillez cliquer sur le lien dans cet email pour activer votre compte.",
        position: "bottom",
        visibilityTime: 10000,
      });
      const newParams = { ...params };
      delete newParams.fromRegister;
      router.replace({ pathname: "/auth/login", params: newParams });
    }

    if (fromReset === "success") {
      Toast.show({
        type: "success",
        text1: "Mot de passe réinitialisé",
        text2:
          "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
        position: "bottom",
        visibilityTime: 10000,
      });
      const newParams = { ...params };
      delete newParams.fromReset;
      router.replace({ pathname: "/auth/login", params: newParams });
    }

    if (fromForgotPassword === "success") {
      Toast.show({
        type: "success",
        text1: "Lien envoyé",
        text2: forgotPasswordMessage || "Un email de réinitialisation a été envoyé.",
        position: "bottom",
        visibilityTime: 10000,
      });
      const newParams = { ...params };
      delete newParams.fromForgotPassword;
      delete newParams.message;
      router.replace({ pathname: "/auth/login", params: newParams });
    }
  }, [fromRegister, fromReset, fromForgotPassword, forgotPasswordMessage, params, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez remplir tous les champs",
        position: "bottom",
      });
      return;
    }

    setLoading(true);

    try {
      // const response = await fetch("http://192.168.1.26:8080/auth/login", {
      const response = await fetch("http://192.168.1.108:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: "include",  <-- supprimé ici, pas de cookie
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuthenticated(true);
        await AsyncStorage.setItem("token", data.token ?? "");
        Toast.show({
          type: "success",
          text1: "Succès",
          text2: data.message || "Connexion réussie !",
          position: "bottom",
        });
        router.replace("/home/home");
      } else if (response.status === 401) {
        const errorData = await response.json();
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: errorData.error || "Identifiants invalides",
          position: "bottom",
        });
      } else if (response.status === 403) {
        const errorData = await response.json();
        Toast.show({
          type: "error",
          text1: "Compte non activé",
          text2:
            errorData.error ||
            "Veuillez activer votre compte via le lien reçu par email.",
          position: "bottom",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Une erreur est survenue",
          position: "bottom",
        });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de joindre le serveur",
        position: "bottom",
      });
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
          style={[styles.button, loading && { opacity: 0.6 }]}
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


