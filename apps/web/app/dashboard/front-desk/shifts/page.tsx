'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, X, Loader2, Copy, Save, Eraser, Pencil, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shiftsApi, tenantsApi } from '@/lib/api';
import { toast } from 'sonner';

const STORAGE_KEY = 'istays_shift_templates';

// ── Types ──────────────────────────────────────────────────────
interface ShiftTemplate { id: string; name: string; startHour: number; startMin: number; endHour: number; endMin: number; color: string; }
interface StaffMember { id: string; userId: string; role: string; user?: { id: string; fullName: string; email: string }; fullName?: string; }
interface ShiftEntry { id: string; userId: string; startTime: string; endTime: string; role: string; }

const DEFAULT_TEMPLATES: ShiftTemplate[] = [
  { id: 'morning', name: 'Morning Shift', startHour: 8, startMin: 0, endHour: 16, endMin: 0, color: '#2563eb' },
  { id: 'night',   name: 'Night Shift',   startHour: 20, startMin: 0, endHour: 4, endMin: 0, color: '#db2777' },
];

const COLORS = ['#2563eb','#db2777','#16a34a','#d97706','#7c3aed','#0891b2','#dc2626','#374151'];

function fmt2(n: number) { return String(n).padStart(2,'0'); }
function isoDay(year:number,month:number,day:number) { return `${year}-${fmt2(month+1)}-${fmt2(day)}`; }
function dayOfWeek(year:number,month:number,day:number) { return new Date(year,month,day).getDay(); }
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Main Page ─────────────────────────────────────────────────
export default function ShiftsRosterPage() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tab, setTab] = useState<'calendar'|'templates'>('calendar');
  const [templates, setTemplates] = useState<ShiftTemplate[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : DEFAULT_TEMPLATES; } catch { return DEFAULT_TEMPLATES; }
  });
  const [brush, setBrush] = useState<string|null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<{add:{userId:string,date:string,tplId:string}[], del:string[]}>({add:[],del:[]});
  const [showPattern, setShowPattern] = useState<string|null>(null);
  const [editCell, setEditCell] = useState<{userId:string,day:number}|null>(null);
  const [cloning, setCloning] = useState(false);

  const daysInMonth = new Date(year, month+1, 0).getDate();
  const days = Array.from({length: daysInMonth}, (_,i)=>i+1);

  // Persist templates to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(templates)); } catch {}
  }, [templates]);

  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true);
    try { const r = await tenantsApi.getStaff(); if (r.success) setStaff(r.data || []); }
    catch (e: any) { toast.error('Failed to load staff: ' + e.message); }
    finally { setLoadingStaff(false); }
  }, []);

  const fetchShifts = useCallback(async () => {
    setLoadingShifts(true);
    // Use local midnight → local end-of-day, then convert to ISO. Avoids UTC date shift for IST.
    const start = new Date(year, month, 1, 0, 0, 0, 0).toISOString();
    const end   = new Date(year, month, daysInMonth, 23, 59, 59, 999).toISOString();
    try { const r = await shiftsApi.list({ start, end }); if (r.success) setShifts(r.data || []); }
    catch (e: any) { toast.error('Failed to load shifts: ' + e.message); }
    finally { setLoadingShifts(false); }
  }, [year, month, daysInMonth]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);
  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  function getShiftOnDay(userId:string, day:number): ShiftEntry|null {
    // Compare using local date string — startTime comes as ISO UTC string
    // Convert to local date for matching (works correctly for IST +5:30)
    return shifts.find(s => {
      if (s.userId !== userId) return false;
      const d = new Date(s.startTime);
      return d.getFullYear()===year && d.getMonth()===month && d.getDate()===day;
    }) || null;
  }

  function getPendingAdd(userId:string, day:number) {
    const ds = isoDay(year,month,day);
    return pending.add.find(p => p.userId===userId && p.date===ds) || null;
  }

  function handleCellClick(userId:string, day:number) {
    if (!brush) return;
    const ds = isoDay(year,month,day);
    const existing = getShiftOnDay(userId, day);
    const pa = getPendingAdd(userId, day);

    if (brush === 'eraser') {
      if (existing && !pending.del.includes(existing.id))
        setPending(p=>({...p, del:[...p.del, existing.id]}));
      if (pa)
        setPending(p=>({...p, add: p.add.filter(x=>!(x.userId===userId&&x.date===ds))}));
      return;
    }
    if ((existing && !pending.del.includes(existing.id)) || pa) return;
    setPending(p=>({...p, add:[...p.add,{userId,date:ds,tplId:brush}]}));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all(pending.del.map(id=>shiftsApi.delete(id)));
      await Promise.all(pending.add.map(({userId,date,tplId})=>{
        const t = templates.find(x=>x.id===tplId)!;
        // Build local DateTime using Date constructor (avoids string-parsing timezone ambiguity)
        const [y,m,d] = date.split('-').map(Number);
        const startDt = new Date(y, m-1, d, t.startHour, t.startMin, 0, 0);
        const endDt   = new Date(y, m-1, d, t.endHour,   t.endMin,   0, 0);
        if (endDt <= startDt) endDt.setDate(endDt.getDate()+1); // overnight shift
        return shiftsApi.create({ userId, startTime: startDt.toISOString(), endTime: endDt.toISOString(), role: t.name });
      }));
      setPending({add:[],del:[]});
      await fetchShifts();
      toast.success('Roster saved!');
    } catch(e:any) { toast.error(e.message||'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleCloneMonth() {
    if (cloning) return;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear  = month === 11 ? year + 1 : year;
    const nextDays  = new Date(nextYear, nextMonth + 1, 0).getDate();
    setCloning(true);
    try {
      const nextStart = new Date(nextYear, nextMonth, 1).toISOString();
      const nextEnd   = new Date(nextYear, nextMonth, nextDays, 23, 59, 59, 999).toISOString();
      const existing  = await shiftsApi.list({ start: nextStart, end: nextEnd });
      const existingDays = new Set<string>(
        (existing.data || []).map((s: ShiftEntry) => {
          const d = new Date(s.startTime); return `${s.userId}_${d.getDate()}`;
        })
      );
      const toClone = shifts.filter(s => !pending.del.includes(s.id));
      let count = 0;
      await Promise.all(toClone.map(async s => {
        const d = new Date(s.startTime);
        const dom = d.getDate();
        if (dom > nextDays) return;
        if (existingDays.has(`${s.userId}_${dom}`)) return;
        const e = new Date(s.endTime);
        const startDt = new Date(nextYear, nextMonth, dom, d.getHours(), d.getMinutes(), 0, 0);
        const endDt   = new Date(nextYear, nextMonth, dom, e.getHours(), e.getMinutes(), 0, 0);
        if (endDt <= startDt) endDt.setDate(endDt.getDate() + 1);
        await shiftsApi.create({ userId: s.userId, startTime: startDt.toISOString(), endTime: endDt.toISOString(), role: s.role });
        count++;
      }));
      setMonth(nextMonth); setYear(nextYear);
      toast.success(`Cloned ${count} shift${count!==1?'s':''} to ${MONTHS[nextMonth]} ${nextYear}`);
    } catch(e:any) { toast.error('Clone failed: ' + e.message); }
    finally { setCloning(false); }
  }

  const totalPending = pending.add.length + pending.del.length;
  const tpl = (id:string)=>templates.find(t=>t.id===id);
  const todayY = today.getFullYear(), todayM = today.getMonth(), todayD = today.getDate();

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-surface-900">Rostering &amp; Shifts</h1>
          <p className="text-xs sm:text-sm text-surface-500 mt-0.5">Manage your staff schedule month-by-month</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleCloneMonth} disabled={cloning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface-200 bg-white text-xs sm:text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors disabled:opacity-50">
            {cloning ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Copy className="w-4 h-4"/>}
            <span className="hidden sm:inline">Clone Month</span>
            <span className="sm:hidden">Clone</span>
          </button>
          {totalPending > 0 && (
            <button onClick={() => setPending({add:[],del:[]})} className="px-3 py-2 rounded-xl border border-surface-200 bg-white text-xs sm:text-sm font-medium text-surface-500 hover:bg-surface-50 transition-colors">
              Discard
            </button>
          )}
          <button onClick={handleSave} disabled={saving || totalPending === 0}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-primary-700 hover:bg-primary-600 text-white text-xs sm:text-sm font-semibold disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
            Save{totalPending > 0 ? ` ${totalPending}` : ''}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200">
        {(['calendar','templates'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 sm:flex-none sm:px-4 pb-2 text-xs sm:text-sm font-semibold text-center border-b-2 transition-colors -mb-px ${
              tab === t ? 'border-primary-600 text-primary-700' : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}>
            {t === 'calendar' ? 'Staff Calendar' : 'Shift Templates'}
          </button>
        ))}
      </div>

      {tab==='templates' ? (
        <TemplatesTab templates={templates} setTemplates={setTemplates}/>
      ) : (
        <>
          {/* Controls bar — two rows on mobile, one row on md+ */}
          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm px-3 sm:px-4 py-3 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            {/* Row 1: Month + Year */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider hidden sm:block">Month</label>
              <select value={month} onChange={e => setMonth(+e.target.value)}
                className="h-8 px-2 rounded-lg border border-surface-200 text-xs sm:text-sm bg-surface-50 flex-1 sm:flex-none">
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider hidden sm:block">Year</label>
              <select value={year} onChange={e => setYear(+e.target.value)}
                className="h-8 px-2 rounded-lg border border-surface-200 text-xs sm:text-sm bg-surface-50">
                {[todayY-1, todayY, todayY+1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <div className="hidden sm:block h-5 w-px bg-surface-200 mx-1"/>
              <span className="hidden sm:inline text-[10px] font-bold text-surface-400 uppercase tracking-wider">Brush:</span>
            </div>
            {/* Row 2 on mobile / inline on desktop: brush tools */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider sm:hidden">Brush:</span>
              <button onClick={() => { setBrush(brush === 'eraser' ? null : 'eraser'); setEditCell(null); }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold border transition-colors ${
                  brush === 'eraser' ? 'bg-surface-800 text-white border-surface-800' : 'bg-surface-100 text-surface-600 border-surface-200 hover:bg-surface-200'
                }`}>
                <Eraser className="w-3 h-3 sm:w-3.5 sm:h-3.5"/> Eraser
              </button>
              {templates.map(t => (
                <button key={t.id} onClick={() => { setBrush(brush === t.id ? null : t.id); setEditCell(null); }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold border transition-all ${
                    brush === t.id ? 'ring-2 ring-offset-1' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ background: brush===t.id ? t.color+'22' : t.color+'11', borderColor: t.color, color: t.color,
                    ...(brush === t.id ? { boxShadow: `0 0 0 2px ${t.color}` } : {}) }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }}/>
                  <span className="truncate max-w-[80px] sm:max-w-none">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Roster Grid */}
          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
            {(loadingStaff || loadingShifts) && (
              <div className="px-4 py-2 text-xs text-surface-400 flex items-center gap-2 border-b border-surface-100">
                <RefreshCw className="w-3 h-3 animate-spin"/> Loading roster...
              </div>
            )}
            {!loadingStaff && staff.length === 0 && (
              <div className="py-16 text-center text-surface-400">
                <p className="text-sm">No staff found.</p>
                <p className="text-xs mt-1">Add staff from Settings → Staff Management.</p>
              </div>
            )}
            {staff.length > 0 && (
            <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
              <table className="text-xs border-collapse" style={{ minWidth: `${128 + daysInMonth * 42}px` }}>
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200">
                    <th className="sticky left-0 z-10 bg-surface-50 text-left px-3 py-3 font-semibold text-surface-600 w-32 min-w-[128px] shadow-[2px_0_4px_rgba(0,0,0,0.04)]">Staff</th>
                    {days.map(d => {
                      const dow = dayOfWeek(year, month, d);
                      const isWknd = dow === 0 || dow === 6;
                      const isToday = d === todayD && month === todayM && year === todayY;
                      return (
                        <th key={d} className={`w-10 min-w-[40px] px-0.5 py-1.5 text-center font-semibold ${ isWknd ? 'text-red-500' : 'text-surface-400' }`}>
                          <div className="text-[9px] font-medium">{DOW[dow]}</div>
                          <div className={`text-xs font-bold mx-auto w-5 h-5 flex items-center justify-center rounded-full ${ isToday ? 'bg-primary-600 text-white' : '' }`}>{d}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {staff.map(member=>{
                    const uid = member.userId || member.id;
                    const name = member.user?.fullName || (member as any).fullName || uid;
                    const role = member.role?.replace(/_/g,' ');
                    return (
                      <tr key={uid} className="border-b border-surface-100 hover:bg-surface-50/50">
                        <td className="sticky left-0 z-10 bg-white border-r border-surface-100 px-3 py-2 min-w-[128px] max-w-[140px] shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                          <div className="font-semibold text-surface-900 text-xs truncate">{name}</div>
                          <div className="text-[10px] text-surface-400 capitalize mt-0.5">{role}</div>
                          <button onClick={()=>{ setShowPattern(showPattern===uid?null:uid); setEditCell(null); }}
                            className="mt-1 text-[10px] text-primary-600 flex items-center gap-0.5 border border-primary-200 rounded-md px-1.5 py-0.5 hover:bg-primary-50 transition-colors whitespace-nowrap">
                            🔄 Pattern
                          </button>
                        </td>
                        {days.map(d=>{
                          const existing=getShiftOnDay(uid,d);
                          const pa=getPendingAdd(uid,d);
                          const isDeleted=existing&&pending.del.includes(existing.id);
                          const activeTpl = pa ? tpl(pa.tplId) : existing&&!isDeleted ? templates.find(t=>t.name===existing.role)||{id:'',color:'#6b7280',name:existing.role,startHour:0,startMin:0,endHour:0,endMin:0} : null;
                          const dow=dayOfWeek(year,month,d);
                          const isWknd=dow===0||dow===6;
                          const isEditOpen = editCell?.userId===uid && editCell?.day===d;
                          const hasShift = !!activeTpl && !isDeleted;
                          return (
                            <td key={d}
                              onClick={()=>{ if(brush){ handleCellClick(uid,d); } else if(hasShift){ setEditCell(isEditOpen?null:{userId:uid,day:d}); } }}
                              className={`relative px-0.5 py-1 text-center align-middle transition-colors ${
                                brush?'cursor-pointer':'cursor-default'
                              } ${isWknd?'bg-red-50/20':''} ${hasShift&&!brush?'hover:bg-primary-50/30 cursor-pointer':''}`}>
                              {hasShift ? (
                                <span className="inline-flex items-center px-1 py-0.5 rounded-md text-white text-[10px] font-bold leading-tight select-none"
                                  style={{background:activeTpl!.color}}>
                                  {fmt2(pa ? activeTpl!.startHour : new Date(existing!.startTime).getHours())}:{fmt2(pa ? activeTpl!.startMin : new Date(existing!.startTime).getMinutes())}
                                </span>
                              ) : isDeleted ? (
                                <span className="inline-block w-5 h-4 rounded bg-red-100 border border-dashed border-red-300"/>
                              ) : (
                                brush&&brush!=='eraser' ? <span className="inline-block w-7 h-5 rounded border border-dashed border-surface-200 hover:border-primary-300 hover:bg-primary-50/30"/> : null
                              )}
                              {/* Inline edit picker */}
                              {isEditOpen && (
                                <div className="absolute top-7 left-0 z-50 bg-white rounded-xl border border-surface-200 shadow-lg p-2 w-40 text-left" onClick={e=>e.stopPropagation()}>
                                  <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1.5 px-1">Change Shift</p>
                                  {templates.map(t=>(
                                    <button key={t.id} onClick={()=>{
                                      const ds = isoDay(year,month,d);
                                      if (existing && !pa) {
                                        // replace: delete old, add new
                                        if (!pending.del.includes(existing.id)) setPending(p=>({...p,del:[...p.del,existing.id]}));
                                        setPending(p=>({...p,add:[...p.add.filter(x=>!(x.userId===uid&&x.date===ds)),{userId:uid,date:ds,tplId:t.id}]}));
                                      } else if (pa) {
                                        // just swap pending add
                                        setPending(p=>({...p,add:p.add.map(x=>x.userId===uid&&x.date===ds?{...x,tplId:t.id}:x)}));
                                      }
                                      setEditCell(null);
                                    }}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-50 text-xs font-medium text-surface-700 transition-colors">
                                      <span className="w-3 h-3 rounded-full shrink-0" style={{background:t.color}}/>{t.name}
                                    </button>
                                  ))}
                                  <div className="border-t border-surface-100 mt-1 pt-1">
                                    <button onClick={()=>{
                                      if (existing && !pending.del.includes(existing.id)) setPending(p=>({...p,del:[...p.del,existing.id]}));
                                      const ds = isoDay(year,month,d);
                                      setPending(p=>({...p,add:p.add.filter(x=>!(x.userId===uid&&x.date===ds))}));
                                      setEditCell(null);
                                    }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-50 text-xs font-medium text-red-500 transition-colors">
                                      <X className="w-3 h-3"/> Remove Shift
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {/* Empty state moved above table */}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Pattern Panel */}
          <AnimatePresence>
            {showPattern&&(
              <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.3}} className="overflow-hidden">
                <PatternPanel userId={showPattern} year={year} month={month} templates={templates} daysInMonth={daysInMonth}
                  onApply={(pattern)=>{
                    const newAdds:{userId:string,date:string,tplId:string}[]=[];
                    pattern.forEach((tplId,idx)=>{
                      if(!tplId) return;
                      const day=idx+1;
                      if(day>daysInMonth) return;
                      const ds=isoDay(year,month,day);
                      if(!getShiftOnDay(showPattern!,day)&&!pending.add.find(p=>p.userId===showPattern&&p.date===ds))
                        newAdds.push({userId:showPattern!,date:ds,tplId});
                    });
                    setPending(p=>({...p,add:[...p.add,...newAdds]}));
                    setShowPattern(null);
                    toast.success('Pattern applied!');
                  }}
                  onClose={()=>setShowPattern(null)}/>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ── Shift Templates Tab ───────────────────────────────────────
function TemplatesTab({templates,setTemplates}:{templates:ShiftTemplate[];setTemplates:React.Dispatch<React.SetStateAction<ShiftTemplate[]>>}) {
  const [name,setName]=useState('');
  const [startH,setStartH]=useState(8);
  const [startM,setStartM]=useState(0);
  const [endH,setEndH]=useState(16);
  const [endM,setEndM]=useState(0);
  const [color,setColor]=useState(COLORS[0]);

  function add() {
    if(!name.trim()) return;
    setTemplates(t=>[...t,{id:Date.now().toString(),name:name.trim(),startHour:startH,startMin:startM,endHour:endH,endMin:endM,color}]);
    setName('');
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-primary-200 shadow-sm overflow-hidden" style={{borderTop:'3px solid #166534'}}>
        <div className="p-4 border-b border-surface-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center"><Pencil className="w-4 h-4 text-primary-600"/></div>
          <h3 className="font-bold text-surface-900">New Shift Template</h3>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Shift Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Morning Shift"
              className="w-full h-9 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30"/>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Start Time</label>
            <div className="flex gap-1">
              <input type="number" min={0} max={23} value={startH} onChange={e=>setStartH(+e.target.value)} className="w-14 h-9 px-2 rounded-xl border border-surface-200 bg-surface-50 text-sm text-center"/>
              <span className="self-center font-bold text-surface-400">:</span>
              <input type="number" min={0} max={59} step={15} value={startM} onChange={e=>setStartM(+e.target.value)} className="w-14 h-9 px-2 rounded-xl border border-surface-200 bg-surface-50 text-sm text-center"/>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">End Time</label>
            <div className="flex gap-1">
              <input type="number" min={0} max={23} value={endH} onChange={e=>setEndH(+e.target.value)} className="w-14 h-9 px-2 rounded-xl border border-surface-200 bg-surface-50 text-sm text-center"/>
              <span className="self-center font-bold text-surface-400">:</span>
              <input type="number" min={0} max={59} step={15} value={endM} onChange={e=>setEndM(+e.target.value)} className="w-14 h-9 px-2 rounded-xl border border-surface-200 bg-surface-50 text-sm text-center"/>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Color</label>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map(c=>(
                <button key={c} onClick={()=>setColor(c)} className={`w-6 h-6 rounded-full border-2 transition-all ${color===c?'border-surface-700 scale-110':'border-transparent hover:scale-105'}`} style={{background:c}}/>
              ))}
            </div>
          </div>
          <div className="sm:col-span-5 flex justify-end pt-1 border-t border-surface-100">
            <button onClick={add} disabled={!name.trim()} className="flex items-center gap-2 px-4 h-9 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-40 transition-colors">
              <Plus className="w-4 h-4"/> Add Template
            </button>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t=>(
          <div key={t.id} className="bg-white rounded-2xl border border-surface-200 shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:t.color}}>
              {fmt2(t.startHour)}:{fmt2(t.startMin)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-surface-900 truncate">{t.name}</p>
              <p className="text-xs text-surface-500">{fmt2(t.startHour)}:{fmt2(t.startMin)} – {fmt2(t.endHour)}:{fmt2(t.endMin)}</p>
            </div>
            <button onClick={()=>setTemplates(ts=>ts.filter(x=>x.id!==t.id))} className="text-surface-300 hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4"/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rotation Pattern Panel ─────────────────────────────────────
function PatternPanel({userId,year,month,templates,daysInMonth,onApply,onClose}:{
  userId:string; year:number; month:number; templates:ShiftTemplate[]; daysInMonth:number;
  onApply:(pattern:(string|null)[])=>void; onClose:()=>void;
}) {
  const [startDay,setStartDay]=useState(1);
  const [cycle,setCycle]=useState<(string|null)[]>([null,null,null,null,null,null,null]);

  function addDay(){setCycle(c=>[...c,null]);}
  function removeDay(i:number){setCycle(c=>c.filter((_,idx)=>idx!==i));}
  function setDay(i:number,v:string|null){setCycle(c=>c.map((x,idx)=>idx===i?v:x));}

  function apply(){
    const pattern:((string|null)[])=Array(daysInMonth).fill(null);
    let ci=0;
    for(let d=startDay-1;d<daysInMonth;d++){
      const slot=cycle[ci%cycle.length];
      pattern[d]=slot;
      ci++;
    }
    onApply(pattern);
  }

  return (
    <div className="bg-white rounded-2xl border border-primary-200 shadow-lg overflow-hidden" style={{borderTop:'3px solid #166534'}}>
      <div className="flex items-center justify-between p-4 border-b border-surface-100">
        <h3 className="font-display font-bold text-surface-900">Apply Rotation Pattern</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 transition-all"><X className="w-4 h-4"/></button>
      </div>
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        <div>
          <label className="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Start Day (1–{daysInMonth})</label>
          <input type="number" min={1} max={daysInMonth} value={startDay} onChange={e=>setStartDay(+e.target.value)} className="w-24 h-9 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm"/>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-2">Cycle Sequence</label>
          <p className="text-xs text-surface-500 mb-3">This pattern repeats until end of month. Off Duty = no shift assigned.</p>
          <div className="space-y-2">
            {cycle.map((v,i)=>(
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-bold text-surface-400 w-8">D{i+1}:</span>
                <select value={v||''} onChange={e=>setDay(i,e.target.value||null)} className="flex-1 h-9 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm">
                  <option value="">Off Duty (Clear)</option>
                  {templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button onClick={()=>removeDay(i)} className="text-red-400 hover:text-red-600 transition-colors"><X className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
          <button onClick={addDay} className="mt-3 w-full border border-dashed border-surface-300 rounded-xl py-2 text-xs text-surface-500 hover:bg-surface-50 hover:border-primary-300 hover:text-primary-600 transition-colors">+ Add Empty Day to Cycle</button>
        </div>
      </div>
      <div className="flex gap-3 p-4 border-t border-surface-100">
        <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-surface-200 text-surface-700 text-sm font-medium hover:bg-surface-50 transition-colors">Cancel</button>
        <button onClick={apply} className="flex-1 h-10 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-600 transition-colors">Apply &amp; Paint Grid</button>
      </div>
    </div>
  );
}
