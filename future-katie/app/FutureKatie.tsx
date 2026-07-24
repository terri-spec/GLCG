"use client";

import { useEffect, useMemo, useState } from "react";
import { careers, categories, type Career } from "./career-data";

type View = "home" | "doors" | "category" | "career" | "compare" | "pause";
type Density = "quick" | "standard" | "detail";
type Progress = { explored: string[]; completed: string[]; savedCareers: string[]; savedJobs: string[]; density: Density; lastCareer?: string };
const initial: Progress = { explored: [], completed: [], savedCareers: [], savedJobs: [], density: "standard" };
const STORE = "future-katie-progress-v1";
const steps = ["Meet Future Katie", "Education", "Job options", "A workday", "Try the work", "Reality check", "Reflection"];

function toggle(list: string[], value: string) { return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]; }

export default function FutureKatie() {
  const [view, setView] = useState<View>("home");
  const [category, setCategory] = useState<string>();
  const [careerId, setCareerId] = useState<string>();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState<Progress>(initial);
  const [ready, setReady] = useState(false);
  const [showMoreJobs, setShowMoreJobs] = useState(false);
  const [gameScene, setGameScene] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => { try { const saved = localStorage.getItem(STORE); if (saved) setProgress({ ...initial, ...JSON.parse(saved) }); } catch {} setReady(true); }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORE, JSON.stringify(progress)); }, [progress, ready]);
  const career = careers.find((x) => x.id === careerId);
  const completedCount = progress.completed.length;
  const compareUnlocked = completedCount >= 2 || (completedCount >= 1 && progress.savedCareers.length >= 2);

  function openCareer(id: string) {
    setCareerId(id); setStep(0); setGameScene(0); setShowMoreJobs(false); setView("career");
    setProgress((p) => ({ ...p, explored: p.explored.includes(id) ? p.explored : [...p.explored, id], lastCareer: id }));
  }
  function next() { if (!career) return; setStep((s) => Math.min(6, s + 1)); }
  function checkLoad(choice: string) {
    if (choice === "break") setView("pause");
    if (choice === "much") setProgress((p) => ({ ...p, density: "quick" }));
    if (choice === "fine") next();
  }

  return <main className={`app density-${progress.density}`}>
    <header className="topbar">
      <button className="brand" onClick={() => setView("home")}>Future Katie</button>
      <nav aria-label="Main navigation">
        <button onClick={() => setView("doors")}>Explore</button>
        <button onClick={() => setView("compare")} disabled={!compareUnlocked}>Compare</button>
        <button onClick={() => window.print()}>Print</button>
      </nav>
    </header>
    <div className="density-control" aria-label="Amount of information">
      <span>Show me:</span>
      {(["quick", "standard", "detail"] as Density[]).map((d) => <button key={d} aria-pressed={progress.density === d} onClick={() => setProgress((p) => ({ ...p, density: d }))}>{d === "quick" ? "Quick view" : d === "standard" ? "Standard view" : "More detail"}</button>)}
    </div>

    {view === "home" && <section className="hero page">
      <p className="eyebrow">A calm place to explore</p>
      <h1>Try on a future before choosing one.</h1>
      <p className="lead">Katie, explore what different careers actually feel like. There are no wrong answers, and nothing here chooses a career for you.</p>
      <button className="primary" onClick={() => setView("doors")}>{progress.lastCareer ? "Explore another future" : "Start exploring"}</button>
      {progress.lastCareer && <button className="continue" onClick={() => openCareer(progress.lastCareer!)}>Continue {careers.find((c) => c.id === progress.lastCareer)?.title}</button>}
      {progress.explored.length > 0 && <p className="gentle-progress">You have explored {progress.explored.length === 1 ? "one future" : `${progress.explored.length} futures`}.</p>}
      <p className="reassure">You can pause anytime. Your place is saved automatically on this device.</p>
    </section>}

    {view === "doors" && <section className="page">
      <button className="back" onClick={() => setView("home")}>← Home</button>
      <p className="eyebrow">Choose one kind of problem</p><h1>What would you like to try?</h1>
      <p className="lead">You can come back and explore a different door later.</p>
      <div className="door-grid">{categories.map((c) => <button className="door" key={c.id} onClick={() => { setCategory(c.id); setView("category"); }}><span>{c.title}</span><small>{c.hint}</small></button>)}</div>
    </section>}

    {view === "category" && <section className="page">
      <button className="back" onClick={() => setView("doors")}>← Problem types</button>
      <p className="eyebrow">{categories.find((x) => x.id === category)?.title}</p><h1>Choose one future to peek inside.</h1>
      <div className="career-list">{careers.filter((c) => c.category === category).map((c) => <article key={c.id} className="career-card"><div><h2>{c.title}</h2><p>{c.mission}</p></div><div className="actions"><button className="primary" onClick={() => openCareer(c.id)}>Open this world</button><button aria-pressed={progress.savedCareers.includes(c.id)} onClick={() => setProgress((p) => ({ ...p, savedCareers: toggle(p.savedCareers, c.id) }))}>{progress.savedCareers.includes(c.id) ? "Saved to explore" : "Save for exploration"}</button></div></article>)}</div>
    </section>}

    {view === "career" && career && <CareerWorld career={career} step={step} setStep={setStep} onLeave={() => setView("category")} progress={progress} setProgress={setProgress} showMoreJobs={showMoreJobs} setShowMoreJobs={setShowMoreJobs} gameScene={gameScene} setGameScene={setGameScene} answers={answers} setAnswers={setAnswers} checkLoad={checkLoad} />}

    {view === "pause" && <section className="page pause"><div className="pause-mark">◌</div><h1>Your place is saved.</h1><p className="lead">You do not need to decide anything right now. Come back when it feels useful.</p><button className="primary" onClick={() => setView("home")}>Leave for now</button><button onClick={() => setView(career ? "career" : "doors")}>I’m ready to continue</button></section>}

    {view === "compare" && <section className="page">
      <button className="back" onClick={() => setView("home")}>← Home</button><p className="eyebrow">Your observations</p><h1>Compare without choosing a winner.</h1>
      {!compareUnlocked ? <div className="notice"><h2>Comparison will be ready soon.</h2><p>Try two complete career experiences, or complete one and save two careers you want to explore.</p><p>Right now: {completedCount} complete and {progress.savedCareers.length} saved.</p></div> : <div className="compare-grid">{careers.filter((c) => progress.completed.includes(c.id) || progress.savedCareers.includes(c.id)).slice(0, 3).map((c) => <article className="career-card" key={c.id}><h2>{c.title}</h2><p>{progress.completed.includes(c.id) ? "You completed this experience." : "You saved this future to explore."}</p><p><strong>Saved jobs:</strong> {c.jobs.filter((j) => progress.savedJobs.includes(`${c.id}:${j.title}`)).map((j) => j.title).join(", ") || "None yet"}</p></article>)}</div>}
    </section>}
  </main>;
}

