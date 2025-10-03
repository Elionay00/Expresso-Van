import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function TabLayout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialCheck, setInitialCheck] = useState(false);

  useEffect(() => {
    console.log('🔐 Verificando autenticação...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('📱 Estado do auth:', user ? `Logado: ${user.email}` : 'Não logado');
      
      setUser(user);
      
      // Marcar que a verificação inicial foi completada
      if (!initialCheck) {
        setInitialCheck(true);
      }
      
      // Dar um tempo extra para o Firebase restaurar a sessão
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, [initialCheck]);

  // Loading screen mais informativa
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Carregando seu app...</Text>
        <Text style={styles.loadingSubtext}>Verificando autenticação</Text>
      </View>
    );
  }

  // Só redirecionar se a verificação inicial foi completada E não tem usuário
  if (initialCheck && !user) {
    console.log('🚫 Nenhum usuário logado, redirecionando para login');
    return <Redirect href="/(auth)/login" />;
  }

  // Se chegou aqui, o usuário está logado OU ainda estamos na verificação inicial
  console.log('✅ Renderizando tabs para usuário:', user?.email || 'em verificação');
  
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#3498db' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="ticket" color={color} />,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="history" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5' 
  },
  loadingText: {
    marginTop: 15, 
    fontSize: 18, 
    color: '#2c3e50',
    fontWeight: 'bold'
  },
  loadingSubtext: {
    marginTop: 5, 
    fontSize: 14, 
    color: '#7f8c8d'
  }
});