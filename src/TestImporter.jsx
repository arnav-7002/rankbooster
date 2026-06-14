import { useState, useRef } from "react";

const I = ({ n, s = 16, c }) => {
  const icons = {
    upload:   <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    x:        <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    chevdown: <polyline points="6 9 12 15 18 9"/>,
    chevup:   <polyline points="18 15 12 9 6 15"/>,
    chevleft: <polyline points="15 18 9 12 15 6"/>,
    drag:     <><line x1="9" y1="6" x2="15" y2="6"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></>,
    trash:    <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></>,
    save:     <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    warning:  <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    img:      <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    info:     <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    folder:   <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
    zoom:     <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[n]||null}</svg>;
};

const S = `
.ti-drop{border:2px dashed rgba(124,58,237,0.4);border-radius:14px;padding:40px;text-align:center;cursor:pointer;transition:all 0.2s;background:rgba(124,58,237,0.04)}
.ti-drop:hover,.ti-drop.over{border-color:#7C3AED;background:rgba(124,58,237,0.1)}
.ti-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:8px;overflow:hidden}
.ti-subj-header{display:flex;align-items:center;gap:10px;padding:12px 16px;cursor:pointer;user-select:none;background:rgba(255,255,255,0.03)}
.ti-subj-header:hover{background:rgba(124,58,237,0.08)}
.ti-q-row{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-top:1px solid rgba(255,255,255,0.05)}
.ti-q-row:hover{background:rgba(255,255,255,0.02)}
.ti-q-img{width:100%;max-width:520px;height:auto;border-radius:7px;border:1px solid rgba(255,255,255,0.1);cursor:pointer;display:block;background:#111;transition:border-color 0.15s}
.ti-q-img:hover{border-color:#7C3AED}
.ti-q-img-thumb{width:200px;height:100px;object-fit:cover;border-radius:7px;border:1px solid rgba(255,255,255,0.1);cursor:pointer;background:#111;transition:border-color 0.15s}
.ti-q-img-thumb:hover{border-color:#7C3AED}
.ti-ans-btn{width:34px;height:34px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:#64748B;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;transition:all 0.12s;display:flex;align-items:center;justify-content:center}
.ti-ans-btn:hover{border-color:#7C3AED;color:#A78BFA}
.ti-ans-btn.selected{background:#7C3AED;border-color:#7C3AED;color:white}
.ti-input{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#E2E8F0;padding:7px 12px;border-radius:8px;font-family:'Outfit',sans-serif;font-size:12px;outline:none}
.ti-input:focus{border-color:rgba(124,58,237,0.5)}
.ti-select{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#E2E8F0;padding:7px 12px;border-radius:8px;font-family:'Outfit',sans-serif;font-size:12px;outline:none;cursor:pointer}
.ti-select option{background:#1a1a2e}
.ti-tag{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600}
.ti-btn{border:none;padding:8px 16px;border-radius:9px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:opacity 0.15s}
.ti-btn-primary{background:linear-gradient(135deg,#7C3AED,#6D28D9);color:white}
.ti-btn-ghost{background:rgba(255,255,255,0.06);color:#94A3B8;border:1px solid rgba(255,255,255,0.1)}
.ti-btn-danger{background:rgba(239,68,68,0.15);color:#F87171;border:1px solid rgba(239,68,68,0.2)}
.ti-btn:hover{opacity:0.85}
.ti-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
.ti-badge-mcq{background:rgba(14,165,233,0.2);color:#38BDF8}
.ti-badge-int{background:rgba(251,191,36,0.2);color:#FCD34D}
.ti-badge-multi{background:rgba(124,58,237,0.2);color:#A78BFA}
.ti-progress{height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;margin-top:8px}
.ti-progress-fill{height:100%;background:linear-gradient(90deg,#7C3AED,#A78BFA);border-radius:2px;transition:width 0.3s}
`;

const SUBJ_COLORS = ["#7C3AED","#0EA5E9","#10B981","#F59E0B","#EF4444","#EC4899","#8B5CF6"];

