/**
 * PACK ENTERPRISE: Error Boundary Global
 * Captura erros de renderização e previne crash da aplicação
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log para monitoramento
    console.error('[ErrorBoundary] Erro capturado:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback 
        error={this.state.error} 
        onRetry={this.handleRetry}
        onGoHome={this.handleGoHome}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  onGoHome: () => void;
}

export function ErrorFallback({ error, onRetry, onGoHome }: ErrorFallbackProps): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-destructive/10">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Ops! Algo deu errado
          </h1>
          <p className="text-muted-foreground">
            Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
          </p>
        </div>

        {error && process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-muted rounded-lg text-left overflow-auto max-h-32">
            <code className="text-xs text-muted-foreground break-all">
              {error.message}
            </code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onRetry} variant="default" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </Button>
          <Button onClick={onGoHome} variant="outline" className="gap-2">
            <Home className="w-4 h-4" />
            Ir para Início
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Se o problema persistir, tente limpar o cache do navegador ou entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
}

export default ErrorBoundary;
