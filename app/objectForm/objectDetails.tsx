import { useEffect, useState } from 'react';

import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Button,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
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

  owner: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  } | null;

}

export default function ObjectDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [object, setObject] = useState<ObjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoExists, setPhotoExists] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
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

  const isOwner = object && currentUserEmail && object.owner?.email === currentUserEmail;

  const handleMarkAsClaimed = () => {
    if (!object) return;

    Alert.alert(
      'Confirmation',
      "Voulez-vous marquer cet objet comme réclamé ?",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setUpdating(true);
            try {
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
              Alert.alert('Succès', "Objet marqué comme réclamé.");
            } catch (error: any) {
              Alert.alert('Erreur', `Impossible de mettre à jour : ${error.message}`);
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

      {/* Bouton Contacter, visible uniquement si ce n’est pas le propriétaire */}
      {!isOwner && (
        <View style={styles.contactButton}>
          <Button title="Contacter" onPress={handleContact} color="#2e86de" />
        </View>
      )}

      {/* Bouton Mettre fin à la conversation, visible uniquement pour le propriétaire si non réclamé */}
      {isOwner && !object.reclame && (
        <View style={{ marginTop: 20 }}>
          <Button
            title={updating ? "Mise à jour..." : "Mettre fin à la conversation"}
            color="#d9534f"
            onPress={handleMarkAsClaimed}
            disabled={updating}
          />
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: { padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  image: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    backgroundColor: '#ccc',
    marginBottom: 20,
  },

  noImage: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  type: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#2e86de' },
  label: { fontWeight: '700', marginTop: 12, marginBottom: 4 },
  description: { fontSize: 16, color: '#333' },
  meta: { fontSize: 14, color: '#666' },
  contactButton: { marginTop: 30 },

});
