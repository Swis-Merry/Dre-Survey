"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { roles, survey, visibleQuestions, type ChoiceQuestion, type Question, type Role } from "@/content/survey";
import { MAX_TEXT } from "@/lib/survey";

type Status = "idle" | "submitting" | "success" | "error";

const ease = [0.22, 1, 0.36, 1] as const;

export function SurveyForm() {
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [role, setRole] = useState<Role | "">("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const startedAt = useRef(0);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const shown = visibleQuestions(role);
  const total = shown.length + 2;
  const answered = (anonymous || name.trim() ? 1 : 0) + (role ? 1 : 0) + shown.filter((q) => (answers[q.id] ?? "").trim()).length;
  const progress = Math.round((answered / total) * 100);

  function setAnswer(id: string, value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
    setErrors((e) => {
      if (!e[id]) return e;
      const next = { ...e };
      delete next[id];
      return next;
    });
  }

  function setRoleAnswer(r: Role) {
    setRole(r);
    setErrors((e) => {
      const next = { ...e };
      delete next.role;
      return next;
    });
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!anonymous && name.trim().length < 2) next.name = "Please enter your name.";
    if (!role) next.role = "Please select your role.";
    for (const q of shown) {
      if (q.kind === "choice" && !answers[q.id]) next[q.id] = "Please choose an option.";
    }
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) document.getElementById(`q-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    return !first;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting" || !validate()) return;
    setStatus("submitting");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: anonymous ? "" : name.trim(),
          anonymous,
          role,
          answers: Object.fromEntries(shown.map((q) => [q.id, answers[q.id] ?? ""])),
          explanations,
          website: String(form.get("website") ?? ""),
          startedAt: startedAt.current,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setStatus("success");
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      <AnimatePresence mode="wait" initial={false}>
        {status === "success" ? (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease }}
            role="status"
            className="relative mx-auto max-w-3xl overflow-hidden bg-ivory px-6 py-16 text-center shadow-[0_30px_60px_-30px_rgba(36,36,36,0.25)] sm:px-14 sm:py-20"
          >
            <span aria-hidden className="mx-auto block h-16 w-16 rounded-full border border-gold/60 pt-3 font-serif text-3xl text-champagne-dark">
              &#10003;
            </span>
            <p className="eyebrow mt-8 text-champagne-dark">Response received</p>
            <h3 className="mt-5 font-serif text-4xl leading-tight font-medium sm:text-5xl">
              Thank you for your <span className="italic text-champagne-dark">feedback!</span>
            </h3>
            <p className="mx-auto mt-6 max-w-xl leading-relaxed text-charcoal/70">{survey.thanks}</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease }}
            onSubmit={onSubmit}
            noValidate
            className="mx-auto max-w-3xl"
          >
            <div className="sticky top-[4.5rem] z-20 -mx-2 mb-8 bg-sand/95 px-2 py-4 backdrop-blur sm:top-20">
              <div className="flex items-center justify-between text-xs font-semibold tracking-[0.2em] text-charcoal/60 uppercase">
                <span>Your progress</span>
                <span aria-live="polite">
                  {answered} / {total}
                </span>
              </div>
              <div
                className="mt-3 h-[3px] w-full bg-charcoal/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label="Survey progress"
              >
                <div className="h-full bg-gold transition-[width] duration-700 ease-luxe" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div aria-hidden className="absolute left-[-9999px]">
              <label>
                Website
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <ol className="space-y-6">
              <QuestionCard id="name" number="00" error={errors.name}>
                <label htmlFor="respondent-name" className="block font-serif text-2xl leading-snug sm:text-[1.7rem]">
                  Before we begin &mdash; what is your name?
                </label>
                <p className="mt-2 text-sm text-charcoal/55">
                  Please use your full name so the Portals team can follow up with you, or tick the box below to stay anonymous.
                </p>
                <input
                  id="respondent-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  maxLength={80}
                  value={anonymous ? "" : name}
                  disabled={anonymous}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((current) => {
                      if (!current.name) return current;
                      const next = { ...current };
                      delete next.name;
                      return next;
                    });
                  }}
                  placeholder={anonymous ? "Submitting as Anonymous" : "e.g. Sara Ahmed"}
                  aria-invalid={Boolean(errors.name)}
                  className="mt-6 block w-full border border-charcoal/15 bg-white/70 px-4 py-3 text-base outline-none transition-colors placeholder:text-charcoal/35 focus:border-champagne-dark focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-sand/60"
                />
                <label className="mt-4 inline-flex cursor-pointer items-center gap-3 text-sm text-charcoal/75 select-none">
                  <input
                    type="checkbox"
                    name="anonymous"
                    checked={anonymous}
                    onChange={(e) => {
                      setAnonymous(e.target.checked);
                      setErrors((current) => {
                        if (!current.name) return current;
                        const next = { ...current };
                        delete next.name;
                        return next;
                      });
                    }}
                    className="h-4 w-4 cursor-pointer accent-champagne-dark"
                  />
                  Submit anonymously &mdash; my name won&rsquo;t be recorded
                </label>
              </QuestionCard>

              <QuestionCard id="role" number="" error={errors.role}>
                <fieldset>
                  <legend className="font-serif text-2xl leading-snug sm:text-[1.7rem]">Which best describes you?</legend>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {roles.map((r) => (
                      <Option key={r} name="role" value={r} checked={role === r} onChange={() => setRoleAnswer(r)} />
                    ))}
                  </div>
                </fieldset>
              </QuestionCard>

              <AnimatePresence initial={false}>
                {shown.map((q, i) => (
                  <motion.li
                    key={q.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5, ease }}
                    className="list-none"
                  >
                    <QuestionCard
                      as="div"
                      id={q.id}
                      number={String(i + 1).padStart(2, "0")}
                      error={errors[q.id]}
                      tag={q.managersOnly ? "Managers" : q.kind === "text" ? "Optional" : undefined}
                    >
                      <QuestionBody
                        question={q}
                        value={answers[q.id] ?? ""}
                        explanation={explanations[q.id] ?? ""}
                        onChange={(v) => setAnswer(q.id, v)}
                        onExplain={(v) => setExplanations((e) => ({ ...e, [q.id]: v }))}
                      />
                    </QuestionCard>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>

            <div className="mt-10 flex flex-col items-center gap-5 text-center">
              {status === "error" && (
                <p role="alert" className="w-full border border-red-800/20 bg-red-50 px-5 py-4 text-sm text-red-900">
                  {message}
                </p>
              )}
              {Object.keys(errors).length > 0 && (
                <p role="alert" className="text-sm text-red-800">
                  Please answer the highlighted questions.
                </p>
              )}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="group inline-flex items-center gap-3 bg-charcoal px-10 py-5 text-[0.78rem] font-semibold tracking-[0.2em] text-ivory uppercase transition-colors duration-500 hover:bg-champagne-dark disabled:cursor-wait disabled:opacity-70"
              >
                {status === "submitting" ? "Submitting…" : "Submit feedback"}
                <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
                  &rarr;
                </span>
              </button>
              <p className="text-xs tracking-wide text-charcoal/50">Responses are confidential and shared only with the Portals team.</p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionCard({
  id,
  number,
  error,
  tag,
  as = "li",
  children,
}: {
  id: string;
  number: string;
  error?: string;
  tag?: string;
  as?: "li" | "div";
  children: React.ReactNode;
}) {
  const Tag = as;
  return (
    <Tag
      id={`q-${id}`}
      className={`relative list-none border bg-ivory p-6 transition-colors duration-500 sm:p-10 ${
        error ? "border-red-800/40" : "border-transparent"
      } shadow-[0_24px_48px_-32px_rgba(36,36,36,0.25)]`}
    >
      <div className="mb-5 flex items-center gap-4">
        <span className="font-serif text-3xl leading-none text-champagne italic">{number}</span>
        <span aria-hidden className="h-px w-10 bg-gold/60" />
        {tag && <span className="eyebrow text-[0.62rem] text-champagne-dark">{tag}</span>}
      </div>
      {children}
      {error && (
        <p className="mt-4 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
    </Tag>
  );
}

function QuestionBody({
  question: q,
  value,
  explanation,
  onChange,
  onExplain,
}: {
  question: Question;
  value: string;
  explanation: string;
  onChange: (v: string) => void;
  onExplain: (v: string) => void;
}) {
  if (q.kind === "text") {
    return (
      <div>
        <label htmlFor={`in-${q.id}`} className="block font-serif text-2xl leading-snug sm:text-[1.7rem]">
          {q.text}
        </label>
        <TextArea id={`in-${q.id}`} value={value} onChange={onChange} />
      </div>
    );
  }
  const explain = (q as ChoiceQuestion).explainOption;
  const twoCol = q.options.every((o) => o.length < 28);
  return (
    <fieldset>
      <legend className="font-serif text-2xl leading-snug sm:text-[1.7rem]">{q.text}</legend>
      <div className={`mt-6 grid gap-3 ${twoCol ? "sm:grid-cols-2" : ""}`}>
        {q.options.map((o) => (
          <Option key={o} name={q.id} value={o} checked={value === o} onChange={() => onChange(o)} />
        ))}
      </div>
      <AnimatePresence initial={false}>
        {explain && value === explain && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease }}
            className="overflow-hidden"
          >
            <label htmlFor={`ex-${q.id}`} className="mt-5 block text-sm font-semibold text-charcoal/70">
              Please explain
            </label>
            <TextArea id={`ex-${q.id}`} value={explanation} onChange={onExplain} rows={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </fieldset>
  );
}

function TextArea({ id, value, onChange, rows = 4 }: { id: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="mt-5">
      <textarea
        id={id}
        rows={rows}
        maxLength={MAX_TEXT}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Share your thoughts…"
        className="block w-full resize-y border border-charcoal/15 bg-white/70 px-4 py-3 text-base leading-relaxed outline-none transition-colors placeholder:text-charcoal/35 focus:border-champagne-dark focus-visible:outline-none"
      />
      <p className="mt-2 text-right text-[0.7rem] tracking-wide text-charcoal/40">
        {value.length} / {MAX_TEXT}
      </p>
    </div>
  );
}

function Option({ name, value, checked, onChange }: { name: string; value: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className={`group flex cursor-pointer items-center gap-4 border px-5 py-4 text-[0.95rem] leading-snug transition-colors duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${
        checked
          ? "border-champagne-dark bg-sand text-charcoal"
          : "border-charcoal/12 bg-white/60 text-charcoal/80 hover:border-champagne hover:bg-sand/50"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
          checked ? "border-champagne-dark" : "border-charcoal/30 group-hover:border-champagne"
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full bg-champagne-dark transition-transform duration-300 ${checked ? "scale-100" : "scale-0"}`} />
      </span>
      {value}
    </label>
  );
}
