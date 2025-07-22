import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Pressable, ActivityIndicator, Dimensions } from 'react-native';
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
  reclame?: boolean;
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

const windowWidth = Dimensions.get('window').width;
const cardMargin = 16;
const cardSize = (windowWidth - cardMargin * 3) / 2; // 2 items per row + margins

export default function AllObjects() {
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const response = await authFetch('http://192.168.1.26:8080/objects');
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Erreur inconnue');
        }
        const data = await response.json();
        const filteredObjects = data.filter((obj: ObjectItem) => !obj.reclame);
        setObjects(filteredObjects);
      } catch (err) {
        console.error('Erreur lors du chargement :', err);
      } finally {
        setLoading(false);
      }
    };

    fetchObjects();
  }, []);

  const renderItem = ({ item }: { item: ObjectItem }) => {
    const validImage = item.photoPath && item.photoPath.startsWith('file://');

    const badgeColor = item.type === 'TROUVE' ? '#28a745' : '#d9534f';
    const badgeText = item.type === 'TROUVE' ? 'Trouvé' : 'Perdu';

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
            <Text style={{ color: '#999' }}>Pas d'image</Text>
          </View>
        )}

        <Text style={styles.name} numberOfLines={2}>
          {item.name ?? 'Sans nom'}
        </Text>

        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>

        <Text style={styles.date}>
          {new Date(item.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
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
    <FlatList
      data={objects}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      numColumns={2}
      key="2"
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: cardMargin,
    paddingTop: 16,
  },
  card: {
    width: cardSize,
    marginHorizontal: cardMargin / 2,
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: cardSize,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  noImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    marginTop: 8,
    fontWeight: '600',
    fontSize: 16,
    color: '#1c1c1e',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 6,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  date: {
    marginTop: 6,
    fontSize: 12,
    color: '#8e8e93',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
