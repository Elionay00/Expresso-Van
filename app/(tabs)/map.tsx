import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

// Coordenadas de exemplo para a rota da van
const vanRoute = [
  { latitude: -23.5505, longitude: -46.6333, title: "Partida: Centro" },
  { latitude: -23.5520, longitude: -46.6320, title: "Ponto Intermediário 1" },
  { latitude: -23.5540, longitude: -46.6300, title: "Ponto Intermediário 2" },
  { latitude: -23.5560, longitude: -46.6280, title: "Ponto Intermediário 3" },
  { latitude: -23.5580, longitude: -46.6260, title: "Ponto Intermediário 4" },
  { latitude: -23.5610, longitude: -46.6250, title: "Destino: Universidade" },
];

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [vanPosition, setVanPosition] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Solicitar permissão de localização e obter posição do usuário
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permissão de localização negada');
          setLoading(false);
          return;
        }

        let userLocation = await Location.getCurrentPositionAsync({});
        setLocation(userLocation.coords);
        setLoading(false);
      } catch (error) {
        setErrorMsg('Erro ao obter localização');
        setLoading(false);
      }
    })();
  }, []);

  // Simular movimento da van (em tempo real)
  useEffect(() => {
    const vanInterval = setInterval(() => {
      setVanPosition(prev => (prev + 1) % vanRoute.length);
    }, 3000); // A van se move a cada 3 segundos

    return () => clearInterval(vanInterval);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🗺️ Carregando mapa...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🗺️ Rotas da Van</Text>
        <Text style={styles.error}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗺️ Acompanhe sua Van</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.vanInfo}>🚐 Van em movimento</Text>
        <Text style={styles.locationInfo}>
          Próxima parada: {vanRoute[vanPosition]?.title}
        </Text>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location?.latitude || -23.5555,
          longitude: location?.longitude || -46.6290,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {/* Marcador do usuário */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Sua localização"
            description="Você está aqui"
            pinColor="blue"
          />
        )}

        {/* Marcador da van (em movimento) */}
        <Marker
          coordinate={vanRoute[vanPosition]}
          title="Expresso Vân"
          description="Sua van está aqui"
          pinColor="red"
        >
          <View style={styles.vanMarker}>
            <Text style={styles.vanText}>🚐</Text>
          </View>
        </Marker>

        {/* Rota completa da van */}
        <Polyline
          coordinates={vanRoute}
          strokeColor="#FF0000"
          strokeWidth={4}
          lineDashPattern={[5, 5]}
        />

        {/* Rota percorrida (em tempo real) */}
        <Polyline
          coordinates={vanRoute.slice(0, vanPosition + 1)}
          strokeColor="#00FF00"
          strokeWidth={4}
        />

        {/* Todos os pontos da rota */}
        {vanRoute.map((point, index) => (
          <Marker
            key={index}
            coordinate={point}
            title={point.title}
            pinColor={index === 0 ? 'green' : index === vanRoute.length - 1 ? 'red' : 'orange'}
          />
        ))}
      </MapView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'blue' }]} />
          <Text style={styles.legendText}>Sua localização</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'red' }]} />
          <Text style={styles.legendText}>Van</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#00FF00' }]} />
          <Text style={styles.legendText}>Rota percorrida</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF0000' }]} />
          <Text style={styles.legendText}>Rota completa</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  vanInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50',
  },
  locationInfo: {
    fontSize: 14,
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 5,
  },
  map: {
    flex: 1,
  },
  vanMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    borderWidth: 2,
    borderColor: 'red',
  },
  vanText: {
    fontSize: 20,
  },
  error: {
    textAlign: 'center',
    color: 'red',
    marginTop: 20,
    padding: 20,
  },
  legend: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendColor: {
    width: 15,
    height: 15,
    borderRadius: 3,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
});