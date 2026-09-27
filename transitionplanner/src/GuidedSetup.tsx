import * as React from "react";
import { ArrowLeft, ArrowRight, Check, CalendarDays, BriefcaseBusiness, ShieldCheck, GraduationCap, WalletCards, ClipboardCheck } from "lucide-react";
import { amount, buildSetup, setupError, setupInsights, type Answers, type AnswerKey, type SetupState } from "./setupModel";
import type { ModelSettings } from "./App";
import "./guidedSetup.css";

const steps = [
  { title: "When does your next chapter begin?", label: "Your timeline", icon: CalendarDays, detail: "A rough date is fine. Anything you leave blank stays unconfirmed." },
  { title: "Is civilian work part of your plan?", label: "Work", icon: BriefcaseBusiness, detail: "An offer isn't required. Use an estimate you're comfortable exploring." },
  { title: "Do you have a VA payment in mind?", label: "VA benefits", icon: ShieldCheck, detail: "Only include a rating and payment month you want to model. This does not predict an award." },
  { title: "Will school be part of the transition?", label: "School", icon: GraduationCap, detail: "Already enrolled? Use your actual enrollment dates, not just the start of a new term." },
  { title: "What does a basic month cost?", label: "Everyday costs", icon: WalletCards, detail: "Think housing, groceries, transport, healthcare and minimum debt payments. Leave savings goals for later." },
  { title: "Here's where your plan stands.", label: "Your starting point", icon: ClipboardCheck, detail: "Unconfirmed income stays out. You can adjust every assumption afterward." },
];

