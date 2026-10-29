/**
 * @file index.ts
 * @description
 * @akalin/ai-assistants - Tüm Yapay Zeka Asistanı ve Sohbet Modülü Tip Tanımlamaları.
 */

import { ReactNode, ComponentType } from 'react';

// ─── SOHBET VE OTURUM TİPLERİ ───────────────────────────────────────────────

export interface AiSession {
  id: number;
  baslik: string;
  aiAjanId?: number;
  aiAjanAdi?: string;
  sonAktiviteTarihi: string;
  sonMesajOzet?: string;
  mesajSayisi: number;
}

export interface AiMessage {
  id: number;
  aiSohbetOturumuId: number;
  role: 'user' | 'assistant' | 'system' | 'tool';
  icerik: string;
  eylemVerisiJson?: string;
  sayfaBaglami?: string;
  modelBilgisi?: string;
  islemSuresiMs?: number;
  canliLlmMi?: boolean;
  tarih: string;
}

export type AiPanelMode = 'docked' | 'floating' | 'collapsed';

export interface AiPageContext {
  route: string;
  title?: string;
  documentType?: string;
  data?: any;
}

export interface CloudFileItem {
  id: number;
  dosyaAdi: string;
  dosyaBoyutu?: number;
  dosyaTipi?: string;
  bulutDosyaUrl?: string;
  url?: string;
  provider?: string;
  belgeNo?: string;
  belgeTuru?: string;
}

// ─── UZMAN AJAN TİPLERİ ─────────────────────────────────────────────────────

export type AiHizliIstekUiAksiyonu =
  | 'YOK'
  | 'BULUT_DOSYA_SEC'
  | 'METIN_YAPISTIR_MODAL'
  | 'EXCEL_IMPORT'
  | 'CARI_SEC'
  | 'URUN_SEC'
  | 'OZEL_ROTA'
  | string;

export type AiAkisDugumuTipi =
  | 'BASLANGIC_GIRDI'
  | 'MCP_SORGULA'
  | 'KARAR_ONAY'
  | 'EKRAN_AC'
  | 'BELGE_OLUSTUR'
  | 'SONUC'
  | string;

export interface AiAkisDugumu {
  id: string;
  tip: AiAkisDugumuTipi;
  baslik: string;
  prompt: string;
  aracKodu?: string;
  uiAksiyonu?: AiHizliIstekUiAksiyonu;
  hedefRota?: string;
  sonrakiDugumId?: string;
  evetDugumId?: string;
  hayirDugumId?: string;
  hizliErisimDugmesi?: boolean;
}

export interface AgentHizliIstek {
  id?: string;
  baslik: string;
  prompt?: string;
  ikon?: string;
  uiAksiyonu?: AiHizliIstekUiAksiyonu;
  uiParametreleriJson?: string;
  sira?: number;
  aktifMi?: boolean;
  hizliErisimDugmesi?: boolean;
  tetiklemeAnahtarlari?: string;
  akisDugumleri?: AiAkisDugumu[];
}

export type AiHizliIstek = AgentHizliIstek;

export interface AgentDefinition {
  id?: number | string;
  kod: string;
  ad: string;
  aciklama?: string;
  sistemTalimati?: string;
  model?: string;
  sicaklik?: number;
  aktif?: boolean;
  icon?: string;
  color?: string;
  hizliIstekler?: AgentHizliIstek[];
  hizliIsteklerJson?: string;
}

// ─── CONTEXT VE PROVIDER TİPLERİ ────────────────────────────────────────────

export interface AiChatContextType {
  isOpen: boolean;
  panelMode: AiPanelMode;
  setPanelMode: (mode: AiPanelMode) => void;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  sessions: AiSession[];
  activeSessionId: number | null;
  setActiveSessionId: (id: number | null) => void;
  messages: AiMessage[];
  loading: boolean;
  isSending: boolean;
  sendMessage: (text: string, customAgentId?: number) => Promise<void>;
  stopGenerating: () => void;
  createNewSession: (title?: string) => Promise<number | null>;
  startNewSession: () => Promise<void>;
  deleteSession: (id: number) => Promise<void>;
  renameSession: (id: number, newTitle: string) => Promise<void>;
  pageContext: AiPageContext;
  setPageContext: React.Dispatch<React.SetStateAction<AiPageContext>>;
  agents: AgentDefinition[];
  selectedAgentId: number | null;
  setSelectedAgentId: (id: number | null) => void;
  refreshSessions: () => Promise<void>;
  refreshAgents: () => Promise<void>;
}

export interface AiChatProviderProps {
  children: ReactNode;
  apiEndpoint?: string;
  adapter?: IAiChatAdapter;
  defaultAgents?: AgentDefinition[];
  defaultPanelMode?: AiPanelMode;
  defaultOpen?: boolean;
}

// ─── ADAPTER TİPİ ───────────────────────────────────────────────────────────

export interface IAiChatAdapter {
  getSessions: () => Promise<AiSession[]>;
  createSession: (title?: string, agentId?: number | null) => Promise<AiSession>;
  getMessages: (sessionId: number) => Promise<AiMessage[]>;
  sendMessage: (payload: {
    oturumId?: number | null;
    aiSohbetOturumuId?: number | null;
    mesaj: string;
    aiAjanId?: number | null;
    sayfaBaglami?: string;
    eylemVerisiJson?: string;
    dosyaIdleri?: number[];
  }, signal?: AbortSignal) => Promise<{
    oturumId: number;
    oturumBaslik?: string;
    mesaj?: AiMessage;
    asistanCevabi?: AiMessage;
    kullaniciMesaji?: AiMessage;
    islemSuresiMs?: number;
  }>;
  deleteSession: (sessionId: number) => Promise<void>;
  renameSession: (sessionId: number, newTitle: string) => Promise<void>;
  getAgents?: () => Promise<AgentDefinition[]>;
}

