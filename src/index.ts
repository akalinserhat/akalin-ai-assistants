/**
 * @file index.ts
 * @description
 * @akalin/ai-assistants - Bağımsız Yapay Zeka Asistanı, Rota Bazlı Uzman Ajanlar ve Akıllı Sohbet Modülü Ana Giriş Noktası (Barrel Export).
 */

// Tipler
export * from './types';

// Sözlükler
export * from './locales/defaultLocales';

// Adaptörler
export * from './adapters/AiChatAdapter';

// Context ve Hook'lar
export {
  AiChatContext,
  AiChatProvider,
  useAiChat,
  resolveRouteToAgentCode,
  matchAgentForRoute,
  DEFAULT_SYSTEM_AGENTS
} from './context/AiChatContext';

// Bileşenler
export { AiActionCard } from './components/AiActionCard';
export { AiAssistantButton } from './components/AiAssistantButton';
export { AiChatPanel } from './components/AiChatPanel';

// Sayfalar
export { 
  default as BaseChatPage, 
  BaseAiChatPage 
} from './pages/BaseChatPage';

// Modül Fabrikası ve Örneği (@akalin/module_core uyumlu)
export { createAiAssistantsModule } from './createAiAssistantsModule';
import { AiAssistantsModule } from './AiAssistantsModule';
export { AiAssistantsModule };
export default AiAssistantsModule;
