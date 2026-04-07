import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Mail, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

interface ResourceQRCodeProps {
  logId: number;
  topic: string;
}

export const ResourceQRCode = ({ logId, topic }: ResourceQRCodeProps) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Example URL to render or download the resource
  const shareUrl = `${window.location.origin}/share/${logId}`;

  const handleSendEmail = async () => {
    setSending(true);
    try {
      await api.post(`/generate/history/${logId}/send-email`);
      setSent(true);
      toast.success("Письмо успешно отправлено!");
      setTimeout(() => setSent(false), 3000);
    } catch (e) {
      toast.error("Не удалось отправить письмо");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center bg-card border border-border p-6 rounded-2xl shadow-sm gap-4">
      <div className="text-center space-y-1">
        <h4 className="font-semibold text-foreground font-sans">Отсканируйте код</h4>
        <p className="text-xs text-muted-foreground font-sans max-w-[200px]">
          Откройте на телефоне, чтобы сохранить материал
        </p>
      </div>
      
      <div className="bg-white p-3 rounded-xl border border-border shadow-sm">
        <QRCodeSVG value={shareUrl} size={140} level="M" includeMargin={false} />
      </div>

      <div className="relative mt-2 w-full">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">ИЛИ</span>
        </div>
      </div>

      <Button
        onClick={handleSendEmail}
        disabled={sending || sent}
        className="w-full gap-2 rounded-xl font-sans bg-violet-600 hover:bg-violet-700 text-white"
      >
        {sending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : sent ? (
          <Check className="w-4 h-4" />
        ) : (
          <Mail className="w-4 h-4" />
        )}
        {sent ? "Отправлено" : "Отправить на Email"}
      </Button>
    </div>
  );
};
