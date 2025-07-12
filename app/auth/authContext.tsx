import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { createContext, ReactNode, useContext, useState } from 'react';

interface AuthContextType {
  logout: () => void;
  isAuthenticated: boolean;
  setAuthenticated: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  logout: () => {},
  isAuthenticated: false,
  setAuthenticated: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setAuthenticated(false);
    router.replace('/');
  };

  return (
    <AuthContext.Provider value={{ logout, isAuthenticated, setAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
