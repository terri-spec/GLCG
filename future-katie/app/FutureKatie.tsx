"use client";

import { useEffect, useMemo, useState } from "react";
import { careers, type Career } from "./career-data";

type View = "home" | "doors" | "career" | "compare" | "pause";
type CareerState = { step: number; gameScene: number; answers: Record<string, string>; reflectionPart: number; showMoreJobs: boolean };
type Reaction = { curiosity?: string; enjoyment?: string; more?: string; attraction?: string; hesitation?: string; education?: string; disposition?: string };
type Progress = {
  explored: string[]; completed: string[]; savedCareers: string[]; savedJobs: string[];
  lastCareer?: string; careerStates: Record<string, CareerState>; reactions: Record<string, Reaction>;
};

const emptyState = (): CareerState => ({ step: 0, gameScene: 0, answers: {}, reflectionPart: 0, showMoreJobs: false });
const initial: Progress = { explored: [], completed: [], savedCareers: [], savedJobs: [], careerStates: {}, reactions: {} };
const STORE = "future-katie-progress-v2";
const SESSION_STORE = "future-katie-session-id";
const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbzNfX7XdnEtTrdrSUN8GVHtKqoP_-bWOIWt5N0gotQNi8Ac2F14nMCJcWGGiV2Hzlrcnw/exec";
const steps = ["Career", "Job options", "Work environment", "Try the work", "Education", "Reality check", "Reflection"];
const ratingWords = ["Not at all", "A little", "Somewhat", "Quite a bit", "Very much"];

const workPreviews: Record<string, { situation: string; prompt: string; choices: string[] }> = {
  "biomedical-engineer": { situation: "A wearable heart monitor gives uneven readings while a patient walks.", prompt: "What would you check first?", choices: ["Compare movement with the signal errors", "Try a different sensor location", "Check how the software filters movement"] },
  "environmental-engineer": { situation: "A neighborhood stream shows a sudden rise in contamination after heavy rain.", prompt: "What would you do first?", choices: ["Test water upstream and downstream", "Map nearby runoff sources", "Compare samples before and after rainfall"] },
  "biosystems-engineer": { situation: "Plants in one greenhouse row are growing more slowly than the others.", prompt: "What would you check first?", choices: ["Compare soil moisture", "Review light and temperature data", "Inspect the irrigation lines"] },
  biostatistician: { situation: "A treatment appears helpful, but the study groups were different sizes.", prompt: "What would you examine first?", choices: ["Compare results as percentages", "Check how the groups were assigned", "Look for missing data"] },
  epidemiologist: { situation: "Several students from the same area report similar symptoms this week.", prompt: "What would you investigate first?", choices: ["Map where cases occurred", "Compare when symptoms began", "Look for a shared exposure"] },
  "molecular-diagnostics": { situation: "Two tests from the same sample give different results.", prompt: "What would you check first?", choices: ["Repeat the control sample", "Review how the sample was handled", "Compare the test instruments"] },
  "veterinary-research": { situation: "Several animals in one group begin showing the same unusual symptom.", prompt: "What would you examine first?", choices: ["Compare food and environment", "Review when symptoms began", "Collect a careful set of samples"] },
  pharmaceutical: { situation: "A promising compound works well at one dose but causes problems at a higher dose.", prompt: "What would you test next?", choices: ["Try doses between the two", "Compare effects over time", "Check which tissues are affected"] },
  "healthcare-systems": { situation: "Patients are waiting longer because lab results are not reaching the right team quickly.", prompt: "What would you examine first?", choices: ["Map each handoff", "Measure where delays happen", "Ask staff where information gets lost"] },
  vision: { situation: "A person sees clearly in daylight but struggles with glare at night.", prompt: "What would you check first?", choices: ["Compare vision under different lighting", "Examine how the eye focuses", "Test whether glare changes with lenses"] },
};

function toggle(list: string[], value: string) { return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]; }

