import { supabase } from '@/integrations/supabase/client';

interface WebhookData {
  event_type: string;
  appointment_id?: string;
  client_name?: string;
  client_phone?: string;
  service_name?: string;
  barber_name?: string;
  date?: string;
  time?: string;
  queue_position?: number;
}

export const triggerWebhook = async (data: WebhookData): Promise<boolean> => {
  try {
    console.log('Triggering webhook for event:', data.event_type);
    
    const { data: result, error } = await supabase.functions.invoke('webhook-trigger', {
      body: data,
    });

    if (error) {
      console.error('Webhook trigger error:', error.message || error);
      // Não bloqueia a operação principal
      return false;
    }

    console.log('Webhook trigger result:', result);
    return result?.success || false;
  } catch (error) {
    // Captura erro silenciosamente para não travar operações principais
    console.error('Failed to trigger webhook:', error instanceof Error ? error.message : error);
    return false;
  }
};

export const sendPushNotification = async (
  title: string,
  body: string,
  targetType: 'client' | 'admin' | 'all',
  clientPhone?: string
): Promise<boolean> => {
  try {
    // Validação de entrada
    if (!title || typeof title !== 'string') {
      console.warn('Push notification: título inválido');
      return false;
    }
    
    if (!targetType || !['client', 'admin', 'all'].includes(targetType)) {
      console.warn('Push notification: targetType inválido');
      return false;
    }

    console.log('Sending push notification:', { 
      title: title.substring(0, 50), 
      targetType,
      hasClientPhone: !!clientPhone 
    });
    
    const { data: result, error } = await supabase.functions.invoke('send-real-push', {
      body: {
        title,
        body: body || '',
        target_type: targetType,
        client_phone: clientPhone,
      },
    });

    if (error) {
      console.error('Push notification error:', error.message || error);
      return false;
    }

    const success = result?.success === true;
    console.log('Push notification result:', {
      success,
      sent: result?.sent || 0,
      failed: result?.failed || 0,
    });
    
    return success;
  } catch (error) {
    // Captura erro silenciosamente para não travar operações principais
    console.error('Failed to send push notification:', error instanceof Error ? error.message : error);
    return false;
  }
};