type WorldProps = { career: Career; step: number; setStep: (n: number) => void; onLeave: () => void; progress: Progress; setProgress: React.Dispatch<React.SetStateAction<Progress>>; showMoreJobs: boolean; setShowMoreJobs: (v: boolean) => void; gameScene: number; setGameScene: (n: number) => void; answers: Record<string, string>; setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>; checkLoad: (v: string) => void };

function CareerWorld({ career, step, setStep, onLeave, progress, setProgress, showMoreJobs, setShowMoreJobs, gameScene, setGameScene, answers, setAnswers, checkLoad }: WorldProps) {
  const visibleJobs = showMoreJobs ? career.jobs : career.jobs.slice(0, 3);
  const game = [
    { title: "Begin with the pattern", text: "A wearable heart monitor is reliable while a patient is sitting, but readings become uneven while walking.", prompt: "What should you examine first?", choices: ["How movement changes contact between the sensor and skin", "Whether the report uses the right font", "Whether the package is easy to open"], feedback: "Movement points first to sensor contact or motion affecting the signal. That is a focused place to gather evidence." },
    { title: "Review the next test", text: "A snugger strap improves some readings, but not all. The software shows large spikes at the exact moments the patient moves.", prompt: "Which next test would separate two possible causes?", choices: ["Compare raw sensor data with motion data", "Change the product name", "Test only while the patient is sitting"], feedback: "Comparing sensor and motion data helps distinguish a physical contact problem from software handling of movement." },
    { title: "Make a recommendation", text: "The sensor stays in contact. Raw heart signals are stable, but motion spikes remain after software filtering.", prompt: "What should the team test next?", choices: ["A revised motion-filtering method", "A different box color", "A longer instruction manual"], feedback: "The evidence now supports testing the motion-filtering method. Engineers narrow uncertainty through successive tests." },
  ];
  const ratings = ["This work made me curious.", "I enjoyed the type of problem I was solving.", "I could picture myself in this work setting.", "The education may be worth it to me.", "I could tolerate the difficult parts.", "I want to learn more about this career."];
  const updateAnswer = (key: string, value: string) => setAnswers((a) => ({ ...a, [key]: value }));
  return <section className="page world">
    <div className="world-head"><button className="back" onClick={onLeave}>← Leave and return later</button><span className="saved">Saved ✓</span></div>
    <p className="eyebrow">{career.title}</p>
    <div className="stepper" aria-label={`Step ${step + 1} of ${steps.length}`}><span>{steps[step]}</span><div>{steps.map((s, i) => <button key={s} aria-label={s} aria-current={i === step ? "step" : undefined} onClick={() => setStep(i)} disabled={!career.playable && i > 2}>{i + 1}</button>)}</div></div>

    {step === 0 && <div className="stage intro"><div className="illustration" aria-label="Abstract medical device workbench illustration"><div className="pulse">⌁</div><div className="device">heart monitor</div></div><div><h1>Meet Future Katie</h1><p className="mission">{career.mission}</p><p className="supporting">{career.intro}</p></div></div>}
    {step === 1 && <div className="stage"><h1>What would you study?</h1><p className="lead">Start with the next useful step. Expand the pathway only when you want it.</p><ol className="timeline">{career.degrees.map((d, i) => <li key={d} className={i > 1 ? "detail-only" : ""}><span>{i + 1}</span><p>{d}</p></li>)}</ol><details><summary>What would I study at UToledo?</summary><div className="ut"><p>This is a planning guide, not an official degree audit. Confirm current programs and requirements with UToledo.</p><ul>{career.utoledo.map((x) => <li key={x}>{x}</li>)}</ul></div></details></div>}
    {step === 2 && <div className="stage"><h1>Jobs this pathway can lead to</h1><p className="lead">Save a specific job when its daily work interests you.</p><div className="jobs">{visibleJobs.map((j) => { const key = `${career.id}:${j.title}`; const saved = progress.savedJobs.includes(key); return <article className="job" key={j.title}><h2>{j.title}</h2><p><strong>Setting:</strong> {j.setting}</p><p>{j.responsibility}</p><ul>{j.traits.map((t) => <li key={t}>{t}</li>)}</ul><button aria-pressed={saved} onClick={() => setProgress((p) => ({ ...p, savedJobs: toggle(p.savedJobs, key) }))}>{saved ? "Saved ✓" : "Save this job"}</button></article>})}</div>{career.jobs.length > 3 && <button onClick={() => setShowMoreJobs(!showMoreJobs)}>{showMoreJobs ? "Show fewer jobs" : "Show more jobs"}</button>}</div>}
    {step === 3 && career.playable && <div className="stage"><h1>A day in biomedical engineering</h1><div className="day"><article><span>9:00</span><h2>Plan the test</h2><p>Review yesterday’s monitor results and decide what evidence the team needs next.</p></article><article><span>11:00</span><h2>Work with the prototype</h2><p>Adjust sensor placement, run a movement test, and inspect the signal.</p></article><article><span>1:30</span><h2>Compare interpretations</h2><p>Meet briefly with a software engineer and a clinical adviser.</p></article><article><span>3:00</span><h2>Document what changed</h2><p>Record the test method, results, limits, and recommended next step.</p></article></div></div>}
    {step === 4 && career.playable && <div className="stage game"><p className="eyebrow">Heart-monitor investigation · Part {gameScene + 1} of 3</p><h1>{game[gameScene].title}</h1><p className="lead">{game[gameScene].text}</p><fieldset><legend>{game[gameScene].prompt}</legend>{game[gameScene].choices.map((c) => <label key={c}><input type="radio" name={`game-${gameScene}`} checked={answers[`game-${gameScene}`] === c} onChange={() => updateAnswer(`game-${gameScene}`, c)} /> {c}</label>)}</fieldset>{answers[`game-${gameScene}`] && <div className="feedback"><strong>What the evidence suggests</strong><p>{game[gameScene].feedback}</p></div>}<button className="primary" disabled={!answers[`game-${gameScene}`]} onClick={() => gameScene < 2 ? setGameScene(gameScene + 1) : setStep(5)}>{gameScene < 2 ? "Continue investigating" : "Finish the investigation"}</button></div>}
    {step === 5 && career.playable && <div className="stage"><h1>The honest reality</h1><div className="reality"><article><h2>What may feel meaningful</h2><ul><li>Turning science and math into practical medical tools</li><li>Solving problems with visible effects on safety or mobility</li><li>Working with people who bring different expertise</li></ul></article><article><h2>What may be difficult</h2><ul><li>Advanced mathematics and physics</li><li>Failed prototypes and slow projects</li><li>Extensive documentation and technical deadlines</li><li>Mistakes may affect safety, cost, or project timelines</li></ul></article></div><dl className="work-facts"><div><dt>Teamwork</dt><dd>Usually works independently for part of the day, with regular design and review meetings.</dd></div><div><dt>Patient contact</dt><dd>Usually little direct patient contact, though some roles include testing with users.</dd></div><div><dt>Schedule</dt><dd>Often predictable, with busier periods near testing or project deadlines.</dd></div></dl></div>}
    {step === 6 && career.playable && <div className="stage reflection"><h1>What did you notice about yourself?</h1><p className="lead">These answers describe this experience. They do not produce a career score.</p>{ratings.map((r, i) => <fieldset key={r}><legend>{r}</legend><div className="scale">{["Not at all", "A little", "Somewhat", "Quite a bit", "Very much"].map((x) => <label key={x}><input type="radio" name={`rating-${i}`} checked={answers[`rating-${i}`] === x} onChange={() => updateAnswer(`rating-${i}`, x)} />{x}</label>)}</div></fieldset>)}<label className="field">What part interested you most?<textarea value={answers.interest || ""} onChange={(e) => updateAnswer("interest", e.target.value)} /></label><label className="field">What part made you hesitate?<textarea value={answers.hesitate || ""} onChange={(e) => updateAnswer("hesitate", e.target.value)} /></label><fieldset><legend>Which part of the education concerns you most? <small>Optional</small></legend><div className="chips">{["Length of schooling", "Cost", "Difficult math or science", "Competitive admission", "Research requirements", "Relocation", "Uncertainty about the final job", "None of these", "Something else"].map((x) => <label key={x}><input type="checkbox" checked={(answers.education || "").split("|").includes(x)} onChange={() => { const vals = (answers.education || "").split("|").filter(Boolean); updateAnswer("education", toggle(vals, x).join("|")); }} />{x}</label>)}</div></fieldset><label className="field">What would you want to see more of?<textarea value={answers.more || ""} onChange={(e) => updateAnswer("more", e.target.value)} /></label><fieldset><legend>Where would you place this future today?</legend><div className="dispositions">{["Explore next", "Keep on my list", "Not for me right now", "Unsure"].map((x) => <label key={x}><input type="radio" name="disposition" checked={answers.disposition === x} onChange={() => updateAnswer("disposition", x)} />{x}</label>)}</div></fieldset><button className="primary" onClick={() => setProgress((p) => ({ ...p, completed: p.completed.includes(career.id) ? p.completed : [...p.completed, career.id], savedCareers: answers.disposition === "Explore next" && !p.savedCareers.includes(career.id) ? [...p.savedCareers, career.id] : p.savedCareers }))}>Save my reflection</button></div>}
    {!career.playable && step > 2 && <div className="stage notice"><h1>This simulation is coming later.</h1><p>You can explore the introduction, education, and job options now. Reflection will open after there is a real experience to react to.</p></div>}
    {step < 6 && (career.playable || step < 2) && <div className="checkpoint"><p>How does this amount of information feel?</p><div><button onClick={() => checkLoad("fine")}>Fine — continue</button><button onClick={() => checkLoad("break")}>I need a break</button><button onClick={() => checkLoad("much")}>Too much at once</button></div></div>}
  </section>;
}
