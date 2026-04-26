import React, { useEffect, useState } from "react";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MaterialUpload, Material } from "@/components/MaterialUpload";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const PLAN_LIMITS: Record<string, number> = { free: 5, pro: 30, school: 100 };

export default function MaterialsPage() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Material[]>("/materials/"),
      api.get<{ plan: string }>("/subscription/me"),
    ])
      .then(([mRes, sRes]) => {
        setMaterials(mRes.data);
        setPlan(sRes.data.plan ?? "free");
      })
      .catch(() => toast.error("Не удалось загрузить данные"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Мои материалы</h1>
            <p className="text-sm text-muted-foreground">
              Загрузите учебники или конспекты — ИИ будет генерировать задания на их основе
            </p>
          </div>
        </div>

        {/* Why upload banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 flex gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-primary">Загрузите свои материалы</p>
            <p className="text-sm text-muted-foreground">
              Когда вы добавляете учебник или конспект, ИИ создаёт задания строго по вашей теме:
              использует именно те термины, примеры и факты, что есть в файле. Качество и точность
              генерации заметно выше, чем без материала.
            </p>
          </div>
        </div>

        {/* Upload widget */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <MaterialUpload
            materials={materials}
            onUploaded={(m) => setMaterials((prev) => [m, ...prev])}
            onDeleted={(id) => setMaterials((prev) => prev.filter((m) => m.id !== id))}
            planLimit={PLAN_LIMITS[plan] ?? 5}
          />
        )}

        {/* How to use */}
        <div className="rounded-xl bg-muted/50 px-4 py-4 space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Как использовать
          </p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Загрузите файл (PDF, DOCX или TXT) с вашим учебным материалом</li>
            <li>Откройте генератор заданий или любую игру</li>
            <li>В поле «Материал» выберите загруженный файл</li>
            <li>ИИ создаст задания именно по вашему контенту</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
