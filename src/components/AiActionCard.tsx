/**
 * @file AiActionCard.tsx
 * @description
 * @akalin/ai-assistants - Yapay Zeka Eylem ve ERP Kartı (AiActionCard) Bileşeni.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, CheckCircle2, ShoppingCart, Tag, ExternalLink, FileSpreadsheet, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { AiActionCardProps } from '../types';

const getDefaultRoute = (type?: string): string => {
  if (!type) return '/';
  const t = type.toLowerCase();
  if (t.includes('kampanya')) return '/kampanyalar/yeni';
  if (t.includes('fiyat')) return '/fiyat-listeleri/yeni';
  if (t.includes('siparis') && (t.includes('verilen') || t.includes('alis'))) return '/siparisler/verilen/yeni';
  if (t.includes('siparis')) return '/siparisler/alinan/yeni';
  if (t.includes('fatura') && (t.includes('alis') || t.includes('gelen'))) return '/faturalar/alis/yeni';
  if (t.includes('fatura')) return '/faturalar/satis/yeni';
  if (t.includes('irsaliye')) return '/irsaliyeler/yeni';
  if (t.includes('cari')) return '/cariler/yeni';
  if (t.includes('urun') || t.includes('hizmet')) return '/urun-ve-hizmetler/yeni';
  return '/';
};

export const AiActionCard: React.FC<AiActionCardProps> = ({ rawJson, onApply }) => {
  const navigate = useNavigate();

  let data: any = null;
  try {
    data = JSON.parse(rawJson);
  } catch {
    return null;
  }

  if (!data || typeof data !== 'object') return null;

  const eylemTipi = data.eylemTipi || data.actionType || data.action || 'BELGE_DOLDUR';
  const belgeTuru = data.belgeTuru || data.documentType || 'Belge';
  const isExcelImport = eylemTipi === 'EXCEL_IMPORT' || data.action === 'EXCEL_IMPORT';
  const isWaiting = data.durum === 'KULLANICI_BEKLENIYOR' || isExcelImport || eylemTipi === 'DOSYA_BEKLENIYOR' || eylemTipi === 'KULLANICI_BEKLENIYOR';
  const defaultRoute = isExcelImport 
    ? (belgeTuru.toLowerCase().includes('kampanya') ? '/kampanyalar/yeni/excel-import' : '/fiyat-listeleri/yeni/excel-import')
    : getDefaultRoute(belgeTuru);
  const targetUrl = data.yonlendirmeUrl || data.targetUrl || defaultRoute;
  const kalemSayisi = data.kalemler?.length || data.items?.length || 0;
  const kampanyaSayisi = data.kampanyalar?.length || data.content?.details?.length || 0;
  const isNavigation = eylemTipi === 'SAYFAYA_GIT' || eylemTipi === 'NAVIGASYON';

  const handleApply = () => {
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
      toast.success(data.basariMesaji || 'Excel içe aktarım ekranı açılıyor...');
    } else if (isNavigation && targetUrl) {
      navigate(targetUrl);
      toast.success(`${belgeTuru || 'İlgili'} sayfasına geçiş yapıldı.`);
    } else if (onApply) {
      onApply(data);
    } else if (targetUrl) {
      navigate(targetUrl, { state: { initialAiData: data } });
      toast.success(`${belgeTuru} verileri ilgili forma aktarıldı.`);
    } else {
      toast.success('İşlem tamamlandı.');
    }
  };

  const getHeaderIcon = () => {
    if (isExcelImport) return <FileSpreadsheet size={16} color="var(--accent-primary, #6366f1)" />;
    if (isNavigation) return <ExternalLink size={16} />;
    return <FileText size={16} />;
  };

  const badgeText = data.durum === 'KULLANICI_BEKLENIYOR' ? 'KULLANICI BEKLENİYOR' : (data.badge || eylemTipi);

  return (
    <div style={{
      marginTop: '12px',
      padding: '12px',
      borderRadius: '8px',
      border: isWaiting ? '1px solid var(--accent-primary, rgba(99, 102, 241, 0.4))' : '1px solid var(--border-color, #e2e8f0)',
      background: 'var(--bg-secondary, #f8fafc)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
          {getHeaderIcon()}
          <span>{data.baslik || data.title || (isExcelImport ? 'Excel / Belge İçe Aktarımı Bekleniyor' : `${belgeTuru} Taslağı`)}</span>
        </div>
        <span style={{
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '999px',
          background: isWaiting ? 'rgba(99, 102, 241, 0.12)' : 'var(--primary-color-10, rgba(59, 130, 246, 0.1))',
          color: isWaiting ? 'var(--accent-primary, #6366f1)' : 'var(--primary-color, #3b82f6)',
          fontWeight: 600
        }}>
          {badgeText}
        </span>
      </div>

      {(data.ozet || data.summary || data.aciklama) && (
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, #64748b)', lineHeight: '1.4' }}>
          {data.ozet || data.summary || data.aciklama}
        </p>
      )}

      {/* Hareketli Bekleme İlerleme Çubuğu (Animated Progress Bar) */}
      {isWaiting && (
        <div className="ai-action-card-progress">
          <div className="ai-action-card-progress-track">
            <div className="ai-action-card-progress-bar-moving" />
          </div>
          <div className="ai-action-card-progress-status">
            <span className="ai-pulse-dot" />
            <span>{data.beklemeMetni || 'Kullanıcının dosya seçimi / içe aktarımı bekleniyor...'}</span>
          </div>
        </div>
      )}

      {kalemSayisi > 0 && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShoppingCart size={13} />
          <span>{kalemSayisi} kalem ürün/hizmet tespit edildi</span>
        </div>
      )}

      {kampanyaSayisi > 0 && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Tag size={13} />
          <span>{kampanyaSayisi} kampanya kuralı çıkarıldı</span>
        </div>
      )}

      <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleApply}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            fontSize: '12.5px',
            fontWeight: 600,
            borderRadius: '6px',
            backgroundColor: isExcelImport ? 'var(--accent-primary, #6366f1)' : 'var(--primary-color, #3b82f6)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)'
          }}
        >
          {isExcelImport ? (
            <>
              <FileSpreadsheet size={14} />
              <span>{data.butonYazisi || 'Excel İçe Aktarımı Aç ve Dosya Seç'}</span>
            </>
          ) : isNavigation ? (
            <>
              <span>{data.butonYazisi || 'Sayfaya Git'}</span>
              <ArrowRight size={13} />
            </>
          ) : (
            <>
              <CheckCircle2 size={13} />
              <span>{data.butonYazisi || 'Forma Aktar'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AiActionCard;
