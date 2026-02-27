import api from "@/lib/api";

export const teacherService = {
    getClasses: async () => {
        const response = await api.get("/teacher/classes");
        return response.data;
    },

    createClass: async (data: { name: string; grade: string }) => {
        const response = await api.post("/teacher/classes", data);
        return response.data;
    },

    // Example AI generation call (can be expanded)
    generateQuiz: async (params: { topic: string; count: number; class_id: number; lang: string }) => {
        const response = await api.post("/generate/quiz", params);
        return response.data;
    },

    generateMath: async (params: { config: any; class_id: number; lang: string }) => {
        const response = await api.post("/generate/math", params);
        return response.data;
    }
};
