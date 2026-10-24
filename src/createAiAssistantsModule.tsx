/**
 * @file createAiAssistantsModule.tsx
 * @description
 * @akalin/ai-assistants - Modül Fabrikası (createAiAssistantsModule).
 * @akalin/module_core ve Webakus ModuleRegistry (IModuleDefinition) ile %100 uyumlu
 * AI Asistan Modülü tanımı üretir.
 */

import React from 'react';
import { Sparkles, Bot } from 'lucide-react';
import { CreateAiAssistantsModuleOptions, AiAssistantsModuleDefinition } from './types';
import { AiChatProvider, useAiChat } from './context/AiChatContext';
import { AiChatPanel } from './components/AiChatPanel';
import { AiAssistantButton } from './components/AiAssistantButton';
import { AiActionCard } from './components/AiActionCard';
import BaseChatPage, { BaseAiChatPage } from './pages/BaseChatPage';
import { AI_ASSISTANTS_LOCALES } from './locales/defaultLocales';

export function createAiAssistantsModule(
  options?: CreateAiAssistantsModuleOptions
): AiAssistantsModuleDefinition {
  const id = options?.id || 'ai-assistants';
  const title = options?.title || 'AI Asistan';
  const name = options?.name || title;
  const baseRoute = (options?.baseRoute || '/ai-asistan').replace(/\/$/, '');
  const routeTitle = options?.routeTitle || 'AI Asistan Sohbet';
  const order = options?.order ?? 90;
  const isCore = options?.isCore ?? true;
  const defaultActive = options?.defaultActive ?? true;

  const ConnectedChatPage: React.FC<any> = (props) => (
    <AiChatProvider
      apiEndpoint={options?.apiEndpoint}
      adapter={options?.adapter}
      defaultAgents={options?.defaultAgents}
    >
      <BaseAiChatPage {...props} />
    </AiChatProvider>
  );

  return {
    id,
    title,
    name,
    description:
      options?.description ||
      'Webakus Akıllı Yapay Zeka Asistanı, Rota Bazlı Uzman Ajanlar, Sohbet Paneli ve Oturum Yönetim Modülü.',
    version: options?.version || '1.0.0',
    permissionPrefix: options?.permissionPrefix || 'ai',
    icon: React.createElement(Sparkles, { size: 20 }),
    iconName: 'Sparkles',
    order,
    isCore,
    defaultActive,
    routes: [
      {
        path: baseRoute,
        element: React.createElement(ConnectedChatPage),
        title: routeTitle,
        requiredPermissions: options?.requiredPermissions,
      },
    ],
    menuItems: options?.showInMenu
      ? [
          {
            id: `${id}-menu`,
            label: options?.menuLabel || title,
            path: baseRoute,
            icon: React.createElement(Sparkles, { size: 20 }),
            order,
            requiredPermissions: options?.requiredPermissions,
          },
        ]
      : [],
    components: {
      AiChatPanel,
      AiChatProvider,
      useAiChat: useAiChat as any,
      BaseChatPage,
      BaseAiChatPage: ConnectedChatPage,
      AiAssistantButton,
      AiActionCard,
    },
    actions: [
      {
        id: 'ai-assistant-toggle-button',
        type: 'button',
        label: title,
        icon: React.createElement(Sparkles, { size: 16 }),
        component: AiAssistantButton as any,
      },
    ],
  };
}

export default createAiAssistantsModule;
