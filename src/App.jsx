import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ROLES = { MANAGER: "manager", CREW: "crew", AGENT: "agent" };
const TYPES = ["Coaching TGROW", "Follow-up OK", "Follow-up NOK"];
const TC = { "Coaching TGROW":"#185FA5", "Follow-up OK":"#3B6D11", "Follow-up NOK":"#993556" };
const TB = { "Coaching TGROW":"#E6F1FB", "Follow-up OK":"#EAF3DE", "Follow-up NOK":"#FBEAF0" };
const DS = {
  late: { label:"Deadline dépassée", bg:"#FCEBEB", color:"#A32D2D" },
  soon: { label:"Deadline proche",   bg:"#FAEEDA", color:"#854F0B" },
  ok:   { label:"Dans les délais",   bg:"#EAF3DE", color:"#3B6D11" },
  done: { label:"Clôturé",           bg:"#F1EFE8", color:"#5F5E5A" },
};

const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

const todayDate = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const fmt = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

function dlStatus(deadline, followup_statut) {
  if (!deadline) return null;
  if (followup_statut === "OK" || followup_statut === "NOK") return "done";
  const dl = new Date(deadline); dl.setHours(0,0,0,0);
  const diff = Math.ceil((dl - todayDate()) / 86400000);
  if (diff < 0) return "late";
  if (diff <= 3) return "soon";
  return "ok";
}

