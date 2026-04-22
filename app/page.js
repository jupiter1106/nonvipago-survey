"use client";
import { useState } from "react";

const ORANGE = "#ec6433";
const ORANGE_LIGHT = "#fdf1ec";
const BLACK = "#111111";
const GRAY = "#6b6b6b";
const BORDER = "#e0e0e0";
const LOGO_URL = "https://i.ibb.co/spH57bZ2/logonvp.png";
const SHEETS_WEBHOOK = "https://script.google.com/macros/s/AKfycbynKYxGn-w6guXGn4DcKJf2CefEgRNu2SKd7-r4eYJcf2llzHsKEVmNuSw3Dmo1qcdz/exec";

const BLOCKS = [
  {
    id: "profilo", title: "Chi sei",
    subtitle: "Tre domande rapide per contestualizzare le tue risposte.",
    questions: [
      { id: "eta", type: "radio", required: true, text: "Quanti anni hai?", cols: 5, options: ["18–25", "26–35", "36–45", "46–55", "56–60"] },
      { id: "patente", type: "bool", required: true, text: "Sei in possesso di una patente di guida?" },
      { id: "frequenza_guida", type: "radio", required: true, text: "Con quale frequenza guidi un veicolo?", cols: 2, options: ["Ogni giorno", "Qualche volta a settimana", "Raramente / Mai"], hideIf: { id: "patente", val: "No" } },
    ]
  },
  {
    id: "diritti", title: "Conosci i tuoi diritti?",
    subtitle: "Nessun giudizio — vogliamo capire quanto queste informazioni circolano davvero.",
    questions: [
      { id: "multa_ricevuta", type: "bool", required: true, text: "Hai ricevuto una multa negli ultimi 3 anni?" },
      { id: "multa_pagata_ingiusta", type: "bool", required: false, text: "Hai mai pagato una multa che pensavi fosse ingiusta o errata?", showIf: { id: "multa_ricevuta", val: "Sì" } },
      { id: "ricorso_gratuito", type: "bool", required: true, text: "Sapevi che il ricorso al Prefetto contro una multa è completamente gratuito?" },
      { id: "termini", type: "radio", required: true, text: "Entro quanti giorni dalla notifica puoi presentare ricorso al Prefetto?", cols: 4, options: ["30 giorni", "60 giorni", "90 giorni", "Non lo so"] },
      { id: "conseguenze_perdita", type: "radio", required: true, text: "Se presenti ricorso al Prefetto e lo perdi, cosa succede?", cols: 1, options: ["Non devo pagare nulla in più", "Rischio di pagare una somma maggiore della multa originale", "Vengo segnalato in una banca dati", "Non lo so"] },
      { id: "consapevolezza", type: "scale", required: true, text: "In generale, quanto ti senti informato/a sui tuoi diritti in materia di sanzioni e ricorsi?", min: 1, max: 5, minLabel: "Per nulla", maxLabel: "Molto" },
    ]
  },
  {
    id: "valore", title: "Le tue preferenze",
    subtitle: "Ci aiuti a capire come le persone affrontano queste situazioni.",
    questions: [
      { id: "autonomia", type: "radio", required: true, text: "Se ricevessi una multa che ritieni ingiusta, come pensi che ti comporteresti?", cols: 1, options: ["Farei ricorso da solo/a senza difficoltà", "Proverei a farlo, ma con qualche difficoltà", "Avrei bisogno di supporto esterno", "Probabilmente pagherei senza contestare"] },
      { id: "ostacoli", type: "multi", required: false, max: 2, text: "Quali sono i principali motivi per cui potresti non fare ricorso da solo/a? (max 2)", options: ["Non so come si fa tecnicamente", "Paura di sbagliare e peggiorare la situazione", "Non ho tempo", "Non ne varrebbe la pena per l'importo", "Ritengo indispensabile l'assistenza di un avvocato"] },
      { id: "familiarita_servizi", type: "radio", required: true, text: "Hai mai utilizzato un servizio online per questioni legali o burocratiche?", cols: 2, options: ["Sì, più volte", "Sì, una volta", "No, ma lo prenderei in considerazione", "No, preferisco affidarmi a un professionista"] },
      { id: "fattore_scelta", type: "radio", required: false, text: "Nella scelta di un servizio per contestare una multa, cosa conta di più per te?", cols: 2, options: ["Il prezzo", "La velocità", "La garanzia di successo", "La presenza di un professionista umano"] },
      { id: "willingness_ai", type: "radio", required: true, text: "Rispetto a un servizio che usa l'intelligenza artificiale per analizzare documenti legali, qual è il tuo atteggiamento?", cols: 1, options: ["Mi fido e lo userei", "Lo userei, ma voglio che un esperto verifichi il risultato", "Ho delle riserve, ma potrei provarlo", "Non mi fido, preferisco un professionista umano"] },
      { id: "wtp", type: "radio", required: false, text: "Quanto saresti disposto/a a spendere per un servizio che prepara un ricorso per una multa?", cols: 3, options: ["Meno di 5€", "5–10€", "10–20€", "Oltre 20€", "Dipende dall'importo della multa"], showIf: { id: "willingness_ai", vals: ["Mi fido e lo userei", "Lo userei, ma voglio che un esperto verifichi il risultato", "Ho delle riserve, ma potrei provarlo"] } },
      { id: "commento", type: "text", required: false, text: "C'è qualcosa che ti ha sempre confuso su multe, ricorsi o debiti? (facoltativo)", placeholder: "Scrivi liberamente..." },
    ]
  }
];

