# @akalin/ai-assistants

`@akalin/ui` ve `@akalin/module_core` altyapısı üzerinde çalışan bağımsız **Yapay Zeka Asistanı, Rota Bazlı Uzman Ajanlar, Kayan/Sabit Sohbet Paneli, Tam Sayfa Chat Çalışma Alanı ve Akıllı ERP Eylem Kartları** modülü.

---

## 🚀 Özellikler

- **Çok Modlu Sohbet Arayüzü:**
  - **Docked:** Sayfanın sağına kenetlenen, kullanıcı ERP ekranında çalışırken eş zamanlı açık kalan çekmece paneli.
  - **Floating:** Sayfa üzerinde serbestçe taşınabilen kayan pencere modu.
  - **BaseChatPage:** Tam sayfa odaklanmış yapay zeka sohbet ve analiz ekranı (`/ai-asistan`).
- **Rota Bazlı Otomatik Uzman Ajan Eşleştirme:**
  - Kampanya rotaları -> `KAMPANYA_UZMANI`
  - Stok, depo ve envanter rotaları -> `STOK_UZMANI`
  - Sipariş, fatura, irsaliye rotaları -> `SIPARIS_ASISTANI`
  - Kasa, banka, cari ve çek rotaları -> `FINANS_UZMANI`
  - Sistem ve admin rotaları -> `ADMIN_SISTEM_UZMANI`
- **Zengin ERP Eylem Kartları (`AiActionCard`):**
  - Yapay zekanın ürettiği sipariş, fatura veya kampanya taslaklarını tek tıkla canlı Webakus formlarına aktarma (`Forma Aktar`).
- **Tak-Çalıştır Header Butonu (`AiAssistantButton`):**
  - Üst başlık (Header) veya araç çubuklarına doğrudan yerleştirilebilen, durumunu otomatik yöneten buton.
- **Modül Sistemi (`@akalin/module_core`):**
  - `createAiAssistantsModule()` fonksiyonu ile `IModuleDefinition` uyumlu modül tanımı oluşturma ve `ModuleRegistry` ile entegrasyon.

---

## 📦 Kurulum

```json
{
  "dependencies": {
    "@akalin/module_core": "github:akalinserhat/akalin-module-core#main",
    "@akalin/ui": "github:akalinserhat/akalin-ui#main",
    "@akalin/ai-assistants": "github:akalinserhat/akalin-ai-assistants#main"
  }
}
```

---

## 💻 Kullanım

### 1. ModuleRegistry ile Rota ve Menü Entegrasyonu

```tsx
import { ModuleRegistry } from '@akalin/module_core';
import { createAiAssistantsModule } from '@akalin/ai-assistants';

ModuleRegistry.register(
  createAiAssistantsModule({
    baseRoute: '/ai-asistan',
    routeTitle: 'AI Asistan Sohbet',
    showInMenu: true
  })
);
```

### 2. Uygulama Kökünde Provider Sarmalama (`App.tsx`)

```tsx
import { AiChatProvider } from '@akalin/ai-assistants';

function App() {
  return (
    <AiChatProvider apiEndpoint="/api/AiChat">
      <AppContent />
    </AiChatProvider>
  );
}
```

### 3. Header'da Buton Kullanımı (`Header.tsx`)

```tsx
import { AiAssistantButton } from '@akalin/ai-assistants';

export const Header = () => {
  return (
    <header className="header">
      {/* ... diğer bileşenler ... */}
      <AiAssistantButton />
    </header>
  );
};
```

### 4. Layout'ta Sohbet Panelini Render Etme (`AppLayout.tsx`)

```tsx
import { AiChatPanel, useAiChat } from '@akalin/ai-assistants';

export const AppLayout = () => {
  const { setPageContext } = useAiChat();

  useEffect(() => {
    setPageContext({ route: window.location.pathname });
  }, [window.location.pathname]);

  return (
    <div className="layout">
      {/* ... sayfa içeriği ... */}
      <AiChatPanel onApplyAiData={(data) => console.log('Forma aktarıldı:', data)} />
    </div>
  );
};
```
