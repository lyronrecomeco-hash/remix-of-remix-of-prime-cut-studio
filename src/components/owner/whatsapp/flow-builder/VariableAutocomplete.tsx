// =====================================================
// VARIABLE AUTOCOMPLETE - Autocomplete de variáveis
// =====================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, User, Phone, Mail, Calendar, MapPin, Hash, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Variable {
  name: string;
  label: string;
  icon: any;
  description: string;
  category: 'user' | 'conversation' | 'system' | 'custom';
  example: string;
}

const SYSTEM_VARIABLES: Variable[] = [
  // User variables
  { name: 'nome', label: 'Nome', icon: User, description: 'Nome do contato', category: 'user', example: 'João Silva' },
  { name: 'primeiro_nome', label: 'Primeiro Nome', icon: User, description: 'Primeiro nome do contato', category: 'user', example: 'João' },
  { name: 'telefone', label: 'Telefone', icon: Phone, description: 'Número do WhatsApp', category: 'user', example: '11999998888' },
  { name: 'email', label: 'E-mail', icon: Mail, description: 'E-mail do contato', category: 'user', example: 'joao@email.com' },
  
  // Conversation variables
  { name: 'mensagem', label: 'Última Mensagem', icon: Tag, description: 'Texto da última mensagem', category: 'conversation', example: 'Olá, preciso de ajuda' },
  { name: 'botao_clicado', label: 'Botão Clicado', icon: Tag, description: 'ID do botão selecionado', category: 'conversation', example: 'btn_confirm' },
  { name: 'lista_selecionada', label: 'Item Selecionado', icon: Tag, description: 'Item escolhido da lista', category: 'conversation', example: 'opcao_1' },
  
  // System variables
  { name: 'data', label: 'Data Atual', icon: Calendar, description: 'Data de hoje', category: 'system', example: '03/01/2026' },
  { name: 'hora', label: 'Hora Atual', icon: Calendar, description: 'Hora atual', category: 'system', example: '14:30' },
  { name: 'dia_semana', label: 'Dia da Semana', icon: Calendar, description: 'Nome do dia', category: 'system', example: 'Sexta-feira' },
  { name: 'protocolo', label: 'Protocolo', icon: Hash, description: 'ID único da conversa', category: 'system', example: 'ATD-2026-00001' },
];

interface VariableAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onInsert?: (variable: string) => void;
  className?: string;
  placeholder?: string;
  showQuickInsert?: boolean;
}

export const VariableAutocomplete = ({ 
  value, 
  onChange, 
  onInsert,
  className,
  placeholder,
  showQuickInsert = true
}: VariableAutocompleteProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredVariables, setFilteredVariables] = useState<Variable[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Detect {{ pattern
  const detectVariablePattern = useCallback((text: string, position: number) => {
    const beforeCursor = text.slice(0, position);
    const match = beforeCursor.match(/\{\{([a-zA-Z_]*)$/);
    
    if (match) {
      const searchTerm = match[1].toLowerCase();
      const filtered = SYSTEM_VARIABLES.filter(v => 
        v.name.toLowerCase().includes(searchTerm) ||
        v.label.toLowerCase().includes(searchTerm)
      );
      setFilteredVariables(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart || 0;
    setCursorPosition(position);
    onChange(newValue);
    detectVariablePattern(newValue, position);
  };

  // Insert variable
  const insertVariable = useCallback((variable: Variable) => {
    if (!inputRef.current) return;

    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    
    // Find where {{ starts
    const match = beforeCursor.match(/\{\{([a-zA-Z_]*)$/);
    if (match) {
      const startPos = beforeCursor.length - match[0].length;
      const newValue = value.slice(0, startPos) + `{{${variable.name}}}` + afterCursor;
      onChange(newValue);
      
      // Move cursor after variable
      setTimeout(() => {
        if (inputRef.current) {
          const newPos = startPos + variable.name.length + 4; // {{ + name + }}
          inputRef.current.setSelectionRange(newPos, newPos);
          inputRef.current.focus();
        }
      }, 0);
    }
    
    setShowSuggestions(false);
    onInsert?.(variable.name);
  }, [value, cursorPosition, onChange, onInsert]);

  // Quick insert
  const quickInsert = useCallback((variable: Variable) => {
    const newValue = value + `{{${variable.name}}}`;
    onChange(newValue);
    inputRef.current?.focus();
    onInsert?.(variable.name);
  }, [value, onChange, onInsert]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredVariables.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredVariables.length) % filteredVariables.length);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (filteredVariables[selectedIndex]) {
          insertVariable(filteredVariables[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const categoryColors = {
    user: 'bg-blue-500/10 text-blue-500',
    conversation: 'bg-green-500/10 text-green-500',
    system: 'bg-purple-500/10 text-purple-500',
    custom: 'bg-orange-500/10 text-orange-500'
  };

  const categoryLabels = {
    user: 'Usuário',
    conversation: 'Conversa',
    system: 'Sistema',
    custom: 'Custom'
  };

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Digite sua mensagem... Use {{ para variáveis'}
        className={cn(
          'w-full min-h-[100px] p-3 rounded-lg border bg-muted/50 resize-none text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          className
        )}
      />

      {/* Autocomplete dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b bg-muted/30">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Variáveis disponíveis
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredVariables.map((variable, index) => {
                const Icon = variable.icon;
                return (
                  <motion.div
                    key={variable.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => insertVariable(variable)}
                    className={cn(
                      'flex items-center gap-3 p-2 cursor-pointer transition-colors',
                      index === selectedIndex ? 'bg-primary/10' : 'hover:bg-muted'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', categoryColors[variable.category])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-primary">{`{{${variable.name}}}`}</code>
                        <span className="text-xs text-muted-foreground">{variable.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{variable.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
                      {variable.example}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick insert bar */}
      {showQuickInsert && (
        <div className="flex flex-wrap gap-1 mt-2">
          {SYSTEM_VARIABLES.filter(v => v.category === 'user').slice(0, 4).map((variable) => {
            const Icon = variable.icon;
            return (
              <motion.button
                key={variable.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => quickInsert(variable)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
                  'bg-muted/50 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20'
                )}
              >
                <Icon className="w-3 h-3" />
                <code className="font-mono">{`{{${variable.name}}}`}</code>
              </motion.button>
            );
          })}
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground"
          >
            <Tag className="w-3 h-3" />
            mais...
          </motion.button>
        </div>
      )}
    </div>
  );
};

// Compact version for inline use
export const VariableBadges = ({ onInsert }: { onInsert: (variable: string) => void }) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SYSTEM_VARIABLES.slice(0, 6).map((variable) => (
        <motion.button
          key={variable.name}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onInsert(`{{${variable.name}}}`)}
          className={cn(
            'px-2 py-0.5 rounded-md text-[10px] font-mono',
            'bg-primary/10 text-primary hover:bg-primary/20 transition-colors'
          )}
        >
          {`{{${variable.name}}}`}
        </motion.button>
      ))}
    </div>
  );
};
