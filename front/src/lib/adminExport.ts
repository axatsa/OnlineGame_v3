import { TFunction } from "react-i18next";
import { toast } from "sonner";
import { Teacher, Org, Payment, AuditLog } from "@/types/admin";

export const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
  const bom = "﻿";
  const csvContent = bom + [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportTeachersCSV = (teachers: Teacher[], t: TFunction) => {
  downloadCSV(
    `classplay_teachers_${new Date().toISOString().slice(0, 10)}.csv`,
    [t("exp_name"), t("exp_login"), t("exp_school"), t("exp_status"), t("exp_last_login"), t("exp_plan"), "Истекает", t("exp_tokens"), t("exp_ip")],
    teachers.map(t_ => [
      t_.name, t_.login, t_.school, t_.status, t_.lastLogin, t_.plan,
      t_.expires_at ? new Date(t_.expires_at).toLocaleDateString("ru-RU") : "—",
      String(t_.tokenUsage), t_.ip,
    ])
  );
};

export const exportOrgsCSV = (orgs: Org[], t: TFunction) => {
  downloadCSV(
    `classplay_organizations_${new Date().toISOString().slice(0, 10)}.csv`,
    [t("exp_org_name"), t("exp_contact"), "План", t("exp_seats_total"), t("exp_seats_used"), "Загрузка %", t("exp_expires"), t("exp_status")],
    orgs.map(o => {
      const plan = o.seats <= 10 ? "FREE" : o.seats <= 50 ? "PRO" : "SCHOOL";
      const pct = o.seats > 0 ? Math.round((o.used / o.seats) * 100) : 0;
      return [o.name, o.contact, plan, String(o.seats), String(o.used), `${pct}%`, o.expires, o.status];
    })
  );
};

export const exportAiUsageCSV = (teachers: Teacher[], t: TFunction) => {
  downloadCSV(
    `classplay_ai_usage_${new Date().toISOString().slice(0, 10)}.csv`,
    ["#", t("exp_teacher"), t("exp_school"), t("exp_ip"), t("exp_tokens_used"), t("exp_status")],
    [...teachers]
      .sort((a, b) => b.tokenUsage - a.tokenUsage)
      .map((t_, i) => [String(i + 1), t_.name, t_.school, t_.ip, String(t_.tokenUsage), t_.status])
  );
};

export const exportPaymentsCSV = (payments: Payment[], t: TFunction) => {
  downloadCSV(
    `classplay_payments_${new Date().toISOString().slice(0, 10)}.csv`,
    [t("exp_org_name"), t("exp_amount"), t("exp_currency"), t("exp_date"), t("exp_method"), t("exp_status"), t("exp_period")],
    payments.map(p => [p.org, String(p.amount), p.currency, p.date, p.method, p.status, p.period])
  );
};

export const exportTeachersDOCX = async (teachers: Teacher[], t: TFunction) => {
  try {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = await import("docx");
    const { saveAs } = await import("file-saver");
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Super Admin Report: Teachers List", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [t("exp_teacher_login"), t("exp_school"), t("exp_last_login"), t("exp_tokens"), t("exp_status"), t("exp_plan"), "Истекает"].map(h => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  shading: { fill: "f3f4f6" },
                }))
              }),
              ...teachers.map(t_ => new TableRow({
                children: [
                  `${t_.name} (@${t_.login})`, t_.school, t_.lastLogin,
                  t_.tokenUsage.toLocaleString(), t_.status, t_.plan,
                  t_.expires_at ? new Date(t_.expires_at).toLocaleDateString("ru-RU") : "—",
                ].map(v => new TableCell({ children: [new Paragraph({ text: v })] }))
              }))
            ]
          })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `teachers_report_${new Date().toISOString().slice(0, 10)}.docx`);
    toast.success("Teachers report DOCX downloaded!");
  } catch (e) { console.error(e); toast.error("DOCX failed"); }
};