function isVisible(q, ans) {
  if (q.hideIf) { const v = ans[q.hideIf.id]; if (v === q.hideIf.val) return false; }
  if (q.showIf) {
    const v = ans[q.showIf.id];
    if (q.showIf.val && v !== q.showIf.val) return false;
    if (q.showIf.vals && !q.showIf.vals.includes(v)) return false;
  }
  return true;
}

async function submitToSheets(payload) {
  try { await fetch(SHEETS_WEBHOOK, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); } catch {}
}

async function submitEmail(email, type) {
  try { await fetch(SHEETS_WEBHOOK, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, type, timestamp: new Date().toISOString() }) }); } catch {}
}

function Logo({ size = 36 }) {
  return <img src={LOGO_URL} alt="NonViPago" style={{ height: size, width: "auto", objectFit: "contain" }} />;
}

function BoolButtons({ q, ans, onSet }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {["Sì", "No"].map(opt => {
        const sel = ans[q.id] === opt;
        return <button key={opt} onClick={() => onSet(q.id, opt)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1.5px solid ${sel ? ORANGE : BORDER}`, background: sel ? ORANGE : "#fff", cursor: "pointer", fontSize: 15, fontWeight: 500, color: sel ? "#fff" : GRAY, transition: "all 0.15s" }}>{opt}</button>;
      })}
    </div>
  );
}

function RadioGrid({ q, ans, onSet, cols = 2 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(cols, q.options.length)}, 1fr)`, gap: 8 }}>
      {q.options.map(opt => {
        const sel = ans[q.id] === opt;
        return <button key={opt} onClick={() => onSet(q.id, opt)} style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${sel ? ORANGE : BORDER}`, background: sel ? ORANGE_LIGHT : "#fff", cursor: "pointer", textAlign: "left", fontSize: 14, color: sel ? ORANGE : BLACK, fontWeight: sel ? 500 : 400, transition: "all 0.15s", lineHeight: 1.4 }}>{opt}</button>;
      })}
    </div>
  );
}

function MultiGrid({ q, ans, onToggle }) {
  const sel = ans[q.id] || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {q.options.map(opt => {
        const active = sel.includes(opt);
        return (
          <button key={opt} onClick={() => onToggle(q.id, opt, q.max)} style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${active ? ORANGE : BORDER}`, background: active ? ORANGE_LIGHT : "#fff", cursor: "pointer", textAlign: "left", fontSize: 14, color: active ? ORANGE : BLACK, fontWeight: active ? 500 : 400, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${active ? ORANGE : BORDER}`, background: active ? ORANGE : "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {active && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Scale({ q, ans, onSet }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        {Array.from({ length: q.max - q.min + 1 }, (_, i) => i + q.min).map(n => {
          const sel = ans[q.id] === n;
          return <button key={n} onClick={() => onSet(q.id, n)} style={{ flex: 1, aspectRatio: "1", borderRadius: 10, border: `1.5px solid ${sel ? ORANGE : BORDER}`, background: sel ? ORANGE : "#fff", cursor: "pointer", fontSize: 16, fontWeight: sel ? 600 : 400, color: sel ? "#fff" : GRAY, transition: "all 0.15s" }}>{n}</button>;
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 12, color: GRAY }}>{q.minLabel}</span>
        <span style={{ fontSize: 12, color: GRAY }}>{q.maxLabel}</span>
      </div>
    </div>
  );
}

function ThankYou({ answers }) {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const interestedInAI = ["Mi fido e lo userei", "Lo userei, ma voglio che un esperto verifichi il risultato", "Ho delle riserve, ma potrei provarlo"].includes(answers.willingness_ai);

  async function handleEmail() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("Inserisci un indirizzo email valido."); return; }
    setSending(true);
    await submitEmail(email, interestedInAI ? "lead_ai" : "prize");
    setSending(false);
    setEmailSent(true);
  }

  return (
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "1.25rem 1rem 3rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}><Logo /></div>
      <div style={{ textAlign: "center", padding: "2rem 0 1.5rem" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <span style={{ color: "#fff", fontSize: 26 }}>✓</span>
        </div>
        <h2 style={{ fontWeight: 700, fontSize: 22, color: BLACK, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Grazie per aver risposto!</h2>
        <p style={{ color: GRAY, fontSize: 15, lineHeight: 1.7, maxWidth: 380, margin: "0 auto" }}>Le tue risposte ci aiutano a costruire un servizio migliore per tutti i cittadini italiani.</p>
      </div>

      {!emailSent ? (
        <div style={{ margin: "1.5rem 0", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1.25rem 1.5rem" }}>
          {interestedInAI ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: ORANGE, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ti abbiamo letto</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: BLACK, margin: "0 0 6px" }}>Vuoi sapere come funziona NonViPago?</p>
              <p style={{ fontSize: 14, color: GRAY, margin: "0 0 1rem", lineHeight: 1.6 }}>Lascia la tua email e ti contatteremo per mostrarti come contestiamo le multe in pochi minuti.</p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: ORANGE, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Premio speciale</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: BLACK, margin: "0 0 6px" }}>Vinci una contestazione gratuita</p>
              <p style={{ fontSize: 14, color: GRAY, margin: "0 0 1rem", lineHeight: 1.6 }}>Tra tutti i partecipanti sorteggiamo una contestazione gratuita. Lascia la tua email per partecipare.</p>
            </>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} placeholder="la-tua@email.it" style={{ flex: 1, fontSize: 14, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${err ? ORANGE : BORDER}`, color: BLACK, outline: "none", fontFamily: "inherit" }} onKeyDown={e => e.key === "Enter" && handleEmail()} />
            <button onClick={handleEmail} disabled={sending} style={{ padding: "10px 18px", borderRadius: 10, background: sending ? "#f0a882" : ORANGE, color: "#fff", border: "none", cursor: sending ? "default" : "pointer", fontSize: 14, fontWeight: 600 }}>{sending ? "..." : "Invia"}</button>
          </div>
          {err && <p style={{ fontSize: 12, color: ORANGE, margin: "6px 0 0" }}>{err}</p>}
          <p style={{ fontSize: 11, color: "#bbb", margin: "8px 0 0" }}>Nessuno spam. Dati trattati ai sensi del GDPR.</p>
        </div>
      ) : (
        <div style={{ margin: "1.5rem 0", background: ORANGE_LIGHT, border: `1px solid #f5c4a8`, borderRadius: 14, padding: "1.25rem 1.5rem", textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: ORANGE, margin: "0 0 4px" }}>Email ricevuta!</p>
          <p style={{ fontSize: 14, color: GRAY, margin: 0 }}>{interestedInAI ? "Ti contatteremo presto per mostrarti il servizio." : "Sei iscritto/a al sorteggio. Buona fortuna!"}</p>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: "1.5rem", textAlign: "center" }}>
        <Logo size={30} />
        <p style={{ fontSize: 13, color: GRAY, margin: "8px 0 1rem", lineHeight: 1.6 }}>La piattaforma che difende i cittadini da sanzioni e richieste di pagamento ingiuste.</p>
        <a href="https://www.nonvipago.it" style={{ display: "inline-block", padding: "11px 24px", borderRadius: 10, background: ORANGE, color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Scopri NonViPago.it →</a>
      </div>
    </div>
  );
}

export default function Survey() {
  const [block, setBlock] = useState(0);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const current = BLOCKS[block];
  const isLast = block === BLOCKS.length - 1;

  function setAns(id, val) { setAnswers(p => ({ ...p, [id]: val })); setErrors(p => { const e = { ...p }; delete e[id]; return e; }); }
  function toggleMulti(id, val, max) {
    setAnswers(p => {
      const cur = p[id] || [];
      if (cur.includes(val)) return { ...p, [id]: cur.filter(v => v !== val) };
      if (cur.length >= max) return p;
      return { ...p, [id]: [...cur, val] };
    });
    setErrors(p => { const e = { ...p }; delete e[id]; return e; });
  }

  function validate() {
    const errs = {};
    current.questions.forEach(q => {
      if (!isVisible(q, answers)) return;
      if (!q.required) return;
      const v = answers[q.id];
      if (q.type === "multi") { if (!v || !v.length) errs[q.id] = true; }
      else if (v === undefined || v === null || v === "") errs[q.id] = true;
    });
    return errs;
  }

  async function proceed(partial) {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSending(true);
    await submitToSheets({ timestamp: new Date().toISOString(), completedBlocks: BLOCKS.slice(0, block + 1).map(b => b.id), partial, answers });
    setSending(false);
    if (partial) { setStatus("partial"); return; }
    if (!isLast) { setBlock(b => b + 1); typeof window !== "undefined" && window.scrollTo(0, 0); }
    else setStatus("done");
  }

  if (status === "partial") return (
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "1.25rem 1rem 3rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}><Logo /></div>
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}><span style={{ color: "#fff", fontSize: 26 }}>✓</span></div>
        <h2 style={{ fontWeight: 700, fontSize: 22, color: BLACK, margin: "0 0 8px" }}>Risposte salvate</h2>
        <p style={{ color: GRAY, fontSize: 15, lineHeight: 1.7, maxWidth: 360, margin: "0 auto 2rem" }}>Abbiamo ricevuto le tue risposte parziali. Ogni contributo conta.</p>
        <a href="https://www.nonvipago.it" style={{ display: "inline-block", padding: "11px 24px", borderRadius: 10, background: ORANGE, color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Scopri NonViPago.it →</a>
      </div>
    </div>
  );

  if (status === "done") return <ThankYou answers={answers} />;

  const pct = Math.round((block / BLOCKS.length) * 100) + Math.round(100 / BLOCKS.length);

  return (
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "1.25rem 1rem 3rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <Logo />
          <span style={{ fontSize: 12, color: GRAY }}>Parte {block + 1} di {BLOCKS.length}</span>
        </div>
        <div style={{ height: 3, background: "#ebebeb", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: ORANGE, borderRadius: 99, transition: "width 0.45s cubic-bezier(0.4,0,0.2,1)" }} />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          {BLOCKS.map((b, i) => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: i <= block ? ORANGE : "#dedede", transition: "background 0.3s", flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: i === block ? ORANGE : GRAY, fontWeight: i === block ? 600 : 400 }}>{b.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: BLACK, margin: "0 0 6px", letterSpacing: "-0.02em" }}>{current.title}</h1>
        <p style={{ fontSize: 14, color: GRAY, margin: 0, lineHeight: 1.6 }}>{current.subtitle}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {current.questions.map((q, qi) => {
          if (!isVisible(q, answers)) return null;
          const err = errors[q.id];
          return (
            <div key={q.id} style={{ background: "#fff", border: `1px solid ${err ? "#f5a89a" : BORDER}`, borderRadius: 14, padding: "1.125rem 1.25rem", transition: "border-color 0.2s" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: BLACK, margin: "0 0 0.875rem", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ background: err ? "#fdf0ee" : "#f5f5f5", color: err ? ORANGE : GRAY, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "2px 7px", flexShrink: 0, marginTop: 1 }}>{qi + 1}</span>
                {q.text}{q.required && <span style={{ color: ORANGE, fontSize: 12, marginLeft: 2 }}>*</span>}
              </p>
              {err && <p style={{ fontSize: 12, color: ORANGE, margin: "-0.5rem 0 0.625rem", paddingLeft: 32 }}>Risposta richiesta</p>}
              {q.type === "bool" && <BoolButtons q={q} ans={answers} onSet={setAns} />}
              {q.type === "radio" && <RadioGrid q={q} ans={answers} onSet={setAns} cols={q.cols || 2} />}
              {q.type === "multi" && <MultiGrid q={q} ans={answers} onToggle={toggleMulti} />}
              {q.type === "scale" && <Scale q={q} ans={answers} onSet={setAns} />}
              {q.type === "text" && <textarea value={answers[q.id] || ""} onChange={e => setAns(q.id, e.target.value)} placeholder={q.placeholder} rows={3} style={{ width: "100%", fontSize: 14, padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, color: BLACK, resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={() => proceed(false)} disabled={sending} style={{ padding: "13px 20px", borderRadius: 10, background: sending ? "#f0a882" : ORANGE, color: "#fff", border: "none", cursor: sending ? "default" : "pointer", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", transition: "background 0.2s" }}>
          {sending ? "Salvataggio..." : isLast ? "Invia le risposte ✓" : "Continua →"}
        </button>
        {!isLast && <button onClick={() => proceed(true)} disabled={sending} style={{ padding: "11px 20px", borderRadius: 10, background: "transparent", color: GRAY, border: `1px solid ${BORDER}`, cursor: "pointer", fontSize: 14 }}>Preferisco fermarmi qui — invia le mie risposte</button>}
      </div>

      <p style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginTop: "1.25rem", lineHeight: 1.7 }}>
        Anonimo · GDPR compliant · <a href="https://www.nonvipago.it/privacy-policy" style={{ color: "#bbb" }}>Privacy policy</a>
      </p>
    </div>
  );
}
