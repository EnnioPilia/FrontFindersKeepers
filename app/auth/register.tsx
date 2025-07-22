import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Switch,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import Toast from "react-native-toast-message";

export default function Register() {
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [acceptedCGU, setAcceptedCGU] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nom || !prenom || !age || !email || !password || !passwordConfirm) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez remplir tous les champs",
        position: "bottom",
      });
      return;
    }

    if (password !== passwordConfirm) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Les mots de passe ne correspondent pas",
        position: "bottom",
      });
      return;
    }

    if (!acceptedCGU) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Vous devez accepter les conditions générales d'utilisation",
        position: "bottom",
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nom,
        prenom,
        age: parseInt(age),
        email,
        password,
      };

      console.log("Données envoyées à l'API register :", payload);

      const response = await fetch("http://192.168.1.26:8080/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.replace({
          pathname: "/auth/login",
          params: { fromRegister: "success" },
        });
      } else {
        const errorData = await response.json();
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: errorData.error || "Une erreur est survenue",
          position: "bottom",
        });
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de se connecter au serveur",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Inscription" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Créer un compte</Text>

        <TextInput
          placeholder="Nom"
          value={nom}
          onChangeText={setNom}
          style={styles.input}
        />
        <TextInput
          placeholder="Prénom"
          value={prenom}
          onChangeText={setPrenom}
          style={styles.input}
        />
        <TextInput
          placeholder="Âge"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          style={styles.input}
        />
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
        <TextInput
          placeholder="Confirmer le mot de passe"
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          secureTextEntry
          style={styles.input}
        />

        <View style={styles.cguContainer}>
          <Switch
            value={acceptedCGU}
            onValueChange={setAcceptedCGU}
            thumbColor={acceptedCGU ? "#27ae60" : "#f4f3f4"}
          />
          <Text style={styles.cguText}>
            J'accepte les conditions générales d'utilisation
          </Text>
        </View>

        <Pressable
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Création en cours..." : "S'inscrire"}
          </Text>
        </Pressable>
      </View>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 24,
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
    backgroundColor: "#27ae60",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  cguContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cguText: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
});