export const exportOrgsDOCX = async (orgs: Org[], t: TFunction) => {
  try {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = await import("docx");
    const { saveAs } = await import("file-saver");
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Organizations Report", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [t("exp_org_name"), t("exp_contact"), "План", t("exp_seats_total"), "Загрузка", t("exp_expires"), t("exp_status")].map(h => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  shading: { fill: "f3f4f6" },
                }))
              }),
              ...orgs.map(o => {
                const plan = o.seats <= 10 ? "FREE" : o.seats <= 50 ? "PRO" : "SCHOOL";
                const pct = o.seats > 0 ? Math.round((o.used / o.seats) * 100) : 0;
                return new TableRow({
                  children: [
                    o.name, o.contact, plan, `${o.used}/${o.seats}`, `${pct}%`,
                    new Date(o.expires).toLocaleDateString("ru-RU"), o.status,
                  ].map(v => new TableCell({ children: [new Paragraph({ text: v })] }))
                });
              })
            ]
          })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `organizations_report_${new Date().toISOString().slice(0, 10)}.docx`);
    toast.success("Orgs report DOCX downloaded!");
  } catch (e) { console.error(e); toast.error("DOCX failed"); }
};

export const exportAiUsageDOCX = async (teachers: Teacher[], t: TFunction) => {
  try {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = await import("docx");
    const { saveAs } = await import("file-saver");
    const sorted = [...teachers].sort((a, b) => b.tokenUsage - a.tokenUsage);
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "AI Usage Report", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["#", t("exp_teacher"), t("exp_school"), t("exp_ip"), t("exp_tokens"), t("exp_status")].map(h => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  shading: { fill: "f3f4f6" },
                }))
              }),
              ...sorted.map((t_, i) => new TableRow({
                children: [
                  String(i + 1), t_.name, t_.school, t_.ip, t_.tokenUsage.toLocaleString(), t_.status,
                ].map(v => new TableCell({ children: [new Paragraph({ text: v })] }))
              }))
            ]
          })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `ai_usage_report_${new Date().toISOString().slice(0, 10)}.docx`);
    toast.success("AI Usage report DOCX downloaded!");
  } catch (e) { console.error(e); toast.error("DOCX failed"); }
};

export const exportPaymentsDOCX = async (payments: Payment[], t: TFunction) => {
  try {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = await import("docx");
    const { saveAs } = await import("file-saver");
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Payments History Report", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [t("exp_org_name"), t("exp_amount"), t("exp_date"), t("exp_method"), t("exp_status"), t("exp_period")].map(h => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  shading: { fill: "f3f4f6" },
                }))
              }),
              ...payments.map(p => new TableRow({
                children: [
                  p.org, `$${p.amount}`, new Date(p.date).toLocaleDateString("ru-RU"), p.method, p.status, p.period,
                ].map(v => new TableCell({ children: [new Paragraph({ text: v })] }))
              }))
            ]
          })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `payments_report_${new Date().toISOString().slice(0, 10)}.docx`);
    toast.success("Payments report DOCX downloaded!");
  } catch (e) { console.error(e); toast.error("DOCX failed"); }
};

export const exportAuditLogDOCX = async (logs: AuditLog[], t: TFunction) => {
  try {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = await import("docx");
    const { saveAs } = await import("file-saver");
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Audit Log Report", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [t("exp_action"), t("exp_target"), t("exp_time")].map(h => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  shading: { fill: "f3f4f6" },
                }))
              }),
              ...logs.map(l => new TableRow({
                children: [l.action, l.target, l.time].map(v => new TableCell({ children: [new Paragraph({ text: v })] }))
              }))
            ]
          })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `audit_log_${new Date().toISOString().slice(0, 10)}.docx`);
    toast.success("Audit Log DOCX downloaded!");
  } catch (e) { console.error(e); toast.error("DOCX failed"); }
};
