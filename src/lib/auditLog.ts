import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'confirm' | 'cancel' | 'complete';
export type AuditEntity = 'appointment' | 'service' | 'barber' | 'user' | 'settings' | 'queue' | 'feedback' | 'campaign' | 'template';

export interface AuditLogEntry {
  action: AuditAction;
  entity_type: AuditEntity;
  entity_id?: string;
  details?: Record<string, any>;
}

/**
 * Creates an audit log entry in the database
 * This function is safe to call - it won't throw errors on failure
 */
export const createAuditLog = async (entry: AuditLogEntry): Promise<void> => {
  try {
    // Check if audit logging is enabled
    const securitySettings = localStorage.getItem('security_settings');
    const settings = securitySettings ? JSON.parse(securitySettings) : { auditLog: true };
    
    if (!settings.auditLog) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      details: entry.details || null,
    });
  } catch (error) {
    console.error('[AuditLog] Failed to create audit log:', error);
    // Don't throw - audit logs should never break the app
  }
};

/**
 * Helper to create audit logs with common patterns
 */
export const auditLog = {
  appointment: {
    create: (id: string, details?: Record<string, any>) => 
      createAuditLog({ action: 'create', entity_type: 'appointment', entity_id: id, details }),
    update: (id: string, details?: Record<string, any>) => 
      createAuditLog({ action: 'update', entity_type: 'appointment', entity_id: id, details }),
    confirm: (id: string, details?: Record<string, any>) => 
      createAuditLog({ action: 'confirm', entity_type: 'appointment', entity_id: id, details }),
    cancel: (id: string, details?: Record<string, any>) => 
      createAuditLog({ action: 'cancel', entity_type: 'appointment', entity_id: id, details }),
    complete: (id: string, details?: Record<string, any>) => 
      createAuditLog({ action: 'complete', entity_type: 'appointment', entity_id: id, details }),
  },
  service: {
    create: (id: string, details?: Record<string, any>) => 
      createAuditLog({ action: 'create', entity_type: 'service', entity_id: id, details }),
    update: (id: string, details?: Record<string, any>) => 
      createAuditLog({ action: 'update', entity_type: 'service', entity_id: id, details }),
    delete: (id: string, details?: Record<string, any>) => 
      createAuditLog({ action: 'delete', entity_type: 'service', entity_id: id, details }),
  },
  barber: {
    update: (id: string, details?: Record<string, any>) => 
      createAuditLog({ action: 'update', entity_type: 'barber', entity_id: id, details }),
  },
  queue: {
    update: (id: string, details?: Record<string, any>) => 
      createAuditLog({ action: 'update', entity_type: 'queue', entity_id: id, details }),
  },
  settings: {
    update: (details?: Record<string, any>) => 
      createAuditLog({ action: 'update', entity_type: 'settings', details }),
  },
  campaign: {
    create: (id: string, details?: Record<string, any>) => 
      createAuditLog({ action: 'create', entity_type: 'campaign', entity_id: id, details }),
    update: (id: string, details?: Record<string, any>) => 
      createAuditLog({ action: 'update', entity_type: 'campaign', entity_id: id, details }),
  },
  user: {
    login: (details?: Record<string, any>) => 
      createAuditLog({ action: 'login', entity_type: 'user', details }),
    logout: (details?: Record<string, any>) => 
      createAuditLog({ action: 'logout', entity_type: 'user', details }),
  },
};
