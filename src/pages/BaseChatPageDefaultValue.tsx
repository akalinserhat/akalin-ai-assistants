/**
 * @file BaseChatPageDefaultValue.tsx
 * @description
 * @akalin/ai-assistants - BaseChatPage Varsayılan Başlangıç Değerleri ve ActionMenu Varsayılan Seçenek Yöneticisi.
 *
 * Başlıca Sorumlulukları:
 * - Form Default Values & Initial State Architecture kurallarına uygun olarak BaseChatPage başlangıç durumlarını üretir.
 * - "Yeni Sohbet" ekranı ilk açıldığında (henüz mesaj gönderilmemişken / sohbet başlamamışken)
 *   ActionMenu'de "Model Seçimi (Model Tercihi)" seçeneğinin varsayılan (isDefault: true) olmasını sağlar.
 * - Sohbet başladıktan sonra (en az bir mesaj mevcut olduğunda) ActionMenu'de
 *   "Yeni Sohbet Başlat" seçeneğinin varsayılan (isDefault: true) olmasını sağlar.
 */

import React from 'react';
import {
    Plus,
    Cpu,
    Sliders,
    Trash2,
    Download,
    Code2
} from 'lucide-react';
import type { ActionMenuItem } from '@akalin/ui';
import type { ChatAgent, ChatMessage, ChatSession } from '../types';

export type BaseChatActionMenuDefaultMode = 'model-select' | 'new-chat';

export interface BaseChatPageDefaultValues {
    isSidebarOpen: boolean;
    searchSessionQuery: string;
    isSystemPromptOpen: boolean;
    systemPrompt: string;
    selectedAgentId: string | number | null;
    actionMenuDefaultMode: BaseChatActionMenuDefaultMode;
}

export interface BaseChatPageDefaultValuesOptions {
    showHistorySidebar?: boolean;
    defaultHistoryOpen?: boolean;
    externalSystemPrompt?: string;
    externalSelectedAgentId?: string | number;
    agents?: ChatAgent[];
    messages?: ChatMessage[];
}

/**
 * Sohbetin başlayıp başlamadığını kontrol eder.
 * Mesaj listesinde en az 1 mesaj varsa sohbet başlamış kabul edilir.
 */
export const isBaseChatConversationStarted = (messages?: ChatMessage[] | null): boolean => {
    return Array.isArray(messages) && messages.length > 0;
};

/**
 * ActionMenu üzerinde hangi seçeneğin varsayılan (isDefault: true) olacağını çözümler:
 * - "Yeni Sohbet" ekranı ilk açıldığında (henüz mesaj yokken): 'model-select' (Model Seçimi varsayılan)
 * - Sohbet başladıktan sonra (mesaj gönderildiğinde / mevcut sohbet açıldığında): 'new-chat' ("Yeni Sohbet Başlat" varsayılan)
 */
export const resolveBaseChatActionMenuDefaultMode = (options: {
    messages?: ChatMessage[] | null;
    agentsCount?: number;
}): BaseChatActionMenuDefaultMode => {
    const hasStarted = isBaseChatConversationStarted(options.messages);
    const hasAgents = (options.agentsCount ?? 0) > 0;

    if (!hasStarted && hasAgents) {
        return 'model-select';
    }
    return 'new-chat';
};

/**
 * BaseChatPage ilk açılış varsayılan değerlerini döndürür.
 */
export const getBaseChatPageDefaultValues = (
    options: BaseChatPageDefaultValuesOptions = {}
): BaseChatPageDefaultValues => {
    const {
        showHistorySidebar = false,
        defaultHistoryOpen = false,
        externalSystemPrompt,
        externalSelectedAgentId,
        agents = [],
        messages = []
    } = options;

    return {
        isSidebarOpen: Boolean(showHistorySidebar && defaultHistoryOpen),
        searchSessionQuery: '',
        isSystemPromptOpen: false,
        systemPrompt: externalSystemPrompt || '',
        selectedAgentId:
            externalSelectedAgentId !== undefined
                ? externalSelectedAgentId
                : agents[0]?.id || null,
        actionMenuDefaultMode: resolveBaseChatActionMenuDefaultMode({
            messages,
            agentsCount: agents.length
        })
    };
};

/**
 * İlk boş "Yeni Sohbet" oturum nesnesini üretir.
 */
export const createDefaultInitialChatSession = (
    id: string,
    title: string = 'Yeni Sohbet'
): ChatSession => ({
    id,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
});

export interface BuildBaseChatActionMenuItemsParams {
    t: (key: string, defaultText?: string) => string;
    messages: ChatMessage[];
    agentsList: ChatAgent[];
    selectedAgentId: string | number | null;
    onSelectAgent: (nextAgentId: string) => void;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    onToggleSystemPrompt: () => void;
    onCreateNewSession: () => void;
    onClearCurrentMessages: () => void;
    onExportMarkdown: () => void;
    onExportJson: () => void;
    extraDropdownActions?: ActionMenuItem[];
}

/**
 * BaseChatPage için ActionMenu öğelerini ve varsayılan (isDefault) aksiyon durumunu oluşturur:
 * - "Yeni Sohbet" ekranı ilk açıldığında (messages.length === 0): Model Seçimi varsayılan (isDefault: true) olur ve en üstte yer alır.
 * - Sohbet başladıktan sonra (messages.length > 0): "Yeni Sohbet Başlat" varsayılan (isDefault: true) olur ve en üstte yer alır.
 */
