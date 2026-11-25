/**
 * @file AiMarkdownContent.tsx
 * @description
 * @akalin/ai-assistants - Zengin Markdown, Tablo ve Kod Bloğu Formatlayıcı Bileşeni.
 * Hem BaseChatPage hem de AiChatPanel (çekmece/widget) içerisinde zengin HTML tabloları,
 * kod blokları (kopyalama özellikli), listeler, kalın/italik ve bağlantıları şık şekilde işler.
 */

import React, { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export interface AiMarkdownContentProps {
  content: string;
  className?: string;
  baseKey?: string | number;
}

// ─── KOD BLOĞU BİLEŞENİ (Syntax & Kopyalama) ─────────────────────────────────

export const CodeBlockView: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(t('auto_kod_panoya_kopyalandi', 'Kod panoya kopyalandı'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ai-chat-code-block-container">
      <div className="ai-chat-code-header">
        <span>{language || 'code'}</span>
        <button type="button" onClick={handleCopy} className="ai-chat-code-copy-btn">
          {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          <span>{copied ? t('auto_kopyalandi', 'Kopyalandı') : t('auto_kopyala', 'Kopyala')}</span>
        </button>
      </div>
      <pre className="ai-chat-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// ─── SATIR İÇİ (INLINE) MARKDOWN İŞLEYİCİ ─────────────────────────────────────

export const renderInlineMarkdown = (text: string): ReactNode => {
  if (!text) return null;

  // Görsel, bağlantı, inline kod, kalın, italik ve kalın-italik regexi
  const regex = /(!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|\*\*\*[^*]+\*\*\*|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Görsel: ![alt](url)
    const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1];
      const url = imgMatch[2];
      return (
        <a
          key={idx}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ai-chat-inline-image-wrapper"
          title={alt || undefined}
        >
          <img src={url} alt={alt} className="ai-chat-inline-image" loading="lazy" />
        </a>
      );
    }

    // Bağlantı: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const url = linkMatch[2];
      return (
        <a
          key={idx}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ai-chat-link"
        >
          {linkText}
        </a>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={idx} className="ai-chat-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return (
        <strong key={idx}>
          <em>{part.slice(3, -3)}</em>
        </strong>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={idx}>
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

// ─── BLOK MARKDOWN (TABLOLAR, BAŞLIKLAR, LİSTELER) İŞLEYİCİ ──────────────────

export const renderMarkdownBlocks = (text: string, baseKey: string | number = 0): ReactNode => {
  if (!text) return null;
  const rawLines = text.split('\n');
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Markdown Tabloları (| Başlık 1 | Başlık 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < rawLines.length) {
      const nextTrimmed = rawLines[i + 1].trim();
      const isSeparator = /^\|[\s\-:|]+\|$/.test(nextTrimmed);
      if (isSeparator) {
        const tableLines: string[] = [trimmed];
        i++; // ayraç satırı
        tableLines.push(nextTrimmed);
        i++;
        while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
          tableLines.push(rawLines[i].trim());
          i++;
        }

        const parseRow = (rowStr: string) => {
          const content = rowStr.replace(/^\|/, '').replace(/\|$/, '');
          return content.split('|').map(cell => cell.trim());
        };

        const headerCells = parseRow(tableLines[0]);
        const bodyRows = tableLines.slice(2).map(parseRow);

        elements.push(
          <div key={`table-${baseKey}-${i}`} className="ai-chat-table-wrapper">
            <table className="ai-chat-markdown-table">
              <thead>
                <tr>
                  {headerCells.map((cell, cIdx) => (
                    <th key={cIdx}>{renderInlineMarkdown(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{renderInlineMarkdown(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 2. Görsel Blokları (![alt](url))
    const imgBlockMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgBlockMatch) {
      const alt = imgBlockMatch[1];
      const url = imgBlockMatch[2];
      elements.push(
        <div key={`img-card-${baseKey}-${i}`} className="ai-chat-image-card">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img src={url} alt={alt} className="ai-chat-image" loading="lazy" />
          </a>
          {alt ? <span className="ai-chat-image-caption">{alt}</span> : null}
        </div>
      );
      i++;
      continue;
    }

    // 3. Başlıklar (####, ###, ##, #) ve Yatay Ayraç (--- / ***)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(<hr key={`hr-${baseKey}-${i}`} className="ai-chat-divider" />);
      i++;
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h6 key={`h4-${baseKey}-${i}`} className="ai-chat-heading-4">
          {renderInlineMarkdown(trimmed.slice(5))}
        </h6>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h5 key={`h3-${baseKey}-${i}`} className="ai-chat-heading-3">
          {renderInlineMarkdown(trimmed.slice(4))}
        </h5>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h4 key={`h2-${baseKey}-${i}`} className="ai-chat-heading-2">
          {renderInlineMarkdown(trimmed.slice(3))}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h3 key={`h1-${baseKey}-${i}`} className="ai-chat-heading-1">
          {renderInlineMarkdown(trimmed.slice(2))}
        </h3>
      );
      i++;
      continue;
    }

    // 4. Sırasız Madde Listesi (- veya *)
    if (/^[-*]\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < rawLines.length && /^[-*]\s+/.test(rawLines[i].trim())) {
        listItems.push(rawLines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${baseKey}-${i}`} className="ai-chat-list">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 5. Numaralı Liste (1., 2. ...)
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i].trim())) {
        listItems.push(rawLines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${baseKey}-${i}`} className="ai-chat-ordered-list">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 6. Alıntı Bloğu (> )
    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('> ')) {
        quoteLines.push(rawLines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <blockquote key={`quote-${baseKey}-${i}`} className="ai-chat-blockquote">
          {renderInlineMarkdown(quoteLines.join('\n'))}
        </blockquote>
      );
      continue;
    }

    // 7. Boş Satır
    if (!trimmed) {
      elements.push(<div key={`spacer-${baseKey}-${i}`} className="ai-chat-spacer" />);
      i++;
      continue;
    }

    // 8. Normal Paragraf Satırları
    const paragraphLines: string[] = [line];
    i++;
    while (
      i < rawLines.length &&
      rawLines[i].trim() &&
      !rawLines[i].trim().startsWith('#') &&
      !rawLines[i].trim().startsWith('|') &&
      !/^[-*]\s+/.test(rawLines[i].trim()) &&
      !/^\d+\.\s+/.test(rawLines[i].trim()) &&
      !rawLines[i].trim().startsWith('> ') &&
      !rawLines[i].trim().startsWith('![') &&
      !/^[-*_]{3,}$/.test(rawLines[i].trim())
    ) {
      paragraphLines.push(rawLines[i]);
      i++;
    }

    elements.push(
      <p key={`p-${baseKey}-${i}`} className="ai-chat-paragraph">
        {renderInlineMarkdown(paragraphLines.join('\n'))}
      </p>
    );
  }

  return <>{elements}</>;
};

// ─── AÇILIR / KAPANIR EKSTRA BİLGİ ALANI (Açıklama >) ─────────────────────────

export const CollapsibleExtraInfo: React.FC<{
  title: string;
  content: string;
  baseKey?: string | number;
  defaultExpanded?: boolean;
  isRawPre?: boolean;
  className?: string;
}> = ({
  title,
  content,
  baseKey = 'extra',
  defaultExpanded = false,
  isRawPre = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultExpanded);
  const cleanTitle = (title || '')
    .replace(/^\[+/, '')
    .replace(/\]+$/, '')
    .trim();

  if (!content || !content.trim()) return null;

  return (
    <div className={`ai-chat-collapsible-section ${isOpen ? 'open' : ''} ${className}`.trim()}>
      <button
        type="button"
        className="ai-chat-collapsible-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="ai-chat-collapsible-label">{cleanTitle}</span>
        <span className={`ai-chat-collapsible-chevron ${isOpen ? 'open' : ''}`}>{'>'}</span>
      </button>
      {isOpen && (
        <div className="ai-chat-collapsible-body">
          {isRawPre ? (
            <pre className="ai-thinking-code-block">
              <code>{content}</code>
            </pre>
          ) : (
            <AiMarkdownContent content={content} baseKey={`${baseKey}-body`} />
          )}
        </div>
      )}
    </div>
  );
};

// ─── LLM / WEB MODEL METİN NORMALLEŞTİRİCİSİ (ChatGPT Web vb.) ───────────────

const WEB_TRAILING_NOISE_PATTERNS: RegExp[] = [
  /\s*(?:[-•]\s*)?Worked\s+for\s+\d+\s*[smh]\b[\s\S]*$/i,
  /\s*(?:[-•]\s*)?ChatGPT\s+is\s+AI\s+and\s+can\s+make\s+mistakes[\s\S]*$/i,
  /\s*(?:[-•]\s*)?ChatGPT\s+can\s+make\s+mistakes[\s\S]*$/i,
  /\s*(?:[-•]\s*)?ChatGPT\s+hata\s+yapabilir[\s\S]*$/i,
  /\s*(?:[-•]\s*)?New\s+chat\s*(?:\n?[-•]?\s*)?Images\s*(?:\n?[-•]?\s*)?Shopping[\s\S]*$/i,
];

/**
 * Web arayüzlerinden (özellikle ChatGPT Web) yapışık/düz metin halinde gelmiş eski veya
 * ham yanıtları bileşen düzeyinde temiz Markdown (tablo, liste, paragraf) biçimine dönüştürür.
 * Zaten yapılandırılmış Markdown (tablo, kod bloğu, başlık/liste) içeren metinlere dokunmaz.
 */
export const normalizeStructuredMarkdown = (raw: string): string => {
  if (!raw) return '';
  let text = raw.replace(/\r\n/g, '\n').trim();

  // 1. Sızmış ChatGPT Web alt uyarı / kenar çubuğu kalıntılarını temizle
  for (const pat of WEB_TRAILING_NOISE_PATTERNS) {
    const match = text.match(pat);
    if (match && typeof match.index === 'number' && match.index > 20) {
      text = text.slice(0, match.index).trimEnd();
    }
  }

  // 2. Eski hatalı camelCase kırılmalarını onar (Örn: "Mc\n- Donald's" -> "McDonald's")
  text = text.replace(/\bMc\s*\n-\s*Donald/g, 'McDonald');

  // 3. Zaten gerçek Markdown tablosu, kod bloğu veya çok satırlı başlık/liste yapısı varsa koru
  const hasRealMarkdown =
    text.includes('```') ||
    /\n\|\s*[-:]+/.test(text) ||
    ((text.match(/\n/g) || []).length >= 4 && /(^|\n)(#{1,4}\s+|[-*]\s+|\d+\.\s+)/.test(text));
  if (hasRealMarkdown) {
    return text.replace(/\n{3,}/g, '\n\n').trim();
  }

  // 4. Tek blok yapışık Web yanıtlarını okunabilir paragraf, liste ve tablolara ayır
  // 4a. Yapışık numaralı tablo satırları: "1. Ofis temizliği$14–182. Otel oda temizliği$14–18"
  const gluedNumberedMatches = text.match(/\b\d+\.\s+[^\n]+?(?=\d+\.\s+|$)/g);
  if (gluedNumberedMatches && gluedNumberedMatches.length >= 3 && (text.match(/\n/g) || []).length <= 2) {
    // Sayısal madde geçişlerinden önce yeni satır aç: "...$14–182. Otel" veya "...Değişken6. Uber"
    text = text.replace(/([^\n\s])(\d{1,2}\.\s+[A-ZÇĞİÖŞÜ])/g, '$1\n$2');

    // Eğer satırların çoğunda fiyat/değer sütunu ($14–18, Değişken vb.) yapışıksa Markdown tablosuna dönüştür
    const lines = text.split('\n');
    const outLines: string[] = [];
    let tableBuffer: { item: string; value: string }[] = [];

    const flushTable = () => {
      if (tableBuffer.length >= 3) {
        outLines.push('');
        outLines.push('| Seçenek | Tahmini Değer / Not |');
        outLines.push('| --- | --- |');
        for (const row of tableBuffer) {
          outLines.push(`| ${row.item.replace(/\|/g, '/')} | ${row.value.replace(/\|/g, '/')} |`);
        }
        outLines.push('');
      } else {
        for (const row of tableBuffer) {
          outLines.push(`${row.item}${row.value ? ` — **${row.value}**` : ''}`);
        }
      }
      tableBuffer = [];
    };

    for (const ln of lines) {
      const t = ln.trim();
      const rowMatch = t.match(
        /^(\d{1,2}\.\s+.+?)(\$\d[\d.,\s–-]*|€\d[\d.,\s–-]*|₺\d[\d.,\s–-]*|Değişken|Variable)$/i
      );
      if (rowMatch) {
        tableBuffer.push({ item: rowMatch[1].trim(), value: rowMatch[2].trim() });
      } else {
        if (tableBuffer.length > 0) flushTable();
        outLines.push(t);
      }
    }
    if (tableBuffer.length > 0) flushTable();
    text = outLines.join('\n');
  }

  // 4b. Nokta/ünlem/soru sonrası boşluksuz yapışan cümle ve başlık geçişlerini ayır
  text = text.replace(/([.!?])(?=[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,})/g, '$1\n\n');

  // 4c. İki nokta sonrası yapışık liste/virgül maddelerini ayır: "...kullanarak:Catering...,Etkinlik..."
  text = text.replace(/:(?=[A-ZÇĞİÖŞÜ][a-zçğıöşü])/g, ':\n\n');
  text = text.replace(/,(?=[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,})/g, '\n- ');

  return text.replace(/\n{3,}/g, '\n\n').trim();
};

// ─── ANA BİLEŞEN: AiMarkdownContent ──────────────────────────────────────────

export const AiMarkdownContent: React.FC<AiMarkdownContentProps> = ({ 
  content, 
  className = '', 
  baseKey = 'ai-md' 
}) => {
  if (!content) return null;

  const normalizedContent = normalizeStructuredMarkdown(content);

  // 1. Önce :::details [Başlık]\n...\n::: açılır/kapanır ekstra bilgi bloklarını ayır
  const detailsBlocks = normalizedContent.split(/(:::details\s+[^\n]+\n[\s\S]*?:::)/g);

  return (
    <div className={`ai-chat-formatted-text ${className}`}>
      {detailsBlocks.map((segment, segIdx) => {
        if (!segment) return null;

        const detailsMatch = segment.match(/^:::details\s+([^\n]+)\n([\s\S]*?):::$/);
        if (detailsMatch) {
          const rawTitle = detailsMatch[1].trim();
          const innerBody = detailsMatch[2].trim();
          return (
            <CollapsibleExtraInfo
              key={`${baseKey}-details-${segIdx}`}
              title={rawTitle}
              content={innerBody}
              baseKey={`${baseKey}-d-${segIdx}`}
            />
          );
        }

        // 2. Normal metin içindeki Fenced code blocks ```lang ... ``` ayır
        const parts = segment.split(/(```[\s\S]*?```)/g);
        return (
          <React.Fragment key={`${baseKey}-seg-${segIdx}`}>
            {parts.map((part, index) => {
              if (!part) return null;
              if (part.startsWith('```') && part.endsWith('```')) {
                const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/);
                const lang = match ? match[1] || '' : '';
                const code = match ? match[2].trim() : part.slice(3, -3).trim();
                return (
                  <CodeBlockView
                    key={`${baseKey}-code-${segIdx}-${index}`}
                    language={lang}
                    code={code}
                  />
                );
              }

              // Normal metin blokları (Markdown tablo, başlık, liste, kalın, italik, satır içi kod)
              return (
                <div
                  key={`${baseKey}-block-${segIdx}-${index}`}
                  className="ai-chat-markdown-block"
                >
                  {renderMarkdownBlocks(part, `${baseKey}-${segIdx}-${index}`)}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default AiMarkdownContent;
