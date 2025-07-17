import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authFetch from '../utils/authFetch';

interface Message {
  id: number;
  senderId: number;
  contenu: string;
  dateEnvoi: string;
}

interface TokenPayload {
  sub: string; // ou autre champ qui contient l'id utilisateur selon ton token
  // ajoute ici d'autres champs si besoin
}

export default function Conversation() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const getUserIdFromToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode<TokenPayload>(token);
          // Ici tu adaptes selon ton token, par exemple si id est dans sub
          const id = Number(decoded.sub);
          setCurrentUserId(id);
        }
      } catch (error) {
        console.error('Erreur décodage token:', error);
      }
    };
    getUserIdFromToken();
  }, []);

  useEffect(() => {
    if (!conversationId) {
      Alert.alert('Erreur', 'Aucun ID de conversation fourni.');
      return;
    }

    const fetchMessages = async () => {
      try {
        const response = await authFetch(
          `http://192.168.1.108:8080/messages/conversation/${conversationId}`
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Erreur inconnue lors du chargement des messages.');
        }
        const data = await response.json();
        setMessages(data);
      } catch (error: any) {
        Alert.alert('Erreur', `Impossible de charger les messages : ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId]);

  const sendMessage = async () => {
    if (newMessage.trim().length === 0) return;

    setSending(true);

    try {
      const response = await authFetch(
        `http://192.168.1.108:8080/messages/send/${conversationId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contenu: newMessage.trim(), // senderId géré côté backend via token
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erreur inconnue lors de l’envoi du message.');
      }

      const savedMessage = await response.json();
      setMessages((prev) => [...prev, savedMessage]);
      setNewMessage('');

      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error: any) {
      Alert.alert('Erreur', `Impossible d’envoyer le message : ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading || currentUserId === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e86de" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isMine = item.senderId === currentUserId;
          return (
            <View
              style={[
                styles.messageContainer,
                isMine ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  isMine ? { color: '#fff' } : { color: '#000' },
                ]}
              >
                {item.contenu}
              </Text>
              <Text style={styles.messageDate}>
                {new Date(item.dateEnvoi).toLocaleTimeString()}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Écrire un message..."
          value={newMessage}
          onChangeText={setNewMessage}
          editable={!sending}
        />
        <Button title="Envoyer" onPress={sendMessage} disabled={sending} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { padding: 16, paddingBottom: 10 },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
    borderRadius: 10,
    padding: 10,
  },
  myMessage: {
    backgroundColor: '#2e86de',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#eee',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  messageDate: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    color: '#000',
  },
});
