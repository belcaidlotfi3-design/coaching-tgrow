import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Données fixes ────────────────────────────────────────────────────────────
const CREW = ["Oumaima Helbaje", "Elbachir Essaddiqi"];
const AGENTS = [
  "Meryem Gourram","Douaa Laaroussi","Haitam Kabous","Imane Bentayaa","Khaoula Chail",
  "Safae Benmarraze","Salma Bettahi","Mahdi Ben Hommane","Fadoua Adli","Nawal Taryaoui",
  "Sofia Benhlima","Mohammed Amine Bennour","Rida Boufker","Saida El Ghazoui","Mohamed Elhihi",
  "Ayoub Khalki","Montassir Alaoui","Ibrahim Amarti","Imane Amharech","Firdaous Ben Halima",
  "Yassir Hamaydou","Saad Marouane Ouali","Wissal Jida","Mimoun Ouberri","Adam Millimono",
  "Fadoua Hamdane","Assim Sibah","Chaymae Benabbou","Yassine Hazzat","Ismail Ouhramskour",
  "Ikram Daoudi","Ezzahrae Oukayou","Ilyass Mdiker","Sihame Naaoua","Abdelqodouss Lamrani",
  "Soukaina Erbai","Bouchra Chemmam","Kheireddine Sahroufi","Aymane Kamal","Mohieddine El Mehdi",
  "Hajar Benhayoun","Mounir Outini","Khaoula Belrhiti","Fatima-Ezzahrae Mardassi",
  "Wassim Kabbaj","Hamza Ghanem","Tarik Loumrhari"
];
const ROLES = { MANAGER: "manager", CREW: "crew", AGENT: "agent" };

// Utilisateurs (à adapter — en prod, utiliser Supabase Auth)
const USERS = [
  { id: "manager", name: "Manager", role: ROLES.MANAGER, password: "manager2025" },
  { id: "oumaima", name: "Oumaima Helbaje", role: ROLES.CREW, crew: "Oumaima Helbaje", password: "oumaima2025" },
  { id: "elbachir", name: "Elbachir Essaddiqi", role: ROLES.CREW, crew: "Elbachir Essaddiqi", password: "elbachir2025" },
  ...AGENTS.map(a => ({
    id: a.toLowerCase().replace(/\s+/g, "."),
    name: a, role: ROLES.AGENT, agent: a,
    password: a.split(" ")[0].toLowerCase() + "2025"
  }))
];

// ─── Couleurs ─────────────────────────────────────────────────────────────────
const TC = { "Coaching TGROW":"#185FA5", "Follow-up OK":"#3B6D11", "Follow-up NOK":"#993556" };
const TB = { "Coaching TGROW":"#E6F1FB", "Follow-up OK":"#EAF3DE", "Follow-up NOK":"#FBEAF0" };
const DS = {
  late: { label:"Deadline dépassée", bg:"#FCEBEB", color:"#A32D2D" },
  soon: { label:"Deadline proche",   bg:"#FAEEDA", color:"#854F0B" },
  ok:   { label:"Dans les délais",   bg:"#EAF3DE", color:"#3B6D11" },
  done: { label:"Clôturé",           bg:"#F1EFE8", color:"#5F5E5A" },
};

const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const fmt = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

function dlStatus(deadline, followup_statut) {
  if (!deadline) return null;
  if (followup_statut === "OK" || followup_statut === "NOK") return "done";
  const dl = new Date(deadline); dl.setHours(0,0,0,0);
  const diff = Math.ceil((dl - today()) / 86400000);
  if (diff < 0) return "late";
  if (diff <= 3) return "soon";
  return "ok";
}

// ─── Composants utilitaires ───────────────────────────────────────────────────
const Badge = ({ label, bg, color }) => (
  <span style={{ fontSize:11, padding:"2px 8px", borderRadius:4, background:bg, color, fontWeight:500, whiteSpace:"nowrap" }}>{label}</span>
);

