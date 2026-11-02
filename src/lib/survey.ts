import { z } from "zod";
import { questions, roles, type ChoiceQuestion } from "@/content/survey";

export const MAX_TEXT = 2000;

const text = z.string().trim().max(MAX_TEXT).optional().default("");

export const submissionSchema = z
  .object({
    role: z.enum(roles, { errorMap: () => ({ message: "Please select your role." }) }),
    answers: z.record(z.string(), z.string().max(MAX_TEXT)),
    explanations: z.record(z.string(), text).optional().default({}),
    website: z.string().max(500).optional().default(""),
    startedAt: z.number().int(),
  })
  .superRefine((data, ctx) => {
    for (const q of questions) {
      if (q.managersOnly && data.role !== "Manager") continue;
      if (q.kind !== "choice") continue;
      const value = data.answers[q.id];
      if (!value || !q.options.includes(value)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["answers", q.id], message: "Please choose an option." });
      }
    }
  });

export type SubmissionInput = z.input<typeof submissionSchema>;
export type Submission = z.output<typeof submissionSchema>;

export const sheetColumns = [
  "Timestamp",
  "Submission ID",
  "Role",
  ...questions.flatMap((q) => ((q as ChoiceQuestion).explainOption ? [q.column, `${q.column} (explanation)`] : [q.column])),
];

/** Flattens a validated submission into values ordered like `sheetColumns` (minus Timestamp / Submission ID). */
export function toSheetValues(data: Submission) {
  const row: Record<string, string> = { Role: data.role };
  for (const q of questions) {
    const applies = !q.managersOnly || data.role === "Manager";
    row[q.column] = applies ? (data.answers[q.id] ?? "").trim() : "N/A";
    const explain = (q as ChoiceQuestion).explainOption;
    if (explain) row[`${q.column} (explanation)`] = applies ? (data.explanations[q.id] ?? "") : "";
  }
  return sheetColumns.slice(2).map((column) => row[column] ?? "");
}
