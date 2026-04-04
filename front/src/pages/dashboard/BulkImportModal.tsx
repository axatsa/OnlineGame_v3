import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, X, FileText, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { adminService } from "@/api/adminService";
import { saveAs } from "file-saver";

interface BulkImportModalProps {
  orgId: number;
  orgName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const BulkImportModal = ({ orgId, orgName, onClose, onSuccess }: BulkImportModalProps) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith(".csv")) {
        setFile(dropped);
        setError("");
      } else {
        setError("Пожалуйста, загрузите файл формата CSV");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await adminService.importCsv(orgId, formData);
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка при загрузке. Проверьте формат CSV.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadResults = () => {
    if (!result?.created) return;
    const bom = "\uFEFF";
    const csvContent = bom + ["Email", "Временный пароль"].join(",") + "\n" +
      result.created.map((u: any) => `"${u.email}","${u.temp_password}"`).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `passwords_${orgName}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="fixed inset-0 bg-foreground/40 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground font-sans">Импорт учителей (CSV)</h3>
            <p className="text-xs text-muted-foreground font-sans mt-1">Организация: {orgName}</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!result ? (
            <>
              <div
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors
                  ${isDragging ? "border-primary bg-primary/5" : file ? "border-success/50 bg-success/5" : "border-border hover:border-primary/50"}
                `}
                onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                {file ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-success" />
                    </div>
                    <p className="font-medium text-foreground font-sans">{file.name}</p>
                    <p className="text-xs text-muted-foreground font-sans mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-medium text-foreground font-sans">Нажмите или перетащите CSV файл</p>
                    <p className="text-xs text-muted-foreground font-sans mt-1">Формат: name,email</p>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-sans flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground font-sans text-lg">Импорт завершён</h4>
                  <p className="text-sm text-muted-foreground font-sans">
                    Создано: <span className="text-foreground font-bold">{result.created?.length || 0}</span>, 
                    Пропущено: {result.skipped?.length || 0}, 
                    Ошибок: {result.errors?.length || 0}
                  </p>
                </div>
              </div>

              {result.created?.length > 0 && (
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <h5 className="font-semibold text-yellow-700 font-sans flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Важно: сохраните пароли!
                  </h5>
                  <p className="text-xs text-yellow-700/80 font-sans mb-3">
                    Временные пароли сгенерированы автоматически. Они показаны только сейчас и не сохраняются в открытом виде.
                  </p>
                  <Button onClick={downloadResults} className="w-full font-sans rounded-xl gap-2 h-9 text-sm">
                    <Download className="w-4 h-4" /> Скачать CSV с паролями
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {!result && (
          <div className="p-5 border-t border-border flex justify-end gap-3 bg-muted/20">
            <Button variant="outline" className="font-sans rounded-xl px-5" onClick={onClose} disabled={isUploading}>
              Отмена
            </Button>
            <Button 
              className="font-sans rounded-xl px-6 gap-2" 
              disabled={!file || isUploading} 
              onClick={handleUpload}
            >
              {isUploading ? <span className="animate-pulse">Загрузка...</span> : "Начать импорт"}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BulkImportModal;
