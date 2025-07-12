// components/LogoutIcon.tsx
import { MaterialIcons } from '@expo/vector-icons'; // Tu peux changer d’icône pack ici
import React from 'react';
import { Pressable } from 'react-native';

type LogoutIconProps = {
  onPress?: () => void;
};

export default function LogoutIcon({ onPress }: LogoutIconProps) {
  return (
    <Pressable onPress={onPress} style={{ marginRight: 15 }}>
      <MaterialIcons name="logout" size={24} color="black" />
    </Pressable>
  );
}
