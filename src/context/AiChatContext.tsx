/**
 * @file AiChatContext.tsx
 * @description
 * @akalin/ai-assistants - Yapay Zeka Sohbet ve Durum Yönetimi Context Sağlayıcısı.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import toast from 'react-hot-toast';
import {
  AiSession,
  AiMessage,
  AiPanelMode,
  AiPageContext,
  AiChatContextType,
  AiChatProviderProps,
  AgentDefinition,
  AiAttachedFilePayload,
  IAiChatAdapter
} from '../types';
import { createRestAiChatAdapter } from '../adapters/AiChatAdapter';

// ─── VARSAYILAN SİSTEM AJANLARI ─────────────────────────────────────────────

export const DEFAULT_SYSTEM_AGENTS: AgentDefinition[] = [
  {
    id: 1,
    kod: 'KAMPANYA_UZMANI',
    ad: 'Kampanya & Fiyat Uzmanı',
    aciklama: 'B2B/B2C kampanyalar, prim hesaplamaları ve fiyat listesi analizleri.',
    icon: 'Tag',
    color: '#3b82f6'
  },
  {
    id: 2,
    kod: 'STOK_UZMANI',
    ad: 'Stok & Depo Uzmanı',
    aciklama: 'Envanter kontrolü, depo transferleri, kritik stok ve sayım asistanı.',
    icon: 'Package',
    color: '#10b981'
  },
  {
    id: 3,
    kod: 'SIPARIS_ASISTANI',
    ad: 'Sipariş & Belge Asistanı',
    aciklama: 'Gelen/giden siparişler, fatura oluşturma ve irsaliye otomasyonu.',
    icon: 'FileText',
    color: '#8b5cf6'
  },
  {
    id: 4,
    kod: 'FINANS_UZMANI',
    ad: 'Finans & Cari Uzmanı',
    aciklama: 'Borç-alacak mutabakatı, kasa hareketleri, çek-senet ve nakit akışı.',
    icon: 'Wallet',
    color: '#f59e0b'
  },
  {
    id: 5,
    kod: 'ADMIN_SISTEM_UZMANI',
    ad: 'Sistem & Yönetim Asistanı',
    aciklama: 'Kullanıcı yetkileri, firma tanımları ve sistem konfigürasyonu.',
    icon: 'Shield',
    color: '#ef4444'
  }
];

// ─── ROTA - UZMAN AJAN EŞLEŞTİRME METOTLARI ─────────────────────────────────

/**
 * Aktif sayfa rotasını analiz ederek uygun AI Uzman Ajan kodunu tespit eder.
 */
export const resolveRouteToAgentCode = (pathname: string): string | null => {
  const cleanPath = (pathname || '').split('?')[0].toLowerCase();

  // 1. Kampanyalar & Fiyat Farkı & Fiyat Listeleri
  if (
    cleanPath.startsWith('/kampanyalar') ||
    cleanPath.startsWith('/bsh-fiyat-farki') ||
    cleanPath.startsWith('/fiyat-listeleri') ||
    cleanPath.startsWith('/fiyat-liste-tanimlari')
  ) {
    return 'KAMPANYA_UZMANI';
  }

  // 2. Stok & Envanter & Depo Yönetimi & Ürünler
  if (
    cleanPath.startsWith('/urun-ve-hizmetler') ||
    cleanPath.startsWith('/depo-hareketleri') ||
    cleanPath.startsWith('/depolar') ||
    cleanPath.startsWith('/sayim-fisleri') ||
    cleanPath.startsWith('/stok-hareketleri') ||
    cleanPath.startsWith('/kargo-firmalari') ||
    cleanPath.startsWith('/barkod-terminali') ||
    cleanPath.startsWith('/ozellik-tanimlari')
  ) {
    return 'STOK_UZMANI';
  }

  // 3. Sipariş, Fatura, İrsaliye Belge Otomasyonu
  if (
    cleanPath.startsWith('/siparisler') ||
    cleanPath.startsWith('/faturalar') ||
    cleanPath.startsWith('/irsaliyeler') ||
    cleanPath.startsWith('/irsaliyeli-faturalar') ||
    cleanPath.startsWith('/pos-komisyon-belgeleri') ||
    cleanPath.startsWith('/tuketici-kredisi-komisyon-belgeleri')
  ) {
    return 'SIPARIS_ASISTANI';
  }

  // 4. Finans, Cari, Kasa, Banka, Çek-Senet
  if (
    cleanPath.startsWith('/cariler') ||
    cleanPath.startsWith('/kasalar') ||
    cleanPath.startsWith('/kasa-hareketleri') ||
    cleanPath.startsWith('/kasa-virman') ||
    cleanPath.startsWith('/kasa-banka-islemleri') ||
    cleanPath.startsWith('/kasa-doviz-islemleri') ||
    cleanPath.startsWith('/bankalar') ||
    cleanPath.startsWith('/banka-hesaplari') ||
    cleanPath.startsWith('/banka-virman') ||
    cleanPath.startsWith('/banka-doviz-islemleri') ||
    cleanPath.startsWith('/banka-gelir-gider-fisleri') ||
    cleanPath.startsWith('/cek-senet-bordrolari') ||
    cleanPath.startsWith('/gelir-gider-kartlari') ||
    cleanPath.startsWith('/kdv-oranlari')
  ) {
    return 'FINANS_UZMANI';
  }

  // 5. Admin / Sistem Yönetimi
  if (
    cleanPath.startsWith('/firmalar') ||
    cleanPath.startsWith('/kullanicilar') ||
    cleanPath.startsWith('/sistem-ayarlari') ||
    cleanPath.startsWith('/denetim-loglari') ||
    cleanPath.startsWith('/modul-yonetimi') ||
    cleanPath.startsWith('/faaliyet-alanlari')
  ) {
    return 'ADMIN_SISTEM_UZMANI';
  }

  return null;
};

