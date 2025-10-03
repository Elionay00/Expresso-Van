import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert, TouchableOpacity } from 'react-native';
import { collection, addDoc, getDocs, doc, updateDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { auth } from '@/services/firebase';
import { NotificationService } from '@/services/notifications';

interface Viagem {
  id: string;
  rota: string;
  horario: string;
  vagasDisponiveis: number;
}

export default function ReservasScreen() {
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservando, setReservando] = useState<string | null>(null);

  useEffect(() => {
    carregarViagens();
  }, []);

  const carregarViagens = async () => {
    try {
      console.log('📋 Carregando viagens disponíveis...');
      const querySnapshot = await getDocs(collection(db, 'viagens'));
      const viagensData: Viagem[] = [];
      querySnapshot.forEach((doc: DocumentData) => {
        viagensData.push({ id: doc.id, ...doc.data() } as Viagem);
      });
      
      // Ordenar por horário
      viagensData.sort((a, b) => a.horario.localeCompare(b.horario));
      setViagens(viagensData);
      console.log(`✅ ${viagensData.length} viagens carregadas`);
    } catch (error) {
      console.error('❌ Erro ao carregar viagens:', error);
      Alert.alert('Erro', 'Não foi possível carregar as viagens disponíveis');
    }
    setLoading(false);
  };

  const reservarVaga = async (viagem: Viagem) => {
    if (viagem.vagasDisponiveis <= 0) {
      Alert.alert('Erro', 'Não há vagas disponíveis nesta viagem');
      return;
    }

    setReservando(viagem.id);

    try {
      console.log(`🚀 Iniciando reserva para: ${viagem.rota} às ${viagem.horario}`);

      // Atualizar vagas disponíveis
      await updateDoc(doc(db, 'viagens', viagem.id), {
        vagasDisponiveis: viagem.vagasDisponiveis - 1
      });

      // Criar reserva no Firestore
      const reservaRef = await addDoc(collection(db, 'reservas'), {
        userId: auth.currentUser?.uid,
        viagemId: viagem.id,
        horario: viagem.horario,
        rota: viagem.rota,
        dataReserva: new Date(),
        status: 'confirmada'
      });

      console.log('✅ Reserva criada no Firestore:', reservaRef.id);

      // ✅ ENVIAR NOTIFICAÇÃO DE CONFIRMAÇÃO
      try {
        await NotificationService.sendReservationConfirmation({
          id: reservaRef.id,
          rota: viagem.rota,
          horario: viagem.horario
        });
        console.log('🔔 Notificação de confirmação enviada');
      } catch (notifError) {
        console.log('⚠️ Não foi possível enviar notificação:', notifError);
      }

      // ✅ AGENDAR LEMBRETE DE VIAGEM (15 minutos antes - simulação 10 segundos para teste)
      try {
        const reminderId = await NotificationService.scheduleTripReminder(viagem, 0.25); // 15 segundos para teste
        if (reminderId) {
          console.log('⏰ Lembrete agendado:', reminderId);
          
          // Salvar ID do lembrete na reserva (opcional)
          await updateDoc(reservaRef, {
            notificationId: reminderId
          });
        }
      } catch (reminderError) {
        console.log('⚠️ Não foi possível agendar lembrete:', reminderError);
      }

      // ✅ NOTIFICAÇÃO DE VAN CHEGANDO (simulação - 30 segundos para teste)
      try {
        setTimeout(async () => {
          await NotificationService.sendVanArrivingNotification(viagem.rota, 5);
          console.log('📍 Notificação de van chegando enviada');
        }, 30000); // 30 segundos
      } catch (vanError) {
        console.log('⚠️ Não foi possível agendar notificação de van:', vanError);
      }

      Alert.alert(
        '✅ Reserva Confirmada!', 
        `Vaga reservada para ${viagem.rota} às ${viagem.horario}\n\n📱 Você receberá lembretes antes da viagem!\n\nVerifique no Histórico de Reservas.`,
        [{ text: 'OK', onPress: () => carregarViagens() }]
      );
      
      // Recarregar lista para atualizar vagas
      await carregarViagens();
      
    } catch (error) {
      console.error('❌ Erro na reserva:', error);
      Alert.alert('Erro', 'Não foi possível fazer a reserva. Tente novamente.');
    } finally {
      setReservando(null);
    }
  };

  const getVagasColor = (vagas: number) => {
    if (vagas <= 2) return '#e74c3c'; // Vermelho - poucas vagas
    if (vagas <= 5) return '#f39c12'; // Laranja - vagas limitadas
    return '#2ecc71'; // Verde - vagas disponíveis
  };

  const getVagasText = (vagas: number) => {
    if (vagas <= 2) return 'Últimas vagas!';
    if (vagas <= 5) return 'Vagas limitadas';
    return 'Vagas disponíveis';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚐 Reservar Viagem</Text>
      <Text style={styles.subtitle}>Escolha seu horário e reserve sua vaga</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando viagens disponíveis...</Text>
        </View>
      ) : viagens.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma viagem disponível no momento</Text>
          <Text style={styles.emptySubtext}>Volte mais tarde para novas rotas</Text>
        </View>
      ) : (
        <FlatList
          data={viagens}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: { item: Viagem }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.rota}>📍 {item.rota}</Text>
                <View style={styles.vagasBadge}>
                  <Text style={[styles.vagasCount, { color: getVagasColor(item.vagasDisponiveis) }]}>
                    {item.vagasDisponiveis}
                  </Text>
                  <Text style={styles.vagasLabel}>vagas</Text>
                </View>
              </View>
              
              <Text style={styles.horario}>⏰ {item.horario}</Text>
              
              <View style={styles.vagasInfo}>
                <Text style={[styles.vagasStatus, { color: getVagasColor(item.vagasDisponiveis) }]}>
                  {getVagasText(item.vagasDisponiveis)}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.reserveButton,
                  item.vagasDisponiveis <= 0 || reservando === item.id ? styles.reserveButtonDisabled : {}
                ]}
                onPress={() => reservarVaga(item)}
                disabled={item.vagasDisponiveis <= 0 || reservando === item.id}
              >
                <Text style={styles.reserveButtonText}>
                  {reservando === item.id ? 'Reservando...' : 
                   item.vagasDisponiveis <= 0 ? 'Lotado' : 'Reservar Vaga'}
                </Text>
              </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    color: '#7f8c8d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  rota: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  vagasBadge: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 60,
  },
  vagasCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  vagasLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: -2,
  },
  horario: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  vagasInfo: {
    marginBottom: 15,
  },
  vagasStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  reserveButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  reserveButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
  },
  reserveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});