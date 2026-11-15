/**
 * @file RagIndexingWaitBanner.tsx
 * @description
 * @akalin/ai-assistants - ThinkPort / RAG-CHUNK-UZMANI dosya indeksleme sürecini
 * kullanıcıya canlı olarak bildiren ve indeksleme bitince kaldığı yerden devam bilgisini
 * gösteren durum kartı bileşeni.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Database,
  FileText,
  Sparkles
} from 'lucide-react';
import { RagIndexingWaitState, RagFileStatusItem } from '../types';
import '../styles/AiChatPanel.css';

export interface RagIndexingWaitBannerProps {
  state: RagIndexingWaitState | null;
  elapsedSeconds?: number;
  compact?: boolean;
}

const getStageLabel = (asama: string | undefined, t: any): string => {
  const key = (asama || '').trim().toLowerCase();
  switch (key) {
    case 'queued':
      return t('ai_rag_asama_queued', 'Sırada bekliyor');
    case 'extracting':
      return t('ai_rag_asama_extracting', 'Belge metni çıkarılıyor');
    case 'chunking_agent':
      return t('ai_rag_asama_chunking_agent', 'RAG-CHUNK-UZMANI bölümlüyor');
    case 'embedding':
      return t('ai_rag_asama_embedding', 'Vektör indeksi oluşturuluyor');
    case 'saving':
      return t('ai_rag_asama_saving', 'RAG tablolarına kaydediliyor');
    case 'indexed':
      return t('ai_rag_asama_indexed', 'İndekslendi');
    case 'failed':
      return t('ai_rag_asama_failed', 'İndeksleme başarısız');
    default:
      return t('ai_rag_asama_preparing', 'ThinkPort indekslemesi hazırlanıyor');
  }
};

const clampProgress = (file: RagFileStatusItem): number => {
  const val = Number(file.ilerlemeYuzdesi ?? 0);
  if (Number.isNaN(val)) return 0;
  return Math.max(0, Math.min(100, Math.round(val)));
};

export const RagIndexingWaitBanner: React.FC<RagIndexingWaitBannerProps> = ({
  state,
  elapsedSeconds,
  compact = false
}) => {
  const { t } = useTranslation();

  if (!state) return null;

  const isIndexing = state.phase === 'indexing';
  const isResuming = state.phase === 'resuming';
  const isFailed = state.phase === 'failed';

  const phaseClass = isFailed
    ? 'ai-rag-wait-failed'
    : isResuming
      ? 'ai-rag-wait-resuming'
      : 'ai-rag-wait-indexing';

  const titleText = isFailed
    ? t('ai_rag_indeks_hata_baslik', 'Dosya İndekslenemedi')
    : isResuming
      ? t('ai_rag_indeks_tamamlandi_baslik', 'İndeksleme Tamamlandı — İşleme Devam Ediliyor')
      : t('ai_rag_indeksleniyor_baslik', 'Dosya İndeksleme Aşamasında');

  const descText = isFailed
    ? state.message ||
      t(
        'ai_rag_indeks_hata_aciklama',
        'ThinkPort belge indekslemesi sırasında bir sorun oluştu.'
      )
    : isResuming
      ? t(
          'ai_rag_indeks_tamamlandi_aciklama',
          'Belge RAG veritabanına aktarıldı. İşleminiz kaldığı yerden otomatik olarak devam ediyor...'
        )
      : t(
          'ai_rag_indeksleniyor_aciklama',
          'Seçili belge ThinkPort gecikmesi / kuyruğu nedeniyle şu anda RAG veritabanına indeksleniyor. İndeksleme tamamlandığında işleminiz kaldığı yerden otomatik olarak devam edecektir.'
        );

  return (
    <div
      className={`ai-rag-wait-banner ${phaseClass} ${compact ? 'ai-rag-wait-compact' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="ai-rag-wait-header">
        <div className="ai-rag-wait-icon-wrap">
          {isFailed ? (
            <AlertTriangle size={16} />
          ) : isResuming ? (
            <CheckCircle2 size={16} />
          ) : (
            <Loader2 size={16} className="ai-rag-spin" />
          )}
        </div>
        <div className="ai-rag-wait-header-text">
          <div className="ai-rag-wait-title-row">
            <span className="ai-rag-wait-title">{titleText}</span>
            {typeof elapsedSeconds === 'number' && elapsedSeconds > 0 && isIndexing && (
              <span className="ai-rag-wait-elapsed">{elapsedSeconds}s</span>
            )}
          </div>
          <p className="ai-rag-wait-desc">{descText}</p>
        </div>
      </div>

      {Array.isArray(state.files) && state.files.length > 0 && (
        <div className="ai-rag-wait-files">
          {state.files.map((file) => {
            const pct = clampProgress(file);
            const stageLabel = getStageLabel(file.asama, t);
            return (
              <div key={file.bulutDosyaId} className="ai-rag-wait-file-row">
                <div className="ai-rag-wait-file-top">
                  <span className="ai-rag-wait-file-name" title={file.dosyaAdi}>
                    <FileText size={13} />
                    <span>{file.dosyaAdi || `#${file.bulutDosyaId}`}</span>
                  </span>
                  <div className="ai-rag-wait-badges">
                    {file.chunkingAgentKod && (
                      <span className="ai-rag-wait-chip">
                        <Sparkles size={11} />
                        <span>{file.chunkingAgentKod}</span>
                      </span>
                    )}
                    <span className="ai-rag-wait-stage-badge">
                      <Database size={11} />
                      <span>{stageLabel}</span>
                      {pct > 0 && <strong>%{pct}</strong>}
                    </span>
                  </div>
                </div>

                {!isFailed && (
                  <div className="ai-rag-wait-progress-track">
                    <div
                      className={`ai-rag-wait-progress-fill ${
                        pct <= 0 && isIndexing ? 'ai-rag-progress-indeterminate' : ''
                      }`}
                      style={pct > 0 ? { width: `${pct}%` } : undefined}
                    />
                  </div>
                )}

                {file.detayMesaji && (
                  <div className="ai-rag-wait-detail">{file.detayMesaji}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RagIndexingWaitBanner;
