import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Check, Loader2, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

interface ResourceQRCodeProps {
  logId: number;
  topic: string;
  generatorType?: string;
  content?: any;
}

export const ResourceQRCode = ({ logId, topic, generatorType, content }: ResourceQRCodeProps) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadedJson, setDownloadedJson] = useState(false);

  const shareUrl = `${window.location.origin}/share/${logId}`;

  const generateHtmlContent = (data: any, topic: string, type: string) => {
    const contentStr = typeof data === "string" ? data : JSON.stringify(data);
    let bodyContent = "";

    try {
      const parsed = JSON.parse(contentStr);
      if (Array.isArray(parsed)) {
        bodyContent = parsed.map((item: any, i: number) => `
          <div style="margin: 20px 0; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <p style="font-weight: bold; font-size: 16px; margin: 0 0 10px 0;">
              ${i + 1}. ${item.question || item.task || item.text || ""}
            </p>
            ${item.options ? `
              <ul style="margin: 10px 0; padding-left: 30px;">
                ${item.options.map((opt: string, j: number) => `
                  <li style="margin: 5px 0; color: #333;">${String.fromCharCode(65 + j)}. ${opt}</li>
                `).join("")}
              </ul>
            ` : ""}
            ${item.answer !== undefined ? `
              <p style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #f0f0f0; color: #27ae60; font-size: 14px; font-weight: 500;">
                Ответ: ${item.answer}
              </p>
            ` : ""}
          </div>
        `).join("");
      }
    } catch {
      bodyContent = `<pre style="white-space: pre-wrap; word-wrap: break-word;">${contentStr}</pre>`;
    }

    return `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${topic}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; }
          .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
          .type-badge { display: inline-block; background: #e0e7ff; color: #4f46e5; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 20px; margin-bottom: 12px; }
          .title { font-size: 32px; font-weight: bold; color: #1f2937; margin: 15px 0; }
          .date { color: #9ca3af; font-size: 14px; }
          .content { margin-top: 30px; line-height: 1.8; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="type-badge">${type}</div>
            <h1 class="title">${topic}</h1>
            <p class="date">${new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div class="content">
            ${bodyContent}
          </div>
          <div class="footer">
            <p>Создано с помощью ClassPlay · classplay.uz</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      const htmlContent = generateHtmlContent(content, topic, generatorType || "Материал");
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${topic || "материал"}.html`;
      a.click();
      URL.revokeObjectURL(url);

      setDownloaded(true);
      toast.success("Материал скачан!");
      setTimeout(() => setDownloaded(false), 3000);
    } catch (e) {
      toast.error("Ошибка при скачивании");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadJson = () => {
    setDownloadingJson(true);
    try {
      const jsonContent = typeof content === "string" ? content : JSON.stringify(content, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${topic || "материал"}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setDownloadedJson(true);
      toast.success("JSON скачан!");
      setTimeout(() => setDownloadedJson(false), 3000);
    } catch (e) {
      toast.error("Ошибка при скачивании JSON");
    } finally {
      setDownloadingJson(false);
    }
  };

  return (
    <div className="flex flex-col items-center bg-card border border-border p-6 rounded-2xl shadow-sm gap-4">
      <div className="text-center space-y-1">
        <h4 className="font-semibold text-foreground font-sans">Отсканируйте код</h4>
        <p className="text-xs text-muted-foreground font-sans max-w-[200px]">
          Отправьте ссылку ученику или отсканируйте на другом устройстве
        </p>
      </div>

      <div className="bg-white p-3 rounded-xl border border-border shadow-sm">
        <QRCodeSVG value={shareUrl} size={140} level="M" includeMargin={false} />
      </div>

      <div className="relative mt-2 w-full">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">ИЛИ</span>
        </div>
      </div>

      <div className="w-full space-y-2">
        <Button
          onClick={handleDownload}
          disabled={downloading || downloaded}
          className="w-full gap-2 rounded-xl font-sans bg-violet-600 hover:bg-violet-700 text-white"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : downloaded ? (
            <Check className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {downloaded ? "Скачано" : "Скачать сейчас"}
        </Button>

        <Button
          onClick={handleDownloadJson}
          disabled={downloadingJson || downloadedJson}
          variant="outline"
          className="w-full gap-2 rounded-xl font-sans"
        >
          {downloadingJson ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : downloadedJson ? (
            <Check className="w-4 h-4" />
          ) : (
            <Code className="w-4 h-4" />
          )}
          {downloadedJson ? "JSON скачан" : "Скачать JSON"}
        </Button>
      </div>
    </div>
  );
};
