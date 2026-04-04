import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash, GripVertical, Check } from "lucide-react";

interface ResultEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "math" | "quiz" | "crossword" | "assignment";
  data: any;
  onSave: (newData: any) => void;
}

const ResultEditor = ({ open, onOpenChange, type, data, onSave }: ResultEditorProps) => {
  const [editData, setEditData] = useState<any>(JSON.parse(JSON.stringify(data)));

  const handleSave = () => {
    onSave(editData);
    onOpenChange(false);
  };

  const handleJsonEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setEditData(parsed);
    } catch (err) {
      // Allow temporary invalid JSON while typing, but this simple example uses textarea for complex types
    }
  };

  const renderMathEditor = () => {
    if (!Array.isArray(editData)) return null;

    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {editData.map((prob: any, idx: number) => (
          <div key={idx} className="flex gap-4 items-start p-3 bg-muted/30 border border-border rounded-xl">
            <span className="mt-2 text-muted-foreground cursor-grab"><GripVertical className="w-4 h-4" /></span>
            <div className="flex-1 space-y-2">
              <input 
                className="w-full bg-transparent border-b border-border outline-none font-mono text-sm pb-1 focus:border-primary"
                value={prob.q} 
                onChange={(e) => {
                  const newArray = [...editData];
                  newArray[idx].q = e.target.value;
                  setEditData(newArray);
                }} 
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Answer:</span>
                <input 
                  className="flex-1 bg-transparent border-b border-border outline-none font-mono text-sm pb-1 focus:border-success text-success"
                  value={prob.a} 
                  onChange={(e) => {
                    const newArray = [...editData];
                    newArray[idx].a = e.target.value;
                    setEditData(newArray);
                  }} 
                />
              </div>
            </div>
            <button 
              onClick={() => {
                const newArray = editData.filter((_, i) => i !== idx);
                setEditData(newArray);
              }}
              className="text-destructive/60 hover:text-destructive p-2"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        ))}
        <Button 
          variant="outline" 
          className="w-full border-dashed gap-2"
          onClick={() => setEditData([...editData, { q: "New Problem", a: "Answer" }])}
        >
          <Plus className="w-4 h-4" /> Добавить пример
        </Button>
      </div>
    );
  };

  const renderQuizEditor = () => {
    if (!Array.isArray(editData)) return null;

    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {editData.map((q: any, qIdx: number) => (
          <div key={qIdx} className="p-4 bg-muted/30 border border-border rounded-xl space-y-3 relative group">
            <button 
              onClick={() => {
                const newArray = editData.filter((_, i) => i !== qIdx);
                setEditData(newArray);
              }}
              className="absolute top-3 right-3 text-destructive/60 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash className="w-4 h-4" />
            </button>
            <textarea 
              className="w-full bg-transparent border-b border-border outline-none font-medium text-sm pb-1 focus:border-primary resize-none mt-1"
              value={q.q} 
              rows={2}
              onChange={(e) => {
                const newArray = [...editData];
                newArray[qIdx].q = e.target.value;
                setEditData(newArray);
              }} 
            />
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Варианты (Выберите правильный):</span>
              {q.options?.map((opt: string, optIdx: number) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                       const newArray = [...editData];
                       newArray[qIdx].a = opt; // Simplification: actual app might need full option update logic
                       setEditData(newArray);
                    }}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${q.a === opt ? 'bg-success border-success text-white' : 'border-muted-foreground'}`}
                  >
                    {q.a === opt && <Check className="w-3 h-3" />}
                  </button>
                  <input 
                    className={`flex-1 bg-transparent border-b outline-none text-sm pb-1 ${q.a === opt ? 'border-success text-success' : 'border-border'}`}
                    value={opt} 
                    onChange={(e) => {
                      const newArray = [...editData];
                      // Also update answer if this was the correct answer
                      if (newArray[qIdx].a === newArray[qIdx].options[optIdx]) {
                          newArray[qIdx].a = e.target.value;
                      }
                      newArray[qIdx].options[optIdx] = e.target.value;
                      setEditData(newArray);
                    }} 
                  />
                  <button 
                    onClick={() => {
                        const newArray = [...editData];
                        newArray[qIdx].options = newArray[qIdx].options.filter((_: any, i: number) => i !== optIdx);
                        setEditData(newArray);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 h-7 px-2 text-xs text-primary"
                onClick={() => {
                    const newArray = [...editData];
                    if(!newArray[qIdx].options) newArray[qIdx].options = [];
                    newArray[qIdx].options.push("New Option");
                    setEditData(newArray);
                }}
              >
                  <Plus className="w-3 h-3" /> Добавить вариант
              </Button>
            </div>
          </div>
        ))}
        <Button 
          variant="outline" 
          className="w-full border-dashed gap-2"
          onClick={() => setEditData([...editData, { q: "New Question", options: ["Option 1", "Option 2"], a: "Option 1" }])}
        >
          <Plus className="w-4 h-4" /> Добавить вопрос
        </Button>
      </div>
    );
  };

  const renderJsonFallback = () => (
    <textarea
      defaultValue={JSON.stringify(editData, null, 2)}
      onChange={handleJsonEdit}
      className="w-full h-80 p-3 rounded-xl border border-input bg-muted/20 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Редактирование: {type === "math" ? "Примеры" : type === "quiz" ? "Тест" : "Контент"}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {type === "math" ? renderMathEditor() : type === "quiz" ? renderQuizEditor() : renderJsonFallback()}
        </div>
        <DialogFooter className="bg-muted/30 -mx-6 -mb-6 px-6 py-4 rounded-b-xl border-t border-border mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-sans">
            Отмена
          </Button>
          <Button onClick={handleSave} className="rounded-xl font-sans bg-primary hover:bg-primary/90 text-white">
            Сохранить изменения
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResultEditor;
