/**
 * @file ragIndexingWaiter.ts
 * @description
 * @akalin/ai-assistants - Bulut dosyalarının ThinkPort / RAG indeksleme durumunu takip eden
 * ve indeksleme tamamlandığında bekleyen sohbet işleminin kaldığı yerden otomatik olarak
 * devam etmesini sağlayan ortak yardımcı katman.
 */

import axios from 'axios';
import {
  RagDosyaDurumResponse,
  RagFileStatusItem,
  RagIndexingWaitState
} from '../types';

export interface ExtractCloudFileIdsInput {
  text?: string;
  attachments?: Array<{
    id?: string | number;
    bulutDosyaId?: string | number;
    cloudFileId?: string | number;
  }>;
  extraTexts?: Array<string | undefined | null>;
}

/**
 * Mesaj metninden, dosya eklerinden ve ek bağlam metinlerinden pozitif BulutDosyaId listesini çıkarır.
 */
export const extractCloudFileIds = (input: ExtractCloudFileIdsInput): number[] => {
  const seen = new Set<number>();
  const addId = (raw: string | number | undefined | null) => {
    if (raw === undefined || raw === null) return;
    const parsed = typeof raw === 'number' ? raw : parseInt(String(raw).trim(), 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      seen.add(parsed);
    }
  };

  if (Array.isArray(input.attachments)) {
    for (const att of input.attachments) {
      if (!att) continue;
      if (att.bulutDosyaId !== undefined && att.bulutDosyaId !== null) {
        addId(att.bulutDosyaId);
      } else if (att.cloudFileId !== undefined && att.cloudFileId !== null) {
        addId(att.cloudFileId);
      } else if (typeof att.id === 'number') {
        addId(att.id);
      }
    }
  }

  const scanText = (txt?: string | null) => {
    if (!txt || typeof txt !== 'string') return;
    const patterns = [
      /\(ID:\s*(\d+)\b/gi,
      /\bbulutDosyaId\b\s*["':=]+\s*(\d+)/gi,
      /\bcloudFileId\b\s*["':=]+\s*(\d+)/gi
    ];
    for (const regex of patterns) {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(txt)) !== null) {
        addId(match[1]);
      }
    }
  };

  scanText(input.text);
  if (Array.isArray(input.extraTexts)) {
    for (const extra of input.extraTexts) {
      scanText(extra);
    }
  }

  return Array.from(seen);
};

/**
 * API endpoint değerinden `/dosya-rag-durumu` uç noktasını türetir.
 */
export const resolveRagStatusEndpoint = (
  apiEndpoint?: string,
  explicitEndpoint?: string
): string => {
  if (explicitEndpoint && explicitEndpoint.trim()) {
    return explicitEndpoint.trim();
  }
  const clean = (apiEndpoint || '').trim().replace(/\/+$/, '');
  if (!clean) {
    return '/api/AiChat/dosya-rag-durumu';
  }
  if (/\/AiChat(\/.*)?$/i.test(clean)) {
    return clean.replace(/\/AiChat(\/.*)?$/i, '/AiChat/dosya-rag-durumu');
  }
  if (/\/AiAjanlar(\/.*)?$/i.test(clean)) {
    return clean.replace(/\/AiAjanlar(\/.*)?$/i, '/AiChat/dosya-rag-durumu');
  }
  const apiIdx = clean.toLowerCase().indexOf('/api/');
  if (apiIdx >= 0) {
    return `${clean.slice(0, apiIdx)}/api/AiChat/dosya-rag-durumu`;
  }
  return '/api/AiChat/dosya-rag-durumu';
};

/**
 * Verilen HTTP endpoint üzerinden bulut dosyalarının RAG indeksleme durumunu sorgular.
 */
export const checkRagStatusesViaEndpoint = async (
  endpoint: string,
  bulutDosyaIdleri: number[],
  options?: { otomatikBaslat?: boolean },
  signal?: AbortSignal,
  headers?: Record<string, string>
): Promise<RagDosyaDurumResponse> => {
  const res = await axios.post<RagDosyaDurumResponse>(
    endpoint,
    {
      bulutDosyaIdleri,
      otomatikBaslat: options?.otomatikBaslat ?? true
    },
    {
      headers,
      signal
    }
  );
  return res.data;
};

const createAbortError = (): Error => {
  const err = new Error('canceled');
  err.name = 'CanceledError';
  return err;
};

const sleepWithSignal = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timer = setTimeout(() => {
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      reject(createAbortError());
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });

const isTerminalNonBlockingFile = (file: RagFileStatusItem): boolean => {
  if (file.destekleniyorMu === false) return true;
  const durum = String(file.durum || '').toLowerCase();
  return durum === 'indexed' || durum === 'unsupported' || durum === 'not_found';
};

export interface WaitUntilCloudFilesRagReadyOptions {
  ids: number[];
  checkStatus: (
    ids: number[],
    options?: { otomatikBaslat?: boolean },
    signal?: AbortSignal
  ) => Promise<RagDosyaDurumResponse>;
  signal?: AbortSignal;
  onProgress?: (state: RagIndexingWaitState | null) => void;
  pollIntervalMs?: number;
  maxWaitMs?: number;
}

export interface WaitUntilCloudFilesRagReadyResult {
  ready: boolean;
  waited: boolean;
  failed: boolean;
  timedOut?: boolean;
  errorMessage?: string;
  response?: RagDosyaDurumResponse;
}

/**
 * Verilen BulutDosyaId listesi için tüm desteklenen dosyalar RAG'a indekslenene kadar yoklama yapar.
 * Zaten hazırsa bekletmeden ve arayüzde gereksiz uyarı göstermeden hemen döner.
 */
export const waitUntilCloudFilesRagReady = async ({
  ids,
  checkStatus,
  signal,
  onProgress,
  pollIntervalMs = 1500,
  maxWaitMs = 360000
}: WaitUntilCloudFilesRagReadyOptions): Promise<WaitUntilCloudFilesRagReadyResult> => {
  if (!ids || ids.length === 0) {
    return { ready: true, waited: false, failed: false };
  }

  const startedAt = Date.now();
  let waited = false;

  while (true) {
    if (signal?.aborted) {
      throw createAbortError();
    }

    let statusResp: RagDosyaDurumResponse | undefined;
    try {
      statusResp = await checkStatus(ids, { otomatikBaslat: true }, signal);
    } catch (err: any) {
      if (
        signal?.aborted ||
        axios.isCancel(err) ||
        err?.name === 'CanceledError' ||
        err?.name === 'AbortError' ||
        err?.code === 'ERR_CANCELED'
      ) {
        throw createAbortError();
      }
      // Durum endpoint'i geçici olarak erişilemezse sohbet akışını kilitlemeden devam et
      return { ready: true, waited, failed: false };
    }

    const files = Array.isArray(statusResp?.dosyalar) ? statusResp.dosyalar : [];
    const failedFiles = files.filter((f) => String(f.durum || '').toLowerCase() === 'failed');
    const pendingFiles = files.filter((f) => {
      const durum = String(f.durum || '').toLowerCase();
      return !isTerminalNonBlockingFile(f) && durum !== 'failed';
    });

    if (failedFiles.length > 0 || statusResp?.hataVarMi) {
      const firstErr =
        failedFiles.find((f) => f.detayMesaji)?.detayMesaji ||
        'Dosya RAG indeksleme aşamasında hata oluştu.';
      onProgress?.({
        phase: 'failed',
        files,
        message: firstErr,
        startedAt
      });
      return {
        ready: false,
        waited,
        failed: true,
        errorMessage: firstErr,
        response: statusResp
      };
    }

    const isReady =
      Boolean(statusResp?.tumDosyalarHazirMi) ||
      (!statusResp?.indeksleniyorMu && pendingFiles.length === 0);

    if (isReady) {
      if (waited) {
        onProgress?.({
          phase: 'resuming',
          files,
          startedAt
        });
      }
      return {
        ready: true,
        waited,
        failed: false,
        response: statusResp
      };
    }

    waited = true;
    const displayFiles = pendingFiles.length > 0 ? pendingFiles : files;
    onProgress?.({
      phase: 'indexing',
      files: displayFiles,
      startedAt
    });

    if (Date.now() - startedAt >= maxWaitMs) {
      const timeoutMsg =
        'ThinkPort dosya indekslemesi beklenen sürede tamamlanamadı. Lütfen birkaç saniye sonra tekrar deneyin.';
      onProgress?.({
        phase: 'failed',
        files,
        message: timeoutMsg,
        startedAt
      });
      return {
        ready: false,
        waited: true,
        failed: true,
        timedOut: true,
        errorMessage: timeoutMsg,
        response: statusResp
      };
    }

    await sleepWithSignal(pollIntervalMs, signal);
  }
};
