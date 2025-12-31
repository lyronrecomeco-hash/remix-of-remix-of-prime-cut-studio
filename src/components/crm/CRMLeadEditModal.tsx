import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCRM } from '@/contexts/CRMContext';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  origin?: string | null;
  value?: number;
  status?: string;
  notes?: string | null;
  stage_id?: string | null;
  funnel_id?: string | null;
  responsible_id?: string | null;
  stage_entered_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface Stage {
  id: string;
  name: string;
  funnel_id: string;
}

interface Funnel {
  id: string;
  name: string;
}

interface CRMUser {
  id: string;
  name: string;
}

interface CRMLeadEditModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function CRMLeadEditModal({
  lead,
  isOpen,
  onClose,
  onSave,
}: CRMLeadEditModalProps) {
  const { crmTenant, crmUser } = useCRM();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    origin: '',
    value: '',
    notes: '',
    funnel_id: '',
    stage_id: '',
    responsible_id: '',
  });

  useEffect(() => {
    if (crmTenant && isOpen) {
      fetchOptions();
    }
  }, [crmTenant, isOpen]);

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        origin: lead.origin || '',
        value: lead.value?.toString() || '',
        notes: lead.notes || '',
        funnel_id: lead.funnel_id || '',
        stage_id: lead.stage_id || '',
        responsible_id: lead.responsible_id || '',
      });
    }
  }, [lead]);

  const fetchOptions = async () => {
    if (!crmTenant) return;

    const [funnelsRes, stagesRes, usersRes] = await Promise.all([
      supabase.from('crm_funnels').select('id, name').eq('crm_tenant_id', crmTenant.id).eq('is_active', true),
      supabase.from('crm_funnel_stages').select('id, name, funnel_id').eq('crm_tenant_id', crmTenant.id),
      supabase.from('crm_users').select('id, name').eq('crm_tenant_id', crmTenant.id).eq('is_active', true),
    ]);

    setFunnels(funnelsRes.data || []);
    setStages(stagesRes.data || []);
    setUsers(usersRes.data || []);
  };

  const filteredStages = stages.filter((s) => s.funnel_id === formData.funnel_id);

  const handleSubmit = async () => {
    if (!lead || !crmTenant || !crmUser) return;

    if (!formData.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        company: formData.company.trim() || null,
        origin: formData.origin.trim() || null,
        value: parseFloat(formData.value) || 0,
        notes: formData.notes.trim() || null,
        funnel_id: formData.funnel_id || null,
        stage_id: formData.stage_id || null,
        responsible_id: formData.responsible_id || null,
      };

      const { error } = await supabase.from('crm_leads').update(updateData).eq('id', lead.id);

      if (error) throw error;

      // Log history
      await supabase.from('crm_lead_history').insert({
        crm_tenant_id: crmTenant.id,
        lead_id: lead.id,
        user_id: crmUser.id,
        action: 'updated',
        notes: 'Lead atualizado',
      });

      toast({ title: 'Lead atualizado com sucesso' });
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({ title: 'Erro ao atualizar lead', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do lead"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origem</Label>
                <Input
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="Ex: Site, Indicação"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Funil</Label>
                <Select
                  value={formData.funnel_id}
                  onValueChange={(value) => setFormData({ ...formData, funnel_id: value, stage_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {funnels.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select
                  value={formData.stage_id}
                  onValueChange={(value) => setFormData({ ...formData, stage_id: value })}
                  disabled={!formData.funnel_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select
                value={formData.responsible_id}
                onValueChange={(value) => setFormData({ ...formData, responsible_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o lead..."
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
