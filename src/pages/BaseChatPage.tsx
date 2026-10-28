// @ts-nocheck
/**
 * ============================================================================
 * AGENT KNOWLEDGE & USAGE GUIDE
 * ============================================================================
 * Akalin UI - BaseChatPage (Yapay Zeka Sohbet & Ajan Temel Sayfa İskeleti)
 * 
 * Başlıca Sorumlulukları ve Yetenekleri:
 * - BasePage ve BaseCardPageHeader altyapısı üzerine inşa edilmiş, kütüphanenin
 *   diğer base sayfalarıyla (BaseCardPage, BaseListPage, BaseDocumentPage vb.)
 *   birebir görsel ve mimari uyum içinde çalışan yapay zeka sohbet arayüzü sunar.
 * - Çoklu sohbet oturumlarını (ChatSession) yönetir: Yeni sohbet başlatma,
 *   oturumu yeniden adlandırma, silme, oturumlar içi arama ve tarihe göre gruplama (Bugün, Dün, vb.).
 * - Yapay zeka ajanları (ChatAgent) ve LLM modelleri (ChatModel) arasında anlık geçiş imkanı.
 * - Zengin mesajlaşma yetenekleri:
 *     * Kullanıcı ve Asistan baloncukları, avatarlar, zaman damgaları
 *     * Düşünce ve teknik çıkarım detayları (AiThinkingDetails entegrasyonu)
 *     * Canlı yanıt süresi ve bekleme sayacı (AiResponseTimer entegrasyonu)
 *     * Yazıyor / Üretiliyor göstergesi (AiTypingIndicator entegrasyonu)
 *     * Kod blokları (Syntax highlighting tarzı koyu tema ve tek tıkla kopyalama)
 *     * Dosya ve belge ekleri (PDF, XLSX, CSV, Resim, JSON)
 *     * ERP belge taslağı önizlemesi ve "Forma Aktar" (akalin:mcp-apply) eylemi
 * - Üst başlıkta ActionMenu entegrasyonu: Yeni Sohbet, Sohbeti Temizle, Dışa Aktar (MD/JSON),
 *   Ajan Ayarları ve özel eylemler.
 * - Otomatik kaydırma (auto-scroll) ve yukarı çıkıldığında "Aşağı Kaydır" düğmesi.
 * - İsteğe bağlı localStorage hafızası (persistKey) ile sayfa yenilenmelerinde sohbeti koruma.
 * ============================================================================
 */

import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
    ReactNode,
    CSSProperties
} from 'react';
import {
    Sparkles,
    Bot,
    Send,
    Square,
    Plus,
    Trash2,
    History,
    MessageSquare,
    Paperclip,
    Copy,
    Check,
    ThumbsUp,
    ThumbsDown,
    RotateCcw,
    Edit2,
    X,
    Search,
    Download,
    ArrowDown,
    Clock,
    Cpu,
    FileText,
    FileUp,
    ExternalLink,
    PanelLeftClose,
    PanelLeft,
    Lightbulb,
    Layers,
    Share2,
    Code2,
    CheckCircle2,
    Pin,
    Sliders,
    FileSpreadsheet,
    FolderOpen,
    Package,
    Users,
    TrendingUp,
    AlertCircle,
    Receipt,
    Tag
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
    BasePage,
    type BasePageProps,
    BaseCardPageHeader,
    type BaseCardPageHeaderProps,
    ActionMenu,
    type ActionMenuItem,
    AlertDialog,
    AiTypingIndicator,
    AiResponseTimer,
    AiThinkingDetails,
    updateDocumentTitle
} from '@akalin/ui';
import '../styles/AiChatPanel.css';
import '../styles/BaseChatPage.css';

// ─── TİP TANIMLAMALARI (TYPES & INTERFACES) ──────────────────────────────────

import type {
    ChatAttachment,
    ChatMessage,
    ChatSession,
    ChatAgent,
    PromptSuggestion,
    AgentHizliIstek,
    CloudFileItem
} from '../types';

export type {
    ChatAttachment,
    ChatMessage,
    ChatSession,
    ChatAgent,
    PromptSuggestion
};

let AkalinUiFilesOnClouds: any = null;
try {
    // @ts-ignore
    const ui = require('@akalin/ui');
    AkalinUiFilesOnClouds = ui.FilesOnClouds;
} catch {
    // Fallback
}

const renderBaseChatHizliIstekIcon = (iconName?: string) => {
    switch (iconName) {
        case 'FileSpreadsheet': return <FileSpreadsheet size={16} className="text-primary" />;
        case 'FileText': return <FileText size={16} className="text-primary" />;
        case 'FolderOpen': return <FolderOpen size={16} className="text-primary" />;
        case 'Package': return <Package size={16} className="text-primary" />;
        case 'Users': return <Users size={16} className="text-primary" />;
        case 'TrendingUp': return <TrendingUp size={16} className="text-primary" />;
        case 'AlertCircle': return <AlertCircle size={16} className="text-primary" />;
        case 'Receipt': return <Receipt size={16} className="text-primary" />;
        case 'Tag': return <Tag size={16} className="text-primary" />;
        case 'Sparkle':
        case 'Sparkles':
            return <Sparkles size={16} className="text-primary" />;
        default:
            return <Lightbulb size={16} className="text-primary" />;
    }
};

export interface BaseChatPageProps extends Omit<BasePageProps, 'onTitleEdit'> {
    // API & Backend Entegrasyonu
    apiEndpoint?: string;
    agentsEndpoint?: string;
    documentType?: string;

    // Oturum (Session) Yönetimi
    sessions?: ChatSession[];
    activeSessionId?: string | number;
    onSessionChange?: (session: ChatSession) => void | Promise<void>;
    onNewSession?: () => void | Promise<void>;
    onDeleteSession?: (sessionId: string | number) => void | Promise<void>;
    onRenameSession?: (sessionId: string | number, newTitle: string) => void | Promise<void>;
    onPinSession?: (sessionId: string | number, pinned: boolean) => void | Promise<void>;
    onTitleEdit?: ((newTitle?: string) => void | Promise<void>) | (() => void | Promise<void>);

    // Mesajlar & Gönderme Eylemleri
    messages?: ChatMessage[];
    onSendMessage?: (content: string, attachments: ChatAttachment[], session?: ChatSession | null) => Promise<ChatMessage | string | void> | ChatMessage | string | void;
    onRegenerateMessage?: (messageId: string | number) => void | Promise<void>;
    onMessageFeedback?: (messageId: string | number, feedback: 'like' | 'dislike' | null) => void | Promise<void>;
    onClearMessages?: (sessionId: string | number) => void | Promise<void>;
    onApplyToForm?: (data: any, bulutDosyaId?: number | null) => void;

    // Kontrollü Üretim Durumu (Streaming & Stop)
    isGenerating?: boolean;
    onStopGeneration?: () => void;

    // Sistem Yönergesi (System Prompt)
    systemPrompt?: string;
    onSystemPromptChange?: (prompt: string) => void;

    // Ajanlar ve Modeller
    agents?: ChatAgent[];
    selectedAgentId?: string | number;
    onAgentChange?: (agent: ChatAgent) => void | Promise<void>;
    defaultModel?: string;

    // Öneriler ve Hızlı Başlatıcılar
    suggestions?: PromptSuggestion[];
    placeholder?: string;
    welcomeTitle?: ReactNode;
    welcomeSubtitle?: ReactNode;

    // Arayüz Özelleştirmeleri
    showHistorySidebar?: boolean;
    defaultHistoryOpen?: boolean;
    enableAttachments?: boolean;
    enableCloudFiles?: boolean;
    enableThinkingDetails?: boolean;
    enableResponseTimer?: boolean;

    // Ekstra Aksiyonlar
    headerActions?: ReactNode;
    extraDropdownActions?: ActionMenuItem[];

    // Yerel Hafıza (Persistence)
    persistKey?: string;
    embedded?: boolean;
    style?: CSSProperties;
}

// ─── YARDIMCI METOTLAR ───────────────────────────────────────────────────────

const generateId = () => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;