// ─── UI primitives ────────────────────────────────────────────────────────────
const Badge = ({ label, bg, color }) => (
  <span style={{ fontSize:11, padding:"2px 8px", borderRadius:4, background:bg, color, fontWeight:500, whiteSpace:"nowrap" }}>{label}</span>
);
const DLBadge = ({ deadline, followup_statut }) => {
  const s = dlStatus(deadline, followup_statut);
  if (!s) return null;
  const dl = new Date(deadline); dl.setHours(0,0,0,0);
  const diff = Math.ceil((dl - todayDate()) / 86400000);
  const info = DS[s];
  const txt = s==="late"?`${Math.abs(diff)}j de retard`:s==="done"?"Clôturé":s==="soon"?`J-${diff}`:`+${diff}j`;
  return <Badge label={txt} bg={info.bg} color={info.color} />;
};
const Inp = ({ label, ...p }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:4 }}>{label}</div>}
    <input {...p} style={{ width:"100%", fontSize:13, padding:"6px 10px", borderRadius:6,
      border:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)",
      color:"var(--color-text-primary)", boxSizing:"border-box", ...p.style }} />
  </div>
);
const Sel = ({ label, options, ...p }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:4 }}>{label}</div>}
    <select {...p} style={{ width:"100%", fontSize:13, padding:"6px 10px", borderRadius:6,
      border:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)",
      color:"var(--color-text-primary)" }}>
      {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  </div>
);
const Txta = ({ label, ...p }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:4 }}>{label}</div>}
    <textarea {...p} style={{ width:"100%", fontSize:13, padding:"6px 10px", borderRadius:6,
      border:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)",
      color:"var(--color-text-primary)", resize:"vertical", boxSizing:"border-box" }} />
  </div>
);
const Btn = ({ children, variant="primary", ...p }) => (
  <button {...p} style={{ padding:"8px 16px", borderRadius:6, fontSize:13, fontWeight:500, cursor:"pointer",
    border: variant==="primary"?"none":"0.5px solid var(--color-border-secondary)",
    background: variant==="primary"?"#185FA5": variant==="danger"?"#A32D2D":"transparent",
    color: variant==="primary"||variant==="danger" ? "#fff" : "var(--color-text-secondary)",
    opacity: p.disabled ? 0.6 : 1, ...p.style }}>
    {children}
  </button>
);
const Modal = ({ title, subtitle, onClose, children, width=400 }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex",
    alignItems:"center", justifyContent:"center", zIndex:999 }}>
    <div style={{ background:"var(--color-background-primary)", borderRadius:12, padding:"1.5rem",
      width, border:"0.5px solid var(--color-border-secondary)", maxHeight:"90vh", overflowY:"auto" }}>
      <div style={{ fontSize:15, fontWeight:500, marginBottom: subtitle?4:16 }}>{title}</div>
      {subtitle && <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:16 }}>{subtitle}</div>}
      {children}
    </div>
  </div>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName] = useState("");
  const [pwd,  setPwd]  = useState("");
  const [err,  setErr]  = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!name || !pwd) return setErr("Veuillez remplir tous les champs.");
    setLoading(true); setErr("");
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .ilike("name", name.trim())
      .eq("password", pwd)
      .single();
    setLoading(false);
    if (error || !data) return setErr("Nom ou mot de passe incorrect.");
    onLogin(data);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"var(--color-background-secondary)", fontFamily:"var(--font-sans)" }}>
      <div style={{ background:"var(--color-background-primary)", borderRadius:12, padding:"2rem",
        width:340, border:"0.5px solid var(--color-border-tertiary)" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
          <div style={{ fontSize:18, fontWeight:500 }}>Coaching TGROW</div>
          <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginTop:4 }}>Connectez-vous pour accéder au dashboard</div>
        </div>
        <Inp label="Nom complet" placeholder="Ex: Oumaima Helbaje" value={name} onChange={e=>setName(e.target.value)} />
        <Inp label="Mot de passe" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} />
        {err && <div style={{ fontSize:12, color:"#A32D2D", marginBottom:12 }}>{err}</div>}
        <Btn style={{ width:"100%" }} onClick={login} disabled={loading}>{loading?"Connexion...":"Se connecter"}</Btn>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ onBack }) {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [addOpen, setAddOpen]   = useState(false);
  const [pwdModal, setPwdModal] = useState(null); // user object
  const [delModal, setDelModal] = useState(null); // user object
  const [msg, setMsg]           = useState("");

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").order("role").order("name");
    setUsers(data || []);
    setLoading(false);
  };
  useEffect(() => { loadUsers(); }, []);

  const roleLabel = r => r==="manager"?"Manager":r==="crew"?"Crew Guide":"Agent";
  const roleColor = r => r==="manager"?"#534AB7":r==="crew"?"#185FA5":"#3B6D11";
  const roleBg    = r => r==="manager"?"#EFEDFC":r==="crew"?"#E6F1FB":"#EAF3DE";

  const notify = m => { setMsg(m); setTimeout(()=>setMsg(""),3000); };

  return (
    <div style={{ fontFamily:"var(--font-sans)", padding:"1rem", maxWidth:740, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
        <div>
          <h2 style={{ margin:"0 0 2px", fontSize:18, fontWeight:500 }}>⚙️ Gestion des comptes</h2>
          <p style={{ margin:0, fontSize:12, color:"var(--color-text-secondary)" }}>{users.length} utilisateurs</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn onClick={()=>setAddOpen(true)}>+ Nouveau compte</Btn>
          <Btn variant="secondary" onClick={onBack}>← Retour dashboard</Btn>
        </div>
      </div>

      {msg && <div style={{ padding:"10px 14px", background:"#EAF3DE", borderRadius:8, fontSize:13,
        color:"#3B6D11", marginBottom:12, fontWeight:500 }}>{msg}</div>}

      {loading ? <div style={{ textAlign:"center", color:"var(--color-text-secondary)", padding:"2rem" }}>Chargement...</div> : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {["manager","crew","agent"].map(role => {
            const group = users.filter(u=>u.role===role);
            if (!group.length) return null;
            return (
              <div key={role}>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--color-text-secondary)",
                  textTransform:"uppercase", letterSpacing:1, marginBottom:6, marginTop:8 }}>
                  {roleLabel(role)}s ({group.length})
                </div>
                {group.map(u => (
                  <div key={u.id} style={{ display:"flex", alignItems:"center", gap:10,
                    padding:"12px 14px", background:"var(--color-background-primary)",
                    border:"0.5px solid var(--color-border-tertiary)", borderRadius:8, marginBottom:6 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:13, fontWeight:500 }}>{u.name}</span>
                        <Badge label={roleLabel(u.role)} bg={roleBg(u.role)} color={roleColor(u.role)} />
                        {u.crew && <span style={{ fontSize:11, color:"var(--color-text-secondary)" }}>· {u.crew}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>setPwdModal(u)} style={{ padding:"4px 12px", fontSize:11,
                        borderRadius:6, border:"0.5px solid #185FA5", background:"transparent",
                        color:"#185FA5", cursor:"pointer" }}>🔑 Mot de passe</button>
                      {u.role !== "manager" && (
                        <button onClick={()=>setDelModal(u)} style={{ padding:"4px 12px", fontSize:11,
                          borderRadius:6, border:"0.5px solid #A32D2D", background:"transparent",
                          color:"#A32D2D", cursor:"pointer" }}>🗑 Supprimer</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {addOpen && <AddUserModal onClose={()=>setAddOpen(false)} onSaved={()=>{ setAddOpen(false); loadUsers(); notify("✅ Compte créé avec succès !"); }} />}
      {pwdModal && <ChangePwdModal user={pwdModal} onClose={()=>setPwdModal(null)} onSaved={()=>{ setPwdModal(null); notify("✅ Mot de passe modifié avec succès !"); }} />}
      {delModal && <DeleteUserModal user={delModal} onClose={()=>setDelModal(null)} onSaved={()=>{ setDelModal(null); loadUsers(); notify("✅ Compte supprimé."); }} />}
    </div>
  );
}

function AddUserModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name:"", role:"agent", crew:"", password:"" });
  const [err, setErr]   = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.name || !form.password) return setErr("Nom et mot de passe requis.");
    if (form.role==="crew" && !form.crew) return setErr("Veuillez saisir le nom du crew guide.");
    setLoading(true); setErr("");
    const { error } = await supabase.from("users").insert([{
      name: form.name.trim(),
      role: form.role,
      crew: form.role==="crew" ? form.crew.trim() : form.role==="agent" ? null : null,
      password: form.password
    }]);
    setLoading(false);
    if (error) return setErr("Erreur : " + error.message);
    onSaved();
  };

  return (
    <Modal title="Nouveau compte" onClose={onClose}>
      <Inp label="Nom complet" placeholder="Ex: Fatima Zahra Benali" value={form.name} onChange={e=>set("name",e.target.value)} />
      <Sel label="Rôle" options={[{value:"agent",label:"Agent"},{value:"crew",label:"Crew Guide"},{value:"manager",label:"Manager"}]}
        value={form.role} onChange={e=>set("role",e.target.value)} />
      {form.role==="crew" && (
        <Inp label="Nom affiché comme crew guide (pour les filtres)" placeholder="Ex: Fatima Zahra Benali"
          value={form.crew} onChange={e=>set("crew",e.target.value)} />
      )}
      <Inp label="Mot de passe initial" type="text" placeholder="Ex: fatima2025" value={form.password} onChange={e=>set("password",e.target.value)} />
      {err && <div style={{ fontSize:12, color:"#A32D2D", marginBottom:10 }}>{err}</div>}
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <Btn variant="secondary" onClick={onClose} style={{ flex:1 }}>Annuler</Btn>
        <Btn onClick={save} disabled={loading} style={{ flex:1 }}>{loading?"Création...":"Créer le compte"}</Btn>
      </div>
    </Modal>
  );
}

function ChangePwdModal({ user, onClose, onSaved }) {
  const [pwd, setPwd]   = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!pwd) return setErr("Veuillez saisir un mot de passe.");
    if (pwd !== pwd2) return setErr("Les mots de passe ne correspondent pas.");
    if (pwd.length < 6) return setErr("Le mot de passe doit contenir au moins 6 caractères.");
    setLoading(true); setErr("");
    const { error } = await supabase.from("users").update({ password: pwd }).eq("id", user.id);
    setLoading(false);
    if (error) return setErr("Erreur : " + error.message);
    onSaved();
  };

  return (
    <Modal title="Changer le mot de passe" subtitle={`Compte : ${user.name}`} onClose={onClose} width={360}>
      <Inp label="Nouveau mot de passe" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} />
      <Inp label="Confirmer le mot de passe" type="password" value={pwd2} onChange={e=>setPwd2(e.target.value)} />
      {err && <div style={{ fontSize:12, color:"#A32D2D", marginBottom:10 }}>{err}</div>}
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <Btn variant="secondary" onClick={onClose} style={{ flex:1 }}>Annuler</Btn>
        <Btn onClick={save} disabled={loading} style={{ flex:1 }}>{loading?"Enregistrement...":"Changer"}</Btn>
      </div>
    </Modal>
  );
}