/**
 * Rota ve mevcut ajan listesini eşleştirerek ilgili uzman ajanı döndürür.
 */
export const matchAgentForRoute = (route: string, agents: AgentDefinition[]): AgentDefinition | null => {
  if (!route || !Array.isArray(agents) || agents.length === 0) return null;
  const targetCode = resolveRouteToAgentCode(route);
  if (!targetCode) return null;

  return agents.find(a =>
    (a.kod && a.kod.toUpperCase() === targetCode.toUpperCase()) ||
    (targetCode === 'KAMPANYA_UZMANI' && (a.ad?.toLowerCase().includes('kampanya') || a.ad?.toLowerCase().includes('fiyat farkı'))) ||
    (targetCode === 'STOK_UZMANI' && (a.ad?.toLowerCase().includes('stok') || a.ad?.toLowerCase().includes('envanter'))) ||
    (targetCode === 'SIPARIS_ASISTANI' && (a.ad?.toLowerCase().includes('sipariş') || a.ad?.toLowerCase().includes('fatura') || a.ad?.toLowerCase().includes('belge'))) ||
    (targetCode === 'FINANS_UZMANI' && (a.ad?.toLowerCase().includes('finans') || a.ad?.toLowerCase().includes('cari'))) ||
    (targetCode === 'ADMIN_SISTEM_UZMANI' && (a.ad?.toLowerCase().includes('admin') || a.ad?.toLowerCase().includes('sistem')))
  ) || null;
};

// ─── CONTEXT TANIMI ─────────────────────────────────────────────────────────

export const AiChatContext = createContext<AiChatContextType | undefined>(undefined);