// ─── BİLEŞEN PROP TİPLERİ ───────────────────────────────────────────────────

export interface AiChatPanelProps {
  className?: string;
  onApplyAiData?: (data: any) => void;
  showCloudFiles?: boolean;
  onClose?: () => void;
}

export interface AiActionOptionItem {
  id: number | string;
  baslik: string;
  detay?: string;
  aciklama?: string;
  varsayilanMi?: boolean;
  [key: string]: any;
}

export interface AiActionCardProps {
  rawJson: string;
  onApply?: (data: any) => void;
  onSendChatReply?: (replyText: string) => void;
}

export interface AiAssistantButtonProps {
  className?: string;
  title?: string;
  label?: string;
  showLabel?: boolean;
  iconSize?: number;
  onClick?: () => void;
  variant?: 'header' | 'floating' | 'minimal';
}

// ─── BASE CHAT PAGE TİPLERİ (TAM SAYFA GÖRÜNÜMÜ) ────────────────────────────

export interface ChatAttachment {
  id?: string | number;
  name: string;
  size?: number;
  type?: string;
  url?: string;
  file?: File;
  cloudFileId?: number | string;
}

export interface ChatMessage {
  id: string | number;
  role: 'user' | 'assistant' | 'system' | 'error' | 'tool';
  content: string;
  sender?: 'user' | 'assistant' | 'system';
  text?: string;
  timestamp?: Date | string | number;
  model?: string;
  provider?: string;
  agentName?: string;
  thinkingContent?: string;
  toolCalls?: any[];
  eylemPayload?: any; // ERP formu veya belgesine aktarılacak taslak veri
  actionPayload?: any;
  attachments?: ChatAttachment[];
  status?: 'sending' | 'streaming' | 'done' | 'sent' | 'error';
  isError?: boolean;
  isStreaming?: boolean;
  feedback?: 'like' | 'dislike' | null;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  tokens?: number;
  latencyMs?: number;
  durationMs?: number;
  ttftMs?: number;
  customData?: Record<string, any>;
}

export interface ChatSession {
  id: string | number;
  title: string;
  createdAt: Date | string | number;
  updatedAt?: Date | string | number;
  messages: ChatMessage[];
  messageCount?: number;
  agentId?: string | number;
  modelId?: string;
  pinned?: boolean;
}

export interface ChatAgent {
  id: string | number;
  name?: string;
  ad?: string;
  kod?: string;
  rol?: string;
  modelAdi?: string;
  model?: string;
  saglayiciTuru?: number;
  saglayiciTuruAdi?: string;
  aciklama?: string;
  description?: string;
  avatar?: string;
  icon?: ReactNode;
  systemPrompt?: string;
  sistemPromptu?: string;
  temperature?: number;
  category?: string;
  isLocal?: boolean;
  hizliIstekler?: AgentHizliIstek[];
  hizliIsteklerJson?: string;
}

export interface PromptSuggestion {
  id?: string | number;
  title: string;
  prompt: string;
  icon?: ReactNode;
  category?: string;
  description?: string;
  baslik?: string;
  ikon?: string;
  uiAksiyonu?: AiHizliIstekUiAksiyonu;
  uiParametreleriJson?: string;
  sira?: number;
  aktifMi?: boolean;
  hizliErisimDugmesi?: boolean;
}

// ─── MODÜL FABRİKASI SEÇENEKLERİ (MODULE CORE UYUMLU) ───────────────────────

export interface CreateAiAssistantsModuleOptions {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  version?: string;
  permissionPrefix?: string;
  baseRoute?: string;
  routeTitle?: string;
  order?: number;
  isCore?: boolean;
  defaultActive?: boolean;
  showInMenu?: boolean;
  menuLabel?: string;
  requiredPermissions?: string[];
  apiEndpoint?: string;
  adapter?: IAiChatAdapter;
  defaultAgents?: AgentDefinition[];
  enableHeaderButton?: boolean;
}

export interface AiAssistantsModuleDefinition {
  id: string;
  title: string;
  name: string;
  description?: string;
  version?: string;
  permissionPrefix?: string;
  icon?: ReactNode;
  iconName?: string;
  order?: number;
  isCore?: boolean;
  defaultActive?: boolean;
  routes: Array<{
    path: string;
    element: ReactNode;
    title?: string;
    requiredPermissions?: string[];
  }>;
  menuItems: Array<{
    id: string;
    label: string;
    path?: string;
    icon?: ReactNode;
    order?: number;
    requiredPermissions?: string[];
  }>;
  components: {
    AiChatPanel: ComponentType<AiChatPanelProps>;
    AiChatProvider: ComponentType<AiChatProviderProps>;
    AiAssistantButton: ComponentType<AiAssistantButtonProps>;
    AiActionCard: ComponentType<AiActionCardProps>;
    BaseChatPage: ComponentType<any>;
    BaseAiChatPage: ComponentType<any>;
    [key: string]: ComponentType<any>;
  };
  actions?: Array<{
    id: string;
    type: string;
    label: string;
    icon?: ReactNode;
    component?: ComponentType<any>;
  }>;
}
