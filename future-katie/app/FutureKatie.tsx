"use client";

import { useEffect, useMemo, useState } from "react";
import { careers, categories, type Career } from "./career-data";

type View = "home" | "doors" | "category" | "career" | "compare" | "pause";
type CareerState = { step: number; gameScene: number; answers: Record<string, string>; reflectionPart: number; showMoreJobs: boolean };
type Reaction = { curiosity?: string; enjoyment?: string; more?: string; attraction?: string; hesitation?: string; education?: string; disposition?: string };
type Progress = {
  explored: string[]; completed: string[]; savedCareers: string[]; savedJobs: string[];
  lastCareer?: string; careerStates: Record<string, CareerState>; reactions: Record<string, Reaction>;
};

const emptyState = (): CareerState => ({ step: 0, gameScene: 0, answers: {}, reflectionPart: 0, showMoreJobs: false });
const initial: Progress = { explored: [], completed: [], savedCareers: [], savedJobs: [], careerStates: {}, reactions: {} };
const STORE = "future-katie-progress-v2";
const steps = ["Meet Future Katie", "Education", "Job options", "A workday", "Try the work", "Reality check", "Reflection"];
const ratingWords = ["Not at all", "A little", "Somewhat", "Quite a bit", "Very much"];

function toggle(list: string[], value: string) { return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]; }

const fitPatterns: Record<string, { included: string[]; friction: string[] }> = {
  build: { included: ["medical and biological science", "mathematics", "practical problem-solving", "hands-on learning", "meaningful outcomes"], friction: ["advanced physics", "long technical projects", "frequent teamwork"] },
  pattern: { included: ["mathematics", "research", "organized and accurate work", "independent concentration", "meaningful outcomes"], friction: ["substantial coding", "long periods at a computer", "uncertain research outcomes"] },
  disease: { included: ["medical science", "research", "organized and accurate work", "hands-on learning", "independent concentration"], friction: ["repetitive laboratory work", "long education", "uncertain results"] },
  treatment: { included: ["medical science", "research", "hands-on learning", "practical problem-solving", "meaningful outcomes"], friction: ["repetitive laboratory work", "failed experiments", "long education"] },
  system: { included: ["systems and information organization", "practical problem-solving", "mathematics", "meaningful outcomes", "teamwork without constant public interaction"], friction: ["substantial coding", "frequent meetings", "possible patient contact"] },
};

