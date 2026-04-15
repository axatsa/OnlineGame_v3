import api from "@/lib/api";

export const adminService = {
    // ── Teachers ──────────────────────────────────────────────
    getTeachers: async (skip: number, limit: number, search: string) => {
        const response = await api.get(`/admin/teachers?skip=${skip}&limit=${limit}&search=${search}`);
        return response.data;
    },

    createTeacher: async (data: { email: string; password: string; full_name: string; school?: string; phone?: string; tokens_limit?: number; plan?: string }) => {
        const response = await api.post("/admin/teachers", data);
        return response.data;
    },

    updateTeacher: async (id: number, data: { full_name?: string; email?: string; school?: string; phone?: string; tokens_limit?: number; plan?: string }) => {
        const response = await api.patch(`/admin/teachers/${id}`, data);
        return response.data;
    },

    toggleTeacherStatus: async (id: number) => {
        const response = await api.post(`/admin/teachers/${id}/toggle-status`);
        return response.data;
    },

    resetTeacherPassword: async (id: number, new_password: string) => {
        const response = await api.post(`/admin/teachers/${id}/reset-password`, { new_password });
        return response.data;
    },

    deleteTeacher: async (id: number) => {
        const response = await api.delete(`/admin/teachers/${id}`);
        return response.data;
    },

    impersonateUser: async (id: number) => {
        const response = await api.post(`/admin/impersonate/${id}`);
        return response.data;
    },

    bulkBlockTeachers: async (user_ids: number[]) => {
        const response = await api.post("/admin/teachers/bulk-block", { user_ids });
        return response.data;
    },

    bulkUnblockTeachers: async (user_ids: number[]) => {
        const response = await api.post("/admin/teachers/bulk-unblock", { user_ids });
        return response.data;
    },

    bulkDeleteTeachers: async (user_ids: number[]) => {
        const response = await api.post("/admin/teachers/bulk-delete", { user_ids });
        return response.data;
    },

    // ── Analytics ──────────────────────────────────────────────
    getAnalytics: async () => {
        const response = await api.get("/admin/analytics");
        return response.data;
    },

    // ── Organizations ─────────────────────────────────────────
    getOrganizations: async (skip: number, limit: number) => {
        const response = await api.get(`/admin/organizations?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    createOrganization: async (data: { name: string; contact_person: string; license_seats: number; expires_at: string; status: string }) => {
        const response = await api.post("/admin/organizations", data);
        return response.data;
    },

    updateOrganization: async (id: number, data: Partial<{ name: string; contact_person: string; license_seats: number; expires_at: string; status: string }>) => {
        const response = await api.put(`/admin/organizations/${id}`, data);
        return response.data;
    },

    deleteOrganization: async (id: number) => {
        const response = await api.delete(`/admin/organizations/${id}`);
        return response.data;
    },

    // ── Payments & Misc ───────────────────────────────────────
    getPayments: async (skip: number, limit: number) => {
        const response = await api.get(`/admin/payments?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    getAuditLogs: async (skip: number, limit: number) => {
        const response = await api.get(`/admin/audit-logs?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    getFinancials: async () => {
        const response = await api.get("/admin/financials");
        return response.data;
    },

    getOrgStats: async (orgId: number) => {
        const response = await api.get(`/admin/organizations/${orgId}/stats`);
        return response.data;
    },

    importCsv: async (orgId: number, formData: FormData) => {
        const response = await api.post(`/admin/organizations/${orgId}/import-csv`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    getOrgInvites: async (orgId: number) => {
        const response = await api.get(`/admin/organizations/${orgId}/invites`);
        return response.data;
    },

    createInvite: async (orgId: number, data: { max_uses: number }) => {
        const response = await api.post(`/admin/organizations/${orgId}/invites`, data);
        return response.data;
    },

    revokeInvite: async (inviteId: number) => {
        const response = await api.delete(`/admin/invites/${inviteId}`);
        return response.data;
    },

    // ── Settings ──────────────────────────────────────────────
    getSetting: async (key: string) => {
        const response = await api.get(`/admin/settings/${key}`);
        return response.data;
    },

    setSetting: async (key: string, value: string) => {
        const response = await api.post("/admin/settings", { key, value });
        return response.data;
    }
};
