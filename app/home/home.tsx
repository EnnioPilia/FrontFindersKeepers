// app/home.tsx
import {
  Text,
  StyleSheet,
  Pressable,
  View,
  ImageBackground,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const backgroundImage = { uri: 'https://images.unsplash.com/photo-1751860186520-96f61a6cc975?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' };

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Finders Keepers' }} />
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.container}>
          <Text style={styles.title}>Finders Keepers</Text>

          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.description}>
                Trouvez et postez facilement des objets trouvés près de chez vous.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push('/objectForm/objectForm')}
            >
              <Text style={styles.buttonText}>Poster une annonce</Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </>
  );
}

const WIDTH = '90%';

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  container: {
    flex: 1,
    paddingTop: 120,
    paddingBottom: 40, // Ajouté pour remonter légèrement le contenu centré
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
    color: '#f0f0f0',
    letterSpacing: 2,
    marginBottom: 30,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 253, 240, 0.85)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    width: WIDTH,
    shadowColor: '#bfb5a7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(220, 210, 190, 0.6)',
  },
  description: {
    fontSize: 18,
    color: '#5a533e',
    textAlign: 'center',
    lineHeight: 26,
  },
  button: {
    backgroundColor: '#81c784',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 20,
    shadowColor: '#558b2f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#f1f8e9',
    fontWeight: '700',
    fontSize: 20,
  },
});
