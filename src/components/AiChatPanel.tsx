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
  Square, FileSpreadsheet, FileText, FolderOpen, Package, Users,
  TrendingUp, AlertCircle, Receipt, Tag
} from 'lucide-react';
import { useAiChat, matchAgentForRoute } from '../context/AiChatContext';
import { AiChatPanelProps, CloudFileItem, AgentHizliIstek } from '../types';
import { AiActionCard } from './AiActionCard';
import { AiMarkdownContent } from './AiMarkdownContent';
import '../styles/AiChatPanel.css';

const renderHizliIstekIcon = (iconName?: string) => {
  switch (iconName) {
    case 'FileSpreadsheet': return <FileSpreadsheet size={13} />;
    case 'FileText': return <FileText size={13} />;
    case 'FolderOpen': return <FolderOpen size={13} />;
    case 'Package': return <Package size={13} />;
    case 'Users': return <Users size={13} />;
    case 'TrendingUp': return <TrendingUp size={13} />;
    case 'AlertCircle': return <AlertCircle size={13} />;
    case 'Receipt': return <Receipt size={13} />;
    case 'Tag': return <Tag size={13} />;
    case 'Sparkle':
    case 'Sparkles':
    default:
      return <Sparkles size={13} />;
  }
};

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
  <div className="ai-default-typing">
    <span className="ai-default-typing-dot" />
    <span className="ai-default-typing-dot ai-default-typing-dot-2" />
    <span className="ai-default-typing-dot ai-default-typing-dot-3" />
  </div>
);