const formatTime = (ts?: Date | string | number): string => {
    if (!ts) return '';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const defaultSuggestionsList: PromptSuggestion[] = [
    {
        id: 'sug_1',
        title: '📊 Satış ve Karlılık Analizi',
        description: 'Son 30 günün en çok satan ürünleri ve ciro analizi',
        prompt: 'Son 30 günün en çok satan ürünlerini ve ciroya katkısını analiz et, özet tablo hazırla.',
        category: 'Rapor'
    },
    {
        id: 'sug_2',
        title: '📝 Yeni Sipariş Taslağı',
        description: 'İndirimli beyaz eşya kalemleri için sipariş formu',
        prompt: 'Standart fiyat listesindeki beyaz eşya kalemlerine %10 indirim ekleyerek yeni bir sipariş taslağı oluştur.',
        category: 'Belge'
    },
    {
        id: 'sug_3',
        title: '🔍 Kritik Stok Durumu',
        description: 'Minimum seviyenin altındaki ürünler ve tedarik önerileri',
        prompt: 'Depo bazında minimum stok seviyesinin altına düşen ürünleri tespit et ve acil tedarik önerileri sun.',
        category: 'Stok'
    },
    {
        id: 'sug_4',
        title: '💡 Kampanya ve İndirim Kurgusu',
        description: 'Hafta sonu duyuru metni ve kural taslağı',
        prompt: 'Mevcut stok fazlası ürünler için hafta sonuna özel bir kampanya duyuru metni ve kural taslağı hazırla.',
        category: 'Pazarlama'
    }
];

import { AiMarkdownContent as FormattedMessageContent } from '../components/AiMarkdownContent';
import { AiActionCard } from '../components/AiActionCard';

// ─── ANA BİLEŞEN: BaseChatPage ───────────────────────────────────────────────

const BaseChatPage: React.FC<BaseChatPageProps> = ({
    id = 'base-ai-chat-page',
    title,
    pageTitle,
    subtitle,
    subtitleLeft,
    subtitleRight,
    icon,
    breadcrumb,
    showBackButton = true,
    onBack,
    onClose,
    headerExtra,
    headerProps,
    headerActions,
    extraDropdownActions,
    apiEndpoint = '/api/AiAjanlar/sohbet',
    agentsEndpoint = '/api/AiAjanlar',
    documentType = 'GenelSohbet',
    sessions: externalSessions,
    activeSessionId: externalActiveSessionId,
    onSessionChange,
    onNewSession,
    onDeleteSession,
    onRenameSession,
    onPinSession,
    messages: externalMessages,
    onSendMessage,
    onRegenerateMessage,
    onMessageFeedback,
    onClearMessages,
    onApplyToForm,
    isGenerating: externalIsGenerating,
    onStopGeneration,
    systemPrompt: externalSystemPrompt,
    onSystemPromptChange,
    agents: externalAgents,
    selectedAgentId: externalSelectedAgentId,
    onAgentChange,
    defaultModel,
    suggestions = defaultSuggestionsList,
    placeholder,
    welcomeTitle,
    welcomeSubtitle,
    showHistorySidebar = true,
    defaultHistoryOpen = true,
    enableAttachments = true,
    enableCloudFiles = true,
    enableThinkingDetails = true,
    enableResponseTimer = true,
    persistKey = 'akalin_ai_chat_sessions_v1',
    embedded = false,
    className = '',
    style = {},
    ...restBaseProps
}) => {
    const { t } = useTranslation();

    // ─── Sayfa Başlığı ve Doküman İsmi ────────────────────────────────────────
    const effectiveTitle = title || t('auto_ai_sohbet_asistani', 'Yapay Zeka Sohbet & Asistan');
    const effectiveSubtitle = subtitle || t('auto_ai_sohbet_alt_baslik', 'ERP verilerinizi sorgulayın, akıllı kararlar alın ve otomatik belgeler oluşturun.');

    useEffect(() => {
        updateDocumentTitle(pageTitle || effectiveTitle);
    }, [pageTitle, effectiveTitle]);

    // ─── Oturumlar (Sessions) Durumu ─────────────────────────────────────────
    const [localSessions, setLocalSessions] = useState<ChatSession[]>(() => {
        if (externalSessions && externalSessions.length > 0) return externalSessions;
        if (typeof window !== 'undefined' && persistKey) {
            try {
                const cached = localStorage.getItem(persistKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {
                console.error('Sohbet geçmişi yüklenemedi:', e);
            }
        }
        // Başlangıç ilk boş oturumu
        const initialSession: ChatSession = {
            id: generateId(),
            title: t('auto_yeni_sohbet', 'Yeni Sohbet'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: []
        };
        return [initialSession];
    });

    const sessions = externalSessions || localSessions;

    const [activeSessionId, setActiveSessionId] = useState<string | number>(() => {
        if (externalActiveSessionId !== undefined) return externalActiveSessionId;
        return sessions[0]?.id || '';
    });

    useEffect(() => {
        if (externalActiveSessionId !== undefined) {
            setActiveSessionId(externalActiveSessionId);
        }
    }, [externalActiveSessionId]);

    // Aktif Oturum Nesnesi
    const activeSession = useMemo(() => {
        return sessions.find(s => s.id?.toString() === activeSessionId?.toString()) || sessions[0] || null;
    }, [sessions, activeSessionId]);

    // ─── Ajanlar (Agents) Listesi ve Seçimi ───────────────────────────────────
    const [agentsList, setAgentsList] = useState<ChatAgent[]>(externalAgents || []);
    const [selectedAgentId, setSelectedAgentId] = useState<string | number | null>(() => {
        if (externalSelectedAgentId !== undefined) return externalSelectedAgentId;
        return agentsList[0]?.id || null;
    });

    // Kontrollü mod: Dışarıdan selectedAgentId değiştiğinde içerideki state'i senkronize et
    useEffect(() => {
        if (externalSelectedAgentId !== undefined) {
            setSelectedAgentId(externalSelectedAgentId);
        }
    }, [externalSelectedAgentId]);

    useEffect(() => {
        if (externalAgents && externalAgents.length > 0) {
            setAgentsList(externalAgents);
        } else {
            // Ajanları API'den yükle
            const fetchAgents = async () => {
                try {
                    const res = await axios.get(agentsEndpoint);
                    const list = res.data || [];
                    setAgentsList(list);
                    if (!selectedAgentId && list.length > 0) {
                        setSelectedAgentId(list[0].id);
                    }
                } catch (err) {
                    console.warn('Yapay zeka ajanları API üzerinden yüklenemedi, varsayılan ajan kullanılıyor.');
                }
            };
            fetchAgents();
        }
    }, [externalAgents, agentsEndpoint]);

    const activeAgent = useMemo(() => {
        return agentsList.find(a => a.id?.toString() === selectedAgentId?.toString()) || agentsList[0] || null;
    }, [agentsList, selectedAgentId]);

    // ─── Sistem Yönergesi (System Prompt) ───────────────────────────────────
    const [localSystemPrompt, setLocalSystemPrompt] = useState<string>(externalSystemPrompt || '');
    const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);

    useEffect(() => {
        if (externalSystemPrompt !== undefined) {
            setLocalSystemPrompt(externalSystemPrompt);
        }
    }, [externalSystemPrompt]);

    const effectiveSystemPrompt = externalSystemPrompt !== undefined ? externalSystemPrompt : localSystemPrompt;

    // ─── Oturumları LocalStorage'a Kaydet ────────────────────────────────────
    useEffect(() => {
        if (!externalSessions && persistKey && typeof window !== 'undefined') {
            try {
                localStorage.setItem(persistKey, JSON.stringify(localSessions));
            } catch (err) {
                console.error('Sohbetler kaydedilemedi:', err);
            }
        }
    }, [localSessions, externalSessions, persistKey]);

    // ─── Mesaj Akışı ve Gönderme Durumu ──────────────────────────────────────
    const currentMessages: ChatMessage[] = externalMessages || activeSession?.messages || [];
    const [inputText, setInputText] = useState('');
    const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
    const [pendingHizliIstek, setPendingHizliIstek] = useState<AgentHizliIstek | null>(null);
    const [isCloudPickerOpen, setIsCloudPickerOpen] = useState<boolean>(false);
    const [isTextModalOpen, setIsTextModalOpen] = useState<boolean>(false);
    const [modalInputText, setModalInputText] = useState<string>('');

    const agentQuickRequests = useMemo<AgentHizliIstek[]>(() => {
        if (!activeAgent) return [];
        let rawList: AgentHizliIstek[] = [];
        if (Array.isArray(activeAgent.hizliIstekler) && activeAgent.hizliIstekler.length > 0) {
            rawList = activeAgent.hizliIstekler;
        } else if (activeAgent.hizliIsteklerJson) {
            try {
                const parsed = JSON.parse(activeAgent.hizliIsteklerJson);
                if (Array.isArray(parsed)) rawList = parsed;
            } catch {
                // ignore
            }
        }
        return rawList
            .filter(item => item.aktifMi !== false)
            .sort((a, b) => (a.sira || 0) - (b.sira || 0));
    }, [activeAgent]);

    const effectiveSuggestions = useMemo<PromptSuggestion[]>(() => {
        if (agentQuickRequests.length > 0) {
            return agentQuickRequests.map((item, idx) => ({
                id: item.id || `agent_req_${idx}`,
                title: item.baslik,
                baslik: item.baslik,
                prompt: item.prompt || item.baslik,
                icon: renderBaseChatHizliIstekIcon(item.ikon),
                ikon: item.ikon,
                uiAksiyonu: item.uiAksiyonu,
                uiParametreleriJson: item.uiParametreleriJson,
                sira: item.sira,
                aktifMi: item.aktifMi
            }));
        }
        return suggestions || [];
    }, [agentQuickRequests, suggestions]);

    // Kontrollü veya yerel üretim durumu (Streaming / Generating)
    const [localIsGenerating, setLocalIsGenerating] = useState(false);
    const isGenerating = externalIsGenerating !== undefined ? externalIsGenerating : localIsGenerating;
    const setIsGenerating = useCallback((val: boolean) => {
        setLocalIsGenerating(val);
    }, []);

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [searchSessionQuery, setSearchSessionQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(defaultHistoryOpen);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState<string | number | null>(null);
    const [editingSessionTitle, setEditingSessionTitle] = useState('');

    // Onay Kutusu Durumu
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type?: 'info' | 'warning' | 'error' | 'confirm';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: ''
    });

    // Ref'ler
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const timerIntervalRef = useRef<any>(null);
    const isUserScrolledUpRef = useRef<boolean>(false);
    const prevMessagesLengthRef = useRef<number>(currentMessages.length);

    // ─── Textarea Otomatik Boyutlandırma (Auto-Resize) ────────────────────────
    const adjustTextareaHeight = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            const newHeight = Math.min(Math.max(scrollHeight, 36), 96);
            textareaRef.current.style.height = `${newHeight}px`;
        }
    }, []);

    useEffect(() => {
        adjustTextareaHeight();
    }, [inputText, adjustTextareaHeight]);

    // ─── Zaman Sayacı (AiResponseTimer) ──────────────────────────────────────
    useEffect(() => {
        if (isGenerating) {
            setElapsedSeconds(0);
            timerIntervalRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [isGenerating]);

    // ─── Otomatik Aşağı Kaydırma (Auto-Scroll) ────────────────────────────────
    const scrollToBottom = useCallback((smooth = true) => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
        }
    }, []);

    useEffect(() => {
        const isNewUserMessage = currentMessages.length > prevMessagesLengthRef.current &&
            currentMessages[currentMessages.length - 1]?.role === 'user';

        if (isNewUserMessage) {
            isUserScrolledUpRef.current = false;
            setShowScrollBottom(false);
            scrollToBottom(true);
        } else if (!isUserScrolledUpRef.current) {
            scrollToBottom(true);
        }

        prevMessagesLengthRef.current = currentMessages.length;
    }, [currentMessages, isGenerating, scrollToBottom]);

    useEffect(() => {
        isUserScrolledUpRef.current = false;
        setShowScrollBottom(false);
        prevMessagesLengthRef.current = currentMessages.length;
        scrollToBottom(false);
    }, [activeSessionId, scrollToBottom]);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const distanceToBottom = scrollHeight - scrollTop - clientHeight;
            if (distanceToBottom > 50) {
                isUserScrolledUpRef.current = true;
                setShowScrollBottom(true);
            } else {
                isUserScrolledUpRef.current = false;
                setShowScrollBottom(false);
            }
        }
    };

    // ─── Oturum Ekleme / Değiştirme / Silme ───────────────────────────────────
    const handleCreateNewSession = () => {
        if (onNewSession) {
            onNewSession();
            return;
        }

        const newSess: ChatSession = {
            id: generateId(),
            title: t('auto_yeni_sohbet', 'Yeni Sohbet'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [],
            agentId: selectedAgentId || undefined
        };

        setLocalSessions(prev => [newSess, ...prev]);
        setActiveSessionId(newSess.id);
        if (onSessionChange) onSessionChange(newSess);
        toast.success(t('auto_yeni_sohbet_baslatildi', 'Yeni sohbet başlatıldı.'));

        setTimeout(() => {
            textareaRef.current?.focus();
        }, 100);
    };

    const handleSelectSession = (session: ChatSession) => {
        setActiveSessionId(session.id);
        if (onSessionChange) onSessionChange(session);
    };

    const handleDeleteSessionConfirm = (sessionId: string | number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        setAlertConfig({
            isOpen: true,
            type: 'confirm',
            title: t('auto_sohbeti_sil_baslik', 'Sohbeti Sil'),
            message: t('auto_sohbeti_sil_uyari', 'Bu sohbet oturumu ve tüm mesaj geçmişi kalıcı olarak silinecektir. Devam etmek istiyor musunuz?'),
            onConfirm: () => {
                if (onDeleteSession) {
                    onDeleteSession(sessionId);
                } else {
                    setLocalSessions(prev => {
                        const filtered = prev.filter(s => s.id?.toString() !== sessionId.toString());
                        if (filtered.length === 0) {
                            const fresh: ChatSession = {
                                id: generateId(),
                                title: t('auto_yeni_sohbet', 'Yeni Sohbet'),
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                messages: []
                            };
                            setActiveSessionId(fresh.id);
                            return [fresh];
                        }
                        if (sessionId?.toString() === activeSessionId?.toString()) {
                            setActiveSessionId(filtered[0].id);
                        }
                        return filtered;
                    });
                }
                toast.success(t('auto_sohbet_silindi', 'Sohbet oturumu silindi.'));
                setAlertConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleStartRename = (session: ChatSession, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingSessionId(session.id);
        setEditingSessionTitle(session.title);
    };

    const handleSaveRename = (sessionId: string | number) => {
        if (!editingSessionTitle.trim()) {
            setEditingSessionId(null);
            return;
        }

        if (onRenameSession) {
            onRenameSession(sessionId, editingSessionTitle.trim());
        } else {
            setLocalSessions(prev => prev.map(s =>
                s.id?.toString() === sessionId.toString()
                    ? { ...s, title: editingSessionTitle.trim(), updatedAt: new Date().toISOString() }
                    : s
            ));
        }
        setEditingSessionId(null);
        toast.success(t('auto_sohbet_adi_guncellendi', 'Sohbet başlığı güncellendi.'));
    };

    const handleTogglePinSession = (sessionId: string | number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const targetSession = sessions.find(s => s.id?.toString() === sessionId.toString());
        const nextPinned = !targetSession?.pinned;

        if (onPinSession) {
            onPinSession(sessionId, nextPinned);
        }

        if (!externalSessions) {
            setLocalSessions(prev => prev.map(s =>
                s.id?.toString() === sessionId.toString()
                    ? { ...s, pinned: nextPinned, updatedAt: new Date().toISOString() }
                    : s
            ));
        }

        toast.success(nextPinned
            ? t('auto_sohbet_sabitlendi', 'Sohbet başa sabitlendi.')
            : t('auto_sabitleme_kaldirildi', 'Sabitleme kaldırıldı.')
        );
    };

    const handleClearCurrentMessages = () => {
        setAlertConfig({
            isOpen: true,
            type: 'confirm',
            title: t('auto_sohbeti_temizle_baslik', 'Sohbeti Temizle'),
            message: t('auto_sohbeti_temizle_uyari', 'Mevcut oturumdaki tüm mesajlar silinecektir. Emin misiniz?'),
            onConfirm: () => {
                if (onClearMessages && activeSessionId) {
                    onClearMessages(activeSessionId);
                }
                if (!externalMessages) {
                    setLocalSessions(prev => prev.map(s =>
                        s.id?.toString() === activeSessionId?.toString()
                            ? { ...s, messages: [], updatedAt: new Date().toISOString() }
                            : s
                    ));
                }
                toast.success(t('auto_mesajlar_temizlendi', 'Mesajlar temizlendi.'));
                setAlertConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // ─── Mesaj Gönderme & Yapay Zeka Çağrısı ─────────────────────────────────
    const handleSendMessage = async (customPrompt?: string) => {
        const textToSend = customPrompt || inputText;
        if (!textToSend.trim() && pendingAttachments.length === 0) return;
        if (isGenerating) return;

        isUserScrolledUpRef.current = false;
        setShowScrollBottom(false);

        const userMsgId = generateId();
        const assistantMsgId = generateId();

        const userMessage: ChatMessage = {
            id: userMsgId,
            role: 'user',
            content: textToSend.trim(),
            timestamp: new Date().toISOString(),
            attachments: [...pendingAttachments]
        };

        // Oturumu güncelle ve ilk kullanıcı mesajı ise başlığı otomatik adlandır
        const isFirstMessage = currentMessages.length === 0;
        const autoTitle = isFirstMessage
            ? (textToSend.trim().length > 32 ? textToSend.trim().substring(0, 32) + '...' : textToSend.trim())
            : activeSession?.title;

        // UI'ya hemen kullanıcı mesajını ekle
        if (!externalMessages) {
            setLocalSessions(prev => prev.map(s => {
                if (s.id?.toString() === activeSessionId?.toString()) {
                    return {
                        ...s,
                        title: isFirstMessage ? autoTitle : s.title,
                        updatedAt: new Date().toISOString(),
                        messages: [...s.messages, userMessage]
                    };
                }
                return s;
            }));
        }

        setInputText('');
        setPendingAttachments([]);
        setIsGenerating(true);

        // Harici onSendMessage verilmişse ona devret
        if (onSendMessage) {
            try {
                const result = await onSendMessage(userMessage.content, userMessage.attachments || [], activeSession);

                // onSendMessage bir ChatMessage veya metin döndürmüşse ve externalMessages yoksa asistan yanıtını ekle
                if (!externalMessages && result) {
                    const assistantMessage: ChatMessage = typeof result === 'string' ? {
                        id: assistantMsgId,
                        role: 'assistant',
                        content: result,
                        timestamp: new Date().toISOString(),
                        agentName: activeAgent?.ad || t('auto_erp_asistani', 'ERP Asistanı'),
                        model: activeAgent?.modelAdi || defaultModel
                    } : {
                        id: result.id || assistantMsgId,
                        role: result.role || 'assistant',
                        content: result.content || '',
                        timestamp: result.timestamp || new Date().toISOString(),
                        agentName: result.agentName || activeAgent?.ad || t('auto_erp_asistani', 'ERP Asistanı'),
                        model: result.model || activeAgent?.modelAdi || defaultModel,
                        ...result
                    };

                    setLocalSessions(prev => prev.map(s => {
                        if (s.id?.toString() === activeSessionId?.toString()) {
                            return {
                                ...s,
                                updatedAt: new Date().toISOString(),
                                messages: [...s.messages, assistantMessage]
                            };
                        }
                        return s;
                    }));
                }
            } catch (err: any) {
                toast.error(err?.message || t('auto_mesaj_gonderilemedi', 'Mesaj gönderilemedi.'));
            } finally {
                setIsGenerating(false);
            }
            return;
        }

        // Yerleşik Axios Yapay Zeka Çağrısı
        abortControllerRef.current = new AbortController();
        const requestStartTime = Date.now();

        try {
            const payload = {
                sohbetId: activeSessionId,
                ajanId: selectedAgentId,
                mesaj: userMessage.content,
                belgeTuru: documentType,
                ekler: userMessage.attachments,
                model: defaultModel || activeAgent?.modelAdi || 'default',
                sistemPromptu: effectiveSystemPrompt || activeAgent?.sistemPromptu || undefined,
                gecmis: currentMessages.map(m => ({ role: m.role, content: m.content }))
            };

            const response = await axios.post(apiEndpoint, payload, {
                signal: abortControllerRef.current.signal
            });

            const reqDuration = Date.now() - requestStartTime;
            const resData = response.data;
            const assistantText = resData?.yanit || resData?.mesaj || resData?.cevap || resData?.content || '';
            const thinking = resData?.dusunme || resData?.thinking || resData?.teknikAnaliz || '';
            const eylemPayload = resData?.eylemPayload || resData?.belgeVerisi || null;

            const assistantMessage: ChatMessage = {
                id: assistantMsgId,
                role: 'assistant',
                content: assistantText,
                timestamp: new Date().toISOString(),
                model: resData?.model || activeAgent?.modelAdi || defaultModel || 'LLM',
                provider: resData?.provider || activeAgent?.saglayiciTuruAdi || 'AI Provider',
                agentName: activeAgent?.ad || t('auto_erp_asistani', 'ERP Asistanı'),
                thinkingContent: thinking,
                eylemPayload: eylemPayload,
                promptTokens: resData?.promptTokens || resData?.kullanim?.promptTokens || resData?.usage?.prompt_tokens,
                completionTokens: resData?.completionTokens || resData?.kullanim?.completionTokens || resData?.usage?.completion_tokens,
                totalTokens: resData?.totalTokens || resData?.kullanim?.toplamToken || resData?.usage?.total_tokens,
                latencyMs: resData?.latencyMs || resData?.sureMs || reqDuration,
                ttftMs: resData?.ttftMs
            };

            setLocalSessions(prev => prev.map(s => {
                if (s.id?.toString() === activeSessionId?.toString()) {
                    return {
                        ...s,
                        updatedAt: new Date().toISOString(),
                        messages: [...s.messages, assistantMessage]
                    };
                }
                return s;
            }));

        } catch (err: any) {
            if (axios.isCancel(err) || err.name === 'CanceledError') {
                toast(t('auto_yanit_durduruldu', 'Yanıt üretimi durduruldu.'));
            } else {
                const errMsg = err.response?.data?.mesaj || err.response?.data?.message || err.message || t('auto_ai_baglanti_hatasi', 'Yapay zeka servisiyle bağlantı kurulamadı.');
                toast.error(errMsg);

                const errorAssistantMsg: ChatMessage = {
                    id: assistantMsgId,
                    role: 'error',
                    content: `⚠️ ${errMsg}`,
                    timestamp: new Date().toISOString(),
                    isError: true
                };

                setLocalSessions(prev => prev.map(s => {
                    if (s.id?.toString() === activeSessionId?.toString()) {
                        return {
                            ...s,
                            updatedAt: new Date().toISOString(),
                            messages: [...s.messages, errorAssistantMsg]
                        };
                    }
                    return s;
                }));
            }
        } finally {
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    };

    // ─── Yanıtı Yeniden Üretme (Regenerate Message) ─────────────────────────
    const handleRegenerateMessage = (messageId: string | number) => {
        if (onRegenerateMessage) {
            onRegenerateMessage(messageId);
            return;
        }

        // Yerel fallback: Bu asistan mesajından önceki kullanıcı mesajını bul ve yeniden gönder
        const msgIdx = currentMessages.findIndex(m => m.id?.toString() === messageId?.toString());
        if (msgIdx !== -1) {
            for (let i = msgIdx - 1; i >= 0; i--) {
                if (currentMessages[i].role === 'user') {
                    handleSendMessage(currentMessages[i].content);
                    break;
                }
            }
        }
    };

    // ─── Mesaj Geri Bildirimi (Feedback: Like / Dislike) ────────────────────
    const handleFeedback = (messageId: string | number, feedbackType: 'like' | 'dislike') => {
        const targetMsg = currentMessages.find(m => m.id?.toString() === messageId?.toString());
        const nextFeedback: 'like' | 'dislike' | null = targetMsg?.feedback === feedbackType ? null : feedbackType;

        if (onMessageFeedback) {
            onMessageFeedback(messageId, nextFeedback);
        }

        if (!externalMessages) {
            setLocalSessions(prev => prev.map(s => {
                if (s.id?.toString() === activeSessionId?.toString()) {
                    return {
                        ...s,
                        messages: s.messages.map(m => m.id?.toString() === messageId?.toString() ? { ...m, feedback: nextFeedback } : m)
                    };
                }
                return s;
            }));
        }

        if (nextFeedback === 'like') {
            toast.success(t('auto_tesekkurler', 'Geri bildiriminiz için teşekkürler!'));
        } else if (nextFeedback === 'dislike') {
            toast(t('auto_geri_bildirim_alindi', 'Geri bildirim kaydedildi.'));
        }
    };

    // ─── Yanıtı Durdurma (Stop Generation) ────────────────────────────────────
    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsGenerating(false);
        onStopGeneration?.();
    };

    // ─── Dosya Ekleme İşlemleri ──────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const newAttachments: ChatAttachment[] = files.map(f => ({
                id: generateId(),
                name: f.name,
                size: f.size,
                type: f.type,
                file: f
            }));
            setPendingAttachments(prev => [...prev, ...newAttachments]);
            toast.success(t('auto_dosya_eklendi', '{{count}} dosya sohbete eklendi.', { count: files.length }));
            e.target.value = '';
        }
    };

    const handleRemoveAttachment = (attId?: string | number) => {
        setPendingAttachments(prev => prev.filter(a => a.id !== attId));
    };

    // ─── Taslak Veriyi Forma / MCP'ye Uygula (Apply Draft to Form) ────────────
    const handleApplyDraft = (eylemPayload: any) => {
        if (!eylemPayload) return;

        if (onApplyToForm) {
            onApplyToForm(eylemPayload);
        } else {
            // Global CustomEvent ile tüm sayfaya/forma yay
            const customEvent = new CustomEvent('akalin:mcp-apply', {
                detail: {
                    documentType,
                    data: eylemPayload
                }
            });
            window.dispatchEvent(customEvent);
            toast.success(t('auto_mcp_taslak_uygulandi', 'Yapay zeka taslağı aktif belge formuna aktarıldı.'));
        }
    };

    // ─── Dışa Aktarma Eylemleri (Export Markdown / JSON) ─────────────────────
    const handleExportMarkdown = () => {
        if (currentMessages.length === 0) {
            toast.error(t('auto_aktarilacak_mesaj_yok', 'Dışa aktarılacak mesaj bulunmuyor.'));
            return;
        }

        let md = `# ${activeSession?.title || 'Sohbet'}\n\n`;
        md += `*Oluşturulma: ${new Date(activeSession?.createdAt || Date.now()).toLocaleString()}*\n\n---\n\n`;

        currentMessages.forEach(m => {
            const sender = m.role === 'user' ? '👤 **Kullanıcı**' : `🤖 **${m.agentName || 'Yapay Zeka'}**`;
            md += `### ${sender} (${formatTime(m.timestamp)})\n\n${m.content}\n\n`;
            if (m.thinkingContent) {
                md += `> **Düşünce Detayı:**\n> ${m.thinkingContent.replace(/\n/g, '\n> ')}\n\n`;
            }
        });

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(activeSession?.title || 'sohbet').replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(t('auto_sohbet_md_indirildi', 'Sohbet Markdown olarak indirildi.'));
    };

    const handleExportJson = () => {
        if (!activeSession) return;
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeSession, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `${(activeSession.title || 'sohbet').replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success(t('auto_sohbet_json_indirildi', 'Sohbet JSON formatında dışa aktarıldı.'));
    };

    // ─── Klavye Kısayolları (Keyboard Shortcuts) ──────────────────────────────
    const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // ─── Oturum Filtreleme ve Tarihe Göre Gruplama ───────────────────────────
    const filteredSessions = useMemo(() => {
        if (!searchSessionQuery.trim()) return sessions;
        const q = searchSessionQuery.toLowerCase();
        return sessions.filter(s =>
            s.title?.toLowerCase().includes(q) ||
            s.messages.some(m => m.content?.toLowerCase().includes(q))
        );
    }, [sessions, searchSessionQuery]);

    const sessionGroups = useMemo(() => {
        const pinnedItems: ChatSession[] = [];
        const today: ChatSession[] = [];
        const yesterday: ChatSession[] = [];
        const pastWeek: ChatSession[] = [];
        const older: ChatSession[] = [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
        const startOfPastWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

        filteredSessions.forEach(s => {
            if (s.pinned) {
                pinnedItems.push(s);
                return;
            }
            const time = new Date(s.updatedAt || s.createdAt || 0).getTime();
            if (time >= startOfToday) {
                today.push(s);
            } else if (time >= startOfYesterday) {
                yesterday.push(s);
            } else if (time >= startOfPastWeek) {
                pastWeek.push(s);
            } else {
                older.push(s);
            }
        });

        const groups: { title: string; items: ChatSession[]; isPinned?: boolean }[] = [];
        if (pinnedItems.length > 0) {
            groups.push({ title: t('auto_sabitlenenler', 'Sabitlenenler'), items: pinnedItems, isPinned: true });
        }
        if (today.length > 0) groups.push({ title: t('auto_bugun', 'Bugün'), items: today });
        if (yesterday.length > 0) groups.push({ title: t('auto_dun', 'Dün'), items: yesterday });
        if (pastWeek.length > 0) groups.push({ title: t('auto_onceki_7_gun', 'Önceki 7 Gün'), items: pastWeek });
        if (older.length > 0) groups.push({ title: t('auto_daha_eski', 'Daha Eski'), items: older });

        return groups;
    }, [filteredSessions, t]);

    // ─── ActionMenu Eylemleri ─────────────────────────────────────────────────
    const standardActionMenuItems: ActionMenuItem[] = useMemo(() => {
        const items: ActionMenuItem[] = [
            {
                key: 'new-chat',
                label: t('auto_yeni_sohbet_baslat', 'Yeni Sohbet Başlat'),
                icon: <Plus size={15} />,
                onClick: handleCreateNewSession
            },
            {
                key: 'toggle-sidebar',
                label: isSidebarOpen ? t('auto_gecmisi_gizle', 'Sohbet Geçmişini Gizle') : t('auto_gecmisi_goster', 'Sohbet Geçmişini Göster'),
                icon: isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />,
                onClick: () => setIsSidebarOpen(prev => !prev)
            },
            {
                key: 'system-prompt',
                label: t('auto_sistem_yonergesi', 'Sistem Yönergesi (System Prompt)'),
                icon: <Sliders size={15} />,
                onClick: () => setIsSystemPromptOpen(prev => !prev)
            },
            {
                key: 'clear-chat',
                label: t('auto_sohbeti_temizle', 'Sohbeti Temizle'),
                icon: <Trash2 size={15} className="text-danger" />,
                onClick: handleClearCurrentMessages,
                disabled: currentMessages.length === 0
            },
            {
                key: 'export-md',
                label: t('auto_disa_aktar_md', 'Markdown Olarak İndir (.md)'),
                icon: <Download size={15} />,
                onClick: handleExportMarkdown,
                disabled: currentMessages.length === 0
            },
            {
                key: 'export-json',
                label: t('auto_disa_aktar_json', 'JSON Olarak İndir (.json)'),
                icon: <Code2 size={15} />,
                onClick: handleExportJson,
                disabled: currentMessages.length === 0
            }
        ];

        if (extraDropdownActions && extraDropdownActions.length > 0) {
            items.push(...extraDropdownActions);
        }

        return items;
    }, [
        t,
        isSidebarOpen,
        currentMessages.length,
        handleCreateNewSession,
        handleClearCurrentMessages,
        handleExportMarkdown,
        handleExportJson,
        extraDropdownActions
    ]);

    const visibleActionMenuItems = useMemo(() => {
        return standardActionMenuItems.filter(a => a && !a.hidden);
    }, [standardActionMenuItems]);

    const chatActionMenu = visibleActionMenuItems.length > 0 ? (
        <ActionMenu
            actions={standardActionMenuItems}
            triggerVariant="primary"
            showDefaultActionAsButton={false}
        />
    ) : null;

    // ─── Header Aksiyonları ve HeaderProps Birleştirme ──────────────────────
    const hasHeaderContent = Boolean(headerExtra || headerActions || agentsList.length > 1 || chatActionMenu);

    const finalHeaderExtra = hasHeaderContent ? (
        <div className="flex items-center gap-8">
            {headerExtra}
            {headerActions}

            {/* Hızlı Ajan Seçici Dropdown */}
            {agentsList.length > 1 && (
                <select
                    className="base-chat-agent-select"
                    value={selectedAgentId || ''}
                    onChange={(e) => {
                        const nextId = e.target.value;
                        setSelectedAgentId(nextId);
                        const found = agentsList.find(a => a.id?.toString() === nextId);
                        if (found && onAgentChange) onAgentChange(found);
                    }}
                    title={t('auto_ajan_sec', 'Görevli Ajan Seç')}
                >
                    {agentsList.map(a => (
                        <option key={a.id} value={a.id}>
                            🤖 {a.ad || a.modelAdi || 'Ajan'}
                        </option>
                    ))}
                </select>
            )}

            {chatActionMenu}
        </div>
    ) : null;

    const mergedHeaderProps: Partial<BaseCardPageHeaderProps> = useMemo(() => {
        if (!headerProps) {
            return {
                headerExtra: finalHeaderExtra,
                actions: finalHeaderExtra
            };
        }
        return {
            ...headerProps,
            headerExtra: headerProps.headerExtra ? (
                finalHeaderExtra ? (
                    <div className="flex items-center gap-8">
                        {headerProps.headerExtra}
                        {finalHeaderExtra}
                    </div>
                ) : headerProps.headerExtra
            ) : finalHeaderExtra,
            actions: headerProps.actions ? (
                finalHeaderExtra ? (
                    <div className="flex items-center gap-8">
                        {headerProps.actions}
                        {finalHeaderExtra}
                    </div>
                ) : headerProps.actions
            ) : finalHeaderExtra
        };
    }, [headerProps, finalHeaderExtra]);

    // ─── RENDER ──────────────────────────────────────────────────────────────
    return (
        <BasePage
            id={id}
            pageTitle={pageTitle || (typeof effectiveTitle === 'string' ? effectiveTitle : undefined)}
            title={effectiveTitle}
            subtitle={effectiveSubtitle}
            icon={icon || <Sparkles size={24} className="text-primary" />}
            breadcrumb={breadcrumb}
            showBackButton={showBackButton}
            onBack={onBack}
            onClose={onClose}
            asForm={false}
            disableContentWrapper={false}
            hideSaveButton={true}
            subtitleLeft={
                subtitleLeft !== undefined ? subtitleLeft : (
                    activeAgent ? (
                        <span className="flex items-center gap-4 text-12 text-secondary font-500">
                            <Bot size={14} className="text-primary" />
                            <span>{activeAgent.ad}</span>
                        </span>
                    ) : null
                )
            }
            subtitleRight={
                subtitleRight !== undefined
                    ? subtitleRight
                    : currentMessages.length > 0
                        ? `${currentMessages.length} ${t('auto_mesaj', 'Mesaj')}`
                        : null
            }
            headerExtra={finalHeaderExtra}
            headerProps={mergedHeaderProps}
            className={`base-chat-page ${className}`}
            {...restBaseProps}
        >
            <div className="base-chat-layout">
                {/* ─── 1. SOHBET GEÇMİŞİ KENAR ÇUBUĞU (SIDEBAR) ─────────────── */}
                {showHistorySidebar && (
                    <aside className={`base-chat-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                        <div className="base-chat-sidebar-header">
                            <div className="base-chat-sidebar-top-row">
                                <button
                                    type="button"
                                    onClick={handleCreateNewSession}
                                    className="base-chat-new-btn"
                                    title={t('auto_yeni_sohbet_aciklama', 'Yeni bir sohbet oturumu aç')}
                                >
                                    <Plus size={16} />
                                    <span>{t('auto_yeni_sohbet', 'Yeni Sohbet')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="base-chat-sidebar-close-btn"
                                    title={t('auto_gecmisi_gizle', 'Geçmişi Gizle')}
                                >
                                    <PanelLeftClose size={16} />
                                </button>
                            </div>

                            <div className="base-chat-search-box">
                                <Search size={14} className="text-secondary shrink-0" />
                                <input
                                    type="text"
                                    placeholder={t('auto_sohbetlerde_ara', 'Sohbetlerde ara...')}
                                    value={searchSessionQuery}
                                    onChange={(e) => setSearchSessionQuery(e.target.value)}
                                />
                                {searchSessionQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchSessionQuery('')}
                                        className="base-chat-search-clear-btn"
                                    >
                                        <X size={12} className="text-secondary" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Oturumlar Listesi */}
                        <div className="base-chat-sessions-list">
                            {sessionGroups.length === 0 ? (
                                <div className="text-center p-16 text-12 text-secondary">
                                    {t('auto_sohbet_bulunamadi', 'Kayıtlı sohbet bulunamadı.')}
                                </div>
                            ) : (
                                sessionGroups.map(group => (
                                    <div key={group.title} className="flex flex-col gap-4">
                                        <div className="base-chat-session-group-title">
                                            {group.title}
                                        </div>
                                        {group.items.map(s => {
                                            const isActive = s.id?.toString() === activeSessionId?.toString();
                                            const isEditing = editingSessionId?.toString() === s.id?.toString();

                                            return (
                                                <div
                                                    key={s.id}
                                                    onClick={() => !isEditing && handleSelectSession(s)}
                                                    className={`base-chat-session-item ${isActive ? 'active' : ''}`}
                                                >
                                                    <div className="base-chat-session-content">
                                                        <MessageSquare size={15} className="shrink-0" />
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={editingSessionTitle}
                                                                onChange={(e) => setEditingSessionTitle(e.target.value)}
                                                                onBlur={() => handleSaveRename(s.id)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleSaveRename(s.id);
                                                                    if (e.key === 'Escape') setEditingSessionId(null);
                                                                }}
                                                                autoFocus
                                                                className="form-input text-12 py-2 px-6 rounded-6 w-full"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        ) : (
                                                            <span className="base-chat-session-title">
                                                                {s.title}
                                                            </span>
                                                        )}
                                                        {s.pinned && !isEditing && (
                                                            <Pin size={11} className="base-chat-pin-indicator text-primary shrink-0" />
                                                        )}
                                                    </div>

                                                    {!isEditing && (
                                                        <div className="base-chat-session-actions">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleTogglePinSession(s.id, e)}
                                                                className={`base-chat-session-btn ${s.pinned ? 'active' : ''}`}
                                                                title={s.pinned ? t('auto_sabitlemeyi_kaldir', 'Sabitlemeyi Kaldır') : t('auto_sabitle', 'Sabitle')}
                                                            >
                                                                <Pin size={12} className={s.pinned ? 'text-primary' : ''} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleStartRename(s, e)}
                                                                className="base-chat-session-btn"
                                                                title={t('auto_yeniden_adlandir', 'Yeniden Adlandır')}
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteSessionConfirm(s.id, e)}
                                                                className="base-chat-session-btn delete"
                                                                title={t('auto_sil', 'Sil')}
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>
                )}

                {/* ─── 2. ANA SOHBET ALANI (MAIN CHAT AREA) ─────────────────── */}
                <main className="base-chat-main">
                    {/* Üst İkincil Araç Çubuğu (Toolbar) */}
                    <div className="base-chat-toolbar">
                        <div className="base-chat-toolbar-left">
                            {showHistorySidebar && (
                                <button
                                    type="button"
                                    onClick={() => setIsSidebarOpen(prev => !prev)}
                                    className="base-chat-toolbar-toggle-btn"
                                    title={isSidebarOpen ? t('auto_gecmisi_gizle', 'Sohbet Geçmişini Gizle') : t('auto_gecmisi_goster', 'Sohbet Geçmişini Göster')}
                                >
                                    {isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
                                </button>
                            )}

                            <div className="base-chat-toolbar-session-info">
                                <span className="base-chat-toolbar-session-title" title={activeSession?.title || t('auto_yeni_sohbet', 'Yeni Sohbet')}>
                                    {activeSession?.title || t('auto_yeni_sohbet', 'Yeni Sohbet')}
                                </span>
                                {effectiveSystemPrompt.trim() && (
                                    <span className="base-chat-toolbar-chip" title={t('auto_ozel_sistem_promptu_aktif', 'Özel sistem yönergesi aktif')}>
                                        <Sliders size={11} />
                                        <span>{t('auto_sistem_promptu_kisa', 'Prompt Aktif')}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="base-chat-toolbar-right">
                            {/* Sistem Yönergesi (System Prompt) Butonu */}
                            <button
                                type="button"
                                onClick={() => setIsSystemPromptOpen(prev => !prev)}
                                className={`base-chat-toolbar-btn ${isSystemPromptOpen ? 'active' : ''} ${effectiveSystemPrompt.trim() ? 'has-custom' : ''}`}
                                title={t('auto_sistem_yonergesi', 'Sistem Yönergesi (System Prompt)')}
                            >
                                <Sliders size={13} />
                                <span className="hidden sm:inline">{t('auto_sistem_promptu', 'Sistem Promptu')}</span>
                                {effectiveSystemPrompt.trim() && (
                                    <span className="base-chat-badge-dot" />
                                )}
                            </button>

                            {/* Dışa Aktar Butonu */}
                            {currentMessages.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleExportMarkdown}
                                    className="base-chat-toolbar-btn"
                                    title={t('auto_disa_aktar_md', 'Markdown Olarak İndir')}
                                >
                                    <Download size={13} />
                                    <span className="hidden sm:inline">{t('auto_disa_aktar', 'Dışa Aktar')}</span>
                                </button>
                            )}

                            {/* Geçmişi Temizle Butonu */}
                            {currentMessages.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearCurrentMessages}
                                    className="base-chat-toolbar-btn text-danger"
                                    title={t('auto_sohbeti_temizle', 'Sohbeti Temizle')}
                                >
                                    <Trash2 size={13} />
                                    <span className="hidden sm:inline">{t('auto_temizle', 'Temizle')}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Oturum Sistem Yönergesi (System Prompt) Açılır Çekmecesi */}
                    {isSystemPromptOpen && (
                        <div className="base-chat-system-prompt-drawer">
                            <div className="base-chat-system-prompt-header">
                                <div className="flex items-center gap-6">
                                    <Sliders size={14} className="text-primary" />
                                    <span className="font-600 text-12 text-primary">
                                        {t('auto_sistem_yonergesi_baslik', 'Oturum Sistem Yönergesi (System Prompt)')}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsSystemPromptOpen(false)}
                                    className="base-chat-system-prompt-close"
                                    title={t('auto_kapat', 'Kapat')}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <p className="base-chat-system-prompt-desc">
                                {t('auto_sistem_yonergesi_aciklama', 'Yapay zekanın bu sohbetteki rolünü, yanıt tonunu, kurumsal kurallarını veya ERP kısıtlamalarını özelleştirin.')}
                            </p>
                            <textarea
                                className="base-chat-system-prompt-textarea"
                                rows={3}
                                value={effectiveSystemPrompt}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLocalSystemPrompt(val);
                                    if (onSystemPromptChange) onSystemPromptChange(val);
                                }}
                                placeholder={activeAgent?.sistemPromptu || t('auto_sistem_yonergesi_placeholder', 'Örn: Sen kıdemli bir ERP uzmanısın. Yanıtlarını maddeleyerek ve tablo halinde sun...')}
                            />
                            <div className="base-chat-system-prompt-footer">
                                <span className="base-chat-system-prompt-counter">
                                    {effectiveSystemPrompt.length} {t('auto_karakter', 'karakter')}
                                </span>
                                <div className="flex items-center gap-6">
                                    {effectiveSystemPrompt && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLocalSystemPrompt('');
                                                if (onSystemPromptChange) onSystemPromptChange('');
                                                toast.success(t('auto_sistem_yonergesi_temizlendi', 'Sistem yönergesi sıfırlandı.'));
                                            }}
                                            className="btn btn-secondary text-11 py-2 px-8"
                                        >
                                            {t('auto_sifirla', 'Sıfırla')}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSystemPromptOpen(false);
                                            toast.success(t('auto_sistem_yonergesi_uygulandi', 'Sistem yönergesi uygulandı.'));
                                        }}
                                        className="btn btn-primary text-11 py-2 px-10"
                                    >
                                        {t('auto_tamam', 'Tamam')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mesaj Akışı Konteyneri */}
                    <div
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="base-chat-messages-container"
                    >
                        {currentMessages.length === 0 ? (
                            /* Boş Durum & Karşılama Ekranı */
                            <div className="base-chat-welcome">
                                <div className="base-chat-welcome-icon-box">
                                    <Sparkles size={32} />
                                </div>
                                <h3 className="base-chat-welcome-title">
                                    {welcomeTitle || t('auto_size_nasil_yardimci_olabilirim', 'Size bugün nasıl yardımcı olabilirim?')}
                                </h3>
                                <p className="base-chat-welcome-subtitle">
                                    {welcomeSubtitle || activeAgent?.aciklama || t('auto_welcome_desc', 'Yapay zeka asistanınız ERP kayıtlarınızı inceleyebilir, analizler yapabilir veya yeni form taslakları hazırlayabilir.')}
                                </p>

                                {/* Hızlı Başlatıcı Öneri Kartları */}
                                {effectiveSuggestions && effectiveSuggestions.length > 0 && (
                                    <div className="base-chat-suggestions-grid">
                                        {effectiveSuggestions.map((sug, i) => (
                                            <div
                                                key={sug.id || i}
                                                className="base-chat-suggestion-card"
                                                onClick={async () => {
                                                    if (isGenerating) return;
                                                    const item: AgentHizliIstek = {
                                                        id: sug.id ? String(sug.id) : undefined,
                                                        baslik: sug.baslik || sug.title || '',
                                                        prompt: sug.prompt || sug.baslik || sug.title || '',
                                                        ikon: sug.ikon,
                                                        uiAksiyonu: sug.uiAksiyonu,
                                                        uiParametreleriJson: sug.uiParametreleriJson
                                                    };

                                                    if (item.uiAksiyonu === 'BULUT_DOSYA_SEC') {
                                                        setPendingHizliIstek(item);
                                                        setIsCloudPickerOpen(true);
                                                        return;
                                                    }

                                                    if (item.uiAksiyonu === 'METIN_YAPISTIR_MODAL') {
                                                        setPendingHizliIstek(item);
                                                        setModalInputText('');
                                                        setIsTextModalOpen(true);
                                                        return;
                                                    }

                                                    if (item.uiAksiyonu && item.uiAksiyonu !== 'YOK') {
                                                        const currentRoute = typeof window !== 'undefined' ? window.location.pathname : '';
                                                        window.dispatchEvent(new CustomEvent('ai-trigger-ui-action', {
                                                            detail: {
                                                                action: item.uiAksiyonu,
                                                                route: currentRoute,
                                                                params: item.uiParametreleriJson
                                                            }
                                                        }));
                                                        const customPrompt = (sug.prompt || '').trim();
                                                        if (customPrompt) {
                                                            await handleSendMessage(customPrompt);
                                                        }
                                                        return;
                                                    }

                                                    const textToSend = (item.prompt || item.baslik || '').trim();
                                                    if (textToSend) {
                                                        await handleSendMessage(textToSend);
                                                    }
                                                }}
                                            >
                                                <div className="base-chat-suggestion-header">
                                                    {sug.icon || renderBaseChatHizliIstekIcon(sug.ikon)}
                                                    <span>{sug.baslik || sug.title}</span>
                                                </div>
                                                {sug.description && (
                                                    <span className="base-chat-suggestion-desc">
                                                        {sug.description}
                                                    </span>
                                                )}
                                                <span className="base-chat-suggestion-text">
                                                    {sug.prompt}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Mesajlar Listesi */
                            currentMessages.map((msg, index) => {
                                const isUser = msg.role === 'user';
                                const isError = msg.role === 'error' || msg.isError;

                                return (
                                    <div
                                        key={msg.id || index}
                                        className={`ai-chat-message-row ${isUser ? 'user' : 'assistant'}`}
                                    >
                                        <div className={`ai-chat-avatar ${isUser ? 'user' : 'assistant'}`}>
                                            {isUser ? '👤' : <Sparkles size={16} />}
                                        </div>

                                        <div className="ai-chat-message-body">
                                            <div className="ai-chat-message-header">
                                                <span className="ai-chat-message-sender">
                                                    {isUser ? t('auto_siz', 'Siz') : (msg.agentName || activeAgent?.ad || t('auto_ai_asistan', 'AI Asistanı'))}
                                                </span>
                                                <span>•</span>
                                                <span>{formatTime(msg.timestamp)}</span>
                                                {msg.model && (
                                                    <span className="base-chat-model-badge">
                                                        {msg.model}
                                                    </span>
                                                )}
                                                {!isUser && (msg.totalTokens !== undefined || msg.promptTokens !== undefined || msg.completionTokens !== undefined || msg.latencyMs !== undefined || msg.ttftMs !== undefined) && (() => {
                                                    const totalTok = msg.totalTokens ?? ((msg.promptTokens || 0) + (msg.completionTokens || 0) || undefined);
                                                    const badgeParts: string[] = [];
                                                    if (totalTok !== undefined) badgeParts.push(`${totalTok} token`);
                                                    if (msg.latencyMs !== undefined) badgeParts.push(`${msg.latencyMs} ms`);
                                                    if (msg.ttftMs !== undefined) badgeParts.push(`TTFT ${msg.ttftMs} ms`);
                                                    if (badgeParts.length === 0) return null;
                                                    return (
                                                        <span
                                                            className="base-chat-perf-badge"
                                                            title={[
                                                                totalTok !== undefined ? `Toplam Token: ${totalTok}${msg.promptTokens ? ` (Prompt: ${msg.promptTokens}, Yanıt: ${msg.completionTokens})` : ''}` : '',
                                                                msg.latencyMs !== undefined ? `Gecikme (Latency): ${msg.latencyMs} ms` : '',
                                                                msg.ttftMs !== undefined ? `İlk Token Süresi (TTFT): ${msg.ttftMs} ms` : ''
                                                            ].filter(Boolean).join(' · ')}
                                                        >
                                                            <Cpu size={11} className="shrink-0" />
                                                            <span>{badgeParts.join(' · ')}</span>
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            {/* Düşünce ve Çıkarım Detayı (AiThinkingDetails) */}
                                            {enableThinkingDetails && msg.thinkingContent && (
                                                <AiThinkingDetails
                                                    content={msg.thinkingContent}
                                                    title={t('auto_dusunme_sureci', 'Yapay Zeka Düşünce & Analiz Süreci')}
                                                />
                                            )}

                                            {/* Baloncuk İçeriği */}
                                            <div className={`ai-chat-bubble ${isUser ? 'user' : 'assistant'} ${isError ? 'error' : ''}`}>
                                                <FormattedMessageContent content={msg.content} />

                                                {/* Mesaja Eklenmiş Dosyalar */}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="flex flex-wrap gap-6 mt-6">
                                                        {msg.attachments.map((att, attIdx) => (
                                                            <div key={attIdx} className="ai-chat-attachment-pill">
                                                                <FileText size={13} />
                                                                <span>{att.name}</span>
                                                                {att.size && (
                                                                    <span className="opacity-75">
                                                                        ({Math.round(att.size / 1024)} KB)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Yapay Zeka Tarafından Üretilen ERP Taslağı / Eylem & Onay Kartı */}
                                                {((msg as any).eylemVerisiJson || msg.eylemPayload?.eylemTipi) ? (
                                                    <AiActionCard
                                                        rawJson={(msg as any).eylemVerisiJson || (typeof msg.eylemPayload === 'string' ? msg.eylemPayload : JSON.stringify(msg.eylemPayload))}
                                                        onApply={handleApplyDraft}
                                                        onSendChatReply={(replyText) => handleSendMessage(replyText)}
                                                    />
                                                ) : msg.eylemPayload && (
                                                    <div className="ai-chat-draft-preview-card">
                                                        <div className="ai-chat-draft-preview-header">
                                                            <div className="flex items-center gap-6">
                                                                <CheckCircle2 size={16} className="text-success" />
                                                                <strong className="text-13 text-primary">
                                                                    {msg.eylemPayload.adi || msg.eylemPayload.header?.adi || t('auto_erp_taslak_belgesi', 'ERP Taslak Belgesi')}
                                                                </strong>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleApplyDraft(msg.eylemPayload)}
                                                                className="ai-chat-draft-apply-btn"
                                                            >
                                                                <ExternalLink size={13} />
                                                                <span>{t('auto_forma_aktar', 'Forma Aktar')}</span>
                                                            </button>
                                                        </div>
                                                        <span className="text-11 text-secondary">
                                                            {t('auto_taslak_aciklama', 'Bu taslak sisteminizdeki ilgili forma veya belge düzenleyiciye anında yüklenebilir.')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Mesaj Altı Aksiyonlar */}
                                            <div className="ai-chat-message-actions base-chat-msg-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(msg.content);
                                                        toast.success(t('auto_kopyalandi', 'Kopyalandı'));
                                                    }}
                                                    className="ai-chat-action-btn"
                                                    title={t('auto_metni_kopyala', 'Metni Kopyala')}
                                                >
                                                    <Copy size={13} />
                                                </button>

                                                {!isUser && !isError && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRegenerateMessage(msg.id)}
                                                            disabled={isGenerating}
                                                            className="ai-chat-action-btn"
                                                            title={t('auto_yeniden_uret', 'Yanıtı Yeniden Üret')}
                                                        >
                                                            <RotateCcw size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFeedback(msg.id, 'like')}
                                                            className={`ai-chat-action-btn ${msg.feedback === 'like' ? 'active like' : ''}`}
                                                            title={t('auto_bunu_begendim', 'Beğendim')}
                                                        >
                                                            <ThumbsUp size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFeedback(msg.id, 'dislike')}
                                                            className={`ai-chat-action-btn ${msg.feedback === 'dislike' ? 'active dislike' : ''}`}
                                                            title={t('auto_begenmedim', 'Geliştirilmeli')}
                                                        >
                                                            <ThumbsDown size={13} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Yapay Zeka Yanıt Üretirken Canlı Göstergeler */}
                        {isGenerating && (
                            <div className="flex flex-col gap-6">
                                <AiTypingIndicator
                                    showAvatar={true}
                                    statusText={t('auto_ai_yanit_hazirliyor', 'Yapay zeka yanıtı hazırlıyor...')}
                                />
                                {enableResponseTimer && (
                                    <AiResponseTimer
                                        elapsedSeconds={elapsedSeconds}
                                        onStop={handleStopGeneration}
                                        agentName={activeAgent?.ad}
                                        providerName={activeAgent?.saglayiciTuruAdi}
                                        modelName={activeAgent?.modelAdi || defaultModel}
                                    />
                                )}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* ─── 3. ALT GİRİŞ PANELİ (INPUT AREA) ─────────────────── */}
                    <div className="base-chat-input-area">
                        {/* Aşağı Kaydır Butonu */}
                        {showScrollBottom && (
                            <button
                                type="button"
                                onClick={() => {
                                    isUserScrolledUpRef.current = false;
                                    setShowScrollBottom(false);
                                    scrollToBottom(true);
                                }}
                                className="base-chat-scroll-bottom-btn"
                                title={t('auto_asagi_kaydir', 'Aşağı Kaydır')}
                            >
                                <ArrowDown size={18} />
                            </button>
                        )}

                        {/* Bekleyen Ekler */}
                        {pendingAttachments.length > 0 && (
                            <div className="base-chat-pending-attachments">
                                {pendingAttachments.map(att => (
                                    <div key={att.id} className="base-chat-pending-file">
                                        <FileText size={13} className="text-primary" />
                                        <span>{att.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAttachment(att.id)}
                                            className="base-chat-pending-file-remove"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Gizli Dosya Input'u */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            accept=".pdf,.txt,.docx,.xlsx,.csv,.json,.png,.jpg,.jpeg"
                            className="hidden"
                        />

                        {/* Giriş Çerçevesi */}
                        <div className="base-chat-input-box">
                            {enableAttachments && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="base-chat-input-tool-btn"
                                    title={t('auto_dosya_ekle', 'Dosya Ekle (PDF, XLSX, TXT, Resim)')}
                                >
                                    <Paperclip size={18} />
                                </button>
                            )}

                            <textarea
                                ref={textareaRef}
                                className="base-chat-textarea"
                                rows={1}
                                value={inputText}
                                onChange={(e) => {
                                    setInputText(e.target.value);
                                    adjustTextareaHeight();
                                }}
                                onKeyDown={handleTextareaKeyDown}
                                placeholder={placeholder || t('auto_chat_placeholder', 'Bir mesaj yazın veya ERP komutu verin... (Enter ile gönder, Shift+Enter ile yeni satır)')}
                                autoFocus
                            />

                            {isGenerating ? (
                                <button
                                    type="button"
                                    onClick={handleStopGeneration}
                                    className="base-chat-stop-btn"
                                    title={t('auto_yaniti_durdur', 'Yanıtı Durdur')}
                                >
                                    <Square size={14} fill="currentColor" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputText.trim() && pendingAttachments.length === 0}
                                    className="base-chat-send-btn"
                                    title={t('auto_gonder', 'Gönder (Enter)')}
                                >
                                    <Send size={16} />
                                </button>
                            )}
                        </div>

                        <div className="base-chat-footer-hint base-chat-input-footer-hint">
                            {t('auto_ai_uyari_notu', 'Yapay zeka asistanı hata yapabilir. Kritik muhasebe ve finansal kararlarda kayıtları doğrulayınız.')}
                        </div>
                    </div>
                </main>
            </div>

            {/* ─── BULUT DOSYASI SEÇİCİ (FilesOnClouds) ──────────────────────── */}
            {isCloudPickerOpen && AkalinUiFilesOnClouds && (
                <AkalinUiFilesOnClouds
                    isOpen={isCloudPickerOpen}
                    isModal={true}
                    showFolderTree={true}
                    documentType={documentType}
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
                            await handleSendMessage(combinedPrompt);
                            return;
                        }

                        setPendingAttachments(prev => [
                            ...prev,
                            {
                                id: file.id,
                                name: file.dosyaAdi,
                                size: file.dosyaBoyutu,
                                type: file.dosyaTipi,
                                url: file.url,
                                cloudFileId: file.id
                            }
                        ]);
                    }}
                />
            )}

            {/* ─── KAMPANYA / BELGE METNİ GİRİŞ PENCERESİ (isTextModalOpen) ──── */}
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
                                    {renderBaseChatHizliIstekIcon(pendingHizliIstek?.ikon || 'FileText')}
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
                                disabled={!modalInputText.trim() || isGenerating}
                                onClick={async () => {
                                    if (!modalInputText.trim() || isGenerating) return;
                                    setIsTextModalOpen(false);
                                    const basePrompt = (pendingHizliIstek?.prompt || pendingHizliIstek?.baslik || '').trim();
                                    const finalMessage = `${basePrompt}\n\n[KULLANICI TARAFINDAN GİRİLEN METİN]:\n${modalInputText.trim()}`;
                                    setPendingHizliIstek(null);
                                    setModalInputText('');
                                    await handleSendMessage(finalMessage);
                                }}
                            >
                                <Sparkles size={15} />
                                <span>{t('Analiz Et ve Belge Oluştur')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── ONAY / UYARI DİALOGU (AlertDialog) ────────────────────────── */}
            <AlertDialog
                isOpen={alertConfig.isOpen}
                type={alertConfig.type || 'info'}
                title={alertConfig.title}
                message={alertConfig.message}
                onConfirm={alertConfig.onConfirm}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </BasePage>
    );
};

export const BaseAiChatPage = BaseChatPage;
export default BaseChatPage;
