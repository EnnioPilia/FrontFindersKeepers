import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: number;
  nom: string;
  prenom: string;
  age: number;
  email: string;
}

export default function EditProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        console.log("Token:", storedToken);
        if (!storedToken) {
          Alert.alert("Erreur", "Utilisateur non authentifié.");
          setLoading(false);
          return;
        }
        setToken(storedToken);

        const response = await fetch("http://192.168.1.26:8080/users/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Response body:", text);

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data: User = JSON.parse(text);

        setUser(data);
        setNom(data.nom);
        setPrenom(data.prenom);
        setAge(String(data.age));
        setEmail(data.email);
      } catch (error) {
        console.error("Erreur fetch:", error);
        Alert.alert("Erreur", "Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleSave = async () => {
    if (!token) {
      Alert.alert("Erreur", "Token manquant, veuillez vous reconnecter.");
      return;
    }

    if (!nom || !prenom || !email || !age) {
      Alert.alert("Champs manquants", "Merci de remplir tous les champs.");
      return;
    }

    if (isNaN(Number(age)) || Number(age) < 0) {
      Alert.alert("Âge invalide", "Veuillez saisir un âge valide.");
      return;
    }

    if (!user) {
      Alert.alert("Erreur", "Utilisateur non chargé.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `http://192.168.1.26:8080/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nom,
            prenom,
            age: Number(age),
            email,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert("Erreur", errorData.message || "Échec de la mise à jour");
        setSaving(false);
        return;
      }

      const updatedUser: User = await response.json();
      setUser(updatedUser);
      Alert.alert("Succès", "Profil mis à jour avec succès.");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Utilisateur non trouvé.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nom</Text>
      <TextInput style={styles.input} value={nom} onChangeText={setNom} />

      <Text style={styles.label}>Prénom</Text>
      <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} />

      <Text style={styles.label}>Âge</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Button
        title={saving ? "Enregistrement..." : "Enregistrer"}
        onPress={handleSave}
        disabled={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    marginTop: 15,
    marginBottom: 5,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
});