export const buildBaseChatActionMenuItems = ({
    t,
    messages,
    agentsList,
    selectedAgentId,
    onSelectAgent,
    isSidebarOpen,
    onToggleSidebar,
    onToggleSystemPrompt,
    onCreateNewSession,
    onClearCurrentMessages,
    onExportMarkdown,
    onExportJson,
    extraDropdownActions
}: BuildBaseChatActionMenuItemsParams): ActionMenuItem[] => {
    const defaultMode = resolveBaseChatActionMenuDefaultMode({
        messages,
        agentsCount: agentsList.length
    });

    const hasChildExplicitDefault = Boolean(
        extraDropdownActions?.some(a => !a.hidden && (a.isDefault || a.default))
    );

    const isModelSelectionDefault = !hasChildExplicitDefault && defaultMode === 'model-select';
    const isNewChatDefault = !hasChildExplicitDefault && defaultMode === 'new-chat';

    const activeAgent =
        agentsList.find(a => String(a.id) === String(selectedAgentId)) || agentsList[0];
    const activeAgentName = activeAgent
        ? activeAgent.ad || activeAgent.modelAdi || 'Model'
        : t('auto_model_secimi', 'Model Seçimi');

    const modelPreferenceItem: ActionMenuItem | null =
        agentsList.length > 0
            ? {
                  label: `${t('auto_model_secimi', 'Model Seçimi')}: ${activeAgentName}`,
                  icon: <Cpu size={15} />,
                  isDefault: isModelSelectionDefault,
                  variant: isModelSelectionDefault ? 'primary' : 'default',
                  dividerAbove: !isModelSelectionDefault,
                  onClick: (e) => {
                      const group = (e?.currentTarget as HTMLElement | undefined)?.closest(
                          '.action-menu-btn-group'
                      );
                      const toggleBtn = group?.querySelector(
                          '.action-menu-toggle-btn'
                      ) as HTMLButtonElement | null;
                      if (toggleBtn) {
                          toggleBtn.click();
                      }
                      setTimeout(() => {
                          const selectEl = document.querySelector(
                              '.base-chat-action-menu-select'
                          ) as HTMLSelectElement | null;
                          selectEl?.focus();
                      }, 60);
                  },
                  custom: (
                      <div
                          className={`base-chat-action-menu-model ${
                              isModelSelectionDefault ? 'is-default-model' : ''
                          }`.trim()}
                      >
                          <div className="base-chat-action-menu-model-header">
                              <span className="base-chat-action-menu-model-label">
                                  <Cpu size={13} />
                                  <span>{t('auto_model_tercihi', 'Model Tercihi')}</span>
                              </span>
                              {isModelSelectionDefault && (
                                  <span className="base-chat-action-menu-default-badge">
                                      {t('auto_varsayilan', 'Varsayılan')}
                                  </span>
                              )}
                          </div>
                          <select
                              className="base-chat-agent-select base-chat-action-menu-select"
                              value={selectedAgentId || ''}
                              onChange={(e) => onSelectAgent(e.target.value)}
                              title={t('auto_model_tercihi', 'Model Tercihi')}
                          >
                              {agentsList.map(a => (
                                  <option key={a.id} value={a.id}>
                                      🤖 {a.ad || a.modelAdi || 'Ajan'}
                                  </option>
                              ))}
                          </select>
                      </div>
                  )
              }
            : null;

    const newChatItem: ActionMenuItem = {
        label: t('auto_yeni_sohbet_baslat', 'Yeni Sohbet Başlat'),
        icon: <Plus size={15} />,
        isDefault: isNewChatDefault,
        variant: isNewChatDefault ? 'primary' : 'default',
        dividerAbove: isModelSelectionDefault && Boolean(modelPreferenceItem),
        onClick: onCreateNewSession
    };

    const primaryItems: ActionMenuItem[] = isModelSelectionDefault
        ? [...(modelPreferenceItem ? [modelPreferenceItem] : []), newChatItem]
        : [newChatItem, ...(modelPreferenceItem ? [modelPreferenceItem] : [])];

    const baseSecondaryItems: ActionMenuItem[] = [
        {
            label: t('auto_sistem_yonergesi', 'Sistem Yönergesi (System Prompt)'),
            icon: <Sliders size={15} />,
            dividerAbove: true,
            onClick: onToggleSystemPrompt
        },
        {
            label: t('auto_sohbeti_temizle', 'Sohbeti Temizle'),
            icon: <Trash2 size={15} className="text-danger" />,
            onClick: onClearCurrentMessages,
            disabled: messages.length === 0
        },
        {
            label: t('auto_disa_aktar_md', 'Markdown Olarak İndir (.md)'),
            icon: <Download size={15} />,
            onClick: onExportMarkdown,
            disabled: messages.length === 0
        },
        {
            label: t('auto_disa_aktar_json', 'JSON Olarak İndir (.json)'),
            icon: <Code2 size={15} />,
            onClick: onExportJson,
            disabled: messages.length === 0
        }
    ];

    return [
        ...primaryItems,
        ...(extraDropdownActions || []),
        ...baseSecondaryItems
    ];
};