export default function FutureKatie() {
  const [view, setView] = useState<View>("home");
  const [category, setCategory] = useState<string>();
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

  return <main className="app">
    <header className="topbar">
      <button className="brand" onClick={() => setView("home")}>Future Katie</button>
      <nav aria-label="Main navigation"><button onClick={() => setView("doors")}>Explore</button><button onClick={() => { setCompareIds(eligible.slice(0, 3).map((c) => c.id)); setView("compare"); }} disabled={!compareUnlocked}>Compare</button><button onClick={() => window.print()}>Print</button></nav>
    </header>
    {view === "home" && <section className="hero page"><p className="eyebrow">A calm place to explore</p><h1>Try on a future before choosing one.</h1><p className="lead">Katie, explore what different careers actually feel like. There are no wrong answers, and nothing here chooses a career for you.</p><button className="primary" onClick={() => setView("doors")}>{progress.lastCareer ? "Explore another future" : "Start exploring"}</button>{progress.lastCareer && <button className="continue" onClick={() => openCareer(progress.lastCareer!)}>Continue exactly where I stopped in {careers.find((c) => c.id === progress.lastCareer)?.title}</button>}<p className="reassure">You can pause anytime. Your exact place and answers are saved on this device.</p></section>}

    {view === "doors" && <section className="page"><button className="back" onClick={() => setView("home")}>← Home</button><p className="eyebrow">Choose one kind of problem</p><h1>What would you like to try?</h1><p className="lead">You can come back and explore a different door later.</p><div className="door-grid">{categories.map((c) => <button className="door" key={c.id} onClick={() => { setCategory(c.id); setView("category"); }}><span>{c.title}</span><small>{c.hint}</small></button>)}</div></section>}

    {view === "category" && <section className="page"><button className="back" onClick={() => setView("doors")}>← Problem types</button><p className="eyebrow">{categories.find((x) => x.id === category)?.title}</p><h1>Choose one future to peek inside.</h1><div className="career-list">{careers.filter((c) => c.category === category).map((c) => <article key={c.id} className="career-card"><div><h2>{c.title}</h2><p>{c.mission}</p></div><div className="actions"><button className="primary" onClick={() => openCareer(c.id)}>{progress.careerStates[c.id] ? "Continue this world" : "Open this world"}</button><button aria-pressed={progress.savedCareers.includes(c.id)} onClick={() => setProgress((p) => ({ ...p, savedCareers: toggle(p.savedCareers, c.id) }))}>{progress.savedCareers.includes(c.id) ? "Saved to explore" : "Save for exploration"}</button></div></article>)}</div></section>}

    {view === "career" && career && <CareerWorld career={career} state={progress.careerStates[career.id] || emptyState()} saveState={(patch) => saveCareerState(career.id, patch)} onLeave={() => setView("category")} onPause={() => setView("pause")} progress={progress} setProgress={setProgress} />}

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
  const saveReflection = () => {
    const reaction: Reaction = { curiosity: answers.curiosity, enjoyment: answers.enjoyment, more: answers.moreWork, attraction: answers.attraction || answers.attractionOther, hesitation: answers.hesitation || answers.hesitationOther, education: answers.hesitation === "Schooling or training" ? (answers.education || "Worth exploring") : "Not a main concern", disposition: answers.disposition };
    setProgress((p) => ({ ...p, completed: p.completed.includes(career.id) ? p.completed : [...p.completed, career.id], savedCareers: answers.disposition === "Keep on my list" && !p.savedCareers.includes(career.id) ? [...p.savedCareers, career.id] : p.savedCareers, reactions: { ...p.reactions, [career.id]: reaction } }));
  };

  return <section className="page world"><div className="world-head"><button className="back" onClick={onLeave}>← Leave and return later</button><span className="saved" aria-live="polite">Place and answers saved on this device</span></div><p className="eyebrow">{career.title}</p><div className="stepper" aria-label={`Step ${step + 1} of ${career.playable ? steps.length : 3}`}><span>{steps[step]}</span><div>{steps.map((s, i) => <button key={s} aria-label={s} aria-current={i === step ? "step" : undefined} onClick={() => saveState({ step: i })} disabled={(!career.playable && i > 2) || (career.playable && i > step + 1)}>{i + 1}</button>)}</div></div>

    {step === 0 && <div className="stage"><div className="intro"><div className="illustration" aria-label="Abstract career workbench"><div className="pulse">⌁</div><div className="device">future preview</div></div><div><h1>Meet Future Katie</h1><p className="mission">{career.mission}</p><p className="supporting">{career.intro}</p></div></div><div className="fit-card"><h2>Why this future was included for Katie</h2><p>This future was included because it uses several activities Katie reported being interested in. That does not mean it is the right career for her.</p><div className="fit-columns"><div><h3>Patterns it may use</h3><ul>{fit.included.map((x) => <li key={x}>{x}</li>)}</ul></div><div><h3>Possible friction to notice</h3><ul>{fit.friction.map((x) => <li key={x}>{x}</li>)}</ul></div></div></div></div>}
    {step === 1 && <div className="stage"><h1>What would you study?</h1><p className="lead">Start with the next useful step. Expand the pathway only when you want it.</p><ol className="timeline">{career.degrees.map((d, i) => <li key={d} className={i > 1 ? "detail-only" : ""}><span>{i + 1}</span><p>{d}</p></li>)}</ol><details><summary>What could I prepare for at UToledo?</summary><div className="ut"><p>This is a planning guide, not an official degree audit. Confirm current programs and requirements with UToledo.</p><ul>{career.utoledo.map((x) => <li key={x}>{x}</li>)}</ul></div></details></div>}
    {step === 2 && <div className="stage"><h1>Jobs this pathway can lead to</h1><p className="lead">Save a specific job when its daily work interests you.</p><div className="jobs">{visibleJobs.map((j) => { const key = `${career.id}:${j.title}`; const saved = progress.savedJobs.includes(key); return <article className="job" key={j.title}><h2>{j.title}</h2><p><strong>Setting:</strong> {j.setting}</p><p>{j.responsibility}</p><ul>{j.traits.map((t) => <li key={t}>{t}</li>)}</ul><button aria-pressed={saved} onClick={() => setProgress((p) => ({ ...p, savedJobs: toggle(p.savedJobs, key) }))}>{saved ? "Saved ✓" : "Save this job"}</button></article>; })}</div>{career.jobs.length > 3 && <button onClick={() => saveState({ showMoreJobs: !showMoreJobs })}>{showMoreJobs ? "Show fewer jobs" : "Show more jobs"}</button>}{!career.playable && <div className="preview-ending notice"><h2>This work simulation is still being developed.</h2><p>You can save this future, explore something else, or stop for today. Nothing here asks you to choose a career.</p><div className="ending-actions"><button className="primary" onClick={saveFuture}>Save this future</button><button onClick={onLeave}>Explore another career</button><button onClick={onPause}>Stop for today</button></div></div>}</div>}
    {step === 3 && career.playable && <div className="stage"><h1>A day in biomedical engineering</h1><div className="day"><article><span>9:00</span><h2>Plan the test</h2><p>Review yesterday’s monitor results and decide what evidence the team needs next.</p></article><article><span>11:00</span><h2>Work with the prototype</h2><p>Adjust sensor placement, run a movement test, and inspect the signal.</p></article><article><span>1:30</span><h2>Compare interpretations</h2><p>Meet briefly with a software engineer and a clinical adviser.</p></article><article><span>3:00</span><h2>Document what changed</h2><p>Record the test method, results, limits, and recommended next step.</p></article></div></div>}
    {step === 4 && career.playable && <div className="stage game"><p className="eyebrow">Heart-monitor investigation · Part {gameScene + 1} of 3</p><h1>{game[gameScene].title}</h1><p className="lead">{game[gameScene].text}</p><fieldset><legend>{game[gameScene].prompt}</legend>{game[gameScene].choices.map(([choice]) => <label key={choice}><input type="radio" name={`game-${gameScene}`} checked={selectedGame === choice} onChange={() => updateAnswer(`game-${gameScene}`, choice)} /> {choice}</label>)}</fieldset>{selectedFeedback && <div className="feedback"><strong>What this choice would help you learn</strong><p>{selectedFeedback}</p></div>}<button className="primary" disabled={!selectedGame} onClick={() => gameScene < 2 ? saveState({ gameScene: gameScene + 1 }) : saveState({ step: 5 })}>{gameScene < 2 ? "Continue investigating" : "Finish the investigation"}</button></div>}
    {step === 5 && career.playable && <div className="stage"><h1>The honest reality</h1><div className="reality"><article><h2>What may feel meaningful</h2><ul><li>Turning science and math into practical medical tools</li><li>Solving problems with visible effects on safety or mobility</li><li>Working with people who bring different expertise</li></ul></article><article><h2>What may be difficult</h2><ul><li>Advanced mathematics and physics</li><li>Failed prototypes and slow projects</li><li>Extensive documentation and technical deadlines</li></ul></article></div><dl className="work-facts"><div><dt>Teamwork</dt><dd>Independent focus plus regular design and review meetings.</dd></div><div><dt>Patient contact</dt><dd>Usually little, though some roles include testing with users.</dd></div><div><dt>Schedule</dt><dd>Often predictable, with busier testing periods.</dd></div></dl></div>}
    {step === 6 && career.playable && <div className="stage reflection"><p className="eyebrow">Reflection · Part {reflectionPart + 1} of 3</p>{reflectionPart === 0 && <><h1>How did the work feel?</h1>{[["curiosity", "This made me curious."], ["enjoyment", "I liked the kind of problem."], ["moreWork", "I could picture myself doing more of it."]].map(([key, label]) => <fieldset key={key}><legend>{label}</legend><div className="scale">{ratingWords.map((x) => <label key={x}><input type="radio" name={key} checked={answers[key] === x} onChange={() => updateAnswer(key, x)} />{x}</label>)}</div></fieldset>)}<button className="primary" disabled={!answers.curiosity || !answers.enjoyment || !answers.moreWork} onClick={() => saveState({ reflectionPart: 1 })}>Continue</button></>}{reflectionPart === 1 && <><h1>What stood out?</h1><fieldset><legend>Main attraction</legend><div className="chips">{["Solving the problem", "Designing and testing", "Medical purpose", "Quiet focused work", "Working with a team", "Seeing evidence"].map((x) => <label key={x}><input type="radio" name="attraction" checked={answers.attraction === x} onChange={() => updateAnswer("attraction", x)} />{x}</label>)}</div></fieldset><fieldset><legend>Main hesitation</legend><div className="chips">{["Schooling or training", "Math or physics", "Computer time", "Meetings", "Slow or failed tests", "Nothing yet"].map((x) => <label key={x}><input type="radio" name="hesitation" checked={answers.hesitation === x} onChange={() => updateAnswer("hesitation", x)} />{x}</label>)}</div></fieldset>{answers.hesitation === "Schooling or training" && <fieldset><legend>What about the education concerns you?</legend><div className="chips">{["Length", "Cost", "Difficult courses", "Admission", "Relocation", "Uncertain final job"].map((x) => <label key={x}><input type="radio" name="education" checked={answers.education === x} onChange={() => updateAnswer("education", x)} />{x}</label>)}</div></fieldset>}<label className="field">Anything else? <small>Optional</small><textarea value={answers.attractionOther || ""} onChange={(e) => updateAnswer("attractionOther", e.target.value)} /></label><button onClick={() => saveState({ reflectionPart: 0 })}>Back</button> <button className="primary" disabled={!answers.attraction || !answers.hesitation} onClick={() => saveState({ reflectionPart: 2 })}>Continue</button></>}{reflectionPart === 2 && <><h1>What should happen next?</h1><p className="lead">This is only where you would place this future today.</p><fieldset><legend>Choose one</legend><div className="dispositions">{["Explore next", "Keep on my list", "Not for me right now", "Unsure"].map((x) => <label key={x}><input type="radio" name="disposition" checked={answers.disposition === x} onChange={() => updateAnswer("disposition", x)} />{x}</label>)}</div></fieldset><button onClick={() => saveState({ reflectionPart: 1 })}>Back</button> <button className="primary" disabled={!answers.disposition} onClick={saveReflection}>Save this reflection</button>{progress.completed.includes(career.id) && <p className="save-confirmation" role="status">Reflection saved. You can compare this experience or leave it here for today.</p>}</>}</div>}

    {career.playable && step < 6 && <div className="checkpoint"><button className="primary" onClick={nextStep}>{step === 5 ? "Reflect on this experience" : "Continue"}</button><button onClick={onPause}>Pause and return later</button></div>}
  </section>;
}
