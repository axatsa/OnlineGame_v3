import { toast } from "sonner";
import type { CrosswordGrid } from "@/lib/crossword";

export function cleanMathForExport(text: string): string {
  if (!text) return "";
  return text
    // LaTeX display/inline delimiters
    .replace(/\\\[|\\\]|\\\(|\\\)/g, "")
    // \frac{a}{b} → a/b
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2")
    // \sqrt{x} → √(x)
    .replace(/\\sqrt\{([^}]*)\}/g, "√($1)")
    // \log_{n} or \log_n → log
    .replace(/\\log_\{?[^}\s]*\}?/g, "log")
    // subscripts _{x} or _x → remove
    .replace(/_\{[^}]*\}/g, "")
    .replace(/_([a-zA-Z0-9])/g, "")
    // superscripts ^{x} or ^x → keep number
    .replace(/\^\{([^}]*)\}/g, "^$1")
    // remaining LaTeX commands \word → remove
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, "")
    // legacy formats
    .replace(/\[FRAC:([^:]+):([^\]]+)\]/g, "$1/$2")
    .replace(/\*/g, "×")
    // collapse newlines and extra spaces
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export type GeneratorType = "math" | "crossword" | "quiz" | "assignment";

export interface AssignmentData {
  title: string;
  subject: string;
  grade: string;
  intro?: string;
  questions: Array<{
    num: number;
    text: string;
    options?: string[];
    answer: string;
  }>;
}

export interface QuizQuestion {
  q: string;
  a: string;
  options?: string[];
}

export interface MathProblem {
  q: string;
  a: string;
}

export interface DownloadDocxOptions {
  genType: GeneratorType;
  orgName: string;
  generatedProblems: MathProblem[];
  mathTopic: string;
  difficulty: string;
  quizData: QuizQuestion[];
  quizTopic: string;
  assignmentData: AssignmentData | null;
  crosswordData: CrosswordGrid | null;
  crosswordTopic: string;
}