function DeleteUserModal({ user, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    await supabase.from("users").delete().eq("id", user.id);
    setLoading(false);
    onSaved();
  };

  return (
    <Modal title="Supprimer ce compte ?" onClose={onClose} width={360}>
      <div style={{ fontSize:13, color:"var(--color-text-secondary)", marginBottom:20, lineHeight:1.6 }}>
        Vous êtes sur le point de supprimer le compte de <strong style={{ color:"var(--color-text-primary)" }}>{user.name}</strong>.<br/>
        Cette action est <strong>irréversible</strong>. Les coachings enregistrés ne seront pas supprimés.
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <Btn variant="secondary" onClick={onClose} style={{ flex:1 }}>Annuler</Btn>
        <Btn variant="danger" onClick={confirm} disabled={loading} style={{ flex:1 }}>{loading?"Suppression...":"Confirmer la suppression"}</Btn>
      </div>
    </Modal>
  );
}

// ─── MODAL : Nouveau coaching ─────────────────────────────────────────────────
function AddModal({ user, crewList, agentList, onClose, onSaved }) {
  const defaultCrew = user.role===ROLES.CREW ? user.crew : (crewList[0]||"");
  const [form, setForm] = useState({ agent:agentList[0]||"", crew:defaultCrew, type:"Coaching TGROW", plan_action:"", deadline:"", notes:"" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.agent || !form.crew) return setErr("Agent et crew guide requis.");
    setLoading(true); setErr("");
    const { error } = await supabase.from("coachings").insert([{
      agent: form.agent, crew: form.crew, type: form.type,
      plan_action: form.plan_action||null,
      deadline: form.deadline||null,
      followup_statut: "En attente",
      notes: form.notes||null,
      date_coaching: new Date().toISOString().split("T")[0],
      locked: true
    }]);
    setLoading(false);
    if (error) return setErr("Erreur : " + error.message);
    onSaved();
  };

  return (
    <Modal title="Nouveau coaching" onClose={onClose}>
      <Sel label="Agent" options={agentList} value={form.agent} onChange={e=>set("agent",e.target.value)} />
      {user.role===ROLES.MANAGER
        ? <Sel label="Crew guide" options={crewList} value={form.crew} onChange={e=>set("crew",e.target.value)} />
        : <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:12 }}>Crew guide : <strong>{form.crew}</strong></div>}
      <Sel label="Type" options={TYPES} value={form.type} onChange={e=>set("type",e.target.value)} />
      {form.type==="Coaching TGROW" && <>
        <Txta label="Plan d'action fixé avec l'agent" rows={3}
          placeholder="Décrivez les actions convenues (étape W du TGROW)..."
          value={form.plan_action} onChange={e=>set("plan_action",e.target.value)} />
        <Inp label="Deadline du follow-up" type="date" value={form.deadline} onChange={e=>set("deadline",e.target.value)} />
      </>}
      <Txta label="Notes (optionnel)" rows={2} value={form.notes} onChange={e=>set("notes",e.target.value)} />
      {err && <div style={{ fontSize:12, color:"#A32D2D", marginBottom:8 }}>{err}</div>}
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <Btn variant="secondary" onClick={onClose} style={{ flex:1 }}>Annuler</Btn>
        <Btn onClick={save} disabled={loading} style={{ flex:1 }}>{loading?"Enregistrement...":"Enregistrer"}</Btn>
      </div>
    </Modal>
  );
}

