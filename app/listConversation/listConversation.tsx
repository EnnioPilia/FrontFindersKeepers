import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import authFetch from "../utils/authFetch";
import { useRouter } from "expo-router";

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

interface Conversation {
  id: number;
  nom: string;
  user1: User;
  user2: User;
}

export default function ConversationsList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Token non trouvé");
        const decoded = jwtDecode<any>(token);
        if (!decoded.sub) throw new Error("Email introuvable dans token");
        setCurrentUserEmail(decoded.sub);
      } catch (err: any) {
        Alert.alert("Erreur", err.message);
        setLoading(false);
      }
    };
    fetchUserEmail();
  }, []);

  useEffect(() => {
    if (!currentUserEmail) return;

    const fetchConversations = async () => {
      try {
        const response = await authFetch(
          "http://192.168.1.26:8080/conversation/user"
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Erreur lors du chargement");
        }
        const data = await response.json();
        setConversations(data);
      } catch (err: any) {
        Alert.alert("Erreur", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUserEmail]);

  const openConversation = (id: number) => {
    router.push({
      pathname: "/conversation/conversation",
      params: { conversationId: id.toString() },
    });
  };

  const colors = [
    "#90caf9", // bleu pastel
    "#ffcc80", // orange pastel
    "#a5d6a7", // vert pastel
    "#ce93d8", // violet pastel
    "#ffab91", // corail pastel
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e86de" />
        <Text style={styles.loadingText}>Chargement des conversations...</Text>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Aucune conversation disponible.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const otherUser =
            item.user1.email === currentUserEmail ? item.user2 : item.user1;

          const backgroundColor = colors[index % colors.length];

          return (
            <Pressable
              style={({ pressed }) => [
                styles.item,
                { backgroundColor },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => openConversation(item.id)}
            >
              <View style={styles.capsuleContainer}>
                <View style={styles.textContainer}>
                  <Text style={[styles.name, { color: "white" }]}>
                    {otherUser.prenom.trim()} {otherUser.nom.trim()}
                  </Text>
                  <Text style={[styles.email, { color: "white" }]}>
                    {otherUser.email}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
  },
  emptyText: {
    fontSize: 18,
    color: "#888",
  },
  list: {
    paddingBottom: 20,
  },
  item: {
    borderRadius: 12,
    marginBottom: 14,
    // ombre légère (fonctionne mieux sur fond clair, tu peux ajuster ou enlever si besoin)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  capsuleContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  textContainer: {
    flexShrink: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  email: {
    fontSize: 14,
    marginTop: 2,
  },
});
