import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  updateDoc,
  setDoc,
  getDocs, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  Hammer, 
  ClipboardList, 
  Users, 
  BarChart3, 
  Camera, 
  Calculator, 
  Plus, 
  Trash2, 
  LayoutDashboard, 
  HardHat, 
  Ruler, 
  Wifi, 
  WifiOff, 
  UploadCloud, 
  Briefcase, 
  Loader2, 
  Image as ImageIcon, 
  UserCheck, 
  BrickWall, 
  Lock,
  Settings,
  UserPlus,
  Pencil,
  Calendar as CalendarIcon,
  X,
  MapPin,
  TrendingUp,
  UserCog,
  KeyRound,
  Save,
  MessageSquare,
  Clock,
  History,
  CalendarDays,
  AlertTriangle,
  Download
} from 'lucide-react';

// --- Firebase Configuration ---
const getFirebaseConfig = () => {
  try {
    if (typeof __firebase_config !== 'undefined') {
      return JSON.parse(__firebase_config);
    }
  } catch (e) {
    console.log("Using fallback config");
  }
  return {
    apiKey: "AIzaSyD2abWWT2aqYQHRa-E16f_NPs_ESvRwaR0",
    authDomain: "masontrack-pro.firebaseapp.com",
    projectId: "masontrack-pro",
    storageBucket: "masontrack-pro.firebasestorage.app",
    messagingSenderId: "913814562702",
    appId: "1:913814562702:web:1fbf33e71c73ac1377a6df"
  };
};

const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'masonry-crew-main';

// --- Constants ---
const MATERIALS = {
  BLOCK_4: { label: '4" Block', unit: 'units', perSqFt: 1.125, nominalH: 8, nominalL: 16 },
  BLOCK_6: { label: '6" Block', unit: 'units', perSqFt: 1.125, nominalH: 8, nominalL: 16 },
  BLOCK_8: { label: '8" Block', unit: 'units', perSqFt: 1.125, nominalH: 8, nominalL: 16 },
  BLOCK_10: { label: '10" Block', unit: 'units', perSqFt: 1.125, nominalH: 8, nominalL: 16 },
  BLOCK_12: { label: '12" Block', unit: 'units', perSqFt: 1.125, nominalH: 8, nominalL: 16 },
  BRICK_STD: { label: 'Standard Brick (4")', unit: 'units', perSqFt: 4.5, nominalH: 4, nominalL: 8 }, 
  BRICK_MOD: { label: 'Modular Brick (3⅛")', unit: 'units', perSqFt: 5.76, nominalH: 3.125, nominalL: 8 },
  VENEER: { label: 'Veneer', unit: 'sq ft', perSqFt: 1, isArea: true },
};

const DEFAULT_CREW = [
  { name: 'Manager', role: 'manager', pin: '1234' },
  { name: 'Foreman', role: 'foreman', pin: '1234' },
  { name: 'Mason 1', role: 'mason', pin: '1234' },
  { name: 'Mason 2', role: 'mason', pin: '1234' },
  { name: 'Mason 3', role: 'mason', pin: '1234' },
  { name: 'Mason 4', role: 'mason', pin: '1234' }
];
const DEFAULT_JOBS = ['Downtown Plaza', 'Riverside Complex', 'West End School'];

const COLORS = ['#ea580c', '#2563eb', '#16a34a', '#9333ea', '#db2777', '#ca8a04', '#0891b2', '#4b5563'];

const formatDate = (date) => {
  if (!date || isNaN(date.getTime())) return 'Invalid Date';
  return new Date(date).toLocaleDateString('en-US', { 
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
  });
};

const formatGraphDate = (date, isWeekly) => {
    const options = { month: 'short', day: 'numeric' };
    if (!isWeekly) return date.toLocaleDateString('en-US', options);
    
    const end = new Date(date);
    end.setDate(date.getDate() + 6);
    return `${date.toLocaleDateString('en-US', options)}-${end.getDate()}`;
};

