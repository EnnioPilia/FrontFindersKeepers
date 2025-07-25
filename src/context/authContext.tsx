import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { createContext, ReactNode, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    // Vérifie s'il y a un token au démarrage
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setAuthenticated(true);
      }
    };
    checkToken();
  }, []);

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
