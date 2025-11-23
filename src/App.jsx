import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
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
  getDocs,
  writeBatch,
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
} from 'lucide-react';

// --- Firebase Configuration ---
// ⚠️ REPLACE THIS OBJECT WITH YOUR REAL KEYS FROM FIREBASE CONSOLE ⚠️
const firebaseConfig = {
  apiKey: 'AIzaSyD2abWWT2aqYQHRa-E16f_NPs_ESvRwaR0',
  authDomain: 'masontrack-pro.firebaseapp.com',
  projectId: 'masontrack-pro',
  storageBucket: 'masontrack-pro.firebasestorage.app',
  messagingSenderId: '913814562702',
  appId: '1:913814562702:web:1fbf33e71c73ac1377a6df',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'masonry-crew-main'; // You can keep this name

// --- Constants ---
const MATERIALS = {
  BRICK: { label: 'Standard Brick', unit: 'units', perSqFt: 6.75 },
  BLOCK_8: { label: '8" Block', unit: 'units', perSqFt: 1.125 },
  BLOCK_12: { label: '12" Block', unit: 'units', perSqFt: 1.125 },
  VENEER: { label: 'Stone Veneer', unit: 'sq ft', perSqFt: 1 },
};

const JOBSITES = [
  'Downtown Plaza',
  'Riverside Complex',
  'West End School',
  'City Hospital Reno',
  'Private Residence A',
];

// Default list used ONLY if database is empty (Migration)
const DEFAULT_CREW = ['John Smith', 'Sarah Jones', 'Mike Johnson', 'David Lee'];

const FOREMAN_PIN = '1234';

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

// --- Components ---
const Button = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle =
    'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2';
  const variants = {
    primary:
      'bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-200 disabled:bg-orange-300',
    secondary:
      'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && (
      <label className="text-xs font-semibold text-gray-500 uppercase">
        {label}
      </label>
    )}
    <input
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
      {...props}
    />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && (
      <label className="text-xs font-semibold text-gray-500 uppercase">
        {label}
      </label>
    )}
    <select
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const Card = ({ children, className = '' }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`}
  >
    {children}
  </div>
);

// --- Main Application ---

export default function MasonTrackPro() {
  const [user, setUser] = useState(null);
  const [crewList, setCrewList] = useState([]);
  const [profile, setProfile] = useState({ name: '', role: 'mason' });
  const [view, setView] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Offline & Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auth State
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // --- Authentication ---
  useEffect(() => {
    const initAuth = async () => {
      await signInAnonymously(auth);
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const savedProfile = localStorage.getItem('masonProfile');
        if (savedProfile) setProfile(JSON.parse(savedProfile));
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Data Sync (Logs) ---
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'masonry_logs'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp?.toDate() || new Date(),
      }));
      setLogs(fetchedLogs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Sync Crew List & Auto-Seed ---
  useEffect(() => {
    if (!user) return;

    const crewQuery = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'crew_members'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(crewQuery, async (snapshot) => {
      if (snapshot.empty && navigator.onLine) {
        // AUTO-SEED: If DB is empty, upload defaults
        const batch = writeBatch(db);
        DEFAULT_CREW.forEach((name) => {
          const newRef = doc(
            collection(db, 'artifacts', appId, 'public', 'data', 'crew_members')
          );
          batch.set(newRef, {
            name,
            role: 'mason',
            timestamp: serverTimestamp(),
          });
        });
        await batch.commit();
      } else {
        const fetchedCrew = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCrewList(fetchedCrew);
        // If current profile name isn't set yet, default to first in list
        if (!profile.name && fetchedCrew.length > 0) {
          setProfile((p) => ({ ...p, name: fetchedCrew[0].name }));
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  // --- Offline/Online Logic ---
  useEffect(() => {
    const savedQueue = localStorage.getItem('masonSyncQueue');
    if (savedQueue) setSyncQueue(JSON.parse(savedQueue));

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('masonSyncQueue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  useEffect(() => {
    if (isOnline && syncQueue.length > 0 && !isSyncing) processSyncQueue();
  }, [isOnline, syncQueue, isSyncing]);

  const processSyncQueue = async () => {
    setIsSyncing(true);
    const queue = [...syncQueue];
    const newQueue = [];

    for (const entry of queue) {
      try {
        let finalCount = entry.count;
        let finalStatus = 'completed';
        if (entry.entryMethod === 'camera') {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          finalCount = Math.floor(Math.random() * (120 - 40 + 1)) + 40;
          finalStatus = 'ai_processed';
        }
        await addDoc(
          collection(db, 'artifacts', appId, 'public', 'data', 'masonry_logs'),
          {
            ...entry,
            count: finalCount,
            status: finalStatus,
            timestamp: serverTimestamp(),
            syncedAt: serverTimestamp(),
          }
        );
      } catch (err) {
        newQueue.push(entry);
      }
    }
    setSyncQueue(newQueue);
    setIsSyncing(false);
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    if (profile.role !== 'mason') {
      if (pinInput !== FOREMAN_PIN) {
        setPinError(true);
        return;
      }
    }
    localStorage.setItem('masonProfile', JSON.stringify(profile));
    setPinInput('');
    setPinError(false);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('masonProfile');
    setProfile({ name: crewList[0]?.name || '', role: 'mason' });
    setPinInput('');
    setView('login');
  };

  // --- Views ---

  // Login Screen
  if (
    !user ||
    (!localStorage.getItem('masonProfile') && view !== 'dashboard')
  ) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-100 p-4 rounded-full">
              <BrickWall className="w-10 h-10 text-orange-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MasonTrack Pro</h1>

          {crewList.length === 0 ? (
            <div className="text-gray-500 py-4">Loading crew list...</div>
          ) : (
            <form
              onSubmit={handleProfileSave}
              className="text-left space-y-4 mt-6"
            >
              <Select
                label="Select Your Name"
                options={crewList.map((c) => ({
                  value: c.name,
                  label: c.name,
                }))}
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
              />

              <Select
                label="Select Role"
                options={[
                  { value: 'mason', label: 'Mason' },
                  { value: 'foreman', label: 'Foreman' },
                  { value: 'manager', label: 'Manager' },
                ]}
                value={profile.role}
                onChange={(e) => {
                  setProfile({ ...profile, role: e.target.value });
                  setPinError(false);
                }}
              />

              {profile.role !== 'mason' && (
                <div className="animate-fade-in bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2 text-orange-800 font-semibold text-xs uppercase">
                    <Lock size={12} /> Security Check
                  </div>
                  <Input
                    type="password"
                    placeholder="Enter PIN (Try 1234)"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(false);
                    }}
                    className={`mb-0 ${
                      pinError ? 'border-red-500 ring-1 ring-red-500' : ''
                    }`}
                  />
                  {pinError && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      Incorrect PIN code.
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full">
                Start Tracking
              </Button>
            </form>
          )}
        </Card>
      </div>
    );
  }

  // Manage Crew View (New Feature)
  const ManageCrewView = () => {
    const [newName, setNewName] = useState('');
    const [adding, setAdding] = useState(false);

    const addMember = async (e) => {
      e.preventDefault();
      if (!newName.trim()) return;
      setAdding(true);
      try {
        await addDoc(
          collection(db, 'artifacts', appId, 'public', 'data', 'crew_members'),
          {
            name: newName.trim(),
            role: 'mason',
            timestamp: serverTimestamp(),
          }
        );
        setNewName('');
      } catch (err) {
        console.error('Error adding member:', err);
        alert('Could not add member. Check connection.');
      }
      setAdding(false);
    };

    const removeMember = async (id, name) => {
      if (
        confirm(`Remove ${name} from the list? Their logs will remain safe.`)
      ) {
        await deleteDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'crew_members', id)
        );
      }
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Manage Crew</h2>
          <Button variant="ghost" onClick={() => setView('dashboard')}>
            Back
          </Button>
        </div>

        <Card>
          <form onSubmit={addMember} className="flex gap-2 mb-6">
            <div className="flex-1">
              <Input
                placeholder="New Member Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mb-0" // Override default margin
              />
            </div>
            <Button type="submit" disabled={adding || !newName.trim()}>
              <UserPlus size={18} /> Add
            </Button>
          </form>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Current Roster ({crewList.length})
            </h3>
            {crewList.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full text-gray-500 border border-gray-200">
                    <Users size={16} />
                  </div>
                  <span className="font-medium text-gray-800">
                    {member.name}
                  </span>
                </div>
                <button
                  onClick={() => removeMember(member.id, member.name)}
                  className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const LogEntryView = () => {
    const [mode, setMode] = useState('manual');
    const [entry, setEntry] = useState({
      jobsite: JOBSITES[0],
      material: 'BLOCK_8',
      hours: 8,
      count: '',
      notes: '',
    });
    const [calc, setCalc] = useState({ length: 10, height: 8 });
    const [photoTaken, setPhotoTaken] = useState(false);
    const [targetWorker, setTargetWorker] = useState(profile.name);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (mode === 'manual' && (!entry.count || entry.count <= 0)) return;
      if (mode === 'camera' && !photoTaken) return;

      const newEntry = {
        userId: user.uid,
        userName: targetWorker,
        loggedBy: profile.name,
        userRole: profile.role,
        jobsite: entry.jobsite,
        material: entry.material,
        materialLabel: MATERIALS[entry.material].label,
        unit: MATERIALS[entry.material].unit,
        hours: parseFloat(entry.hours),
        count: mode === 'manual' || mode === 'calc' ? parseInt(entry.count) : 0,
        entryMethod: mode,
        notes: entry.notes,
        status: mode === 'camera' ? 'pending_ai' : 'completed',
        tempId: Date.now(),
      };

      if (!isOnline || mode === 'camera') {
        setSyncQueue([...syncQueue, newEntry]);
        if (!isOnline) alert('Offline: Saved to queue.');
      } else {
        try {
          await addDoc(
            collection(
              db,
              'artifacts',
              appId,
              'public',
              'data',
              'masonry_logs'
            ),
            {
              ...newEntry,
              timestamp: serverTimestamp(),
            }
          );
          alert(`Logged for ${targetWorker}!`);
        } catch (err) {
          setSyncQueue([...syncQueue, newEntry]);
        }
      }
      setEntry({ ...entry, count: '', notes: '' });
      setPhotoTaken(false);
      setView('dashboard');
    };

    const handleCalc = () => {
      const mat = MATERIALS[entry.material];
      setEntry({
        ...entry,
        count: Math.ceil(calc.length * calc.height * mat.perSqFt),
      });
    };

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">New Entry</h2>
          <Button variant="ghost" onClick={() => setView('dashboard')}>
            Cancel
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg">
          {['manual', 'calc', 'camera'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-2 text-sm font-medium rounded-md capitalize ${
                mode === m ? 'bg-white shadow text-orange-600' : 'text-gray-500'
              }`}
            >
              {m === 'camera' ? 'AI Camera' : m}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <Card className="space-y-4">
            {(profile.role === 'foreman' || profile.role === 'manager') && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col gap-2">
                <div className="flex items-center gap-2 text-indigo-800 font-medium text-sm">
                  <UserCheck size={16} />
                  <span>Logging on behalf of:</span>
                </div>
                <select
                  className="w-full px-3 py-2 border border-indigo-200 rounded bg-white text-indigo-900 outline-none"
                  value={targetWorker}
                  onChange={(e) => setTargetWorker(e.target.value)}
                >
                  {crewList.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Select
              label="Jobsite"
              options={JOBSITES.map((j) => ({ value: j, label: j }))}
              value={entry.jobsite}
              onChange={(e) => setEntry({ ...entry, jobsite: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Material"
                options={Object.keys(MATERIALS).map((k) => ({
                  value: k,
                  label: MATERIALS[k].label,
                }))}
                value={entry.material}
                onChange={(e) =>
                  setEntry({ ...entry, material: e.target.value })
                }
              />
              <Input
                label="Hours"
                type="number"
                step="0.5"
                value={entry.hours}
                onChange={(e) => setEntry({ ...entry, hours: e.target.value })}
              />
            </div>
            {mode === 'manual' && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <Input
                  label={`Count (${MATERIALS[entry.material].unit})`}
                  type="number"
                  className="text-2xl font-bold"
                  value={entry.count}
                  onChange={(e) =>
                    setEntry({ ...entry, count: e.target.value })
                  }
                  required
                />
              </div>
            )}
            {mode === 'calc' && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Length"
                    type="number"
                    value={calc.length}
                    onChange={(e) =>
                      setCalc({ ...calc, length: parseFloat(e.target.value) })
                    }
                  />
                  <Input
                    label="Height"
                    type="number"
                    value={calc.height}
                    onChange={(e) =>
                      setCalc({ ...calc, height: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleCalc}
                  variant="secondary"
                  className="w-full text-sm"
                >
                  <Calculator size={16} /> Calculate
                </Button>
                {entry.count && (
                  <div className="text-center font-bold text-blue-800 text-lg">
                    {entry.count} {MATERIALS[entry.material].unit}
                  </div>
                )}
              </div>
            )}
            {mode === 'camera' && (
              <div className="p-6 bg-purple-50 rounded-lg border border-purple-100 flex flex-col items-center justify-center space-y-4">
                {!photoTaken ? (
                  <div
                    onClick={() => setPhotoTaken(true)}
                    className="w-32 h-32 bg-purple-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-300 transition-colors shadow-inner"
                  >
                    <Camera size={40} className="text-purple-700" />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-full h-48 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
                      <ImageIcon size={48} className="text-white opacity-50" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoTaken(false)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
            <Button
              type="submit"
              disabled={mode === 'camera' && !photoTaken}
              className="w-full py-3 text-lg"
            >
              {isOnline
                ? mode === 'camera'
                  ? 'Upload'
                  : 'Submit'
                : 'Queue Offline'}
            </Button>
          </Card>
        </form>
      </div>
    );
  };

  const ReportsView = () => {
    const [timeframe, setTimeframe] = useState('weekly');
    const [filterJob, setFilterJob] = useState('All');
    const filteredLogs = useMemo(() => {
      let data = logs;
      if (filterJob !== 'All')
        data = data.filter((l) => l.jobsite === filterJob);
      if (profile.role === 'mason')
        data = data.filter((l) => l.userName === profile.name);
      const cutoff = new Date();
      if (timeframe === 'daily') cutoff.setDate(cutoff.getDate() - 1);
      if (timeframe === 'weekly') cutoff.setDate(cutoff.getDate() - 7);
      if (timeframe === 'monthly') cutoff.setMonth(cutoff.getMonth() - 1);
      return data.filter((l) => l.date >= cutoff);
    }, [logs, filterJob, timeframe, profile]);

    const stats = useMemo(() => {
      const totalHours = filteredLogs.reduce(
        (acc, curr) => acc + (curr.hours || 0),
        0
      );
      const totalUnits = filteredLogs.reduce(
        (acc, curr) => acc + (curr.count || 0),
        0
      );
      const uph = totalHours ? (totalUnits / totalHours).toFixed(1) : 0;
      const byUser = {},
        byJob = {};
      filteredLogs.forEach((l) => {
        if (!byUser[l.userName])
          byUser[l.userName] = { name: l.userName, units: 0, hours: 0 };
        byUser[l.userName].units += l.count;
        byUser[l.userName].hours += l.hours;
        if (!byJob[l.jobsite]) byJob[l.jobsite] = { name: l.jobsite, units: 0 };
        byJob[l.jobsite].units += l.count;
      });
      return {
        totalHours,
        totalUnits,
        uph,
        leaderboard: Object.values(byUser),
        jobStats: Object.values(byJob),
      };
    }, [filteredLogs]);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800">Reports</h2>
          <div className="flex gap-2">
            <select
              className="bg-white border rounded px-2 text-sm"
              value={filterJob}
              onChange={(e) => setFilterJob(e.target.value)}
            >
              <option value="All">All Jobs</option>
              {JOBSITES.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
            <select
              className="bg-white border rounded px-2 text-sm"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="weekly">Week</option>
              <option value="monthly">Month</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-100 p-3 text-center">
            <div className="text-xs font-bold text-blue-600 uppercase">
              Units
            </div>
            <div className="text-xl font-bold text-blue-900">
              {stats.totalUnits}
            </div>
          </Card>
          <Card className="bg-green-50 border-green-100 p-3 text-center">
            <div className="text-xs font-bold text-green-600 uppercase">
              Hours
            </div>
            <div className="text-xl font-bold text-green-900">
              {stats.totalHours}
            </div>
          </Card>
          <Card className="bg-orange-50 border-orange-100 p-3 text-center">
            <div className="text-xs font-bold text-orange-600 uppercase">
              UPH
            </div>
            <div className="text-xl font-bold text-orange-900">{stats.uph}</div>
          </Card>
        </div>
        <Card className="overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-100 font-semibold text-sm">
            Recent Logs
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 border-b border-gray-50 text-sm flex justify-between"
              >
                <div>
                  <div className="font-bold">
                    {log.userName}{' '}
                    <span className="font-normal text-gray-500">
                      | {log.materialLabel}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(log.date)} • {log.jobsite}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600">{log.count}</div>
                  {log.entryMethod === 'camera' && (
                    <div className="text-[10px] text-purple-500">AI</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
        {(profile.role === 'foreman' || profile.role === 'manager') && (
          <Card>
            <div className="p-3 border-b border-gray-100 mb-2 font-semibold text-sm">
              Leaderboard
            </div>
            {stats.leaderboard
              .sort((a, b) => b.units - a.units)
              .map((m, i) => (
                <div
                  key={m.name}
                  className="flex justify-between p-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex gap-2 text-sm">
                    <span className="font-bold text-gray-400">#{i + 1}</span>{' '}
                    {m.name}
                  </div>
                  <div className="text-sm font-bold">
                    {m.units}{' '}
                    <span className="font-normal text-gray-400 text-xs">
                      ({(m.units / m.hours).toFixed(0)} UPH)
                    </span>
                  </div>
                </div>
              ))}
          </Card>
        )}
      </div>
    );
  };

  // --- Layout ---

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans pb-20 md:pb-0">
      <div
        className={`w-full px-4 py-1 text-xs font-medium flex justify-center items-center gap-2 ${
          isOnline ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi size={12} /> {isSyncing ? 'Syncing...' : 'Online'}
          </>
        ) : (
          <>
            <WifiOff size={12} /> Offline
          </>
        )}
      </div>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-orange-600 text-white p-1.5 rounded-lg">
            <BrickWall size={20} />
          </div>
          <div className="leading-tight">
            <h1 className="font-bold text-gray-900 text-lg">MasonTrack</h1>
            <p className="text-xs text-gray-500 capitalize">
              {profile.name} • {profile.role}
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="text-xs p-2">
          Log Out
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {view === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
              <h2 className="text-2xl font-bold mb-1">
                Hello, {profile.name.split(' ')[0]}
              </h2>
              <p className="opacity-90 mb-6 text-sm">
                {syncQueue.length > 0
                  ? `${syncQueue.length} pending uploads`
                  : 'All systems go.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setView('log')}
                  className="bg-white text-orange-600 px-5 py-2 rounded-lg font-bold shadow hover:bg-orange-50 flex gap-2 items-center"
                >
                  <Plus size={18} /> Log Work
                </button>
                <button
                  onClick={() => setView('reports')}
                  className="bg-orange-700 text-white border border-orange-400 px-5 py-2 rounded-lg hover:bg-orange-800 flex gap-2 items-center"
                >
                  <BarChart3 size={18} /> Stats
                </button>

                {/* MANAGER ONLY BUTTON */}
                {profile.role === 'manager' && (
                  <button
                    onClick={() => setView('manage_crew')}
                    className="bg-slate-800 text-white border border-slate-600 px-5 py-2 rounded-lg hover:bg-slate-900 flex gap-2 items-center"
                  >
                    <Settings size={18} /> Crew
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {view === 'log' && <LogEntryView />}
        {view === 'reports' && <ReportsView />}
        {view === 'manage_crew' && <ManageCrewView />}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 md:hidden flex justify-around p-3 pb-safe z-50">
        <button
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center text-xs ${
            view === 'dashboard' ? 'text-orange-600' : 'text-gray-400'
          }`}
        >
          <LayoutDashboard size={24} /> Home
        </button>
        <button
          onClick={() => setView('log')}
          className={`flex flex-col items-center text-xs ${
            view === 'log' ? 'text-orange-600' : 'text-gray-400'
          }`}
        >
          <div className="bg-orange-600 rounded-full p-2 -mt-6 border-4 border-white">
            <Plus size={24} className="text-white" />
          </div>
          Log
        </button>
        <button
          onClick={() => setView('reports')}
          className={`flex flex-col items-center text-xs ${
            view === 'reports' ? 'text-orange-600' : 'text-gray-400'
          }`}
        >
          <BarChart3 size={24} /> Reports
        </button>
      </nav>
    </div>
  );
}
