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

    // 3. Başlıklar (###, ##, #)
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
      !rawLines[i].trim().startsWith('![')
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

// ─── ANA BİLEŞEN: AiMarkdownContent ──────────────────────────────────────────

export const AiMarkdownContent: React.FC<AiMarkdownContentProps> = ({ 
  content, 
  className = '', 
  baseKey = 'ai-md' 
}) => {
  if (!content) return null;

  // Fenced code blocks ```lang ... ``` ayır
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`ai-chat-formatted-text ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/);
          const lang = match ? match[1] || '' : '';
          const code = match ? match[2].trim() : part.slice(3, -3).trim();
          return <CodeBlockView key={`${baseKey}-code-${index}`} language={lang} code={code} />;
        }

        // Normal metin blokları (Markdown tablo, başlık, liste, kalın, italik, satır içi kod)
        return (
          <div key={`${baseKey}-block-${index}`} className="ai-chat-markdown-block">
            {renderMarkdownBlocks(part, `${baseKey}-${index}`)}
          </div>
        );
      })}
    </div>
  );
};

export default AiMarkdownContent;
