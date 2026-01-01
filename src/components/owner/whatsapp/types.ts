// WhatsApp Automation Types
export interface WhatsAppInstance {
  id: string;
  name: string;
  instance_token: string;
  status: 'inactive' | 'awaiting_backend' | 'connected' | 'disconnected' | 'qr_pending';
  phone_number: string | null;
  last_seen: string | null;
  auto_reply_enabled: boolean;
  auto_reply_message: string | null;
  message_delay_ms: number;
  created_at: string;
  heartbeat_interval_ms?: number;
  last_heartbeat_at?: string | null;
  uptime_seconds?: number;
}

export interface BackendConfig {
  id: string;
  backend_url: string | null;
  master_token: string | null;
  is_connected: boolean;
  last_health_check: string | null;
}

export interface ConsoleLog {
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export interface AutomationTemplate {
  id: string;
  template_type: string;
  name: string;
  message_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  instance_id: string;
  phone: string;
  contact_name: string | null;
  profile_picture_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_archived: boolean;
  is_pinned: boolean;
  is_muted: boolean;
  tags: string[];
}

export interface InboxMessage {
  id: string;
  instance_id: string;
  phone_from: string;
  phone_to: string | null;
  contact_name: string | null;
  message_type: string;
  message_content: string | null;
  media_url: string | null;
  is_from_me: boolean;
  is_read: boolean;
  received_at: string;
}

export interface WebhookConfig {
  id: string;
  instance_id: string | null;
  event_type: string;
  webhook_url: string;
  is_active: boolean;
  retry_enabled: boolean;
  max_retries: number;
  secret_key: string | null;
  created_at: string;
}

export interface Automation {
  id: string;
  instance_id: string | null;
  name: string;
  trigger_type: string;
  trigger_value: string | null;
  response_type: string;
  response_content: string | null;
  is_active: boolean;
  priority: number;
  conditions: Record<string, unknown> | null;
  created_at: string;
}

export interface Group {
  id: string;
  instance_id: string;
  group_id: string;
  name: string;
  description: string | null;
  participant_count: number;
  is_admin: boolean;
  is_archived: boolean;
  profile_picture_url: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  instance_id: string;
  phone: string;
  name: string | null;
  profile_picture_url: string | null;
  status_message: string | null;
  is_blocked: boolean;
  has_whatsapp: boolean | null;
  tags: string[];
  notes: string | null;
  created_at: string;
}

export interface QuickReply {
  id: string;
  shortcut: string;
  title: string;
  content: string;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

export interface SecuritySettings {
  id: string;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  message_delay_min_ms: number;
  message_delay_max_ms: number;
  typing_simulation: boolean;
  read_receipt_delay_ms: number;
  warmup_enabled: boolean;
  warmup_days: number;
  warmup_messages_day1: number;
  warmup_increment_per_day: number;
  ip_whitelist: string[];
  two_factor_enabled: boolean;
  audit_log_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  instance_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export interface MessageLog {
  id: string;
  instance_id: string;
  phone_to: string;
  message: string;
  status: string;
  created_at: string;
  error_message: string | null;
}

export type BackendMode = 'vps' | 'local';

export const STATUS_CONFIG = {
  inactive: { label: 'Inativo', color: 'bg-gray-500', textColor: 'text-gray-500' },
  awaiting_backend: { label: 'Aguardando Backend', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  connected: { label: 'Conectado', color: 'bg-green-500', textColor: 'text-green-500' },
  disconnected: { label: 'Desconectado', color: 'bg-red-500', textColor: 'text-red-500' },
  qr_pending: { label: 'QR Code Pendente', color: 'bg-blue-500', textColor: 'text-blue-500' },
} as const;
