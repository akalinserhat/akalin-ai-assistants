/**
 * @file AiActionCard.tsx
 * @description
 * @akalin/ai-assistants - Yapay Zeka Eylem ve ERP Kartı (AiActionCard) Bileşeni.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, CheckCircle2, ShoppingCart, Tag, ExternalLink } from 'lucide-react';
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

  const eylemTipi = data.eylemTipi || data.actionType || 'BELGE_DOLDUR';
  const belgeTuru = data.belgeTuru || data.documentType || 'Belge';
  const targetUrl = data.yonlendirmeUrl || data.targetUrl || getDefaultRoute(belgeTuru);
  const kalemSayisi = data.kalemler?.length || data.items?.length || 0;
  const kampanyaSayisi = data.kampanyalar?.length || data.content?.details?.length || 0;
  const isNavigation = eylemTipi === 'SAYFAYA_GIT' || eylemTipi === 'NAVIGASYON';

  const handleApply = () => {
    if (isNavigation && targetUrl) {
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

  return (
    <div style={{
      marginTop: '12px',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid var(--border-color, #e2e8f0)',
      background: 'var(--bg-secondary, #f8fafc)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
          {isNavigation ? <ExternalLink size={16} /> : <FileText size={16} />}
          <span>{data.baslik || data.title || `${belgeTuru} Taslağı`}</span>
        </div>
        <span style={{
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '999px',
          background: 'var(--primary-color-10, rgba(59, 130, 246, 0.1))',
          color: 'var(--primary-color, #3b82f6)',
          fontWeight: 600
        }}>
          {eylemTipi}
        </span>
      </div>

      {(data.ozet || data.summary || data.aciklama) && (
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, #64748b)', lineHeight: '1.4' }}>
          {data.ozet || data.summary || data.aciklama}
        </p>
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
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: '6px',
            backgroundColor: 'var(--primary-color, #3b82f6)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {isNavigation ? (
            <>
              <span>Sayfaya Git</span>
              <ArrowRight size={13} />
            </>
          ) : (
            <>
              <CheckCircle2 size={13} />
              <span>Forma Aktar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AiActionCard;
