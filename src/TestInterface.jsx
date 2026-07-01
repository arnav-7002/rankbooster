import { useState, useEffect, useRef, useCallback } from "react";

const IMPORTER_API = "";

function cleanId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function blockImageAction(e) {
  e.preventDefault();
  e.stopPropagation();
}

function testIdentity(test) {
  return cleanId(test?.id || test?.testId || test?.sourceZip || test?.name || "");
}

const Q_STATUS = {
  NOT_VISITED:     "not_visited",
  NOT_ANSWERED:    "not_answered",
  ANSWERED:        "answered",
  MARKED:          "marked",
  ANSWERED_MARKED: "answered_marked",
};

const STATUS_STYLE = {
  not_visited:     { bg:"#F2F2F2", color:"#555", border:"#B9B9B9" },
  not_answered:    { bg:"#E64A19", color:"white", border:"#B9320E" },
  answered:        { bg:"#69B915", color:"white", border:"#4F9B0B" },
  marked:          { bg:"#8061A8", color:"white", border:"#6D5092" },
  answered_marked: { bg:"#8061A8", color:"white", border:"#6D5092", dot:true },
};

const I = ({ n, s=16, c }) => {
  const icons = {
    bookmark:      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>,
    "bookmark-fill":<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="currentColor"/>,
    chevdown:      <polyline points="6 9 12 15 18 9"/>,
    chevup:        <polyline points="18 15 12 9 6 15"/>,
    chevleft:      <polyline points="15 18 9 12 15 6"/>,
    chevright:     <polyline points="9 18 15 12 9 6"/>,
    clock:         <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    zoom:          <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></>,
    info:          <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    x:             <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check:         <polyline points="20 6 9 17 4 12"/>,
    submit:        <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    solution:      <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
    warning:       <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    "wifi-off":    <><path d="m1 1 22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 21 12.9"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a16 16 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
    "check-circle":<><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></>,
    user:          <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    accessibility: <><circle cx="12" cy="4" r="2"/><path d="M4 20h16M12 14v6M8 10h8"/></>,
    magnify:       <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    dropdown:      <polyline points="6 9 12 15 18 9"/>,
    notvisit:      <><rect x="3" y="3" width="18" height="18" rx="2"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[n]||null}</svg>;
};

