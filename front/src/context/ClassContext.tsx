import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export type GradeLevel =
  | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11";

export interface ClassGroup {
  id: any; // Backend uses integer IDs, but frontend might expect string. Let's adjust.
  name: string;
  grade: GradeLevel;
  studentCount: number;
  description: string;
  createdAt: string; // ISO string from backend
}

interface ClassContextType {
  classes: ClassGroup[];
  activeClassId: string | number | null;
  activeClass: ClassGroup | null;
  setActiveClassId: (id: string | number) => void;
  addClass: (cls: Omit<ClassGroup, "id" | "createdAt">) => void;
  updateClass: (id: string | number, data: Partial<Omit<ClassGroup, "id" | "createdAt">>) => void;
  deleteClass: (id: string | number) => void;
  isLoading: boolean;
}

const ClassContext = createContext<ClassContextType | null>(null);

export function ClassProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [activeClassId, setActiveClassId] = useState<string | number | null>(null);

  // Fetch classes
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const res = await api.get("/classes/");
      return res.data.map((c: any) => ({
        ...c,
        studentCount: c.student_count, // Map snake_case to camelCase
        createdAt: c.created_at,
      }));
    },
  });

  // Set initial active class
  useEffect(() => {
    if (classes.length > 0 && !activeClassId) {
      setActiveClassId(classes[0].id);
    }
  }, [classes, activeClassId]);

  const activeClass = classes.find((c: ClassGroup) => c.id === activeClassId) ?? null;

  // Add Class Mutation
  const addMutation = useMutation({
    mutationFn: async (cls: Omit<ClassGroup, "id" | "createdAt">) => {
      // Map back to snake_case for backend
      const payload = {
        name: cls.name,
        grade: cls.grade,
        student_count: cls.studentCount,
        description: cls.description
      };
      return await api.post("/classes/", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class added successfully");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to add class");
    }
  });

  // Update Class Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number, data: any }) => {
      const payload = {
        ...data,
        student_count: data.studentCount
      };
      return await api.put(`/classes/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class updated");
    },
  });

  // Delete Class Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return await api.delete(`/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class deleted");
    },
  });

  const addClass = (cls: Omit<ClassGroup, "id" | "createdAt">) => {
    addMutation.mutate(cls);
  };

  const updateClass = (id: string | number, data: Partial<Omit<ClassGroup, "id" | "createdAt">>) => {
    updateMutation.mutate({ id, data });
  };

  const deleteClass = (id: string | number) => {
    deleteMutation.mutate(id);
  };

  return (
    <ClassContext.Provider
      value={{
        classes,
        activeClassId,
        activeClass,
        setActiveClassId,
        addClass,
        updateClass,
        deleteClass,
        isLoading
      }}
    >
      {children}
    </ClassContext.Provider>
  );
}

export function useClass() {
  const ctx = useContext(ClassContext);
  if (!ctx) throw new Error("useClass must be used inside ClassProvider");
  return ctx;
}
