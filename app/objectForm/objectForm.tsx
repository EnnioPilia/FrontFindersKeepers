import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Image,
  StyleSheet,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { Picker } from "@react-native-picker/picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useRouter } from "expo-router";
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
  } catch (error) {
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

export default function ObjectForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [type, setType] = useState<"PERDU" | "TROUVE" | "">("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<
    { latitude: number; longitude: number } | null
  >(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      const initialRegion: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(initialRegion);
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  const onMarkerDragEnd = (e: any) => {
    setLocation(e.nativeEvent.coordinate);
  };

  const takePhoto = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== "granted") {
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

  const handleSubmit = async () => {
    if (!name.trim() || !type || !description.trim() || !location) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSaving(true);

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
      const response = await authFetch("http://192.168.1.26:8080/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const err = await response.text();
        Alert.alert("Erreur", `Erreur serveur : ${err}`);
        return;
      }

      Alert.alert("Succès", "Objet déclaré avec succès.");

      setName("");
      setType("");
      setDescription("");
      setLocation(null);
      setRegion(null);
      setDate(new Date());
      setPhotoUri(null);

      router.push("/objectForm/allObjects");
    } catch {
      Alert.alert("Erreur", "Impossible de contacter le serveur.");
    } finally {
      setSaving(false);
    }
  };

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirm = (selectedDate: Date) => {
    const today = new Date();
    // Compare sans les heures/minutes/secondes pour robustesse
    if (selectedDate.setHours(0,0,0,0) > today.setHours(0,0,0,0)) {
      Alert.alert("Erreur", "La date ne peut pas être dans le futur.");
      hideDatePicker();
      return;
    }
    setDate(selectedDate);
    hideDatePicker();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Déclarer un objet</Text>

      <Text style={styles.label}>Type</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={type}
          onValueChange={setType}
          mode="dropdown"
          style={styles.picker}
        >
          <Picker.Item label="Sélectionner..." value="" />
          <Picker.Item label="Objet perdu" value="PERDU" />
          <Picker.Item label="Objet trouvé" value="TROUVE" />
        </Picker>
      </View>

      <Text style={styles.label}>Nom de l'objet</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom de l'objet"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: "top" }]}
        multiline
        placeholder="Décrivez l'objet..."
        value={description}
        onChangeText={setDescription}
      />

      {/* Ajout marge haute uniquement ici */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Photo de l'objet</Text>
      <View
        style={[
          styles.photoContainer,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: photoUri ? undefined : "#eee",
          },
        ]}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <Text style={{ color: "#999" }}>Aucune photo sélectionnée</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Prendre une photo</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Choisir depuis la galerie</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Localisation</Text>
      <View style={styles.mapContainer}>
        {region ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
          >
            {location && (
              <Marker
                coordinate={location}
                draggable
                onDragEnd={onMarkerDragEnd}
              />
            )}
          </MapView>
        ) : (
          <Text style={styles.loadingMapText}>Chargement de la carte...</Text>
        )}
      </View>

      {location && (
        <Text style={styles.locationText}>
          Latitude : {location.latitude.toFixed(4)}, Longitude :{" "}
          {location.longitude.toFixed(4)}
        </Text>
      )}

      <Text style={styles.sectionTitle}>Date</Text>
      <Pressable style={styles.datePressable} onPress={showDatePicker}>
        <Text style={{ color: "#000", fontSize: 16 }}>
          📅 {date.toLocaleDateString()}
        </Text>
      </Pressable>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        maximumDate={new Date()}
      />

      <Pressable
        style={[styles.submitButton, saving && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={saving}
      >
        <Text style={styles.submitButtonText}>
          {saving ? "Enregistrement..." : "Envoyer"}
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
  label: {
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 20,
    color: "#1c1c1e",
  },
  input: {
    backgroundColor: "#f2f2f7",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#3a3a3c",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  photoContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    marginTop: 12,
    height: 180,
  },
  photo: {
    width: "100%",
    height: "100%",
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
    paddingHorizontal: 12,
    marginHorizontal: 6,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#1c1c1e",
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 10,
  },
  map: {
    height: 300,
    width: "100%",
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
    color: "#3a3a3c",
  },
  datePressable: {
    backgroundColor: "#f2f2f7",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#007aff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 30,
  },
  submitButtonText: {
    fontWeight: "700",
    fontSize: 18,
    color: "#fff",
  },
});
