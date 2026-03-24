import api from "@/lib/api";

export const gamificationService = {
    getProfile: async () => {
        const response = await api.get("/gamification/profile");
        return response.data;
    },

    getDailyStats: async () => {
        const response = await api.get("/gamification/daily-stats");
        return response.data;
    },

    getLeaderboard: async () => {
        const response = await api.get("/gamification/leaderboard");
        return response.data;
    },

    completeActivity: async (activityType: string, activityId: string) => {
        const response = await api.post("/activity/complete", {
            activity_type: activityType,
            activity_id: activityId
        });
        return response.data;
    },

    getShopItems: async () => {
        const response = await api.get("/shop/items");
        return response.data;
    },

    purchaseItem: async (itemId: number) => {
        const response = await api.post("/shop/purchase", { item_id: itemId });
        return response.data;
    }
};
