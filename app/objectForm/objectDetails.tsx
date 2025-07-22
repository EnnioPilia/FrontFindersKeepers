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
import jwtDecode from 'jwt-decode';
import authFetch from '../utils/authFetch';
import MapView, { Marker } from 'react-native-maps';

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

  const isOwner = object && currentUserEmail && object.owner?.email === currentUserEmail;

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

  let latitude: number | null = null;
  let longitude: number | null = null;
  if (object.localisation) {
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

        {!isOwner && (
          <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
            <Text style={styles.contactButtonText}>Contacter</Text>
          </TouchableOpacity>
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
    height: Dimensions.get('window').width, // carré
    borderRadius: 0,
    backgroundColor: '#eee',
    marginBottom: 20,
    // marginTop supprimé ici
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
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  map: {
    height: 180,
    borderRadius: 15,
    marginTop: 15,
    marginBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

});
