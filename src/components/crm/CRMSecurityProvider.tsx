import React, { useEffect } from 'react';

/**
 * CRM Security Protection Hook
 * Implements advanced security measures to protect the CRM panel
 * IMPORTANT: Allows drag-and-drop for elements with data-allow-drag attribute
 */
export function useCRMSecurity() {
  useEffect(() => {
    // Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Block keyboard shortcuts for DevTools
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      
      // Block Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      
      // Block Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
      
      // Block Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
      
      // Block Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+S (Save page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }
    };

    // Detect DevTools opening via timing - less aggressive
    let devtoolsOpen = false;
    let lastCheck = Date.now();
    const detectDevTools = () => {
      // Only check if enough time has passed (prevents performance issues)
      const now = Date.now();
      if (now - lastCheck < 2000) return;
      lastCheck = now;

      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          console.clear();
          console.log('%cAcesso não autorizado!', 'color: red; font-size: 20px; font-weight: bold;');
        }
      } else {
        devtoolsOpen = false;
      }
    };

    // Block selection on non-input elements
    const handleSelect = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
        e.preventDefault();
        return false;
      }
    };

    // Block copy for non-input elements
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        if (!target.closest('[data-allow-copy]')) {
          e.preventDefault();
        }
      }
    };

    // Block drag ONLY for images - allow drag for elements with data-allow-drag
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      
      // Allow drag if element or ancestor has data-allow-drag
      if (target.closest('[data-allow-drag]') || target.hasAttribute('draggable')) {
        return true;
      }
      
      // Block only for images
      if (target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelect);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('dragstart', handleDragStart);
    
    // DevTools detection interval - less aggressive (every 3 seconds)
    const devToolsInterval = setInterval(detectDevTools, 3000);

    // Add CSS to prevent selection on non-input elements
    const style = document.createElement('style');
    style.id = 'crm-security-styles';
    style.textContent = `
      .crm-protected {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      .crm-protected input,
      .crm-protected textarea,
      .crm-protected [contenteditable="true"] {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelect);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('dragstart', handleDragStart);
      clearInterval(devToolsInterval);
      
      const styleElement = document.getElementById('crm-security-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);
}

export default function CRMSecurityProvider({ children }: { children: React.ReactNode }) {
  useCRMSecurity();
  
  return (
    <div className="crm-protected">
      {children}
    </div>
  );
}
