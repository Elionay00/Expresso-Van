import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { ChatService, Chat } from '@/services/chat';
import { auth } from '@/services/firebase';

export default function ChatsScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    
    let chatUnsubscribe: () => void = () => {};

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      // Clean up previous chat listener
      chatUnsubscribe();

      if (user) {
        // Set up new listener for the logged-in user
        chatUnsubscribe = ChatService.listenToUserChats((chatsData) => {
          setChats(chatsData);
          setLoading(false);
        });
      } else {
        // User is signed out
        setChats([]);
        setLoading(false);
      }
    });

    // Cleanup on component unmount
    return () => {
      authUnsubscribe();
      chatUnsubscribe();
    };
  }, []);

  const handleChatPress = (chat: Chat) => {
    router.push({
      pathname: '/chat/[id]',
      params: { id: chat.id, title: chat.motoristaName || 'Chat' },
    });
  };

  const handleNewChat = async () => {
    try {
      setLoading(true);
      const chatId = await ChatService.getOrCreateChat('suporte', 'Suporte');
      router.push({ pathname: '/chat/[id]', params: { id: chatId, title: 'Suporte' } });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível iniciar um novo chat');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} d`;
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Carregando conversas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💬 Conversas</Text>
        <Text style={styles.subtitle}>Fale com motoristas e suporte</Text>
      </View>

      <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
        <FontAwesome name="plus" size={20} color="white" />
        <Text style={styles.newChatButtonText}>Nova Conversa</Text>
      </TouchableOpacity>

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="comments-o" size={64} color="#bdc3c7" />
          <Text style={styles.emptyTitle}>Nenhuma conversa</Text>
          <Text style={styles.emptyText}>
            Inicie uma conversa com o suporte ou motorista para tirar suas dúvidas
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.chatItem}
              onPress={() => handleChatPress(item)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.motoristaName?.charAt(0) || 'S'}
                </Text>
              </View>
              
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>
                  {item.motoristaName || 'Suporte'}
                </Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>

              <View style={styles.chatMeta}>
                <Text style={styles.timeText}>
                  {formatTime(item.lastMessageTime)}
                </Text>
                {item.status === 'active' && (
                  <View style={styles.activeIndicator} />
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  newChatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#bdc3c7',
    marginBottom: 4,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ecc71',
  },
});