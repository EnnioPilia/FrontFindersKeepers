// app/found.tsx
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Found() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Found Items' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Found Items</Text>

        {/* <Pressable style={styles.button} onPress={() => router.push('/home/home')}>
          <Text style={styles.buttonText}>Retour à l'accueil</Text>
        </Pressable> */}
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
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 40 
  },
  button: {
    backgroundColor: '#2e86de',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
    width: '70%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