const DefaultThinkingDetails = ({ content, title }: { content: string; title: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="ai-default-thinking">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ai-default-thinking-btn"
      >
        {open ? '▼' : '►'} {title}
      </button>
      {open && (
        <pre className="ai-default-thinking-pre">
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
  const [pendingHizliIstek, setPendingHizliIstek] = useState<AgentHizliIstek | null>(null);
  const [isTextModalOpen, setIsTextModalOpen] = useState<boolean>(false);
  const [modalInputText, setModalInputText] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendMessageRef = useRef(sendMessage);

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // Sol ekranda (Cari Kart, Ürün Kartı, Satış Belgesi, Adres vb.) yapılan kayıt veya iptal işlemini yakala (Sihirbaz Handshake)
  useEffect(() => {
    let lastDispatchedAt = 0;

    const formatSavedEntitySummary = (rawObj: any): string => {
      if (!rawObj || typeof rawObj !== 'object') return '';
      const ignoredKeys = new Set([
        'silindimi',
        'firmaid',
        'sirketid',
        'olusturankullaniciid',
        'guncelleyenkullaniciid',
        'olusturmatarihi',
        'guncellemetarihi',
        'rowversion',
        'password',
        'sifre',
        'token'
      ]);

      const lines: string[] = [];
      Object.entries(rawObj).forEach(([key, val]) => {
        if (val === null || val === undefined || val === '') return;
        if (ignoredKeys.has(key.toLowerCase())) return;
        if (Array.isArray(val)) {
          if (val.length === 0) return;
          lines.push(`- ${key}: ${val.length} kayıt`);
          return;
        }
        if (typeof val === 'object') return;
        lines.push(`- ${key}: ${String(val)}`);
      });
      return lines.slice(0, 20).join('\n');
    };

    const handleEntityUpdated = (event: Event) => {
      const now = Date.now();
      if (now - lastDispatchedAt < 600) return;

      const customEvent = event as CustomEvent<any>;
      const detail = customEvent?.detail;
      if (!detail) return;

      if (detail.entityType === 'CariAdres' && detail.adres) {
        lastDispatchedAt = now;
        const adres = detail.adres;
        const il = adres.adresIl || adres.ilAdi || '';
        const ilce = adres.adresIlce || adres.ilceAdi || '';
        const replyMessage = `Yeni adres kaydını tamamladım: ${adres.baslik} - ${adres.formattedAdres || adres.acikAdres} (${il}/${ilce}). Lütfen işlemi bu yeni adres ile tamamla.`;
        sendMessageRef.current(replyMessage);
        return;
      }

      if (detail.saved === false || detail.cancelled) {
        lastDispatchedAt = now;
        const pageLabel = detail.pageTitle || detail.entityLabel || detail.entityType || detail.route || 'Form';
        const cancelMessage = `Açılan "${pageLabel}" ekranını kaydetmeden kapattım. Lütfen nasıl devam etmek istediğimi sor.`;
        sendMessageRef.current(cancelMessage);
        return;
      }

      if (detail.saved && Array.isArray(detail.importedFiles) && detail.importedFiles.length > 0) {
        lastDispatchedAt = now;
        const files = detail.importedFiles as Array<{
          dosyaAdi: string;
          uzanti?: string;
          boyut?: number;
          kaynak?: string;
          bulutDosyaId?: number | string;
          metinIcerigi?: string;
        }>;

        const cloudTags = files
          .filter(f => f.bulutDosyaId)
          .map(f => `[📎 Bulut Dosyası: ${f.dosyaAdi} (ID: ${f.bulutDosyaId}, Tür: ${f.uzanti || 'Belge'})]`)
          .join('\n');

        const basePrompt = [detail.workflowPrompt, detail.nodePrompt]
          .map(s => (s || '').trim())
          .filter(Boolean)
          .join('\n');

        const fileNames = files.map(f => f.dosyaAdi).join(', ');
        const extractedBlocks = files
          .filter(f => f.metinIcerigi)
          .map(f => `--- [İçeri Aktarılan Dosya: ${f.dosyaAdi}] ---\n${f.metinIcerigi}\n--- [Dosya Sonu: ${f.dosyaAdi}] ---`)
          .join('\n\n');

        const parts: string[] = [];
        if (cloudTags) parts.push(cloudTags);
        if (basePrompt) {
          parts.push(basePrompt);
        } else {
          parts.push(`"${fileNames}" dosyasını içeri aktardım.`);
        }
        if (extractedBlocks) {
          parts.push(extractedBlocks);
        } else if (!cloudTags) {
          parts.push(`İçeri aktarılan dosya: ${fileNames}`);
        }

        sendMessageRef.current(parts.join('\n\n'));
        return;
      }

      if (detail.saved && detail.savedData) {
        lastDispatchedAt = now;
        const summary = formatSavedEntitySummary(detail.savedData);
        const entityLabel = detail.entityLabel || detail.entityType || detail.route || 'Form';
        const workflowHeader = [detail.workflowPrompt, detail.nodePrompt]
          .map(s => (s || '').trim())
          .filter(Boolean)
          .join('\n');
        const bodyMessage = summary
          ? `"${entityLabel}" kaydını aşağıdaki bilgilerle tamamladım:\n${summary}\n\nLütfen kaydedilen bu bilgileri bana özetleyerek teyit et ve görev akışındaki bir sonraki adıma geç.`
          : `"${entityLabel}" kaydını tamamladım. Lütfen kaydedilen bilgileri teyit et ve görev akışındaki bir sonraki adıma geç.`;
        const replyMessage = workflowHeader ? `${workflowHeader}\n\n${bodyMessage}` : bodyMessage;
        sendMessageRef.current(replyMessage);
      }
    };

    window.addEventListener('ai-entity-updated', handleEntityUpdated as EventListener);
    return () => {
      window.removeEventListener('ai-entity-updated', handleEntityUpdated as EventListener);
    };
  }, []);

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
      const found = agents.find(a => Number(a.id) === Number(selectedAgentId));
      if (found) return found;
    }
    if (pageContext?.route && Array.isArray(agents) && agents.length > 0) {
      const routeMatched = matchAgentForRoute(pageContext.route, agents);
      if (routeMatched) return routeMatched;
    }
    return agents && agents.length > 0 ? agents[0] : null;
  }, [selectedAgentId, agents, pageContext?.route]);

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

  const activeHizliIstekler = useMemo<AgentHizliIstek[]>(() => {
    const rawList = currentAgent?.hizliIstekler;
    if (!Array.isArray(rawList) || rawList.length === 0) return [];
    return rawList
      .filter((item: AgentHizliIstek) => item.aktifMi !== false && item.hizliErisimDugmesi !== false)
      .sort((a: AgentHizliIstek, b: AgentHizliIstek) => (a.sira || 0) - (b.sira || 0));
  }, [currentAgent]);

  const defaultSuggestions = useMemo<AgentHizliIstek[]>(() => [
    { id: 'def_1', baslik: t('Bugünkü satış cirosu ve sipariş özeti'), prompt: t('Bugünkü satış cirosu ve sipariş özeti'), ikon: 'TrendingUp', uiAksiyonu: 'YOK' },
    { id: 'def_2', baslik: t('Bu sayfadaki verileri analiz et'), prompt: t('Bu sayfadaki verileri analiz et'), ikon: 'Sparkles', uiAksiyonu: 'YOK' },
    { id: 'def_3', baslik: t('Seçili cariye özel fiyat listesi hazırla'), prompt: t('Seçili cariye özel fiyat listesi hazırla'), ikon: 'Tag', uiAksiyonu: 'YOK' },
    { id: 'def_4', baslik: t('Kritik stok seviyesindeki ürünleri listele'), prompt: t('Kritik stok seviyesindeki ürünleri listele'), ikon: 'Package', uiAksiyonu: 'YOK' }
  ], [t]);

  const displaySuggestions = activeHizliIstekler.length > 0 ? activeHizliIstekler : defaultSuggestions;

  const handleHizliIstekClick = async (item: AgentHizliIstek) => {
    if (isSending) return;

    const rawNodes: any[] = Array.isArray(item.akisDugumleri)
      ? item.akisDugumleri
      : Array.isArray((item as any).AkisDugumleri)
        ? (item as any).AkisDugumleri
        : [];

    const baslaNode = rawNodes.find(
      (n) => (n.id || n.Id) === 'BASLA' || (n.tip || n.Tip) === 'BASLA'
    );
    const nextIdFromBasla = baslaNode?.sonrakiDugumId || baslaNode?.SonrakiDugumId;
    const firstActionNode =
      (nextIdFromBasla
        ? rawNodes.find((n) => (n.id || n.Id) === nextIdFromBasla)
        : null) ||
      rawNodes.find((n) => (n.id || n.Id) !== 'BASLA' && (n.tip || n.Tip) !== 'BASLA') ||
      rawNodes[0] ||
      null;

    const nodeTip = firstActionNode?.tip || firstActionNode?.Tip || '';
    const nodeUiAction = firstActionNode?.uiAksiyonu || firstActionNode?.UiAksiyonu || '';
    const nodeVarlikKodu = firstActionNode?.varlikKodu || firstActionNode?.VarlikKodu || '';
    const nodeTargetRoute =
      firstActionNode?.hedefRota ||
      firstActionNode?.HedefRota ||
      (nodeVarlikKodu === 'dosya-ice-aktar-karti'
        ? '/araclar/dosya-al'
        : nodeVarlikKodu === 'dosya-disa-aktar-karti'
          ? '/araclar/dosya-kaydet'
          : nodeVarlikKodu === 'bulut-dosyalari-karti'
            ? '/araclar/bulut-dosyalari'
            : '');

    const isFormOpenStep =
      nodeTip === 'FORM_AC' ||
      nodeTip === 'EKRAN_AC' ||
      Boolean(nodeTargetRoute) ||
      nodeUiAction === 'OZEL_ROTA';

    const effectiveUiAction = isFormOpenStep
      ? (nodeUiAction && nodeUiAction !== 'YOK' ? nodeUiAction : 'OZEL_ROTA')
      : (item.uiAksiyonu && item.uiAksiyonu !== 'YOK')
        ? item.uiAksiyonu
        : (nodeUiAction || 'YOK');

    const effectivePrompt = (
      item.prompt ||
      baslaNode?.prompt ||
      baslaNode?.Prompt ||
      firstActionNode?.prompt ||
      firstActionNode?.Prompt ||
      item.baslik ||
      ''
    ).trim();

    if (effectiveUiAction === 'BULUT_DOSYA_SEC') {
      setPendingHizliIstek({ ...item, prompt: effectivePrompt, uiAksiyonu: effectiveUiAction });
      setIsCloudPickerOpen(true);
      return;
    }

    if (effectiveUiAction === 'METIN_YAPISTIR_MODAL') {
      setPendingHizliIstek({ ...item, prompt: effectivePrompt, uiAksiyonu: effectiveUiAction });
      setModalInputText('');
      setIsTextModalOpen(true);
      return;
    }

    if (isFormOpenStep || (effectiveUiAction && effectiveUiAction !== 'YOK')) {
      const currentRoute = pageContext?.route || (typeof window !== 'undefined' ? window.location.pathname : '');
      const resolvedTargetRoute = nodeTargetRoute || item.uiParametreleriJson || '';
      const shouldWaitForSave = (firstActionNode?.kayitBekle ?? firstActionNode?.KayitBekle) !== false;

      if (typeof sessionStorage !== 'undefined' && shouldWaitForSave) {
        try {
          sessionStorage.setItem(
            'webakus_ai_waiting_entity',
            JSON.stringify({
              entityType: nodeVarlikKodu || firstActionNode?.baslik || 'Form',
              entityLabel: firstActionNode?.varlikAdi || firstActionNode?.VarlikAdi || firstActionNode?.baslik || item.baslik || 'Form',
              targetUrl: resolvedTargetRoute,
              workflowId: item.id,
              workflowTitle: item.baslik,
              workflowPrompt: effectivePrompt,
              nodeId: firstActionNode?.id || firstActionNode?.Id,
              nodePrompt: (firstActionNode?.prompt || firstActionNode?.Prompt || '').trim(),
              kayitSonrasiTeyitEt: (firstActionNode?.kayitSonrasiTeyitEt ?? firstActionNode?.KayitSonrasiTeyitEt) !== false,
              timestamp: Date.now()
            })
          );
        } catch {
          // ignore storage errors
        }
      }

      window.dispatchEvent(new CustomEvent('ai-trigger-ui-action', {
        detail: {
          action: effectiveUiAction,
          route: currentRoute,
          targetRoute: resolvedTargetRoute,
          params: resolvedTargetRoute,
          workflow: item,
          node: firstActionNode
        }
      }));

      if (!shouldWaitForSave && effectivePrompt) {
        await sendMessage(effectivePrompt);
      }
      return;
    }

    if (effectivePrompt) {
      await sendMessage(effectivePrompt);
    }
  };

  const handleConfirmTextModal = async () => {
    if (!modalInputText.trim() || isSending) return;
    setIsTextModalOpen(false);
    const basePrompt = (pendingHizliIstek?.prompt || pendingHizliIstek?.baslik || '').trim();
    const finalMessage = `${basePrompt}\n\n[KULLANICI TARAFINDAN GİRİLEN METİN]:\n${modalInputText.trim()}`;
    setPendingHizliIstek(null);
    setModalInputText('');
    await sendMessage(finalMessage);
  };

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
              {currentAgent?.ad || t('Webakus ERP Asistanı')}
            </h3>
            <p className="ai-chat-welcome-desc">
              {currentAgent?.aciklama || t('Finans, stok, cari analizleri yapabilir, belge taslakları oluşturabilir ve sistem üzerinde hızlı eylemler gerçekleştirebilirim.')}
            </p>

            <div className="ai-chat-suggestions">
              <span className="ai-suggestions-title">{t('Hızlı ERP İstekleri:')}</span>
              <div className="ai-suggestions-grid">
                {displaySuggestions.map((item, idx) => {
                  const baslik = item.dugmeBasligi?.trim() || item.baslik;
                  const prompt = item.prompt || item.baslik;
                  const ikon = item.ikon;
                  return (
                    <button
                      key={item.id || idx}
                      type="button"
                      className="ai-suggestion-chip"
                      onClick={() => handleHizliIstekClick(item)}
                      title={prompt !== baslik ? prompt : baslik}
                    >
                      {renderHizliIstekIcon(ikon)}
                      <span>{baslik}</span>
                    </button>
                  );
                })}
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
                    <AiMarkdownContent content={cleanText} baseKey={m.id} />
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
                    onSendChatReply={(replyText) => sendMessage(replyText)}
                  />
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="ai-sending-block">
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
              <span className="ai-sending-elapsed">
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
                onClick={() => {
                  setPendingHizliIstek(null);
                  setIsCloudPickerOpen(true);
                }}
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
          onClose={() => {
            setIsCloudPickerOpen(false);
            setPendingHizliIstek(null);
          }}
          onSelectFile={async (selected: any) => {
            const fileUrl = selected.bulutDosyaUrl || selected.BulutDosyaUrl || selected.url || '';
            const file: CloudFileItem = {
              id: selected.id || selected.Id,
              dosyaAdi: selected.dosyaAdi || selected.DosyaAdi || selected.name || t('Dosya'),
              dosyaBoyutu: selected.dosyaBoyutu || selected.DosyaBoyutu || selected.size,
              dosyaTipi: selected.dosyaTipi || selected.DosyaTipi || selected.type,
              bulutDosyaUrl: fileUrl,
              url: fileUrl,
              provider: selected.provider || selected.Provider,
              belgeNo: selected.belgeNo || selected.BelgeNo,
              belgeTuru: selected.belgeTuru || selected.BelgeTuru
            };
            setIsCloudPickerOpen(false);

            if (pendingHizliIstek) {
              const basePrompt = (pendingHizliIstek.prompt || pendingHizliIstek.baslik || '').trim();
              const combinedPrompt = `${basePrompt}\n\n[Eklenen Bulut Dosyası: ${file.dosyaAdi} (ID: ${file.id}, URL: ${file.url})]`;
              setPendingHizliIstek(null);
              await sendMessage(combinedPrompt);
              return;
            }

            setAttachedFiles(prev => {
              if (prev.some(f => f.id === file.id)) return prev;
              return [...prev, file];
            });
          }}
        />
      )}

      {/* ─── 6. Kampanya / Belge Metni Giriş Penceresi (isTextModalOpen) ─── */}
      {isTextModalOpen && (
        <div
          className="ai-text-prompt-modal-overlay"
          onClick={() => {
            setIsTextModalOpen(false);
            setPendingHizliIstek(null);
          }}
        >
          <div
            className="ai-text-prompt-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ai-text-prompt-modal-header">
              <div className="ai-text-prompt-modal-title-group">
                <span className="ai-text-prompt-modal-icon">
                  {renderHizliIstekIcon(pendingHizliIstek?.ikon || 'FileText')}
                </span>
                <h4 className="ai-text-prompt-modal-title">
                  {pendingHizliIstek?.baslik || t('Metin İçeriği Girin')}
                </h4>
              </div>
              <button
                type="button"
                className="ai-text-prompt-modal-close"
                onClick={() => {
                  setIsTextModalOpen(false);
                  setPendingHizliIstek(null);
                }}
                title={t('Kapat')}
              >
                <X size={16} />
              </button>
            </div>

            <div className="ai-text-prompt-modal-body">
              <p className="ai-text-prompt-modal-desc">
                {t('Analiz edilmesini ve belgeye dönüştürülmesini istediğiniz kampanya metnini, fiyat listesini veya belge içeriğini aşağıya yapıştırın.')}
              </p>
              <textarea
                className="ai-text-prompt-textarea"
                rows={8}
                autoFocus
                value={modalInputText}
                onChange={(e) => setModalInputText(e.target.value)}
                placeholder={t('Kampanya metnini, fiyat listesini veya belge metnini buraya yapıştırın...')}
              />
            </div>

            <div className="ai-text-prompt-modal-footer">
              <button
                type="button"
                className="ai-text-prompt-btn-cancel"
                onClick={() => {
                  setIsTextModalOpen(false);
                  setPendingHizliIstek(null);
                }}
              >
                {t('İptal')}
              </button>
              <button
                type="button"
                className="ai-text-prompt-btn-submit"
                disabled={!modalInputText.trim() || isSending}
                onClick={handleConfirmTextModal}
              >
                <Sparkles size={15} />
                <span>{t('Analiz Et ve Belge Oluştur')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AiChatPanel;
