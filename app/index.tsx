// npm install @expo/vector-icons <---- ajouter Quentin !!!!!
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function AuthHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finders Keepers</Text>

      <Link href="/auth/login" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Se connecter</Text>
        </Pressable>
      </Link>

      <Link href="/auth/register" asChild>
        <Pressable style={styles.buttonOutline}>
          <Text style={styles.buttonOutlineText}>S'inscrire</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 48,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2e86de',
    paddingVertical: 16,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  buttonOutline: {
    borderWidth: 2,
    borderColor: '#2e86de',
    paddingVertical: 16,
    borderRadius: 10,
  },
  buttonOutlineText: {
    color: '#2e86de',
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
});