const DLBadge = ({ deadline, followup_statut }) => {
  const s = dlStatus(deadline, followup_statut);
  if (!s) return null;
  const dl = new Date(deadline); dl.setHours(0,0,0,0);
  const diff = Math.ceil((dl - today()) / 86400000);
  const info = DS[s];
  const txt = s==="late" ? `${Math.abs(diff)}j de retard` : s==="done" ? "Clôturé" : s==="soon" ? `J-${diff}` : `+${diff}j`;
  return <Badge label={txt} bg={info.bg} color={info.color} />;
};

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:4 }}>{label}</div>}
    <input {...props} style={{ width:"100%", fontSize:13, padding:"6px 10px", borderRadius:6,
      border:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)",
      color:"var(--color-text-primary)", boxSizing:"border-box", ...props.style }} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:4 }}>{label}</div>}
    <select {...props} style={{ width:"100%", fontSize:13, padding:"6px 10px", borderRadius:6,
      border:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)",
      color:"var(--color-text-primary)" }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:4 }}>{label}</div>}
    <textarea {...props} style={{ width:"100%", fontSize:13, padding:"6px 10px", borderRadius:6,
      border:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)",
      color:"var(--color-text-primary)", resize:"vertical", boxSizing:"border-box" }} />
  </div>
);

// ─── Écran de connexion ───────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  const login = () => {
    const u = USERS.find(u => u.name.toLowerCase() === name.toLowerCase() && u.password === pwd);
    if (u) { setErr(""); onLogin(u); }
    else setErr("Nom ou mot de passe incorrect.");
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"var(--color-background-secondary)", fontFamily:"var(--font-sans)" }}>
      <div style={{ background:"var(--color-background-primary)", borderRadius:12, padding:"2rem",
        width:340, border:"0.5px solid var(--color-border-tertiary)" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
          <div style={{ fontSize:18, fontWeight:500 }}>Coaching TGROW</div>
          <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginTop:4 }}>Connectez-vous pour accéder au dashboard</div>
        </div>
        <Input label="Nom complet" placeholder="Ex: Oumaima Helbaje" value={name} onChange={e=>setName(e.target.value)} />
        <Input label="Mot de passe" type="password" value={pwd} onChange={e=>setPwd(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&login()} />
        {err && <div style={{ fontSize:12, color:"#A32D2D", marginBottom:12 }}>{err}</div>}
        <button onClick={login} style={{ width:"100%", padding:"10px", borderRadius:6, border:"none",
          background:"#185FA5", color:"#fff", cursor:"pointer", fontSize:14, fontWeight:500 }}>
          Se connecter
        </button>
      </div>
    </div>
  );
}

// ─── Modal : Nouveau coaching ─────────────────────────────────────────────────
function AddModal({ user, onClose, onSaved }) {
  const defaultCrew = user.role === ROLES.CREW ? user.crew : CREW[0];
  const [form, setForm] = useState({ agent:AGENTS[0], crew:defaultCrew, type:"Coaching TGROW", plan_action:"", deadline:"", notes:"" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const save = async () => {
    if (!form.agent || !form.crew) return setErr("Agent et crew guide requis.");
    setLoading(true); setErr("");
    const { error } = await supabase.from("coachings").insert([{
      agent: form.agent, crew: form.crew, type: form.type,
      plan_action: form.plan_action || null,
      deadline: form.deadline || null,
      followup_statut: "En attente",
      notes: form.notes || null,
      date_coaching: new Date().toISOString().split("T")[0],
      locked: true
    }]);
    setLoading(false);
    if (error) return setErr("Erreur : " + error.message);
    onSaved();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:999 }}>
      <div style={{ background:"var(--color-background-primary)", borderRadius:12, padding:"1.5rem",
        width:400, border:"0.5px solid var(--color-border-secondary)", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ fontSize:15, fontWeight:500, marginBottom:16 }}>Nouveau coaching TGROW</div>

        <Select label="Agent" options={AGENTS} value={form.agent} onChange={e=>set("agent",e.target.value)} />
        {user.role === ROLES.MANAGER
          ? <Select label="Crew guide" options={CREW} value={form.crew} onChange={e=>set("crew",e.target.value)} />
          : <div style={{ marginBottom:12, fontSize:12, color:"var(--color-text-secondary)" }}>Crew guide : <strong>{form.crew}</strong></div>
        }
        <Select label="Type" options={["Coaching TGROW","Follow-up OK","Follow-up NOK"]} value={form.type} onChange={e=>set("type",e.target.value)} />

        {form.type === "Coaching TGROW" && <>
          <Textarea label="Plan d'action fixé avec l'agent" rows={3}
            placeholder="Décrivez les actions convenues (étape W du TGROW)..."
            value={form.plan_action} onChange={e=>set("plan_action",e.target.value)} />
          <Input label="Deadline du follow-up" type="date" value={form.deadline} onChange={e=>set("deadline",e.target.value)} />
        </>}

        <Textarea label="Notes (optionnel)" rows={2} value={form.notes} onChange={e=>set("notes",e.target.value)} />

        {err && <div style={{ fontSize:12, color:"#A32D2D", marginBottom:8 }}>{err}</div>}
        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:"8px", borderRadius:6,
            border:"0.5px solid var(--color-border-secondary)", background:"transparent",
            cursor:"pointer", fontSize:13, color:"var(--color-text-secondary)" }}>Annuler</button>
          <button onClick={save} disabled={loading} style={{ flex:1, padding:"8px", borderRadius:6,
            border:"none", background:"#185FA5", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:500 }}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal : Mettre à jour le follow-up ──────────────────────────────────────
