/**
 * @file AiModelSelection.tsx
 * @description
 * @akalin/ai-assistants - AI Model ve Parametre Yapılandırma Modal Bileşeni
 * BasePopup temel sınıfından türetilmiştir.
 * 
 * Sorumlulukları:
 * - LLM Sağlayıcısı seçimi (LLMSeciciInput)
 * - Model seçimi veya girişi (YZModelSecici)
 * - Sıcaklık (Temperature / Creativity) parametre ayarı (Slider & Rozet)
 * - Maksimum Token Sınırı (Max Tokens) parametre ayarı (TamsayiInput)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Bot, Cpu, Zap, Thermometer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { 
  BasePopup, 
  LLMSeciciInput, 
  YZModelSecici, 
  TamsayiInput,
  type LLMSaglayiciOption 
} from '@akalin/ui';
import '../styles/AiModelSelection.css';

export interface AiModelConfig {
  id?: string;
  aiSaglayiciId: number | string | null;
  saglayiciAdi?: string;
  modelAdi: string;
  sicaklik: number;
  maxTokens: number;
  sira?: number;
}

export interface AiModelSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (modelConfig: AiModelConfig) => void;
  initialData?: Partial<AiModelConfig> | null;
  providers?: LLMSaglayiciOption[];
  excludedModelNames?: string[];
  title?: string;
}

const AiModelSelection: React.FC<AiModelSelectionProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  providers = [],
  excludedModelNames = [],
  title
}) => {
  const { t } = useTranslation();

  const [aiSaglayiciId, setAiSaglayiciId] = useState<string>('');
  const [modelAdi, setModelAdi] = useState<string>('');
  const [sicaklik, setSicaklik] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2048);

  // Modal açıldığında veya initialData değiştiğinde formu doldur
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setAiSaglayiciId(initialData.aiSaglayiciId ? String(initialData.aiSaglayiciId) : (providers[0]?.id ? String(providers[0].id) : ''));
        setModelAdi(initialData.modelAdi || '');
        setSicaklik(initialData.sicaklik !== undefined ? initialData.sicaklik : 0.7);
        setMaxTokens(initialData.maxTokens !== undefined ? initialData.maxTokens : 2048);
      } else {
        const defaultProvId = providers[0]?.id ? String(providers[0].id) : '';
        setAiSaglayiciId(defaultProvId);
        const firstProv = providers.find(p => String(p.id) === defaultProvId);
        setModelAdi(firstProv?.varsayilanModel || firstProv?.desteklenenModeller?.[0] || '');
        setSicaklik(0.7);
        setMaxTokens(2048);
      }
    }
  }, [isOpen, initialData, providers]);

  // Seçili sağlayıcı nesnesi
  const selectedProvider = useMemo(() => {
    if (!aiSaglayiciId) return null;
    return providers.find(p => String(p.id) === String(aiSaglayiciId)) || null;
  }, [providers, aiSaglayiciId]);

  // Kullanılabilir modeller (başka satırlarda seçili olanları filtrele, mevcut düzenleneni hariç tutma)
  const availableModels = useMemo(() => {
    if (!selectedProvider) return [];
    const models = Array.isArray(selectedProvider.desteklenenModeller) ? [...selectedProvider.desteklenenModeller] : [];
    if (selectedProvider.varsayilanModel && !models.includes(selectedProvider.varsayilanModel)) {
      models.unshift(selectedProvider.varsayilanModel);
    }

    const excluded = new Set(
      excludedModelNames
        .filter(m => m && (!initialData?.modelAdi || m.toLowerCase() !== initialData.modelAdi.toLowerCase()))
        .map(m => m.toLowerCase())
    );

    return models.filter(m => !excluded.has(m.toLowerCase()));
  }, [selectedProvider, excludedModelNames, initialData?.modelAdi]);

  const handleSave = () => {
    if (!aiSaglayiciId) {
      toast.error(t('lutfen_saglayici_secin', 'Lütfen bir LLM sağlayıcısı seçiniz.'));
      return;
    }
    if (!modelAdi.trim()) {
      toast.error(t('lutfen_model_secin', 'Lütfen bir model seçiniz veya yazınız.'));
      return;
    }

    onSave({
      id: initialData?.id || `${modelAdi.trim()}-${Date.now()}`,
      aiSaglayiciId: Number(aiSaglayiciId) || aiSaglayiciId,
      saglayiciAdi: selectedProvider?.ad,
      modelAdi: modelAdi.trim(),
      sicaklik: Number(sicaklik) || 0.7,
      maxTokens: Number(maxTokens) || 2048,
      sira: initialData?.sira
    });

    onClose();
  };

  const isEdit = Boolean(initialData?.modelAdi);
  const modalTitle = title || (isEdit 
    ? t('model_yapilandirma_duzenle', 'Model ve Parametreleri Düzenle') 
    : t('yeni_model_yapilandirma_ekle', 'Yeni Model ve Parametre Ekle')
  );

  return (
    <BasePopup
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      modalSize="md"
      onSave={handleSave}
      submitButtonText={isEdit ? t('guncelle', 'Güncelle') : t('ekle', 'Ekle')}
    >
      <div className="ai-model-selection-content">
        {/* LLM Sağlayıcısı Seçimi */}
        <div className="form-field">
          <label className="form-label flex-row items-center gap-6 mb-6">
            <Bot size={15} color="var(--accent-primary)" />
            <span>{t('llm_saglayicisi', 'LLM Sağlayıcısı')} *</span>
          </label>
          <LLMSeciciInput
            id="modalAiSaglayiciId"
            value={aiSaglayiciId}
            onChange={(provId, provObj) => {
              const newId = provId ? String(provId) : '';
              setAiSaglayiciId(newId);
              const matchedProv = providers.find(p => String(p.id) === newId) || provObj;
              const nextModel = matchedProv?.varsayilanModel || matchedProv?.desteklenenModeller?.[0] || '';
              setModelAdi(nextModel);
            }}
            providers={providers}
            placeholder={t('llm_saglayici_seciniz', 'LLM Sağlayıcısı Seçiniz...')}
          />
        </div>

        {/* Model Seçimi */}
        <div className="form-field">
          <label className="form-label flex-row items-center gap-6 mb-6">
            <Cpu size={15} color="var(--accent-primary)" />
            <span>{t('kullanilacak_model', 'Model')} *</span>
          </label>
          <YZModelSecici
            id="modalModelAdi"
            value={modelAdi}
            onChange={(selectedModel: string) => setModelAdi(selectedModel)}
            singleSelect={true}
            saglayiciTuru={selectedProvider?.saglayiciTuru || 1}
            baseUrl={selectedProvider?.baseUrl}
            apiKey={(selectedProvider as any)?.apiKey}
            providerId={selectedProvider?.id}
            options={availableModels}
            varsayilanModel={selectedProvider?.varsayilanModel}
            placeholder={t('model_seciniz', 'Model seçin veya arayın...')}
            showLiveFetchButton={!!selectedProvider?.id || !!selectedProvider?.apiKeyTanimliMi || selectedProvider?.saglayiciTuru === 4}
          />
        </div>

        {/* Sıcaklık (Temperature) */}
        <div className="ai-param-card">
          <div className="ai-param-header">
            <label className="ai-param-label">
              <Thermometer size={15} color="var(--accent-primary)" />
              <span>{t('sicaklik_ayar', 'Sıcaklık (Creativity)')}: <strong className="text-primary">{sicaklik}</strong></span>
            </label>
            <span className="ai-param-badge">
              {sicaklik <= 0.2 ? t('deterministik', 'Deterministik (Kesin)') : sicaklik <= 0.7 ? t('dengeli', 'Dengeli') : t('yaratici', 'Yaratıcı')}
            </span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={sicaklik}
            onChange={e => setSicaklik(parseFloat(e.target.value))}
            className="ai-param-slider"
          />
          <div className="ai-param-scale">
            <span>0.0 ({t('kesin_ve_odakli', 'Kesin & Odaklı')})</span>
            <span>0.7 ({t('varsayilan', 'Varsayılan')})</span>
            <span>1.0 ({t('yaratici', 'Yaratıcı')})</span>
          </div>
        </div>

        {/* Maksimum Token Sınırı */}
        <div className="ai-param-card">
          <label className="ai-param-label">
            <Zap size={15} color="var(--accent-primary)" />
            <span>{t('max_tokens_label', 'Maksimum Token Sınırı')}</span>
          </label>
          <TamsayiInput
            value={maxTokens}
            onChange={(e: any) => {
              const val = typeof e === 'number' ? e : e?.target?.value;
              setMaxTokens(Number(val) || 2048);
            }}
            placeholder="2048"
          />
          <div className="ai-param-hint">
            {t('max_tokens_ipucu', 'Yanıtın üretebileceği azami token (kelime/hece) adedi. Örn: 2048, 4096, 8192')}
          </div>
        </div>
      </div>
    </BasePopup>
  );
};

export default AiModelSelection;
