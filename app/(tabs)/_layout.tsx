import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { initializeNotifications } from '@/services/notifications';

export default function TabLayout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialCheck, setInitialCheck] = useState(false);
  const [notificationsInitialized, setNotificationsInitialized] = useState(false);

  useEffect(() => {
    console.log('🔐 Verificando autenticação...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('📱 Estado do auth:', user ? `Logado: ${user.email}` : 'Não logado');
      
      setUser(user);
      
      // Marcar que a verificação inicial foi completada
      if (!initialCheck) {
        setInitialCheck(true);
      }
      
      // Inicializar notificações se o usuário estiver logado
      if (user && !notificationsInitialized) {
        console.log('🔔 Inicializando notificações...');
        try {
          const success = await initializeNotifications();
          if (success) {
            console.log('✅ Notificações inicializadas com sucesso');
            setNotificationsInitialized(true);
          } else {
            console.log('⚠️ Notificações não puderam ser inicializadas');
          }
        } catch (error) {
          console.error('❌ Erro ao inicializar notificações:', error);
        }
      }
      
      // Dar um tempo extra para o Firebase restaurar a sessão
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, [initialCheck, notificationsInitialized]);

  // Loading screen mais informativa
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Carregando seu app...</Text>
        <Text style={styles.loadingSubtext}>
          {user ? 'Configurando notificações...' : 'Verificando autenticação...'}
        </Text>
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
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#3498db',
      tabBarInactiveTintColor: '#95a5a6',
      tabBarStyle: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#ecf0f1',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome 
              size={focused ? 26 : 24} 
              name="home" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome 
              size={focused ? 26 : 24} 
              name="ticket" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome 
              size={focused ? 26 : 24} 
              name="history" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome 
              size={focused ? 26 : 24} 
              name="map" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome 
              size={focused ? 26 : 24} 
              name="user" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
  name="chats"
  options={{
    title: 'Chat',
    tabBarIcon: ({ color }) => <FontAwesome size={24} name="comments" color={color} />,
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