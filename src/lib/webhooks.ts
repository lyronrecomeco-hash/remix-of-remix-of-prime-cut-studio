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
      console.error('Webhook trigger error:', error);
      return false;
    }

    console.log('Webhook trigger result:', result);
    return result?.success || false;
  } catch (error) {
    console.error('Failed to trigger webhook:', error);
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
    console.log('Sending push notification:', { title, targetType });
    
    const { data: result, error } = await supabase.functions.invoke('send-real-push', {
      body: {
        title,
        body,
        target_type: targetType,
        client_phone: clientPhone,
      },
    });

    if (error) {
      console.error('Push notification error:', error);
      return false;
    }

    console.log('Push notification result:', result);
    return result?.success || false;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
};