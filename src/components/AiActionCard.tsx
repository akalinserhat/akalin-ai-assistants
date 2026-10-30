/**
 * @file AiActionCard.tsx
 * @description
 * @akalin/ai-assistants - Yapay Zeka Eylem, Onay/Seçim ve ERP Kartı (AiActionCard) Bileşeni.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  ArrowRight,
  CheckCircle2,
  ShoppingCart,
  Tag,
  ExternalLink,
  FileSpreadsheet,
  MapPin,
  Plus,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AiActionCardProps, AiActionOptionItem } from '../types';

const getDefaultRoute = (type?: string): string => {
  if (!type) return '/';
  const lower = type.toLowerCase();
  if (lower.includes('kampanya')) return '/kampanyalar/yeni';
  if (lower.includes('fiyat')) return '/fiyat-listeleri/yeni';
  if (lower.includes('siparis') && (lower.includes('verilen') || lower.includes('alis'))) return '/siparisler/verilen/yeni';
  if (lower.includes('siparis')) return '/siparisler/alinan/yeni';
  if (lower.includes('fatura') && (lower.includes('alis') || lower.includes('gelen'))) return '/faturalar/alis/yeni';
  if (lower.includes('fatura')) return '/faturalar/satis/yeni';
  if (lower.includes('irsaliye')) return '/irsaliyeler/yeni';
  if (lower.includes('cari')) return '/cariler/yeni';
  if (lower.includes('urun') || lower.includes('hizmet')) return '/urun-ve-hizmetler/yeni';
  return '/';
};

export const AiActionCard: React.FC<AiActionCardProps> = ({ rawJson, onApply, onSendChatReply }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const data = useMemo<any>(() => {
    try {
      const parsed = JSON.parse(rawJson);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }, [rawJson]);

  const secenekler: AiActionOptionItem[] = useMemo(() => {
    if (!data || !Array.isArray(data.secenekler)) return [];
    return data.secenekler;
  }, [data]);

  const [selectedOption, setSelectedOption] = useState<AiActionOptionItem | null>(() => {
    if (!secenekler || secenekler.length === 0) return null;
    return secenekler.find(opt => opt.varsayilanMi) || secenekler[0];
  });

  const [isResolved, setIsResolved] = useState<boolean>(false);
  const [isWaitingExternal, setIsWaitingExternal] = useState<boolean>(false);

  useEffect(() => {
    if (secenekler.length > 0 && !selectedOption) {
      setSelectedOption(secenekler.find(opt => opt.varsayilanMi) || secenekler[0]);
    }
  }, [secenekler, selectedOption]);

  useEffect(() => {
    if (!isWaitingExternal) return;

    const handleEntityUpdated = () => {
      setIsWaitingExternal(false);
      setIsResolved(true);
    };

    window.addEventListener('ai-entity-updated', handleEntityUpdated as EventListener);
    return () => {
      window.removeEventListener('ai-entity-updated', handleEntityUpdated as EventListener);
    };
  }, [isWaitingExternal]);

  if (!data) return null;

  const eylemTipi = data.eylemTipi || data.actionType || data.action || 'BELGE_DOLDUR';
  const belgeTuru = data.belgeTuru || data.documentType || t('Belge');
  const isApprovalOrSelection = eylemTipi === 'ONAY_ISTE' || eylemTipi === 'SECIM_ISTE';
  const isExcelImport = eylemTipi === 'EXCEL_IMPORT' || data.action === 'EXCEL_IMPORT';
  const isWaiting =
    isWaitingExternal ||
    data.durum === 'KULLANICI_BEKLENIYOR' ||
    isExcelImport ||
    eylemTipi === 'DOSYA_BEKLENIYOR' ||
    eylemTipi === 'KULLANICI_BEKLENIYOR';

  const defaultRoute = isExcelImport
    ? (belgeTuru.toLowerCase().includes('kampanya') ? '/kampanyalar/yeni/excel-import' : '/fiyat-listeleri/yeni/excel-import')
    : getDefaultRoute(belgeTuru);
  const targetUrl = data.yonlendirmeUrl || data.targetUrl || defaultRoute;
  const kalemSayisi = data.kalemler?.length || data.items?.length || 0;
  const kampanyaSayisi = data.kampanyalar?.length || data.content?.details?.length || 0;
  const isFormOpen = eylemTipi === 'FORM_AC' || eylemTipi === 'EKRAN_AC';
  const isNavigation = eylemTipi === 'SAYFAYA_GIT' || eylemTipi === 'NAVIGASYON' || isFormOpen;

  const handleApply = () => {
    const shouldWait = data.kayitBekle !== false;
    try {
      if (shouldWait) {
        const waitingPayload = data.waitingEntityPayload
          ? {
              ...data.waitingEntityPayload,
              timestamp: Date.now()
            }
          : {
              entityType: belgeTuru,
              targetUrl,
              timestamp: Date.now()
            };
        sessionStorage.setItem(
          'webakus_ai_waiting_entity',
          JSON.stringify(waitingPayload)
        );
        setIsWaitingExternal(true);
      }
    } catch {
      // ignore storage errors
    }

    if (isExcelImport) {
      window.dispatchEvent(new CustomEvent('ai-trigger-ui-action', {
        detail: {
          action: 'EXCEL_IMPORT',
          route: targetUrl,
          params: data.parametreler || data.uiParametreleriJson
        }
      }));
      if (targetUrl) {
        navigate(targetUrl, { state: { initialAiData: data, fromAiChat: true } });
      }
      toast.success(data.basariMesaji || t('Excel içe aktarım ekranı açılıyor...'));
    } else if (isFormOpen && targetUrl) {
      const originRoute = data.returnRoute || (typeof window !== 'undefined' ? window.location.pathname : '/');
      navigate(targetUrl, {
        state: {
          initialAiData: data,
          fromAiChat: true,
          returnRoute: originRoute
        }
      });
    } else if (isNavigation && targetUrl) {
      navigate(targetUrl, { state: { initialAiData: data, fromAiChat: true } });
      toast.success(t('İlgili sayfaya geçiş yapıldı.'));
    } else if (onApply) {
      onApply(data);
    } else if (targetUrl) {
      navigate(targetUrl, { state: { initialAiData: data, fromAiChat: true } });
      toast.success(t('Veriler ilgili forma aktarıldı.'));
    } else {
      toast.success(t('İşlem tamamlandı.'));
    }
  };

  const handleConfirmApproval = () => {
    if (isResolved || isWaitingExternal) return;
    setIsResolved(true);

    let replyMessage = data.onayYanitMesaji || t('Evet, onaylıyorum. İşlemi tamamla.');
    if (selectedOption) {
      if (selectedOption.yanitMesaji) {
        replyMessage = selectedOption.yanitMesaji;
      } else if (!data.onayYanitMesaji || (secenekler.length > 1 && selectedOption.id !== secenekler[0]?.id)) {
        const detailPart = selectedOption.detay || selectedOption.aciklama ? ` (${selectedOption.detay || selectedOption.aciklama})` : '';
        replyMessage = `Evet, mevcut kaydı (${selectedOption.baslik} - ID: ${selectedOption.id}${detailPart}) kullanabilirsin, işlemi tamamla.`;
      }
    }

    if (onSendChatReply) {
      onSendChatReply(replyMessage);
    }
  };

  const handleRejectAndOpenForm = () => {
    if (isResolved || isWaitingExternal) return;
    setIsWaitingExternal(true);

    try {
      sessionStorage.setItem(
        'webakus_ai_waiting_entity',
        JSON.stringify({
          entityType: data.belgeTuru || 'CariAdres',
          cariId: data.cariId,
          timestamp: Date.now()
        })
      );
    } catch {
      // ignore storage errors
    }

    const redTargetUrl = data.redYonlendirmeUrl || `/cariler/${data.cariId || 'yeni'}/adres?tip=2`;
    navigate(redTargetUrl, {
      state: {
        fromAiChat: true,
        activeTabId: 'iletisim',
        activeAdresTipi: 2
      }
    });
  };

  const getHeaderIcon = () => {
    if (isExcelImport) return <FileSpreadsheet size={16} className="ai-action-card-icon-accent" />;
    if (isApprovalOrSelection) return <MapPin size={16} className="ai-action-card-icon-accent" />;
    if (isNavigation) return <ExternalLink size={16} />;
    return <FileText size={16} />;
  };

  const badgeText = isResolved
    ? t('TAMAMLANDI')
    : isWaiting
      ? t('KULLANICI BEKLENİYOR')
      : (data.badge || eylemTipi);

  const cardStateClass = isResolved
    ? 'is-resolved'
    : isWaiting
      ? 'is-waiting'
      : isApprovalOrSelection
        ? 'is-approval'
        : '';

  const badgeStateClass = isResolved
    ? 'resolved'
    : isWaiting
      ? 'waiting'
      : '';

  return (
    <div className={`ai-action-card ${cardStateClass}`}>
      <div className="ai-action-card-header">
        <div className="ai-action-card-title-group">
          {getHeaderIcon()}
          <span>
            {data.baslik || data.title || (isExcelImport ? t('Excel / Belge İçe Aktarımı Bekleniyor') : `${belgeTuru} ${t('Taslağı')}`)}
          </span>
        </div>
        <span className={`ai-action-card-badge ${badgeStateClass}`}>
          {badgeText}
        </span>
      </div>

      {(data.ozet || data.summary || data.aciklama) && (
        <p className="ai-action-card-summary">
          {data.ozet || data.summary || data.aciklama}
        </p>
      )}

      {/* Seçenekler Listesi (Radyo / Kart Seçimi) */}
      {isApprovalOrSelection && secenekler.length > 0 && (
        <div className="ai-action-card-options">
          {secenekler.map((opt, idx) => {
            const isSelected = selectedOption?.id === opt.id;
            const isLocked = isResolved || isWaitingExternal;
            return (
              <label
                key={opt.id ?? idx}
                className={`ai-action-card-option-item ${isSelected ? 'selected' : ''} ${isLocked ? 'disabled' : ''}`}
                onClick={() => {
                  if (!isLocked) setSelectedOption(opt);
                }}
              >
                <input
                  type="radio"
                  name={`ai-option-${data.cariId || 'default'}`}
                  className="ai-action-card-option-radio"
                  checked={isSelected}
                  disabled={isLocked}
                  onChange={() => {
                    if (!isLocked) setSelectedOption(opt);
                  }}
                />
                <div className="ai-action-card-option-content">
                  <span className="ai-action-card-option-title">{opt.baslik}</span>
                  {(opt.detay || opt.aciklama) && (
                    <span className="ai-action-card-option-detail">{opt.detay || opt.aciklama}</span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* Hareketli Bekleme İlerleme Çubuğu (Animated Progress Bar) */}
      {isWaiting && (
        <div className="ai-action-card-progress">
          <div className="ai-action-card-progress-track">
            <div className="ai-action-card-progress-bar-moving" />
          </div>
          <div className="ai-action-card-progress-status">
            <span className="ai-pulse-dot" />
            <span>
              {data.beklemeMetni || t('Kullanıcının dosya seçimi / içe aktarımı bekleniyor...')}
            </span>
          </div>
        </div>
      )}

      {kalemSayisi > 0 && (
        <div className="ai-action-card-meta-row">
          <ShoppingCart size={13} />
          <span>{kalemSayisi} {t('kalem ürün/hizmet tespit edildi')}</span>
        </div>
      )}

      {kampanyaSayisi > 0 && (
        <div className="ai-action-card-meta-row">
          <Tag size={13} />
          <span>{kampanyaSayisi} {t('kampanya kuralı çıkarıldı')}</span>
        </div>
      )}

      {/* Onay / Seçim Modu Düğmeleri */}
      {isApprovalOrSelection ? (
        !isWaitingExternal && (
          isResolved ? (
            <div className="ai-action-card-resolved-note">
              <CheckCircle2 size={14} />
              <span>{t('Yanıtınız sohbete iletildi.')}</span>
            </div>
          ) : (
            <div className="ai-action-card-actions approval-actions">
              <button
                type="button"
                className="ai-action-card-btn-confirm"
                onClick={handleConfirmApproval}
                disabled={isResolved || isWaitingExternal}
              >
                <Check size={14} />
                <span>{data.onayButonYazisi || t('Evet, Bu Adresi Kullan')}</span>
              </button>
              <button
                type="button"
                className="ai-action-card-btn-reject"
                onClick={handleRejectAndOpenForm}
                disabled={isResolved || isWaitingExternal}
              >
                <Plus size={14} />
                <span>{data.redButonYazisi || t('Hayır, Cari Kartta Yeni Adres Tanımla')}</span>
              </button>
            </div>
          )
        )
      ) : (
        <div className="ai-action-card-actions">
          <button
            type="button"
            onClick={handleApply}
            className={`ai-action-card-btn ${isExcelImport || isFormOpen ? 'accent' : ''}`}
          >
            {isExcelImport ? (
              <>
                <FileSpreadsheet size={14} />
                <span>{data.butonYazisi || t('Excel İçe Aktarımı Aç ve Dosya Seç')}</span>
              </>
            ) : isFormOpen ? (
              <>
                <ExternalLink size={14} />
                <span>{data.butonYazisi || t('Ekranı Aç')}</span>
                <ArrowRight size={13} />
              </>
            ) : isNavigation ? (
              <>
                <span>{data.butonYazisi || t('Sayfaya Git')}</span>
                <ArrowRight size={13} />
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                <span>{data.butonYazisi || t('Forma Aktar')}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AiActionCard;
