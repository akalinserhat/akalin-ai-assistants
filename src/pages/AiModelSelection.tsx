/**
 * @file AiModelSelection.tsx
 * @description
 * @akalin/ai-assistants - AI Model ve Parametre Yapılandırma Modal Bileşeni
 * BasePopup temel sınıfından türetilmiştir.
 * ThinkPort AI Gateway üzerinden sunulan modellerin seçimi ve parametre ayarlarını yönetir.
 * 
 * Sorumlulukları:
 * - ThinkPort merkezi sağlayıcı üzerinden model seçimi veya girişi (YZModelSecici)
 * - Sıcaklık (Temperature / Creativity) parametre ayarı (BaseNumericInput & Rozet)
 * - Maksimum Token Sınırı (Max Tokens) parametre ayarı (TamsayiInput)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Cpu, Zap, Thermometer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { 
  BasePopup, 
  YZModelSecici, 
  BaseNumericInput,
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

export const AiModelSelection: React.FC<AiModelSelectionProps> = ({
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

  // Modal açıldığında veya initialData değiştiğinde formu doldur (ThinkPort sağlayıcısına otomatik bağla)
  useEffect(() => {
    if (isOpen) {
      const defaultProv = providers[0];
      const defaultProvId = defaultProv?.id ? String(defaultProv.id) : '';
      if (initialData) {
        setAiSaglayiciId(initialData.aiSaglayiciId ? String(initialData.aiSaglayiciId) : defaultProvId);
        setModelAdi(initialData.modelAdi || '');
        setSicaklik(initialData.sicaklik !== undefined ? initialData.sicaklik : 0.7);
        setMaxTokens(initialData.maxTokens !== undefined ? initialData.maxTokens : 2048);
      } else {
        setAiSaglayiciId(defaultProvId);
        setModelAdi(defaultProv?.varsayilanModel || defaultProv?.desteklenenModeller?.[0] || '');
        setSicaklik(0.7);
        setMaxTokens(2048);
      }
    }
  }, [isOpen, initialData, providers]);

  // Seçili sağlayıcı nesnesi (Varsayılan olarak ThinkPort - providers[0])
  const selectedProvider = useMemo(() => {
    if (aiSaglayiciId) {
      const found = providers.find(p => String(p.id) === String(aiSaglayiciId));
      if (found) return found;
    }
    return providers[0] || null;
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
    if (!modelAdi.trim()) {
      toast.error(t('lutfen_model_secin', 'Lütfen bir model seçiniz veya yazınız.'));
      return;
    }

    const resolvedProviderId = selectedProvider?.id || aiSaglayiciId || null;

    onSave({
      id: initialData?.id || `${modelAdi.trim()}-${Date.now()}`,
      aiSaglayiciId: resolvedProviderId ? (Number(resolvedProviderId) || resolvedProviderId) : null,
      saglayiciAdi: selectedProvider?.ad || 'ThinkPort API',
      modelAdi: modelAdi.trim(),
      sicaklik: Math.min(1, Math.max(0, Number(sicaklik) || 0.7)),
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
            baseUrl={selectedProvider?.baseUrl || 'http://localhost:8000/v1'}
            apiKey={(selectedProvider as any)?.apiKey}
            providerId={selectedProvider?.id}
            options={availableModels}
            varsayilanModel={selectedProvider?.varsayilanModel}
            placeholder={t('model_seciniz', 'Model seçin veya arayın...')}
            showLiveFetchButton={true}
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
          <BaseNumericInput
            value={sicaklik}
            decimalScale={2}
            allowNegative={false}
            onChange={e => {
              const raw = Number(e?.target?.value ?? 0.7);
              const clamped = Math.min(1, Math.max(0, isNaN(raw) ? 0.7 : raw));
              setSicaklik(clamped);
            }}
            placeholder="0,70"
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