// ─── MODAL : Follow-up ────────────────────────────────────────────────────────
function FollowupModal({ coaching, onClose, onSaved }) {
  const [statut, setStatut] = useState(coaching.followup_statut||"En attente");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    await supabase.from("coachings").update({ followup_statut: statut }).eq("id", coaching.id);
    setLoading(false);
    onSaved();
  };

  return (
    <Modal title="Résultat du follow-up" subtitle={`${coaching.agent} · Deadline : ${fmt(coaching.deadline)}`} onClose={onClose} width={380}>
      {coaching.plan_action && (
        <div style={{ padding:"10px 12px", background:"var(--color-background-secondary)",
          borderRadius:8, marginBottom:16, fontSize:12, color:"var(--color-text-secondary)" }}>
          <div style={{ fontWeight:500, color:"var(--color-text-primary)", marginBottom:4 }}>Plan d'action :</div>
          {coaching.plan_action}
        </div>
      )}
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        {["OK","NOK","En attente"].map(s => (
          <button key={s} onClick={()=>setStatut(s)} style={{ flex:1, padding:"14px 8px", borderRadius:8,
            border:`1.5px solid ${statut===s?(s==="OK"?"#3B6D11":s==="NOK"?"#993556":"#185FA5"):"var(--color-border-tertiary)"}`,
            background: statut===s?(s==="OK"?"#EAF3DE":s==="NOK"?"#FBEAF0":"#E6F1FB"):"transparent",
            color: statut===s?(s==="OK"?"#3B6D11":s==="NOK"?"#993556":"#185FA5"):"var(--color-text-secondary)",
            cursor:"pointer", fontWeight:600, fontSize:14 }}>
            {s==="OK"?"✅ OK":s==="NOK"?"❌ NOK":"⏳ En attente"}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <Btn variant="secondary" onClick={onClose} style={{ flex:1 }}>Annuler</Btn>
        <Btn onClick={save} disabled={loading} style={{ flex:1 }}>{loading?"Enregistrement...":"Confirmer"}</Btn>
      </div>
    </Modal>
  );
}

// ─── VUE AGENT ───────────────────────────────────────────────────────────────
function AgentView({ user, coachings, onLogout }) {
  const mine = coachings.filter(c => c.agent === user.name);
  const tgrows  = mine.filter(c=>c.type==="Coaching TGROW");
  const ok      = mine.filter(c=>c.followup_statut==="OK").length;
  const nok     = mine.filter(c=>c.followup_statut==="NOK").length;
  const pending = mine.filter(c=>c.followup_statut==="En attente"&&c.deadline);
  const late    = pending.filter(c=>dlStatus(c.deadline,c.followup_statut)==="late");

  return (
    <div style={{ fontFamily:"var(--font-sans)", padding:"1rem", maxWidth:640, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
        <div>
          <h2 style={{ margin:"0 0 2px", fontSize:18, fontWeight:500 }}>Mes coachings</h2>
          <p style={{ margin:0, fontSize:12, color:"var(--color-text-secondary)" }}>Bonjour, {user.name} 👋</p>
        </div>
        <Btn variant="secondary" onClick={onLogout} style={{ fontSize:11 }}>Déconnexion</Btn>
      </div>

      {late.length>0 && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
          background:"#FCEBEB", borderRadius:8, border:"0.5px solid #F09595", marginBottom:12 }}>
          <div style={{ fontSize:18, fontWeight:500, color:"#A32D2D" }}>{late.length}</div>
          <div>
            <div style={{ fontSize:12, fontWeight:500, color:"#A32D2D" }}>Follow-up en retard</div>
            <div style={{ fontSize:10, color:"#A32D2D", opacity:.8 }}>Contactez votre crew guide</div>
          </div>
        </div>
      )}

      {/* KPI */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:"1rem" }}>
        {[
          { label:"Coachings TGROW", val:tgrows.length, color:"#185FA5" },
          { label:"Follow-up OK",    val:ok,            color:"#3B6D11" },
          { label:"Follow-up NOK",   val:nok,           color:"#993556" },
        ].map(k=>(
          <div key={k.label} style={{ background:"var(--color-background-secondary)", borderRadius:8, padding:"12px", textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:500, color:k.color }}>{k.val}</div>
            <div style={{ fontSize:10, color:"var(--color-text-secondary)", marginTop:3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Liste coachings */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {mine.length===0 && (
          <div style={{ textAlign:"center", color:"var(--color-text-secondary)", padding:"2rem", fontSize:13 }}>
            Aucun coaching enregistré pour vous.
          </div>
        )}
        {mine.map(c => {
          const s = dlStatus(c.deadline, c.followup_statut);
          const isBorderRed = s==="late";
          return (
            <div key={c.id} style={{ background:"var(--color-background-primary)",
              border:`0.5px solid ${isBorderRed?"#F09595":"var(--color-border-tertiary)"}`,
              borderRadius:10, padding:"1rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:8 }}>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <Badge label={c.type} bg={TB[c.type]} color={TC[c.type]} />
                  {c.followup_statut && c.followup_statut!=="En attente" && (
                    <Badge label={c.followup_statut}
                      bg={c.followup_statut==="OK"?"#EAF3DE":"#FBEAF0"}
                      color={c.followup_statut==="OK"?"#3B6D11":"#993556"} />
                  )}
                </div>
                <span style={{ fontSize:11, color:"var(--color-text-secondary)", whiteSpace:"nowrap" }}>{fmt(c.date_coaching)}</span>
              </div>
              {c.plan_action && (
                <div style={{ fontSize:12, padding:"8px 10px", background:"var(--color-background-secondary)",
                  borderRadius:6, marginBottom:8, color:"var(--color-text-secondary)" }}>
                  <span style={{ fontWeight:500, color:"var(--color-text-primary)" }}>Plan d'action : </span>{c.plan_action}
                </div>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  {c.deadline && <>
                    <span style={{ fontSize:11, color:"var(--color-text-secondary)" }}>Deadline : <strong style={{ color:"var(--color-text-primary)" }}>{fmt(c.deadline)}</strong></span>
                    <DLBadge deadline={c.deadline} followup_statut={c.followup_statut} />
                  </>}
                </div>
                <span style={{ fontSize:11, color:"var(--color-text-secondary)" }}>Crew : {c.crew}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DASHBOARD MANAGER / CREW ─────────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
  const [coachings, setCoachings] = useState([]);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState("global");
  const [periode, setPeriode]     = useState("Tout");
  const [crewFilter, setCrewFilter] = useState("Tous");
  const [search, setSearch]       = useState("");
  const [dlFilter, setDlFilter]   = useState("Tous");
  const [addOpen, setAddOpen]     = useState(false);
  const [fuModal, setFuModal]     = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);

  const isManager = user.role === ROLES.MANAGER;

  const crewList  = users.filter(u=>u.role==="crew").map(u=>u.crew||u.name);
  const agentList = users.filter(u=>u.role==="agent").map(u=>u.name);

  const load = async () => {
    setLoading(true);
    const [{ data: cd }, { data: ud }] = await Promise.all([
      supabase.from("coachings").select("*").order("date_coaching", { ascending:false }),
      supabase.from("users").select("*")
    ]);
    setCoachings(cd||[]);
    setUsers(ud||[]);
    setLoading(false);
  };

  useEffect(()=>{ load(); },[]);
  useEffect(()=>{
    const sub = supabase.channel("rt-coachings")
      .on("postgres_changes",{ event:"*", schema:"public", table:"coachings" }, load)
      .on("postgres_changes",{ event:"*", schema:"public", table:"users" }, load)
      .subscribe();
    return ()=>supabase.removeChannel(sub);
  },[]);

  const filtered = useMemo(()=>{
    let d = coachings;
    if (!isManager) d = d.filter(c=>c.crew===user.crew);
    else if (crewFilter!=="Tous") d=d.filter(c=>c.crew===crewFilter);
    const yr = new Date().getFullYear();
    if (periode==="M1") d=d.filter(c=>c.date_coaching?.startsWith(`${yr}-01`));
    if (periode==="M2") d=d.filter(c=>c.date_coaching?.startsWith(`${yr}-02`));
    if (periode==="M3") d=d.filter(c=>c.date_coaching?.startsWith(`${yr}-03`));
    if (periode==="Q2") d=d.filter(c=>c.date_coaching>=`${yr}-04-01`);
    if (search) d=d.filter(c=>c.agent?.toLowerCase().includes(search.toLowerCase()));
    return d;
  },[coachings,crewFilter,periode,search,user]);

  if (adminOpen) return <AdminPanel onBack={()=>{ setAdminOpen(false); load(); }} />;

  const tgrows    = filtered.filter(c=>c.type==="Coaching TGROW");
  const followups = filtered.filter(c=>c.type!=="Coaching TGROW");
  const nbOK      = filtered.filter(c=>c.followup_statut==="OK").length;
  const nbNOK     = filtered.filter(c=>c.followup_statut==="NOK").length;
  const agents    = [...new Set(filtered.map(c=>c.agent))].length;
  const txOK      = followups.length>0?Math.round((nbOK/followups.length)*100):0;

  const withDL = coachings.filter(c=>c.type==="Coaching TGROW"&&c.deadline&&(!isManager?c.crew===user.crew:true));
  const late   = withDL.filter(c=>dlStatus(c.deadline,c.followup_statut)==="late");
  const soon   = withDL.filter(c=>dlStatus(c.deadline,c.followup_statut)==="soon");

  const dlItems = useMemo(()=>{
    let d=withDL;
    if (isManager&&crewFilter!=="Tous") d=d.filter(c=>c.crew===crewFilter);
    if (dlFilter!=="Tous") d=d.filter(c=>dlStatus(c.deadline,c.followup_statut)===dlFilter);
    return d.sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
  },[coachings,crewFilter,dlFilter,user]);

  const byAgent = agentList.map(a=>{
    const cs=filtered.filter(c=>c.agent===a);
    return { a, n:cs.length,
      tgrow:cs.filter(c=>c.type==="Coaching TGROW").length,
      ok:cs.filter(c=>c.followup_statut==="OK").length,
      nok:cs.filter(c=>c.followup_statut==="NOK").length,
      hasLate:cs.some(c=>dlStatus(c.deadline,c.followup_statut)==="late")
    };
  }).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);

  const byCrew = crewList.map(cr=>{
    const cs=filtered.filter(c=>c.crew===cr);
    const ok=cs.filter(c=>c.followup_statut==="OK").length;
    const fu=cs.filter(c=>c.type!=="Coaching TGROW").length;
    return { cr, n:cs.length, agents:[...new Set(cs.map(c=>c.agent))].length,
      tgrow:cs.filter(c=>c.type==="Coaching TGROW").length,
      ok, nok:cs.filter(c=>c.followup_statut==="NOK").length,
      txOK:fu>0?Math.round((ok/fu)*100):0 };
  });

  const byMonth = MONTHS.map((m,i)=>{
    const key=`${new Date().getFullYear()}-${String(i+1).padStart(2,"0")}`;
    const mo=filtered.filter(c=>c.date_coaching?.startsWith(key));
    return { m, tgrow:mo.filter(c=>c.type==="Coaching TGROW").length,
      ok:mo.filter(c=>c.type==="Follow-up OK").length,
      nok:mo.filter(c=>c.type==="Follow-up NOK").length };
  });
  const maxMonth=Math.max(...byMonth.map(x=>x.tgrow+x.ok+x.nok),1);

  const navBtn=v=>({ padding:"7px 14px",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:500,
    background:view===v?"#185FA5":"transparent",color:view===v?"#fff":"var(--color-text-secondary)" });
  const pBtn=p=>({ padding:"4px 10px",border:"0.5px solid",borderRadius:6,cursor:"pointer",fontSize:11,
    borderColor:periode===p?"#185FA5":"var(--color-border-tertiary)",
    background:periode===p?"#E6F1FB":"transparent",
    color:periode===p?"#185FA5":"var(--color-text-secondary)" });

  if (loading) return <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"var(--font-sans)",color:"var(--color-text-secondary)" }}>Chargement...</div>;

  return (
    <div style={{ fontFamily:"var(--font-sans)", padding:"1rem", maxWidth:740, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.75rem" }}>
        <div>
          <h2 style={{ margin:"0 0 2px", fontSize:18, fontWeight:500 }}>Suivi des coachings TGROW</h2>
          <p style={{ margin:0, fontSize:12, color:"var(--color-text-secondary)" }}>Connecté : {user.name} · {isManager?"Manager":"Crew Guide"}</p>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
          {isManager && <Btn onClick={()=>setAdminOpen(true)} style={{ fontSize:11, padding:"6px 12px", background:"#534AB7" }}>⚙️ Admin</Btn>}
          <Btn onClick={()=>setAddOpen(true)} style={{ fontSize:11, padding:"6px 12px" }}>+ Nouveau coaching</Btn>
          <Btn variant="secondary" onClick={onLogout} style={{ fontSize:11, padding:"6px 12px" }}>Déconnexion</Btn>
        </div>
      </div>

      {/* Alertes */}
      {(late.length>0||soon.length>0)&&(
        <div style={{ display:"flex", gap:8, marginBottom:"0.75rem", flexWrap:"wrap" }}>
          {late.length>0&&<div style={{ flex:1,minWidth:160,display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:"#FCEBEB",borderRadius:8,border:"0.5px solid #F09595" }}>
            <div style={{ fontSize:20,fontWeight:500,color:"#A32D2D" }}>{late.length}</div>
            <div><div style={{ fontSize:12,fontWeight:500,color:"#A32D2D" }}>Deadline(s) dépassée(s)</div><div style={{ fontSize:10,color:"#A32D2D",opacity:.8 }}>Follow-up en retard</div></div>
          </div>}
          {soon.length>0&&<div style={{ flex:1,minWidth:160,display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:"#FAEEDA",borderRadius:8,border:"0.5px solid #FAC775" }}>
            <div style={{ fontSize:20,fontWeight:500,color:"#854F0B" }}>{soon.length}</div>
            <div><div style={{ fontSize:12,fontWeight:500,color:"#854F0B" }}>Deadline(s) dans 3 jours</div><div style={{ fontSize:10,color:"#854F0B",opacity:.8 }}>À relancer rapidement</div></div>
          </div>}
        </div>
      )}

      {/* Filtres */}
      <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:"0.75rem" }}>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {["Tout","M1","M2","M3","Q2"].map(p=><button key={p} style={pBtn(p)} onClick={()=>setPeriode(p)}>{p}</button>)}
        </div>
        {isManager&&(
          <select value={crewFilter} onChange={e=>setCrewFilter(e.target.value)}
            style={{ fontSize:12,padding:"4px 8px",borderRadius:6,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)" }}>
            <option>Tous</option>
            {crewList.map(c=><option key={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* KPI */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:"0.75rem" }}>
        {[{label:"Coachings TGROW",val:tgrows.length,color:"#185FA5"},{label:"Follow-ups",val:followups.length,color:"#BA7517"},{label:"Taux OK",val:txOK+"%",color:"#3B6D11"},{label:"Agents coachés",val:agents,color:"#534AB7"}]
          .map(k=><div key={k.label} style={{ background:"var(--color-background-secondary)",borderRadius:8,padding:"10px",textAlign:"center" }}>
            <div style={{ fontSize:22,fontWeight:500,color:k.color }}>{k.val}</div>
            <div style={{ fontSize:10,color:"var(--color-text-secondary)",marginTop:3 }}>{k.label}</div>
          </div>)}
      </div>

      {/* Nav */}
      <div style={{ display:"flex", gap:4, marginBottom:"0.75rem", borderBottom:"0.5px solid var(--color-border-tertiary)", paddingBottom:8, flexWrap:"wrap" }}>
        {[["global","Vue globale"],["deadlines","Deadlines"],["agents","Par agent"],["crew","Par crew guide"],["liste","Liste"]].map(([v,l])=>(
          <button key={v} style={navBtn(v)} onClick={()=>setView(v)}>
            {v==="deadlines"&&late.length>0?<>{l}<span style={{ background:"#A32D2D",color:"#fff",borderRadius:"50%",fontSize:9,padding:"0 4px",marginLeft:2 }}>{late.length}</span></>:l}
          </button>
        ))}
      </div>

      {/* GLOBAL */}
      {view==="global"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            <div style={{ background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:10,padding:"1rem" }}>
              <div style={{ fontSize:13,fontWeight:500,marginBottom:12 }}>Évolution mensuelle</div>
              <div style={{ display:"flex",alignItems:"flex-end",gap:3,height:100 }}>
                {byMonth.map(({m,tgrow,ok,nok})=>{
                  const tot=tgrow+ok+nok;
                  return <div key={m} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
                    <div style={{ fontSize:8,color:"var(--color-text-secondary)" }}>{tot||""}</div>
                    <div style={{ width:"100%",display:"flex",flexDirection:"column",borderRadius:"3px 3px 0 0",overflow:"hidden",height:tot>0?`${Math.round((tot/maxMonth)*80)}px`:"3px" }}>
                      <div style={{ flex:tgrow,background:TC["Coaching TGROW"] }}/><div style={{ flex:ok,background:TC["Follow-up OK"] }}/><div style={{ flex:nok,background:TC["Follow-up NOK"] }}/>
                    </div>
                    <div style={{ fontSize:8,color:"var(--color-text-secondary)" }}>{m}</div>
                  </div>;
                })}
              </div>
            </div>
            <div style={{ background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:10,padding:"1rem" }}>
              <div style={{ fontSize:13,fontWeight:500,marginBottom:12 }}>Résultats follow-ups</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
                <div style={{ textAlign:"center",padding:"12px",background:"#EAF3DE",borderRadius:8 }}>
                  <div style={{ fontSize:24,fontWeight:500,color:"#3B6D11" }}>{nbOK}</div>
                  <div style={{ fontSize:11,color:"#3B6D11",marginTop:2 }}>OK</div>
                </div>
                <div style={{ textAlign:"center",padding:"12px",background:"#FBEAF0",borderRadius:8 }}>
                  <div style={{ fontSize:24,fontWeight:500,color:"#993556" }}>{nbNOK}</div>
                  <div style={{ fontSize:11,color:"#993556",marginTop:2 }}>NOK</div>
                </div>
              </div>
              {followups.length>0&&<>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4 }}>
                  <span style={{ color:"var(--color-text-secondary)" }}>Taux de réussite</span>
                  <span style={{ fontWeight:500,color:"#3B6D11" }}>{txOK}%</span>
                </div>
                <div style={{ background:"var(--color-background-secondary)",borderRadius:4,height:8,overflow:"hidden" }}>
                  <div style={{ width:`${txOK}%`,height:"100%",background:"#3B6D11",borderRadius:4 }}/>
                </div>
              </>}
            </div>
          </div>
        </div>
      )}

      {/* DEADLINES */}
      {view==="deadlines"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
            {[["Tous","Tous"],["late","En retard"],["soon","Proche"],["ok","OK"],["done","Clôturé"]].map(([k,l])=>(
              <button key={k} onClick={()=>setDlFilter(k)} style={{ padding:"4px 12px",fontSize:11,borderRadius:6,cursor:"pointer",border:"0.5px solid",
                borderColor:dlFilter===k?(DS[k]?.color||"#185FA5"):"var(--color-border-tertiary)",
                background:dlFilter===k?(DS[k]?.bg||"#E6F1FB"):"transparent",
                color:dlFilter===k?(DS[k]?.color||"#185FA5"):"var(--color-text-secondary)" }}>
                {l}{k==="late"&&late.length>0?` (${late.length})`:k==="soon"&&soon.length>0?` (${soon.length})`:""}</button>
            ))}
          </div>
          {dlItems.length===0&&<div style={{ fontSize:13,color:"var(--color-text-secondary)",textAlign:"center",padding:"2rem" }}>Aucun coaching dans cette catégorie.</div>}
          {dlItems.map(c=>{
            const s=dlStatus(c.deadline,c.followup_statut); const info=DS[s]||DS.ok;
            const dl=new Date(c.deadline); dl.setHours(0,0,0,0);
            const diff=Math.ceil((dl-todayDate())/86400000);
            return <div key={c.id} style={{ background:"var(--color-background-primary)",
              border:`0.5px solid ${s==="late"?"#F09595":s==="soon"?"#FAC775":"var(--color-border-tertiary)"}`,borderRadius:10,padding:"1rem" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                    <span style={{ fontSize:13,fontWeight:500 }}>{c.agent}</span>
                    <span style={{ fontSize:11,color:"var(--color-text-secondary)" }}>· {c.crew}</span>
                  </div>
                  {c.plan_action&&<div style={{ fontSize:12,padding:"6px 10px",background:"var(--color-background-secondary)",borderRadius:6,marginBottom:8,color:"var(--color-text-secondary)" }}>
                    <span style={{ fontWeight:500,color:"var(--color-text-primary)" }}>Plan d'action : </span>{c.plan_action}
                  </div>}
                  <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                    <span style={{ fontSize:11,color:"var(--color-text-secondary)" }}>Deadline : <strong style={{ color:"var(--color-text-primary)" }}>{fmt(c.deadline)}</strong></span>
                    <DLBadge deadline={c.deadline} followup_statut={c.followup_statut}/>
                  </div>
                </div>
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontSize:20,fontWeight:500,color:info.color }}>{s==="late"?`-${Math.abs(diff)}j`:s==="done"?"✓":s==="soon"?`J-${diff}`:`+${diff}j`}</div>
                  {c.followup_statut==="En attente"&&<button onClick={()=>setFuModal(c)} style={{ marginTop:6,padding:"4px 10px",fontSize:11,borderRadius:6,border:"0.5px solid #185FA5",background:"transparent",color:"#185FA5",cursor:"pointer" }}>Mettre à jour</button>}
                </div>
              </div>
            </div>;
          })}
        </div>
      )}

      {/* PAR AGENT */}
      {view==="agents"&&(
        <div style={{ background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:10,padding:"1rem" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
            <div style={{ fontSize:13,fontWeight:500 }}>Par agent</div>
            <input placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ fontSize:12,padding:"5px 10px",borderRadius:6,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",width:180 }}/>
          </div>
          <div style={{ maxHeight:480,overflowY:"auto" }}>
            {byAgent.map(({a,n,tgrow,ok,nok,hasLate})=>(
              <div key={a} style={{ marginBottom:12,paddingBottom:12,borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ fontWeight:500 }}>{a}</span>
                    {hasLate&&<Badge label="Retard" bg="#FCEBEB" color="#A32D2D"/>}
                  </div>
                  <div style={{ display:"flex",gap:5 }}>
                    <Badge label={`${tgrow} TGROW`} bg={TB["Coaching TGROW"]} color={TC["Coaching TGROW"]}/>
                    {(ok+nok)>0&&<Badge label={`${ok} OK · ${nok} NOK`} bg={ok>=nok?"#EAF3DE":"#FBEAF0"} color={ok>=nok?"#3B6D11":"#993556"}/>}
                  </div>
                </div>
                <div style={{ display:"flex",height:7,borderRadius:4,overflow:"hidden",background:"var(--color-background-secondary)" }}>
                  {tgrow>0&&<div style={{ flex:tgrow,background:TC["Coaching TGROW"] }}/>}
                  {ok>0&&<div style={{ flex:ok,background:TC["Follow-up OK"] }}/>}
                  {nok>0&&<div style={{ flex:nok,background:TC["Follow-up NOK"] }}/>}
                </div>
              </div>
            ))}
            {byAgent.length===0&&<div style={{ fontSize:12,color:"var(--color-text-secondary)",textAlign:"center",padding:"1rem" }}>Aucun résultat</div>}
          </div>
        </div>
      )}

      {/* PAR CREW */}
      {view==="crew"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {byCrew.map(({cr,n,agents,tgrow,ok,nok,txOK:tx})=>{
            const crAgents=[...new Set(filtered.filter(c=>c.crew===cr).map(c=>c.agent))];
            return <div key={cr} style={{ background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:10,padding:"1rem" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                <div><div style={{ fontSize:14,fontWeight:500 }}>{cr}</div>
                <div style={{ fontSize:11,color:"var(--color-text-secondary)" }}>{agents} agents · {n} entrées</div></div>
                <div style={{ fontSize:22,fontWeight:500,color:"#185FA5" }}>{n}</div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12 }}>
                {[["Coaching TGROW",tgrow,"Coachings"],["Follow-up OK",ok,"OK"],["Follow-up NOK",nok,"NOK"]].map(([t,v,l])=>(
                  <div key={t} style={{ textAlign:"center",padding:"10px 6px",background:TB[t],borderRadius:7 }}>
                    <div style={{ fontSize:20,fontWeight:500,color:TC[t] }}>{v}</div>
                    <div style={{ fontSize:10,color:TC[t],marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
              {(ok+nok)>0&&<div style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4 }}>
                  <span style={{ color:"var(--color-text-secondary)" }}>Taux de réussite</span>
                  <span style={{ fontWeight:500,color:"#3B6D11" }}>{tx}%</span>
                </div>
                <div style={{ background:"var(--color-background-secondary)",borderRadius:4,height:7,overflow:"hidden" }}>
                  <div style={{ width:`${tx}%`,height:"100%",background:"#3B6D11",borderRadius:4 }}/>
                </div>
              </div>}
              <div style={{ fontSize:11,color:"var(--color-text-secondary)",marginBottom:6 }}>Agents :</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                {crAgents.map(a=><span key={a} style={{ fontSize:10,padding:"2px 8px",borderRadius:10,background:"var(--color-background-secondary)",color:"var(--color-text-secondary)" }}>{a}</span>)}
              </div>
            </div>;
          })}
        </div>
      )}

      {/* LISTE */}
      {view==="liste"&&(
        <div style={{ background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:10,overflow:"hidden" }}>
          <div style={{ padding:"10px 12px",borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
            <input placeholder="Rechercher un agent..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ fontSize:12,padding:"5px 10px",borderRadius:6,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",width:"100%" }}/>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
              <thead>
                <tr style={{ background:"var(--color-background-secondary)" }}>
                  {["Agent","Crew","Type","Plan d'action","Deadline","Statut DL","Follow-up","Action"].map(h=>(
                    <th key={h} style={{ padding:"8px 10px",textAlign:"left",fontWeight:500,fontSize:11,color:"var(--color-text-secondary)",borderBottom:"0.5px solid var(--color-border-tertiary)",whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0,30).map(c=>(
                  <tr key={c.id} style={{ borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
                    <td style={{ padding:"7px 10px",fontWeight:500,whiteSpace:"nowrap" }}>{c.agent}</td>
                    <td style={{ padding:"7px 10px",color:"var(--color-text-secondary)",whiteSpace:"nowrap",fontSize:11 }}>{c.crew?.split(" ")[0]}</td>
                    <td style={{ padding:"7px 10px",whiteSpace:"nowrap" }}><Badge label={c.type} bg={TB[c.type]} color={TC[c.type]}/></td>
                    <td style={{ padding:"7px 10px",color:"var(--color-text-secondary)",maxWidth:140 }}>
                      <div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.plan_action||"—"}</div>
                    </td>
                    <td style={{ padding:"7px 10px",color:"var(--color-text-secondary)",whiteSpace:"nowrap" }}>{fmt(c.deadline)}</td>
                    <td style={{ padding:"7px 10px",whiteSpace:"nowrap" }}>{c.deadline?<DLBadge deadline={c.deadline} followup_statut={c.followup_statut}/>:"—"}</td>
                    <td style={{ padding:"7px 10px",whiteSpace:"nowrap" }}>
                      {c.followup_statut&&<Badge label={c.followup_statut}
                        bg={c.followup_statut==="OK"?"#EAF3DE":c.followup_statut==="NOK"?"#FBEAF0":"#F1EFE8"}
                        color={c.followup_statut==="OK"?"#3B6D11":c.followup_statut==="NOK"?"#993556":"#5F5E5A"}/>}
                    </td>
                    <td style={{ padding:"7px 10px",whiteSpace:"nowrap" }}>
                      {c.type==="Coaching TGROW"&&c.followup_statut==="En attente"&&(
                        <button onClick={()=>setFuModal(c)} style={{ padding:"3px 10px",fontSize:11,borderRadius:5,
                          border:"0.5px solid #185FA5",background:"transparent",color:"#185FA5",cursor:"pointer" }}>
                          ✔ Follow-up
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length>30&&<div style={{ padding:"8px",fontSize:11,color:"var(--color-text-secondary)",textAlign:"center",borderTop:"0.5px solid var(--color-border-tertiary)" }}>+{filtered.length-30} entrées</div>}
        </div>
      )}

      {addOpen&&<AddModal user={user} crewList={crewList} agentList={agentList} onClose={()=>setAddOpen(false)} onSaved={()=>{ setAddOpen(false); load(); }}/>}
      {fuModal&&<FollowupModal coaching={fuModal} onClose={()=>setFuModal(null)} onSaved={()=>{ setFuModal(null); load(); }}/>}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]       = useState(null);
  const [coachings, setCoachings] = useState([]);

  useEffect(()=>{
    if (!user || user.role !== "agent") return;
    supabase.from("coachings").select("*").eq("agent", user.name).order("date_coaching",{ascending:false})
      .then(({data})=>setCoachings(data||[]));
  },[user]);

  if (!user) return <LoginScreen onLogin={setUser} />;
  if (user.role === "agent") return <AgentView user={user} coachings={coachings} onLogout={()=>setUser(null)} />;
  return <Dashboard user={user} onLogout={()=>setUser(null)} />;
}