// ─── TIMER HOOK ───────────────────────────────────────────────────────────────
function useTimer(totalSeconds, onEnd, paused = false) {
  const [secs, setSecs] = useState(totalSeconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;

  useEffect(() => {
    const id = setInterval(() => {
      if (paused) return;
      setSecs(p => {
        if (p <= 1) { clearInterval(id); endRef.current?.(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const fmt = h > 0
    ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return { fmt, urgent: secs < 300, secs };
}

// ─── LIGHTBOX ─────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose, watermarkEmail = "" }) {
  if (!src) return null;
  const watermarkTiles = Array.from({ length: 36 });
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div className="test-lightbox-image-wrap" style={{ position:"relative" }} onClick={e=>e.stopPropagation()} onContextMenu={blockImageAction} onDragStart={blockImageAction}>
        <img src={src} alt="" draggable={false} style={{ maxWidth:"92vw",maxHeight:"88vh",objectFit:"contain",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",display:"block" }} />
        {watermarkEmail && (
          <div className="test-watermark-layer" aria-hidden="true">
            {watermarkTiles.map((_, wi) => <span key={wi}>{watermarkEmail}</span>)}
          </div>
        )}
        <button onClick={onClose} style={{ position:"absolute",top:-14,right:-14,width:28,height:28,borderRadius:"50%",background:"#1e1e2e",border:"1px solid rgba(255,255,255,0.2)",color:"#94A3B8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <I n="x" s={14}/>
        </button>
      </div>
    </div>
  );
}

// ─── SUBMIT MODAL ─────────────────────────────────────────────────────────────
function SubmitModal({ counts, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ background:"white",border:"1px solid #D1D5DB",borderRadius:8,padding:28,width:420,fontFamily:"'Inter',sans-serif" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
          <I n="warning" s={20} c="#D97706"/>
          <span style={{ fontSize:16,fontWeight:700,color:"#111827" }}>Submit Test?</span>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20 }}>
          {[
            { label:"Answered",         val:counts.answered||0,                                  color:"#10B981" },
            { label:"Not Answered",      val:counts.not_answered||0,                              color:"#EF4444" },
            { label:"Not Visited",       val:counts.not_visited||0,                               color:"#9CA3AF" },
            { label:"Marked for Review", val:(counts.marked||0)+(counts.answered_marked||0),       color:"#8B5CF6" },
          ].map(r=>(
            <div key={r.label} style={{ background:"#F9FAFB",borderRadius:6,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:12,color:"#6B7280" }}>{r.label}</span>
              <span style={{ fontSize:18,fontWeight:700,color:r.color }}>{r.val}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize:12,color:"#6B7280",marginBottom:20,lineHeight:1.6 }}>Answered & Marked questions will also be evaluated.</p>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onCancel} style={{ flex:1,padding:11,background:"white",border:"1px solid #D1D5DB",borderRadius:6,color:"#374151",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:600 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1,padding:11,background:"#2563EB",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700 }}>Submit Test</button>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION INFO MODAL ───────────────────────────────────────────────────────
function SectionInfoModal({ section, onClose }) {
  if (!section) return null;
  const cm = section.questions[0]?.marks?.cm ?? 4;
  const im = section.questions[0]?.marks?.im ?? -1;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ background:"white",border:"1px solid #E5E7EB",borderRadius:8,padding:24,width:400,fontFamily:"'Inter',sans-serif" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <span style={{ fontSize:15,fontWeight:700,color:"#111827" }}>{section.name}</span>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#9CA3AF",cursor:"pointer" }}><I n="x" s={18}/></button>
        </div>
        <div style={{ background:"#F9FAFB",borderRadius:8,padding:16,fontSize:13,color:"#374151",lineHeight:2 }}>
          <div>Total Questions: <strong style={{color:"#111827"}}>{section.questions.length}</strong></div>
          <div>Question Type: <strong style={{color:"#111827"}}>{section.questions[0]?.type?.toUpperCase()||"MCQ"}</strong></div>
          <div>Correct Marks: <strong style={{color:"#10B981"}}>+{cm}</strong></div>
          <div>Wrong Marks: <strong style={{color:"#EF4444"}}>{im}</strong></div>
          <div>Max Marks: <strong style={{color:"#111827"}}>{section.questions.reduce((a,q)=>a+(q.marks?.cm||0),0)}</strong></div>
        </div>
        <button onClick={onClose} style={{ width:"100%",marginTop:16,padding:10,background:"#2563EB",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:600 }}>Got it</button>
      </div>
    </div>
  );
}

// ─── MAIN TEST INTERFACE ──────────────────────────────────────────────────────
export default function TestInterface({ test, user, onExit, onAttemptSaved }) {
  const subjects = normalizeTest(test);
  const resumeState = test.resume || null;
  const totalQ = subjects.reduce((a,s)=>a+s.questions.length,0);
  const examConfig = test.examConfig || test.config || {};
  const extraInstructions = String(examConfig.instructions || examConfig.instructionText || "").trim();
  const examType = String(examConfig.examType || test.examType || "other").trim().toLowerCase().replace(/\s+/g, "_");
  const isBonusSubject = (s) => /\bbonus\b/i.test(String(s?.name || ""));
  const isSuprSubject = (s) => String(s?.name || "").toLowerCase().includes("supr");
  const isReapSubject = (s) => String(s?.name || "").toLowerCase().includes("reap");
  const bonusIndex = subjects.findIndex(isBonusSubject);
  const hasBitsatBonus = examType === "bitsat" && examConfig.bitsatHasBonus !== false && bonusIndex >= 0;
  const suprIndices = subjects.map((s, i) => isSuprSubject(s) ? i : -1).filter(i => i >= 0);
  const reapIndices = subjects.map((s, i) => isReapSubject(s) ? i : -1).filter(i => i >= 0);

  const [secIdx, setSecIdx]   = useState(() => Math.max(0, Math.min(subjects.length - 1, Number(resumeState?.secIdx || 0))));
  const [qIdx, setQIdx]       = useState(() => Math.max(0, Number(resumeState?.qIdx || 0)));
  const [bitsatBonusEntered, setBitsatBonusEntered] = useState(() => !!resumeState?.bitsatBonusEntered);
  const [responses, setResponses] = useState(() => resumeState?.responses || {});
  const [draftResponses, setDraftResponses] = useState(() => resumeState?.draftResponses || {});
  const [statuses, setStatuses] = useState(() => {
    const s={};
    subjects.forEach(subj=>subj.questions.forEach(q=>{ s[q.id]=Q_STATUS.NOT_VISITED; }));
    return { ...s, ...(resumeState?.statuses || {}) };
  });
  const [showSubmit, setShowSubmit]       = useState(false);
  const [showSecInfo, setShowSecInfo]     = useState(false);
  const [showResults, setShowResults]     = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [showInstructions, setShowInstructions] = useState(() => !resumeState);
  const [lightbox, setLightbox]           = useState(null);
  const [lazyImages, setLazyImages]       = useState({});
  const [loadingImage, setLoadingImage]   = useState(false);
  const [rulesOpen, setRulesOpen]         = useState(true);
  const [sideOpen, setSideOpen]           = useState(true);
  const [tip, setTip]                     = useState(null);
  const [isOnline, setIsOnline]           = useState(() => navigator.onLine !== false);
  const [guardPaused, setGuardPaused]     = useState(false);
  const [guardReason, setGuardReason]     = useState("");
  const [riskEvents, setRiskEvents]       = useState(resumeState?.riskEvents || []);
  const examRootRef = useRef(null);
  const attemptSavedRef = useRef(false);
  const questionTimesRef = useRef(resumeState?.questionTimes || {});
  const activeTimeRef = useRef({ id: null, at: null });
  const resumeSaveBusyRef = useRef(false);
  const resumeLastSavedRef = useRef("");
  const resumePendingRef = useRef(false);

  const activeSubject = subjects[secIdx];
  const activeQ       = activeSubject?.questions[qIdx];
  const activeQId     = activeQ?.id;
  const globalQNum    = subjects.slice(0,secIdx).reduce((a,s)=>a+s.questions.length,0) + qIdx + 1;
  const timer         = useTimer(Number(resumeState?.timerSecs || resumeState?.remainingSeconds || ((test.duration||180)*60)), ()=>setShowResults(true), guardPaused || !isOnline || showInstructions || showResults || submitting);
  const timingPaused  = guardPaused || !isOnline || showInstructions || showResults || submitting;
  const elapsedSecs   = (test.duration || 180) * 60 - timer.secs;
  const ugeeReapPhase = examType === "ugee" && elapsedSecs >= (examConfig.ugeeSuprMinutes || 60) * 60;
  const activeLazyImages = activeQId ? lazyImages[activeQId] : null;
  const currentImages = activeQ?.images?.length ? activeQ.images : (activeLazyImages || []);
  const watermarkEmail = String(user?.email || "").trim();
  const watermarkTiles = Array.from({ length: 28 });

  const flushQuestionTiming = useCallback(() => {
    const now = Date.now();
    const cur = activeTimeRef.current;
    if (cur.id && cur.at) {
      questionTimesRef.current[cur.id] = (questionTimesRef.current[cur.id] || 0) + Math.max(0, Math.round((now - cur.at) / 1000));
    }
    activeTimeRef.current = !timingPaused && activeQ?.id ? { id: activeQ.id, at: now } : { id: null, at: null };
    return { ...questionTimesRef.current };
  }, [activeQ?.id, timingPaused]);

  async function enterFullscreen() {
    const el = examRootRef.current || document.documentElement;
    try {
      if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen();
    } catch {}
  }

  const pauseFor = useCallback((reason) => {
    if (showInstructions || showResults) return;
    setRiskEvents(prev => [...prev, { reason, at: new Date().toISOString(), qId: activeQId || "", qNum: globalQNum || 0 }].slice(-80));
    setGuardReason(reason);
    setGuardPaused(true);
  }, [activeQId, globalQNum, showInstructions, showResults]);

  async function resumeExam() {
    if (!isOnline) return;
    await enterFullscreen();
    setGuardPaused(false);
    setGuardReason("");
  }

  useEffect(() => {
    if (showInstructions || showResults) return;
    const onVisibility = () => {
      if (document.hidden) pauseFor("You switched away from the test tab.");
    };
    const onBlur = () => pauseFor("The test window lost focus.");
    const onFullscreen = () => {
      if (!document.fullscreenElement) pauseFor("Fullscreen mode was exited.");
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("blur", onBlur);
    };
  }, [showInstructions, showResults, pauseFor]);

  // Mark as visited
  useEffect(() => {
    if (!activeQ) return;
    setStatuses(p => p[activeQ.id]===Q_STATUS.NOT_VISITED ? {...p,[activeQ.id]:Q_STATUS.NOT_ANSWERED} : p);
  }, [activeQ]);

  useEffect(() => {
    if (!activeQId) return;
    setDraftResponses({ [activeQId]: responses[activeQId] || [] });
  }, [activeQId, responses]);

  useEffect(() => {
    if (!activeQId) return;
    const mathJax = window.MathJax;
    if (!mathJax?.typesetPromise) return;
    const timer = setTimeout(() => {
      mathJax.typesetPromise().catch(() => {});
    }, 0);
    return () => clearTimeout(timer);
  }, [activeQId, activeQ?.html, activeQ?.questionHtml]);

  useEffect(() => {
    flushQuestionTiming();
  }, [flushQuestionTiming]);

  useEffect(() => {
    if (!ugeeReapPhase || reapIndices.length === 0) return;
    if (!reapIndices.includes(secIdx)) {
      setSecIdx(reapIndices[0]);
      setQIdx(0);
    }
  }, [ugeeReapPhase, reapIndices, secIdx]);

  useEffect(() => {
    let cancelled = false;
    if (!activeQId || activeQ?.images?.length || activeLazyImages || !test.sourceZip) return undefined;
    const course = test.courseTitle || test.courseName;
    const folder = test.sourceFolder || test.folderName || test.folder;
    if (!course || !folder) return undefined;
    setLoadingImage(true);
    const qs = new URLSearchParams({ course, folder, zip: test.sourceZip, qId: activeQId });
    fetch(`${IMPORTER_API}/question-images?${qs.toString()}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled && data?.images) setLazyImages(prev => ({ ...prev, [activeQId]: data.images }));
      })
      .catch(() => null)
      .finally(() => { if (!cancelled) setLoadingImage(false); });
    return () => { cancelled = true; };
  }, [activeQId, activeQ?.images, activeLazyImages, test.courseName, test.courseTitle, test.folder, test.folderName, test.sourceFolder, test.sourceZip]);

  const counts = Object.values(statuses).reduce((a,s)=>{ a[s]=(a[s]||0)+1; return a; },{});

  function handleSelect(opt) {
    if (!activeQ) return;
    setDraftResponses(p=>{
      const cur=p[activeQ.id]||[];
      const next = activeQ.type==="multi"
        ? cur.includes(opt)?cur.filter(x=>x!==opt):[...cur,opt]
        : cur.includes(opt)?[]:[opt];
      return {...p,[activeQ.id]:next};
    });
  }

  function savedResponseFor(q) {
    return responses[q.id] || [];
  }

  function normalQuestionsAttemptedForBitsat() {
    if (!hasBitsatBonus) return true;
    return subjects
      .filter((_, i) => i !== bonusIndex)
      .flatMap(s => s.questions || [])
      .every(q => savedResponseFor(q).length > 0);
  }

  function canOpenSection(si) {
    if (hasBitsatBonus) {
      if (si === bonusIndex && !normalQuestionsAttemptedForBitsat()) return false;
      if (bitsatBonusEntered && si !== bonusIndex) return false;
    }
    if (examType === "ugee") {
      if (ugeeReapPhase && suprIndices.includes(si)) return false;
      if (!ugeeReapPhase && reapIndices.length > 0 && reapIndices.includes(si)) return false;
    }
    return true;
  }

  function jumpToSection(si, qi = 0) {
    if (!canOpenSection(si)) {
      if (hasBitsatBonus && si === bonusIndex) alert("Bonus unlocks only after you have attempted every normal question.");
      else if (hasBitsatBonus && bitsatBonusEntered) alert("You cannot return to normal questions after entering Bonus.");
      else if (examType === "ugee") alert(ugeeReapPhase ? "SUPR time is over. You are now in REAP." : "REAP unlocks after the first 60 minutes.");
      return;
    }
    if (hasBitsatBonus && si === bonusIndex) setBitsatBonusEntered(true);
    setSecIdx(si);
    setQIdx(qi);
  }

  function clearResponse() {
    if (!activeQ) return;
    setResponses(p=>({...p,[activeQ.id]:[]}));
    setDraftResponses({ [activeQ.id]: [] });
    setStatuses(p=>({...p,[activeQ.id]:Q_STATUS.NOT_ANSWERED}));
  }

  function saveAndNext() {
    if (!activeQ) return;
    const resp=draftResponses[activeQ.id]||[];
    setResponses(p=>({...p,[activeQ.id]:resp}));
    setStatuses(p=>({...p,[activeQ.id]:resp.length>0?Q_STATUS.ANSWERED:Q_STATUS.NOT_ANSWERED}));
    goNext();
  }

  function markForReview() {
    if (!activeQ) return;
    const resp=draftResponses[activeQ.id]||[];
    setResponses(p=>({...p,[activeQ.id]:resp}));
    setStatuses(p=>({...p,[activeQ.id]:resp.length>0?Q_STATUS.ANSWERED_MARKED:Q_STATUS.MARKED}));
    goNext();
  }

  function goNext() {
    if (qIdx<activeSubject.questions.length-1) setQIdx(qIdx+1);
    else if (secIdx<subjects.length-1) {
      const nextIdx = subjects.findIndex((_, i) => i > secIdx && canOpenSection(i));
      if (nextIdx >= 0) jumpToSection(nextIdx, 0);
    }
  }

  function goPrev() {
    if (qIdx>0) setQIdx(qIdx-1);
    else if (secIdx>0) {
      for (let i = secIdx - 1; i >= 0; i--) {
        if (canOpenSection(i)) {
          const p=subjects[i];
          jumpToSection(i, p.questions.length-1);
          break;
        }
      }
    }
  }

  function setIntegerAnswer(value) {
    if (!activeQ) return;
    const clean = String(value || "").replace(/[^\d.-]/g, "").replace(/(?!^)-/g, "");
    setDraftResponses(p => ({ ...p, [activeQ.id]: clean !== "" ? [clean] : [] }));
  }

  function pressNumpad(key) {
    const cur = String(selectedOpts[0] ?? "");
    if (key === "back") return setIntegerAnswer(cur.slice(0, -1));
    if (key === "clear") return setIntegerAnswer("");
    if (key === "-") return setIntegerAnswer(cur.startsWith("-") ? cur.slice(1) : `-${cur}`);
    if (key === "." && cur.includes(".")) return;
    setIntegerAnswer(cur + key);
  }

  const numOpts = parseInt(activeQ?.answerOptions)||4;
  const selectedOpts = draftResponses[activeQId]||[];
  const examName = examType === "other"
    ? (examConfig.customExamName || test.name || "Mock")
    : examType.replace("_", " ").toUpperCase();
  const testTitle = `${examName} MOCK TEST`;
  const activeSectionMarks = activeSubject?.questions.reduce((a,q)=>a+(q.marks?.cm||0),0) || 0;
  const activeCm = activeQ?.marks?.cm ?? 4;
  const activeIm = Math.abs(activeQ?.marks?.im ?? -1);
  const paletteRows = [
    {status:"answered", label:"Answered", count:counts.answered||0},
    {status:"not_answered", label:"Not Answered", count:counts.not_answered||0},
    {status:"not_visited", label:"Not Visited", count:counts.not_visited||0},
    {status:"marked", label:"Marked for Review", count:counts.marked||0},
    {status:"answered_marked", label:"Answered & Marked for Review (will be evaluated)", count:counts.answered_marked||0},
  ];

  function statusCountsFor(subjectsToCount) {
    const ids = subjectsToCount.flatMap(s => s.questions.map(q => q.id));
    return ids.reduce((acc, id) => {
      const st = statuses[id] || Q_STATUS.NOT_VISITED;
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});
  }

  function statusTip(countsObj) {
    return [
      ["Answered", countsObj.answered || 0],
      ["Not Answered", countsObj.not_answered || 0],
      ["Not Visited", countsObj.not_visited || 0],
      ["Marked for Review", countsObj.marked || 0],
      ["Answered & Marked for Review (will be evaluated)", countsObj.answered_marked || 0],
    ];
  }

  const buildAttemptSummary = useCallback(() => {
    const questionTimes = flushQuestionTiming();
    let correct = 0, wrong = 0, unattempted = 0, totalMarks = 0, scored = 0;
    const attemptedQuestions = [];
    const subjectRows = subjects.map(subject => {
      let subjectCorrect = 0, subjectWrong = 0, subjectAttempted = 0, subjectScore = 0, subjectMax = 0, subjectTime = 0;
      subject.questions.forEach(q => {
        const cm = q.marks?.cm || 4;
        const im = q.marks?.im || -1;
        const resp = responses[q.id] || [];
        const timeSpentSec = Number(questionTimes[q.id] || 0);
        const ca = (Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]).filter(v => v !== undefined && v !== null).map(Number);
        const ua = resp.map(Number);
        const attempted = ua.length > 0;
        const ok = attempted && ca.length === ua.length && ca.every(x => ua.includes(x));
        const marksAwarded = ok ? cm : attempted ? im : 0;

        totalMarks += cm;
        subjectMax += cm;
        subjectTime += timeSpentSec;
        if (!attempted) {
          unattempted++;
          return;
        }
        subjectAttempted++;
        if (ok) {
          correct++;
          subjectCorrect++;
        } else {
          wrong++;
          subjectWrong++;
        }
        scored += marksAwarded;
        subjectScore += marksAwarded;
        attemptedQuestions.push({
          qId: q.id,
          globalQNum: q.globalQNum || attemptedQuestions.length + 1,
          subject: subject.name,
          type: q.type || "mcq",
          selected: resp,
          correctAnswer: ca,
          isCorrect: ok,
          marksAwarded,
          timeSpentSec,
        });
      });
      return {
        id: subject.id,
        name: subject.name,
        totalQuestions: subject.questions.length,
        attempted: subjectAttempted,
        correct: subjectCorrect,
        wrong: subjectWrong,
        score: subjectScore,
        maxMarks: subjectMax,
        timeSpentSec: subjectTime,
      };
    });

    const timeSpentSec = Object.values(questionTimes).reduce((a, v) => a + Number(v || 0), 0);
    const percentage = totalMarks > 0 ? Math.round((scored / totalMarks) * 100) : 0;
    return {
      attemptId: `attempt_${Date.now()}`,
      submittedAt: new Date().toISOString(),
      courseId: test.courseId || null,
      courseTitle: test.courseTitle || "",
      folderId: test.folderId || null,
      folderName: test.folderName || test.folder || "",
      testId: test.id || null,
      testName: test.name || "Test",
      sourceZip: test.sourceZip || test.zipName || "",
      sourceUrl: test.sourceUrl || "",
      durationMinutes: test.duration || 180,
      timeSpentSec,
      maxMarks: totalMarks,
      score: scored,
      percentage,
      correct,
      wrong,
      unattempted,
      totalQuestions: totalQ,
      subjects: subjectRows,
      questionTimes,
      riskEvents,
      attemptedQuestions,
    };
  }, [responses, riskEvents, subjects, test, totalQ, flushQuestionTiming]);

  const buildResumeState = useCallback(() => {
    const questionTimes = flushQuestionTiming();
    return {
      secIdx,
      qIdx,
      bitsatBonusEntered,
      responses,
      draftResponses,
      statuses,
      questionTimes,
      riskEvents,
      timerSecs: timer.secs,
      elapsedSecs,
      courseId: test.courseId || null,
      courseTitle: test.courseTitle || "",
      folderId: test.folderId || null,
      folderName: test.folderName || test.folder || "",
      testId: testIdentity(test),
      testName: test.name || "Test",
      sourceZip: test.sourceZip || test.zipName || "",
      sourceUrl: test.sourceUrl || "",
      savedAt: new Date().toISOString(),
    };
  }, [bitsatBonusEntered, draftResponses, elapsedSecs, flushQuestionTiming, qIdx, responses, riskEvents, secIdx, statuses, test, timer.secs]);

  const resumeStateFingerprint = useCallback(() => JSON.stringify({
    secIdx,
    qIdx,
    bitsatBonusEntered,
    responses,
    draftResponses,
    statuses,
    riskEvents,
  }), [bitsatBonusEntered, draftResponses, qIdx, responses, riskEvents, secIdx, statuses]);

  const saveResumeDraft = useCallback((keepalive = false) => {
    if (!user?.offlineId || showResults || submitting || attemptSavedRef.current) return;
    if (resumeSaveBusyRef.current && !keepalive) return;
    const fingerprint = resumeStateFingerprint();
    if (!keepalive && fingerprint === resumeLastSavedRef.current) return;
    const state = buildResumeState();
    const body = JSON.stringify({
      user: { offlineId: user.offlineId, email: user.email },
      state,
      testId: state.testId,
      courseId: state.courseId,
    });
    resumePendingRef.current = false;
    resumeSaveBusyRef.current = true;
    fetch(`${IMPORTER_API}/attempt-resumes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive,
    }).then(res => {
      if (res?.ok !== false) resumeLastSavedRef.current = fingerprint;
      else resumePendingRef.current = true;
    }).catch(() => {
      resumePendingRef.current = true;
    }).finally(() => { resumeSaveBusyRef.current = false; });
  }, [buildResumeState, resumeStateFingerprint, showResults, submitting, user?.email, user?.offlineId]);

  useEffect(() => {
    if (showInstructions || showResults || submitting) return undefined;
    resumePendingRef.current = true;
    const id = setTimeout(() => saveResumeDraft(false), 350);
    return () => clearTimeout(id);
  }, [saveResumeDraft, showInstructions, showResults, submitting, secIdx, qIdx, bitsatBonusEntered, responses, draftResponses, statuses]);

  useEffect(() => {
    if (showInstructions || showResults || submitting) return undefined;
    const onBeforeUnload = () => {
      if (resumePendingRef.current || resumeStateFingerprint() !== resumeLastSavedRef.current) saveResumeDraft(true);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      if (resumePendingRef.current || resumeStateFingerprint() !== resumeLastSavedRef.current) saveResumeDraft(true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [resumeStateFingerprint, saveResumeDraft, showInstructions, showResults, submitting]);

  useEffect(() => {
    if (showInstructions || showResults || submitting) return undefined;
    const handleOffline = () => {
      setIsOnline(false);
      if (resumePendingRef.current || resumeStateFingerprint() !== resumeLastSavedRef.current) saveResumeDraft(true);
      pauseFor("Internet connection lost. Your test is paused until the connection comes back.");
    };
    const handleOnline = () => {
      setIsOnline(true);
      setGuardReason("Back online. Your saved progress is ready; resume when you are ready.");
      saveResumeDraft(false);
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    if (navigator.onLine === false) handleOffline();
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [pauseFor, resumeStateFingerprint, saveResumeDraft, showInstructions, showResults, submitting]);

  const saveAttemptOnce = useCallback(async () => {
    if (attemptSavedRef.current) return;
    attemptSavedRef.current = true;
    const attempt = buildAttemptSummary();

    try {
      await fetch(`${IMPORTER_API}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, attempt }),
      }).catch(() => null);
      onAttemptSaved?.(attempt);
    } catch {
      await fetch(`${IMPORTER_API}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, attempt }),
      }).catch(() => null);
      onAttemptSaved?.(attempt);
    }
  }, [buildAttemptSummary, onAttemptSaved, user]);

  useEffect(() => {
    if (showResults) saveAttemptOnce();
  }, [showResults, saveAttemptOnce]);

  const submitAttempt = useCallback(async () => {
    if (attemptSavedRef.current || submitting) return;
    setShowSubmit(false);
    setSubmitting(true);
    await saveAttemptOnce();
  }, [saveAttemptOnce, submitting]);

  function showTip(e, rows) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = 330;
    const rawX = rect.left + rect.width / 2;
    const x = Math.max(width / 2 + 8, Math.min(window.innerWidth - width / 2 - 8, rawX));
    setTip({ rows, x, y: rect.bottom + 8, arrowX: rawX - x + width / 2, width });
  }

  function paletteClass(status, current) {
    if (current) return "qpal qpal-current";
    if (status === Q_STATUS.ANSWERED) return "qpal qpal-answered";
    if (status === Q_STATUS.NOT_ANSWERED) return "qpal qpal-not-answered";
    if (status === Q_STATUS.MARKED || status === Q_STATUS.ANSWERED_MARKED) return "qpal qpal-marked";
    return "qpal qpal-not-visited";
  }

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Roboto,Arial,Helvetica,sans-serif;background:#F3F3F3;-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:#EEE}::-webkit-scrollbar-thumb{background:#BDBDBD;border-radius:0}
    .nta-top{height:42px;background:#333;display:flex;align-items:center;justify-content:space-between;padding:0 28px;color:#EEE;flex-shrink:0}
    .nta-brand{font-size:21px;font-weight:700;color:#D6D94A;letter-spacing:-0.2px}
    .nta-tools{display:flex;align-items:center;gap:28px;font-size:18px;color:#F5F5F5}
    .tool-dot{width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:white;margin-right:7px;font-size:15px;font-weight:800;vertical-align:middle}
    .exam-strip{height:63px;background:#F7F7F7;border-bottom:1px solid #CCC;display:flex;align-items:center;padding:0 28px;flex-shrink:0}
    .exam-pill{height:47px;background:#1E86C1;color:white;border:none;border-radius:5px;padding:0 20px;font-size:20px;font-weight:700;font-family:Roboto,Arial,Helvetica,sans-serif;display:inline-flex;align-items:center;gap:10px}
    .meta-row{height:47px;background:#F1F1F1;border-bottom:1px solid #D0D0D0;display:flex;align-items:center;justify-content:space-between;padding:0 28px;font-size:18px;color:#333;flex-shrink:0}
    .section-tabs{height:72px;background:#F5F5F5;border-bottom:1px solid #D0D0D0;display:flex;align-items:center;gap:16px;padding:0 28px;overflow-x:auto;overflow-y:hidden;flex-shrink:0;scrollbar-width:none}
    .section-tabs::-webkit-scrollbar{display:none}
    .stab{height:50px;min-width:278px;padding:0 20px;border:1px solid #C8C8C8;border-radius:4px;background:#FAFAFA;color:#1D83BE;cursor:pointer;font-family:Roboto,Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:10px}
    .stab.on{background:#2188C3;color:white;border-color:#2188C3;box-shadow:none}
    .stab.locked{opacity:.45;cursor:not-allowed;background:#E9E9E9;color:#777}
    .stab:hover{border-color:#BBB;background:#FAFAFA}
    .stab.on:hover{background:#2188C3}
    .info-dot{width:24px;height:24px;border-radius:50%;background:#318BC2;color:white;display:inline-flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:18px;font-style:italic;font-weight:700;line-height:24px;text-align:center}
    .stab.on .info-dot{background:#E0F3FF;color:#318BC2}
    .info-dot{position:relative;cursor:help}
    .hover-tip{position:fixed;z-index:99999;background:#111827;color:#F8FAFC;border:1px solid rgba(255,255,255,0.18);box-shadow:0 12px 30px rgba(0,0,0,0.28);border-radius:6px;padding:9px 10px;font-size:12px;line-height:1.45;pointer-events:none;transform:translateX(-50%)}
    .hover-tip:before{content:'';position:absolute;top:-6px;left:var(--arrow-x,50%);transform:translateX(-50%);border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:6px solid #111827}
    .tip-row{display:flex;justify-content:space-between;gap:16px;white-space:nowrap;overflow:hidden}
    .tip-row span:first-child{overflow:hidden;text-overflow:ellipsis}
    .tip-row span:last-child{font-weight:800;color:#D6D94A}
    .qtype-row{height:47px;background:#F7F7F7;border-bottom:1px solid #D0D0D0;display:flex;align-items:center;justify-content:space-between;padding:0 28px;font-size:18px;color:#333;flex-shrink:0}
    .qhead-row{height:58px;background:#F3F3F3;border-bottom:1px solid #D0D0D0;display:flex;align-items:center;padding:0 28px;gap:14px;flex-shrink:0}
    .bookmark-btn{height:38px;border:1px solid #CFCFCF;border-radius:20px;background:#F7F7F7;color:#6B7280;padding:0 14px;font-size:15px;display:inline-flex;align-items:center;gap:8px;cursor:pointer}
    .download-dot{margin-left:auto;width:40px;height:40px;border-radius:50%;background:#2188C3;color:white;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer}
    .instruction-box{border:3px solid #333;background:white;margin:5px 0 24px;padding:15px 28px 22px;font-size:20px;line-height:1.95;color:#333}
    .instruction-box.collapsed{padding:8px 24px;margin-bottom:18px}
    .instruction-box h3{text-align:center;font-size:23px;margin-bottom:20px}
    .instruction-box.collapsed h3{font-size:18px;margin-bottom:0;line-height:1.35}
    .rule-toggle{float:right;border:none;background:transparent;font-size:20px;line-height:1;cursor:pointer;color:#222}
    .question-area{flex:1;overflow-y:auto;background:#F7F7F7;padding:0 28px 95px}
    .question-image-wrap{position:relative;width:100%;max-width:980px;background:white;margin:0 0 22px;overflow:hidden;cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
    .question-image{position:relative;z-index:1;width:100%;max-width:980px;max-height:430px;object-fit:contain;object-position:left top;border:none;border-radius:0;display:block;background:white;pointer-events:none;user-select:none;-webkit-user-select:none;-webkit-user-drag:none}
    .question-text-fallback,.question-html-fallback{position:relative;max-width:980px;background:white;color:#222;font-size:18px;line-height:1.65;margin:0 0 24px;padding:20px 22px;border:1px solid #d8d8d8;white-space:pre-wrap;overflow:hidden;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
    .question-html-fallback{white-space:normal}
    .question-protected-content{position:relative;z-index:3}
    .question-html-fallback table{border-collapse:collapse;max-width:100%;margin:8px 0}
    .question-html-fallback td,.question-html-fallback th{border:1px solid #BBB;padding:6px 8px;vertical-align:top}
    .question-html-fallback p{margin:0 0 10px}
    .question-html-fallback sup,.question-html-fallback sub{font-size:.72em;line-height:0}
    .question-html-fallback .MathJax,.question-html-fallback mjx-container{font-size:inherit!important}
    .test-lightbox-image-wrap{overflow:hidden;border-radius:8px;background:white}
    .test-lightbox-image-wrap img{pointer-events:none;user-select:none;-webkit-user-select:none;-webkit-user-drag:none}
    .test-watermark-layer{position:absolute;z-index:2;inset:-22px;display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));grid-auto-rows:82px;pointer-events:none;overflow:hidden;mix-blend-mode:multiply}
    .test-watermark-layer span{align-self:center;justify-self:center;color:rgba(71,85,105,0.30);font-size:13px;font-weight:650;line-height:1;white-space:nowrap;transform:rotate(-48deg);user-select:none;text-shadow:0 0 1px rgba(255,255,255,0.25);font-family:Roboto,Arial,Helvetica,sans-serif}
    .opt-btn{width:100%;padding:11px 4px;border:none;background:transparent;color:#333;cursor:pointer;font-family:Roboto,Arial,Helvetica,sans-serif;font-size:20px;text-align:left;display:flex;align-items:center;gap:12px}
    .opt-radio{width:18px;height:18px;border:1px solid #777;border-radius:50%;background:white;display:inline-flex;align-items:center;justify-content:center}
    .opt-radio.sel:after{content:'';width:9px;height:9px;border-radius:50%;background:#1E86C1;display:block}
    .opt-content{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
    .opt-content-text{white-space:pre-wrap;line-height:1.45}
    .opt-content-html{line-height:1.45}
    .opt-content-html p{margin:0}
    .opt-content-html table{border-collapse:collapse;max-width:100%}
    .opt-content-html td,.opt-content-html th{border:1px solid #CCC;padding:4px 6px}
    .opt-content-img{max-width:min(640px,100%);max-height:180px;object-fit:contain;background:#fff;border:1px solid #DDD;border-radius:3px;display:block}
    .numeric-entry{display:inline-block;margin-left:46px}
    .numeric-input{width:185px;height:20px;border:1px solid #9CA3AF;background:white;font-size:15px;padding:0 6px;margin-bottom:8px;font-family:Roboto,Arial,sans-serif}
    .numpad{width:150px;background:#F0F0F0;padding:8px 10px;display:grid;grid-template-columns:repeat(3,34px);gap:5px;justify-content:center}
    .numpad button{height:31px;border:1px solid #9CA3AF;border-radius:4px;background:#F7F7F7;color:#111;font-size:16px;font-weight:700;font-family:Roboto,Arial,sans-serif;cursor:pointer}
    .numpad button:hover{background:#E5E7EB}
    .numpad .wide{grid-column:span 3}
    .bottom-actions{height:90px;background:#F7F7F7;border-top:1px solid #C9C9C9;display:flex;align-items:center;justify-content:space-between;padding:12px 22px;flex-shrink:0}
    .nta-btn{height:58px;min-width:188px;padding:0 24px;border:1px solid #C8C8C8;background:#F7F7F7;color:#333;font-family:Roboto,Arial,Helvetica,sans-serif;font-size:20px;font-weight:400;cursor:pointer}
    .nta-btn.primary{background:#2188C3;border-color:#2188C3;color:white;font-weight:700;min-width:198px}
    .side-shell{display:flex;flex-shrink:0;position:relative}
    .side-collapse{position:absolute;left:-12px;top:50%;transform:translateY(-50%);z-index:5;width:24px;height:58px;background:#3E3E3E;border:1px solid #2F2F2F;color:#AFAFAF;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:19px;font-weight:700;border-radius:3px 0 0 3px;transition:background 0.15s,color 0.15s}
    .side-collapse:hover{background:#2F2F2F;color:white}
    .side{width:445px;background:#DEF7FF;border-left:1px solid #C6D6DC;display:flex;flex-direction:column;flex-shrink:0}
    .candidate{height:140px;background:#DDF7FF;border-bottom:1px solid #C9C9C9;display:flex;align-items:center;gap:18px;padding:14px 18px}
    .avatar-box{width:110px;height:110px;border-radius:10px;background:#EEF2F3;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .avatar-head{position:absolute;top:7px;width:45px;height:45px;border-radius:50%;background:#777}
    .avatar-body{position:absolute;bottom:0;width:86px;height:63px;border-radius:42px 42px 8px 8px;background:#777}
    .legend{background:#F6F6F6;border-bottom:1px solid #C9C9C9;padding:22px 16px;display:grid;grid-template-columns:1fr 1fr;gap:24px 18px}
    .legend-item{display:flex;align-items:center;gap:12px;font-size:16px;color:#333;min-width:0}
    .section-title{background:#2D78AC;color:white;font-size:22px;font-weight:700;padding:10px 15px}
    .choose{font-size:18px;color:#333;padding:12px 15px 6px}
    .palette-grid{display:grid;grid-template-columns:repeat(4,68px);gap:18px 34px;padding:6px 38px 30px}
    .qpal{width:66px;height:56px;border:none;color:white;font-size:20px;font-weight:800;cursor:pointer;font-family:Roboto,Arial,Helvetica,sans-serif;position:relative;clip-path:polygon(25% 0,75% 0,100% 26%,100% 100%,0 100%,0 26%)}
    .qpal-answered{background:linear-gradient(#8CD525,#49A90E)}
    .qpal-not-answered{background:linear-gradient(#FF681F,#C93209);clip-path:polygon(0 0,100% 0,100% 72%,75% 100%,25% 100%,0 72%)}
    .qpal-marked{background:#8061A8;border-radius:50%;clip-path:none}
    .qpal-current{background:#F2A06F;clip-path:polygon(0 0,100% 0,100% 72%,75% 100%,25% 100%,0 72%)}
    .qpal-not-visited{background:#EFEFEF;color:#555;border:1px solid #BDBDBD;clip-path:none}
    .small-pal{width:42px;height:42px;font-size:16px;cursor:default;flex-shrink:0}
    .mark-dot{position:absolute;right:4px;bottom:2px;width:14px;height:14px;border-radius:50%;background:#71C83B;border:2px solid white}
    .palette-grid .qpal:hover{filter:brightness(1.06);box-shadow:0 0 0 2px rgba(33,136,195,0.22)}
    .mobile-question-strip{display:none}
    .instruction-page{min-height:100vh;background:#F3F4F6;font-family:'Inter',sans-serif;color:#111827}
    .instruction-top{background:#1E3A8A;padding:10px 28px;display:flex;justify-content:space-between;align-items:center}
    .instruction-title{font-size:13px;font-weight:700;color:white;letter-spacing:0.3px}
    .instruction-tools{display:flex;gap:20px}
    .instruction-tools span{font-size:12px;color:#93C5FD;display:flex;align-items:center;gap:5px}
    .instruction-info{background:#EFF6FF;padding:8px 28px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #BFDBFE;gap:14px}
    .instruction-test-pill{font-size:12px;font-weight:600;color:#2563EB;background:#DBEAFE;padding:3px 12px;border-radius:20px;border:1px solid #93C5FD;white-space:nowrap}
    .instruction-meta{font-size:12px;color:#374151;text-align:right}
    .instruction-content{max-width:800px;margin:32px auto;padding:0 20px}
    .preflight-hero{position:relative;overflow:hidden;background:linear-gradient(135deg,#102A72,#1E40AF 58%,#2389C2);border:0;border-radius:14px;color:white;box-shadow:0 22px 70px rgba(30,64,175,.18)}
    .preflight-hero::after{content:"";position:absolute;right:-70px;top:-70px;width:210px;height:210px;border-radius:50%;background:rgba(255,255,255,.10);box-shadow:inset 0 0 0 34px rgba(255,255,255,.06)}
    .preflight-hero h3{position:relative;z-index:1;color:white!important;font-size:18px!important;margin-bottom:6px!important}
    .preflight-hero-copy{position:relative;z-index:1;color:rgba(255,255,255,.72);font-size:12px;line-height:1.55;margin-bottom:14px}
    .instruction-card{background:white;border:1px solid #D1D5DB;border-radius:8px;padding:20px 24px;margin-bottom:20px}
    .instruction-card h3{font-size:15px;font-weight:700;color:#111827;margin-bottom:16px}
    .instruction-card ul{padding-left:20px;font-size:13px;color:#374151;line-height:2.2}
    .preflight-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:4px}
    .preflight-tile{border:1px solid #E5E7EB;border-radius:8px;padding:11px 12px;background:#F9FAFB}
    .preflight-hero .preflight-tile{position:relative;z-index:1;background:rgba(255,255,255,.13);border-color:rgba(255,255,255,.20);backdrop-filter:blur(8px)}
    .preflight-value{font-size:16px;font-weight:800;color:#111827}
    .preflight-hero .preflight-value{color:white}
    .preflight-label{font-size:11px;color:#6B7280;margin-top:2px}
    .preflight-hero .preflight-label{color:rgba(255,255,255,.68)}
    .preflight-warning{margin-top:12px;border:1px solid #FCD34D;background:#FFFBEB;color:#92400E;border-radius:8px;padding:10px 12px;font-size:12px;line-height:1.55}
    .instruction-legend{display:flex;gap:24px;flex-wrap:wrap}
    .instruction-start{padding:12px 40px;background:#2563EB;border:none;border-radius:6px;color:white;font-size:14px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif}
    @media (max-width: 2100px){
      .nta-brand{font-size:20px}.nta-tools{font-size:16px}.nta-top{height:40px}
      .exam-strip{height:56px}.exam-pill{height:42px;font-size:18px}
      .meta-row{height:41px;font-size:16px}.section-tabs{height:52px}.stab{height:38px;min-width:220px;font-size:16px}
      .qtype-row{height:41px;font-size:16px}.qhead-row{height:49px}.instruction-box{font-size:17px;line-height:1.7}.instruction-box h3{font-size:20px}
      .bottom-actions{height:72px}.nta-btn{height:50px;min-width:150px;font-size:17px}.nta-btn.primary{min-width:160px}
      .side{width:380px}.candidate{height:104px}.avatar-box{width:82px;height:82px}.avatar-head{width:34px;height:34px}.avatar-body{width:64px;height:46px}
      .legend{padding:14px;gap:14px 10px}.legend-item{font-size:14px}.section-title{font-size:18px}.choose{font-size:16px}
      .palette-grid{grid-template-columns:repeat(4,54px);gap:13px 22px;padding:5px 24px 24px}.qpal{width:54px;height:46px;font-size:17px}.small-pal{width:38px;height:38px;font-size:14px}
    }
    @media (max-width: 1700px){
      .nta-brand{font-size:18px}.nta-tools{font-size:15px}.nta-top{height:36px}
      .exam-strip{height:52px}.exam-pill{height:40px;font-size:17px}
      .meta-row{height:39px;font-size:15px}.section-tabs{height:50px}.stab{height:36px;min-width:205px;font-size:15px}
      .qtype-row{height:38px;font-size:15px}.qhead-row{height:46px}.instruction-box{font-size:15px;line-height:1.55}.instruction-box h3{font-size:18px}
      .bottom-actions{height:68px}.nta-btn{height:48px;min-width:130px;font-size:16px}.nta-btn.primary{min-width:145px}
      .side{width:350px}.candidate{height:92px}.avatar-box{width:74px;height:74px}.avatar-head{width:31px;height:31px}.avatar-body{width:58px;height:42px}
      .legend{padding:12px;gap:12px 8px}.legend-item{font-size:13px}.section-title{font-size:17px}.choose{font-size:15px}
      .palette-grid{grid-template-columns:repeat(4,50px);gap:12px 18px;padding:4px 22px 22px}.qpal{width:50px;height:43px;font-size:16px}.small-pal{width:36px;height:36px;font-size:14px}
    }
    @media (max-width: 760px){
      .nta-top{height:34px;padding:0 10px}
      .nta-brand{font-size:13px;max-width:calc(100vw - 20px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .nta-tools{display:none}
      .exam-strip{height:45px;padding:0 10px;overflow-x:auto;scrollbar-width:none}
      .exam-strip::-webkit-scrollbar{display:none}
      .exam-pill{height:34px;min-width:max-content;font-size:14px;padding:0 13px;border-radius:4px}
      .info-dot{width:20px;height:20px;font-size:15px;line-height:20px}
      .meta-row{height:38px;padding:0 10px;font-size:13px}
      .section-tabs{height:48px;padding:6px 10px;gap:8px;align-items:center;overflow-x:auto;scrollbar-width:none}
      .stab{height:34px;min-width:132px;padding:0 11px;font-size:13px;gap:7px;flex:0 0 auto}
      .stab .info-dot{width:18px;height:18px;font-size:13px;line-height:18px}
      .mobile-question-strip{display:block;background:#DDF7FF;border-bottom:1px solid #BED7DF;flex-shrink:0}
      .mobile-question-strip-title{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 10px 5px;background:#2D78AC;color:white;font-size:13px;font-weight:700}
      .mobile-question-strip-title span:last-child{font-size:11px;font-weight:500;color:#EAFBFF}
      .mobile-qrail{display:flex;gap:8px;overflow-x:auto;overflow-y:hidden;padding:9px 10px 11px;scrollbar-width:thin}
      .mobile-qrail::-webkit-scrollbar{height:4px}
      .mobile-qrail::-webkit-scrollbar-thumb{background:#8AB6C6}
      .mobile-qrail .qpal{width:38px;height:34px;font-size:13px;flex:0 0 auto}
      .mobile-qrail .mark-dot{width:10px;height:10px;right:2px;bottom:1px;border-width:1px}
      .qtype-row{min-height:44px;height:auto;padding:7px 10px;font-size:12px;align-items:flex-start;gap:5px;flex-direction:column}
      .qhead-row{height:42px;padding:0 10px}
      .qhead-row strong{font-size:15px!important}
      .download-dot{width:32px;height:32px}
      .question-area{padding:0 10px 132px}
      .instruction-box{border-width:2px;margin:6px 0 14px;padding:10px 12px 12px;font-size:13px;line-height:1.55}
      .instruction-box h3{font-size:15px;margin-bottom:10px;text-align:left;padding-right:24px}
      .instruction-box.collapsed{padding:8px 10px;margin-bottom:12px}
      .instruction-box.collapsed h3{font-size:13px}
      .rule-toggle{font-size:18px}
      .question-image-wrap{max-width:100%;margin-bottom:14px}
      .question-image{max-height:52vh;max-width:100%;width:100%;object-fit:contain}
      .opt-btn{font-size:16px;padding:10px 2px;gap:10px}
      .opt-radio{width:17px;height:17px}
      .numeric-entry{margin-left:0;display:block}
      .numeric-input{width:170px;height:26px;font-size:16px}
      .numpad{width:152px}
      .bottom-actions{height:auto;min-height:92px;padding:8px 10px;display:grid;grid-template-columns:1fr;gap:8px}
      .bottom-actions>div{display:grid!important;grid-template-columns:1fr 1fr;gap:8px!important;width:100%}
      .bottom-actions>div:last-child{grid-template-columns:1fr 1fr 1fr}
      .nta-btn{height:42px;min-width:0!important;padding:0 8px;font-size:12px;white-space:normal;line-height:1.2}
      .side-shell{display:none}
      .hover-tip{display:none}
      .instruction-page{overflow-x:hidden}
      .instruction-top{padding:9px 12px;align-items:flex-start;gap:8px;flex-direction:column}
      .instruction-title{font-size:12px;line-height:1.35}
      .instruction-tools{gap:12px;flex-wrap:wrap}
      .instruction-tools span{font-size:11px}
      .instruction-info{padding:9px 12px;align-items:flex-start;flex-direction:column}
      .instruction-meta{text-align:left;line-height:1.6}
      .instruction-content{margin:18px auto;padding:0 12px 22px}
      .instruction-card{padding:15px 14px;border-radius:7px;margin-bottom:12px}
      .instruction-card ul{font-size:12px;line-height:1.8;padding-left:18px}
      .preflight-grid{grid-template-columns:repeat(2,1fr)}
      .instruction-legend{display:grid!important;grid-template-columns:1fr;gap:11px!important}
      .instruction-start{width:100%;padding:13px 16px}
    }
    @media (max-width: 390px){
      .stab{min-width:116px;font-size:12px}
      .mobile-qrail .qpal{width:35px;height:32px;font-size:12px}
      .bottom-actions>div:first-child{grid-template-columns:1fr}
      .nta-btn{height:39px}
    }
  `;

  // ── INSTRUCTIONS ──────────────────────────────────────────────────────────
  if (showInstructions) {
    return (
      <div className="instruction-page">
        <style>{CSS}</style>
        {/* Top bar */}
        <div className="instruction-top">
          <span className="instruction-title">{testTitle}</span>
          <div className="instruction-tools">
            <span><I n="accessibility" s={14} c="#93C5FD"/> Accessibility</span>
            <span><I n="magnify" s={14} c="#93C5FD"/> Screen Magnifier</span>
          </div>
        </div>
        {/* Info bar */}
        <div className="instruction-info">
          <span className="instruction-test-pill">{test.name}</span>
          <span className="instruction-meta">Duration: <strong>{test.duration||180} min</strong> · Total Questions: <strong>{totalQ}</strong> · Max Marks: <strong>{test.maxMarks||subjects.reduce((a,s)=>a+s.questions.reduce((b,q)=>b+(q.marks?.cm||0),0),0)}</strong></span>
        </div>
        <div className="instruction-content">
          <div className="instruction-card preflight-hero">
            <h3>Test Start Check</h3>
            <div className="preflight-hero-copy">
              Confirm the paper details before starting. Once started, your progress is saved as you move through the test and fullscreen protection is enabled.
            </div>
            <div className="preflight-grid">
              <div className="preflight-tile"><div className="preflight-value">{test.name}</div><div className="preflight-label">Paper</div></div>
              <div className="preflight-tile"><div className="preflight-value">{test.duration || 180} min</div><div className="preflight-label">Duration</div></div>
              <div className="preflight-tile"><div className="preflight-value">{subjects.length}</div><div className="preflight-label">Sections</div></div>
              <div className="preflight-tile"><div className="preflight-value">{totalQ}</div><div className="preflight-label">Questions</div></div>
            </div>
            <div className="preflight-warning">
              The test will request fullscreen after you start. Switching tabs, leaving fullscreen, or moving away from the window pauses the test and shows a resume warning.
            </div>
          </div>
          {/* Instructions white box */}
          <div className="instruction-card">
            <h3>General Instructions</h3>
            <ul>
              <li>This Computer Based Test consists of <strong>{totalQ} questions</strong>.</li>
              <li>Each question is of <strong>4 marks</strong>.</li>
              <li>There is <strong>negative marking</strong> of <strong>1 mark</strong> for wrong answer.</li>
              <li>To select your answer, click on the button of your choice and then click on <strong>Save & Next</strong>.</li>
              <li>To change your answer, click on another button and then click on <strong>Save & Next</strong>.</li>
              <li>You can view and edit your answers using the <strong>Question Palette</strong> before submitting.</li>
              <li>The timer will start only when you click <strong>Start Test</strong>.</li>
              <li>Do <strong>NOT</strong> close the browser or refresh the page during the test.</li>
            </ul>
          </div>
          {extraInstructions && (
            <div className="instruction-card">
              <h3>Exam Instructions</h3>
              <ul>
                {extraInstructions.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, idx) => (
                  <li key={`${line}_${idx}`}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Legend */}
          <div className="instruction-card">
            <div style={{ fontSize:13,fontWeight:600,color:"#111827",marginBottom:12 }}>Question Status Legend</div>
            <div className="instruction-legend" style={{ display:"flex",gap:24,flexWrap:"wrap" }}>
              {[
                {status:"answered",        label:"Answered"},
                {status:"not_answered",    label:"Not Answered"},
                {status:"not_visited",      label:"Not Visited"},
                {status:"marked",          label:"Marked for Review"},
                {status:"answered_marked", label:"Answered & Marked"},
              ].map(r=>{
                const st=STATUS_STYLE[r.status];
                return (
                  <div key={r.status} style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <div style={{ width:22,height:22,borderRadius:"4px",background:st.bg,border:`2px solid ${st.border}`,flexShrink:0,position:"relative" }}>
                      {st.dot&&<div style={{ position:"absolute",bottom:0,right:0,width:7,height:7,borderRadius:"50%",background:"#10B981",border:"1px solid white" }}/>}
                    </div>
                    <span style={{ fontSize:12,color:"#374151" }}>{r.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <button className="instruction-start" onClick={async ()=>{ setShowInstructions(false); setTimeout(enterFullscreen, 50); }}>
            Start Test →
          </button>
        </div>
      </div>
    );
  }

  // ── SUBMITTING ─────────────────────────────────────────────────────────────
  if (showResults || submitting) {
    return (
      <div style={{ height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F7F7F7",fontFamily:"Roboto,Arial,Helvetica,sans-serif",color:"#333" }}>
        <div style={{ background:"white",border:"1px solid #D1D5DB",borderRadius:8,padding:"28px 34px",boxShadow:"0 18px 60px rgba(0,0,0,0.14)",textAlign:"center" }}>
          <div style={{ width:42,height:42,borderRadius:"50%",border:"4px solid #D7ECF8",borderTopColor:"#2389C2",margin:"0 auto 14px",animation:"spin .8s linear infinite" }}></div>
          <div style={{ fontSize:18,fontWeight:700,marginBottom:6 }}>Saving your attempt</div>
          <div style={{ fontSize:13,color:"#667085" }}>Opening analysis...</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  // ── MAIN UI ────────────────────────────────────────────────────────────────
  return (
    <div ref={examRootRef} style={{ height:"100vh",display:"flex",flexDirection:"column",background:"#F7F7F7",fontFamily:"Roboto,Arial,Helvetica,sans-serif",color:"#333",overflow:"hidden" }}>
      <style>{CSS}</style>
      {guardPaused && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", zIndex:100000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ width:460, maxWidth:"92vw", background:"white", border:"1px solid #D1D5DB", borderRadius:8, padding:26, boxShadow:"0 24px 70px rgba(0,0,0,0.35)", textAlign:"center", fontFamily:"Roboto,Arial,sans-serif" }}>
            <div style={{ width:48, height:48, borderRadius:"50%", background:!isOnline ? "#FEF3C7" : guardReason?.startsWith("Back online") ? "#DCFCE7" : "#FEF2F2", color:!isOnline ? "#B45309" : guardReason?.startsWith("Back online") ? "#16A34A" : "#DC2626", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
              <I n={!isOnline ? "wifi-off" : guardReason?.startsWith("Back online") ? "check-circle" : "warning"} s={26} c={!isOnline ? "#B45309" : guardReason?.startsWith("Back online") ? "#16A34A" : "#DC2626"} />
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:"#111827", marginBottom:8 }}>{!isOnline ? "No Internet" : "Test Paused"}</div>
            <div style={{ fontSize:14, color:"#4B5563", lineHeight:1.6, marginBottom:8 }}>
              {!isOnline ? "Your internet connection is offline. The timer is paused and your last saved progress is protected." : guardReason || "The test was paused."}
            </div>
            <div style={{ fontSize:14, color:!isOnline ? "#92400E" : "#991B1B", fontWeight:600, marginBottom:20 }}>
              {!isOnline ? "Keep this tab open. Resume will unlock when you are back online." : "Do not switch tabs or leave fullscreen while attempting the test."}
            </div>
            <button onClick={resumeExam} disabled={!isOnline} style={{ height:42, padding:"0 28px", border:"none", borderRadius:6, background:!isOnline ? "#94A3B8" : "#2563EB", color:"white", fontSize:14, fontWeight:700, cursor:!isOnline ? "not-allowed" : "pointer", fontFamily:"Roboto,Arial,sans-serif" }}>
              {!isOnline ? "Waiting for Internet..." : "Resume Test"}
            </button>
          </div>
        </div>
      )}
      {tip && (
        <div className="hover-tip" style={{left: tip.x, top: tip.y, width: tip.width, "--arrow-x": `${tip.arrowX}px`}}>
          {tip.rows.map(([label, value]) => (
            <div className="tip-row" key={label}><span>{label}</span><span>{value}</span></div>
          ))}
        </div>
      )}
      <Lightbox src={lightbox} onClose={()=>setLightbox(null)} watermarkEmail={watermarkEmail}/>
      {showSubmit && <SubmitModal counts={counts} onConfirm={submitAttempt} onCancel={()=>setShowSubmit(false)}/>}
      {showSecInfo && <SectionInfoModal section={activeSubject} onClose={()=>setShowSecInfo(false)}/>}

      <div className="nta-top">
        <div className="nta-brand">{testTitle}</div>
        <div className="nta-tools">
          <span><span className="tool-dot" style={{background:"#28B965"}}><I n="accessibility" s={17} c="white"/></span>Accessibility</span>
          <span><span className="tool-dot" style={{background:"#F9B20D"}}><I n="magnify" s={17} c="white"/></span>Screen Magnifier</span>
        </div>
      </div>

      <div style={{display:"flex",flex:1,minHeight:0}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <div className="exam-strip">
            <button className="exam-pill">
              {examName}
              <span
                className="info-dot"
                onMouseEnter={e => showTip(e, statusTip(statusCountsFor(subjects)))}
                onMouseLeave={() => setTip(null)}
              >i</span>
            </button>
          </div>

          <div className="meta-row">
            <strong>Sections</strong>
            <div>Time Left : <strong style={{fontVariantNumeric:"tabular-nums"}}>{timer.fmt}</strong></div>
          </div>

          <div className="section-tabs">
            {subjects.map((s,si)=>{
              const locked = !canOpenSection(si);
              return (
              <button key={si} className={`stab ${secIdx===si?"on":""} ${locked ? "locked" : ""}`} onClick={()=>jumpToSection(si,0)} title={locked ? "Locked by exam rules" : ""}>
                {s.name}
                <span
                  className="info-dot"
                  onClick={e => e.stopPropagation()}
                  onMouseEnter={e => showTip(e, statusTip(statusCountsFor([s])))}
                  onMouseLeave={() => setTip(null)}
                >i</span>
              </button>
            )})}
          </div>

          <div className="mobile-question-strip">
            <div className="mobile-question-strip-title">
              <span>{activeSubject.name}</span>
              <span>{activeSubject.questions.length} questions</span>
            </div>
            <div className="mobile-qrail">
              {activeSubject.questions.map((q, qi) => {
                const status = statuses[q.id] || Q_STATUS.NOT_VISITED;
                const isCurrent = qi === qIdx;
                const isAnsMarked = status === Q_STATUS.ANSWERED_MARKED;
                return (
                  <button key={q.id} className={paletteClass(status, isCurrent)} onClick={() => setQIdx(qi)}>
                    {qi + 1}
                    {isAnsMarked && <span className="mark-dot"></span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="qtype-row">
            <div>Question Type: <strong>{activeQ?.type === "integer" ? "Numerical Answer" : activeQ?.type === "multi" ? "Multiple Select" : "Multiple Choice"}</strong></div>
            <div>Marks for correct answer: <strong style={{color:"#248748"}}>+{activeCm}</strong> | Negative Marks: <strong style={{color:"#D31313"}}>{activeIm}</strong></div>
          </div>

          <div className="qhead-row">
            <strong style={{fontSize:18}}>Question No. {globalQNum}</strong>
            <button className="download-dot" title="Question image preview" onClick={()=>currentImages?.[0] && setLightbox(currentImages[0])}>
              <I n="chevdown" s={23} c="white"/>
            </button>
          </div>

          <div className="question-area">
            <div className={`instruction-box ${rulesOpen ? "" : "collapsed"}`}>
              <h3>
                {activeSubject.name} (Maximum Marks: {activeSectionMarks})
                <button className="rule-toggle" onClick={() => setRulesOpen(v => !v)} title={rulesOpen ? "Collapse rules" : "Expand rules"}>{rulesOpen ? "⌃" : "⌄"}</button>
              </h3>
              {rulesOpen && (
                <ul style={{paddingLeft:24}}>
                  <li>This section contains <strong>{activeSubject.questions.length}</strong> questions.</li>
                  <li>Each question has <strong>{numOpts}</strong> options. <strong>{activeQ?.type === "multi" ? "ONE OR MORE" : "ONLY ONE"}</strong> of these options is the correct answer.</li>
                  <li>For each question, choose the option corresponding to the correct answer.</li>
                  <li>Answer to each question will be evaluated <u>according to the following marking scheme</u>:
                    <ul style={{paddingLeft:26}}>
                      <li><em>Full Marks</em> : +{activeCm} if <strong>{activeQ?.type === "multi" ? "ALL" : "ONLY"}</strong> the correct option is chosen</li>
                      <li><em>Zero Marks</em> : 0 if none of the options is chosen</li>
                      <li><em>Negative Marks</em> : -{activeIm} in all other cases.</li>
                    </ul>
                  </li>
                </ul>
              )}
            </div>

            {activeQ ? (
              <>
                {activeQ?.html || activeQ?.questionHtml ? (
                  <div className="question-html-fallback" onCopy={blockImageAction} onCut={blockImageAction} onContextMenu={blockImageAction} onDragStart={blockImageAction}>
                    {watermarkEmail && (
                      <div className="test-watermark-layer" aria-hidden="true">
                        {watermarkTiles.map((_, wi) => <span key={wi}>{watermarkEmail}</span>)}
                      </div>
                    )}
                    <div className="question-protected-content" dangerouslySetInnerHTML={{ __html: activeQ.html || activeQ.questionHtml }} />
                  </div>
                ) : activeQ?.text ? (
                  <div className="question-text-fallback" onCopy={blockImageAction} onCut={blockImageAction} onContextMenu={blockImageAction} onDragStart={blockImageAction}>
                    {watermarkEmail && (
                      <div className="test-watermark-layer" aria-hidden="true">
                        {watermarkTiles.map((_, wi) => <span key={wi}>{watermarkEmail}</span>)}
                      </div>
                    )}
                    <div className="question-protected-content">{activeQ.text}</div>
                  </div>
                ) : null}

                {currentImages.length>0 ? (
                  <div style={{marginBottom:24}}>
                    {currentImages.map((src,i)=>(
                      <div key={i} className="question-image-wrap" onClick={()=>setLightbox(src)} onContextMenu={blockImageAction} onDragStart={blockImageAction}>
                        <img src={src} alt="" className="question-image" draggable={false}/>
                        {watermarkEmail && (
                          <div className="test-watermark-layer" aria-hidden="true">
                            {watermarkTiles.map((_, wi) => <span key={wi}>{watermarkEmail}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : !activeQ?.html && !activeQ?.questionHtml && !activeQ?.text && loadingImage ? (
                  <div style={{fontSize:18,margin:"8px 0 28px",color:"#777"}}>Loading question image...</div>
                ) : !activeQ?.html && !activeQ?.questionHtml && !activeQ?.text ? (
                  <div style={{fontSize:21,margin:"8px 0 28px"}}>Choose the correct answer.</div>
                ) : null}

                <div style={{display:"flex",flexDirection:"column",gap:2,maxWidth:900}}>
                  {activeQ.type==="integer" ? (
                    <div className="numeric-entry">
                      <input
                        className="numeric-input"
                        inputMode="decimal"
                        value={selectedOpts[0]??""}
                        onChange={e=>setIntegerAnswer(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") saveAndNext();
                        }}
                      />
                      <div className="numpad">
                        <button className="wide" onClick={() => pressNumpad("back")}>Backspace</button>
                        {["7","8","9","4","5","6","1","2","3","0",".","-"].map(k => (
                          <button key={k} onClick={() => pressNumpad(k)}>{k}</button>
                        ))}
                        <button onClick={() => pressNumpad("clear")} style={{gridColumn:"span 3"}}>Clear All</button>
                      </div>
                    </div>
                  ) : (
                    Array.from({length:numOpts},(_,i)=>i+1).map(opt=>{
                      const label=String.fromCharCode(64+opt);
                      const sel=selectedOpts.includes(String(opt))||selectedOpts.includes(opt);
                      const optData = (activeQ.options || []).find(o => String(o.id) === String(opt) || String(o.label || "").toUpperCase() === label);
                      const optHtml = optData?.html || optData?.optionHtml || "";
                      const optText = !optHtml && optData?.text && optData.text !== label ? optData.text : "";
                      const hasOptionContent = Boolean(optText || optHtml || optData?.images?.length);
                      return (
                        <button key={opt} className="opt-btn" onClick={()=>handleSelect(String(opt))}>
                          <span className={`opt-radio ${sel?"sel":""}`}></span>
                          {!hasOptionContent && <span>{label}</span>}
                          {hasOptionContent && (
                            <span className="opt-content" onCopy={blockImageAction} onCut={blockImageAction} onContextMenu={blockImageAction} onDragStart={blockImageAction}>
                              {optHtml && <span className="opt-content-html" dangerouslySetInnerHTML={{ __html: optHtml }} />}
                              {optText && <span className="opt-content-text">{optText}</span>}
                              {(optData.images || []).map((src, oi) => (
                                <img key={oi} className="opt-content-img" src={src} alt="" draggable={false} onContextMenu={blockImageAction} onDragStart={blockImageAction} />
                              ))}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign:"center",padding:40,color:"#777" }}>No question</div>
            )}
          </div>

          <div className="bottom-actions">
            <div style={{display:"flex",gap:18}}>
              <button className="nta-btn" onClick={markForReview}>Mark for Review & Next</button>
              <button className="nta-btn" onClick={clearResponse}>Clear Response</button>
            </div>
            <div style={{display:"flex",gap:14}}>
              <button className="nta-btn" onClick={goPrev}>Previous</button>
              <button className="nta-btn primary" onClick={saveAndNext}>Save & Next</button>
              <button className="nta-btn primary" onClick={()=>setShowSubmit(true)}>Submit</button>
            </div>
          </div>
        </div>

        <div className="side-shell">
          <button className="side-collapse" onClick={() => setSideOpen(v => !v)} title={sideOpen ? "Collapse question palette" : "Expand question palette"}>
            {sideOpen ? "›" : "‹"}
          </button>
          {sideOpen && <div className="side">
            <div className="candidate">
              <div className="avatar-box"><span className="avatar-head"></span><span className="avatar-body"></span></div>
              <div style={{fontSize:17,fontWeight:600,color:"#333"}}>{user?.name || "Student"}</div>
            </div>

            <div className="legend">
              {paletteRows.map(r=>(
                <div key={r.status} className="legend-item" style={{gridColumn:r.status==="answered_marked" ? "1 / -1" : undefined}}>
                  <button className={`qpal small-pal ${r.status==="answered"?"qpal-answered":r.status==="not_answered"?"qpal-not-answered":r.status==="not_visited"?"qpal-not-visited":"qpal-marked"}`}>
                    {r.count}
                    {r.status==="answered_marked" && <span className="mark-dot"></span>}
                  </button>
                  <span>{r.label}</span>
                </div>
              ))}
            </div>

            <div className="section-title">{activeSubject.name}</div>
            <div className="choose">Choose a Question</div>
            <div style={{flex:1,overflowY:"auto"}}>
              <div className="palette-grid">
                {activeSubject.questions.map((q,qi)=>{
                  const status = statuses[q.id] || Q_STATUS.NOT_VISITED;
                  const isCurrent = qi === qIdx;
                  const isAnsMarked = status === Q_STATUS.ANSWERED_MARKED;
                  return (
                    <button key={q.id} className={paletteClass(status, isCurrent)} onClick={()=>setQIdx(qi)}>
                      {qi + 1}
                      {isAnsMarked && <span className="mark-dot"></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── normalizeTest (moved to end so all functions are defined before use) ──────
function normalizeTest(test) {
  if (test.subjects && Array.isArray(test.subjects) && test.subjects.length > 0 && test.subjects[0].questions) {
    return test.subjects.map(subject => ({
      ...subject,
      questions: (subject.questions || []).map(normalizeQuestionBody),
    }));
  }
  return [{
    id: "demo_subj",
    name: "Questions",
    questions: Array.from({ length: 10 }, (_, i) => ({
      id: `demo_q${i}`,
      globalQNum: i + 1,
      type: "mcq",
      marks: { cm: 4, im: -1 },
      answerOptions: "4",
      correctAnswer: [1],
      images: [],
      solutionImages: [],
    })),
  }];
}

function normalizeQuestionBody(question) {
  const text = question?.text || question?.questionText || question?.question || question?.prompt || question?.body || "";
  const html = question?.html || question?.questionHtml || "";
  const solutionText = question?.solutionText || question?.solution || question?.explanation || "";
  return {
    ...question,
    text,
    html,
    questionHtml: question?.questionHtml || html,
    questionText: question?.questionText || text,
    solutionText,
    options: (question?.options || []).map((option, idx) => ({
      ...option,
      id: option.id || idx + 1,
      label: option.label || String.fromCharCode(65 + idx),
      text: option.text || option.optionText || option.value || option.labelText || "",
      html: option.html || option.optionHtml || "",
      optionHtml: option.optionHtml || option.html || "",
      images: option.images || option.imageUrls || [],
    })),
  };
}
