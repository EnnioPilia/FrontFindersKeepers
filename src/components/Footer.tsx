import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";

export default function Footer() {
  const router = useRouter();

  return (
    <View style={styles.footer}>
      <Pressable
        style={styles.iconButton}
        onPress={() => router.push("/home/home")}
      >
        <MaterialIcons name="home" size={28} color="#fff" />
      </Pressable>

      <Pressable
        style={styles.iconButton}
        onPress={() => router.push("/listConversation/listConversation")}
      >
        <FontAwesome name="comments" size={28} color="#fff" />
      </Pressable>

      <Pressable
        style={styles.iconButton}
        onPress={() => router.push("/objectForm/objectForm")}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </Pressable>

      <Pressable
        style={styles.iconButton}
        onPress={() => router.push("/objectForm/allObjects")}
      >
        <MaterialIcons name="list" size={28} color="#fff" />
      </Pressable>

      <Pressable
        style={styles.iconButton}
        onPress={() => router.push("/profile/profile")}
      >
        <MaterialIcons name="person" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    height: 60,
    backgroundColor: "#86C1FC",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  iconButton: {
    padding: 10,
  },
});
