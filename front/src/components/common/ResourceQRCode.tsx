import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Check, Loader2, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { cleanMathForExport } from "@/lib/generatorExport";
import { saveAs } from "file-saver";

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

  const generateDocxContent = async (data: any, topic: string, type: string) => {
    const contentStr = typeof data === "string" ? data : JSON.stringify(data);
    const paragraphs: any[] = [];

    // Title
    paragraphs.push(
      new Paragraph({
        text: topic,
        heading: "Heading1",
        bold: true,
        size: 32,
      })
    );

    // Type and Date
    paragraphs.push(
      new Paragraph({
        text: `${type} • ${new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}`,
        italics: true,
        color: "666666",
        spacing: { after: 400 },
      })
    );

    try {
      const parsed = JSON.parse(contentStr);

      // Normalize: handle { problems: [...] }, { questions: [...] }, or top-level array
      const items: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.problems)
          ? parsed.problems
          : Array.isArray(parsed.questions)
            ? parsed.questions
            : [];

      if (items.length > 0) {
        items.forEach((item: any, i: number) => {
          // Question/Task
          const questionText = cleanMathForExport(item.question || item.q || item.task || item.text || "");
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${i + 1}. `, bold: true }),
                new TextRun({ text: questionText }),
              ],
              spacing: { after: 200 },
            })
          );

          // Options
          if (item.options && Array.isArray(item.options)) {
            item.options.forEach((opt: string, j: number) => {
              paragraphs.push(
                new Paragraph({
                  text: `${String.fromCharCode(65 + j)}. ${cleanMathForExport(opt)}`,
                  spacing: { after: 100 },
                  indent: { left: 720 },
                })
              );
            });
          }

          // Answer
          const answerText = item.answer ?? item.a;
          if (answerText !== undefined) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({ text: "Ответ: ", bold: true, color: "27ae60" }),
                  new TextRun({ text: cleanMathForExport(String(answerText)), bold: true, color: "27ae60" }),
                ],
                spacing: { after: 300 },
                indent: { left: 720 },
              })
            );
          }

          paragraphs.push(new Paragraph({ text: "", spacing: { after: 200 } }));
        });
      }
    } catch {
      paragraphs.push(
        new Paragraph({
          text: contentStr,
          spacing: { after: 200 },
        })
      );
    }

    // Footer
    paragraphs.push(
      new Paragraph({
        text: "Создано с помощью ClassPlay · classplay.uz",
        italics: true,
        color: "999999",
        spacing: { before: 400 },
        alignment: AlignmentType.CENTER,
      })
    );

    const doc = new Document({ sections: [{ children: paragraphs }] });
    return doc;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const doc = await generateDocxContent(content, topic, generatorType || "Материал");
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${topic || "материал"}.docx`);

      setDownloaded(true);
      toast.success("Материал скачан!");
      setTimeout(() => setDownloaded(false), 3000);
    } catch (e) {
      console.error(e);
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
          {downloaded ? "Скачано" : "Скачать .docx"}
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
