// app/home.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Finders Keepers' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Finders Keepers</Text>

        <Pressable style={styles.button} onPress={() => router.push('/lost/lost')}>
          <Text style={styles.buttonText}>Objet Perdu</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => router.push('/found/found')}>
          <Text style={styles.buttonText}>Objet Trouvé</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 40 
  },
  button: {
    backgroundColor: '#2e86de',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
    width: '60%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
});
