import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { auth } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export class NotificationService {
  // Solicitar permissões
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('❌ Permissão de notificações negada');
        return false;
      }
      
      console.log('✅ Permissão de notificações concedida');
      return true;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissões:', error);
      return false;
    }
  }

  // Configurar canal Android (apenas para Android)
  static async setupAndroidChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3498db',
      });
    }
  }

  // Obter token push
  static async getPushToken(): Promise<string | null> {
    try {
      await this.setupAndroidChannel();
      
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('📱 Token push obtido:', token);
      
      // Salvar token no Firestore
      await this.savePushToken(token);
      
      return token;
    } catch (error) {
      console.error('❌ Erro ao obter token push:', error);
      return null;
    }
  }

  // Salvar token no Firestore
  static async savePushToken(token: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, 'users', user.uid), {
        pushToken: token,
        notificationEnabled: true,
        lastTokenUpdate: new Date()
      });
      
      console.log('✅ Token push salvo no Firestore');
    } catch (error) {
      console.error('❌ Erro ao salvar token:', error);
    }
  }

  // Enviar notificação imediata (SIMPLES E FUNCIONAL)
  static async sendInstantNotification(title: string, body: string, data: Record<string, any> = {}): Promise<boolean> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
        },
        trigger: null, // Imediato
      });
      
      console.log('⚡ Notificação enviada:', title);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      return false;
    }
  }

  // Agendar notificação para depois
  static async scheduleNotification(title: string, body: string, secondsFromNow: number, data: Record<string, any> = {}): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
        },
        trigger: {
          seconds: secondsFromNow,
        },
      });
      
      console.log('📅 Notificação agendada:', title, 'em', secondsFromNow, 'segundos');
      return notificationId;
    } catch (error) {
      console.error('❌ Erro ao agendar notificação:', error);
      return null;
    }
  }

  // ✅ NOTIFICAÇÕES ESPECÍFICAS DO APP

  // Notificação de reserva confirmada
  static async sendReservationConfirmation(reserva: any): Promise<boolean> {
    const title = '✅ Reserva Confirmada!';
    const body = `Sua vaga para ${reserva.rota} às ${reserva.horario} foi reservada!`;
    
    return await this.sendInstantNotification(title, body, {
      type: 'reservation_confirmed',
      reservaId: reserva.id || 'temp',
      rota: reserva.rota
    });
  }

  // Agendar lembrete de viagem
  static async scheduleTripReminder(viagem: any, minutesBefore: number = 15): Promise<string | null> {
    const title = '🚐 Lembrete de Viagem';
    const body = `Sua van para ${viagem.rota} sai em ${minutesBefore} minutos!`;
    const seconds = minutesBefore * 60;
    
    return await this.scheduleNotification(title, body, seconds, {
      type: 'trip_reminder',
      viagemId: viagem.id,
      rota: viagem.rota
    });
  }

  // Notificação de van chegando
  static async sendVanArrivingNotification(rota: string, minutes: number = 5): Promise<boolean> {
    const title = '🚐 Van Chegando!';
    const body = `Sua van para ${rota} chega em ~${minutes} minutos.`;
    
    return await this.sendInstantNotification(title, body, {
      type: 'van_arriving',
      rota: rota
    });
  }

  // Notificação de teste
  static async sendTestNotification(): Promise<boolean> {
    return await this.sendInstantNotification(
      'Teste 🎯', 
      'Notificações estão funcionando perfeitamente!'
    );
  }

  // Cancelar notificação
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('❌ Notificação cancelada:', notificationId);
    } catch (error) {
      console.error('❌ Erro ao cancelar notificação:', error);
    }
  }

  // Cancelar todas as notificações
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️ Todas as notificações canceladas');
    } catch (error) {
      console.error('❌ Erro ao cancelar notificações:', error);
    }
  }
}

// ✅ INICIALIZAÇÃO SIMPLIFICADA
export const initializeNotifications = async (): Promise<boolean> => {
  try {
    console.log('🔔 Iniciando notificações...');
    
    // 1. Pedir permissão
    const hasPermission = await NotificationService.requestPermissions();
    
    if (hasPermission) {
      // 2. Obter token
      await NotificationService.getPushToken();
      console.log('✅ Notificações configuradas com sucesso');
      return true;
    }
    
    console.log('⚠️ Notificações não disponíveis (sem permissão)');
    return false;
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    return false;
  }};

export default NotificationService;