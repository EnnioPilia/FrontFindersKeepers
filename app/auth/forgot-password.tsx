import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequestReset = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Veuillez entrer votre adresse email',
        position: 'bottom',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.26:8080/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const message = await response.text();

      if (response.ok) {
        // Redirection vers login avec paramètre pour afficher le toast
        router.replace({
          pathname: '/auth/login',
          params: { fromForgotPassword: 'success', message },
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: message,
          position: 'bottom',
        });
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Échec de la requête.',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Réinitialisation' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Mot de passe oublié</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Pressable
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleRequestReset}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Envoi en cours...' : 'Envoyer le lien'}</Text>
        </Pressable>
      </View>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2e86de',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
