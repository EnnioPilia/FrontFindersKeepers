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
  Pressable,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authFetch from '../utils/authFetch';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface Message {
  id: number;
  sender: {
    email: string;
  };
  contenu: string;
  dateEnvoi: string;
}

interface Objet {
  id: number;
  owner: {
    email: string;
    // autres champs si besoin
  };
  // autres champs si besoin
}

export default function Conversation() {
  const { conversationId, objectId } = useLocalSearchParams<{ conversationId: string; objectId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [objet, setObjet] = useState<Objet | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const getUserEmailFromToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Erreur', 'Token non trouvé. Veuillez vous reconnecter.');
          return;
        }
        const decoded = jwtDecode<any>(token);
        const userEmail = decoded.sub;
        if (!userEmail || typeof userEmail !== 'string') {
          Alert.alert('Erreur', "L'email utilisateur n'est pas présent dans le token.");
          return;
        }
        setCurrentUserEmail(userEmail);
      } catch (error: any) {
        Alert.alert('Erreur', 'Impossible de décoder le token. Veuillez vous reconnecter.');
      }
    };
    getUserEmailFromToken();
  }, []);

  useEffect(() => {
    if (!conversationId || currentUserEmail === null) return;

    const fetchMessagesAndObject = async () => {
      setLoading(true);
      try {
        const resMessages = await authFetch(`http://192.168.1.26:8080/messages/conversation/${conversationId}`);
        if (!resMessages.ok) {
          throw new Error(await resMessages.text());
        }
        const messagesData = await resMessages.json();
        setMessages(messagesData);

        if (objectId) {
          const resObject = await authFetch(`http://192.168.1.26:8080/objects/${objectId}`);
          if (!resObject.ok) {
            throw new Error(await resObject.text());
          }
          const objetData = await resObject.json();
          setObjet(objetData);
        }
      } catch (error: any) {
        Alert.alert('Erreur', `Chargement impossible : ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMessagesAndObject();
  }, [conversationId, currentUserEmail, objectId]);

  const sendMessage = async () => {
    if (newMessage.trim().length === 0) return;

    setSending(true);
    try {
      const response = await authFetch(`http://192.168.1.26:8080/messages/send/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: newMessage.trim() }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const savedMessage = await response.json();
      setMessages((prev) => [...prev, savedMessage]);
      setNewMessage('');
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error: any) {
      Alert.alert('Erreur', `Impossible d'envoyer le message : ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const endConversation = async () => {
    if (!objet) return;
    Alert.alert(
      'Confirmation',
      "Voulez-vous mettre fin à la conversation et marquer l'objet comme réclamé ?",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const response = await authFetch(`http://192.168.1.26:8080/objects/${objet.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reclame: true }),
              });

              if (!response.ok) {
                throw new Error(await response.text());
              }

              Alert.alert('Succès', "L'objet a été marqué comme réclamé.");
            } catch (error: any) {
              Alert.alert('Erreur', `Impossible de mettre fin à la conversation : ${error.message}`);
            }
          },
        },
      ]
    );
  };

  if (loading || currentUserEmail === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e86de" />
      </View>
    );
  }

  const isOwner = objet && objet.owner?.email === currentUserEmail;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {isOwner && (
        <View style={styles.endConversationContainer}>
          <Button title="Mettre fin à la conversation" color="#d9534f" onPress={endConversation} />
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isMine = item.sender.email === currentUserEmail;

          const handleDelete = () => {
            Alert.alert(
              'Confirmation',
              'Voulez-vous vraiment supprimer ce message ?',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const response = await authFetch(`http://192.168.1.26:8080/messages/${item.id}`, {
                        method: 'DELETE',
                      });
                      if (!response.ok) {
                        throw new Error(await response.text());
                      }
                      setMessages((prev) => prev.filter((m) => m.id !== item.id));
                    } catch (error: any) {
                      Alert.alert('Erreur', `Impossible de supprimer le message : ${error.message}`);
                    }
                  },
                },
              ],
              { cancelable: true }
            );
          };

          return (
            <View style={[styles.messageContainer, isMine ? styles.myMessage : styles.theirMessage]}>
              <Text style={[styles.messageText, isMine ? { color: '#fff' } : { color: '#000' }]}>
                {item.contenu}
              </Text>
              <Text style={styles.messageDate}>{new Date(item.dateEnvoi).toLocaleTimeString()}</Text>
              {isMine && (
                <Pressable onPress={handleDelete} style={styles.deleteIcon}>
                  <MaterialIcons name="delete" size={20} color="#ff5555" />
                </Pressable>
              )}
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
    position: 'relative',
    paddingRight: 30,
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
  deleteIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 4,
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
  endConversationContainer: {
    margin: 10,
  },
});