function FollowupModal({ coaching, onClose, onSaved }) {
  const [statut, setStatut] = useState(coaching.followup_statut || "En attente");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    await supabase.from("coachings").update({ followup_statut: statut }).eq("id", coaching.id);
    setLoading(false);
    onSaved();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:999 }}>
      <div style={{ background:"var(--color-background-primary)", borderRadius:12, padding:"1.5rem",
        width:360, border:"0.5px solid var(--color-border-secondary)" }}>
        <div style={{ fontSize:15, fontWeight:500, marginBottom:4 }}>Résultat du follow-up</div>
        <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:16 }}>{coaching.agent} · {fmt(coaching.deadline)}</div>

        {coaching.plan_action && (
          <div style={{ padding:"10px 12px", background:"var(--color-background-secondary)",
            borderRadius:8, marginBottom:16, fontSize:12, color:"var(--color-text-secondary)" }}>
            <div style={{ fontWeight:500, color:"var(--color-text-primary)", marginBottom:4 }}>Plan d'action :</div>
            {coaching.plan_action}
          </div>
        )}

        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          {["OK","NOK","En attente"].map(s => (
            <button key={s} onClick={()=>setStatut(s)} style={{ flex:1, padding:"12px 8px", borderRadius:8,
              border:`1.5px solid ${statut===s ? (s==="OK"?"#3B6D11":s==="NOK"?"#993556":"#185FA5") : "var(--color-border-tertiary)"}`,
              background: statut===s ? (s==="OK"?"#EAF3DE":s==="NOK"?"#FBEAF0":"#E6F1FB") : "transparent",
              color: statut===s ? (s==="OK"?"#3B6D11":s==="NOK"?"#993556":"#185FA5") : "var(--color-text-secondary)",
              cursor:"pointer", fontWeight:500, fontSize:13 }}>
              {s==="OK"?"✅ OK":s==="NOK"?"❌ NOK":"⏳ En attente"}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:"8px", borderRadius:6,
            border:"0.5px solid var(--color-border-secondary)", background:"transparent",
            cursor:"pointer", fontSize:13, color:"var(--color-text-secondary)" }}>Annuler</button>
          <button onClick={save} disabled={loading} style={{ flex:1, padding:"8px", borderRadius:6,
            border:"none", background:"#185FA5", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:500 }}>
            {loading ? "Enregistrement..." : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
  const [coachings, setCoachings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState("global");
  const [periode, setPeriode]     = useState("Tout");
  const [crewFilter, setCrewFilter] = useState("Tous");
  const [search, setSearch]       = useState("");
  const [dlFilter, setDlFilter]   = useState("Tous");
  const [addOpen, setAddOpen]     = useState(false);
  const [fuModal, setFuModal]     = useState(null);

  const canEdit = user.role === ROLES.MANAGER || user.role === ROLES.CREW;

  const load = async () => {
    setLoading(true);
    let q = supabase.from("coachings").select("*").order("date_coaching", { ascending:false });
    if (user.role === ROLES.AGENT) q = q.eq("agent", user.agent);
    const { data } = await q;
    setCoachings(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Supabase realtime
  useEffect(() => {
    const sub = supabase.channel("coachings-channel")
      .on("postgres_changes", { event:"*", schema:"public", table:"coachings" }, load)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const filtered = useMemo(() => {
    let d = coachings;
    if (crewFilter !== "Tous") d = d.filter(c => c.crew === crewFilter);
    const now = new Date();
    if (periode === "M1") d = d.filter(c => c.date_coaching?.startsWith(`${now.getFullYear()}-01`));
    if (periode === "M2") d = d.filter(c => c.date_coaching?.startsWith(`${now.getFullYear()}-02`));
    if (periode === "M3") d = d.filter(c => c.date_coaching?.startsWith(`${now.getFullYear()}-03`));
    if (periode === "Q2") d = d.filter(c => c.date_coaching >= `${now.getFullYear()}-04-01`);
    if (search) d = d.filter(c => c.agent?.toLowerCase().includes(search.toLowerCase()));
    return d;
  }, [coachings, crewFilter, periode, search]);

  const tgrows   = filtered.filter(c => c.type === "Coaching TGROW");
  const followups = filtered.filter(c => c.type !== "Coaching TGROW");
  const nbOK     = filtered.filter(c => c.followup_statut === "OK").length;
  const nbNOK    = filtered.filter(c => c.followup_statut === "NOK").length;
  const txOK     = followups.length > 0 ? Math.round((nbOK / followups.length) * 100) : 0;
  const agents   = [...new Set(filtered.map(c => c.agent))].length;

  const withDL   = coachings.filter(c => c.type === "Coaching TGROW" && c.deadline);
  const late     = withDL.filter(c => dlStatus(c.deadline, c.followup_statut) === "late");
  const soon     = withDL.filter(c => dlStatus(c.deadline, c.followup_statut) === "soon");

  const dlItems  = useMemo(() => {
    let d = withDL;
    if (crewFilter !== "Tous") d = d.filter(c => c.crew === crewFilter);
    if (dlFilter !== "Tous") d = d.filter(c => dlStatus(c.deadline, c.followup_statut) === dlFilter);
    return d.sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
  }, [coachings, crewFilter, dlFilter]);

  const byAgent = AGENTS.map(a => {
    const cs = filtered.filter(c => c.agent === a);
    return { a, n:cs.length,
      tgrow: cs.filter(c=>c.type==="Coaching TGROW").length,
      ok:    cs.filter(c=>c.followup_statut==="OK").length,
      nok:   cs.filter(c=>c.followup_statut==="NOK").length,
      hasLate: cs.some(c=>dlStatus(c.deadline,c.followup_statut)==="late")
    };
  }).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);

  const byCrew = CREW.map(cr => {
    const cs = filtered.filter(c => c.crew === cr);
    const ok = cs.filter(c=>c.followup_statut==="OK").length;
    const fu = cs.filter(c=>c.type!=="Coaching TGROW").length;
    return { cr, n:cs.length, agents:[...new Set(cs.map(c=>c.agent))].length,
      tgrow: cs.filter(c=>c.type==="Coaching TGROW").length,
      ok, nok:cs.filter(c=>c.followup_statut==="NOK").length,
      txOK: fu>0 ? Math.round((ok/fu)*100) : 0 };
  });

  const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const byMonth = MONTHS.map((m,i) => {
    const key = `${new Date().getFullYear()}-${String(i+1).padStart(2,"0")}`;
    const mo  = filtered.filter(c=>c.date_coaching?.startsWith(key));
    return { m, tgrow:mo.filter(c=>c.type==="Coaching TGROW").length,
      ok:mo.filter(c=>c.type==="Follow-up OK").length,
      nok:mo.filter(c=>c.type==="Follow-up NOK").length };
  });
  const maxMonth = Math.max(...byMonth.map(x=>x.tgrow+x.ok+x.nok),1);

  const navBtn = v => ({
    padding:"7px 14px", border:"none", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:500,
    background: view===v ? "#185FA5" : "transparent",
    color: view===v ? "#fff" : "var(--color-text-secondary)"
  });
  const pBtn = (p) => ({
    padding:"4px 10px", border:"0.5px solid", borderRadius:6, cursor:"pointer", fontSize:11,
    borderColor: periode===p ? "#185FA5" : "var(--color-border-tertiary)",
    background:  periode===p ? "#E6F1FB" : "transparent",
    color:       periode===p ? "#185FA5" : "var(--color-text-secondary)"
  });

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"var(--font-sans)", color:"var(--color-text-secondary)" }}>
      Chargement des données...
    </div>
  );

  return (
    <div style={{ fontFamily:"var(--font-sans)", padding:"1rem", maxWidth:740, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.75rem" }}>
        <div>
          <h2 style={{ margin:"0 0 2px", fontSize:18, fontWeight:500 }}>Suivi des coachings TGROW</h2>
          <p style={{ margin:0, fontSize:12, color:"var(--color-text-secondary)" }}>
            {user.role === ROLES.AGENT ? `Vue agent — ${user.name}` : `Connecté : ${user.name}`}
          </p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {canEdit && (
            <button onClick={()=>setAddOpen(true)} style={{ padding:"6px 14px", fontSize:12, fontWeight:500,
              borderRadius:6, border:"none", background:"#185FA5", color:"#fff", cursor:"pointer" }}>
              + Nouveau coaching
            </button>
          )}
          <button onClick={onLogout} style={{ padding:"6px 12px", fontSize:11, borderRadius:6,
            border:"0.5px solid var(--color-border-tertiary)", background:"transparent",
            color:"var(--color-text-secondary)", cursor:"pointer" }}>Déconnexion</button>
        </div>
      </div>

      {/* Alertes deadlines */}
      {(late.length>0||soon.length>0) && (
        <div style={{ display:"flex", gap:8, marginBottom:"0.75rem", flexWrap:"wrap" }}>
          {late.length>0 && (
            <div style={{ flex:1, minWidth:160, display:"flex", alignItems:"center", gap:10,
              padding:"8px 14px", background:"#FCEBEB", borderRadius:8, border:"0.5px solid #F09595" }}>
              <div style={{ fontSize:20, fontWeight:500, color:"#A32D2D" }}>{late.length}</div>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:"#A32D2D" }}>Deadline(s) dépassée(s)</div>
                <div style={{ fontSize:10, color:"#A32D2D", opacity:.8 }}>Follow-up en retard</div>
              </div>
            </div>
          )}
          {soon.length>0 && (
            <div style={{ flex:1, minWidth:160, display:"flex", alignItems:"center", gap:10,
              padding:"8px 14px", background:"#FAEEDA", borderRadius:8, border:"0.5px solid #FAC775" }}>
              <div style={{ fontSize:20, fontWeight:500, color:"#854F0B" }}>{soon.length}</div>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:"#854F0B" }}>Deadline(s) dans 3 jours</div>
                <div style={{ fontSize:10, color:"#854F0B", opacity:.8 }}>À relancer rapidement</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtres */}
      <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:"0.75rem" }}>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {["Tout","M1","M2","M3","Q2"].map(p=>(
            <button key={p} style={pBtn(p)} onClick={()=>setPeriode(p)}>{p}</button>
          ))}
        </div>
        {user.role !== ROLES.AGENT && (
          <select value={crewFilter} onChange={e=>setCrewFilter(e.target.value)}
            style={{ fontSize:12, padding:"4px 8px", borderRadius:6,
              border:"0.5px solid var(--color-border-tertiary)",
              background:"var(--color-background-primary)", color:"var(--color-text-primary)" }}>
            <option>Tous</option>
            {CREW.map(c=><option key={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* KPI */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:"0.75rem" }}>
        {[
          { label:"Coachings TGROW",    val:tgrows.length,    color:"#185FA5" },
          { label:"Follow-ups réalisés", val:followups.length, color:"#BA7517" },
          { label:"Taux OK",             val:txOK+"%",         color:"#3B6D11" },
          { label:"Agents coachés",      val:agents,           color:"#534AB7" },
        ].map(k=>(
          <div key={k.label} style={{ background:"var(--color-background-secondary)", borderRadius:8, padding:"10px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:500, color:k.color }}>{k.val}</div>
            <div style={{ fontSize:10, color:"var(--color-text-secondary)", marginTop:3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Nav */}
      <div style={{ display:"flex", gap:4, marginBottom:"0.75rem",
        borderBottom:"0.5px solid var(--color-border-tertiary)", paddingBottom:8, flexWrap:"wrap" }}>
        {[["global","Vue globale"],["deadlines","Deadlines"],["agents","Par agent"],["crew","Par crew guide"],["liste","Liste"]].map(([v,l])=>(
          <button key={v} style={navBtn(v)} onClick={()=>setView(v)}>
            {v==="deadlines" && late.length>0
              ? <>{l} <span style={{ background:"#A32D2D", color:"#fff", borderRadius:"50%", fontSize:9, padding:"0 4px", marginLeft:2 }}>{late.length}</span></>
              : l}
          </button>
        ))}
      </div>

      {/* ── VUE GLOBALE ── */}
      {view==="global" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {/* Évolution */}
            <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, padding:"1rem" }}>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:12 }}>Évolution mensuelle</div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:100 }}>
                {byMonth.map(({m,tgrow,ok,nok})=>{
                  const tot=tgrow+ok+nok;
                  return (
                    <div key={m} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                      <div style={{ fontSize:8, color:"var(--color-text-secondary)" }}>{tot||""}</div>
                      <div style={{ width:"100%", display:"flex", flexDirection:"column",
                        borderRadius:"3px 3px 0 0", overflow:"hidden",
                        height: tot>0 ? `${Math.round((tot/maxMonth)*80)}px` : "3px" }}>
                        <div style={{ flex:tgrow, background:TC["Coaching TGROW"] }}/>
                        <div style={{ flex:ok,    background:TC["Follow-up OK"] }}/>
                        <div style={{ flex:nok,   background:TC["Follow-up NOK"] }}/>
                      </div>
                      <div style={{ fontSize:8, color:"var(--color-text-secondary)" }}>{m}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Follow-up résultats */}
            <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, padding:"1rem" }}>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:12 }}>Résultats follow-ups</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                <div style={{ textAlign:"center", padding:"12px 6px", background:"#EAF3DE", borderRadius:8 }}>
                  <div style={{ fontSize:24, fontWeight:500, color:"#3B6D11" }}>{nbOK}</div>
                  <div style={{ fontSize:11, color:"#3B6D11", marginTop:2 }}>Follow-up OK</div>
                </div>
                <div style={{ textAlign:"center", padding:"12px 6px", background:"#FBEAF0", borderRadius:8 }}>
                  <div style={{ fontSize:24, fontWeight:500, color:"#993556" }}>{nbNOK}</div>
                  <div style={{ fontSize:11, color:"#993556", marginTop:2 }}>Follow-up NOK</div>
                </div>
              </div>
              {followups.length>0 && (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                    <span style={{ color:"var(--color-text-secondary)" }}>Taux de réussite</span>
                    <span style={{ fontWeight:500, color:"#3B6D11" }}>{txOK}%</span>
                  </div>
                  <div style={{ background:"var(--color-background-secondary)", borderRadius:4, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${txOK}%`, height:"100%", background:"#3B6D11", borderRadius:4 }}/>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DEADLINES ── */}
      {view==="deadlines" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {[["Tous","Tous"],["late","En retard"],["soon","Proche"],["ok","Dans les délais"],["done","Clôturé"]].map(([k,l])=>(
              <button key={k} onClick={()=>setDlFilter(k)} style={{ padding:"4px 12px", fontSize:11, borderRadius:6, cursor:"pointer", border:"0.5px solid",
                borderColor: dlFilter===k ? (DS[k]?.color||"#185FA5") : "var(--color-border-tertiary)",
                background:  dlFilter===k ? (DS[k]?.bg||"#E6F1FB") : "transparent",
                color:       dlFilter===k ? (DS[k]?.color||"#185FA5") : "var(--color-text-secondary)" }}>
                {l}{k==="late"&&late.length>0?` (${late.length})`:k==="soon"&&soon.length>0?` (${soon.length})`:""}</button>
            ))}
          </div>
          {dlItems.length===0 && (
            <div style={{ fontSize:13, color:"var(--color-text-secondary)", textAlign:"center", padding:"2rem" }}>Aucun coaching dans cette catégorie.</div>
          )}
          {dlItems.map(c => {
            const s    = dlStatus(c.deadline, c.followup_statut);
            const info = DS[s] || DS.ok;
            const dl   = new Date(c.deadline); dl.setHours(0,0,0,0);
            const diff = Math.ceil((dl - today()) / 86400000);
            return (
              <div key={c.id} style={{ background:"var(--color-background-primary)",
                border:`0.5px solid ${s==="late"?"#F09595":s==="soon"?"#FAC775":"var(--color-border-tertiary)"}`,
                borderRadius:10, padding:"1rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:13, fontWeight:500 }}>{c.agent}</span>
                      <span style={{ fontSize:11, color:"var(--color-text-secondary)" }}>· {c.crew}</span>
                    </div>
                    {c.plan_action && (
                      <div style={{ fontSize:12, padding:"6px 10px", background:"var(--color-background-secondary)",
                        borderRadius:6, marginBottom:8, color:"var(--color-text-secondary)" }}>
                        <span style={{ fontWeight:500, color:"var(--color-text-primary)" }}>Plan d'action : </span>{c.plan_action}
                      </div>
                    )}
                    <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, color:"var(--color-text-secondary)" }}>
                        Deadline : <strong style={{ color:"var(--color-text-primary)" }}>{fmt(c.deadline)}</strong>
                      </span>
                      <DLBadge deadline={c.deadline} followup_statut={c.followup_statut} />
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:20, fontWeight:500, color:info.color }}>
                      {s==="late"?`-${Math.abs(diff)}j`:s==="done"?"✓":s==="soon"?`J-${diff}`:`+${diff}j`}
                    </div>
                    {canEdit && c.followup_statut === "En attente" && (
                      <button onClick={()=>setFuModal(c)} style={{ marginTop:6, padding:"4px 10px", fontSize:11,
                        borderRadius:6, border:"0.5px solid #185FA5", background:"transparent",
                        color:"#185FA5", cursor:"pointer" }}>Mettre à jour</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PAR AGENT ── */}
      {view==="agents" && (
        <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, padding:"1rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:500 }}>Par agent</div>
            <input placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ fontSize:12, padding:"5px 10px", borderRadius:6,
                border:"0.5px solid var(--color-border-tertiary)",
                background:"var(--color-background-secondary)",
                color:"var(--color-text-primary)", width:180 }}/>
          </div>
          <div style={{ maxHeight:480, overflowY:"auto" }}>
            {byAgent.map(({a,n,tgrow,ok,nok,hasLate})=>(
              <div key={a} style={{ marginBottom:12, paddingBottom:12, borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontWeight:500 }}>{a}</span>
                    {hasLate && <Badge label="Retard" bg="#FCEBEB" color="#A32D2D" />}
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    <Badge label={`${tgrow} TGROW`} bg={TB["Coaching TGROW"]} color={TC["Coaching TGROW"]} />
                    {(ok+nok)>0 && <Badge label={`${ok} OK · ${nok} NOK`} bg={ok>=nok?"#EAF3DE":"#FBEAF0"} color={ok>=nok?"#3B6D11":"#993556"} />}
                  </div>
                </div>
                <div style={{ display:"flex", height:7, borderRadius:4, overflow:"hidden", background:"var(--color-background-secondary)" }}>
                  {tgrow>0&&<div style={{ flex:tgrow, background:TC["Coaching TGROW"] }}/>}
                  {ok>0&&<div style={{ flex:ok, background:TC["Follow-up OK"] }}/>}
                  {nok>0&&<div style={{ flex:nok, background:TC["Follow-up NOK"] }}/>}
                </div>
              </div>
            ))}
            {byAgent.length===0 && <div style={{ fontSize:12, color:"var(--color-text-secondary)", textAlign:"center", padding:"1rem" }}>Aucun résultat</div>}
          </div>
        </div>
      )}

      {/* ── PAR CREW ── */}
      {view==="crew" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {byCrew.map(({cr,n,agents,tgrow,ok,nok,txOK:tx})=>{
            const crAgents = [...new Set(filtered.filter(c=>c.crew===cr).map(c=>c.agent))];
            return (
              <div key={cr} style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, padding:"1rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500 }}>{cr}</div>
                    <div style={{ fontSize:11, color:"var(--color-text-secondary)" }}>{agents} agents · {n} entrées</div>
                  </div>
                  <div style={{ fontSize:22, fontWeight:500, color:"#185FA5" }}>{n}</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
                  {[["Coaching TGROW",tgrow,"Coachings"],["Follow-up OK",ok,"OK"],["Follow-up NOK",nok,"NOK"]].map(([t,v,lbl])=>(
                    <div key={t} style={{ textAlign:"center", padding:"10px 6px", background:TB[t], borderRadius:7 }}>
                      <div style={{ fontSize:20, fontWeight:500, color:TC[t] }}>{v}</div>
                      <div style={{ fontSize:10, color:TC[t], marginTop:2 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
                {(ok+nok)>0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                      <span style={{ color:"var(--color-text-secondary)" }}>Taux de réussite follow-up</span>
                      <span style={{ fontWeight:500, color:"#3B6D11" }}>{tx}%</span>
                    </div>
                    <div style={{ background:"var(--color-background-secondary)", borderRadius:4, height:7, overflow:"hidden" }}>
                      <div style={{ width:`${tx}%`, height:"100%", background:"#3B6D11", borderRadius:4 }}/>
                    </div>
                  </div>
                )}
                <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:6 }}>Agents suivis :</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {crAgents.map(a=>(
                    <span key={a} style={{ fontSize:10, padding:"2px 8px", borderRadius:10,
                      background:"var(--color-background-secondary)", color:"var(--color-text-secondary)" }}>{a}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LISTE ── */}
      {view==="liste" && (
        <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, overflow:"hidden" }}>
          <div style={{ padding:"10px 12px", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
            <input placeholder="Rechercher un agent..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ fontSize:12, padding:"5px 10px", borderRadius:6,
                border:"0.5px solid var(--color-border-tertiary)",
                background:"var(--color-background-secondary)",
                color:"var(--color-text-primary)", width:"100%" }}/>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:"var(--color-background-secondary)" }}>
                  {["Agent","Crew","Type","Plan d'action","Deadline","Statut","Follow-up","Action"].map(h=>(
                    <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontWeight:500, fontSize:11,
                      color:"var(--color-text-secondary)", borderBottom:"0.5px solid var(--color-border-tertiary)", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0,30).map(c=>(
                  <tr key={c.id} style={{ borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
                    <td style={{ padding:"7px 10px", fontWeight:500, whiteSpace:"nowrap" }}>{c.agent}</td>
                    <td style={{ padding:"7px 10px", color:"var(--color-text-secondary)", whiteSpace:"nowrap", fontSize:11 }}>{c.crew?.split(" ")[0]}</td>
                    <td style={{ padding:"7px 10px", whiteSpace:"nowrap" }}>
                      <Badge label={c.type} bg={TB[c.type]} color={TC[c.type]} />
                    </td>
                    <td style={{ padding:"7px 10px", color:"var(--color-text-secondary)", maxWidth:150 }}>
                      <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.plan_action||"—"}</div>
                    </td>
                    <td style={{ padding:"7px 10px", color:"var(--color-text-secondary)", whiteSpace:"nowrap" }}>{fmt(c.deadline)}</td>
                    <td style={{ padding:"7px 10px", whiteSpace:"nowrap" }}>
                      {c.deadline ? <DLBadge deadline={c.deadline} followup_statut={c.followup_statut}/> : <span style={{ color:"var(--color-text-secondary)" }}>—</span>}
                    </td>
                    <td style={{ padding:"7px 10px", whiteSpace:"nowrap" }}>
                      {c.followup_statut && <Badge label={c.followup_statut}
                        bg={c.followup_statut==="OK"?"#EAF3DE":c.followup_statut==="NOK"?"#FBEAF0":"#F1EFE8"}
                        color={c.followup_statut==="OK"?"#3B6D11":c.followup_statut==="NOK"?"#993556":"#5F5E5A"} />}
                    </td>
                    <td style={{ padding:"7px 10px", whiteSpace:"nowrap" }}>
                      {canEdit && c.type==="Coaching TGROW" && c.followup_statut==="En attente" && (
                        <button onClick={()=>setFuModal(c)} style={{ padding:"3px 10px", fontSize:11,
                          borderRadius:5, border:"0.5px solid #185FA5", background:"transparent",
                          color:"#185FA5", cursor:"pointer" }}>Follow-up</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length>30 && (
            <div style={{ padding:"8px 12px", fontSize:11, color:"var(--color-text-secondary)", textAlign:"center", borderTop:"0.5px solid var(--color-border-tertiary)" }}>
              +{filtered.length-30} entrées supplémentaires
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {addOpen  && <AddModal user={user} onClose={()=>setAddOpen(false)} onSaved={()=>{ setAddOpen(false); load(); }} />}
      {fuModal  && <FollowupModal coaching={fuModal} onClose={()=>setFuModal(null)} onSaved={()=>{ setFuModal(null); load(); }} />}
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  if (!user) return <LoginScreen onLogin={setUser} />;
  return <Dashboard user={user} onLogout={()=>setUser(null)} />;
}