export default function GuidedSetup({ state, onChange, onFinish, onCancel, base }: {
  state: SetupState; onChange: (state: SetupState) => void;
  onFinish: (state: SetupState, settings: ModelSettings) => void; onCancel?: () => void; base: ModelSettings;
}) {
  const { answers: a, step } = state;
  const heading = React.useRef<HTMLHeadingElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { heading.current?.focus({ preventScroll: true }); setError(null); }, [step]);
  const update = (key: AnswerKey, value: string) => { setError(null); onChange({ ...state, answers: { ...a, [key]: value } }); };
  const input = (key: AnswerKey, label: string, type = "number", max?: number) => <label className="setup-field" key={key}>
    <span>{label}</span><input type={type} value={a[key]} onChange={event => update(key, event.target.value)}
      min={type === "number" ? 0 : undefined} max={max} step={key === "rating" ? 10 : type === "number" ? "any" : undefined}
      inputMode={type === "number" ? "decimal" : undefined} autoComplete="off" /></label>;
  const choice = (key: AnswerKey, label: string, options: Array<[string, string]>) => <fieldset className="setup-options"><legend>{label}</legend>
    {options.map(([value, text]) => <label key={value}><input type="radio" name={key} value={value} checked={a[key] === value} onChange={() => update(key, value)} /><span>{text}</span></label>)}</fieldset>;
  const advance = () => {
    const issue = setupError(a, step);
    if (issue) { setError(issue); return; }
    if (step < 5) onChange({ ...state, step: step + 1 });
    else {
      for (let index = 0; index < 5; index++) { const issue = setupError(a, index); if (issue) { onChange({ ...state, step: index }); setError(issue); return; } }
      const result = buildSetup(a, base);
      onFinish({ ...state, complete: true, pending: result.pending }, result.settings);
    }
  };
  const skip = () => {
    const keys: AnswerKey[][] = [["start", "separation", "leave", "military"], ["work", "workStart", "pay", "hours"], ["va", "rating", "vaMonth"], ["school", "schoolStart", "schoolEnd", "benefit", "load", "education", "tuition"], ["expenses"]];
    const answers = { ...a };
    for (const key of keys[step]) answers[key] = "";
    onChange({ ...state, answers, step: step + 1 });
  };
  const current = steps[step];
  const Icon = current.icon;
  const result = buildSetup(a, base);
  return <section className="guided-setup" aria-labelledby="setup-heading" id="controls-heading">
    <div className="setup-top"><span><Icon size={18} aria-hidden="true" /> {current.label}</span><span>{step + 1} / {steps.length}</span></div>
    <progress value={step + 1} max={steps.length} aria-label="Setup progress" />
    <div className="setup-panel" key={step}>
      <h2 id="setup-heading" tabIndex={-1} ref={heading}>{current.title}</h2><p className="setup-description">{current.detail}</p>
      <form onSubmit={event => { event.preventDefault(); advance(); }} noValidate>
        {step === 0 && <><div className="setup-fields">{input("start", "Projection begins", "month")}{input("separation", "Separation date", "date")}{input("leave", "Terminal leave starts (optional)", "date")}{input("military", "Current military take-home / month", "number", 100000)}</div><p className="setup-note">No projection month selected? The timeline will start this month. Separation and pay stay unconfirmed until you provide them.</p></>}
        {step === 1 && <>{choice("work", "Civilian employment", [["yes", "Yes, or exploring it"], ["no", "No civilian work planned"], ["unknown", "I'm not sure yet"]])}{a.work === "yes" && <>
          {choice("payMode", "How do you think about pay?", [["hourly", "Hourly wage"], ["annual", "Yearly salary"]])}
          <div className="setup-fields">{input("pay", a.payMode === "annual" ? "Gross yearly salary" : "Hourly wage")}{a.payMode !== "annual" && input("hours", "Hours per week", "number", 168)}{input("workStart", "Work starts", "date")}</div>
          {choice("filing", "Tax filing status", [["single", "Single"], ["marriedJoint", "Married filing jointly"], ["headOfHousehold", "Head of household"]])}
          <p className="setup-note">This estimate assumes W-2 employment and single filing unless selected otherwise. Work before separation must begin on or after terminal leave starts; military duties and outside-employment rules still apply.</p></>}</>}
        {step === 2 && <>{choice("va", "VA compensation", [["yes", "Include an estimate"], ["no", "Don't include VA income"], ["unknown", "I'm waiting to find out"]])}{a.va === "yes" && <div className="setup-fields">{input("rating", "Expected or awarded rating (%)", "number", 100)}{input("vaMonth", "Expected decision month", "month")}</div>}<p className="setup-note">No rating or decision month? VA income stays excluded. Regular payments are modeled after the decision month and first payable month. Catch-up payments and SMC are not assumed.</p></>}
        {step === 3 && <>{choice("school", "School or training", [["yes", "Yes, planned or already enrolled"], ["no", "Not part of my plan"], ["unknown", "Still deciding"]])}{a.school === "yes" && <>
          {choice("benefit", "Which education benefit?", [["mgib", "Montgomery GI Bill"], ["post911", "Post-9/11 GI Bill"], ["vre", "VR&E"], ["none", "None / not sure"]])}
          {choice("load", "Enrollment", [["full", "Full-time"], ["threeQuarter", "Three-quarter time"], ["half", "Half-time"], ["none", "Not sure"]])}
          <div className="setup-fields">{input("schoolStart", "Enrollment starts", "date")}{input("schoolEnd", "Enrollment ends", "date")}{input("education", "Expected monthly benefit at this enrollment (optional)")}{input("tuition", "Out-of-pocket term tuition (optional)")}</div><p className="setup-note">Use a school-confirmed monthly payment for your enrollment level. If any benefit details are unknown, education income stays excluded. Pell and other aid can be added later.</p></>}</>}
        {step === 4 && <>{input("expenses", "Essential monthly expenses") }<p className="setup-note">A blank is unknown, not a $0 budget. Cash-gap and reserve conclusions stay hidden until you enter an amount. Lifestyle and savings targets initially match this amount; increase them later.</p></>}
        {step === 5 && <><dl className="setup-review"><div><dt>Projection</dt><dd>{result.settings.timelineStartMonth} / 12 months</dd></div><div><dt>Separation</dt><dd>{a.separation || "Not yet known"}</dd></div><div><dt>Essential expenses</dt><dd>{amount(a.expenses) ? `$${Number(a.expenses).toLocaleString()} / month` : "Not yet known"}</dd></div></dl><ul className="setup-insights">{setupInsights(result.settings, result.pending).map(note => <li key={note}>{note}</li>)}</ul></>}
        {error && <p className="setup-error" role="alert">{error}</p>}
        {step === 5 && onCancel && <p className="setup-note">Opening this plan replaces the current inputs saved on this device.</p>}
        <div className="setup-actions"><button type="button" className="icon-button" aria-label="Previous question" title="Previous question" disabled={step === 0} onClick={() => onChange({ ...state, step: step - 1 })}><ArrowLeft size={18} /></button>
          {step < 5 && <button type="button" className="setup-skip" onClick={skip}>I'm not sure. Skip for now.</button>}
          <button type="submit" className="setup-next">{step === 5 ? "Open my planner" : "Continue"}{step === 5 ? <Check size={17} /> : <ArrowRight size={17} />}</button></div>
      </form>
    </div>
    <div className="setup-bottom"><span>Saved on this device. No account needed.</span>{onCancel && <button className="setup-skip" onClick={onCancel}>Back to my existing plan</button>}</div>
  </section>;
}