function sessionId() {
  const existing = localStorage.getItem(SESSION_STORE);
  if (existing) return existing;
  const created = globalThis.crypto?.randomUUID?.() || `future-katie-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(SESSION_STORE, created);
  return created;
}

const fitPatterns: Record<string, { included: string[]; friction: string[] }> = {
  build: { included: ["medical and biological science", "mathematics", "practical problem-solving", "hands-on learning", "meaningful outcomes"], friction: ["advanced physics", "long technical projects", "frequent teamwork"] },
  pattern: { included: ["mathematics", "research", "organized and accurate work", "independent concentration", "meaningful outcomes"], friction: ["substantial coding", "long periods at a computer", "uncertain research outcomes"] },
  disease: { included: ["medical science", "research", "organized and accurate work", "hands-on learning", "independent concentration"], friction: ["repetitive laboratory work", "long education", "uncertain results"] },
  treatment: { included: ["medical science", "research", "hands-on learning", "practical problem-solving", "meaningful outcomes"], friction: ["repetitive laboratory work", "failed experiments", "long education"] },
  system: { included: ["systems and information organization", "practical problem-solving", "mathematics", "meaningful outcomes", "teamwork without constant public interaction"], friction: ["substantial coding", "frequent meetings", "possible patient contact"] },
};

export default function FutureKatie() {
  const [view, setView] = useState<View>("home");
  const [careerId, setCareerId] = useState<string>();
  const [progress, setProgress] = useState<Progress>(initial);
  const [ready, setReady] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => { try { const saved = localStorage.getItem(STORE); if (saved) setProgress({ ...initial, ...JSON.parse(saved) }); } catch {} setReady(true); }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORE, JSON.stringify(progress)); }, [progress, ready]);

  const career = careers.find((x) => x.id === careerId);
  const eligible = useMemo(() => careers.filter((c) => progress.completed.includes(c.id) || progress.savedCareers.includes(c.id)), [progress]);
  const compareUnlocked = eligible.length >= 2;

  function openCareer(id: string) {
    setCareerId(id); setView("career");
    setProgress((p) => ({ ...p, explored: p.explored.includes(id) ? p.explored : [...p.explored, id], lastCareer: id, careerStates: { ...p.careerStates, [id]: p.careerStates[id] || emptyState() } }));
  }
  function saveCareerState(id: string, patch: Partial<CareerState>) {
    setProgress((p) => ({ ...p, careerStates: { ...p.careerStates, [id]: { ...(p.careerStates[id] || emptyState()), ...patch } } }));
  }
  function clearAndStartOver() {
    if (!window.confirm("Clear all saved career progress and answers on this device and start over?")) return;
    localStorage.removeItem(STORE);
    localStorage.removeItem(SESSION_STORE);
    setProgress(initial);
    setCareerId(undefined);
    setCompareIds([]);
    setView("home");
  }

  return <main className="app">
    <header className="topbar">
      <button className="brand" onClick={() => setView("home")}>Future Katie</button>
      <nav aria-label="Main navigation"><button onClick={() => setView("doors")}>Explore</button><button onClick={() => { setCompareIds(eligible.slice(0, 3).map((c) => c.id)); setView("compare"); }} disabled={!compareUnlocked}>Compare</button><button onClick={() => window.print()}>Print</button><button className="clear-start" onClick={clearAndStartOver}>Clear and start over</button></nav>
    </header>
    {view === "home" && <section className="hero page"><p className="eyebrow">A calm place to explore</p><h1>Try on a future before choosing one.</h1><p className="lead">Katie, explore what different careers actually feel like. There are no wrong answers, and nothing here chooses a career for you.</p><button className="primary" onClick={() => setView("doors")}>{progress.lastCareer ? "Explore another future" : "Start exploring"}</button>{progress.lastCareer && <button className="continue" onClick={() => openCareer(progress.lastCareer!)}>Continue exactly where I stopped in {careers.find((c) => c.id === progress.lastCareer)?.title}</button>}<p className="reassure">You can pause anytime. Your exact place and answers are saved on this device.</p></section>}

    {view === "doors" && <section className="page"><button className="back" onClick={() => setView("home")}>← Home</button><p className="eyebrow">Career possibilities from your reports</p><h1>Which career would you like to explore?</h1><p className="lead">Choose a career first. Then you can examine its jobs, work environments, daily tasks, and education without committing to it.</p><div className="career-list career-choice-grid">{careers.map((c) => <article key={c.id} className="career-card"><div><h2>{c.title}</h2><p>{c.mission}</p><p className="job-preview"><strong>Job examples:</strong> {c.jobs.slice(0, 3).map((j) => j.title).join(" · ")}</p></div><div className="actions"><button className="primary" onClick={() => openCareer(c.id)}>{progress.careerStates[c.id] ? "Continue exploring" : "Explore this career"}</button><button aria-pressed={progress.savedCareers.includes(c.id)} onClick={() => setProgress((p) => ({ ...p, savedCareers: toggle(p.savedCareers, c.id) }))}>{progress.savedCareers.includes(c.id) ? "Saved to explore" : "Save for later"}</button></div></article>)}</div></section>}

    {view === "career" && career && <CareerWorld career={career} state={progress.careerStates[career.id] || emptyState()} saveState={(patch) => saveCareerState(career.id, patch)} onLeave={() => setView("doors")} onPause={() => setView("pause")} progress={progress} setProgress={setProgress} />}

    {view === "pause" && <section className="page pause"><div className="pause-mark">◌</div><h1>Your exact place is saved.</h1><p className="lead">You do not need to decide anything right now. Come back when it feels useful.</p><button className="primary" onClick={() => setView("home")}>Stop for today</button><button onClick={() => setView(career ? "career" : "doors")}>I’m ready to continue</button></section>}

    {view === "compare" && <CompareView eligible={eligible} selected={compareIds} setSelected={setCompareIds} progress={progress} onHome={() => setView("home")} />}
  </main>;
}

function CompareView({ eligible, selected, setSelected, progress, onHome }: { eligible: Career[]; selected: string[]; setSelected: (v: string[]) => void; progress: Progress; onHome: () => void }) {
  const chosen = eligible.filter((c) => selected.includes(c.id));
  return <section className="page"><button className="back" onClick={onHome}>← Home</button><p className="eyebrow">Your observations</p><h1>Compare your experience—not a score.</h1><p className="lead">Choose two or three futures. There is no winner.</p><div className="compare-picker">{eligible.map((c) => <label key={c.id}><input type="checkbox" checked={selected.includes(c.id)} disabled={!selected.includes(c.id) && selected.length >= 3} onChange={() => setSelected(toggle(selected, c.id))} />{c.title}</label>)}</div>{chosen.length < 2 ? <div className="notice"><p>Choose at least two careers to compare.</p></div> : <div className="table-wrap"><table><thead><tr><th>My reaction</th>{chosen.map((c) => <th key={c.id}>{c.title}</th>)}</tr></thead><tbody>{[
    ["Curiosity", "curiosity"], ["Enjoyed the task", "enjoyment"], ["Could do more", "more"], ["Main attraction", "attraction"], ["Main hesitation", "hesitation"], ["Education", "education"], ["What next", "disposition"],
  ].map(([label, key]) => <tr key={key}><th>{label}</th>{chosen.map((c) => <td key={c.id}>{progress.reactions[c.id]?.[key as keyof Reaction] || "Not answered yet"}</td>)}</tr>)}</tbody></table></div>}</section>;
}

function CareerWorld({ career, state, saveState, onLeave, onPause, progress, setProgress }: { career: Career; state: CareerState; saveState: (p: Partial<CareerState>) => void; onLeave: () => void; onPause: () => void; progress: Progress; setProgress: React.Dispatch<React.SetStateAction<Progress>> }) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "local">("idle");
  const { step, gameScene, answers, reflectionPart, showMoreJobs } = state;
  const visibleJobs = showMoreJobs ? career.jobs : career.jobs.slice(0, 3);
  const updateAnswer = (key: string, value: string) => saveState({ answers: { ...answers, [key]: value } });
  const fit = fitPatterns[career.category];
  const game = [
    { title: "Begin with the pattern", text: "A wearable heart monitor is reliable while a patient is sitting, but readings become uneven while walking.", prompt: "Which useful investigation would you start with?", choices: [
      ["Compare motion data with the signal errors.", "This reveals whether the errors consistently appear during particular kinds of movement."],
      ["Repeat the test with the sensor in a different location.", "This tests whether placement and skin contact change the signal."],
      ["Examine how the software filters movement.", "This checks whether good raw signals are being distorted during processing."],
    ] },
    { title: "Follow the evidence", text: "The errors increase during arm movement. A different sensor location reduces them, but does not eliminate them.", prompt: "What would you investigate next?", choices: [
      ["Compare raw signals before and after filtering.", "This separates sensor performance from software processing."],
      ["Test several strap pressures during the same movement.", "This measures whether physical contact is still contributing to the errors."],
      ["Ask a clinical adviser which errors could affect decisions.", "This helps prioritize which technical errors matter most for safe use."],
    ] },
    { title: "Recommend a next test", text: "Raw signals remain stable with secure contact, but the filtered output still spikes during movement.", prompt: "Which recommendation best matches what you want to learn next?", choices: [
      ["Test a revised motion-filtering method.", "This directly investigates the most likely remaining cause."],
      ["Run the same test with several walking patterns.", "This checks whether the finding holds across realistic kinds of movement."],
      ["Compare the prototype with an existing monitor.", "This provides a useful benchmark for deciding whether the error is acceptable."],
    ] },
  ];
  const selectedGame = answers[`game-${gameScene}`];
  const selectedFeedback = game[gameScene].choices.find(([choice]) => choice === selectedGame)?.[1];
  const nextStep = () => saveState({ step: Math.min(6, step + 1) });
  const saveFuture = () => setProgress((p) => ({ ...p, savedCareers: p.savedCareers.includes(career.id) ? p.savedCareers : [...p.savedCareers, career.id] }));
  const saveReflection = async () => {
    const reaction: Reaction = { curiosity: answers.curiosity, enjoyment: answers.enjoyment, more: answers.moreWork, attraction: answers.attraction || answers.attractionOther, hesitation: answers.hesitation || answers.hesitationOther, education: answers.hesitation === "Schooling or training" ? (answers.education || "Worth exploring") : "Not a main concern", disposition: answers.disposition };
    setProgress((p) => ({ ...p, completed: p.completed.includes(career.id) ? p.completed : [...p.completed, career.id], savedCareers: answers.disposition === "Rule this out" ? p.savedCareers.filter((id) => id !== career.id) : answers.disposition === "Keep on my list" && !p.savedCareers.includes(career.id) ? [...p.savedCareers, career.id] : p.savedCareers, reactions: { ...p.reactions, [career.id]: reaction } }));
    setSaveStatus("saving");
    try {
      await fetch(SHEET_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          sessionId: sessionId(), career: career.title, currentStep: steps[step],
          savedJobs: progress.savedJobs.filter((job) => job.startsWith(`${career.id}:`)).map((job) => job.slice(career.id.length + 1)),
          game1: answers["game-0"] || "", game2: answers["game-1"] || "", game3: answers["game-2"] || "",
          curiosity: answers.curiosity || "", enjoyment: answers.enjoyment || "", moreWork: answers.moreWork || "",
          attraction: reaction.attraction || "", hesitation: reaction.hesitation || "", education: reaction.education || "",
          disposition: reaction.disposition || "", notes: answers.attractionOther || "", answers,
        }),
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("local");
    }
  };

  const workPreview = workPreviews[career.id];

  return <section className="page world"><div className="world-head"><button className="back" onClick={onLeave}>← All career choices</button></div><div className="stepper" aria-label={`Step ${step + 1} of ${steps.length}`}><span>Step {step + 1} of {steps.length} · {steps[step]}</span><div className="step-progress"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div></div>

    {step === 0 && <div className="stage"><div className="intro"><div className="career-scene"><img src={`./career-scenes/${career.id}.png`} alt={`Katie working as a ${career.title}`} /></div><div><h1>{career.title}</h1><p className="mission">{career.mission}</p><p className="supporting">{career.intro}</p></div></div><div className="fit-card"><h2>Why this future was included for Katie</h2><p>This future was included because it uses several activities Katie reported being interested in. That does not mean it is the right career for her.</p><div className="fit-columns"><div><h3>Patterns it may use</h3><ul>{fit.included.map((x) => <li key={x}>{x}</li>)}</ul></div><div><h3>Possible friction to notice</h3><ul>{fit.friction.map((x) => <li key={x}>{x}</li>)}</ul></div></div></div></div>}
    {step === 1 && <div className="stage"><h1>Choose a job lens</h1><p className="lead">The same career area can create very different daily experiences. Save any job whose actual work interests you.</p><div className="jobs">{visibleJobs.map((j) => { const key = `${career.id}:${j.title}`; const saved = progress.savedJobs.includes(key); return <article className="job" key={j.title}><h2>{j.title}</h2><p>{j.responsibility}</p><ul>{j.traits.map((t) => <li key={t}>{t}</li>)}</ul><button aria-pressed={saved} onClick={() => setProgress((p) => ({ ...p, savedJobs: toggle(p.savedJobs, key) }))}>{saved ? "Saved ✓" : "Save this job"}</button></article>; })}</div>{career.jobs.length > 3 && <button onClick={() => saveState({ showMoreJobs: !showMoreJobs })}>{showMoreJobs ? "Show fewer jobs" : "Show more jobs"}</button>}</div>}
    {step === 2 && <div className="stage"><h1>Where could this work happen?</h1><p className="lead">Notice which environments sound energizing, tolerable, or draining—not just which job title sounds impressive.</p><div className="environment-grid">{career.jobs.map((j) => <article className="environment-card" key={j.title}><p className="eyebrow">{j.title}</p><h2>{j.setting}</h2><p>{j.responsibility}</p></article>)}</div>{career.playable && <><h2 className="section-title">A sample day in biomedical engineering</h2><div className="day"><article><span>9:00</span><h2>Plan the test</h2><p>Review yesterday’s monitor results and decide what evidence the team needs next.</p></article><article><span>11:00</span><h2>Work with the prototype</h2><p>Adjust sensor placement, run a movement test, and inspect the signal.</p></article><article><span>1:30</span><h2>Compare interpretations</h2><p>Meet briefly with a software engineer and a clinical adviser.</p></article><article><span>3:00</span><h2>Document what changed</h2><p>Record the method, results, limits, and next step.</p></article></div></>}</div>}
    {step === 3 && <div className="stage game"><p className="eyebrow">A quick work sample</p><h1>Try the work</h1><p className="lead">{workPreview.situation}</p><fieldset><legend>{workPreview.prompt}</legend>{workPreview.choices.map((choice) => <label key={choice}><input type="radio" name="work-preview" checked={answers["work-preview"] === choice} onChange={() => updateAnswer("work-preview", choice)} /> {choice}</label>)}</fieldset>{answers["work-preview"] && <div className="feedback"><strong>That is a reasonable place to start.</strong><p>The point is to notice whether this kind of thinking feels interesting—not to find one perfect answer.</p></div>}<button className="primary" disabled={!answers["work-preview"]} onClick={() => saveState({ step: 4 })}>Continue</button></div>}
    {step === 4 && <div className="stage"><h1>What would you study?</h1><p className="lead">Now that you have seen the jobs and environments, consider what preparation they require.</p><ol className="timeline">{career.degrees.map((d, i) => <li key={d}><span>{i + 1}</span><p>{d}</p></li>)}</ol><details><summary>Talk to my advisor about:</summary><div className="ut"><ul>{career.utoledo.map((x) => <li key={x}>{x}</li>)}</ul></div></details><div className="ending-actions"><button className="primary" onClick={saveFuture}>Save this job</button></div></div>}
    {step === 5 && <div className="stage"><h1>The honest reality</h1><div className="reality"><article><h2>What may feel meaningful</h2><ul><li>{career.mission}</li><li>{career.jobs[0].responsibility}</li><li>Doing work with a clear purpose and visible questions to solve.</li></ul></article><article><h2>What may be difficult</h2><ul>{career.jobs.flatMap((job) => job.traits).slice(0, 3).map((trait) => <li key={trait}>{trait}</li>)}</ul></article></div></div>}
    {step === 6 && <div className="stage reflection"><p className="eyebrow">Reflection · Part {reflectionPart + 1} of 3</p>{reflectionPart === 0 && <><h1>How did the work feel?</h1>{[["curiosity", "This made me curious."], ["enjoyment", "I liked the kind of problem."], ["moreWork", "I could picture myself doing more of it."]].map(([key, label]) => <fieldset key={key}><legend>{label}</legend><div className="scale">{ratingWords.map((x) => <label key={x}><input type="radio" name={key} checked={answers[key] === x} onChange={() => updateAnswer(key, x)} />{x}</label>)}</div></fieldset>)}<button className="primary" disabled={!answers.curiosity || !answers.enjoyment || !answers.moreWork} onClick={() => saveState({ reflectionPart: 1 })}>Continue</button></>}{reflectionPart === 1 && <><h1>What stood out?</h1><fieldset><legend>Main attraction</legend><div className="chips">{["Solving the problem", "Designing and testing", "Medical purpose", "Quiet focused work", "Working with a team", "Seeing evidence"].map((x) => <label key={x}><input type="radio" name="attraction" checked={answers.attraction === x} onChange={() => updateAnswer("attraction", x)} />{x}</label>)}</div></fieldset><fieldset><legend>Main hesitation</legend><div className="chips">{["Schooling or training", "Math or physics", "Computer time", "Meetings", "Slow or failed tests", "Nothing yet"].map((x) => <label key={x}><input type="radio" name="hesitation" checked={answers.hesitation === x} onChange={() => updateAnswer("hesitation", x)} />{x}</label>)}</div></fieldset>{answers.hesitation === "Schooling or training" && <fieldset><legend>What about the education concerns you?</legend><div className="chips">{["Length", "Cost", "Difficult courses", "Admission", "Relocation", "Uncertain final job"].map((x) => <label key={x}><input type="radio" name="education" checked={answers.education === x} onChange={() => updateAnswer("education", x)} />{x}</label>)}</div></fieldset>}<label className="field">Anything else? <small>Optional</small><textarea value={answers.attractionOther || ""} onChange={(e) => updateAnswer("attractionOther", e.target.value)} /></label><button onClick={() => saveState({ reflectionPart: 0 })}>Back</button> <button className="primary" disabled={!answers.attraction || !answers.hesitation} onClick={() => saveState({ reflectionPart: 2 })}>Continue</button></>}{reflectionPart === 2 && <><h1>What should happen next?</h1><p className="lead">This is only where you would place this future today.</p><fieldset><legend>Choose one</legend><div className="dispositions">{["Explore next", "Keep on my list", "Not for me right now", "Unsure", "Rule this out"].map((x) => <label key={x}><input type="radio" name="disposition" checked={answers.disposition === x} onChange={() => updateAnswer("disposition", x)} />{x}</label>)}</div></fieldset><button onClick={() => saveState({ reflectionPart: 1 })}>Back</button> <button className="primary" disabled={!answers.disposition || saveStatus === "saving"} onClick={saveReflection}>{saveStatus === "saving" ? "Saving…" : "Save this reflection"}</button> <button onClick={onLeave}>Back to Explore</button>{saveStatus === "saved" && <p className="save-confirmation" role="status">Reflection saved to your response log.</p>}{saveStatus === "local" && <p className="save-confirmation" role="status">Saved on this device. The response log could not be reached.</p>}</>}</div>}

    {step < 6 && step !== 3 && <div className="checkpoint"><button className="primary" onClick={nextStep}>{step === 5 ? "Reflect on this experience" : step === 0 ? "See the jobs" : step === 1 ? "See the work environments" : step === 2 ? "Try the work" : "See the honest reality"}</button><button onClick={onPause}>Pause and return later</button></div>}
  </section>;
}
