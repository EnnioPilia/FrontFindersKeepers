import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import authFetch from '../utils/authFetch';
import { useRouter } from 'expo-router';

interface Conversation {
  id: number;
  user1: {
    id: number;
    email: string;
  };
  user2: {
    id: number;
    email: string;
  };
  // ajoute d’autres champs si besoin (titre, dernier message...)
}

export default function ConversationsList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Token non trouvé');
        const decoded = jwtDecode<any>(token);
        if (!decoded.sub) throw new Error('Email introuvable dans token');
        setCurrentUserEmail(decoded.sub);
      } catch (err: any) {
        Alert.alert('Erreur', err.message);
        setLoading(false);
      }
    };
    fetchUserEmail();
  }, []);

  useEffect(() => {
    if (!currentUserEmail) return;

    const fetchConversations = async () => {
      try {
        const response = await authFetch('http://192.168.1.108:8080/conversation/user');
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Erreur lors du chargement');
        }
        const data = await response.json();
        setConversations(data);
      } catch (err: any) {
        Alert.alert('Erreur', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUserEmail]);

  const openConversation = (id: number) => {
    router.push({
      pathname: '/conversation/conversation',
      params: { conversationId: id.toString() },
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e86de" />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.center}>
        <Text>Aucune conversation disponible.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const otherUser =
          item.user1.email === currentUserEmail ? item.user2 : item.user1;
        return (
          <Pressable
            style={styles.item}
            onPress={() => openConversation(item.id)}
          >
            <Text style={styles.itemText}>
              Conversation avec {otherUser.email}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  item: {
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemText: { fontSize: 16, fontWeight: '600' },
});