const formatISODate = (date) => {
  if (!date || isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = String(date.getDate()).padStart(2, '0');
  return date.toISOString().split('T')[0];
};

// --- Components ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled, ...props }) => {
  const variants = {
    primary: "bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-200 disabled:bg-orange-300",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600",
    outline: "bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-xs font-semibold text-gray-500 uppercase">{label}</label>}
    <input className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" {...props} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-xs font-semibold text-gray-500 uppercase">{label}</label>}
    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" {...props}>
      {options.map((opt, idx) => (
        <option key={idx} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`}>
    {children}
  </div>
);

// Optimized Trend Chart (Memoized)
const TrendChart = React.memo(({ data, keys, xKey = 'label' }) => {
  if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data for this period</div>;

  const height = 200;
  const width = 600; 
  const padding = 40;
  
  const x0 = padding;
  const x1 = width - padding;
  const y0 = height - padding;
  const y1 = padding;

  const allValues = data.flatMap(d => keys.map(k => d[k] || 0));
  const maxValue = Math.max(...allValues, 1);
  
  const getX = (index) => x0 + (index / (data.length - 1 || 1)) * (x1 - x0);
  const getY = (value) => y0 - ((value || 0) / maxValue) * (y0 - y1);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[300px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const y = y0 - t * (y0 - y1);
            return (
              <g key={t}>
                <line x1={x0} y1={y} x2={x1} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text x={x0 - 5} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{Math.round(t * maxValue)}</text>
              </g>
            );
          })}
          {keys.map((k, i) => {
            const points = data.map((d, idx) => `${getX(idx)},${getY(d[k])}`).join(' ');
            return <polyline key={k} points={points} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />;
          })}
          {data.map((d, i) => (
            <text key={i} x={getX(i)} y={y0 + 20} textAnchor="middle" fontSize="10" fill="#6b7280" transform={`rotate(0, ${getX(i)}, ${y0+20})`}>{d[xKey]}</text>
          ))}
        </svg>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {keys.map((k, i) => (
            <div key={k} className="flex items-center gap-1 text-xs text-gray-600">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
              {k}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const DimensionInput = ({ label, value, onChange, onModeChange, currentMode, allowUnits = true }) => {
  const [ft, setFt] = useState('');
  const [inc, setInc] = useState('');

  // Reset local state only when value prop is cleared/changed externally
  useEffect(() => { 
      if (value === 0) { setFt(''); setInc(''); } 
  }, [value, currentMode]);

  const handleUpdate = (newVal1, newVal2) => {
    if (currentMode === 'units') { 
      const unitCount = parseFloat(newVal1) || 0;
      setFt(newVal1); 
      onChange(unitCount, currentMode); 
    } else if (currentMode === 'ft-in') {
        const f = parseFloat(newVal1) || 0;
        const i = parseFloat(newVal2) || 0;
        const finalValue = f + (i / 12);
        setFt(newVal1); 
        setInc(newVal2);
        onChange(finalValue, currentMode);
    }
  };

  // PASS THE MODE CHANGE UP TO PARENT
  const handleModeSwitch = (newMode) => {
    setFt(''); setInc(''); 
    if (onModeChange) {
        onModeChange(newMode); 
    }
  };

  const isLength = label.includes('Length');
  const placeholderText = currentMode === 'units' 
                          ? (isLength ? "0 Units" : "0 Units")
                          : "0";

  return (
    <div className="mb-3 DimensionInput">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">{label}</label>
        <div className="flex bg-gray-100 rounded p-0.5">
          {allowUnits && (
            <button type="button" onClick={() => handleModeSwitch('units')} className={`px-2 py-0.5 text-[10px] rounded ${currentMode==='units' ? 'bg-white shadow text-orange-600 font-bold' : 'text-gray-500'}`}>Units</button>
          )}
          <button type="button" onClick={() => handleModeSwitch('ft-in')} className={`px-2 py-0.5 text-[10px] rounded ${currentMode==='ft-in' ? 'bg-white shadow text-orange-600 font-bold' : 'text-gray-500'}`}>Ft & In</button>
        </div>
      </div>
      
      {currentMode === 'units' && allowUnits && (
        <div className="relative w-full">
            <input 
                type="number" 
                placeholder={placeholderText} 
                className="w-full px-3 py-2 border border-gray-300 rounded" 
                value={ft}
                onChange={e => handleUpdate(e.target.value)} 
            />
            <span className="absolute right-3 top-2 text-gray-400 text-sm">units</span>
        </div>
      )}
      
      {currentMode === 'ft-in' && (
          <div className="flex gap-2">
            <div className="relative w-full"><input type="number" placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded" value={ft} onChange={e => handleUpdate(e.target.value, inc)} /><span className="absolute right-3 top-2 text-gray-400 text-sm">ft</span></div>
            <div className="relative w-full"><input type="number" placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded" value={inc} onChange={e => handleUpdate(ft, e.target.value)} /><span className="absolute right-3 top-2 text-gray-400 text-sm">in</span></div>
          </div>
      )}
    </div>
  );
};

// --- Main Application ---

export default function MasonTrackPro() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); 
  const [crewList, setCrewList] = useState([]);
  const [jobList, setJobList] = useState([]);
  const [profile, setProfile] = useState({ id: '', name: '', role: 'mason', pin: '' });
  const [view, setView] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [logToEdit, setLogToEdit] = useState(null);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [motd, setMotd] = useState("All systems go.");
  
  const [loginName, setLoginName] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isProfileChecked, setIsProfileChecked] = useState(false);
  const [savedProfile, setSavedProfile] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (curr) => {
      if (curr) {
        setUser(curr);
        const saved = localStorage.getItem('masonProfile');
        if (saved) {
             setSavedProfile(JSON.parse(saved));
        }
        setAuthLoading(false);
        setIsProfileChecked(true); 
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isProfileChecked && savedProfile && savedProfile.name) {
        const exists = crewList.find(c => c.name === savedProfile.name);
        if (exists) { setProfile(savedProfile); } 
        else { localStorage.removeItem('masonProfile'); setSavedProfile(null); setProfile({ id: '', name: '', role: 'mason', pin: '' }); }
    }
  }, [isProfileChecked, savedProfile, crewList]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'global'), (snap) => {
        if (snap.exists()) setMotd(String(snap.data().message || "All systems go."));
    });
    return () => unsub();
  }, [user]);

  // Modified Query: Sort in JS
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'masonry_logs'));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        date: d.data().effectiveDate ? d.data().effectiveDate.toDate() : (d.data().timestamp ? d.data().timestamp.toDate() : new Date()) 
      }));
      data.sort((a, b) => b.date - a.date);
      setLogs(data.slice(0, 500));
    });
  }, [user]);

  // Modified Query: Sort in JS
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'crew_members'));
    return onSnapshot(q, async (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setCrewList(data);
      if (snap.empty && navigator.onLine) {
        const batch = writeBatch(db);
        DEFAULT_CREW.forEach(p => { batch.set(doc(collection(db, 'artifacts', appId, 'public', 'data', 'crew_members')), { ...p, timestamp: serverTimestamp() }); });
        await batch.commit();
      }
    });
  }, [user]);

  // Modified Query: Sort in JS
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'jobsites'));
    return onSnapshot(q, async (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setJobList(data);
      if (snap.empty && navigator.onLine) {
        const batch = writeBatch(db);
        DEFAULT_JOBS.forEach(name => { batch.set(doc(collection(db, 'artifacts', appId, 'public', 'data', 'jobsites')), { name, active: true, timestamp: serverTimestamp() }); });
        await batch.commit();
      }
    });
  }, [user]);

  const processSyncQueue = async () => {
    setIsSyncing(true); const queue = [...syncQueue], newQueue = [];
    for (const entry of queue) {
      try {
        const dParts = entry.dateString.split('-');
        const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2], 12, 0, 0);
        let finalCount = entry.count;
        if (entry.entryMethod === 'camera') { await new Promise(r => setTimeout(r, 1500)); finalCount = Math.floor(Math.random() * (120 - 40 + 1)) + 40; }
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'masonry_logs'), { ...entry, count: finalCount, timestamp: serverTimestamp(), effectiveDate: Timestamp.fromDate(dObj), syncedAt: serverTimestamp() });
      } catch (err) { newQueue.push(entry); }
    }
    setSyncQueue(newQueue); setIsSyncing(false);
  };

  // Standard login handler (for button click)
  const handleLogin = (e) => {
    if(e) e.preventDefault();
    if (!loginName || !loginPin || crewList.length === 0) { setLoginError("Please wait for data..."); return; }
    const user = crewList.find(c => c.name === loginName);
    if (!user || !user.id) { setLoginError("User invalid. Try again."); setTimeout(() => setLoginError("Try again."), 500); return; }
    if ((user.pin || '1234') !== loginPin) { setLoginError("Incorrect PIN."); return; }
    const profileData = { id: user.id, name: user.name, role: user.role, pin: user.pin };
    localStorage.setItem('masonProfile', JSON.stringify(profileData));
    setProfile(profileData); setSavedProfile(profileData); setLoginPin(''); setLoginError(''); setView('dashboard');
  };

  // Dedicated handler for numeric keypad auto-login
  const handlePinEntry = (e) => {
    // Strip non-numeric chars just in case
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setLoginPin(val);
    setLoginError('');
    
    if (val.length === 4) {
      const user = crewList.find(c => c.name === loginName);
      if (user) {
         if ((user.pin || '1234') === val) {
             const profileData = { id: user.id, name: user.name, role: user.role, pin: user.pin };
             localStorage.setItem('masonProfile', JSON.stringify(profileData));
             setProfile(profileData); 
             setSavedProfile(profileData); 
             setLoginPin(''); 
             setLoginError(''); 
             setView('dashboard');
         } else {
             setLoginError("Incorrect PIN.");
         }
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('masonProfile'); setProfile({ id: '', name: '', role: 'mason', pin: '' }); setSavedProfile(null); setLoginName(''); setLoginPin(''); setView('login'); setIsProfileChecked(true); 
  };

  const exportData = () => {
    if (logs.length === 0) { alert("No logs to export."); return; }
    const headers = ["Date", "Mason", "Role", "Jobsite", "Material", "Count", "Unit", "Hours", "UPH", "Notes", "Entry Method"];
    const rows = logs.map(log => {
        const safeNotes = log.notes ? `"${log.notes.replace(/"/g, '""')}"` : ""; 
        return [log.date.toISOString().split('T')[0], log.userName, log.userRole, log.jobsite, log.materialLabel, log.count, log.unit, log.hours, log.hours > 0 ? (log.count/log.hours).toFixed(1) : 0, safeNotes, log.entryMethod].join(",");
    });
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `MasonTrack_Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  useEffect(() => {
    const saved = localStorage.getItem('masonSyncQueue');
    if (saved) setSyncQueue(JSON.parse(saved));
    const hOn = () => setIsOnline(true); const hOff = () => setIsOnline(false);
    window.addEventListener('online', hOn); window.addEventListener('offline', hOff);
    return () => { window.removeEventListener('online', hOn); window.removeEventListener('offline', hOff); };
  }, []);
  useEffect(() => { localStorage.setItem('masonSyncQueue', JSON.stringify(syncQueue)); }, [syncQueue]);
  useEffect(() => { if (isOnline && syncQueue.length > 0 && !isSyncing) processSyncQueue(); }, [isOnline, syncQueue, isSyncing]);

  const ChangePinView = () => {
    const [oldPin, setOldPin] = useState(''), [newPin, setNewPin] = useState(''), [msg, setMsg] = useState('');
    const updatePin = async (e) => {
        e.preventDefault();
        const currentUser = crewList.find(c => c.id === profile.id);
        if ((currentUser?.pin || '1234') !== oldPin) { setMsg("Old PIN is incorrect."); return; }
        if (newPin.length < 4) { setMsg("Min 4 digits."); return; }
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crew_members', profile.id), { pin: newPin });
        setMsg("Success!"); setProfile(p => ({...p, pin: newPin})); localStorage.setItem('masonProfile', JSON.stringify({...profile, pin: newPin}));
        setTimeout(() => setView('dashboard'), 1500);
    };
    return (<div className="space-y-6 animate-fade-in"><div className="flex justify-between"><h2 className="text-xl font-bold">Change PIN</h2><Button variant="ghost" onClick={() => setView('dashboard')}>Back</Button></div><Card><form onSubmit={updatePin} className="space-y-4"><Input label="Current PIN" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder="****" value={oldPin} onChange={e => setOldPin(e.target.value.replace(/\D/g, '').slice(0,4))} /><Input label="New PIN" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder="****" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0,4))} />{msg && <div className={`text-sm ${msg.includes('Success')?'text-green-600':'text-red-600'}`}>{msg}</div>}<Button type="submit" className="w-full">Update</Button></form></Card></div>);
  };

  const ManageDataView = ({ type }) => {
    const [newItem, setNewItem] = useState(''), [newRole, setNewRole] = useState('mason'), [pinToSet, setPinToSet] = useState('');
    const [editingId, setEditingId] = useState(null), [submitting, setSubmitting] = useState(false);
    const isCrew = type === 'crew', collectionName = isCrew ? 'crew_members' : 'jobsites', list = isCrew ? crewList : jobList;
    const handleSubmit = async (e) => {
      e.preventDefault(); if (!newItem.trim()) return; setSubmitting(true);
      try {
        const data = { name: newItem.trim() };
        if (isCrew) { data.role = newRole; if (pinToSet.trim().length >= 4) data.pin = pinToSet.trim(); }
        if (editingId) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, editingId), data);
        else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', collectionName), { ...data, ...(isCrew ? {pin: pinToSet.trim()||'1234'} : {active:true}), timestamp: serverTimestamp() });
        setNewItem(''); setPinToSet(''); setEditingId(null); if (isCrew) setNewRole('mason');
      } catch(e) { alert("Error saving."); } setSubmitting(false);
    };
    const hardResetCrew = async () => {
        if (!confirm("WARNING: Reset crew to defaults?")) return; setSubmitting(true);
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'crew_members'));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crew_members', d.id))));
        const batch = writeBatch(db);
        DEFAULT_CREW.forEach(p => { batch.set(doc(collection(db, 'artifacts', appId, 'public', 'data', 'crew_members')), { ...p, timestamp: serverTimestamp() }); });
        await batch.commit(); setSubmitting(false);
    };
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between"><h2 className="text-xl font-bold">Manage {isCrew ? 'Crew' : 'Jobs'}</h2><Button variant="ghost" onClick={() => setView('dashboard')}>Back</Button></div>
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
            <div className="flex justify-between items-center"><span className="text-sm font-semibold text-gray-500 uppercase">{editingId ? 'Edit' : 'Add New'}</span>{editingId && <button type="button" onClick={() => {setEditingId(null); setNewItem('');}} className="text-xs text-red-500">Cancel</button>}</div>
            <Input placeholder="Name" value={newItem} onChange={(e) => setNewItem(e.target.value)} className="mb-0"/>
            {isCrew && <div className="flex gap-2"><select className="w-1/2 px-3 py-2 border rounded-md text-sm" value={newRole} onChange={e => setNewRole(e.target.value)}><option value="mason">Mason</option><option value="foreman">Foreman</option><option value="manager">Manager</option></select><input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder={editingId ? "Reset PIN" : "PIN (****)"} className="w-1/2 px-3 py-2 border rounded-md text-sm" value={pinToSet} onChange={e => setPinToSet(e.target.value.replace(/\D/g, '').slice(0,4))}/></div>}
            <Button type="submit" disabled={submitting || !newItem.trim()}><Save size={18} /> {editingId ? 'Update' : 'Add'}</Button>
          </form>
          <div className="space-y-2">{list.map((item) => (<div key={item.id} className={`flex justify-between p-3 rounded-lg border ${editingId===item.id?'bg-orange-50 border-orange-300':'bg-gray-50'}`}><div className="flex items-center gap-3"><div className="bg-white p-2 rounded-full border">{isCrew ? (item.role === 'manager' ? <Briefcase size={16}/> : item.role === 'foreman' ? <HardHat size={16}/> : <Users size={16} />) : <MapPin size={16} />}</div><div><div className="font-medium">{item.name}</div>{isCrew && <div className="text-xs text-gray-400 capitalize">{item.role}</div>}</div></div><div className="flex gap-1"><button onClick={() => {setEditingId(item.id); setNewItem(item.name); if(isCrew) setNewRole(item.role);}} className="text-gray-400 hover:text-blue-500 p-2"><Pencil size={18}/></button><button onClick={() => {if(confirm('Delete?')) deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, item.id))}} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={18} /></button></div></div>))}</div>
          {isCrew && <div className="mt-8 pt-4 border-t border-red-100"><button onClick={hardResetCrew} disabled={submitting} className="w-full py-3 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 flex justify-center gap-2 mb-4"><AlertTriangle size={16} /> Reset Defaults</button><button onClick={exportData} className="w-full py-3 border border-green-200 text-green-700 bg-green-50 rounded-lg text-sm hover:bg-green-100 flex justify-center gap-2"><Download size={16} /> Export CSV</button></div>}
        </Card>
      </div>
    );
  };

  const LogEntryView = () => {
    // Mode defaults to 'manual'
    const [mode, setMode] = useState('manual'); 
    const [entry, setEntry] = useState({ jobsite: jobList[0]?.name || '', material: 'BLOCK_8', hours: 8, count: 0, notes: '', dateStr: formatISODate(new Date()) });
    // Calc state tracks its own mode and values
    const [calc, setCalc] = useState({ w: 0, h: 0, mode: 'units' });
    const [photoTaken, setPhotoTaken] = useState(false);
    const [targetWorker, setTargetWorker] = useState(profile.name);
    const [expandedNote, setExpandedNote] = useState(null);

    // 1. Sync Calc Result to Entry State
    useEffect(() => {
        if (calc.mode === 'units') {
            // Units mode: simple multiplication
            const result = (calc.w > 0 && calc.h > 0) ? Math.round(calc.w * calc.h) : 0;
            setEntry(prev => ({ ...prev, count: result }));
        }
    }, [calc.w, calc.h, calc.mode]);

    // 2. Initialize Tab Defaults
    useEffect(() => {
        if (mode === 'calc') { 
            // FIX: Auto-select ft-in if material is VENEER, otherwise default to units
            const isVeneer = MATERIALS[entry.material].isArea;
            setCalc(c => ({...c, mode: isVeneer ? 'ft-in' : 'units', w: 0, h: 0})); 
            setEntry(e => ({...e, count: 0})); 
        } else { 
            setEntry(e => ({...e, count: 0})); 
        }
    }, [mode]);

    // Load Edit Data
    useEffect(() => {
      if (logToEdit) {
        setMode(logToEdit.entryMethod);
        setEntry({ ...logToEdit, dateStr: formatISODate(logToEdit.date), count: logToEdit.count });
        setTargetWorker(logToEdit.userName);
        if (logToEdit.entryMethod === 'camera') setPhotoTaken(true);
      }
    }, []);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if ((mode !== 'camera' && entry.count <= 0) || (mode === 'camera' && !photoTaken)) return;
      const dParts = entry.dateStr.split('-'), dObj = new Date(dParts[0], dParts[1] - 1, dParts[2], 12, 0, 0);
      const data = {
        userId: user.uid, userName: targetWorker, loggedBy: profile.name, userRole: profile.role,
        jobsite: entry.jobsite, material: entry.material, materialLabel: MATERIALS[entry.material].label, unit: MATERIALS[entry.material].unit,
        hours: parseFloat(entry.hours), count: parseInt(entry.count), entryMethod: mode, notes: entry.notes, status: 'completed', dateString: entry.dateStr
      };

      if (!isOnline && !logToEdit) { setSyncQueue([...syncQueue, data]); alert('Queued Offline.'); } 
      else {
        const final = { ...data, effectiveDate: Timestamp.fromDate(dObj), timestamp: serverTimestamp() };
        try {
          if (logToEdit) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masonry_logs', logToEdit.id), final); alert('Updated!'); }
          else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'masonry_logs'), final); alert('Logged!'); }
        } catch(e) { if(!logToEdit) setSyncQueue([...syncQueue, data]); }
      }
      setLogToEdit(null); setView('dashboard');
    };

    // UPDATED: Specific Manual Calculate Logic
    const handleCalcBtn = () => {
       const mat = MATERIALS[entry.material];
       const lengthIn = calc.w * 12; // DimensionInput sends Feet, convert to Inches
       const heightIn = calc.h * 12; // DimensionInput sends Feet, convert to Inches

       if (mat.isArea) {
         // Veneer: Area Calculation (Sq Ft)
         // Since inputs are in Feet, calc.w * calc.h is already Sq Ft
         const sqFt = calc.w * calc.h;
         setEntry({ ...entry, count: Math.ceil(sqFt) }); // User said measure in Sq Ft.
       } else if (mat.nominalH && mat.nominalL) {
         // Block/Brick: Specific Unit Logic
         // Divide Wall Inch dims by Unit Nominal Inch dims
         const unitsLong = lengthIn / mat.nominalL;
         const unitsHigh = heightIn / mat.nominalH;
         
         // Multiply Height Units * Length Units
         const totalUnits = unitsLong * unitsHigh;
         
         setEntry({ ...entry, count: Math.ceil(totalUnits) });
       } else {
         // Fallback (should not happen if data is correct)
         setEntry({ ...entry, count: 0 });
       }
    };

    // Update handlers for the DimensionInput component
    const handleCalcDimensionChange = (val, mode) => {
        setCalc(c => ({...c, w: val, mode: mode}));
    }
    const handleCalcHeightChange = (val, mode) => {
        setCalc(c => ({...c, h: val, mode: mode}));
    }
    
    // Mode switch handler passed to inputs
    const handleCalcModeChange = (newMode) => {
        setCalc(c => ({...c, mode: newMode, w: 0, h: 0}));
    }

    const recentContextLogs = useMemo(() => {
      let filtered = logs;
      if (profile.role === 'mason') filtered = logs.filter(l => l.userName === profile.name);
      return filtered.slice(0, 20); 
    }, [logs, profile]);

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex justify-between"><h2 className="text-xl font-bold">{logToEdit ? 'Edit' : 'New Entry'}</h2><Button variant="ghost" onClick={() => { setLogToEdit(null); setView('dashboard'); }}>Cancel</Button></div>
        <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg">
          {['manual', 'calc', 'camera'].map(m => <button key={m} onClick={() => !logToEdit && setMode(m)} className={`py-2 text-sm font-medium rounded-md capitalize ${mode === m ? 'bg-white shadow text-orange-600' : 'text-gray-500'} ${logToEdit ? 'opacity-50' : ''}`}>{m === 'camera' ? 'AI Camera' : m}</button>)}
        </div>
        <form onSubmit={handleSubmit}>
          <Card className="space-y-4">
            <div className="p-3 bg-gray-50 border rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase"><CalendarIcon size={12} /> Date</div>
                <input type="date" className="bg-transparent text-right font-medium outline-none" value={entry.dateStr} onChange={(e) => setEntry({...entry, dateStr: e.target.value})} required />
            </div>
            {(profile.role !== 'mason' || logToEdit) && <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col gap-1"><div className="flex items-center gap-2 text-indigo-800 text-xs font-bold"><UserCheck size={12} /> WORKER</div><select className="bg-transparent w-full font-medium text-indigo-900 outline-none" value={targetWorker} onChange={(e) => setTargetWorker(e.target.value)}>{crewList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>}
            <Select label="Jobsite" options={jobList.map(j => ({ value: j.name, label: j.name }))} value={entry.jobsite} onChange={e => setEntry({...entry, jobsite: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
                <Select 
                    label="Material" 
                    options={Object.keys(MATERIALS).map(k => ({ value: k, label: MATERIALS[k].label }))} 
                    value={entry.material} 
                    onChange={e => {
                        const mat = e.target.value;
                        setEntry({...entry, material: mat});
                        // Auto-switch defaults
                        // UPDATED: Check for isArea property for logic
                        if (MATERIALS[mat].isArea) {
                            setCalc(c => ({...c, mode: 'ft-in'}));
                        } else {
                            setCalc(c => ({...c, mode: 'units'}));
                        }
                    }} 
                />
                <Input label="Hours" type="number" step="0.5" value={entry.hours} onChange={e => setEntry({...entry, hours: e.target.value})} />
            </div>
            <div className="mb-3"><label className="text-xs font-semibold text-gray-500 uppercase">Notes</label><textarea className="w-full px-3 py-2 border rounded-md text-sm" rows="2" placeholder="Sick, rain delay, no labourer, etc." value={entry.notes} onChange={(e) => setEntry({...entry, notes: e.target.value})} /></div>
            
            {mode === 'manual' && <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg"><Input label={`Count (${MATERIALS[entry.material].unit})`} type="number" className="text-2xl font-bold" value={entry.count} onChange={e => setEntry({...entry, count: e.target.value})} required /></div>}
            {mode === 'calc' && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-3">
                 <div className="grid grid-cols-1 gap-4">
                   {/* UPDATED: Pass allowUnits prop to hide units button for Veneer */}
                   <DimensionInput allowUnits={!MATERIALS[entry.material].isArea} label="Wall Length" value={calc.w} onChange={handleCalcDimensionChange} onModeChange={handleCalcModeChange} currentMode={calc.mode} />
                   <DimensionInput allowUnits={!MATERIALS[entry.material].isArea} label="Wall Height" value={calc.h} onChange={handleCalcHeightChange} onModeChange={handleCalcModeChange} currentMode={calc.mode} />
                 </div>
                 {/* FIX: Display correct unit instead of 'Units' */}
                 {calc.mode === 'units' ? <div className="text-center font-bold text-blue-800 text-lg">{entry.count} {MATERIALS[entry.material].unit}</div> : <Button type="button" onClick={handleCalcBtn} variant="secondary" className="w-full text-sm"><Calculator size={16}/> Calculate</Button>}
                 {entry.count > 0 && calc.mode !== 'units' && <div className="text-center font-bold text-blue-800 text-lg">{entry.count} {MATERIALS[entry.material].unit}</div>}
              </div>
            )}
            {mode === 'camera' && <div className="p-6 bg-purple-50 rounded-lg border border-purple-100 flex flex-col items-center justify-center space-y-4">{!photoTaken ? <div onClick={() => setPhotoTaken(true)} className="w-32 h-32 bg-purple-200 rounded-full flex items-center justify-center cursor-pointer"><Camera size={40} className="text-purple-700" /></div> : <div className="relative"><div className="w-full h-48 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden"><ImageIcon size={48} className="text-white opacity-50" /></div><button type="button" onClick={() => setPhotoTaken(false)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><Trash2 size={14} /></button></div>}</div>}
            <Button type="submit" disabled={mode === 'camera' && !photoTaken} className="w-full py-3 text-lg">{logToEdit ? 'Update' : (isOnline ? 'Submit' : 'Queue Offline')}</Button>
          </Card>
        </form>
        {/* Recent Logs List in Log View */}
        <div className="mt-8"><h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Recent Activity</h3><div className="space-y-2">{recentContextLogs.map(log => (<div key={log.id} className="bg-white border p-3 rounded-lg text-sm flex justify-between group"><div><div className="font-bold">{log.userName} <span className="font-normal text-gray-500">| {log.materialLabel}</span></div><div className="text-xs text-gray-400">{formatDate(log.date)} • {log.jobsite}</div></div><div className="flex items-center gap-2"><div className="font-bold text-orange-600">{log.count}</div>{(profile.role !== 'mason' || profile.name === log.userName) && <button onClick={() => { setLogToEdit(log); window.scrollTo(0,0); }} className="text-blue-400 p-1"><Pencil size={16}/></button>}</div></div>))}</div></div>
      </div>
    );
  };

  const ReportsView = () => {
    const [trendMode, setTrendMode] = useState('daily'), [breakdown, setBreakdown] = useState('total'), [graphMetric, setGraphMetric] = useState('units'), [filterJob, setFilterJob] = useState('All'), [foremanView, setForemanView] = useState('personal');
    
    const { companyLogs, personalLogs } = useMemo(() => {
      let all = logs;
      if (filterJob !== 'All') all = all.filter(l => l.jobsite === filterJob);
      return { companyLogs: all, personalLogs: all.filter(l => l.userName === profile.name) };
    }, [logs, filterJob, profile]);

    const calcStats = (ds) => {
        const u = ds.reduce((a, c) => a + (c.count||0), 0), h = ds.reduce((a, c) => a + (c.hours||0), 0);
        return { u, h, uph: h ? (u/h).toFixed(1) : 0 };
    };

    const stats = useMemo(() => {
        const now = new Date(), weekAgo = new Date(), eightWeeksAgo = new Date();
        weekAgo.setDate(now.getDate() - 7); eightWeeksAgo.setDate(now.getDate() - 56);
        
        const getBuckets = (src) => ({
            today: calcStats(src.filter(l => l.date.toDateString() === now.toDateString())),
            week: calcStats(src.filter(l => l.date >= weekAgo)),
            eightWeeks: calcStats(src.filter(l => l.date >= eightWeeksAgo))
        });
        return { comp: getBuckets(companyLogs), pers: getBuckets(personalLogs) };
    }, [companyLogs, personalLogs]);

    const trendData = useMemo(() => {
        const src = (profile.role === 'mason' || (profile.role === 'foreman' && foremanView === 'personal')) ? personalLogs : companyLogs;
        const now = new Date(), cutoff = new Date();
        cutoff.setDate(now.getDate() - (trendMode === 'daily' ? 7 : 56));
        const filtered = src.filter(l => l.date >= cutoff);
        
        const points = {};
        if (trendMode === 'daily') {
            for (let i=6; i>=0; i--) { const d=new Date(); d.setDate(now.getDate()-i); points[formatISODate(d)] = { label: formatGraphDate(d, false), raw: d, _c:{}, _h:{} }; }
        } else {
            for (let i=7; i>=0; i--) { const d=new Date(); d.setDate(now.getDate()-(i*7)); const start=new Date(d); start.setDate(d.getDate()-d.getDay()); points[formatISODate(start)] = { label: formatGraphDate(start, true), raw: start, _c:{}, _h:{} }; }
        }

        filtered.forEach(l => {
            let key = trendMode === 'daily' ? formatISODate(l.date) : formatISODate(new Date(l.date.setDate(l.date.getDate()-l.date.getDay())));
            if (points[key]) {
                let s = breakdown === 'total' ? 'Total' : (breakdown === 'jobsite' ? l.jobsite : l.userName);
                if (!points[key]._c[s]) { points[key]._c[s]=0; points[key]._h[s]=0; }
                points[key]._c[s] += l.count; points[key]._h[s] += l.hours;
            }
        });

        const keys = new Set();
        const final = Object.values(points).sort((a,b) => a.raw - b.raw).map(p => {
            const res = { label: p.label };
            Object.keys(p._c).forEach(k => {
                keys.add(k);
                res[k] = graphMetric === 'units' ? p._c[k] : (p._h[k] ? parseFloat((p._c[k]/p._h[k]).toFixed(1)) : 0);
            });
            return res;
        });
        return { data: final, keys: Array.from(keys) };
    }, [companyLogs, personalLogs, trendMode, breakdown, graphMetric, foremanView, profile]);

    const StatBlock = ({ title, d }) => (
        <div className="bg-white border rounded-xl p-3 mb-2 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Clock size={14}/> {title}</div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-50 p-2 rounded"><div className="text-[10px] font-bold text-blue-600">UNITS</div><div className="font-bold text-blue-900">{d.u}</div></div>
                <div className="bg-green-50 p-2 rounded"><div className="text-[10px] font-bold text-green-600">HOURS</div><div className="font-bold text-green-900">{d.h}</div></div>
                <div className="bg-orange-50 p-2 rounded"><div className="text-[10px] font-bold text-orange-600">UPH</div><div className="font-bold text-orange-900">{d.uph}</div></div>
            </div>
        </div>
    );

    const activeStats = (profile.role === 'mason' || (profile.role === 'foreman' && foremanView === 'personal')) ? stats.pers : stats.comp;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Reports</h2><select className="border rounded px-2 py-1 text-sm" value={filterJob} onChange={e => setFilterJob(e.target.value)}><option value="All">All Jobs</option>{jobList.map(j => <option key={j.id} value={j.name}>{j.name}</option>)}</select></div>
            
            {profile.role === 'foreman' && <div className="flex justify-center"><div className="bg-gray-200 p-1 rounded-lg flex"><button onClick={() => setForemanView('personal')} className={`px-4 py-1 text-sm rounded ${foremanView==='personal'?'bg-white shadow font-bold':''}`}>My Stats</button><button onClick={() => setForemanView('company')} className={`px-4 py-1 text-sm rounded ${foremanView==='company'?'bg-white shadow font-bold':''}`}>Crew</button></div></div>}

            <div>
                <StatBlock title="Today" d={activeStats.today} />
                <StatBlock title="Last 7 Days" d={activeStats.week} />
                <StatBlock title="Last 8 Weeks" d={activeStats.eightWeeks} />
            </div>

            <Card>
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex justify-between"><div className="font-bold text-gray-700 text-sm flex gap-2"><TrendingUp size={16}/> Trend</div><div className="bg-gray-100 rounded p-1 flex"><button onClick={()=>setGraphMetric('units')} className={`px-2 text-xs rounded ${graphMetric==='units'?'bg-white shadow font-bold':''}`}>Units</button><button onClick={()=>setGraphMetric('uph')} className={`px-2 text-xs rounded ${graphMetric==='uph'?'bg-white shadow font-bold':''}`}>UPH</button></div></div>
                    <div className="flex justify-between"><div className="bg-gray-100 rounded p-1 flex"><button onClick={()=>setTrendMode('daily')} className={`px-2 text-xs rounded ${trendMode==='daily'?'bg-white shadow font-bold':''}`}>Daily</button><button onClick={()=>setTrendMode('quarterly')} className={`px-2 text-xs rounded ${trendMode==='quarterly'?'bg-white shadow font-bold':''}`}>Weekly</button></div>
                    {profile.role !== 'mason' && <div className="flex gap-1"><button onClick={()=>setBreakdown('total')} className={`border px-2 text-xs rounded ${breakdown==='total'?'bg-blue-50':''}`}>Total</button><button onClick={()=>setBreakdown('mason')} className={`border px-2 text-xs rounded ${breakdown==='mason'?'bg-blue-50':''}`}>User</button></div>}</div>
                </div>
                <TrendChart data={trendData.data} keys={trendData.keys} />
            </Card>
        </div>
    );
  };

  const EditMotdView = () => {
      const [msg, setMsg] = useState(motd);
      return <Card><Input value={msg} onChange={e=>setMsg(e.target.value)} label="Message"/><Button onClick={async()=>{await setDoc(doc(db,'artifacts',appId,'public','data','app_settings','global'),{message:msg},{merge:true}); setView('dashboard');}}>Save</Button></Card>;
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-600" size={40} /></div>;

  if (!user || !profile.name) {
    const sorted = [...crewList].sort((a,b) => (a.role==='manager'?-1:b.role==='manager'?1:a.role==='foreman'?-1:b.role==='foreman'?1:a.name.localeCompare(b.name)));
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><Card className="w-full max-w-md text-center space-y-6"><BrickWall className="w-12 h-12 text-orange-600 mx-auto"/><h1 className="text-2xl font-bold">MasonTrack Pro</h1>
      {crewList.length===0 ? <div className="text-gray-400">Loading...</div> : 
      <form onSubmit={handleLogin} className="text-left space-y-4"><Select label="Select Name" options={[{label:'Select...', value:''}, ...sorted.map(c=>({label:c.name, value:c.name}))]} value={loginName} onChange={e=>{setLoginName(e.target.value); setLoginError('');}} />
      {loginName && <div className="animate-fade-in"><Input label="PIN" type="password" inputMode="numeric" pattern="[0-9]*" placeholder="****" maxLength={4} value={loginPin} onChange={handlePinEntry} />{loginError && <p className="text-red-600 text-xs">{loginError}</p>}</div>}
      <Button type="submit" className="w-full" disabled={!loginName || loginPin.length < 4}>Login</Button></form>}
      </Card></div>
    );
  }

  const greeting = (profile.name.includes('Mason') || profile.name.includes('Foreman') || profile.name.includes('Manager')) ? profile.name : profile.name.split(' ')[0];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <div className={`w-full px-4 py-1 text-xs flex justify-center gap-2 ${isOnline?'bg-emerald-600 text-white':'bg-slate-700 text-white'}`}>{isOnline?<><Wifi size={12}/> Online</>:<><WifiOff size={12}/> Offline</>}</div>
      <header className="bg-white border-b p-3 flex justify-between items-center shadow-sm"><div className="flex items-center gap-2"><BrickWall className="text-orange-600"/><div className="font-bold text-lg">MasonTrack Pro</div></div><Button variant="ghost" onClick={handleLogout} className="text-xs">Log Out</Button></header>
      <main className="max-w-4xl mx-auto p-4">
        {view === 'dashboard' && <div className="space-y-6 animate-fade-in"><div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex justify-between"><h2 className="text-2xl font-bold">Hello, {greeting}</h2><button onClick={()=>setView('change_pin')} className="bg-white/20 px-2 py-1 rounded text-xs flex gap-1 items-center"><KeyRound size={12}/> PIN</button></div>
            <div className="flex items-center gap-2 opacity-90 mb-6 text-sm"><MessageSquare size={14}/> {motd} {profile.role==='manager'&&<button onClick={()=>setView('edit_motd')}><Pencil size={12}/></button>}</div>
            <div className="flex flex-wrap gap-3">
                <button onClick={()=>setView('log')} className="bg-white text-orange-600 px-5 py-2 rounded-lg font-bold shadow flex gap-2 items-center"><Plus size={18}/> Log Work</button>
                <button onClick={()=>setView('reports')} className="bg-orange-700 border border-orange-400 text-white px-5 py-2 rounded-lg flex gap-2 items-center"><BarChart3 size={18}/> Stats</button>
                {profile.role==='manager' && <><button onClick={()=>setView('manage_crew')} className="bg-slate-800 border border-slate-600 text-white px-5 py-2 rounded-lg flex gap-2 items-center"><Users size={18}/> Crew</button><button onClick={()=>setView('manage_jobs')} className="bg-slate-800 border border-slate-600 text-white px-5 py-2 rounded-lg flex gap-2 items-center"><MapPin size={18}/> Jobs</button></>}
            </div></div></div>}
        {view === 'log' && <LogEntryView />}
        {view === 'reports' && <ReportsView />}
        {view === 'manage_crew' && <ManageDataView type="crew" />}
        {view === 'manage_jobs' && <ManageDataView type="jobs" />}
        {view === 'change_pin' && <ChangePinView />}
        {view === 'edit_motd' && <EditMotdView />}
      </main>
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-3 pb-safe"><button onClick={()=>setView('dashboard')} className={`flex flex-col items-center text-xs ${view==='dashboard'?'text-orange-600':'text-gray-400'}`}><LayoutDashboard size={24}/> Home</button><button onClick={()=>setView('log')} className={`flex flex-col items-center text-xs ${view==='log'?'text-orange-600':'text-gray-400'}`}><div className="bg-orange-600 rounded-full p-2 -mt-6 border-4 border-white"><Plus size={24} className="text-white"/></div>Log</button><button onClick={()=>setView('reports')} className={`flex flex-col items-center text-xs ${view==='reports'?'text-orange-600':'text-gray-400'}`}><BarChart3 size={24}/> Reports</button></nav>
    </div>
  );
}
