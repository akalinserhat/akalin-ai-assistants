/**
 * @file AiAssistantButton.tsx
 * @description
 * @akalin/ai-assistants - Üst Başlık (Header) ve Araç Çubuğu için Tak-Çalıştır AI Asistan Butonu.
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAiChat } from '../context/AiChatContext';
import { AiAssistantButtonProps } from '../types';

export const AiAssistantButton: React.FC<AiAssistantButtonProps> = ({
  className = '',
  title,
  label,
  showLabel = true,
  iconSize = 16,
  onClick,
  variant = 'header'
}) => {
  const { isOpen, togglePanel } = useAiChat();
  const { t } = useTranslation();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      togglePanel();
    }
  };

  const defaultTitle = title || t('ai_asistan_tooltip', 'Webakus Yapay Zeka Asistanı');
  const defaultLabel = label || t('ai_asistan_baslik', 'AI Asistan');

  if (variant === 'floating') {
    return (
      <button
        type="button"
        className={`btn-ai-floating ${isOpen ? 'active' : ''} ${className}`}
        onClick={handleClick}
        title={defaultTitle}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-color, #3b82f6)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 998,
          transition: 'all 0.2s ease'
        }}
      >
        <Sparkles size={iconSize + 4} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`btn-header-ai ${isOpen ? 'active' : ''} ${className}`}
      onClick={handleClick}
      title={defaultTitle}
    >
      <Sparkles size={iconSize} />
      {showLabel && <span>{defaultLabel}</span>}
    </button>
  );
};

export default AiAssistantButton;
