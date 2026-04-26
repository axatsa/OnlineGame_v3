import React, { useCallback, useState } from "react";
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export interface Material {
  id: number;
  filename: string;
  file_type: string;
  char_count: number;
  created_at: string;
}

interface Props {
  materials: Material[];
  onUploaded: (m: Material) => void;
  onDeleted: (id: number) => void;
  planLimit: number;
}

const FILE_TYPE_ICON: Record<string, string> = { pdf: "📕", docx: "📘", txt: "📄" };

export function MaterialUpload({ materials, onUploaded, onDeleted, planLimit }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext ?? "")) {
      toast.error("Разрешены только PDF, DOCX, TXT");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл слишком большой. Максимум 5 МБ");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post<Material>("/materials/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(data);
      toast.success(`«${data.filename}» загружен`);
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string | { message?: string } } } })?.response?.data?.detail;
      const msg = typeof detail === "object" ? detail?.message : detail;
      toast.error(msg ?? "Ошибка при загрузке файла");
    } finally {
      setUploading(false);
    }
  }, [onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }, [upload]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/materials/${id}`);
      onDeleted(id);
      toast.success("Материал удалён");
    } catch {
      toast.error("Не удалось удалить");
    }
  };

  const used = materials.length;
  const full = used >= planLimit;

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      <label
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 cursor-pointer transition-colors
          ${full ? "opacity-50 cursor-not-allowed border-muted" : dragOver ? "border-primary bg-primary/5" : "border-muted hover:border-primary hover:bg-primary/5"}`}
        onDragOver={(e) => { e.preventDefault(); if (!full) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={full ? undefined : handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          disabled={full || uploading}
          onChange={handleInput}
        />
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground" />
        )}
        <p className="text-sm font-medium text-center">
          {full
            ? `Лимит файлов (${planLimit}) достигнут`
            : uploading
            ? "Обрабатывается..."
            : "Перетащите файл или нажмите для выбора"}
        </p>
        <p className="text-xs text-muted-foreground">PDF, DOCX, TXT · до 5 МБ</p>
        <p className="text-xs text-muted-foreground">{used}/{planLimit} файлов использовано</p>
      </label>

      {/* Improvement hint */}
      {materials.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2.5">
          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-400">
            Загруженные материалы улучшают качество генерации — ИИ использует ваш контент как основной источник.
          </p>
        </div>
      )}

      {/* Materials list */}
      {materials.length > 0 && (
        <ul className="space-y-1.5">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-base">{FILE_TYPE_ICON[m.file_type] ?? "📄"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {(m.char_count / 1000).toFixed(1)}k символов
                </p>
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
