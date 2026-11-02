import { SurveyForm } from "@/components/SurveyForm";
import { Reveal } from "@/components/Reveal";
import { questions, survey } from "@/content/survey";

const agentQuestions = questions.filter((q) => !q.managersOnly).length;
const minutes = Math.max(3, Math.round(questions.length / 2));

export default function Home() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-charcoal/5 bg-ivory/90 backdrop-blur">
        <div className="container-luxe flex h-[4.5rem] items-center justify-between sm:h-20">
          <a href="#top" className="font-serif text-2xl text-charcoal sm:text-[1.7rem]">
            DRE <span className="italic text-champagne-dark">Homes</span>
          </a>
          <a
            href="#survey"
            className="bg-charcoal px-5 py-3 text-[0.7rem] font-semibold tracking-[0.2em] text-ivory uppercase transition-colors duration-500 hover:bg-champagne-dark sm:px-6"
          >
            Start survey
          </a>
        </div>
      </header>

      <main id="top">
        <section aria-labelledby="hero-title" className="relative overflow-hidden bg-ivory pt-28 lg:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(171,152,137,0.22),transparent_60%)]"
          />
          <div className="container-luxe relative grid min-h-[calc(100svh-6rem)] items-center gap-12 pb-16 lg:grid-cols-12 lg:gap-6 lg:pb-20">
            <Reveal className="relative z-10 lg:col-span-7">
              <p className="eyebrow flex items-center gap-4 text-champagne-dark">
                <span aria-hidden className="h-px w-10 bg-gold" />
                DRE Homes &middot; Portals Team
              </p>
              <h1
                id="hero-title"
                className="mt-6 font-serif text-[clamp(3.4rem,8.5vw,7.5rem)] leading-[0.9] font-medium tracking-tight text-charcoal"
              >
                Portals
                <br />
                <span className="italic text-champagne-dark">Feedback</span> Survey
              </h1>
              <p className="mt-8 max-w-xl font-serif text-2xl leading-snug text-charcoal sm:text-3xl">Your feedback matters!</p>
              <p className="mt-5 max-w-xl text-sm leading-relaxed tracking-wide text-charcoal/65 sm:text-base">{survey.intro}</p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <a
                  href="#survey"
                  className="group inline-flex items-center gap-3 bg-charcoal px-7 py-4 text-[0.78rem] font-semibold tracking-[0.2em] text-ivory uppercase transition-colors duration-500 hover:bg-champagne-dark"
                >
                  Start the survey
                  <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
                    &rarr;
                  </span>
                </a>
                <span className="eyebrow text-charcoal/50">About {minutes} minutes</span>
              </div>
            </Reveal>

            <Reveal delay={0.15} className="relative mx-auto w-full max-w-[420px] px-4 lg:col-span-5">
              <div className="relative aspect-[4/5]">
                <div aria-hidden className="absolute -inset-x-3 -top-3 bottom-0 rounded-t-full border border-gold/50 sm:-inset-x-5 sm:-top-5" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 rounded-t-full bg-sand px-10 pt-16 text-center">
                  {[
                    { value: String(agentQuestions), label: "Short questions" },
                    { value: `${minutes} min`, label: "To complete" },
                    { value: "100%", label: "Anonymous" },
                  ].map((s, i) => (
                    <div key={s.label} className="w-full">
                      {i > 0 && <span aria-hidden className="mx-auto mb-8 block h-px w-12 bg-gold/60" />}
                      <p className="font-serif text-5xl leading-none text-charcoal">{s.value}</p>
                      <p className="eyebrow mt-3 text-champagne-dark">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="survey" aria-labelledby="survey-title" className="bg-sand py-20 sm:py-28">
          <div className="container-luxe">
            <Reveal className="mx-auto mb-10 max-w-3xl text-center">
              <p className="eyebrow text-champagne-dark">Agents &amp; Managers</p>
              <h2 id="survey-title" className="mt-5 font-serif text-4xl leading-[1.05] font-medium sm:text-5xl lg:text-6xl">
                Tell us how we&rsquo;re <span className="italic text-champagne-dark">doing</span>
              </h2>
              <p className="mt-6 text-base leading-relaxed text-charcoal/70 sm:text-lg">
                Please answer honestly &mdash; there are no right or wrong answers.
              </p>
            </Reveal>
            <SurveyForm />
          </div>
        </section>
      </main>

      <footer className="bg-[#1b1b1b] py-12 text-ivory/70">
        <div className="container-luxe flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="font-serif text-2xl text-ivory">
            DRE <span className="italic text-gold-soft">Homes</span>
          </p>
          <p className="text-xs tracking-wide">&copy; {new Date().getFullYear()} DRE Homes Real Estate &middot; Portals Team</p>
        </div>
      </footer>
    </>
  );
}
