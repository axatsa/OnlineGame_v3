import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileText, CheckCircle2, AlertTriangle, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { adminService } from "@/api/adminService";
import { saveAs } from "file-saver";
import Papa from "papaparse";

interface BulkImportModalProps {
  orgId: number;
  orgName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface PreviewRow {
  email: string;
  name: string;
}

const BulkImportModal = ({ orgId, orgName, onClose, onSuccess }: BulkImportModalProps) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
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

  const parseFile = (selectedFile: File) => {
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const formatted = data.map(row => ({
          email: row.email || row.Email || "",
          name: row.name || row.Name || row.full_name || ""
        })).filter(r => r.email);
        
        if (formatted.length === 0) {
          setError("Файл пуст или имеет неверный формат (нужны колонки name, email)");
        } else {
          setPreviewData(formatted);
          setFile(selectedFile);
          setError("");
        }
      },
      error: () => {
        setError("Ошибка при парсинге CSV файла");
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith(".csv")) {
        parseFile(dropped);
      } else {
        setError("Пожалуйста, загрузите файл формата CSV");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseFile(e.target.files[0]);
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
        className="bg-card border border-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div>
            <h3 className="font-bold text-foreground font-sans text-xl">Импорт учителей</h3>
            <p className="text-xs text-muted-foreground font-sans mt-1">Организация: {orgName}</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!result ? (
            <div className="space-y-6">
              {!file ? (
                <div
                  className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer
                    ${isDragging ? "border-primary bg-primary/5 shadow-inner scale-[0.99]" : "border-border hover:border-primary/50 hover:bg-muted/30"}
                  `}
                  onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground">Выберите CSV файл</h4>
                  <p className="text-sm text-muted-foreground font-sans mt-2 max-w-xs">
                    Колонки должны содержать: <code className="text-primary font-bold">name</code> и <code className="text-primary font-bold">email</code>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-primary" />
                      <div>
                        <p className="font-bold text-sm text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">Найдено записей: {previewData.length}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreviewData([]); }} className="text-destructive hover:bg-destructive/10 rounded-xl">
                      Сбросить
                    </Button>
                  </div>

                  <div className="border border-border rounded-2xl overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 border-b border-border text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Предварительный просмотр (первые 5)
                    </div>
                    <div className="divide-y divide-border">
                      {previewData.slice(0, 5).map((row, i) => (
                        <div key={i} className="px-4 py-3 flex items-center justify-between bg-card text-sm font-sans">
                          <span className="font-medium">{row.name || "—"}</span>
                          <span className="text-muted-foreground">{row.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-violet-500/5 rounded-2xl border border-violet-500/10">
                    <Info className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-violet-600/80 font-sans leading-relaxed">
                      Для каждого нового учителя будет автоматически создан аккаунт. 
                      После импорта вы сможете скачать файл с временными паролями.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm font-sans flex items-center gap-3 border border-destructive/10"
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h4 className="text-2xl font-bold text-foreground font-sans">Импорт успешно завершён</h4>
                <div className="grid grid-cols-3 gap-8 mt-8 w-full">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-success">{result.created?.length || 0}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Создано</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-muted-foreground">{result.skipped?.length || 0}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Пропущено</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-destructive">{result.errors?.length || 0}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Ошибки</p>
                  </div>
                </div>
              </div>

              {result.created?.length > 0 && (
                <div className="p-6 rounded-3xl bg-yellow-500/5 border border-yellow-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <KeyIcon className="w-20 h-20 text-yellow-600 rotate-12" />
                  </div>
                  <h5 className="font-bold text-yellow-700 font-sans flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5" /> Сохраните данные!
                  </h5>
                  <p className="text-sm text-yellow-700/80 font-sans mb-5 leading-relaxed relative z-10">
                    Временные пароли сгенерированы автоматически. Пожалуйста, скачайте их сейчас, 
                    так как они не сохраняются в системе после закрытия этого окна.
                  </p>
                  <Button onClick={downloadResults} className="w-full font-bold rounded-2xl gap-3 h-12 shadow-lg shadow-yellow-500/20 relative z-10">
                    <Download className="w-5 h-5" /> Скачать CSV с паролями
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/10">
          {!result ? (
            <>
              <Button variant="outline" className="font-sans rounded-2xl px-6 h-11" onClick={onClose} disabled={isUploading}>
                Отмена
              </Button>
              <Button 
                className="font-bold rounded-2xl px-8 h-11 gap-2 shadow-lg shadow-primary/20" 
                disabled={!file || isUploading} 
                onClick={handleUpload}
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Начать импорт"}
              </Button>
            </>
          ) : (
            <Button className="font-bold rounded-2xl px-10 h-11" onClick={onClose}>
              Закрыть
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Internal icon for the "Save passwords" section
const KeyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default BulkImportModal;