export async function downloadDOCX(opts: DownloadDocxOptions): Promise<void> {
  const {
    genType, orgName,
    generatedProblems, mathTopic, difficulty,
    quizData, quizTopic,
    assignmentData,
    crosswordData, crosswordTopic,
  } = opts;

  try {
    toast.info("Generating DOCX... Please wait.");
    const docx = await import("docx");
    const { saveAs } = await import("file-saver");

    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, TableBorders, VerticalAlign } = docx;

    type DocxSection = Parameters<typeof Document>[0]["sections"][number];
    const sections: DocxSection[] = [];

    if (genType === "math" && generatedProblems.length > 0) {
      sections.push({
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
        },
        children: [
          new Paragraph({ text: orgName || "ClassPlay", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `${mathTopic} - ${difficulty}`, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
          new Paragraph({ text: "Name: _______________________ Date: ______________", spacing: { before: 200, after: 600 } }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TableBorders.NONE,
            rows: Array.from({ length: Math.ceil(generatedProblems.length / 2) }, (_, i) => {
              const p1 = generatedProblems[i * 2];
              const p2 = generatedProblems[i * 2 + 1];
              return new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: `${i * 2 + 1}) `, bold: true }),
                          new TextRun({ text: cleanMathForExport(p1.q) })
                        ],
                        spacing: { before: 200, after: 400 }
                      })
                    ]
                  }),
                  new TableCell({
                    children: p2 ? [
                      new Paragraph({
                        children: [
                          new TextRun({ text: `${i * 2 + 2}) `, bold: true }),
                          new TextRun({ text: cleanMathForExport(p2.q) })
                        ],
                        spacing: { before: 200, after: 400 }
                      })
                    ] : []
                  })
                ]
              });
            })
          }),

          new Paragraph({ text: "Answer Key", heading: HeadingLevel.HEADING_2, pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: Array.from({ length: Math.ceil(generatedProblems.length / 4) }, (_, i) => {
              return new TableRow({
                children: Array.from({ length: 4 }, (_, j) => {
                  const idx = i * 4 + j;
                  const p = generatedProblems[idx];
                  return new TableCell({
                    children: p ? [
                      new Paragraph({
                        children: [
                          new TextRun({ text: `${idx + 1}) `, bold: true, color: "666666" }),
                          new TextRun({ text: cleanMathForExport(p.a), bold: true })
                        ]
                      })
                    ] : []
                  });
                })
              });
            })
          })
        ]
      });
    } else if (genType === "quiz" && quizData.length > 0) {
      sections.push({
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
        },
        children: [
          new Paragraph({ text: orgName || "ClassPlay", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `Quiz: ${quizTopic}`, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
          new Paragraph({ text: "Name: _______________________ Date: ______________", spacing: { before: 200, after: 600 } }),

          ...quizData.flatMap((q, i) => {
            const options = q.options || [];
            const optionTable = new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: TableBorders.NONE,
              rows: Array.from({ length: Math.ceil(options.length / 2) }, (_, rowIdx) => {
                return new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: `[  ] ${options[rowIdx * 2]}`, indent: { left: 360 } })]
                    }),
                    new TableCell({
                      children: options[rowIdx * 2 + 1]
                        ? [new Paragraph({ text: `[  ] ${options[rowIdx * 2 + 1]}`, indent: { left: 360 } })]
                        : []
                    })
                  ]
                });
              })
            });

            return [
              new Paragraph({
                children: [
                  new TextRun({ text: `${i + 1}. `, bold: true }),
                  new TextRun({ text: cleanMathForExport(q.q) })
                ],
                spacing: { before: 200, after: 100 }
              }),
              optionTable
            ];
          }),

          new Paragraph({
            text: "✅ Answer Key (Teacher Copy)",
            heading: HeadingLevel.HEADING_2,
            pageBreakBefore: true,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: Array.from({ length: Math.ceil(quizData.length / 5) }, (_, i) => {
              return new TableRow({
                children: Array.from({ length: 5 }, (_, j) => {
                  const idx = i * 5 + j;
                  const q = quizData[idx];
                  return new TableCell({
                    children: q ? [
                      new Paragraph({
                        children: [
                          new TextRun({ text: `${idx + 1}) `, bold: true, color: "666666" }),
                          new TextRun({ text: cleanMathForExport(q.a), bold: true, color: "15803d" })
                        ],
                        alignment: AlignmentType.CENTER
                      })
                    ] : [],
                    shading: { fill: "f3f4f6" }
                  });
                })
              });
            })
          })
        ]
      });
    } else if (genType === "assignment" && assignmentData) {
      sections.push({
        properties: {},
        children: [
          new Paragraph({ text: orgName || "ClassPlay", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `${assignmentData.title}`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `${assignmentData.subject} • ${assignmentData.grade}`, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
          ...(assignmentData.intro ? [new Paragraph({ children: [new TextRun({ text: assignmentData.intro, italics: true })], spacing: { after: 400 } })] : []),
          new Paragraph({ text: "Name: _______________________ Date: ______________", spacing: { before: 200, after: 400 } }),
          ...assignmentData.questions.flatMap((q) => [
            new Paragraph({
              children: [
                new TextRun({ text: `${q.num}. `, bold: true }),
                new TextRun({ text: cleanMathForExport(q.text) })
              ],
              spacing: { before: 200, after: 100 }
            }),
            ...(q.options || []).map((opt: string) => new Paragraph({
              text: `[  ] ${opt}`,
              indent: { left: 720 }
            }))
          ]),
          new Paragraph({ text: "Answer Key", heading: HeadingLevel.HEADING_2, pageBreakBefore: true }),
          ...assignmentData.questions.map((q) => new Paragraph({
            text: `${q.num}) ${cleanMathForExport(q.answer?.split(")")[0] || q.answer)}`
          }))
        ]
      });
    } else if (genType === "crossword" && crosswordData) {
      const rows = crosswordData.grid.map((rowArr, r) => {
        return new TableRow({
          children: rowArr.map((cell, c) => {
            const wordStart = crosswordData.words.find(w => w.row === r && w.col === c);
            const cellPct = Math.floor(100 / crosswordData.width);
            return new TableCell({
              borders: {
                top: { style: cell ? BorderStyle.SINGLE : BorderStyle.NONE, size: cell ? 4 : 0, color: "000000" },
                bottom: { style: cell ? BorderStyle.SINGLE : BorderStyle.NONE, size: cell ? 4 : 0, color: "000000" },
                left: { style: cell ? BorderStyle.SINGLE : BorderStyle.NONE, size: cell ? 4 : 0, color: "000000" },
                right: { style: cell ? BorderStyle.SINGLE : BorderStyle.NONE, size: cell ? 4 : 0, color: "000000" }
              },
              width: { size: cellPct, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: wordStart ? `${wordStart.number}` : "",
                      size: 14,
                      bold: true,
                      color: "666666"
                    })
                  ],
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 0, after: 0 }
                })
              ],
              shading: { fill: "FFFFFF" },
              verticalAlign: VerticalAlign.TOP
            });
          })
        });
      });

      const acrossWords = crosswordData.words.filter(w => w.isAcross).sort((a, b) => a.number - b.number);
      const downWords = crosswordData.words.filter(w => !w.isAcross).sort((a, b) => a.number - b.number);

      sections.push({
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
        },
        children: [
          new Paragraph({
            text: orgName || "ClassPlay",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: `${crosswordTopic}`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 }
          }),
          new Table({
            rows: rows,
            alignment: AlignmentType.CENTER,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "", spacing: { before: 400 } }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TableBorders.NONE,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ text: "Across", heading: HeadingLevel.HEADING_3, spacing: { after: 100 } }),
                      ...acrossWords.map(w => new Paragraph({
                        children: [
                          new TextRun({ text: `${w.number}. `, bold: true, color: "000000" }),
                          new TextRun({ text: w.clue })
                        ],
                        spacing: { after: 80 }
                      }))
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ text: "Down", heading: HeadingLevel.HEADING_3, spacing: { after: 100 } }),
                      ...downWords.map(w => new Paragraph({
                        children: [
                          new TextRun({ text: `${w.number}. `, bold: true, color: "000000" }),
                          new TextRun({ text: w.clue })
                        ],
                        spacing: { after: 80 }
                      }))
                    ]
                  })
                ]
              })
            ]
          }),

          new Paragraph({
            text: "Answer Key",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            pageBreakBefore: true,
            spacing: { before: 400, after: 400 }
          }),
          new Table({
            alignment: AlignmentType.CENTER,
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: crosswordData.grid.map((rowArr) => new TableRow({
              children: rowArr.map((cell) => {
                const answerCellPct = Math.floor(100 / crosswordData.width);
                return new TableCell({
                  borders: {
                    top: { style: cell ? BorderStyle.SINGLE : BorderStyle.NONE, size: cell ? 4 : 0, color: "000000" },
                    bottom: { style: cell ? BorderStyle.SINGLE : BorderStyle.NONE, size: cell ? 4 : 0, color: "000000" },
                    left: { style: cell ? BorderStyle.SINGLE : BorderStyle.NONE, size: cell ? 4 : 0, color: "000000" },
                    right: { style: cell ? BorderStyle.SINGLE : BorderStyle.NONE, size: cell ? 4 : 0, color: "000000" }
                  },
                  width: { size: answerCellPct, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: cell || "", bold: true, size: 24 })
                      ],
                      alignment: AlignmentType.CENTER
                    })
                  ],
                  shading: { fill: "FFFFFF" }
                });
              })
            }))
          })
        ]
      });
    } else {
      toast.info("Nothing to export.");
      return;
    }

    const doc = new Document({
      creator: orgName || "ClassPlay",
      title: "Generated Content",
      description: "AI Generated Educational Material",
      sections: sections
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "generated-content.docx");

    toast.success("DOCX downloaded successfully!");
  } catch (e) {
    console.error("DOCX Generation failed", e);
    toast.error("Failed to generate DOCX");
  }
}
