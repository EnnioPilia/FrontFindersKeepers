import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { Picker } from "@react-native-picker/picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import authFetch from "../utils/authFetch";

const photosDir = FileSystem.documentDirectory + "photos/";

async function ensurePhotosDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(photosDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
  }
}

async function savePhotoToPhotosDir(uri: string) {
  try {
    await ensurePhotosDirExists();
    const parts = uri.split("/");
    const filename =
      parts.length > 0 ? parts[parts.length - 1] : `photo_${Date.now()}.jpg`;
    const dest = photosDir + filename;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    Alert.alert("Erreur", "Impossible de sauvegarder la photo localement.");
    return null;
  }
}

async function compressImage(uri: string) {
  try {
    const manipulatedResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulatedResult.uri;
  } catch {
    return uri;
  }
}

export default function ObjectEdit() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [type, setType] = useState<"PERDU" | "TROUVE" | "">("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchObject() {
      setLoading(true);
      try {
        const res = await authFetch(`http://192.168.1.26:8080/objects/${id}`);
        if (!res.ok) throw new Error("Erreur chargement objet");
        const data = await res.json();

        setName(data.name || "");
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
        }

        setDate(data.date ? new Date(data.date) : new Date());
        setType(data.type || "");
        setPhotoUri(data.photoPath || null);
      } catch (e: any) {
        Alert.alert("Erreur", e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchObject();
  }, [id]);

  const onMarkerDragEnd = (e: any) => {
    setLocation(e.nativeEvent.coordinate);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "L’accès à la galerie est requis.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const compressedUri = await compressImage(result.assets[0].uri);
      const localUri = await savePhotoToPhotosDir(compressedUri);
      if (localUri) setPhotoUri(localUri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "L’accès à la caméra est requis.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const compressedUri = await compressImage(result.assets[0].uri);
      const localUri = await savePhotoToPhotosDir(compressedUri);
      if (localUri) setPhotoUri(localUri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim() || !location || !type) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSaving(true);

    const dataToSend = {
      name,
      description,
      localisation: location ? `${location.latitude},${location.longitude}` : "",
      date: date.toISOString(),
      type,
      photoPath: photoUri,
      reclame: false,
    };

    try {
      const response = await authFetch(
        id ? `http://192.168.1.26:8080/objects/${id}` : "http://192.168.1.26:8080/objects",
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        Alert.alert("Erreur", `Erreur serveur : ${err}`);
        return;
      }

      Alert.alert("Succès", id ? "Objet modifié" : "Objet créé");
      router.push("/objectForm/allObjects");
    } catch {
      Alert.alert("Erreur", "Impossible de contacter le serveur.");
    } finally {
      setSaving(false);
    }
  };

  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);

  const handleConfirm = (selectedDate: Date) => {
    if (selectedDate > new Date()) {
      Alert.alert("Erreur", "La date ne peut pas être dans le futur.");
      hideDatePicker();
      return;
    }
    setDate(selectedDate);
    hideDatePicker();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e86de" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Photo de l'objet</Text>

      <View style={styles.photoContainer}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <View
            style={[
              styles.photo,
              { backgroundColor: "#eee", justifyContent: "center", alignItems: "center" },
            ]}
          >
            <Text style={{ color: "#999" }}>Aucune photo</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Prendre une photo</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Télécharger</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Détails de l'objet</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom de l'objet"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: "top" }]}
        multiline
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.sectionTitle}>Localisation</Text>

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
        <Text style={styles.loadingMapText}>Chargement de la carte...</Text>
      )}

      {location && (
        <Text style={styles.locationText}>
          Latitude : {location.latitude.toFixed(4)}, Longitude : {location.longitude.toFixed(4)}
        </Text>
      )}

      <Text style={styles.sectionTitle}>Date</Text>

      <Pressable style={styles.input} onPress={showDatePicker}>
        <Text style={{ color: "#000", fontSize: 16 }}>{date.toLocaleDateString()}</Text>
      </Pressable>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        maximumDate={new Date()}
      />

      <Text style={styles.sectionTitle}>Type</Text>

      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={type}
          onValueChange={(val) => setType(val)}
          mode="dropdown"
          style={styles.picker}
        >
          <Picker.Item label="Sélectionner..." value="" />
          <Picker.Item label="Perdu" value="PERDU" />
          <Picker.Item label="Trouvé" value="TROUVE" />
        </Picker>
      </View>

      <Pressable
        style={[styles.submitButton, saving && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={saving}
      >
        <Text style={styles.submitButtonText}>
          {saving ? "Enregistrement..." : "Soumettre"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 20,
    marginBottom: 12,
    color: "#1c1c1e",
  },
  photoContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  photo: {
    width: "100%",
    height: 180,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  button: {
    flex: 1,
    backgroundColor: "#f2f2f7",
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 6,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#1c1c1e",
  },
  input: {
    backgroundColor: "#f2f2f7",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#3a3a3c",
    marginBottom: 16,
  },
  map: {
    height: 300,
    width: "100%",
    marginVertical: 10,
    borderRadius: 12,
  },
  loadingMapText: {
    textAlign: "center",
    color: "#999",
    marginBottom: 12,
  },
  locationText: {
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 20,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  submitButton: {
    backgroundColor: "#007aff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    fontWeight: "700",
    fontSize: 18,
    color: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
