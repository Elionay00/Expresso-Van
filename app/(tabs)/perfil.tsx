import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '@/services/firebase';
import { User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, limit, DocumentData, Timestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';

const formatarData = (timestamp: Timestamp | Date | string | undefined) => {
  if (!timestamp) return 'Nunca';
  try {
    const date = (timestamp as Timestamp)?.toDate ? (timestamp as Timestamp).toDate() : new Date(timestamp as string | Date);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Data inválida';
  }
};

const getIniciais = (email: string | null | undefined) => {
  if (!email) return 'U';
  return email.charAt(0).toUpperCase();
};

export default function PerfilScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [reservasCount, setReservasCount] = useState(0);
  const [viagensCount, setViagensCount] = useState(0);
  const [ultimaViagem, setUltimaViagem] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        carregarDadosUsuario(user.uid);
      } else {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const carregarDadosUsuario = async (userId: string) => {
    try {
      console.log('📊 Carregando dados do usuário:', userId);

      // Carregar dados adicionais do Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        console.log('✅ Dados do usuário encontrados:', userDoc.data());
        setUserData(userDoc.data());
      } else {
        console.log('⚠️  Nenhum dado adicional encontrado, criando documento...');
        // Criar documento do usuário se não existir
        await setDoc(doc(db, 'users', userId), {
          email: auth.currentUser?.email,
          createdAt: new Date(),
          tipo: 'passageiro',
          nome: auth.currentUser?.email?.split('@')[0],
          telefone: '',
          avatar: null,
        });
      }

      // Contar reservas do usuário
      const reservasQuery = query(
        collection(db, 'reservas'),
        where('userId', '==', userId)
      );
      const reservasSnapshot = await getDocs(reservasQuery);
      console.log('📋 Total de reservas:', reservasSnapshot.size);
      setReservasCount(reservasSnapshot.size);

      // Buscar última reserva
      const ultimaReservaQuery = query(
        collection(db, 'reservas'),
        where('userId', '==', userId),
        orderBy('dataReserva', 'desc'),
        limit(1)
      );
      const ultimaReservaSnapshot = await getDocs(ultimaReservaQuery);
      
      if (!ultimaReservaSnapshot.empty) {
        const ultima = ultimaReservaSnapshot.docs[0].data();
        setUltimaViagem(ultima);
        console.log('🚗 Última viagem:', ultima);
      }

      // Para viagens completas (usando reservas como base por enquanto)
      setViagensCount(reservasSnapshot.size);

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair do Expresso Vân?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              console.log('🚪 Fazendo logout...');
              await signOut(auth);
              console.log('✅ Logout realizado com sucesso');
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('❌ Erro no logout:', error);
              Alert.alert('Erro', 'Não foi possível fazer logout');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Editar Perfil',
      'Em breve você poderá editar seu nome, telefone e foto de perfil!',
      [{ text: 'OK' }]
    );
  };

  const handleHistoricoPress = () => {
    console.log('📋 Navegando para histórico...');
    router.push('/(tabs)/historico');
  };

  const handleAvaliacoesPress = () => {
    console.log('⭐ Abrindo avaliações...');
    Alert.alert(
      'Minhas Avaliações', 
      'Aqui você verá todas as suas avaliações das viagens.\n\nFuncionalidade em desenvolvimento!',
      [{ text: 'OK' }]
    );
  };

  const handlePagamentosPress = () => {
    console.log('💰 Abrindo pagamentos...');
    Alert.alert(
      'Pagamentos e Faturas', 
      'Aqui você verá seu histórico de pagamentos e faturas.\n\nIntegração PIX em desenvolvimento!',
      [{ text: 'OK' }]
    );
  };

  const handleConfiguracoesPress = () => {
    console.log('⚙️ Abrindo configurações...');
    Alert.alert(
      'Configurações', 
      'Configure suas preferências de notificações e privacidade.\n\nFuncionalidade em desenvolvimento!',
      [{ text: 'OK' }]
    );
  };

  const handleAjudaPress = () => {
    console.log('❓ Abrindo ajuda...');
    Alert.alert(
      'Ajuda e Suporte', 
      'Precisa de ajuda? Entre em contato com nosso suporte:\n\n📞 (11) 99999-9999\n✉️ suporte@expressovan.com',
      [{ text: 'OK' }]
    );
  };

  const getNomeDisplay = () => {
    if (userData?.nome) return userData.nome;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuário';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Carregando seu perfil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Usuário não autenticado</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.loginButtonText}>Fazer Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cabeçalho do Perfil */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getIniciais(user?.email)}
            </Text>
          </View>
          <View style={styles.onlineIndicator} />
        </View>
        
        <Text style={styles.userName}>{getNomeDisplay()}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={handleEditProfile}
          disabled={actionLoading}
        >
          <Text style={styles.editButtonText}>
            {actionLoading ? 'Carregando...' : 'Editar Perfil'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>📊 Minhas Estatísticas</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{reservasCount}</Text>
            <Text style={styles.statLabel}>Reservas</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{viagensCount}</Text>
            <Text style={styles.statLabel}>Viagens</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>⭐ 5.0</Text>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>
        </View>

        {ultimaViagem && (
          <View style={styles.lastTrip}>
            <Text style={styles.lastTripTitle}>Última Viagem:</Text>
            <Text style={styles.lastTripText}>
              {ultimaViagem.rota} • {ultimaViagem.horario}
            </Text>
            <Text style={styles.lastTripDate}>
              {formatarData(ultimaViagem.dataReserva)}
            </Text>
          </View>
        )}
      </View>

      {/* Menu de Ações */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>👤 Minha Conta</Text>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={handleHistoricoPress}
          disabled={actionLoading}
        >
          <Text style={styles.menuIcon}>📋</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Histórico de Viagens</Text>
            {reservasCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{reservasCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleAvaliacoesPress}
          disabled={actionLoading}
        >
          <Text style={styles.menuIcon}>⭐</Text>
          <Text style={styles.menuText}>Minhas Avaliações</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handlePagamentosPress}
          disabled={actionLoading}
        >
          <Text style={styles.menuIcon}>💰</Text>
          <Text style={styles.menuText}>Pagamentos e Faturas</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleConfiguracoesPress}
          disabled={actionLoading}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>Configurações</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleAjudaPress}
          disabled={actionLoading}
        >
          <Text style={styles.menuIcon}>❓</Text>
          <Text style={styles.menuText}>Ajuda e Suporte</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Informações da Conta */}
      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>🔐 Informações da Conta</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>ID do Usuário:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
            {user?.uid}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Conta criada em:</Text>
          <Text style={styles.infoValue}>
            {formatarData(user?.metadata?.creationTime)}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Último login:</Text>
          <Text style={styles.infoValue}>
            {formatarData(user?.metadata?.lastSignInTime)}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[styles.infoValue, styles.statusActive]}>
            ✅ Conta verificada
          </Text>
        </View>
      </View>

      {/* Botão de Logout */}
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.logoutButtonText}>🚪 Sair da Conta</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.version}>Expresso Vân v1.0.0</Text>
        <Text style={styles.copyright}>© 2025 - Todos os direitos reservados</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 50,
  },
  loginButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: 'white',
    padding: 25,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  avatarContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2ecc71',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  statsContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  lastTrip: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  lastTripTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  lastTripText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 3,
  },
  lastTripDate: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  menuContainer: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 15,
    width: 30,
  },
  menuTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  menuArrow: {
    fontSize: 20,
    color: '#bdc3c7',
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right',
  },
  statusActive: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    margin: 15,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    padding: 25,
    paddingBottom: 35,
  },
  version: {
    fontSize: 12,
    color: '#bdc3c7',
    marginBottom: 5,
  },
  copyright: {
    fontSize: 11,
    color: '#bdc3c7',
  },
});