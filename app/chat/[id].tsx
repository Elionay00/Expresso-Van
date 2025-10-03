import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { ChatService, Message } from '@/services/chat';
import { auth } from '@/services/firebase';

export default function ChatScreen() {
  const { id: chatId, title } = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!chatId) return;

    // Escutar mensagens em tempo real
    const unsubscribe = ChatService.listenToMessages(chatId as string, (messagesData) => {
      setMessages(messagesData);
      setLoading(false);
      
      // Rolagem automática para a última mensagem
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    // Marcar mensagens como lidas
    ChatService.markMessagesAsRead(chatId as string);

    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await ChatService.sendMessage(chatId as string, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isMyMessage = (senderId: string) => {
    return senderId === auth.currentUser?.uid;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const myMessage = isMyMessage(item.senderId);
    
    return (
      <View style={[
        styles.messageContainer,
        myMessage ? styles.myMessage : styles.otherMessage
      ]}>
        {!myMessage && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <View style={[
          styles.messageBubble,
          myMessage ? styles.myBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            myMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
        </View>
        <Text style={styles.messageTime}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Carregando conversa...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Chat'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Lista de Mensagens */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input de Mensagem */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#95a5a6"
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <FontAwesome name="send" size={16} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    marginTop: 12,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  myBubble: {
    backgroundColor: '#3498db',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#2c3e50',
  },
  messageTime: {
    fontSize: 11,
    color: '#bdc3c7',
    marginHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#3498db',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
  },
});