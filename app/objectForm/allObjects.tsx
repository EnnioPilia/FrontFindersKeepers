import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import authFetch from '../utils/authFetch';

interface ObjectItem {
  id: number;
  name: string | null;
  description: string;

  photoPath: string;

  localisation: string;
  date: string;
  type: 'PERDU' | 'TROUVE';
}

const photosDir = FileSystem.documentDirectory + 'photos/';

async function listPhotosDir(): Promise<string[]> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(photosDir);
    if (!dirInfo.exists) {
      console.log('Dossier photos n existe pas');
      return [];
    }
    const files = await FileSystem.readDirectoryAsync(photosDir);
    console.log('Fichiers dans photosDir:', files);
    return files;
  } catch (error) {
    console.error('Erreur lecture dossier photos:', error);
    return [];
  }
}

export default function AllObjects() {
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoFiles, setPhotoFiles] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const response = await authFetch('http://192.168.1.108:8080/objects');
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Erreur inconnue');
        }
        const data = await response.json();
        console.log('Données reçues :', data);
        setObjects(data);
      } catch (err) {
        console.error('Erreur lors du chargement :', err);
      } finally {
        setLoading(false);
      }
    };

    fetchObjects();

    const checkPhotos = async () => {
      const files = await listPhotosDir();
      setPhotoFiles(files);
    };
    checkPhotos();
  }, []);

  const renderItem = ({ item }: { item: ObjectItem }) => {
    const validImage = item.photoPath && item.photoPath.startsWith('file://');

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/objectForm/objectDetails',
            params: { id: item.id.toString() },
          })
        }
      >
        {validImage ? (
          <Image source={{ uri: item.photoPath }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <Text style={{ color: '#999' }}>Pas d image</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.title}>
            {item.name ?? 'Sans nom'} ({item.type})
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.meta}>📍 {item.localisation}</Text>
          <Text style={styles.meta}>🕒 {new Date(item.date).toLocaleString()}</Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e86de" />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={objects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

    </>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    gap: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImage: {
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  description: {
    color: '#555',
    fontSize: 14,
    marginVertical: 4,
  },
  meta: {
    fontSize: 12,
    color: '#888',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoList: {
    padding: 10,
    backgroundColor: '#fafafa',
  },
});
