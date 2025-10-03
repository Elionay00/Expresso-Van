import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Button } from 'react-native';
import { collection, query, where, getDocs, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';

interface Reserva {
  id: string;
  rota: string;
  horario: string;
  dataReserva: Timestamp;
  viagemId: string;
}

export default function HistoricoScreen() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Adiciona um listener para focar na tela e recarregar as reservas
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        carregarReservas();
      }
    });
    return unsubscribe; // Limpa o listener ao desmontar
  }, []);

  const carregarReservas = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setReservas([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'reservas'), 
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const reservasData: Reserva[] = [];
      
      querySnapshot.forEach((doc) => {
        reservasData.push({ id: doc.id, ...doc.data() } as Reserva);
      });

      // Ordenar por data mais recente de forma segura
      reservasData.sort((a, b) => {
        const dateA = a.dataReserva?.toDate().getTime() || 0;
        const dateB = b.dataReserva?.toDate().getTime() || 0;
        return dateB - dateA;
      });

      setReservas(reservasData);
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico');
    }
    setLoading(false);
  };

  const cancelarReserva = async (reserva: Reserva) => {
    if (!reserva.viagemId) {
      Alert.alert(
        'Erro',
        'Esta é uma reserva antiga e não pode ser cancelada pelo aplicativo. Entre em contato com o suporte.'
      );
      return;
    }

    Alert.alert(
      'Cancelar Reserva',
      `Tem certeza que deseja cancelar a reserva para ${reserva.rota}?`,
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim', 
          onPress: async () => {
            try {
              await runTransaction(db, async (transaction) => {
                const reservaRef = doc(db, 'reservas', reserva.id);
                const viagemRef = doc(db, 'viagens', reserva.viagemId);

                const viagemDoc = await transaction.get(viagemRef);
                if (!viagemDoc.exists()) {
                  throw new Error("Viagem não encontrada!");
                }

                const vagasAtuais = viagemDoc.data().vagasDisponiveis;
                transaction.update(viagemRef, { vagasDisponiveis: vagasAtuais + 1 });
                transaction.delete(reservaRef);
              });

              Alert.alert('Sucesso!', 'Reserva cancelada com sucesso!');
              carregarReservas(); // Recarregar lista
            } catch (error) {
              console.error('Erro ao cancelar reserva:', error);
              Alert.alert('Erro', 'Não foi possível cancelar a reserva. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  const formatarData = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'Data não disponível';
    const date = timestamp.toDate();
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Histórico de Reservas</Text>
      
      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : reservas.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhuma reserva encontrada</Text>
          <Text style={styles.emptySubtext}>Faça sua primeira reserva na aba "Reservas"</Text>
        </View>
      ) : (
        <FlatList
          data={reservas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Reserva }) => (
            <View style={styles.card}>
              <Text style={styles.rota}>🚐 {item.rota}</Text>
              <Text style={styles.horario}>⏰ {item.horario}</Text>
              <Text style={styles.data}>📅 {formatarData(item.dataReserva)}</Text>
              <Text style={styles.status}>✅ Reserva confirmada</Text>
              
              <Button 
                title="Cancelar Reserva" 
                onPress={() => cancelarReserva(item)}
                color="#e74c3c"
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  loading: {
    textAlign: 'center',
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 50,
  },
  empty: {
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rota: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2c3e50',
  },
  horario: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  data: {
    fontSize: 14,
    marginBottom: 10,
    color: '#7f8c8d',
  },
  status: {
    fontSize: 14,
    marginBottom: 10,
    color: '#27ae60',
    fontWeight: 'bold',
  },
});