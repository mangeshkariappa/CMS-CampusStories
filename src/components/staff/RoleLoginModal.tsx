import { useState } from 'react';
import { Employee } from '../../types/cafe';
import { getEffectivePermissions } from '../../lib/permissions';
import {
  X,
  Lock,
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  Check,
  Ban,
  UserCheck,
} from 'lucide-react';

interface Props {
  employees: Employee[];
  activeStaff: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee: (emp: Employee) => void;
}

export default function RoleLoginModal({
  employees,
  activeStaff,
  isOpen,
  onClose,
  onSelectEmployee,
}: Props) {
  const [tab, setTab] = useState<'quick' | 'credentials'>('quick');
  const [selectedEmpId, setSelectedEmpId] = useState(activeStaff.id);
  const [authMode, setAuthMode] = useState<'pin' | 'password'>('pin');
  const [enteredPin, setEnteredPin] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const targetEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];
  const targetPerms = targetEmp ? getEffectivePermissions(targetEmp) : null;

  const handleQuickSwitch = (emp: Employee) => {
    if (!emp.isActive) {
      setErrorMsg(`Cannot switch to ${emp.name}: Account has been deactivated.`);
      return;
    }
    setErrorMsg('');
    onSelectEmployee(emp);
    onClose();
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!targetEmp) return;

    if (!targetEmp.isActive) {
      setErrorMsg(`Access Denied: Account for ${targetEmp.name} is deactivated.`);
      return;
    }

    if (authMode === 'pin') {
      if (!enteredPin.trim()) {
        setErrorMsg('Please enter your 4-digit PIN.');
        return;
      }
      if (enteredPin.trim() !== targetEmp.pin) {
        setErrorMsg('Invalid Security PIN. Access denied.');
        return;
      }
    } else {
      if (!enteredPassword.trim()) {
        setErrorMsg('Please enter your password.');
        return;
      }
      if (targetEmp.password && enteredPassword !== targetEmp.password) {
        setErrorMsg('Incorrect password. Please try again.');
        return;
      }
    }

    onSelectEmployee(targetEmp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#F5F1E8] border border-[#E3DCD1] rounded-3xl max-w-xl w-full text-[#2D3D33] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E3DCD1] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#526B5A] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D3D33] font-serif">Staff Account & Policy Switcher</h2>
              <p className="text-xs text-[#617568]">
                Current Active: <span className="font-bold text-[#2D3D33]">{activeStaff.name}</span> ({activeStaff.role.toUpperCase()})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-[#73897C] hover:text-[#2D3D33] rounded-lg hover:bg-[#F5F1E8] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E3DCD1] bg-[#EDE7DC] px-4 pt-2">
          <button
            onClick={() => {
              setTab('quick');
              setErrorMsg('');
            }}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              tab === 'quick'
                ? 'border-[#526B5A] text-[#2D3D33]'
                : 'border-transparent text-[#617568] hover:text-[#2D3D33]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Fast Role Switcher</span>
          </button>

          <button
            onClick={() => {
              setTab('credentials');
              setErrorMsg('');
            }}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              tab === 'credentials'
                ? 'border-[#526B5A] text-[#2D3D33]'
                : 'border-transparent text-[#617568] hover:text-[#2D3D33]'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>PIN & Password Auth</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'quick' ? (
            <div className="space-y-3">
              <div className="text-[#617568] leading-relaxed text-[11px]">
                Click any staff member to switch the active operator. Each account enforces specific feature access rules:
              </div>

              {employees.map((emp) => {
                const isCurrent = emp.id === activeStaff.id;
                const perms = getEffectivePermissions(emp);

                return (
                  <div
                    key={emp.id}
                    className={`p-4 rounded-3xl border transition-all ${
                      isCurrent
                        ? 'border-[#526B5A] bg-white ring-2 ring-[#526B5A]/20 shadow-sm'
                        : 'border-[#E3DCD1] bg-white hover:border-[#526B5A]/40 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#B86D43] text-white flex items-center justify-center text-xs font-black shadow-xs">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#2D3D33] flex items-center gap-2">
                            <span>{emp.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-[#F7EDE6] text-[#B86D43] border border-[#EAD0C0] px-2 py-0.5 rounded-full font-bold">
                                Active Session
                              </span>
                            )}
                            {!emp.isActive && (
                              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Ban className="w-2.5 h-2.5" /> Deactivated
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#617568] font-mono mt-0.5">
                            @{emp.username} · Quick PIN: {emp.pin}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleQuickSwitch(emp)}
                        disabled={isCurrent || !emp.isActive}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                          isCurrent
                            ? 'bg-[#F7EDE6] text-[#B86D43] cursor-default'
                            : !emp.isActive
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            : 'bg-[#B86D43] hover:bg-[#A45831] text-white cursor-pointer shadow-xs active:scale-95'
                        }`}
                      >
                        {isCurrent ? 'Active' : 'Switch Here'}
                      </button>
                    </div>

                    {/* Policy Rules Checklist */}
                    <div className="mt-3 pt-3 border-t border-[#E3DCD1] grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                      <span className={`flex items-center gap-1 ${perms.canAccessPos ? 'text-emerald-800 font-bold' : 'text-[#73897C]'}`}>
                        {perms.canAccessPos ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3" />}
                        POS Billing
                      </span>
                      <span className={`flex items-center gap-1 ${perms.canAccessKds ? 'text-emerald-800 font-bold' : 'text-[#73897C]'}`}>
                        {perms.canAccessKds ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3" />}
                        Kitchen KDS
                      </span>
                      <span className={`flex items-center gap-1 ${perms.canAccessInventory ? 'text-emerald-800 font-bold' : 'text-[#73897C]'}`}>
                        {perms.canAccessInventory ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3" />}
                        Inventory
                      </span>
                      <span className={`flex items-center gap-1 ${perms.canAccessMenu ? 'text-emerald-800 font-bold' : 'text-[#73897C]'}`}>
                        {perms.canAccessMenu ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3" />}
                        Menu Edit
                      </span>
                      <span className={`flex items-center gap-1 ${perms.canAccessStaff ? 'text-emerald-800 font-bold' : 'text-[#73897C]'}`}>
                        {perms.canAccessStaff ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3" />}
                        Staff Admin
                      </span>
                      <span className={`flex items-center gap-1 ${perms.canAccessOffers ? 'text-emerald-800 font-bold' : 'text-[#73897C]'}`}>
                        {perms.canAccessOffers ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3" />}
                        Offers & WA
                      </span>
                      <span className={`flex items-center gap-1 text-[#2D3D33] font-semibold`}>
                        <Shield className="w-3 h-3 text-[#B86D43]" />
                        Max Disc: {perms.maxDiscountPercent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-[#2D3D33] font-bold mb-1">Select Employee Profile</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] font-medium text-xs focus:outline-none focus:border-[#526B5A]"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — ({emp.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 bg-[#EDE7DC] border border-[#DDD5C8] rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthMode('pin')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    authMode === 'pin' ? 'bg-[#526B5A] text-white shadow-xs' : 'text-[#617568]'
                  }`}
                >
                  Use 4-Digit Quick PIN
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('password')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    authMode === 'password' ? 'bg-[#526B5A] text-white shadow-xs' : 'text-[#617568]'
                  }`}
                >
                  Use Account Password
                </button>
              </div>

              {authMode === 'pin' ? (
                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">
                    Enter Security PIN for {targetEmp?.name}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={6}
                      autoFocus
                      placeholder="••••"
                      value={enteredPin}
                      onChange={(e) => setEnteredPin(e.target.value)}
                      className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2.5 text-center text-lg font-mono tracking-widest text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                    />
                    <Lock className="w-4 h-4 text-[#73897C] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-[#617568] mt-1 text-center font-mono">
                    Demo PIN for {targetEmp?.name}: <strong>{targetEmp?.pin}</strong>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">
                    Enter Password for @{targetEmp?.username}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Enter account password"
                      value={enteredPassword}
                      onChange={(e) => setEnteredPassword(e.target.value)}
                      className="w-full bg-white border border-[#DDD5C8] rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                    />
                    <Key className="w-4 h-4 text-[#73897C] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              {/* Policy summary for target employee */}
              {targetPerms && (
                <div className="p-3 rounded-2xl bg-white border border-[#E3DCD1] space-y-1.5 shadow-xs">
                  <div className="font-bold text-[#2D3D33] flex items-center justify-between">
                    <span>Role Permissions for {targetEmp.role.toUpperCase()}:</span>
                    <span className="text-[10px] text-[#B86D43] font-extrabold">Max Discount: {targetPerms.maxDiscountPercent}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-[#617568]">
                    <span>• POS Billing: {targetPerms.canAccessPos ? 'Allowed' : 'Locked'}</span>
                    <span>• Kitchen KDS: {targetPerms.canAccessKds ? 'Allowed' : 'Locked'}</span>
                    <span>• Inventory: {targetPerms.canAccessInventory ? 'Allowed' : 'Locked'}</span>
                    <span>• Menu Edit: {targetPerms.canAccessMenu ? 'Allowed' : 'Locked'}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#B86D43] hover:bg-[#A45831] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs cursor-pointer active:scale-98"
              >
                Verify & Switch Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
