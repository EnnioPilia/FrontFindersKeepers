import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import authFetch from '../utils/authFetch';

interface ObjectDetail {
  id: number;
  name: string | null;
  description: string;
  photoPath: string | null;
  localisation: string;
  date: string;
  type: 'PERDU' | 'TROUVE';
  reclame: boolean;
}

export default function ObjectDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [object, setObject] = useState<ObjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoExists, setPhotoExists] = useState(false);

  useEffect(() => {
    if (!id) {
      Alert.alert('Erreur', "Aucun identifiant d'objet fourni.");
      router.back();
      return;
    }

    const fetchObjectDetails = async () => {
      try {
        const response = await authFetch(`http://192.168.1.108:8080/objects/${id}`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Erreur inconnue');
        }
        const data = await response.json();
        setObject(data);

        if (data.photoPath) {
          const info = await FileSystem.getInfoAsync(data.photoPath);
          setPhotoExists(info.exists);
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        Alert.alert('Erreur', 'Impossible de charger les détails de l’objet.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchObjectDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e86de" />
      </View>
    );
  }

  if (!object) {
    return (
      <View style={styles.center}>
        <Text>Détails indisponibles.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {photoExists ? (
        <Image source={{ uri: object.photoPath! }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Text style={{ color: '#999' }}>Pas d’image disponible</Text>
        </View>
      )}
      <Text style={styles.title}>{object.name ?? 'Sans nom'}</Text>
      <Text style={styles.type}>{object.type}</Text>
      <Text style={styles.label}>Description :</Text>
      <Text style={styles.description}>{object.description}</Text>
      <Text style={styles.label}>Localisation :</Text>
      <Text style={styles.meta}>{object.localisation}</Text>
      <Text style={styles.label}>Date :</Text>
      <Text style={styles.meta}>{new Date(object.date).toLocaleString()}</Text>
      <Text style={styles.label}>Réclamé :</Text>
      <Text style={styles.meta}>{object.reclame ? 'Oui' : 'Non'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    backgroundColor: '#ccc',
    marginBottom: 20,
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  type: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2e86de',
  },
  label: {
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    color: '#333',
  },
  meta: {
    fontSize: 14,
    color: '#666',
  },
});
