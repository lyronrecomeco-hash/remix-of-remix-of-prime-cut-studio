import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WhatsAppInstance, BackendConfig, AutomationTemplate } from '../types';

export function useWhatsAppInstances() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [backendConfig, setBackendConfig] = useState<BackendConfig | null>(null);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInstances = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstances((data || []) as WhatsAppInstance[]);
    } catch (error) {
      console.error('Error fetching instances:', error);
      toast.error('Erro ao carregar instâncias');
    }
  }, []);

  const fetchBackendConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_backend_config')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setBackendConfig(data);
    } catch (error) {
      console.error('Error fetching backend config:', error);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_automation_templates')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTemplates((data || []) as AutomationTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchInstances(), fetchBackendConfig(), fetchTemplates()]);
    setIsLoading(false);
  }, [fetchInstances, fetchBackendConfig, fetchTemplates]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createInstance = async (name: string, phoneNumber?: string) => {
    try {
      const instanceToken = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert({
          name,
          instance_token: instanceToken,
          status: 'inactive',
          phone_number: phoneNumber || null,
          auto_reply_enabled: false,
          message_delay_ms: 1000,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Instância criada!');
      await fetchInstances();
      return data;
    } catch (error) {
      console.error('Error creating instance:', error);
      toast.error('Erro ao criar instância');
      return null;
    }
  };

  const updateInstance = async (id: string, updates: Partial<WhatsAppInstance>) => {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Instância atualizada!');
      await fetchInstances();
      return true;
    } catch (error) {
      console.error('Error updating instance:', error);
      toast.error('Erro ao atualizar instância');
      return false;
    }
  };

  const deleteInstance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Instância removida');
      await fetchInstances();
      return true;
    } catch (error) {
      console.error('Error deleting instance:', error);
      toast.error('Erro ao remover instância');
      return false;
    }
  };

  const saveBackendConfig = async (url: string, token: string) => {
    try {
      if (backendConfig) {
        const { error } = await supabase
          .from('whatsapp_backend_config')
          .update({
            backend_url: url,
            master_token: token,
            is_connected: false,
          })
          .eq('id', backendConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_backend_config')
          .insert({
            backend_url: url,
            master_token: token,
            is_connected: false,
          });

        if (error) throw error;
      }

      toast.success('Configuração salva!');
      await fetchBackendConfig();
      return true;
    } catch (error) {
      console.error('Error saving backend config:', error);
      toast.error('Erro ao salvar configuração');
      return false;
    }
  };

  const updateBackendConnection = async (isConnected: boolean) => {
    if (!backendConfig) return false;
    
    try {
      const { error } = await supabase
        .from('whatsapp_backend_config')
        .update({ 
          is_connected: isConnected,
          last_health_check: new Date().toISOString(),
        })
        .eq('id', backendConfig.id);

      if (error) throw error;
      await fetchBackendConfig();
      return true;
    } catch (error) {
      console.error('Error updating backend connection:', error);
      return false;
    }
  };

  return {
    instances,
    backendConfig,
    templates,
    isLoading,
    fetchAll,
    fetchInstances,
    createInstance,
    updateInstance,
    deleteInstance,
    saveBackendConfig,
    updateBackendConnection,
    fetchTemplates,
  };
}
