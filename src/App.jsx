import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy, 
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
const firebaseConfig = {
  apiKey: "AIzaSyD2abWWT2aqYQHRa-E16f_NPs_ESvRwaR0",
  authDomain: "masontrack-pro.firebaseapp.com",
  projectId: "masontrack-pro",
  storageBucket: "masontrack-pro.firebasestorage.app",
  messagingSenderId: "913814562702",
  appId: "1:913814562702:web:1fbf33e71c73ac1377a6df"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "masonry-crew-main";

// --- Constants ---
const MATERIALS = {
  BRICK: { label: 'Standard Brick', unit: 'units', perSqFt: 6.75 },
  BLOCK_8: { label: '8" Block', unit: 'units', perSqFt: 1.125 },
  BLOCK_12: { label: '12" Block', unit: 'units', perSqFt: 1.125 },
  VENEER: { label: 'Stone Veneer', unit: 'sq ft', perSqFt: 1 },
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
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const DimensionInput = ({ label, value, onChange }) => {
  const [mode, setMode] = useState('ft-in'); 
  const [ft, setFt] = useState('');
  const [inc, setInc] = useState('');

  // Reset local state only when value prop is cleared/changed externally
  useEffect(() => { 
      if (!value) { setFt(''); setInc(''); } 
  }, [value]);

  const handleUpdate = (newFt, newIn) => {
    const f = parseFloat(newFt) || 0;
    const i = parseFloat(newIn) || 0;
    
    if (mode === 'ft') onChange(f);
    else if (mode === 'in') onChange(i / 12);
    else if (mode === 'ft-in') onChange(f + (i / 12));
    
    setFt(newFt); 
    setInc(newIn);
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">{label}</label>
        <div className="flex bg-gray-100 rounded p-0.5">
          <button type="button" onClick={() => setMode('ft-in')} className={`px-2 py-0.5 text-[10px] rounded ${mode==='ft-in' ? 'bg-white shadow text-orange-600 font-bold' : 'text-gray-500'}`}>Ft & In</button>
          <button type="button" onClick={() => setMode('in')} className={`px-2 py-0.5 text-[10px] rounded ${mode==='in' ? 'bg-white shadow text-orange-600 font-bold' : 'text-gray-500'}`}>Inches</button>
          <button type="button" onClick={() => setMode('ft')} className={`px-2 py-0.5 text-[10px] rounded ${mode==='ft' ? 'bg-white shadow text-orange-600 font-bold' : 'text-gray-500'}`}>Feet</button>
        </div>
      </div>
      <div className="flex gap-2">
        {mode === 'ft' && <div className="relative w-full"><input type="number" step="0.1" placeholder="10.5" className="w-full px-3 py-2 border border-gray-300 rounded" value={ft} onChange={e => handleUpdate(e.target.value, 0)} /><span className="absolute right-3 top-2 text-gray-400 text-sm">ft</span></div>}
        {mode === 'in' && <div className="relative w-full"><input type="number" placeholder="126" className="w-full px-3 py-2 border border-gray-300 rounded" value={ft} onChange={e => handleUpdate(e.target.value, 0)} /><span className="absolute right-3 top-2 text-gray-400 text-sm">in</span></div>}
        {mode === 'ft-in' && <><div className="relative w-full"><input type="number" placeholder="10" className="w-full px-3 py-2 border border-gray-300 rounded" value={ft} onChange={e => handleUpdate(e.target.value, inc)} /><span className="absolute right-3 top-2 text-gray-400 text-sm">ft</span></div><div className="relative w-full"><input type="number" placeholder="6" className="w-full px-3 py-2 border border-gray-300 rounded" value={inc} onChange={e => handleUpdate(ft, e.target.value)} /><span className="absolute right-3 top-2 text-gray-400 text-sm">in</span></div></>}
      </div>
    </div>
  );
};

// --- Main Application ---

export default function MasonTrackPro() {
  const [user, setUser] = useState(null);
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

  // Flag to know if the initial profile check has completed
  const [isProfileChecked, setIsProfileChecked] = useState(false);
  // State to hold the saved profile from localStorage immediately
  const [savedProfile, setSavedProfile] = useState(null);


  useEffect(() => {
    const initAuth = async () => { await signInAnonymously(auth); };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (curr) => {
      if (curr) {
        setUser(curr);
        const saved = localStorage.getItem('masonProfile');
        if (saved) {
             setSavedProfile(JSON.parse(saved));
        }
        // Mark the check as complete AFTER attempting to load profile
        setIsProfileChecked(true); 
      }
    });
    return () => unsubscribe();
  }, []);

  // Effect to apply the saved profile once both Auth and ProfileCheck are complete
  useEffect(() => {
    if (isProfileChecked && savedProfile && savedProfile.name) {
        // Crucial Check: Ensure the saved user still exists in the crew list
        const exists = crewList.find(c => c.name === savedProfile.name);
        if (exists) {
           setProfile(savedProfile);
        } else {
           // User was deleted from crew list, force fresh login
           localStorage.removeItem('masonProfile');
           setSavedProfile(null);
           setProfile({ id: '', name: '', role: 'mason', pin: '' });
        }
    }
  }, [isProfileChecked, savedProfile, crewList]);


  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'global'), (snap) => {
        if (snap.exists()) setMotd(snap.data().message || "All systems go.");
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'masonry_logs'), orderBy('effectiveDate', 'desc'));
    return onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => {
        const data = d.data();
        const dateObj = data.effectiveDate ? data.effectiveDate.toDate() : (data.timestamp ? data.timestamp.toDate() : new Date());
        return { id: d.id, ...data, date: dateObj };
      });
      setLogs(fetched);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'crew_members'), orderBy('name'));
    return onSnapshot(q, async (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCrewList(list);

      if (snap.empty && navigator.onLine) {
        const batch = writeBatch(db);
        DEFAULT_CREW.forEach(p => {
            const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'crew_members'));
            batch.set(ref, { ...p, timestamp: serverTimestamp() });
        });
        await batch.commit();
      }
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'jobsites'), orderBy('name'));
    return onSnapshot(q, async (snap) => {
      if (snap.empty && navigator.onLine) {
        const batch = writeBatch(db);
        DEFAULT_JOBS.forEach(name => {
          const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'jobsites'));
          batch.set(ref, { name, active: true, timestamp: serverTimestamp() });
        });
        await batch.commit();
      } else {
        setJobList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });
  }, [user]);

  const processSyncQueue = async () => {
    setIsSyncing(true);
    const queue = [...syncQueue];
    const newQueue = [];
    for (const entry of queue) {
      try {
        const dParts = entry.dateString.split('-');
        const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2], 12, 0, 0);
        let finalCount = entry.count;
        if (entry.entryMethod === 'camera') {
            await new Promise(r => setTimeout(r, 1500));
            finalCount = Math.floor(Math.random() * (120 - 40 + 1)) + 40; 
        }
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'masonry_logs'), {
          ...entry, count: finalCount, timestamp: serverTimestamp(), effectiveDate: Timestamp.fromDate(dObj), syncedAt: serverTimestamp()
        });
      } catch (err) { newQueue.push(entry); }
    }
    setSyncQueue(newQueue);
    setIsSyncing(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginName || !loginPin || crewList.length === 0) {
        setLoginError("Please wait for data to load.");
        return;
    }

    const selectedUser = crewList.find(c => c.name === loginName);
    
    // CRITICAL: Check if user data is fully loaded and valid
    if (!selectedUser || !selectedUser.id) { 
        setLoginError("User data still loading or invalid."); 
        // Force the app to wait a moment for the Firestore snapshot to complete
        setTimeout(() => setLoginError("Try again."), 500);
        return; 
    }

    const validPin = selectedUser.pin || '1234';
    if (validPin !== loginPin) { setLoginError("Incorrect PIN."); return; }

    const userProfile = { id: selectedUser.id, name: selectedUser.name, role: selectedUser.role, pin: validPin };
    localStorage.setItem('masonProfile', JSON.stringify(userProfile));
    setProfile(userProfile);
    setSavedProfile(userProfile); // Update savedProfile to trigger auto-render
    setLoginPin(''); setLoginError(''); setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('masonProfile');
    setProfile({ id: '', name: '', role: 'mason', pin: '' });
    setSavedProfile(null); 
    setLoginName(''); setLoginPin(''); setView('login');
    setIsProfileChecked(true); 
  };

  // EXPORT FUNCTION
  const exportData = () => {
    const logsToExport = logs;
    if (logsToExport.length === 0) { alert("No logs to export."); return; }
    const headers = ["Date", "Mason", "Role", "Jobsite", "Material", "Count", "Unit", "Hours", "UPH", "Notes", "Entry Method"];
    const rows = logsToExport.map(log => {
        const dateStr = log.date.toISOString().split('T')[0];
        const uph = log.hours > 0 ? (log.count / log.hours).toFixed(1) : 0;
        const safeNotes = log.notes ? `"${log.notes.replace(/"/g, '""')}"` : ""; 
        return [
            dateStr, log.userName, log.userRole, log.jobsite, log.materialLabel,
            log.count, log.unit, log.hours, uph, safeNotes, log.entryMethod
        ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `MasonTrack_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // --- Views ---

  const ChangePinView = () => {
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [msg, setMsg] = useState('');

    const updatePin = async (e) => {
        e.preventDefault();
        const currentUser = crewList.find(c => c.id === profile.id);
        const currentPin = currentUser?.pin || '1234';

        if (currentPin !== oldPin) { setMsg("Old PIN is incorrect."); return; }
        if (newPin.length < 4) { setMsg("New PIN must be at least 4 digits."); return; }
        
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crew_members', profile.id), { pin: newPin });
        setMsg("PIN updated successfully!");
        // Update local storage and profile state immediately
        setProfile(p => ({...p, pin: newPin})); 
        localStorage.setItem('masonProfile', JSON.stringify({...profile, pin: newPin}));
        setTimeout(() => setView('dashboard'), 1500);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Change PIN</h2>
                <Button variant="ghost" onClick={() => setView('dashboard')}>Back</Button>
            </div>
            <Card>
                <form onSubmit={updatePin} className="space-y-4">
                    <Input label="Current PIN" type="password" value={oldPin} onChange={e => setOldPin(e.target.value)} required />
                    <Input label="New PIN" type="password" value={newPin} onChange={e => setNewPin(e.target.value)} required />
                    {msg && <div className={`text-sm ${msg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{msg}</div>}
                    <Button type="submit" className="w-full">Update PIN</Button>
                </form>
            </Card>
        </div>
    );
  };

  const ManageDataView = ({ type }) => {
    const [newItem, setNewItem] = useState('');
    const [newRole, setNewRole] = useState('mason');
    const [pinToSet, setPinToSet] = useState(''); 
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    const isCrew = type === 'crew';
    const collectionName = isCrew ? 'crew_members' : 'jobsites';
    const list = isCrew ? crewList : jobList;

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!newItem.trim()) return;
      setSubmitting(true);
      try {
        if (editingId) {
            const updateData = { name: newItem.trim() };
            if (isCrew) {
                updateData.role = newRole;
                if (pinToSet.trim().length >= 4) updateData.pin = pinToSet.trim();
            }
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, editingId), updateData);
            setEditingId(null);
        } else {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', collectionName), { 
                name: newItem.trim(), 
                ...(isCrew ? { role: newRole, pin: pinToSet.trim() || '1234' } : { active: true }), 
                timestamp: serverTimestamp() 
            });
        }
        setNewItem('');
        setPinToSet('');
        if (isCrew && !editingId) setNewRole('mason'); 
      } catch(e) { console.error(e); alert("Error saving item"); }
      setSubmitting(false);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setNewItem(item.name);
        if (isCrew) {
            setNewRole(item.role);
            setPinToSet(''); 
        }
    };

    const hardResetCrew = async () => {
        if (!confirm("WARNING: This will delete ALL current crew members and reset to the default list. This cannot be undone.")) return;
        setSubmitting(true);
        try {
            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'crew_members'));
            const snapshot = await getDocs(q); 
            const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crew_members', d.id)));
            await Promise.all(deletePromises);

            const batch = writeBatch(db);
            DEFAULT_CREW.forEach(p => {
                const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'crew_members'));
                batch.set(ref, { ...p, timestamp: serverTimestamp() });
            });
            await batch.commit();
            alert("Crew list has been reset to defaults.");
        } catch (err) {
            console.error(err);
            alert("Failed to reset crew.");
        }
        setSubmitting(false);
    };

    const handleCancel = () => { 
        setEditingId(null); 
        setNewItem(''); 
        setNewRole('mason'); 
        setPinToSet(''); 
    };
    const remove = async (id) => { if (confirm('Delete this item?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id)); };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Manage {isCrew ? 'Crew' : 'Jobs'}</h2>
          <Button variant="ghost" onClick={() => setView('dashboard')}>Back</Button>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
            <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-500 uppercase">{editingId ? 'Edit Item' : 'Add New'}</span>
                {editingId && <button type="button" onClick={handleCancel} className="text-xs text-red-500 hover:underline">Cancel Edit</button>}
            </div>
            <Input placeholder={`Name`} value={newItem} onChange={(e) => setNewItem(e.target.value)} className="mb-0"/>
            {isCrew && (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <select className="w-1/2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm" value={newRole} onChange={e => setNewRole(e.target.value)}>
                            <option value="mason">Mason</option>
                            <option value="foreman">Foreman</option>
                            <option value="manager">Manager</option>
                        </select>
                        <input 
                            type="text" 
                            placeholder={editingId ? "Reset PIN (Optional)" : "PIN (Default 1234)"}
                            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                            value={pinToSet}
                            onChange={(e) => setPinToSet(e.target.value)}
                        />
                    </div>
                </div>
            )}
            <Button type="submit" disabled={submitting || !newItem.trim()}>
                {editingId ? <Save size={18} /> : <Plus size={18} />} {editingId ? 'Update' : 'Add'}
            </Button>
          </form>
          <div className="space-y-2">
            {list.map((item) => (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${editingId === item.id ? 'bg-orange-50 border-orange-300 ring-1 ring-orange-300' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-3">
                   <div className="bg-white p-2 rounded-full text-gray-500 border border-gray-200">
                     {isCrew ? (item.role === 'manager' ? <Briefcase size={16}/> : item.role === 'foreman' ? <HardHat size={16}/> : <Users size={16} />) : <MapPin size={16} />}
                   </div>
                   <div>
                       <div className="font-medium text-gray-800">{item.name}</div>
                       {isCrew && <div className="text-xs text-gray-400 capitalize">{item.role}</div>}
                   </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-blue-500 p-2"><Pencil size={18}/></button>
                    <button onClick={() => remove(item.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
          {isCrew && (
              <div className="mt-8 pt-4 border-t border-red-100">
                  <h3 className="text-xs font-bold text-red-600 uppercase mb-2">Danger Zone</h3>
                  <button onClick={hardResetCrew} disabled={submitting} className="w-full py-3 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 flex items-center justify-center gap-2">
                      <AlertTriangle size={16} /> Reset to Default Crew
                  </button>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                      <button onClick={exportData} className="w-full py-3 border border-green-200 text-green-700 bg-green-50 rounded-lg text-sm hover:bg-green-100 flex items-center justify-center gap-2">
                          <Download size={16} /> Download Backup (CSV)
                      </button>
                  </div>
              </div>
          )}
        </Card>
      </div>
    );
  };

  const LogEntryView = () => {
    const [mode, setMode] = useState('manual');
    const [entry, setEntry] = useState({
      jobsite: jobList[0]?.name || '', material: 'BLOCK_8', hours: 8, count: '', notes: '', dateStr: formatISODate(new Date())
    });
    const [calc, setCalc] = useState({ w: 0, h: 0 }); 
    const [photoTaken, setPhotoTaken] = useState(false);
    const [targetWorker, setTargetWorker] = useState(profile.name);
    const [expandedNote, setExpandedNote] = useState(null);

    const recentContextLogs = useMemo(() => {
        let filtered = logs;
        if (profile.role === 'mason') filtered = logs.filter(l => l.userName === profile.name);
        return filtered.slice(0, 20); 
    }, [logs, profile]);

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
      if (mode === 'manual' && (!entry.count || entry.count <= 0)) return;
      if (mode === 'camera' && !photoTaken) return;

      const dParts = entry.dateStr.split('-');
      const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2], 12, 0, 0);
      const entryData = {
        userId: user.uid, userName: targetWorker, loggedBy: profile.name, userRole: profile.role,
        jobsite: entry.jobsite, material: entry.material, materialLabel: MATERIALS[entry.material].label, unit: MATERIALS[entry.material].unit,
        hours: parseFloat(entry.hours), count: mode === 'manual' || mode === 'calc' ? parseInt(entry.count) : 0,
        entryMethod: mode, notes: entry.notes, status: mode === 'camera' ? 'pending_ai' : 'completed', dateString: entry.dateStr
      };

      if (!isOnline && !logToEdit) { setSyncQueue([...syncQueue, entryData]); alert('Offline: Queued.'); } 
      else {
        const finalData = { ...entryData, effectiveDate: Timestamp.fromDate(dObj), timestamp: serverTimestamp() };
        try {
          if (logToEdit) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masonry_logs', logToEdit.id), finalData); alert('Updated!'); }
          else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'masonry_logs'), finalData); alert('Logged!'); }
        } catch(e) { if(!logToEdit) setSyncQueue([...syncQueue, entryData]); }
      }
      setLogToEdit(null); setView('dashboard');
    };

    const handleCalc = () => {
      const mat = MATERIALS[entry.material];
      const sqFt = calc.w * calc.h;
      setEntry({ ...entry, count: Math.ceil(sqFt * mat.perSqFt) });
    };

    const getReadableDate = () => {
      if (!entry.dateStr) return "Select a date";
      const dParts = entry.dateStr.split('-');
      return formatDate(new Date(dParts[0], dParts[1] - 1, dParts[2]));
    };

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-gray-800">{logToEdit ? 'Edit Entry' : 'New Entry'}</h2><Button variant="ghost" onClick={() => { setLogToEdit(null); setView('dashboard'); }}>Cancel</Button></div>
        <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg">
          {['manual', 'calc', 'camera'].map(m => <button key={m} onClick={() => !logToEdit && setMode(m)} className={`py-2 text-sm font-medium rounded-md capitalize ${mode === m ? 'bg-white shadow text-orange-600' : 'text-gray-500'} ${logToEdit ? 'opacity-50' : ''}`}>{m === 'camera' ? 'AI Camera' : m}</button>)}
        </div>
        <form onSubmit={handleSubmit}>
          <Card className="space-y-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-1"><div className="flex items-center gap-2 text-gray-600 font-semibold text-xs uppercase"><CalendarIcon size={12} /> Date</div><span className="text-xs font-bold text-orange-600">{getReadableDate()}</span></div>
                <input type="date" className="w-full bg-white border border-gray-300 rounded px-3 py-2 font-medium" value={entry.dateStr} onChange={(e) => setEntry({...entry, dateStr: e.target.value})} required />
            </div>
            {(profile.role !== 'mason' || logToEdit) && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-indigo-800 font-medium text-sm"><UserCheck size={16} /><span>Worker Name:</span></div>
                 <select className="w-full px-3 py-2 border border-indigo-200 rounded bg-white" value={targetWorker} onChange={(e) => setTargetWorker(e.target.value)}>{crewList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
              </div>
            )}
            <Select label="Jobsite" options={jobList.length > 0 ? jobList.map(j => ({ value: j.name, label: j.name })) : [{value: '', label: 'Loading Jobs...'}]} value={entry.jobsite} onChange={e => setEntry({...entry, jobsite: e.target.value})} />
            <div className="grid grid-cols-2 gap-4"><Select label="Material" options={Object.keys(MATERIALS).map(k => ({ value: k, label: MATERIALS[k].label }))} value={entry.material} onChange={e => setEntry({...entry, material: e.target.value})} /><Input label="Hours" type="number" step="0.5" value={entry.hours} onChange={e => setEntry({...entry, hours: e.target.value})} /></div>
            
            <div className="mb-3">
                <label className="text-xs font-semibold text-gray-500 uppercase">Notes (Optional)</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm" rows="2" placeholder="Sick, rain delay, etc." value={entry.notes} onChange={(e) => setEntry({...entry, notes: e.target.value})} />
            </div>

            {mode === 'manual' && <div className="p-4 bg-orange-50 rounded-lg border border-orange-100"><Input label={`Count (${MATERIALS[entry.material].unit})`} type="number" className="text-2xl font-bold" value={entry.count} onChange={e => setEntry({...entry, count: e.target.value})} required /></div>}
            {mode === 'calc' && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                <div className="grid grid-cols-1 gap-4">
                   <DimensionInput label="Wall Length" value={calc.w} onChange={(val) => setCalc({...calc, w: val})} />
                   <DimensionInput label="Wall Height" value={calc.h} onChange={(val) => setCalc({...calc, h: val})} />
                </div>
                <Button type="button" onClick={handleCalc} variant="secondary" className="w-full text-sm"><Calculator size={16} /> Calculate</Button>
                {entry.count && <div className="text-center font-bold text-blue-800 text-lg">{entry.count} {MATERIALS[entry.material].unit}</div>}
              </div>
            )}
            {mode === 'camera' && <div className="p-6 bg-purple-50 rounded-lg border border-purple-100 flex flex-col items-center justify-center space-y-4">{!photoTaken ? <div onClick={() => setPhotoTaken(true)} className="w-32 h-32 bg-purple-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-300"><Camera size={40} className="text-purple-700" /></div> : <div className="relative"><div className="w-full h-48 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden"><ImageIcon size={48} className="text-white opacity-50" /></div><button type="button" onClick={() => setPhotoTaken(false)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><Trash2 size={14} /></button></div>}</div>}
            <Button type="submit" disabled={mode === 'camera' && !photoTaken} className="w-full py-3 text-lg">{logToEdit ? 'Update Entry' : (isOnline ? (mode === 'camera' ? 'Upload' : 'Submit') : 'Queue Offline')}</Button>
          </Card>
        </form>

        <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Recent Activity</h3>
            <Card className="overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                {recentContextLogs.map(log => (
                <div key={log.id} className="border-b border-gray-50 last:border-0">
                    <div className="p-3 text-sm flex justify-between group">
                        <div><div className="font-bold">{log.userName} <span className="font-normal text-gray-500">| {log.materialLabel}</span></div><div className="text-xs text-gray-400">{formatDate(log.date)} • {log.jobsite}</div></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right font-bold text-orange-600">{log.count}</div>
                            {log.notes && <button onClick={() => setExpandedNote(expandedNote === log.id ? null : log.id)} className={`p-1.5 rounded transition-colors ${expandedNote === log.id ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}><MessageSquare size={16}/></button>}
                            {(profile.role !== 'mason' || profile.name === log.userName) && (<div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setLogToEdit(log); window.scrollTo(0,0); }} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded"><Pencil size={16}/></button><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masonry_logs', log.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 size={16}/></button></div>)}
                        </div>
                    </div>
                    {expandedNote === log.id && <div className="px-3 pb-3 ml-3 text-xs text-gray-600 italic border-l-2 border-orange-200 mb-2">{log.notes}</div>}
                </div>
                ))}
                </div>
            </Card>
        </div>
      </div>
    );
  };

  const ReportsView = () => {
    const [trendMode, setTrendMode] = useState('daily'); 
    const [breakdown, setBreakdown] = useState('total'); 
    const [graphMetric, setGraphMetric] = useState('units'); 
    const [filterJob, setFilterJob] = useState('All');
    const [expandedNote, setExpandedNote] = useState(null);
    const [foremanView, setForemanView] = useState('personal'); 

    const { companyLogs, personalLogs } = useMemo(() => {
      let all = logs;
      if (filterJob !== 'All') all = all.filter(l => l.jobsite === filterJob);
      const personal = all.filter(l => l.userName === profile.name);
      return { companyLogs: all, personalLogs: personal };
    }, [logs, filterJob, profile]);

    const calcStats = (dataset) => {
        const u = dataset.reduce((acc, curr) => acc + (curr.count || 0), 0);
        const h = dataset.reduce((acc, curr) => acc + (curr.hours || 0), 0);
        return { u, h, uph: h ? (u/h).toFixed(1) : 0 };
    };

    const stats = useMemo(() => {
        const now = new Date();
        
        const dailyLogsC = companyLogs.filter(l => l.date.getDate() === now.getDate() && l.date.getMonth() === now.getMonth() && l.date.getFullYear() === now.getFullYear());
        const dailyLogsP = personalLogs.filter(l => l.date.getDate() === now.getDate() && l.date.getMonth() === now.getMonth() && l.date.getFullYear() === now.getFullYear());

        const weekCutoff = new Date(); 
        weekCutoff.setDate(now.getDate() - 7);
        const weekLogsC = companyLogs.filter(l => l.date >= weekCutoff);
        const weekLogsP = personalLogs.filter(l => l.date >= weekCutoff);

        const eightWeekCutoff = new Date();
        eightWeekCutoff.setDate(now.getDate() - 56);
        const eightWeekLogsC = companyLogs.filter(l => l.date >= eightWeekCutoff);
        const eightWeekLogsP = personalLogs.filter(l => l.date >= eightWeekCutoff);

        return {
            compDaily: calcStats(dailyLogsC),
            compWeek: calcStats(weekLogsC),
            comp8W: calcStats(eightWeekLogsC),
            persDaily: calcStats(dailyLogsP),
            persWeek: calcStats(weekLogsP),
            pers8W: calcStats(eightWeekLogsP),
            compAll: calcStats(companyLogs) // Keep for benchmarking
        };
    }, [companyLogs, personalLogs]);

    const leaderboard = useMemo(() => {
        const byUser = {};
        companyLogs.forEach(l => {
            if (!byUser[l.userName]) byUser[l.userName] = { name: l.userName, units: 0, hours: 0 };
            byUser[l.userName].units += l.count; byUser[l.userName].hours += l.hours;
        });
        return Object.values(byUser)
            .map(u => ({ ...u, percent: (stats.comp8W.u > 0 ? (u.units / stats.comp8W.u) * 100 : 0) }))
            .sort((a, b) => b.units - a.units);
    }, [companyLogs, stats]);

    const generateTrendData = (sourceLogs) => {
      const now = new Date();
      const dataPoints = {};
      const seriesKeys = new Set();
      
      let daysToLookBack = trendMode === 'daily' ? 7 : 56; 
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - daysToLookBack);
      
      const trendLogs = sourceLogs.filter(l => l.date >= cutoff);

      if (trendMode === 'daily') {
        for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setDate(now.getDate() - i);
          const key = formatISODate(d); 
          dataPoints[key] = { label: formatGraphDate(d, false), rawDate: d, _count: {}, _hours: {} };
        }
      } else {
        for (let i = 7; i >= 0; i--) {
          const d = new Date(); d.setDate(now.getDate() - (i * 7));
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          const key = formatISODate(weekStart);
          dataPoints[key] = { label: formatGraphDate(weekStart, true), rawDate: weekStart, _count: {}, _hours: {} };
        }
      }

      trendLogs.forEach(l => {
        let key = '';
        if (trendMode === 'daily') {
            key = formatISODate(l.date);
        } else {
            const weekStart = new Date(l.date);
            weekStart.setDate(l.date.getDate() - l.date.getDay());
            key = formatISODate(weekStart);
        }

        if (dataPoints[key]) {
          let series = 'Total';
          if (breakdown === 'jobsite') series = l.jobsite;
          if (breakdown === 'mason' && profile.role === 'manager') series = l.userName;
          
          if (!dataPoints[key]._count[series]) dataPoints[key]._count[series] = 0;
          if (!dataPoints[key]._hours[series]) dataPoints[key]._hours[series] = 0;
          
          dataPoints[key]._count[series] += l.count;
          dataPoints[key]._hours[series] += l.hours;
          
          seriesKeys.add(series);
        }
      });

      if (breakdown === 'total') seriesKeys.add('Total');

      const finalData = Object.values(dataPoints).sort((a,b) => a.rawDate - b.rawDate).map(pt => {
          const result = { label: pt.label };
          seriesKeys.forEach(k => {
              const c = pt._count[k] || 0;
              const h = pt._hours[k] || 0;
              result[k] = graphMetric === 'units' ? c : (h > 0 ? parseFloat((c/h).toFixed(1)) : 0);
          });
          return result;
      });

      return { data: finalData, keys: Array.from(seriesKeys) };
    };

    const trendData = useMemo(() => {
        let source = companyLogs;
        if (profile.role === 'mason') source = personalLogs;
        if (profile.role === 'foreman' && foremanView === 'personal') source = personalLogs;
        
        return generateTrendData(source);
    }, [companyLogs, personalLogs, trendMode, breakdown, profile, foremanView, graphMetric]);

    const StatRow = ({ title, data, icon: Icon }) => (
        <div className="bg-white rounded-xl border border-gray-100 p-3 mb-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500 uppercase">
                {Icon && <Icon size={14} />} {title}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-50 rounded p-2">
                    <div className="text-[10px] text-blue-600 font-bold">UNITS</div>
                    <div className="font-bold text-blue-900">{data.u}</div>
                </div>
                <div className="bg-green-50 rounded p-2">
                    <div className="text-[10px] text-green-600 font-bold">HOURS</div>
                    <div className="font-bold text-green-900">{data.h}</div>
                </div>
                <div className="bg-orange-50 rounded p-2">
                    <div className="text-[10px] text-orange-600 font-bold">UPH</div>
                    <div className="font-bold text-orange-900">{data.uph}</div>
                </div>
            </div>
        </div>
    );

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-gray-800">Reports</h2><select className="bg-white border rounded px-2 py-1 text-sm" value={filterJob} onChange={(e) => setFilterJob(e.target.value)}><option value="All">All Jobs</option>{jobList.map(j => <option key={j.id} value={j.name}>{j.name}</option>)}</select></div>
        
        {profile.role === 'foreman' && (
            <div className="flex justify-center mb-4">
                <div className="flex bg-gray-200 p-1 rounded-lg shadow-inner">
                    <button onClick={() => setForemanView('personal')} className={`px-4 py-1.5 text-sm rounded-md transition-all ${foremanView==='personal' ? 'bg-white shadow text-blue-700 font-bold' : 'text-gray-500'}`}>My Stats</button>
                    <button onClick={() => setForemanView('company')} className={`px-4 py-1.5 text-sm rounded-md transition-all ${foremanView==='company' ? 'bg-white shadow text-blue-700 font-bold' : 'text-gray-500'}`}>Crew Overview</button>
                </div>
            </div>
        )}

        <div>
            <div className="text-sm font-bold text-gray-800 mb-2">
                {profile.role === 'mason' ? 'My Performance' : 
                 profile.role === 'manager' ? 'Company Overview' : 
                 (foremanView === 'personal' ? 'My Performance' : 'Company Overview')}
            </div>
            <StatRow title="Today" data={(profile.role === 'mason' || (profile.role === 'foreman' && foremanView === 'personal')) ? stats.persDaily : stats.compDaily} icon={CalendarIcon} />
            <StatRow title="Last 7 Days" data={(profile.role === 'mason' || (profile.role === 'foreman' && foremanView === 'personal')) ? stats.persWeek : stats.compWeek} icon={Clock} />
            <StatRow title="Last 8 Weeks" data={(profile.role === 'mason' || (profile.role === 'foreman' && foremanView === 'personal')) ? stats.pers8W : stats.comp8W} icon={CalendarDays} />
        </div>

        {profile.role === 'mason' && (
            <Card className="bg-slate-800 text-white border-none">
                <div className="text-xs font-bold text-gray-400 uppercase mb-3">Crew Comparison (UPH)</div>
                <div className="flex justify-between items-center">
                    <div className="text-center w-1/2"><div className="text-2xl font-bold text-orange-400">{stats.compWeek.uph}</div><div className="text-[10px] text-gray-400 uppercase mt-1">Weekly Avg</div></div>
                    <div className="h-10 w-px bg-gray-600"></div>
                    <div className="text-center w-1/2"><div className="text-2xl font-bold text-white">{stats.compAll.uph}</div><div className="text-[10px] text-gray-400 uppercase mt-1">All-Time Avg</div></div>
                </div>
            </Card>
        )}

        <Card>
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-2 font-bold text-gray-700 text-sm"><TrendingUp size={16}/> Trend</div>
            <div className="flex justify-between items-center">
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setTrendMode('daily')} className={`px-3 py-1 text-xs rounded-md ${trendMode === 'daily' ? 'bg-white shadow text-orange-600 font-bold' : 'text-gray-500'}`}>Daily</button>
                    <button onClick={() => setTrendMode('quarterly')} className={`px-3 py-1 text-xs rounded-md ${trendMode === 'quarterly' ? 'bg-white shadow text-orange-600 font-bold' : 'text-gray-500'}`}>Weekly</button>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setGraphMetric('units')} className={`px-3 py-1 text-xs rounded-md ${graphMetric === 'units' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}>Units</button>
                    <button onClick={() => setGraphMetric('uph')} className={`px-3 py-1 text-xs rounded-md ${graphMetric === 'uph' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}>UPH</button>
                </div>
            </div>
            {((profile.role === 'manager') || (profile.role === 'foreman' && foremanView === 'company')) && (
                <div className="flex gap-2 overflow-x-auto pb-1 border-t border-gray-100 pt-2">
                <span className="text-xs font-semibold text-gray-400 py-1 uppercase">Breakdown:</span>
                <button onClick={() => setBreakdown('total')} className={`px-2 py-1 text-xs rounded border ${breakdown === 'total' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-600'}`}>Total</button>
                <button onClick={() => setBreakdown('jobsite')} className={`px-2 py-1 text-xs rounded border ${breakdown === 'jobsite' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-600'}`}>By Job</button>
                <button onClick={() => setBreakdown('mason')} className={`px-2 py-1 text-xs rounded border ${breakdown === 'mason' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-600'}`}>By Mason</button>
                </div>
            )}
          </div>
          <TrendChart data={trendData.data} keys={trendData.keys} />
        </Card>

        {(profile.role === 'manager' || (profile.role === 'foreman' && foremanView === 'company')) && (
          <Card>
             <div className="p-3 border-b border-gray-100 mb-2 font-semibold text-sm">Leaderboard (Last 8 Weeks)</div>
             <div className="space-y-3 pt-2">{leaderboard.map((m, i) => (<div key={m.name}><div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-800">#{i+1} {m.name}</span><span className="font-bold text-gray-900">{m.units}</span></div><div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden"><div className="bg-orange-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${m.percent}%` }}></div></div></div>))}</div>
          </Card>
        )}
      </div>
    );
  };

  if (!user || (!savedProfile && isProfileChecked)) {
    const sortedCrew = [...crewList].sort((a, b) => {
        if (a.role === 'manager') return 1;
        if (b.role === 'manager') return -1;
        if (a.role === 'foreman') return 1;
        if (b.role === 'foreman') return -1;
        return a.name.localeCompare(b.name);
    });

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center mb-4"><div className="bg-orange-100 p-4 rounded-full"><BrickWall className="w-10 h-10 text-orange-600" /></div></div>
          <h1 className="text-2xl font-bold text-gray-900">MasonTrack Pro</h1>
          {crewList.length === 0 ? <div className="text-gray-500 py-4">Loading...</div> : (
            <form onSubmit={handleLogin} className="text-left space-y-4 mt-6">
              <Select label="Select Your Name" options={[{label:'Select User...', value:''}, ...sortedCrew.map(c => ({ value: c.name, label: c.name }))]} value={loginName} onChange={(e) => { setLoginName(e.target.value); setLoginError(''); }} />
              {loginName && (
                <div className="animate-fade-in">
                  <Input label="Enter PIN" type="password" placeholder="****" value={loginPin} onChange={(e) => { setLoginPin(e.target.value); setLoginError(''); }} className={loginError ? 'border-red-500' : ''} />
                  {loginError && <p className="text-xs text-red-600 mt-1 font-medium">{loginError}</p>}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={!loginName || loginPin.length < 4 || !crewList.find(c => c.name === loginName)?.id}>Login</Button>
            </form>
          )}
        </Card>
      </div>
    );
  }

  const EditMotdView = () => {
    const [tempMotd, setTempMotd] = useState(motd);
    const saveMotd = async () => {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'global'), { message: tempMotd }, { merge: true });
        setView('dashboard');
    };
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-gray-800">Update Message</h2><Button variant="ghost" onClick={() => setView('dashboard')}>Cancel</Button></div>
            <Card>
                <div className="space-y-4">
                    <Input label="Message of the Day" value={tempMotd} onChange={e => setTempMotd(e.target.value)} />
                    <Button onClick={saveMotd} className="w-full">Save Message</Button>
                </div>
            </Card>
        </div>
    );
  };

  const getGreetingName = () => {
    const name = profile.name;
    // Check if the name contains a number (Mason 1, Foreman 2) or is a role name
    if (name.includes('Mason ') || name.includes('Foreman') || name.includes('Manager')) {
        return name;
    }
    // Otherwise, split by space and take the first name
    return name.split(' ')[0];
  }


  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans pb-20 md:pb-0">
      <div className={`w-full px-4 py-1 text-xs font-medium flex justify-center items-center gap-2 ${isOnline ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'}`}>
        {isOnline ? <><Wifi size={12}/> {isSyncing ? 'Syncing...' : 'Online'}</> : <><WifiOff size={12}/> Offline</>}
      </div>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-orange-600 text-white p-1.5 rounded-lg"><BrickWall size={20} /></div>
          <div className="leading-tight"><h1 className="font-bold text-gray-900 text-lg">MasonTrack Pro</h1><p className="text-xs text-gray-500 capitalize">{profile.name} • {profile.role}</p></div>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="text-xs p-2">Log Out</Button>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {view === 'dashboard' && (
           <div className="space-y-6 animate-fade-in">
             <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-6 text-white shadow-lg relative">
               <div className="flex justify-between items-start">
                   <div>
                        <h2 className="text-2xl font-bold mb-1">Hello, {getGreetingName()}</h2>
                        <div className="flex items-center gap-2 opacity-90 mb-6 text-sm">
                            <MessageSquare size={14} /> {motd}
                            {profile.role === 'manager' && <button onClick={() => setView('edit_motd')} className="bg-white/20 p-1 rounded hover:bg-white/30 transition"><Pencil size={12}/></button>}
                        </div>
                   </div>
                   <button onClick={() => setView('change_pin')} className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded flex items-center gap-1 transition"><KeyRound size={12} /> My PIN</button>
               </div>
               <div className="flex flex-wrap gap-3">
                 <button onClick={() => setView('log')} className="bg-white text-orange-600 px-5 py-2 rounded-lg font-bold shadow hover:bg-orange-50 flex gap-2 items-center"><Plus size={18} /> Log Work</button>
                 <button onClick={() => setView('reports')} className="bg-orange-700 text-white border border-orange-400 px-5 py-2 rounded-lg hover:bg-orange-800 flex gap-2 items-center"><BarChart3 size={18} /> Stats</button>
                 {profile.role === 'manager' && (
                   <>
                     <button onClick={() => setView('manage_crew')} className="bg-slate-800 text-white border border-slate-600 px-5 py-2 rounded-lg hover:bg-slate-900 flex gap-2 items-center"><Users size={18} /> Crew</button>
                     <button onClick={() => setView('manage_jobs')} className="bg-slate-800 text-white border border-slate-600 px-5 py-2 rounded-lg hover:bg-slate-900 flex gap-2 items-center"><MapPin size={18} /> Jobs</button>
                   </>
                 )}
               </div>
             </div>
           </div>
        )}
        {view === 'log' && <LogEntryView />}
        {view === 'reports' && <ReportsView />}
        {view === 'manage_crew' && <ManageDataView type="crew" />}
        {view === 'manage_jobs' && <ManageDataView type="jobs" />}
        {view === 'change_pin' && <ChangePinView />}
        {view === 'edit_motd' && <EditMotdView />}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 md:hidden flex justify-around p-3 pb-safe z-50">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center text-xs ${view === 'dashboard' ? 'text-orange-600' : 'text-gray-400'}`}><LayoutDashboard size={24} /> Home</button>
        <button onClick={() => setView('log')} className={`flex flex-col items-center text-xs ${view === 'log' ? 'text-orange-600' : 'text-gray-400'}`}><div className="bg-orange-600 rounded-full p-2 -mt-6 border-4 border-white"><Plus size={24} className="text-white" /></div>Log</button>
        <button onClick={() => setView('reports')} className={`flex flex-col items-center text-xs ${view === 'reports' ? 'text-orange-600' : 'text-gray-400'}`}><BarChart3 size={24} /> Reports</button>
      </nav>
    </div>
  );
}
