import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import authFetch from "../utils/authFetch";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";

interface ObjectItem {
  id: number;
  name: string | null;
  description: string;

  photoPath: string;

  localisation: string;
  date: string;
  type: "PERDU" | "TROUVE";
  reclame?: boolean;
}

const windowWidth = Dimensions.get("window").width;
const cardMargin = 16;
const cardSize = (windowWidth - cardMargin * 3) / 2;

export default function AllObjects() {
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<ObjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<"TOUS" | "PERDU" | "TROUVE">(
    "TOUS"
  );
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const pageSize = 6;

  const router = useRouter();

  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const response = await authFetch("http://192.168.1.26:8080/objects");
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Erreur inconnue");
        }
        const data = await response.json();
        const filtered = data.filter((obj: ObjectItem) => !obj.reclame);
        setObjects(filtered);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement :", err);
        setLoading(false);
      }
    };

    fetchObjects();
  }, []);

  useEffect(() => {
    let items = [...objects];

    if (filterType !== "TOUS") {
      items = items.filter((item) => item.type === filterType);
    }

    if (searchText.trim() !== "") {
      const lowerSearch = searchText.toLowerCase();
      items = items.filter(
        (item) => item.name && item.name.toLowerCase().includes(lowerSearch)
      );
    }

    items.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "ASC" ? dateA - dateB : dateB - dateA;
    });

    const start = page * pageSize;
    const end = start + pageSize;
    const pagedItems = items.slice(start, end);

    setHasMore(end < items.length);
    setFilteredObjects(pagedItems);
  }, [searchText, filterType, sortOrder, objects, page]);

  const renderItem = ({ item }: { item: ObjectItem }) => {
    const validImage = item.photoPath && item.photoPath.startsWith("file://");

    const badgeColor = item.type === "TROUVE" ? "#28a745" : "#d9534f";
    const badgeText = item.type === "TROUVE" ? "Trouvé" : "Perdu";

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/objectForm/objectDetails",
            params: { id: item.id.toString() },
          })
        }
      >
        {validImage ? (
          <Image source={{ uri: item.photoPath }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <Text style={{ color: "#999" }}>Pas d'image</Text>
          </View>
        )}

        <Text style={styles.name} numberOfLines={2}>
          {item.name ?? "Sans nom"}
        </Text>

        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>

        <Text style={styles.date}>
          {new Date(item.date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e86de" />
      </View>
    );
  }

  return (

    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
      <View style={{ marginHorizontal: cardMargin }}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un objet..."
          value={searchText}
          onChangeText={(text) => {
            setPage(0);
            setSearchText(text);
          }}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={filterType}
            onValueChange={(value) => {
              setPage(0);
              setFilterType(value);
            }}
            mode="dropdown"
            style={styles.picker}
          >
            <Picker.Item label="Tous" value="TOUS" />
            <Picker.Item label="Perdus" value="PERDU" />
            <Picker.Item label="Trouvés" value="TROUVE" />
          </Picker>
        </View>

        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={sortOrder}
            onValueChange={(value) => {
              setPage(0);
              setSortOrder(value);
            }}
            mode="dropdown"
            style={styles.picker}
          >
            <Picker.Item label="Date ↑ (plus ancien)" value="ASC" />
            <Picker.Item label="Date ↓ (plus récent)" value="DESC" />
          </Picker>
        </View>
      </View>

      <FlatList
        data={filteredObjects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        numColumns={2}
        key="2"
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Désactive le scroll interne pour que ScrollView gère tout
      />

      <View style={styles.paginationContainer}>
        <Pressable
          style={[styles.pageButton, page === 0 && styles.disabledButton]}
          onPress={() => {
            if (page > 0) setPage(page - 1);
          }}
          disabled={page === 0}
        >
          <MaterialIcons name="arrow-back-ios" size={24} color="#fff" />
        </Pressable>

        <Pressable
          style={[styles.pageButton, !hasMore && styles.disabledButton]}
          onPress={() => {
            if (hasMore) setPage(page + 1);
          }}
          disabled={!hasMore}
        >
          <MaterialIcons name="arrow-forward-ios" size={24} color="#fff" />
        </Pressable>
      </View>
    </ScrollView>

  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: cardMargin,
    paddingTop: 16,
    paddingBottom: 32,
  },
  card: {
    width: cardSize,
    marginHorizontal: cardMargin / 2,
    marginBottom: 24,
  },
  image: {
    width: "100%",
    height: cardSize,
    borderRadius: 12,
    resizeMode: "cover",
  },
  noImage: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    marginTop: 8,
    fontWeight: "600",
    fontSize: 16,
    color: "#1c1c1e",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 6,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  date: {
    marginTop: 6,
    fontSize: 12,
    color: "#8e8e93",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchInput: {
    height: 40,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#fafafa",
    fontSize: 15,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    width: "100%",
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: cardMargin,
    marginBottom: 12,
    paddingVertical: 4,
  },
  pickerWrapper: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  picker: {
    height: 52,
    fontSize: 12,
    paddingHorizontal: 16,
    textAlignVertical: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: cardMargin,
    marginBottom: 16,
  },
  pageButton: {
    backgroundColor: "#2e86de",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#a0aec0",
  },
});
