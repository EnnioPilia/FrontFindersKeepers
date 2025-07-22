import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import authFetch from "../utils/authFetch";

const photosDir = FileSystem.documentDirectory + "photos/";

async function ensurePhotosDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(photosDir);
  if (!dirInfo.exists) {
    console.log("Création du dossier photos...");
    await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
  }
}

async function savePhotoToPhotosDir(uri: string) {
  try {
    await ensurePhotosDirExists();
    const parts = uri.split("/");
    const filename = parts.length > 0 ? parts[parts.length - 1] : `photo_${Date.now()}.jpg`;
    const dest = photosDir + filename;
    console.log(`Copie de la photo de ${uri} vers ${dest}`);
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch (error) {
    console.error("Erreur sauvegarde photo:", error);
    Alert.alert("Erreur", "Impossible de sauvegarder la photo localement.");
    return null;
  }
}

async function compressImage(uri: string) {
  try {
    console.log("Compression de l'image :", uri);
    const manipulatedResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );
    console.log("Image compressée :", manipulatedResult.uri);
    return manipulatedResult.uri;
  } catch (error) {
    console.error("Erreur compression image :", error);
    return uri;
  }
}

export default function ObjectEdit() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;

  console.log("Paramètre id reçu :", id);

  const [name, setName] = useState("");
  const [type, setType] = useState<"PERDU" | "TROUVE" | "">("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      console.log("id non défini, on attend...");
      return;
    }

    async function fetchObject() {
      setLoading(true);
      console.log("Chargement de l'objet avec id =", id);
      try {
        const res = await authFetch(`http://192.168.1.26:8080/objects/${id}`);
        console.log("Réponse API status :", res.status);
        if (!res.ok) throw new Error("Erreur chargement objet");
        const data = await res.json();
        console.log("Données reçues :", data);

        setName(data.name || "");
        setType(data.type || "");
        setDescription(data.description || "");

        if (data.localisation) {
          const [lat, lon] = data.localisation.split(",").map(Number);
          const initialRegion = {
            latitude: lat,
            longitude: lon,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(initialRegion);
          setLocation({ latitude: lat, longitude: lon });
          console.log("Localisation définie :", lat, lon);
        }

        if (data.date) {
          setDate(new Date(data.date));
          console.log("Date définie :", data.date);
        }

        if (data.photoPath) {
          setPhotoUri(data.photoPath);
          console.log("Photo définie :", data.photoPath);
        }
      } catch (e: any) {
        console.error("Erreur lors du fetch :", e);
        Alert.alert("Erreur", e.message);
      } finally {
        setLoading(false);
        console.log("Chargement terminé.");
      }
    }

    fetchObject();
  }, [id]);

  const onMarkerDragEnd = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    console.log("Marker déplacé à :", coords);
    setLocation(coords);
  };

  const takePhoto = async () => {
    console.log("Demande permission caméra...");
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== "granted") {
      Alert.alert("Permission refusée", "L’accès à la caméra est requis.");
      return;
    }

    console.log("Ouverture caméra...");
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.1,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      console.log("Photo prise :", result.assets[0].uri);
      const compressedUri = await compressImage(result.assets[0].uri);
      const localUri = await savePhotoToPhotosDir(compressedUri);
      if (localUri) {
        setPhotoUri(localUri);
        console.log("Photo enregistrée localement :", localUri);
      } else {
        Alert.alert("Erreur", "Impossible de sauvegarder la photo localement.");
      }
    }
  };

  const pickImage = async () => {
    console.log("Demande permission galerie...");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "L’accès à la galerie est requis.");
      return;
    }

    console.log("Ouverture galerie...");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      console.log("Image sélectionnée :", result.assets[0].uri);
      const compressedUri = await compressImage(result.assets[0].uri);
      const localUri = await savePhotoToPhotosDir(compressedUri);
      if (localUri) {
        setPhotoUri(localUri);
        console.log("Photo enregistrée localement :", localUri);
      } else {
        Alert.alert("Erreur", "Impossible de sauvegarder la photo localement.");
      }
    }
  };

  const handleSubmit = async () => {
    if (!id) {
      Alert.alert("Erreur", "ID de l'objet manquant");
      return;
    }
    if (!name || !type || !description || !location) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs requis.");
      return;
    }

    setSaving(true);
    console.log("Envoi des données modifiées au serveur...");

    const dataToSend = {
      name,
      type,
      description,
      localisation: `${location.latitude},${location.longitude}`,
      date: date.toISOString(),
      photoPath: photoUri,
      reclame: false,
    };

    try {
      const response = await authFetch(`http://192.168.1.26:8080/objects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      console.log("Réponse serveur pour PUT:", response.status);
      if (!response.ok) {
        const err = await response.text();
        Alert.alert("Erreur", `Erreur serveur: ${err}`);
        return;
      }

      Alert.alert("Succès", "Objet modifié ✅");
      router.push("/objectForm/allObjects");
    } catch (error) {
      console.error("Erreur réseau lors du PUT:", error);
      Alert.alert("Erreur", "Impossible de contacter le serveur.");
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Modifier un objet</Text>

      <Text style={styles.label}>Nom de l'objet</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom de l'objet"
        value={name}
        onChangeText={setName}
      />

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

      <Text style={styles.label}>Photo</Text>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.image} />
      ) : (
        <Text style={{ color: "#999", marginBottom: 10 }}>Aucune photo sélectionnée</Text>
      )}
      <Button title="📷 Prendre une photo" onPress={takePhoto} />
      <Button title="🖼️ Choisir depuis la galerie" onPress={pickImage} />

      <Text style={styles.label}>Localisation</Text>
      {region ? (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {location && <Marker coordinate={location} draggable onDragEnd={onMarkerDragEnd} />}
        </MapView>
      ) : (
        <Text style={styles.locationText}>Chargement de la carte...</Text>
      )}

      {location && (
        <Text style={styles.locationText}>
          Latitude : {location.latitude.toFixed(4)}, Longitude : {location.longitude.toFixed(4)}
        </Text>
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

      <Button title={saving ? "Enregistrement..." : "Enregistrer"} onPress={handleSubmit} disabled={saving} />

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
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
    marginBottom: 10,
  },
  map: {
    height: 300,
    width: "100%",
    marginVertical: 10,
  },
  locationText: { marginTop: 8, fontStyle: "italic", textAlign: "center" },
  dateText: { marginVertical: 10, textAlign: "center" },
  backButton: { marginTop: 30, alignItems: "center" },
  backText: { color: "#2e86de", fontWeight: "bold" },
});
