import api from "@/lib/api";

export const adminService = {
    getTeachers: async (skip: number, limit: number, search: string) => {
        const response = await api.get(`/admin/teachers?skip=${skip}&limit=${limit}&search=${search}`);
        return response.data;
    },

    getAnalytics: async () => {
        const response = await api.get("/admin/analytics");
        return response.data;
    },

    getOrganizations: async (skip: number, limit: number) => {
        const response = await api.get(`/admin/organizations?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    getPayments: async (skip: number, limit: number) => {
        const response = await api.get(`/admin/payments?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    getAuditLogs: async (skip: number, limit: number) => {
        const response = await api.get(`/admin/audit-logs?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    getOrgStats: async (orgId: number) => {
        const response = await api.get(`/admin/organizations/${orgId}/stats`);
        return response.data;
    },

    importCsv: async (orgId: number, formData: FormData) => {
        const response = await api.post(`/admin/organizations/${orgId}/import-csv`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    }
};
