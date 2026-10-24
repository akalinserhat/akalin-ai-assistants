/**
 * @file AiChatAdapter.ts
 * @description
 * @akalin/ai-assistants - REST API ve İstemci Adaptör Katmanı.
 */

import axios from 'axios';
import { IAiChatAdapter, AiSession, AiMessage, AgentDefinition } from '../types';

export interface RestAiChatAdapterOptions {
  baseURL?: string;
  getToken?: () => string | null;
}

export function createRestAiChatAdapter(options?: RestAiChatAdapterOptions): IAiChatAdapter {
  const baseURL = (options?.baseURL || '/api/AiChat').replace(/\/$/, '');
  
  const getAuthHeaders = () => {
    const token = options?.getToken 
      ? options.getToken() 
      : (typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token')) : null);
    
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return {
    async getSessions(): Promise<AiSession[]> {
      const res = await axios.get(`${baseURL}/oturumlar`, {
        headers: getAuthHeaders()
      });
      return Array.isArray(res.data) ? res.data : [];
    },

    async createSession(title = 'Yeni Sohbet', agentId?: number | null): Promise<AiSession> {
      const res = await axios.post(`${baseURL}/oturumlar`, {
        baslik: title,
        aiAjanId: agentId
      }, {
        headers: getAuthHeaders()
      });
      return res.data;
    },

    async getMessages(sessionId: number): Promise<AiMessage[]> {
      const res = await axios.get(`${baseURL}/oturumlar/${sessionId}/mesajlar`, {
        headers: getAuthHeaders()
      });
      return Array.isArray(res.data) ? res.data : [];
    },

    async sendMessage(payload, signal?: AbortSignal) {
      const sessionId = payload.aiSohbetOturumuId ?? payload.oturumId;
      const requestPayload = {
        aiSohbetOturumuId: sessionId,
        oturumId: sessionId,
        mesaj: payload.mesaj,
        aiAjanId: payload.aiAjanId,
        sayfaBaglami: payload.sayfaBaglami,
        eylemVerisiJson: payload.eylemVerisiJson,
        dosyaIdleri: payload.dosyaIdleri
      };

      const res = await axios.post(`${baseURL}/mesaj-gonder`, requestPayload, {
        headers: getAuthHeaders(),
        signal
      });

      const data = res.data;
      const asistanMesaj = data?.asistanCevabi || data?.mesaj || data;

      return {
        oturumId: data?.oturumId ?? sessionId,
        oturumBaslik: data?.oturumBaslik,
        mesaj: asistanMesaj,
        asistanCevabi: asistanMesaj,
        kullaniciMesaji: data?.kullaniciMesaji,
        islemSuresiMs: data?.islemSuresiMs
      };
    },

    async deleteSession(sessionId: number): Promise<void> {
      await axios.delete(`${baseURL}/oturumlar/${sessionId}`, {
        headers: getAuthHeaders()
      });
    },

    async renameSession(sessionId: number, newTitle: string): Promise<void> {
      await axios.put(`${baseURL}/oturumlar/${sessionId}`, {
        baslik: newTitle.trim()
      }, {
        headers: getAuthHeaders()
      });
    },

    async getAgents(): Promise<AgentDefinition[]> {
      try {
        const ajanlarUrl = baseURL.endsWith('/AiChat') ? baseURL.replace(/\/AiChat$/, '/AiAjanlar') : `${baseURL}/ajanlar`;
        const res = await axios.get(ajanlarUrl, {
          headers: getAuthHeaders()
        });
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [];
      }
    }
  };
}
