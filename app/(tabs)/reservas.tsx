import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert } from 'react-native';
import { collection, addDoc, getDocs, doc, updateDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { auth } from '@/services/firebase';

interface Viagem {
  id: string;
  rota: string;
  horario: string;
  vagasDisponiveis: number;
}

export default function ReservasScreen() {
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarViagens();
  }, []);

  const carregarViagens = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'viagens'));
      const viagensData: Viagem[] = [];
      querySnapshot.forEach((doc: DocumentData) => {
        viagensData.push({ id: doc.id, ...doc.data() } as Viagem);
      });
      setViagens(viagensData);
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
    }
    setLoading(false);
  };

  const reservarVaga = async (viagem: Viagem) => {
    if (viagem.vagasDisponiveis <= 0) {
      Alert.alert('Erro', 'Não há vagas disponíveis nesta viagem');
      return;
    }

    try {
      // Atualizar vagas disponíveis
      await updateDoc(doc(db, 'viagens', viagem.id), {
        vagasDisponiveis: viagem.vagasDisponiveis - 1
      });

      // Criar reserva
      await addDoc(collection(db, 'reservas'), {
        userId: auth.currentUser?.uid,
        viagemId: viagem.id,
        horario: viagem.horario,
        rota: viagem.rota,
        dataReserva: new Date()
      });

      Alert.alert(
        'Sucesso!', 
        `Vaga reservada para ${viagem.rota} às ${viagem.horario}\n\nVerifique no Histórico de Reservas.`,
        [{ text: 'OK', onPress: () => carregarViagens() }]
      );
      
      carregarViagens(); // Recarregar lista
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível fazer a reserva');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚐 Reservar Viagem</Text>
      
      {loading ? (
        <Text>Carregando...</Text>
      ) : (
        <FlatList
          data={viagens}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Viagem }) => (
            <View style={styles.card}>
              <Text style={styles.rota}>{item.rota}</Text>
              <Text style={styles.horario}>⏰ {item.horario}</Text>
              <Text style={styles.vagas}>🎫 {item.vagasDisponiveis} vagas</Text>
              <Button 
                title="Reservar Vaga" 
                onPress={() => reservarVaga(item)}
                disabled={item.vagasDisponiveis <= 0}
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
  },
  horario: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  vagas: {
    fontSize: 14,
    marginBottom: 10,
    color: '#2ecc71',
  },
});