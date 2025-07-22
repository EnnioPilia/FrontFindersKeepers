import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Switch,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import Toast from "react-native-toast-message";

export default function Register() {
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [acceptedCGU, setAcceptedCGU] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCGUModal, setShowCGUModal] = useState(false);

  const handleRegister = async () => {
    if (!nom || !prenom || !age || !email || !password || !passwordConfirm) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez remplir tous les champs",
        position: "bottom",
      });
      return;
    }

    if (password !== passwordConfirm) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Les mots de passe ne correspondent pas",
        position: "bottom",
      });
      return;
    }

    if (!acceptedCGU) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Vous devez accepter les conditions générales d'utilisation",
        position: "bottom",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://192.168.1.26:8080/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          prenom,
          age: parseInt(age),
          email,
          password,
        }),
      });

      if (response.ok) {
        router.replace({
          pathname: "/auth/login",
          params: { fromRegister: "success" },
        });
      } else {
        const errorData = await response.json();
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: errorData.error || "Une erreur est survenue",
          position: "bottom",
        });
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de se connecter au serveur",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Inscription" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Créer un compte</Text>

        <TextInput
          placeholder="Nom"
          value={nom}
          onChangeText={setNom}
          style={styles.input}
        />
        <TextInput
          placeholder="Prénom"
          value={prenom}
          onChangeText={setPrenom}
          style={styles.input}
        />
        <TextInput
          placeholder="Âge"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          placeholder="Confirmer le mot de passe"
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          secureTextEntry
          style={styles.input}
        />

        <View style={styles.cguContainer}>
          <Switch
            value={acceptedCGU}
            onValueChange={setAcceptedCGU}
            thumbColor={acceptedCGU ? "#27ae60" : "#f4f3f4"}
          />
          <TouchableOpacity
            onPress={() => setShowCGUModal(true)}
            style={{ flex: 1 }}
          >
            <Text
              style={[styles.cguText, { textDecorationLine: "underline", color: "#007AFF" }]}
            >
              J'accepte les conditions générales d'utilisation
            </Text>
          </TouchableOpacity>
        </View>

        <Pressable
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Création en cours..." : "S'inscrire"}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={showCGUModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCGUModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Conditions générales d'utilisation</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={{ marginBottom: 10 }}>
                1. <Text style={{ fontWeight: "700" }}>Objet</Text>  
                Les présentes conditions générales d'utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation du site et des services proposés.
              </Text>
              <Text style={{ marginBottom: 10 }}>
                2. <Text style={{ fontWeight: "700" }}>Accès au service</Text>  
                L'accès au site est réservé aux utilisateurs qui acceptent sans réserve les présentes CGU.
              </Text>
              <Text style={{ marginBottom: 10 }}>
                3. <Text style={{ fontWeight: "700" }}>Propriété intellectuelle</Text>  
                Tous les contenus présents sur le site sont protégés par le droit d'auteur et ne peuvent être utilisés sans autorisation.
              </Text>
              <Text style={{ marginBottom: 10 }}>
                4. <Text style={{ fontWeight: "700" }}>Responsabilité</Text>  
                L'utilisateur utilise les services à ses risques et périls. La responsabilité du site ne saurait être engagée en cas de dommages directs ou indirects.
              </Text>
              <Text style={{ marginBottom: 10 }}>
                5. <Text style={{ fontWeight: "700" }}>Données personnelles</Text>  
                Les données collectées sont traitées conformément à la politique de confidentialité et à la réglementation en vigueur.
              </Text>
              <Text style={{ marginBottom: 10 }}>
                6. <Text style={{ fontWeight: "700" }}>Modification des CGU</Text>  
                Le site se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs sont invités à les consulter régulièrement.
              </Text>
              <Text style={{ marginBottom: 10 }}>
                7. <Text style={{ fontWeight: "700" }}>Loi applicable</Text>  
                Les présentes CGU sont soumises au droit français.
              </Text>
            </ScrollView>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowCGUModal(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#27ae60",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  cguContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cguText: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
    width: "100%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  modalScroll: {
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#27ae60",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
