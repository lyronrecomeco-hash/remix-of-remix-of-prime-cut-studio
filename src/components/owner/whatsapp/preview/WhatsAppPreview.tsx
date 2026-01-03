import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, ChevronRight, List as ListIcon } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateButton {
  id: string;
  text: string;
  action?: string;
  payload?: string;
}

interface ListRow {
  id: string;
  title: string;
  description?: string;
}

interface ListSection {
  title: string;
  rows: ListRow[];
}

interface WhatsAppPreviewProps {
  templateType: string;
  messageContent: string;
  buttons: TemplateButton[];
  listSections: ListSection[];
  buttonText: string;
  footerText: string;
  variables: Record<string, string>;
  onButtonClick?: (buttonId: string) => void;
  onListItemClick?: (itemId: string) => void;
}

export const WhatsAppPreview = ({
  templateType,
  messageContent,
  buttons,
  listSections,
  buttonText,
  footerText,
  variables,
  onButtonClick,
  onListItemClick,
}: WhatsAppPreviewProps) => {
  const [isListOpen, setIsListOpen] = useState(false);
  const [clickedButton, setClickedButton] = useState<string | null>(null);

  // Replace variables in content
  const renderContent = (text: string) => {
    let rendered = text;
    Object.entries(variables).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return rendered;
  };

  // Parse WhatsApp formatting
  const parseFormatting = (text: string) => {
    // Bold: *text*
    text = text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
    // Italic: _text_
    text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
    // Strikethrough: ~text~
    text = text.replace(/~([^~]+)~/g, '<del>$1</del>');
    // Monospace: ```text```
    text = text.replace(/```([^`]+)```/g, '<code>$1</code>');
    return text;
  };

  const handleButtonClick = (buttonId: string) => {
    setClickedButton(buttonId);
    setTimeout(() => setClickedButton(null), 300);
    onButtonClick?.(buttonId);
    toast.info(`Botão clicado: ${buttonId}`);
  };

  const handleListItemClick = (itemId: string) => {
    setIsListOpen(false);
    onListItemClick?.(itemId);
    toast.info(`Opção selecionada: ${itemId}`);
  };

  const formattedMessage = parseFormatting(renderContent(messageContent));

  return (
    <div className="relative">
      {/* Phone Frame */}
      <div className="w-[320px] h-[580px] bg-[#0b141a] rounded-[2.5rem] p-3 shadow-2xl border-4 border-[#1f2c34]">
        {/* Notch */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#0b141a] rounded-b-xl z-10" />
        
        {/* Screen */}
        <div className="w-full h-full rounded-[2rem] overflow-hidden flex flex-col bg-[#0b141a]">
          {/* WhatsApp Header */}
          <div className="bg-[#1f2c34] px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-sm">
              G
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Genesis</p>
              <p className="text-[#8696a0] text-xs">online</p>
            </div>
          </div>

          {/* Chat Area */}
          <div 
            className="flex-1 p-3 overflow-y-auto"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: '#0b141a',
            }}
          >
            {/* Message Bubble */}
            <div className="max-w-[85%] ml-auto">
              <div className="bg-[#005c4b] rounded-lg rounded-tr-none p-3 shadow-sm">
                {/* Message Content */}
                <div 
                  className="text-[#e9edef] text-sm whitespace-pre-wrap break-words leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formattedMessage }}
                />
                
                {/* Footer */}
                {footerText && (
                  <p className="text-[#8696a0] text-xs mt-2 pt-2 border-t border-[#ffffff15]">
                    {renderContent(footerText)}
                  </p>
                )}

                {/* Timestamp & Checkmarks */}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-[#8696a0]">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                </div>
              </div>

              {/* Reply Buttons (for buttons type) */}
              {(templateType === 'buttons' || templateType === 'cta') && buttons.length > 0 && (
                <div className="mt-2 space-y-1">
                  {buttons.map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => handleButtonClick(btn.id)}
                      className={cn(
                        "w-full bg-[#1f2c34] text-[#00a884] text-sm font-medium py-2.5 px-4 rounded-lg",
                        "hover:bg-[#2a3942] active:scale-[0.98] transition-all",
                        "border border-[#2a3942]",
                        clickedButton === btn.id && "bg-[#2a3942] scale-[0.98]"
                      )}
                    >
                      {renderContent(btn.text)}
                    </button>
                  ))}
                </div>
              )}

              {/* List Button (for list type) */}
              {templateType === 'list' && listSections.length > 0 && (
                <button
                  onClick={() => setIsListOpen(true)}
                  className="w-full mt-2 bg-[#1f2c34] text-[#00a884] text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-[#2a3942] transition-all border border-[#2a3942] flex items-center justify-center gap-2"
                >
                  <ListIcon className="w-4 h-4" />
                  {buttonText}
                </button>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
            <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2">
              <span className="text-[#8696a0] text-sm">Mensagem</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* List Modal Overlay */}
      {isListOpen && (
        <div 
          className="absolute inset-0 bg-black/50 flex items-end justify-center rounded-[2.5rem] overflow-hidden"
          onClick={() => setIsListOpen(false)}
        >
          <div 
            className="w-full bg-[#1f2c34] rounded-t-2xl max-h-[70%] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* List Header */}
            <div className="px-4 py-3 border-b border-[#2a3942]">
              <p className="text-white font-medium text-center">{buttonText}</p>
            </div>
            
            {/* List Sections */}
            <div className="overflow-y-auto max-h-[300px]">
              {listSections.map((section, sIdx) => (
                <div key={sIdx}>
                  <p className="px-4 py-2 text-[#00a884] text-xs font-medium uppercase tracking-wider bg-[#182229]">
                    {section.title}
                  </p>
                  {section.rows.map((row) => (
                    <button
                      key={row.id}
                      onClick={() => handleListItemClick(row.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2a3942] transition-colors text-left"
                    >
                      <div className="flex-1">
                        <p className="text-white text-sm">{row.title}</p>
                        {row.description && (
                          <p className="text-[#8696a0] text-xs mt-0.5">{row.description}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8696a0]" />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
