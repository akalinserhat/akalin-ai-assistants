/**
 * @file AiChatPanel.tsx
 * @description
 * @akalin/ai-assistants - Global Yapay Zeka Chat ve Etkileşim Paneli Bileşeni.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { 
  Bot, Sparkles, X, Plus, Trash2, Edit3, Check, MessageSquare, 
  Send, Mic, MicOff, Layers, Maximize2, Compass, Sparkle, Paperclip,
  Square
} from 'lucide-react';
import { useAiChat } from '../context/AiChatContext';
import { AiChatPanelProps, CloudFileItem } from '../types';
import { AiActionCard } from './AiActionCard';

// ─── AKALIN UI ENTEGRASYONU VE GÜVENLİ FALLBACK'LER ─────────────────────────

let AkalinUiTypingIndicator: any = null;
let AkalinUiResponseTimer: any = null;
let AkalinUiThinkingDetails: any = null;
let AkalinUiFilesOnClouds: any = null;

try {
  // @ts-ignore
  const ui = require('@akalin/ui');
  AkalinUiTypingIndicator = ui.AiTypingIndicator;
  AkalinUiResponseTimer = ui.AiResponseTimer;
  AkalinUiThinkingDetails = ui.AiThinkingDetails;
  AkalinUiFilesOnClouds = ui.FilesOnClouds;
} catch {
  // Fallback devrede
}

const DefaultTypingIndicator = () => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'var(--bg-secondary, #f1f5f9)', borderRadius: '16px' }}>
    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-color, #3b82f6)', animation: 'pulse 1s infinite' }} />
    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-color, #3b82f6)', animation: 'pulse 1s infinite 0.2s' }} />
    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-color, #3b82f6)', animation: 'pulse 1s infinite 0.4s' }} />
  </div>
);

const DefaultThinkingDetails = ({ content, title }: { content: string; title: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: '8px', border: '1px dashed var(--border-color, #cbd5e1)', borderRadius: '6px', padding: '8px', fontSize: '12px' }}>
      <button 
        type="button" 
        onClick={() => setOpen(!open)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}
      >
        {open ? '▼' : '►'} {title}
      </button>
      {open && (
        <pre style={{ marginTop: '6px', whiteSpace: 'pre-wrap', color: 'var(--text-secondary, #475569)', fontFamily: 'monospace' }}>
          {content}
        </pre>
      )}
    </div>
  );
};

// ─── ROTA BELGE BAĞLAMI TESPİTİ ─────────────────────────────────────────────

const resolveRouteToDocContext = (pathname: string) => {
  const cleanPath = (pathname || '').split('?')[0].toLowerCase();
  
  if (cleanPath.startsWith('/siparisler/alinan')) {
    const idMatch = cleanPath.match(/\/siparisler\/alinan\/(\d+)/);
    return {
      documentType: 'AlinanSiparis',
      documentId: idMatch ? parseInt(idMatch[1], 10) : undefined
    };
  }
  if (cleanPath.startsWith('/siparisler/verilen')) {
    const idMatch = cleanPath.match(/\/siparisler\/verilen\/(\d+)/);
    return {
      documentType: 'VerilenSiparis',
      documentId: idMatch ? parseInt(idMatch[1], 10) : undefined
    };
  }
  if (cleanPath.startsWith('/faturalar')) {
    const idMatch = cleanPath.match(/\/faturalar\/(\d+)/) || cleanPath.match(/\/faturalar\/duzenle\/(\d+)/);
    return {
      documentType: 'Fatura',
      documentId: idMatch ? parseInt(idMatch[1], 10) : undefined
    };
  }
  if (cleanPath.startsWith('/irsaliyeler')) {
    const idMatch = cleanPath.match(/\/irsaliyeler\/(\d+)/) || cleanPath.match(/\/irsaliyeler\/duzenle\/(\d+)/);
    return {
      documentType: 'Irsaliye',
      documentId: idMatch ? parseInt(idMatch[1], 10) : undefined
    };
  }
  if (cleanPath.startsWith('/fiyat-listeleri')) {
    const idMatch = cleanPath.match(/\/fiyat-listeleri\/(\d+)/);
    return {
      documentType: 'FiyatListesi',
      documentId: idMatch ? parseInt(idMatch[1], 10) : undefined
    };
  }
  if (cleanPath.startsWith('/kampanyalar')) {
    const idMatch = cleanPath.match(/\/kampanyalar\/(\d+)/) || cleanPath.match(/\/kampanyalar\/duzenle\/(\d+)/);
    return {
      documentType: 'KampanyaBelgesi',
      documentId: idMatch ? parseInt(idMatch[1], 10) : undefined
    };
  }
  if (cleanPath.startsWith('/cariler')) {
    const idMatch = cleanPath.match(/\/cariler\/(\d+)/) || cleanPath.match(/\/cariler\/duzenle\/(\d+)/);
    return {
      documentType: 'Cari',
      documentId: idMatch ? parseInt(idMatch[1], 10) : undefined
    };
  }
  if (cleanPath.startsWith('/urun-ve-hizmetler')) {
    const idMatch = cleanPath.match(/\/urun-ve-hizmetler\/(\d+)/) || cleanPath.match(/\/urun-ve-hizmetler\/duzenle\/(\d+)/);
    return {
      documentType: 'Urun',
      documentId: idMatch ? parseInt(idMatch[1], 10) : undefined
    };
  }

  return {
    documentType: undefined,
    documentId: undefined
  };
};

// ─── ANA BİLEŞEN ────────────────────────────────────────────────────────────

export const AiChatPanel: React.FC<AiChatPanelProps> = ({ 
  className = '', 
  onApplyAiData,
  showCloudFiles = true,
  onClose
}) => {
  const { t } = useTranslation();
  const {
    isOpen,
    panelMode,
    setPanelMode,
    closePanel,
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    isSending,
    sendMessage,
    stopGenerating,
    startNewSession,
    deleteSession,
    renameSession,
    pageContext,
    agents,
    selectedAgentId,
    setSelectedAgentId
  } = useAiChat();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSessionDrawerOpen, setIsSessionDrawerOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleText, setEditTitleText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<CloudFileItem[]>([]);
  const [isCloudPickerOpen, setIsCloudPickerOpen] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Yanıt üretim süresi sayacı (Timer)
  useEffect(() => {
    let timer: any = null;
    if (isSending) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSending]);
  
  const docContext = useMemo(() => {
    const path = pageContext?.route || (typeof window !== 'undefined' ? window.location.pathname : '');
    return resolveRouteToDocContext(path);
  }, [pageContext?.route]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const currentAgent = useMemo(() => {
    if (selectedAgentId && Array.isArray(agents)) {
      return agents.find(a => a.id === selectedAgentId);
    }
    return agents && agents.length > 0 ? agents[0] : null;
  }, [selectedAgentId, agents]);

  // Otomatik alta kaydır
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isSending]);

  // Panel açıldığında inputa odaklan
  useEffect(() => {
    if (isOpen && !isSessionDrawerOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, activeSessionId, isSessionDrawerOpen]);

  // Sesli Yazdırma (Web Speech API)
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error(t('Tarayıcınız sesle yazmayı desteklememektedir.'));
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputPrompt(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Dinamik textarea boyutu
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollH = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(Math.max(scrollH, 24), 180)}px`;
    }
  }, [inputPrompt]);

  const handleSend = async () => {
    if ((!inputPrompt.trim() && attachedFiles.length === 0) || isSending) return;
    
    let textToSend = inputPrompt.trim();
    if (attachedFiles.length > 0) {
      const fileTags = attachedFiles.map(f => `[📎 Bulut Dosyası: ${f.dosyaAdi} (ID: ${f.id}, Tür: ${f.dosyaTipi || 'Belge'})]`).join('\n');
      textToSend = textToSend ? `${fileTags}\n\n${textToSend}` : `${fileTags}\nLütfen ekli bulut dosyasını/dosyalarını inceleyip ilgili ERP işlemlerini gerçekleştirin.`;
    }

    setInputPrompt('');
    setAttachedFiles([]);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    await sendMessage(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartRename = () => {
    if (activeSession) {
      setEditTitleText(activeSession.baslik);
      setIsEditingTitle(true);
    }
  };

  const handleSaveRename = () => {
    if (activeSessionId && editTitleText.trim()) {
      renameSession(activeSessionId, editTitleText);
    }
    setIsEditingTitle(false);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closePanel();
    }
  };

  const quickSuggestions = [
    t('Bugünkü satış cirosu ve sipariş özeti'),
    t('Bu sayfadaki verileri analiz et'),
    t('Seçili cariye özel fiyat listesi hazırla'),
    t('Kritik stok seviyesindeki ürünleri listele')
  ];

  if (!isOpen) return null;

  const TypingIndicatorComponent = AkalinUiTypingIndicator || DefaultTypingIndicator;
  const ThinkingDetailsComponent = AkalinUiThinkingDetails || DefaultThinkingDetails;
  const FilesOnCloudsComponent = AkalinUiFilesOnClouds;

  return (
    <aside className={`ai-chat-panel ${panelMode === 'floating' ? 'ai-chat-floating' : 'ai-chat-docked'} ${className}`}>
      {/* ─── 1. Header ─────────────────────────────────────────── */}
      <div className="ai-chat-header">
        <div className="ai-chat-header-left">
          <button
            type="button"
            className={`ai-btn-icon ${isSessionDrawerOpen ? 'active' : ''}`}
            onClick={() => setIsSessionDrawerOpen(!isSessionDrawerOpen)}
            title={t('Geçmiş Sohbetler')}
          >
            <MessageSquare size={18} />
          </button>

          <div className="ai-header-title-container">
            {isEditingTitle ? (
              <div className="ai-title-edit-box">
                <input
                  type="text"
                  className="ai-title-input"
                  value={editTitleText}
                  onChange={(e) => setEditTitleText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  autoFocus
                  placeholder={t('Konu Başlığı...')}
                />
                <button type="button" className="ai-btn-title-save" onClick={handleSaveRename} title={t('Kaydet')}>
                  <Check size={14} />
                </button>
                <button type="button" className="ai-btn-title-cancel" onClick={() => setIsEditingTitle(false)} title={t('Vazgeç')}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="ai-title-display-box">
                <span className="ai-status-indicator" title={t('Çevrimiçi')} />
                <span className="ai-header-title" title={activeSession?.baslik || t('Yeni Konu')}>
                  {activeSession?.baslik || t('Yeni Konu')}
                </span>
                <button
                  type="button"
                  className="ai-btn-title-edit"
                  onClick={handleStartRename}
                  title={t('Konu Başlığını Düzenle')}
                >
                  <Edit3 size={13} className="ai-title-edit-icon" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="ai-chat-header-actions">
          <button
            type="button"
            className="ai-btn-icon"
            onClick={startNewSession}
            title={t('Yeni Sohbet Başlat')}
          >
            <Plus size={18} />
          </button>

          <button
            type="button"
            className="ai-btn-icon"
            onClick={() => setPanelMode(panelMode === 'floating' ? 'docked' : 'floating')}
            title={panelMode === 'floating' ? t('Kenara Sabitle (Dock)') : t('Kayan Pencere Yap (Float)')}
          >
            {panelMode === 'floating' ? <Layers size={17} /> : <Maximize2 size={17} />}
          </button>

          <button
            type="button"
            className="ai-btn-icon"
            onClick={handleClose}
            title={t('Kapat')}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ─── 2. Oturumlar Çekmecesi (Session Drawer) ───────────── */}
      {isSessionDrawerOpen && (
        <div className="ai-session-drawer">
          <div className="ai-session-drawer-header">
            <span className="ai-session-drawer-title">{t('Sohbet Oturumları')}</span>
          </div>

          <div className="ai-session-list">
            {sessions.length === 0 ? (
              <div className="ai-session-empty">{t('Henüz geçmiş sohbet yok.')}</div>
            ) : (
              sessions.map(s => (
                <div
                  key={s.id}
                  className={`ai-session-item ${s.id === activeSessionId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setIsSessionDrawerOpen(false);
                  }}
                >
                  <MessageSquare size={15} className="ai-session-item-icon" />
                  <div className="ai-session-item-info">
                    <span className="ai-session-item-title">{s.baslik}</span>
                    {s.sonMesajOzet && (
                      <span className="ai-session-item-snippet">{s.sonMesajOzet}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ai-session-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(s.id);
                    }}
                    title={t('Oturumu Sil')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── 3. Aktif Sayfa Bağlamı ve Ajan Bilgisi ─────────────────────── */}
      <div className="ai-page-context-bar">
        <div className="ai-context-pill" title={`${t('Bağlam')}: ${pageContext.route || t('Genel ERP')}`}>
          <Compass size={12} className="ai-context-icon" />
          <span className="ai-context-label">{t('Bağlam')}:</span>
          <strong className="ai-context-value">{pageContext.route || t('Genel ERP')}</strong>
        </div>

        <div className="ai-agent-pill" title={`${t('Ajan')}: ${agents.find(a => a.id === selectedAgentId)?.ad || t('Varsayılan Ajan')}`}>
          <Bot size={12} className="ai-agent-icon" />
          <span className="ai-agent-label">{t('Ajan')}:</span>
          <select
            className="ai-agent-select"
            value={selectedAgentId || ''}
            onChange={(e) => setSelectedAgentId(e.target.value ? parseInt(e.target.value, 10) : null)}
            title={agents.find(a => a.id === selectedAgentId)?.ad || t('Varsayılan Ajan')}
          >
            <option value="">{t('Varsayılan Ajan')}</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.ad}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── 4. Mesaj Listesi (Chat Body) ───────────────────────── */}
      <div className="ai-chat-body">
        {messages.length === 0 && !isSending && (
          <div className="ai-chat-welcome">
            <div className="ai-chat-welcome-avatar">
              <Bot size={30} />
            </div>
            <h3 className="ai-chat-welcome-title">
              {t('Webakus ERP Asistanı')}
            </h3>
            <p className="ai-chat-welcome-desc">
              {t('Finans, stok, cari analizleri yapabilir, belge taslakları oluşturabilir ve sistem üzerinde hızlı eylemler gerçekleştirebilirim.')}
            </p>

            <div className="ai-chat-suggestions">
              <span className="ai-suggestions-title">{t('Hızlı ERP İstekleri:')}</span>
              <div className="ai-suggestions-grid">
                {quickSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="ai-suggestion-chip"
                    onClick={() => sendMessage(sug)}
                  >
                    <Sparkle size={13} />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m) => {
          let cleanText = m.icerik;
          let thinkingContent = '';

          if (m.role === 'assistant') {
            const thinkMatch = cleanText.match(/<think>([\s\S]*?)<\/think>/i);
            if (thinkMatch) {
              thinkingContent = thinkMatch[1].trim();
              cleanText = cleanText.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
            }

            if (m.eylemVerisiJson) {
              const jsonMatch = cleanText.match(/```(?:json|plaintext)?\s*(\{[\s\S]*?\})\s*```/i);
              if (jsonMatch) {
                if (!thinkingContent) thinkingContent = jsonMatch[1].trim();
                cleanText = cleanText.replace(/```(?:json|plaintext)?\s*\{[\s\S]*?\}\s*```/i, '').trim();
              }
            }

            if (!cleanText && (thinkingContent || m.eylemVerisiJson)) {
              cleanText = t('Yapay zeka analizini tamamladı ve ilgili ERP eylemini hazırladı.');
            }
          }

          return (
            <div key={m.id} className={`ai-message-row ${m.role === 'user' ? 'ai-message-row-user' : 'ai-message-row-assistant'}`}>
              {m.role === 'assistant' && (
                <div className="ai-avatar-assistant">
                  <Bot size={16} />
                </div>
              )}

              <div className="ai-message-content-group">
                <div className={`ai-message-bubble ${m.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-assistant'}`}>
                  <div className="ai-message-text">
                    {cleanText}
                  </div>

                  {m.role === 'assistant' && (
                    <div className={`ai-message-source-badge ${m.canliLlmMi ? 'live-llm' : 'local-rule'}`}>
                      {m.canliLlmMi ? (
                        <>
                          <Sparkles size={11} className="ai-source-icon" />
                          <span className="ai-source-name">{m.modelBilgisi || t('Canlı Yapay Zeka')}</span>
                        </>
                      ) : (
                        <>
                          <Bot size={11} className="ai-source-icon" />
                          <span className="ai-source-name">{m.modelBilgisi || t('Yerel Kural Motoru (MCP)')}</span>
                        </>
                      )}
                      {m.islemSuresiMs != null && m.islemSuresiMs > 0 && (
                        <span className="ai-source-time">• {Math.round(m.islemSuresiMs)}ms</span>
                      )}
                    </div>
                  )}
                </div>

                {thinkingContent && (
                  <ThinkingDetailsComponent
                    content={thinkingContent}
                    title={t('Teknik Analiz ve Çıkarım Detayları')}
                  />
                )}

                {m.eylemVerisiJson && (
                  <AiActionCard
                    rawJson={m.eylemVerisiJson}
                    onApply={onApplyAiData}
                  />
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="ai-sending-block" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px' }}>
            <TypingIndicatorComponent />
            {AkalinUiResponseTimer ? (
              <AkalinUiResponseTimer
                elapsedSeconds={elapsedSeconds}
                onStop={stopGenerating}
                agentName={currentAgent?.ad}
                showLongWaitingWarning={true}
                longWaitingThreshold={10}
              />
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
                {elapsedSeconds}s
              </span>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── 5. Girdi Kutusu (Chat Input) ───────────────────────── */}
      <div className="ai-chat-footer">
        {attachedFiles.length > 0 && (
          <div className="ai-attached-files-bar">
            {attachedFiles.map((file) => (
              <div key={file.id} className="ai-attached-file-chip">
                <Paperclip size={12} className="ai-attached-file-icon" />
                <span className="ai-attached-file-name" title={file.dosyaAdi}>
                  {file.dosyaAdi}
                </span>
                <button
                  type="button"
                  className="ai-attached-file-remove"
                  onClick={() => setAttachedFiles(prev => prev.filter(f => f.id !== file.id))}
                  title={t('Dosyayı Kaldır')}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="ai-input-container">
          <textarea
            ref={inputRef}
            className="ai-chat-textarea"
            placeholder={isSending ? t('Yapay zeka yanıt üretiyor...') : t('Yapay zekaya bir ERP görevi verin...')}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isSending}
          />

          <div className="ai-input-buttons">
            {showCloudFiles && FilesOnCloudsComponent && (
              <button
                type="button"
                className={`ai-btn-input-action ${attachedFiles.length > 0 ? 'active' : ''}`}
                onClick={() => setIsCloudPickerOpen(true)}
                title={t('Buluttan Dosya Ekle')}
                disabled={isSending}
              >
                <Paperclip size={18} />
              </button>
            )}

            <button
              type="button"
              className={`ai-btn-input-action ${isListening ? 'listening' : ''}`}
              onClick={toggleSpeechRecognition}
              title={isListening ? t('Dinlemeyi Durdur') : t('Sesle Yazdır')}
              disabled={isSending}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {isSending ? (
              <button
                type="button"
                className="ai-btn-stop"
                onClick={stopGenerating}
                title={t('Yanıt Üretimini Durdur')}
              >
                <Square size={14} fill="currentColor" />
                <span>{t('Durdur')}</span>
              </button>
            ) : (
              <button
                type="button"
                className="ai-btn-send"
                onClick={handleSend}
                disabled={!inputPrompt.trim() && attachedFiles.length === 0}
                title={t('Gönder (Enter)')}
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {isCloudPickerOpen && FilesOnCloudsComponent && (
        <FilesOnCloudsComponent
          isOpen={isCloudPickerOpen}
          isModal={true}
          showFolderTree={true}
          documentType={docContext.documentType}
          documentId={docContext.documentId}
          onClose={() => setIsCloudPickerOpen(false)}
          onSelectFile={(selected: any) => {
            const fileItem: CloudFileItem = {
              id: selected.id || selected.Id,
              dosyaAdi: selected.dosyaAdi || selected.DosyaAdi || selected.name || 'Dosya',
              dosyaBoyutu: selected.dosyaBoyutu || selected.DosyaBoyutu || selected.size,
              dosyaTipi: selected.dosyaTipi || selected.DosyaTipi || selected.type,
              bulutDosyaUrl: selected.bulutDosyaUrl || selected.BulutDosyaUrl || selected.url,
              provider: selected.provider || selected.Provider,
              belgeNo: selected.belgeNo || selected.BelgeNo,
              belgeTuru: selected.belgeTuru || selected.BelgeTuru
            };
            setAttachedFiles(prev => {
              if (prev.some(f => f.id === fileItem.id)) return prev;
              return [...prev, fileItem];
            });
            setIsCloudPickerOpen(false);
          }}
        />
      )}
    </aside>
  );
};

export default AiChatPanel;
