import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: any;
  type: 'text' | 'image' | 'system';
  read: boolean;
}

export interface Chat {
  id: string;
  userId: string;
  motoristaId: string;
  lastMessage: string;
  lastMessageTime: any;
  createdAt: any;
  status: 'active' | 'closed';
  userEmail?: string;
  motoristaName?: string;
}

export class ChatService {
  // Criar ou obter chat com motorista
  static async getOrCreateChat(motoristaId: string = 'suporte', motoristaName: string = 'Suporte'): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se já existe um chat ativo
      const chatsQuery = query(
        collection(db, 'chats'),
        where('userId', '==', user.uid),
        where('motoristaId', '==', motoristaId),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(chatsQuery);
      
      if (!querySnapshot.empty) {
        // Retornar ID do chat existente
        return querySnapshot.docs[0].id;
      }

      // Criar novo chat
      const chatRef = await addDoc(collection(db, 'chats'), {
        userId: user.uid,
        userEmail: user.email,
        motoristaId: motoristaId,
        motoristaName: motoristaName,
        lastMessage: 'Chat iniciado',
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        status: 'active'
      });

      // Enviar mensagem de boas-vindas
      await this.sendMessage(chatRef.id, 'Sistema', 'Chat iniciado com sucesso! Como podemos ajudar?', 'system');

      console.log('✅ Novo chat criado:', chatRef.id);
      return chatRef.id;

    } catch (error) {
      console.error('❌ Erro ao criar/obter chat:', error);
      throw error;
    }
  }

  // Enviar mensagem
  static async sendMessage(chatId: string, message: string, senderName?: string, type: 'text' | 'image' | 'system' = 'text'): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado');

      // Adicionar mensagem na subcoleção
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        senderName: senderName || user.email?.split('@')[0] || 'Usuário',
        message: message,
        timestamp: serverTimestamp(),
        type: type,
        read: false
      });

      // Atualizar última mensagem no chat
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: message,
        lastMessageTime: serverTimestamp()
      });

      console.log('✅ Mensagem enviada para chat:', chatId);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Escutar mensagens em tempo real
  static listenToMessages(chatId: string, callback: (messages: Message[]) => void): () => void {
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      callback(messages);
    });

    return unsubscribe;
  }

  // Escutar chats do usuário em tempo real
  static listenToUserChats(callback: (chats: Chat[]) => void): () => void {
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ Usuário não autenticado');
      return () => {};
    }

    const chatsQuery = query(
      collection(db, 'chats'),
      where('userId', '==', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chats: Chat[] = [];
      snapshot.forEach((doc) => {
        chats.push({
          id: doc.id,
          ...doc.data()
        } as Chat);
      });
      callback(chats);
    });

    return unsubscribe;
  }

  // Marcar mensagens como lidas
  static async markMessagesAsRead(chatId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        where('read', '==', false),
        where('senderId', '!=', user.uid)
      );

      const snapshot = await getDocs(messagesQuery);
      const updatePromises = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { read: true })
      );

      await Promise.all(updatePromises);
      console.log('✅ Mensagens marcadas como lidas');
    } catch (error) {
      console.error('❌ Erro ao marcar mensagens como lidas:', error);
    }
  }

  // Fechar chat
  static async closeChat(chatId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        status: 'closed',
        lastMessage: 'Chat encerrado',
        lastMessageTime: serverTimestamp()
      });

      console.log('✅ Chat fechado:', chatId);
    } catch (error) {
      console.error('❌ Erro ao fechar chat:', error);
      throw error;
    }
  }

  // Enviar mensagem rápida para suporte
  static async sendQuickMessageToSupport(message: string): Promise<void> {
    try {
      const chatId = await this.getOrCreateChat('suporte', 'Suporte');
      await this.sendMessage(chatId, message);
      console.log('✅ Mensagem rápida enviada para suporte');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem rápida:', error);
      throw error;
    }
  }
}

export default ChatService;