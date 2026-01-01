import { useState } from 'react';
import { Building2, Mail, Phone, FileText, User, DollarSign } from 'lucide-react';
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
import type { CreateProposalData } from './types';

interface CreateProposalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProposalData) => Promise<unknown>;
  loading?: boolean;
}

export function CreateProposalModal({ open, onClose, onSubmit, loading }: CreateProposalModalProps) {
  const [formData, setFormData] = useState<CreateProposalData>({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_cnpj: '',
    contact_name: '',
    notes: '',
    proposal_value: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) return;
    
    const result = await onSubmit(formData);
    if (result) {
      setFormData({
        company_name: '',
        company_email: '',
        company_phone: '',
        company_cnpj: '',
        contact_name: '',
        notes: '',
        proposal_value: 0,
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Nova Proposta Empresarial
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name" className="text-foreground">
              Nome da Empresa *
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="company_name"
                placeholder="Ex: Barbearia do João"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                className="pl-10 bg-background border-border"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name" className="text-foreground">
                Nome do Contato
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="contact_name"
                  placeholder="Ex: João Silva"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  className="pl-10 bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_cnpj" className="text-foreground">
                CNPJ
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="company_cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.company_cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_cnpj: e.target.value }))}
                  className="pl-10 bg-background border-border"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_email" className="text-foreground">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="company_email"
                  type="email"
                  placeholder="contato@empresa.com"
                  value={formData.company_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_email: e.target.value }))}
                  className="pl-10 bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_phone" className="text-foreground">
                Telefone/WhatsApp
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="company_phone"
                  placeholder="(00) 00000-0000"
                  value={formData.company_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_phone: e.target.value }))}
                  className="pl-10 bg-background border-border"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proposal_value" className="text-foreground">
                Valor da Proposta (R$)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="proposal_value"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.proposal_value || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, proposal_value: parseFloat(e.target.value) || 0 }))}
                  className="pl-10 bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground">
                Observações
              </Label>
              <Textarea
                id="notes"
                placeholder="Anotações..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-background border-border min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.company_name.trim()}>
              {loading ? 'Criando...' : 'Criar Proposta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
