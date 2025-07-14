import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function Verify() {
const { token } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setMessage('Token manquant');
      setLoading(false);
      return;
    }

    const verifyAccount = async () => {
      try {
        const response = await fetch(`http://localhost:8080/auth/verify?token=${token}`);
        const text = await response.text();
        setMessage(text);
      } catch (error) {
        setMessage('Erreur réseau. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    verifyAccount();
  }, [token]);

  return (
    <View style={styles.container}>
      {loading ? (
        <>
          <ActivityIndicator size="large" />
          <Text style={styles.message}>Activation en cours...</Text>
        </>
      ) : (
        <>
          <Text style={styles.message}>{message}</Text>
          <Pressable style={styles.button} onPress={() => router.replace('/auth/login')}>
            <Text style={styles.buttonText}>Aller à la connexion</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { fontSize: 18, textAlign: 'center', marginBottom: 24 },
  button: {
    backgroundColor: '#2e86de',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