export const AiChatProvider: React.FC<AiChatProviderProps> = ({
  children,
  apiEndpoint = '/api/AiChat',
  adapter: propAdapter,
  defaultAgents = DEFAULT_SYSTEM_AGENTS,
  defaultPanelMode,
  defaultOpen
}) => {
  const isInitialMountRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const adapterRef = useRef<IAiChatAdapter>(propAdapter || createRestAiChatAdapter({ baseURL: apiEndpoint }));
  useEffect(() => {
    if (propAdapter) {
      adapterRef.current = propAdapter;
    } else {
      adapterRef.current = createRestAiChatAdapter({ baseURL: apiEndpoint });
    }
  }, [propAdapter, apiEndpoint]);

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (defaultOpen !== undefined) return defaultOpen;
    return typeof window !== 'undefined' ? localStorage.getItem('webakus_ai_panel_open') === 'true' : false;
  });

  const [panelMode, setPanelModeState] = useState<AiPanelMode>(() => {
    if (defaultPanelMode) return defaultPanelMode;
    return (typeof window !== 'undefined' ? localStorage.getItem('webakus_ai_panel_mode') as AiPanelMode : 'docked') || 'docked';
  });

  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('webakus_ai_active_session') : null;
    return saved ? parseInt(saved, 10) : null;
  });

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [agents, setAgents] = useState<AgentDefinition[]>(defaultAgents);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);

  const [pageContext, setPageContextState] = useState<AiPageContext>({
    route: typeof window !== 'undefined' ? window.location.pathname : '/'
  });

  const isSendingSessionRef = useRef<number | null>(null);

  // Yeni temiz oturum oluştur ve aktif yap
  const startNewSession = useCallback(async () => {
    setActiveSessionId(null);
    setMessages([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('webakus_ai_active_session');
    }
    toast.success('Yeni sohbet başlatıldı.');
  }, []);

  // Sayfa bağlamı değiştiğinde oturumu sıfırla (Aktif bir Sihirbaz Form Açma beklemesi yoksa)
  const setPageContext = useCallback((newContext: AiPageContext | ((prev: AiPageContext) => AiPageContext)) => {
    setPageContextState(prev => {
      const next = typeof newContext === 'function' ? newContext(prev) : newContext;
      const isWaitingForWizardForm =
        typeof sessionStorage !== 'undefined' &&
        Boolean(sessionStorage.getItem('webakus_ai_waiting_entity'));

      if (next.route && prev.route && next.route !== prev.route && !isWaitingForWizardForm) {
        setActiveSessionId(null);
        setMessages([]);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('webakus_ai_active_session');
        }
      }
      return next;
    });
  }, []);

  // Sayfa rotasına göre ajanı otomatik öner (Sihirbaz Form Açma beklemesi sırasında mevcut ajanı koru)
  useEffect(() => {
    const isWaitingForWizardForm =
      typeof sessionStorage !== 'undefined' &&
      Boolean(sessionStorage.getItem('webakus_ai_waiting_entity'));
    if (isWaitingForWizardForm) return;

    if (pageContext.route && agents.length > 0) {
      const matched = matchAgentForRoute(pageContext.route, agents);
      if (matched && matched.id) {
        setSelectedAgentId(Number(matched.id));
      }
    }
  }, [pageContext.route, agents]);

  // Oturumları API'den çek
  const refreshSessions = useCallback(async () => {
    try {
      const data = await adapterRef.current.getSessions();
      setSessions(data);
    } catch {
      // Sessiz fallback
    }
  }, []);

  // Ajanları API'den çek ve güncelle
  const refreshAgents = useCallback(async () => {
    if (adapterRef.current.getAgents) {
      try {
        const fetchedAgents = await adapterRef.current.getAgents();
        if (fetchedAgents && fetchedAgents.length > 0) {
          setAgents(fetchedAgents);
        }
      } catch {
        // Sessiz fallback
      }
    }
  }, []);

  // İlk açılışta oturumları ve ajanları getir
  useEffect(() => {
    refreshSessions();
    refreshAgents();
  }, [refreshSessions, refreshAgents]);

  // Panel açıldığında veya ajan yapılandırması güncellendiğinde ajanları tazele
  useEffect(() => {
    if (isOpen) {
      refreshAgents();
    }
  }, [isOpen, refreshAgents]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleAgentsUpdated = () => {
      refreshAgents();
    };
    window.addEventListener('ai-agents-updated', handleAgentsUpdated);
    return () => {
      window.removeEventListener('ai-agents-updated', handleAgentsUpdated);
    };
  }, [refreshAgents]);

  // Aktif oturum değiştiğinde mesajları getir
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    if (isSendingSessionRef.current === activeSessionId) {
      isSendingSessionRef.current = null;
      return;
    }

    let isMounted = true;
    setLoading(true);

    adapterRef.current.getMessages(activeSessionId)
      .then(data => {
        if (isMounted) {
          setMessages(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMessages([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeSessionId]);

  // Paneli aç / kapa
  const togglePanel = useCallback(() => {
    setIsOpen(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('webakus_ai_panel_open', String(next));
      }
      if (next) {
        refreshAgents();
      }
      return next;
    });
  }, [refreshAgents]);

  const openPanel = useCallback(() => {
    setIsOpen(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('webakus_ai_panel_open', 'true');
    }
    refreshAgents();
  }, [refreshAgents]);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('webakus_ai_panel_open', 'false');
    }
  }, []);

  const setPanelMode = useCallback((mode: AiPanelMode) => {
    setPanelModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('webakus_ai_panel_mode', mode);
    }
  }, []);

  // Yeni oturum oluştur
  const createNewSession = useCallback(async (title?: string): Promise<number | null> => {
    try {
      const newSession = await adapterRef.current.createSession(title || 'Yeni Sohbet', selectedAgentId);
      if (newSession && newSession.id) {
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setMessages([]);
        if (typeof window !== 'undefined') {
          localStorage.setItem('webakus_ai_active_session', String(newSession.id));
        }
        return newSession.id;
      }
    } catch {
      // Hata durumu
    }
    return null;
  }, [selectedAgentId]);

  // Oturum sil
  const deleteSession = useCallback(async (id: number) => {
    try {
      await adapterRef.current.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('webakus_ai_active_session');
        }
      }
      toast.success('Sohbet oturumu silindi.');
    } catch {
      toast.error('Oturum silinirken hata oluştu.');
    }
  }, [activeSessionId]);

  // Oturum yeniden adlandır
  const renameSession = useCallback(async (id: number, newTitle: string) => {
    try {
      await adapterRef.current.renameSession(id, newTitle);
      setSessions(prev => prev.map(s => s.id === id ? { ...s, baslik: newTitle.trim() } : s));
      toast.success('Başlık güncellendi.');
    } catch {
      toast.error('Başlık güncellenirken hata oluştu.');
    }
  }, []);

  // Üretimi durdur
  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsSending(false);
      toast('AI yanıtı durduruldu.', { icon: '⏹️' });
    }
  }, []);

  // LLM çağrısı yapmadan yerel kullanıcı mesajı + asistan eylem kartı balonunu sohbete ekle
  const appendLocalExchange = useCallback((userText: string, assistantText: string, eylemVerisiJson?: string) => {
    const nowIso = new Date().toISOString();
    const baseId = Date.now();
    const userMsg: AiMessage = {
      id: baseId,
      aiSohbetOturumuId: activeSessionId || 0,
      role: 'user',
      icerik: userText.trim(),
      tarih: nowIso
    };
    const assistantMsg: AiMessage = {
      id: baseId + 1,
      aiSohbetOturumuId: activeSessionId || 0,
      role: 'assistant',
      icerik: assistantText.trim(),
      eylemVerisiJson,
      tarih: nowIso
    };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
  }, [activeSessionId]);

  // Mesaj gönder
  const sendMessage = useCallback(async (text: string, customAgentId?: number, ekDosyalar?: AiAttachedFilePayload[]) => {
    if (!text.trim() || isSending) return;

    const currentSessionId = activeSessionId;

    const optimisticUserMsg: AiMessage = {
      id: Date.now(),
      aiSohbetOturumuId: currentSessionId || 0,
      role: 'user',
      icerik: text.trim(),
      tarih: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticUserMsg]);
    setIsSending(true);

    abortControllerRef.current = new AbortController();

    try {
      const payload = {
        aiSohbetOturumuId: currentSessionId,
        oturumId: currentSessionId,
        mesaj: text.trim(),
        aiAjanId: customAgentId || selectedAgentId,
        sayfaBaglami: pageContext.route,
        eylemVerisiJson: pageContext.data ? JSON.stringify(pageContext.data) : undefined,
        ekDosyalar: ekDosyalar && ekDosyalar.length > 0 ? ekDosyalar : undefined
      };

      const result = await adapterRef.current.sendMessage(payload, abortControllerRef.current.signal);

      if (result) {
        const returnedSessionId = result.oturumId;
        if (returnedSessionId && (!activeSessionId || activeSessionId !== returnedSessionId)) {
          isSendingSessionRef.current = returnedSessionId;
          setActiveSessionId(returnedSessionId);
          if (typeof window !== 'undefined') {
            localStorage.setItem('webakus_ai_active_session', String(returnedSessionId));
          }
          setSessions(prev => {
            const exists = prev.some(s => s.id === returnedSessionId);
            if (!exists) {
              return [{
                id: returnedSessionId,
                baslik: result.oturumBaslik || text.trim().substring(0, 30),
                sonAktiviteTarihi: new Date().toISOString(),
                sonMesajOzet: (result.asistanCevabi || result.mesaj)?.icerik?.substring(0, 80),
                mesajSayisi: 2
              }, ...prev];
            }
            return prev;
          });
        }

        const asistanMsg = result.asistanCevabi || result.mesaj;
        if (asistanMsg) {
          setMessages(prev => [...prev, asistanMsg]);
        }
      }
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.message === 'canceled' || err.code === 'ERR_CANCELED') {
        // İptal edildi
        return;
      }
      toast.error('AI yanıtı alınırken bir hata oluştu.');
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          aiSohbetOturumuId: currentSessionId || 0,
          role: 'assistant',
          icerik: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen tekrar deneyin.',
          tarih: new Date().toISOString()
        }
      ]);
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  }, [activeSessionId, isSending, selectedAgentId, pageContext]);

  return (
    <AiChatContext.Provider
      value={{
        isOpen,
        panelMode,
        setPanelMode,
        togglePanel,
        openPanel,
        closePanel,
        sessions,
        activeSessionId,
        setActiveSessionId,
        messages,
        loading,
        isSending,
        sendMessage,
        appendLocalExchange,
        stopGenerating,
        createNewSession,
        startNewSession,
        deleteSession,
        renameSession,
        pageContext,
        setPageContext,
        agents,
        selectedAgentId,
        setSelectedAgentId,
        refreshSessions,
        refreshAgents
      }}
    >
      {children}
    </AiChatContext.Provider>
  );
};

export const useAiChat = (): AiChatContextType => {
  const context = useContext(AiChatContext);
  if (!context) {
    throw new Error('useAiChat must be used within an AiChatProvider');
  }
  return context;
};

export default AiChatContext;
