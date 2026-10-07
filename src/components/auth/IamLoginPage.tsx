import { useState } from 'react';
import { Employee } from '../../types/cafe';
import { getEffectivePermissions } from '../../lib/permissions';
import {
  ShieldCheck,
  Lock,
  Key,
  User,
  Coffee,
  Download,
  ArrowRight,
  Sparkles,
  AlertCircle,
  LogIn,
  QrCode,
  Check,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  employees: Employee[];
  cafeName: string;
  onLoginSuccess: (employee: Employee) => void;
  onOpenCustomerView: () => void;
  onOpenInstallModal: () => void;
  currentTableNumber: number;
}

export default function IamLoginPage({
  employees,
  cafeName,
  onLoginSuccess,
  onOpenCustomerView,
  onOpenInstallModal,
  currentTableNumber,
}: Props) {
  const [authMode, setAuthMode] = useState<'credentials' | 'pin' | 'quick'>('quick');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const targetEmpForPin = employees.find((e) => e.id === selectedEmpId) || employees[0];

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedUser = username.trim().toLowerCase();
    const found = employees.find(
      (e) => e.username.toLowerCase() === trimmedUser || e.email.toLowerCase() === trimmedUser
    );

    if (!found) {
      setErrorMsg('Invalid username or account not found.');
      return;
    }

    if (!found.isActive) {
      setErrorMsg(`Account for ${found.name} has been deactivated. Please contact the Owner.`);
      return;
    }

    if (found.password && password !== found.password) {
      setErrorMsg('Incorrect password. Please verify your credentials.');
      return;
    }

    onLoginSuccess(found);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!targetEmpForPin) return;

    if (!targetEmpForPin.isActive) {
      setErrorMsg(`Account for ${targetEmpForPin.name} is deactivated.`);
      return;
    }

    if (pin.trim() !== targetEmpForPin.pin) {
      setErrorMsg(`Invalid 4-digit security PIN for ${targetEmpForPin.name}.`);
      return;
    }

    onLoginSuccess(targetEmpForPin);
  };

  const handleQuickLogin = (emp: Employee) => {
    if (!emp.isActive) {
      setErrorMsg(`Account for ${emp.name} is deactivated.`);
      return;
    }
    setErrorMsg('');
    onLoginSuccess(emp);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-[#B86D43] text-white';
      case 'manager':
        return 'bg-[#526B5A] text-white';
      case 'cashier':
        return 'bg-[#F7EDE6] text-[#B86D43] border border-[#EAD0C0]';
      case 'kitchen':
        return 'bg-[#526B5A]/20 text-[#2D3D33] border border-[#526B5A]/30';
      default:
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#2D3D33] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#B86D43]/20">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#E3DCD1]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#526B5A] text-white flex items-center justify-center shadow-md">
            <Coffee className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[#2D3D33] font-serif tracking-tight">BrewPulse</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#B86D43] text-white tracking-wider">
                IAM PORTAL
              </span>
            </div>
            <p className="text-xs text-[#617568] font-medium">{cafeName} · Secure Identity & Access Management</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
          {/* Download App / Chrome Shortcut Button */}
          <button
            onClick={onOpenInstallModal}
            className="bg-[#B86D43] hover:bg-[#A45831] text-white font-bold px-3.5 py-2 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Chrome App Shortcut</span>
          </button>

          {/* Customer View Switcher */}
          <button
            onClick={onOpenCustomerView}
            className="bg-white hover:bg-[#EAE4DC] text-[#2D3D33] border border-[#DDD5C8] font-bold px-3.5 py-2 rounded-2xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#526B5A]" />
            <span>Customer QR Menu (Table #{currentTableNumber})</span>
          </button>
        </div>
      </div>

      {/* Main Login Container */}
      <div className="max-w-4xl w-full mx-auto my-auto py-8">
        <div className="bg-white border border-[#E3DCD1] rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Hero / Brand Column */}
          <div className="md:col-span-5 bg-gradient-to-br from-[#526B5A] to-[#3B4E42] text-white p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <ShieldCheck className="w-7 h-7 text-[#F1BA9B]" />
              </div>
              <h2 className="text-2xl font-black font-serif leading-tight text-[#F5F1E8]">
                Staff Identity & Access Management
              </h2>
              <p className="text-xs text-[#E3DCD1] leading-relaxed">
                Log in to access your designated workspace: Cashier POS, Kitchen KDS, Inventory, or Management Console.
              </p>

              <div className="pt-2 space-y-2 text-[11px] text-[#E3DCD1]/90">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#F1BA9B]" />
                  <span>Strict feature visibility: Only authorized views appear.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#F1BA9B]" />
                  <span>Works on Chrome for Phone, Tablet & PC Cash Register.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#F1BA9B]" />
                  <span>Owner-only immutable Audit Trail recorded automatically.</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/15 text-[11px] text-[#E3DCD1]/70">
              Session is encrypted & protected locally.
            </div>
          </div>

          {/* Right Interactive Login Forms Column */}
          <div className="md:col-span-7 p-6 sm:p-8 space-y-5 bg-[#FAF8F4]">
            {/* Mode Tabs */}
            <div className="flex border border-[#DDD5C8] rounded-2xl p-1 bg-[#EDE7DC] text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('quick');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  authMode === 'quick' ? 'bg-[#526B5A] text-white shadow-xs' : 'text-[#617568]'
                }`}
              >
                Fast Role Switch
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('pin');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  authMode === 'pin' ? 'bg-[#526B5A] text-white shadow-xs' : 'text-[#617568]'
                }`}
              >
                4-Digit POS PIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('credentials');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  authMode === 'credentials' ? 'bg-[#526B5A] text-white shadow-xs' : 'text-[#617568]'
                }`}
              >
                Password Login
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Mode 1: Fast Role Selector Cards */}
            {authMode === 'quick' && (
              <div className="space-y-3">
                <p className="text-xs text-[#617568]">
                  Select your staff identity to login immediately. Only your assigned features will be visible:
                </p>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {employees.map((emp) => {
                    const perms = getEffectivePermissions(emp);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleQuickLogin(emp)}
                        className="p-3.5 rounded-2xl bg-white border border-[#E3DCD1] hover:border-[#526B5A] transition-all cursor-pointer shadow-2xs hover:shadow-sm flex items-center justify-between group active:scale-98"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#526B5A] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#2D3D33] group-hover:text-[#526B5A]">
                                {emp.name}
                              </span>
                              <span
                                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${getRoleBadgeStyle(
                                  emp.role
                                )}`}
                              >
                                {emp.role}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#617568] font-mono mt-0.5">
                              @{emp.username} · PIN: {emp.pin}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#617568] hidden sm:inline">
                            {emp.role === 'owner' ? 'All Features + Audit Log' : `${emp.role.toUpperCase()} Workspace`}
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-[#F5F1E8] group-hover:bg-[#B86D43] group-hover:text-white flex items-center justify-center transition-colors">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mode 2: 4-Digit Quick PIN Input */}
            {authMode === 'pin' && (
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D3D33] mb-1.5">Select IAM Staff Profile</label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-xs font-medium text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — ({emp.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D3D33] mb-1.5">
                    Enter 4-Digit POS PIN for {targetEmpForPin?.name}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={4}
                      autoFocus
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full bg-white border border-[#DDD5C8] rounded-2xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                    />
                    <Key className="w-5 h-5 text-[#73897C] absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-[#617568] mt-1.5 text-center font-mono">
                    Staff Demo PIN for {targetEmpForPin?.name}: <strong>{targetEmpForPin?.pin}</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#B86D43] hover:bg-[#A45831] text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Verify PIN & Access Workspace</span>
                </button>
              </form>
            )}

            {/* Mode 3: Username & Password Login */}
            {authMode === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D3D33] mb-1.5">Username / Email</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. owner or cashier1"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white border border-[#DDD5C8] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                    />
                    <User className="w-4 h-4 text-[#73897C] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D3D33] mb-1.5">Account Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-[#DDD5C8] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                    />
                    <Lock className="w-4 h-4 text-[#73897C] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-[#617568] mt-1 font-mono">
                    Demo credentials: owner / password123, cashier1 / cashier123
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#B86D43] hover:bg-[#A45831] text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Password</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-6xl w-full mx-auto text-center pt-6 border-t border-[#E3DCD1] text-xs text-[#617568] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 {cafeName}. Role-Based Access Control (RBAC) & Audit Protection.</span>
        <span>Table QR codes strictly bound to table numbers.</span>
      </div>
    </div>
  );
}
