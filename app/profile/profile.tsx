import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import authFetch from "../utils/authFetch";
import { Swipeable } from "react-native-gesture-handler";
import { MaterialIcons } from '@expo/vector-icons';

interface User {
  nom: string;
  prenom: string;
  email: string;
}

interface Item {
  id: number;
  name: string;
  date: string;
  photoPath: string;
  type: "PERDU" | "TROUVE";
  reclame: boolean;
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [foundItems, setFoundItems] = useState<Item[]>([]);
  const [claimedItems, setClaimedItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<"found" | "claimed">("found");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserAndItems() {
      try {
        const userResponse = await authFetch(
          "http://192.168.1.26:8080/users/me"
        );
        if (!userResponse.ok)
          throw new Error("Erreur récupération utilisateur");
        const userData = await userResponse.json();
        setUser(userData);

        const objectsResponse = await authFetch(
          "http://192.168.1.26:8080/objects/me"
        );
        if (!objectsResponse.ok) throw new Error("Erreur récupération objets");
        const objectsData = await objectsResponse.json();

        setFoundItems(objectsData.filter((obj: Item) => !obj.reclame));
        setClaimedItems(objectsData.filter((obj: Item) => obj.reclame));
      } catch (error: any) {
        Alert.alert("Erreur", error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUserAndItems();
  }, []);

  const deleteItem = async (id: number) => {
    try {
      setLoading(true);
      const response = await authFetch(`http://192.168.1.26:8080/objects/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Erreur suppression objet");

      if (tab === "found") {
        setFoundItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        setClaimedItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRightActions = (
    progress: any,
    dragX: any,
    onDelete: () => void
  ) => {
    return (
      <Pressable
        onPress={onDelete}
        style={{
          backgroundColor: "red",
          justifyContent: "center",
          alignItems: "center",
          width: 80,
          height: "100%",
        }}
      >
        <MaterialIcons name="delete" size={32} color="#fff" />
      </Pressable>
    );
  };

  const renderItem = ({ item }: { item: Item }) => {
    const dateLabel = item.type === "PERDU" ? "Perdu le" : "Trouvé le";

    const handleDelete = () => {
      Alert.alert(
        "Confirmation",
        `Voulez-vous vraiment supprimer "${item.name}" ?`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => deleteItem(item.id),
          },
        ]
      );
    };

    return (
      <Swipeable
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, handleDelete)
        }
      >
        <Pressable
          style={styles.itemRow}
          onPress={() => router.push(`/objectForm/objectDetails?id=${item.id}`)}
        >
          <Image source={{ uri: item.photoPath }} style={styles.itemImage} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDate}>
              {dateLabel} {item.date}
            </Text>
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e86de" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Utilisateur non trouvé.</Text>
      </View>
    );
  }

  // Image générique Unsplash portrait
  const avatarUri =
    "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        <Text style={styles.name}>
          {user.prenom} {user.nom}
        </Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tabButton, tab === "found" && styles.activeTab]}
          onPress={() => setTab("found")}
        >
          <Text
            style={[styles.tabText, tab === "found" && styles.activeTabText]}
          >
            Vos objets
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, tab === "claimed" && styles.activeTab]}
          onPress={() => setTab("claimed")}
        >
          <Text
            style={[styles.tabText, tab === "claimed" && styles.activeTabText]}
          >
            Archivés
          </Text>
        </Pressable>
      </View>

      {/* List */}
      <View style={styles.listContainer}>
        {tab === "found" ? (
          <FlatList
            data={foundItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        ) : (
          <FlatList
            data={claimedItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Account */}
      <View style={styles.accountSection}>
        <Pressable
          style={styles.accountRow}
          onPress={() => router.push("/profile/editProfile")}
        >
          <Text style={styles.accountText}>👤 Modifier le profil</Text>
        </Pressable>
        <Pressable
          style={styles.accountRow}
          onPress={() => router.push("/legal/legal")}
        >
          <Text style={styles.accountText}>⚙️ Mentions légales</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  name: { fontWeight: "700", fontSize: 22, marginBottom: 4 },
  email: { color: "#6e7e91", fontSize: 14 },

  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: {
    fontWeight: "600",
    color: "#6e7e91",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderColor: "#222",
  },
  activeTabText: {
    color: "#222",
  },

  listContainer: {
    marginBottom: 32,
  },
  itemRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemDate: {
    color: "#6e7e91",
    marginTop: 4,
  },

  accountSection: {
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 16,
  },
  accountRow: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginVertical: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  accountText: {
    fontSize: 18,
    color: "#222",
    textAlign: "center",
    fontWeight: "600",
  },
});