function Lightbox({ src, onClose }) {
  if (!src) return null;
  return (
    <div className="ti-overlay" onClick={onClose}>
      <div style={{ position:"relative", maxWidth:"92vw", maxHeight:"92vh" }} onClick={e=>e.stopPropagation()}>
        <img src={src} alt="Question preview" style={{ maxWidth:"92vw", maxHeight:"88vh", objectFit:"contain", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", display:"block" }} />
        <button onClick={onClose} title="Close" style={{ position:"absolute", top:-14, right:-14, width:28, height:28, borderRadius:"50%", background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.2)", color:"#94A3B8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <I n="x" s={14} />
        </button>
      </div>
    </div>
  );
}

function QuestionRow({ q, subjColor, onImgClick, onChange, onDelete, globalIdx, showSolution }) {
  const [expanded, setExpanded] = useState(false);
  const typeBadge = { mcq:"ti-badge-mcq", integer:"ti-badge-int", multi:"ti-badge-multi" };
  const typeLabel = { mcq:"MCQ", integer:"INT", multi:"MULTI" };
  const numOpts = parseInt(q.answerOptions) || 4;
  const hasAnswer = Array.isArray(q.correctAnswer) && q.correctAnswer.length > 0;

  return (
    <div className="ti-q-row" style={{ flexDirection:"column", gap:8 }}>
      {/* Top row: number, type, marks, answer, delete */}
      <div style={{ display:"flex", alignItems:"center", gap:10, width:"100%", flexWrap:"wrap" }}>
        <span style={{ fontSize:13, fontWeight:700, color:subjColor, width:32, flexShrink:0 }}>Q{globalIdx}</span>

        <span className={`ti-tag ${typeBadge[q.type]||"ti-badge-mcq"}`}>{typeLabel[q.type]||q.type}</span>

        <select className="ti-select" value={q.type} onChange={e=>onChange({...q,type:e.target.value})} style={{padding:"3px 8px",fontSize:11}}>
          <option value="mcq">MCQ</option>
          <option value="integer">Integer</option>
          <option value="multi">Multi-correct</option>
        </select>

        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:11,color:"#34D399",fontWeight:600}}>+</span>
          <input className="ti-input" type="number" value={q.marks?.cm??4} onChange={e=>onChange({...q,marks:{...q.marks,cm:Number(e.target.value)}})} style={{width:44,padding:"3px 6px",textAlign:"center"}} title="Correct marks" />
          <span style={{fontSize:11,color:"#F87171",fontWeight:600}}>/</span>
          <input className="ti-input" type="number" value={q.marks?.im??-1} onChange={e=>onChange({...q,marks:{...q.marks,im:Number(e.target.value)}})} style={{width:44,padding:"3px 6px",textAlign:"center"}} title="Wrong marks" />
        </div>

        {/* Answer buttons */}
        {(q.type==="mcq"||q.type==="multi") && (
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            {Array.from({length:numOpts},(_,i)=>i+1).map(opt=>{
              const sel = Array.isArray(q.correctAnswer)?q.correctAnswer.includes(opt):q.correctAnswer===opt;
              return (
                <button key={opt} className={`ti-ans-btn ${sel?"selected":""}`}
                  title={`Mark option ${opt} as correct`}
                  onClick={()=>{
                    if(q.type==="multi"){
                      const cur = Array.isArray(q.correctAnswer)?[...q.correctAnswer]:[q.correctAnswer].filter(Boolean);
                      const next = cur.includes(opt)?cur.filter(x=>x!==opt):[...cur,opt];
                      onChange({...q,correctAnswer:next.sort()});
                    } else {
                      onChange({...q,correctAnswer:[opt]});
                    }
                  }}>
                  {opt}
                </button>
              );
            })}
            <select className="ti-select" value={numOpts} onChange={e=>onChange({...q,answerOptions:String(e.target.value)})} style={{padding:"3px 8px",fontSize:11}} title="Number of options">
              {[2,3,4,5].map(n=><option key={n} value={n}>{n} opts</option>)}
            </select>
          </div>
        )}

        {q.type==="integer" && (
          <input className="ti-input" type="number" placeholder="Integer answer" value={Array.isArray(q.correctAnswer)?q.correctAnswer[0]:(q.correctAnswer||"")} onChange={e=>onChange({...q,correctAnswer:[Number(e.target.value)]})} style={{width:110}} />
        )}

        {!hasAnswer && <span style={{fontSize:11,color:"#F87171",fontWeight:600}}>⚠ No answer set</span>}
        {hasAnswer && <span style={{fontSize:11,color:"#34D399"}}>Ans: {q.correctAnswer.join(", ")}</span>}

        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          <button className="ti-btn ti-btn-ghost" style={{padding:"4px 10px",fontSize:11}} onClick={()=>setExpanded(!expanded)} title="Show/hide images">
            <I n={expanded?"chevup":"chevdown"} s={12} />{expanded?"Hide":"Images"}
          </button>
          <button className="ti-btn ti-btn-danger" style={{padding:"5px 8px"}} onClick={onDelete} title="Delete question">
            <I n="trash" s={13} />
          </button>
        </div>
      </div>

      {/* Expanded: show images full width */}
      {expanded && (
        <div style={{paddingLeft:42,display:"flex",flexDirection:"column",gap:8,width:"100%"}}>
          {q.images && q.images.length>0 ? (
            <div>
              <div style={{fontSize:10,color:"#475569",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px"}}>Question Image(s)</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {q.images.map((src,i)=>(
                  <img key={i} src={src} alt={`Question ${globalIdx} part ${i+1}`} className="ti-q-img-thumb" onClick={()=>onImgClick(src)} title="Click to zoom" />
                ))}
              </div>
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:8,color:"#334155",fontSize:12}}>
              <I n="img" s={16} />No image found for this question
            </div>
          )}
          {showSolution && q.solutionImages && q.solutionImages.length>0 && (
            <div>
              <div style={{fontSize:10,color:"#34D399",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px"}}>Solution Image(s)</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {q.solutionImages.map((src,i)=>(
                  <img key={i} src={src} alt={`Solution ${globalIdx} part ${i+1}`} className="ti-q-img-thumb" style={{borderColor:"rgba(52,211,153,0.3)"}} onClick={()=>onImgClick(src)} title="Click to zoom solution" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubjectBlock({ subj, subjIdx, onImgClick, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast, showSolution, globalOffset }) {
  const [open, setOpen] = useState(true);
  const color = SUBJ_COLORS[subjIdx % SUBJ_COLORS.length];
  const done = subj.questions.filter(q=>Array.isArray(q.correctAnswer)&&q.correctAnswer.length>0).length;
  const total = subj.questions.length;

  function updateQ(idx, newQ) { const qs=[...subj.questions]; qs[idx]=newQ; onUpdate({...subj,questions:qs}); }
  function deleteQ(idx) { onUpdate({...subj,questions:subj.questions.filter((_,i)=>i!==idx)}); }

  return (
    <div className="ti-card">
      <div className="ti-subj-header" onClick={()=>setOpen(!open)}>
        <div style={{width:10,height:10,borderRadius:"50%",background:color,flexShrink:0}} />
        <input
          className="ti-input"
          value={subj.name}
          onChange={e=>onUpdate({...subj,name:e.target.value})}
          onClick={e=>e.stopPropagation()}
          style={{fontSize:14,fontWeight:600,color:"#E2E8F0",background:"transparent",border:"none",padding:"2px 4px",flex:1,minWidth:0}}
        />
        <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
          <span style={{fontSize:11,color:done<total?"#F87171":"#34D399",fontWeight:600}}>{done}/{total}</span>
          <div style={{width:50}}>
            <div className="ti-progress"><div className="ti-progress-fill" style={{width:`${total?(done/total)*100:0}%`}} /></div>
          </div>
          {!isFirst&&<button className="ti-btn ti-btn-ghost" style={{padding:"3px 7px"}} onClick={e=>{e.stopPropagation();onMoveUp();}} title="Move subject up"><I n="chevup" s={12}/></button>}
          {!isLast&&<button className="ti-btn ti-btn-ghost" style={{padding:"3px 7px"}} onClick={e=>{e.stopPropagation();onMoveDown();}} title="Move subject down"><I n="chevdown" s={12}/></button>}
          <button className="ti-btn ti-btn-danger" style={{padding:"3px 7px"}} onClick={e=>{e.stopPropagation();onDelete();}} title="Remove subject"><I n="trash" s={12}/></button>
          <I n={open?"chevup":"chevdown"} s={14} c="#475569" />
        </div>
      </div>
      {open && subj.questions.map((q,qi)=>(
        <QuestionRow key={qi} q={q} subjColor={color} onImgClick={onImgClick}
          onChange={nq=>updateQ(qi,nq)} onDelete={()=>deleteQ(qi)}
          globalIdx={globalOffset+qi+1} showSolution={showSolution} />
      ))}
    </div>
  );
}

// ─── DETECT FORMAT & PARSE ───────────────────────────────────────────────────
function detectFormat(data) {
  const ak = data.testAnswerKey;
  if (!ak) return "unknown";
  // Get first answer value
  const firstSubj = Object.values(ak)[0];
  if (!firstSubj) return "unknown";
  const firstSec = Object.values(firstSubj)[0];
  if (!firstSec) return "unknown";
  const firstAns = Object.values(firstSec)[0];
  // Old format: answer is plain number e.g. 2
  if (typeof firstAns === "number") return "old";
  // New format: answer is object e.g. {type, answerOptions, correctAnswer:[2]}
  if (typeof firstAns === "object" && firstAns.correctAnswer) return "new";
  return "unknown";
}

function normalizeAnswer(rawAns, qData) {
  if (typeof rawAns === "number") {
    // old format — plain number is the correct option
    return [rawAns];
  }
  if (typeof rawAns === "object" && rawAns !== null) {
    if (Array.isArray(rawAns.correctAnswer)) return rawAns.correctAnswer;
    if (rawAns.correctAnswer !== undefined) return [rawAns.correctAnswer];
  }
  return [];
}

// ─── MAIN IMPORTER ───────────────────────────────────────────────────────────
export default function TestImporter({ onImport, onCancel }) {
  const [step, setStep] = useState("upload");
  const [parseProgress, setParseProgress] = useState(0);
  const [parseMsg, setParseMsg] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [testName, setTestName] = useState("");
  const [testDuration, setTestDuration] = useState(180);
  const [hasSolution, setHasSolution] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [detectedFormat, setDetectedFormat] = useState("");
  const fileRef = useRef();

  async function handleFile(file) {
    if (!file || !file.name.endsWith(".zip")) { setError("Please upload a .zip file."); return; }
    setError(""); setStep("parsing"); setParseProgress(5); setParseMsg("Reading ZIP...");

    try {
      if (!window.JSZip) {
        setParseMsg("Loading ZIP library...");
        await new Promise((res,rej)=>{
          const s=document.createElement("script");
          s.src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
          s.onload=res; s.onerror=rej; document.head.appendChild(s);
        });
      }
      setParseProgress(15); setParseMsg("Extracting files...");

      const zip = await window.JSZip.loadAsync(file);
      const files = Object.keys(zip.files);

      // Find data.json — could be in root or inside a subfolder
      const jsonFile = files.find(f => f.endsWith("data.json") && !zip.files[f].dir);
      if (!jsonFile) throw new Error("No data.json found. Make sure this is a Phodu PDF cropper export.");

      setParseProgress(25); setParseMsg("Parsing test data...");
      const jsonStr = await zip.files[jsonFile].async("string");
      const data = JSON.parse(jsonStr);
      if (!data.pdfCropperData || !data.testAnswerKey) throw new Error("Invalid data.json — expected pdfCropperData and testAnswerKey.");

      // Detect format
      const fmt = detectFormat(data);
      setDetectedFormat(fmt);

      const pc = data.pdfCropperData;
      const ak = data.testAnswerKey;

      // Determine if images are in a subfolder or root
      const imgFiles = files.filter(f => f.endsWith(".png"));
      setParseProgress(35); setParseMsg(`Loading ${imgFiles.length} images...`);

      // Load all images as base64
      const imgMap = {};
      let loaded = 0;
      for (const fname of imgFiles) {
        const b64 = await zip.files[fname].async("base64");
        // Key = just filename without extension and without folder
        const shortName = fname.split("/").pop().replace(".png","");
        imgMap[shortName] = `data:image/png;base64,${b64}`;
        loaded++;
        if (loaded % 5 === 0 || loaded === imgFiles.length) {
          setParseProgress(35 + Math.round((loaded / imgFiles.length) * 50));
          setParseMsg(`Loading images... ${loaded}/${imgFiles.length}`);
        }
      }

      setParseProgress(88); setParseMsg("Building questions...");

      const builtSubjects = Object.keys(pc).map(subjName => {
        const sectionKey = Object.keys(pc[subjName])[0];
        const questions = pc[subjName][sectionKey];
        const answerKey = (ak[subjName]?.[sectionKey]) || {};

        const qList = Object.entries(questions).map(([qKey, qData]) => {
          const qNum = parseInt(qKey);
          const rawAns = answerKey[qKey];
          const correctAnswer = normalizeAnswer(rawAns, qData);

          // Find images: Subject__--__GlobalQNum__--__partNum
          const imgs = [];
          for (let part = 1; part <= 6; part++) {
            const key = `${subjName}__--__${qNum}__--__${part}`;
            if (imgMap[key]) imgs.push(imgMap[key]); else break;
          }

          return {
            id: `q_${qNum}`,
            globalQNum: qNum,
            type: qData.type || "mcq",
            marks: qData.marks || { cm: 3, im: -1 },
            answerOptions: qData.answerOptions || "4",
            correctAnswer,
            images: imgs,
            solutionImages: [],
          };
        });

        return { id: `subj_${subjName}`, name: subjName, questions: qList };
      });

      setParseProgress(100); setParseMsg("Done!");
      setTestName(file.name.replace(".zip","").replace(/_/g," "));
      setSubjects(builtSubjects);
      setTimeout(() => setStep("preview"), 300);

    } catch(e) {
      setError(e.message || "Failed to parse ZIP.");
      setStep("upload");
    }
  }

  function handleDrop(e) { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }
  function moveSubj(idx, dir) {
    const arr=[...subjects], swap=idx+dir;
    if(swap<0||swap>=arr.length) return;
    [arr[idx],arr[swap]]=[arr[swap],arr[idx]]; setSubjects(arr);
  }

  const totalQ = subjects.reduce((a,s)=>a+s.questions.length, 0);
  const answeredQ = subjects.reduce((a,s)=>a+s.questions.filter(q=>Array.isArray(q.correctAnswer)&&q.correctAnswer.length>0).length, 0);
  const totalMarks = subjects.reduce((a,s)=>a+s.questions.reduce((b,q)=>b+(q.marks?.cm||0),0), 0);

  function handleSave() {
    if (!testName.trim()) { setError("Please enter a test name."); return; }
    onImport({
      id: "t"+Date.now(),
      name: testName.trim(),
      duration: testDuration,
      maxMarks: totalMarks,
      date: new Date().toISOString().split("T")[0],
      attempted: false,
      hasSolution,
      subjects,
    });
  }

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",color:"#E2E8F0"}}>
      <style>{S}</style>
      <Lightbox src={lightbox} onClose={()=>setLightbox(null)} />

      {/* ── UPLOAD ── */}
      {step==="upload" && (
        <div>
          <div style={{marginBottom:20}}>
            <h3 style={{fontSize:17,fontWeight:700,color:"#F1F5F9",margin:"0 0 6px"}}>Import Test from ZIP</h3>
            <p style={{fontSize:12,color:"#64748B",margin:0}}>Supports both old and new Phodu PDF cropper formats.</p>
          </div>
          <div className={`ti-drop ${dragging?"over":""}`}
            onDragOver={e=>{e.preventDefault();setDragging(true)}}
            onDragLeave={()=>setDragging(false)}
            onDrop={handleDrop}
            onClick={()=>fileRef.current?.click()}>
            <I n="upload" s={36} c="#7C3AED" />
            <div style={{fontSize:15,fontWeight:600,color:"#E2E8F0",margin:"12px 0 4px"}}>Drop ZIP here or click to browse</div>
            <div style={{fontSize:12,color:"#475569"}}>Phodu PDF cropper export (.zip) — old & new format both work</div>
            <input ref={fileRef} type="file" accept=".zip" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])} />
          </div>
          {error && (
            <div style={{marginTop:14,padding:"10px 14px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:9,display:"flex",gap:8,alignItems:"flex-start"}}>
              <I n="warning" s={16} c="#F87171"/><span style={{fontSize:12,color:"#F87171"}}>{error}</span>
            </div>
          )}
          <div style={{marginTop:16,padding:"12px 16px",background:"rgba(14,165,233,0.06)",border:"1px solid rgba(14,165,233,0.15)",borderRadius:10}}>
            <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <I n="info" s={15} c="#38BDF8"/>
              <div style={{fontSize:12,color:"#64748B",lineHeight:1.7}}>
                <strong style={{color:"#38BDF8"}}>Supported ZIP formats:</strong><br/>
                <span style={{color:"#94A3B8"}}>New format:</span> <code style={{color:"#A78BFA",fontSize:11}}>TestName/data.json + TestName/Subject__--__Q__--__1.png</code><br/>
                <span style={{color:"#94A3B8"}}>Old format:</span> <code style={{color:"#A78BFA",fontSize:11}}>data.json + Subject__--__Q__--__1.png (no subfolder)</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PARSING ── */}
      {step==="parsing" && (
        <div style={{textAlign:"center",padding:"48px 20px"}}>
          <div style={{fontSize:15,fontWeight:600,color:"#E2E8F0",marginBottom:10}}>{parseMsg}</div>
          <div style={{width:"100%",maxWidth:320,margin:"0 auto"}}>
            <div className="ti-progress" style={{height:7}}><div className="ti-progress-fill" style={{width:`${parseProgress}%`}}/></div>
            <div style={{fontSize:12,color:"#475569",marginTop:6}}>{parseProgress}%</div>
          </div>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {step==="preview" && (
        <div>
          {/* Meta bar */}
          <div style={{display:"flex",gap:12,alignItems:"flex-end",marginBottom:16,flexWrap:"wrap"}}>
            <div style={{flex:2,minWidth:200}}>
              <label style={{fontSize:11,color:"#64748B",marginBottom:4,display:"block"}}>Test Name</label>
              <input className="ti-input" value={testName} onChange={e=>setTestName(e.target.value)} style={{width:"100%",fontSize:14,fontWeight:600}} placeholder="Test name..." />
            </div>
            <div>
              <label style={{fontSize:11,color:"#64748B",marginBottom:4,display:"block"}}>Duration (min)</label>
              <input className="ti-input" type="number" value={testDuration} onChange={e=>setTestDuration(Number(e.target.value))} style={{width:80}} />
            </div>
            <div>
              <label style={{fontSize:11,color:"#64748B",marginBottom:4,display:"block"}}>Has Solutions?</label>
              <div style={{display:"flex",gap:6}}>
                {[true,false].map(v=>(
                  <button key={String(v)} onClick={()=>setHasSolution(v)} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${hasSolution===v?"#7C3AED":"rgba(255,255,255,0.1)"}`,background:hasSolution===v?"rgba(124,58,237,0.2)":"transparent",color:hasSolution===v?"#A78BFA":"#64748B",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:hasSolution===v?600:400}}>
                    {v?"Yes":"No"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats + format badge */}
          <div style={{display:"flex",gap:16,marginBottom:16,padding:"12px 16px",background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid rgba(255,255,255,0.06)",flexWrap:"wrap",alignItems:"center"}}>
            {[
              {l:"Subjects",v:subjects.length},
              {l:"Questions",v:totalQ},
              {l:"Answered",v:`${answeredQ}/${totalQ}`,warn:answeredQ<totalQ},
              {l:"Max Marks",v:totalMarks},
              {l:"Duration",v:`${testDuration} min`},
            ].map(s=>(
              <div key={s.l} style={{textAlign:"center",minWidth:60}}>
                <div style={{fontSize:18,fontWeight:700,color:s.warn?"#F87171":"#F1F5F9"}}>{s.v}</div>
                <div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:"0.5px"}}>{s.l}</div>
              </div>
            ))}
            <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
              {detectedFormat && (
                <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:detectedFormat==="new"?"rgba(16,185,129,0.15)":"rgba(251,191,36,0.15)",color:detectedFormat==="new"?"#34D399":"#FCD34D",fontWeight:600}}>
                  {detectedFormat==="new"?"New format":"Old format"} detected
                </span>
              )}
              {answeredQ<totalQ && (
                <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:"rgba(239,68,68,0.1)",color:"#F87171",fontWeight:600}}>
                  {totalQ-answeredQ} missing answers
                </span>
              )}
            </div>
          </div>

          {error && <div style={{marginBottom:12,padding:"10px 14px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:9,fontSize:12,color:"#F87171"}}>{error}</div>}

          {/* Subject blocks */}
          {subjects.map((subj,si)=>{
            const offset = subjects.slice(0,si).reduce((a,s)=>a+s.questions.length,0);
            return (
              <SubjectBlock key={subj.id} subj={subj} subjIdx={si} onImgClick={setLightbox}
                onUpdate={ns=>{const a=[...subjects];a[si]=ns;setSubjects(a);}}
                onDelete={()=>setSubjects(subjects.filter((_,i)=>i!==si))}
                onMoveUp={()=>moveSubj(si,-1)} onMoveDown={()=>moveSubj(si,1)}
                isFirst={si===0} isLast={si===subjects.length-1}
                showSolution={hasSolution} globalOffset={offset} />
            );
          })}

          {/* Actions */}
          <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
            <button className="ti-btn ti-btn-ghost" onClick={onCancel}><I n="x" s={14}/>Cancel</button>
            <button className="ti-btn ti-btn-ghost" onClick={()=>setStep("upload")}><I n="upload" s={14}/>Re-upload</button>
            <button className="ti-btn ti-btn-primary" onClick={handleSave}><I n="save" s={14}/>Save Test to Course</button>
          </div>
        </div>
      )}
    </div>
  );
}
