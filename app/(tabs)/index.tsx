import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function TabOneScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🚐 Expresso Vân</Text>
      <Text style={styles.subtitle}>Sua van com um clique!</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Rotas Disponíveis</Text>
        <Text style={styles.cardText}>Centro ↔ Universidade</Text>
        <Text style={styles.cardText}>Shopping ↔ Bairro Jardim</Text>
        <Link href="/(tabs)/map" asChild>
          <Button title="Ver Mapa das Rotas" />
        </Link>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>⏰ Próximos Horários</Text>
        <Text style={styles.cardText}>🚗 08:30 - Centro → Universidade</Text>
        <Text style={styles.cardText}>🚗 09:15 - Shopping → Bairro Jardim</Text>
        <Button 
          title="Ver Horários Completos"
          onPress={() => console.log('Horários pressionado')}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 Ações Rápidas</Text>
        <View style={styles.buttonContainer}>
          <Button 
            title="Minhas Reservas"
            onPress={() => console.log('Reservas pressionado')}
          />
          <Button 
            title="Falar com Motorista"
            onPress={() => console.log('Motorista pressionado')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 30,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  cardText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#34495e',
  },
  buttonContainer: {
    gap: 10,
  },
});