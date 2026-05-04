import React from "react";
import katex from "katex";

interface RichTextRendererProps {
  text: string;
  className?: string;
}

function renderLatex(latex: string, displayMode: boolean): React.ReactNode {
  try {
    const html = katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
    return (
      <span
        dangerouslySetInnerHTML={{ __html: html }}
        style={displayMode ? { display: "block", textAlign: "center", margin: "0.5em 0" } : undefined}
      />
    );
  } catch {
    return latex;
  }
}

// Split text into segments: LaTeX blocks, legacy [FRAC:n:d], and plain text.
// Handles: \(...\), \[...\], $$...$$, $...$ (single dollar only if looks like math)
function parseSegments(text: string): React.ReactNode[] {
  // Order matters — block before inline
  const pattern = /(\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\[FRAC:[^:]+:[^\]]+\])/g;

  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(<span key={key++}>{processPlainText(text.slice(last, match.index))}</span>);
    }

    const seg = match[0];

    if (seg.startsWith("\\[") && seg.endsWith("\\]")) {
      nodes.push(<span key={key++}>{renderLatex(seg.slice(2, -2).trim(), true)}</span>);
    } else if (seg.startsWith("\\(") && seg.endsWith("\\)")) {
      nodes.push(<span key={key++}>{renderLatex(seg.slice(2, -2).trim(), false)}</span>);
    } else if (seg.startsWith("$$") && seg.endsWith("$$")) {
      nodes.push(<span key={key++}>{renderLatex(seg.slice(2, -2).trim(), true)}</span>);
    } else if (seg.startsWith("$") && seg.endsWith("$")) {
      nodes.push(<span key={key++}>{renderLatex(seg.slice(1, -1).trim(), false)}</span>);
    } else if (seg.startsWith("[FRAC:")) {
      const parts = seg.slice(6, -1).split(":");
      if (parts.length === 2) {
        nodes.push(
          <span key={key++} className="math-fraction">
            <span className="math-num">{parts[0]}</span>
            <span className="math-den">{parts[1]}</span>
          </span>
        );
      } else {
        nodes.push(<span key={key++}>{seg}</span>);
      }
    }

    last = match.index + seg.length;
  }

  if (last < text.length) {
    nodes.push(<span key={key++}>{processPlainText(text.slice(last))}</span>);
  }

  return nodes;
}

// Handle plain-text math shortcuts: x^2 → x², * → ×
function processPlainText(str: string): React.ReactNode[] {
  const parts = str.split(/((?:[a-zA-Z0-9]|\([^)]+\))\^\d+)/g);
  return parts.map((part, i) => {
    const m = part.match(/^((?:[a-zA-Z0-9]|\([^)]+\)))\^(\d+)$/);
    if (m) {
      return (
        <React.Fragment key={i}>
          {m[1]}
          <sup>{m[2]}</sup>
        </React.Fragment>
      );
    }
    let s = part.replace(/\*/g, "×");
    s = s.replace(/(\d+)\s*\/\s*(\d+)/g, "$1 ÷ $2");
    s = s.replace(/\s\/\s/g, " ÷ ");
    return <React.Fragment key={i}>{s}</React.Fragment>;
  });
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ text, className = "" }) => {
  if (!text) return null;
  return <span className={`rich-text-renderer ${className}`}>{parseSegments(text)}</span>;
};
