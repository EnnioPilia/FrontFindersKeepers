import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import authFetch from '../utils/authFetch';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

interface ObjectDetail {
  id: number;
  name: string | null;
  description: string;
  photoPath: string | null;
  localisation: string;
  date: string;
  type: 'PERDU' | 'TROUVE';
  reclame: boolean;
  owner: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    avatarUrl?: string;
    reportedDate?: string;
  } | null;
}

export default function ObjectDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [object, setObject] = useState<ObjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoExists, setPhotoExists] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const getUserEmailFromToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        const decoded = jwtDecode<any>(token);
        if (decoded.sub && typeof decoded.sub === 'string') {
          setCurrentUserEmail(decoded.sub);
        }
      } catch {
        // ignore silently
      }
    };
    getUserEmailFromToken();
  }, []);

  useEffect(() => {
    if (!id) {
      Alert.alert('Erreur', "Aucun identifiant d'objet fourni.");
      router.back();
      return;
    }

    const fetchObjectDetails = async () => {
      try {
        const response = await authFetch(`http://192.168.1.26:8080/objects/${id}`);
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
        Alert.alert('Erreur', "Impossible de charger les détails de l’objet.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchObjectDetails();
  }, [id]);

  let latitude: number | null = null;
  let longitude: number | null = null;
  if (object?.localisation) {
    const coords = object.localisation.split(',');
    if (coords.length === 2) {
      const lat = parseFloat(coords[0].trim());
      const lng = parseFloat(coords[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        latitude = lat;
        longitude = lng;
      }
    }
  }

  useEffect(() => {
    const calcDistance = async () => {
      if (latitude === null || longitude === null) return;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permission géolocalisation refusée');
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        const userLat = location.coords.latitude;
        const userLng = location.coords.longitude;

        const dist = getDistanceFromLatLonInKm(userLat, userLng, latitude, longitude);
        setDistanceKm(dist);
      } catch (error) {
        console.warn('Erreur géolocalisation', error);
      }
    };
    calcDistance();
  }, [latitude, longitude]);

  function getDistanceFromLatLonInKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Correction : comparer emails trim() et en lowercase
  const isOwner =
    object &&
    currentUserEmail &&
    object.owner &&
    object.owner.email.trim().toLowerCase() === currentUserEmail.trim().toLowerCase();

  const handleArchiveObject = () => {
    if (!object) return;

    Alert.alert(
      'Confirmation',
      'Voulez-vous archiver cet objet ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setUpdating(true);
              const response = await authFetch(`http://192.168.1.26:8080/objects/${object.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reclame: true }),
              });
              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erreur lors de la mise à jour');
              }
              setObject((prev) => (prev ? { ...prev, reclame: true } : prev));
              Alert.alert('Succès', 'Objet archivé.');
            } catch (error: any) {
              Alert.alert('Erreur', `Impossible d’archiver : ${error.message}`);
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleContact = async () => {
    if (!object?.owner?.email) {
      Alert.alert('Erreur', "Identifiant du propriétaire non disponible");
      return;
    }

    const conversationPayload = {
      user2Id: object.owner.id,
    };

    try {
      const response = await authFetch(
        'http://192.168.1.26:8080/conversation/conversation/getOrCreate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conversationPayload),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Erreur inconnue');
      }

      const conversation = await response.json();

      router.push({
        pathname: '/conversation/conversation',
        params: { conversationId: conversation.id.toString() },
      });
    } catch (error: any) {
      Alert.alert('Erreur', `Impossible de démarrer la conversation: ${error.message}`);
    }
  };

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

  const formattedDate = new Date(object.date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {photoExists ? (
        <Image source={{ uri: object.photoPath! }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Text style={{ color: '#999' }}>Pas d’image disponible</Text>
        </View>
      )}

      <View style={styles.contentWrapper}>
        {object.type && (
          <View
            style={[
              styles.typeBadge,
              object.type === 'PERDU' ? styles.typeLost : styles.typeFound,
            ]}
          >
            <Text style={styles.typeBadgeText}>
              {object.type === 'PERDU' ? 'Objet perdu' : 'Objet trouvé'}
            </Text>
          </View>
        )}

        <Text style={styles.title}>{object.name ?? 'Sans nom'}</Text>

        <Text style={styles.description}>{object.description}</Text>

        <Text style={styles.sectionTitle}>Détails</Text>

        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{formattedDate}</Text>
        </View>

        {distanceKm !== null && (
          <Text style={styles.distanceText}>
            Distance de l'objet : {distanceKm.toFixed(2)} km
          </Text>
        )}

        {latitude !== null && longitude !== null && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={{ latitude, longitude }} />
          </MapView>
        )}

        <View style={{ marginTop: 20 }}>
          {!isOwner && (
            <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
              <Text style={styles.contactButtonText}>Contacter</Text>
            </TouchableOpacity>
          )}

          {isOwner && !object?.reclame && (
            <TouchableOpacity
              style={[styles.archiveButton, styles.contactButton]}
              onPress={handleArchiveObject}
              disabled={updating}
            >
              <Text style={styles.contactButtonText}>
                {updating ? 'Archivage...' : 'Archiver l’objet'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {object.owner && (
          <>
            <Text style={styles.sectionTitle}>Signalé par</Text>
            <View style={styles.reportedBy}>
              <Image
                source={{
                  uri:
                    object.owner.avatarUrl ||
                    'https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.reporterName}>
                  {object.owner.prenom} {object.owner.nom}
                </Text>
                <Text style={styles.reportDate}>
                  Signalé le{' '}
                  {object.owner.reportedDate
                    ? new Date(object.owner.reportedDate).toLocaleDateString()
                    : formattedDate}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 30,
  },
  image: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width,
    borderRadius: 0,
    backgroundColor: '#eee',
    marginBottom: 20,
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    paddingHorizontal: 20,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  typeBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  typeLost: {
    backgroundColor: '#d9534f',
  },
  typeFound: {
    backgroundColor: '#28a745',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111',
  },
  description: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
    lineHeight: 22,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 15,
    color: '#222',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  detailLabel: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  detailValue: {
    color: '#222',
    fontWeight: '500',
    fontSize: 14,
    maxWidth: '60%',
    textAlign: 'right',
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
    color: '#333',
  },
  reportedBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 30,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  reporterName: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111',
  },
  reportDate: {
    color: '#7a7a7a',
    fontSize: 13,
  },
  contactButton: {
    backgroundColor: '#2e86de',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  archiveButton: {
    backgroundColor: '#d9534f',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  map: {
    height: 180,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
