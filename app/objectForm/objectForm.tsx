import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";

export default function ObjectForm() {
  const router = useRouter();

  const [type, setType] = useState<"perdu" | "trouve" | "">("");
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Demander permission localisation
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission refusée", "L’accès à la caméra est requis.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!type || !description || !photoUri || !location) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs requis.");
      return;
    }

    Alert.alert("Succès", "Formulaire soumis ✅");

    // TODO: envoyer à une API ici

    // Réinitialiser
    setType("");
    setDescription("");
    setPhotoUri(null);
    setLocation(null);
    setDate(new Date());
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Déclarer un objet</Text>

      <Text style={styles.label}>Type d'objet</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={type} onValueChange={(val) => setType(val)}>
          <Picker.Item label="Sélectionner..." value="" />
          <Picker.Item label="Objet perdu" value="perdu" />
          <Picker.Item label="Objet trouvé" value="trouve" />
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

      <Text style={styles.label}>Photo</Text>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={{ color: "#999" }}>Aucune photo sélectionnée</Text>
        </View>
      )}
      <View style={styles.row}>
        <Button title="📷 Prendre une photo" onPress={takePhoto} />
        <Button title="🖼️ Choisir depuis la galerie" onPress={pickImage} />
      </View>

      <Text style={styles.label}>Localisation</Text>
      {location ? (
        <Text style={styles.locationText}>
          Latitude : {location.latitude.toFixed(4)}, Longitude :{" "}
          {location.longitude.toFixed(4)}
        </Text>
      ) : (
        <Text style={styles.locationText}>Localisation non disponible</Text>
      )}

      <Text style={styles.label}>Date de perte / découverte</Text>
      <Button
        title="Choisir une date"
        onPress={() => setShowDatePicker(true)}
      />
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
      <Text style={styles.dateText}>
        Date sélectionnée : {date.toLocaleDateString()}
      </Text>

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
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  imagePlaceholder: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  locationText: { marginTop: 8, fontStyle: "italic" },
  dateText: { marginVertical: 10 },
  backButton: { marginTop: 30, alignItems: "center" },
  backText: { color: "#2e86de", fontWeight: "bold" },
});
