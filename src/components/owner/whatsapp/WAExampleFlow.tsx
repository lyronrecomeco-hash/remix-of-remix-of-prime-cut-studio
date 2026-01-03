import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Rocket, 
  Package,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Sparkles,
  Database
} from 'lucide-react';

export function WAExampleFlow() {
  const [isCreating, setIsCreating] = useState(false);
  const [createdItems, setCreatedItems] = useState<{
    templates: string[];
    actions: string[];
  }>({ templates: [], actions: [] });

  const exampleTemplates = [
    {
      name: 'Pedido Recebido',
      template_type: 'buttons',
      content: 'Olá {{nome}}! 🎉\n\nSeu pedido *#{{pedido_id}}* foi recebido com sucesso!\n\n📦 *Resumo:*\n{{itens}}\n\n💰 *Total:* R$ {{total}}',
      footer_text: 'Genesis WhatsApp Automation',
      buttons: [
        { id: 'btn_confirmar_pedido', text: '✅ Confirmar Pedido' },
        { id: 'btn_alterar_pedido', text: '✏️ Alterar Pedido' },
        { id: 'btn_falar_vendedor', text: '👤 Falar com Vendedor' }
      ],
      variables: ['nome', 'pedido_id', 'itens', 'total'],
      category: 'transactional'
    },
    {
      name: 'Pagamento Pendente',
      template_type: 'buttons',
      content: '💳 *Pagamento do Pedido #{{pedido_id}}*\n\nValor: *R$ {{total}}*\n\nEscolha a forma de pagamento:',
      footer_text: 'Pagamento seguro',
      buttons: [
        { id: 'btn_pagar_pix', text: '📱 Pagar com PIX' },
        { id: 'btn_pagar_cartao', text: '💳 Pagar com Cartão' },
        { id: 'btn_boleto', text: '📄 Gerar Boleto' }
      ],
      variables: ['pedido_id', 'total'],
      category: 'transactional'
    },
    {
      name: 'Pagamento Confirmado',
      template_type: 'buttons',
      content: '✅ *Pagamento Confirmado!*\n\nPedido: *#{{pedido_id}}*\nValor: R$ {{total}}\n\nSeu pedido está sendo preparado e em breve será enviado! 📦',
      footer_text: 'Obrigado pela compra!',
      buttons: [
        { id: 'btn_rastrear', text: '📍 Rastrear Pedido' },
        { id: 'btn_suporte', text: '💬 Suporte' }
      ],
      variables: ['pedido_id', 'total'],
      category: 'transactional'
    },
    {
      name: 'Menu de Opções',
      template_type: 'list',
      content: 'Olá! 👋\n\nComo posso te ajudar hoje?',
      footer_text: 'Selecione uma opção',
      list_sections: [
        {
          title: '🛒 Pedidos',
          rows: [
            { id: 'list_novo_pedido', title: 'Fazer novo pedido', description: 'Ver catálogo de produtos' },
            { id: 'list_meus_pedidos', title: 'Meus pedidos', description: 'Consultar pedidos anteriores' }
          ]
        },
        {
          title: '💬 Atendimento',
          rows: [
            { id: 'list_falar_atendente', title: 'Falar com atendente', description: 'Suporte humano' },
            { id: 'list_horarios', title: 'Horários de funcionamento', description: 'Ver horários' }
          ]
        }
      ],
      variables: [],
      category: 'marketing'
    }
  ];

  const exampleActions = [
    {
      button_id: 'btn_confirmar_pedido',
      action_type: 'send_template',
      description: 'Confirma o pedido e envia template de pagamento',
      action_config: { next_template_name: 'Pagamento Pendente', update_state: 'awaiting_payment' }
    },
    {
      button_id: 'btn_alterar_pedido',
      action_type: 'update_state',
      description: 'Altera estado para edição do pedido',
      action_config: { new_state: 'editing_order' }
    },
    {
      button_id: 'btn_falar_vendedor',
      action_type: 'transfer_to_human',
      description: 'Transfere para atendimento humano',
      action_config: { department: 'sales', priority: 'high' }
    },
    {
      button_id: 'btn_pagar_pix',
      action_type: 'create_payment',
      description: 'Gera cobrança PIX',
      action_config: { payment_method: 'pix', generate_qrcode: true }
    },
    {
      button_id: 'btn_pagar_cartao',
      action_type: 'send_payment_link',
      description: 'Envia link de pagamento por cartão',
      action_config: { payment_method: 'credit_card' }
    },
    {
      button_id: 'btn_rastrear',
      action_type: 'send_tracking',
      description: 'Envia informações de rastreamento',
      action_config: { include_map: true }
    },
    {
      button_id: 'list_novo_pedido',
      action_type: 'send_catalog',
      description: 'Envia catálogo de produtos',
      action_config: { catalog_type: 'full' }
    },
    {
      button_id: 'list_falar_atendente',
      action_type: 'transfer_to_human',
      description: 'Transfere para suporte',
      action_config: { department: 'support' }
    }
  ];

  const createExampleFlow = async () => {
    setIsCreating(true);
    const created = { templates: [] as string[], actions: [] as string[] };

    try {
      // Create templates
      for (const template of exampleTemplates) {
        const { data, error } = await supabase
          .from('whatsapp_interactive_templates')
          .insert({
            name: template.name,
            template_type: template.template_type,
            message_content: template.content,
            footer_text: template.footer_text,
            buttons: template.buttons || [],
            list_sections: template.list_sections || [],
            variables: template.variables,
            category: template.category,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating template:', error);
          continue;
        }

        created.templates.push(template.name);

        // Find and update actions that reference this template
        const actionsToUpdate = exampleActions.filter(
          a => (a.action_config as any).next_template_name === template.name
        );
        
        for (const action of actionsToUpdate) {
          (action.action_config as any).next_template_id = data.id;
        }
      }

      // Create actions
      for (const action of exampleActions) {
        const { error } = await supabase
          .from('whatsapp_button_actions')
          .insert({
            button_id: action.button_id,
            action_type: action.action_type,
            description: action.description,
            action_config: action.action_config
          });

        if (error) {
          console.error('Error creating action:', error);
          continue;
        }

        created.actions.push(action.button_id);
      }

      setCreatedItems(created);
      toast.success(`Fluxo de exemplo criado! ${created.templates.length} templates e ${created.actions.length} ações`);
    } catch (error) {
      console.error('Error creating example flow:', error);
      toast.error('Erro ao criar fluxo de exemplo');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Fluxo de Exemplo Completo
          </h2>
          <p className="text-muted-foreground">
            Crie um fluxo completo de pedido com um clique
          </p>
        </div>
      </div>

      {/* Flow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Diagrama do Fluxo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-6">
            <FlowStep 
              icon={<Package className="h-6 w-6" />}
              title="1. Pedido Recebido"
              description="Cliente recebe confirmação"
              color="bg-blue-500"
            />
            <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
            <div className="h-6 w-0.5 bg-muted-foreground md:hidden" />
            
            <FlowStep 
              icon={<CreditCard className="h-6 w-6" />}
              title="2. Pagamento"
              description="Escolhe forma de pagamento"
              color="bg-purple-500"
            />
            <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
            <div className="h-6 w-0.5 bg-muted-foreground md:hidden" />
            
            <FlowStep 
              icon={<CheckCircle2 className="h-6 w-6" />}
              title="3. Confirmação"
              description="Pagamento confirmado"
              color="bg-green-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Templates ({exampleTemplates.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exampleTemplates.map((template, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{template.template_type}</Badge>
                  <span className="font-medium">{template.name}</span>
                </div>
                <Badge variant="secondary">{template.category}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Ações ({exampleActions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exampleActions.slice(0, 6).map((action, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <code className="text-xs bg-background px-2 py-1 rounded">{action.button_id}</code>
                </div>
                <Badge>{action.action_type}</Badge>
              </div>
            ))}
            {exampleActions.length > 6 && (
              <p className="text-sm text-muted-foreground text-center">
                +{exampleActions.length - 6} mais ações
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Button */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-4">
            {createdItems.templates.length > 0 ? (
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-green-600">Fluxo Criado com Sucesso!</h3>
                <p className="text-muted-foreground">
                  {createdItems.templates.length} templates e {createdItems.actions.length} ações foram criados
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {createdItems.templates.map(name => (
                    <Badge key={name} variant="outline">{name}</Badge>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <Rocket className="h-12 w-12 text-primary" />
                <div className="text-center">
                  <h3 className="text-lg font-bold">Pronto para criar o fluxo de exemplo?</h3>
                  <p className="text-muted-foreground">
                    Isso criará {exampleTemplates.length} templates e {exampleActions.length} ações automaticamente
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={createExampleFlow}
                  disabled={isCreating}
                  className="gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Criar Fluxo de Exemplo
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FlowStep({ 
  icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  color: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`${color} p-4 rounded-full text-white mb-2`}>
        {icon}
      </div>
      <h4 className="font-bold">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
