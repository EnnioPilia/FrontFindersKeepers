import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { authFetch } from "../utils/authFetch";

export default function ObjectForm() {
  const router = useRouter();

  const [type, setType] = useState<"PERDU" | "TROUVE" | "">("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "La localisation est nécessaire pour cette fonctionnalité."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  const handleSubmit = async () => {
    if (!type || !description || !location) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs requis.");
      return;
    }

    try {
      const response = await authFetch("http://192.168.1.108:8080/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description,
          localisation: `${location.latitude},${location.longitude}`,
          date: date.toISOString(),
          reclame: false,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        Alert.alert("Erreur", `Erreur serveur: ${err}`);
        return;
      }

      Alert.alert("Succès", "Formulaire soumis ✅");

      // Reset form
      setType("");
      setDescription("");
      setLocation(null);
      setDate(new Date());
    } catch (error) {
      Alert.alert("Erreur", "Impossible de contacter le serveur.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Déclarer un objet</Text>

      <Text style={styles.label}>Type d'objet</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={type} onValueChange={(val) => setType(val)}>
          <Picker.Item label="Sélectionner..." value="" />
          <Picker.Item label="Objet perdu" value="PERDU" />
          <Picker.Item label="Objet trouvé" value="TROUVE" />
        </Picker>
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="Décrivez l'objet..."
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Localisation</Text>
      {location ? (
        <Text style={styles.locationText}>
          Latitude : {location.latitude.toFixed(4)}, Longitude : {location.longitude.toFixed(4)}
        </Text>
      ) : (
        <Text style={styles.locationText}>Localisation non disponible</Text>
      )}

      <Text style={styles.label}>Date de perte / découverte</Text>
      <Button title="Choisir une date" onPress={() => setShowDatePicker(true)} />
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            if (selectedDate) setDate(selectedDate);
            setShowDatePicker(false);
          }}
        />
      )}
      <Text style={styles.dateText}>Date sélectionnée : {date.toLocaleDateString()}</Text>

      <Button title="Envoyer" onPress={handleSubmit} color="#2e86de" />

      <Pressable style={styles.backButton} onPress={() => router.replace("/")}>
        <Text style={styles.backText}>← Retour à l'accueil</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: { fontWeight: "600", marginTop: 20, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
  },
  pickerWrapper: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6 },
  locationText: { marginTop: 8, fontStyle: "italic" },
  dateText: { marginVertical: 10 },
  backButton: { marginTop: 30, alignItems: "center" },
  backText: { color: "#2e86de", fontWeight: "bold" },
});
