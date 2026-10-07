import { useState } from 'react';
import { Employee, Role, FeatureAccessPolicy } from '../../types/cafe';
import { getEffectivePermissions, ROLE_DEFAULT_PERMISSIONS } from '../../lib/permissions';
import {
  Users,
  UserPlus,
  Key,
  Lock,
  Phone,
  Mail,
  Edit2,
  Trash2,
  X,
  LogIn,
  ShieldCheck,
  RotateCcw,
  Check,
} from 'lucide-react';

interface Props {
  employees: Employee[];
  activeStaff: Employee;
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onSwitchStaff: (employee: Employee) => void;
}

export default function StaffManagementView({
  employees,
  activeStaff,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onSwitchStaff,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('1234');
  const [role, setRole] = useState<Role>('cashier');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Granular access policies
  const [policies, setPolicies] = useState<FeatureAccessPolicy>(ROLE_DEFAULT_PERMISSIONS.cashier);

  const openAddModal = () => {
    setEditingEmp(null);
    setName('');
    setUsername('');
    setPassword('');
    setPin(Math.floor(1000 + Math.random() * 9000).toString());
    setRole('cashier');
    setEmail('');
    setPhone('');
    setIsActive(true);
    setPolicies(ROLE_DEFAULT_PERMISSIONS.cashier);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setName(emp.name);
    setUsername(emp.username);
    setPassword(emp.password || '');
    setPin(emp.pin);
    setRole(emp.role);
    setEmail(emp.email || '');
    setPhone(emp.phone || '');
    setIsActive(emp.isActive);
    setPolicies(getEffectivePermissions(emp));
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    // Auto populate recommended default policies for this role
    setPolicies(ROLE_DEFAULT_PERMISSIONS[newRole] || ROLE_DEFAULT_PERMISSIONS.cashier);
  };

  const handleResetToDefaults = () => {
    setPolicies(ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS.cashier);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) return;

    if (editingEmp) {
      onUpdateEmployee({
        ...editingEmp,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim() || editingEmp.password,
        pin: pin.trim() || '1234',
        role,
        email: email.trim(),
        phone: phone.trim(),
        isActive,
        permissions: policies,
      });
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now().toString(36)}`,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim() || 'password123',
        pin: pin.trim() || '1234',
        role,
        email: email.trim(),
        phone: phone.trim(),
        isActive,
        createdAt: new Date().toISOString().split('T')[0],
        permissions: policies,
      };
      onAddEmployee(newEmp);
    }
    setIsModalOpen(false);
  };

  const getRoleBadgeStyle = (r: Role) => {
    switch (r) {
      case 'owner':
        return 'bg-[#B86D43]/15 text-[#B86D43] border-[#B86D43]/30';
      case 'manager':
        return 'bg-[#526B5A]/15 text-[#2D3D33] border-[#526B5A]/30';
      case 'cashier':
        return 'bg-[#F7EDE6] text-[#B86D43] border-[#EAD0C0]';
      case 'kitchen':
        return 'bg-[#526B5A]/20 text-[#2D3D33] border-[#526B5A]/35';
      case 'waiter':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-[#F5F1E8] text-[#2D3D33] border-[#E3DCD1]';
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F1E8] text-[#2D3D33]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2D3D33] tracking-tight font-serif flex items-center gap-2">
            <Users className="w-6 h-6 text-[#B86D43]" /> Employee Accounts & Access Policies
          </h1>
          <p className="text-xs text-[#617568] mt-0.5">
            Configure custom usernames, passwords, 4-digit PINs, and granular feature access control rules.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#B86D43] hover:bg-[#A45831] text-white font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Employee Account</span>
        </button>
      </div>

      {/* Active Staff Summary */}
      <div className="bg-white border border-[#E3DCD1] rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#526B5A] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {activeStaff.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#2D3D33]">Current Session: {activeStaff.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getRoleBadgeStyle(activeStaff.role)}`}>
                {activeStaff.role}
              </span>
            </div>
            <p className="text-xs text-[#617568] font-mono">Username: @{activeStaff.username} · POS PIN: {activeStaff.pin}</p>
          </div>
        </div>

        <span className="text-xs text-[#617568] font-medium">
          Owner has master bypass. Managers and Cashiers follow their configured access rules.
        </span>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => {
          const isCurrent = emp.id === activeStaff.id;
          const perms = getEffectivePermissions(emp);

          return (
            <div
              key={emp.id}
              className={`bg-white border rounded-3xl p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
                isCurrent ? 'border-[#B86D43] ring-2 ring-[#B86D43]/20' : 'border-[#E3DCD1]'
              }`}
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#2D3D33] flex items-center gap-1.5">
                      {emp.name}
                      {isCurrent && (
                        <span className="text-[10px] bg-[#B86D43] text-white px-2 py-0.5 rounded-full font-bold">
                          Active
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-[#617568] font-mono mt-0.5">@{emp.username}</div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${getRoleBadgeStyle(emp.role)}`}>
                    {emp.role}
                  </span>
                </div>

                {/* Credentials Preview */}
                <div className="p-3 rounded-2xl bg-[#F5F1E8] border border-[#E3DCD1] space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-[#617568]">
                    <span className="flex items-center gap-1.5 font-sans font-medium">
                      <Lock className="w-3.5 h-3.5 text-[#73897C]" /> Custom Password:
                    </span>
                    <span className="text-[#2D3D33] font-bold">••••••••</span>
                  </div>

                  <div className="flex items-center justify-between text-[#617568]">
                    <span className="flex items-center gap-1.5 font-sans font-medium">
                      <Key className="w-3.5 h-3.5 text-[#B86D43]" /> POS Quick PIN:
                    </span>
                    <span className="text-[#B86D43] font-black tracking-widest">{emp.pin}</span>
                  </div>
                </div>

                {/* Active Access Policies Checklist */}
                <div className="p-3 rounded-2xl bg-white border border-[#E3DCD1] space-y-1.5">
                  <div className="text-[11px] font-bold text-[#2D3D33] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#B86D43]" />
                    <span>Configured Access Policies:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[10px] text-[#617568]">
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
                      Staff Mgmt
                    </span>
                    <span className={`flex items-center gap-1 ${perms.canAccessTableQr ? 'text-emerald-800 font-bold' : 'text-[#73897C]'}`}>
                      {perms.canAccessTableQr ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3" />}
                      Table QR
                    </span>
                  </div>

                  <div className="text-[10px] text-[#2D3D33] font-bold border-t border-[#E3DCD1] pt-1 mt-1 flex justify-between">
                    <span>Discount Limit: <strong className="text-[#B86D43]">{perms.maxDiscountPercent}%</strong></span>
                    <span>Void: {perms.canVoidOrders ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1 text-xs text-[#617568]">
                  {emp.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#73897C] shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  )}
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#73897C] shrink-0" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3.5 mt-3 border-t border-[#E3DCD1] flex items-center justify-between">
                <button
                  onClick={() => onSwitchStaff(emp)}
                  disabled={isCurrent}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                    isCurrent
                      ? 'bg-[#F5F1E8] text-[#73897C] cursor-not-allowed border border-[#E3DCD1]'
                      : 'bg-[#526B5A] hover:bg-[#43584A] text-white cursor-pointer shadow-xs active:scale-95'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isCurrent ? 'Current Session' : 'Switch to Account'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(emp)}
                    className="p-1.5 rounded-lg text-[#73897C] hover:text-[#2D3D33] hover:bg-[#F5F1E8] transition-colors cursor-pointer"
                    title="Edit Credentials & Access Policies"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {employees.length > 1 && (
                    <button
                      onClick={() => onDeleteEmployee(emp.id)}
                      className="p-1.5 rounded-lg text-[#73897C] hover:text-rose-600 hover:bg-[#F5F1E8] transition-colors cursor-pointer"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Employee Modal with Granular Policy Rules */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#F5F1E8] border border-[#E3DCD1] rounded-3xl max-w-lg w-full p-5 text-[#2D3D33] shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DCD1]">
              <h3 className="text-base font-bold text-[#2D3D33] font-serif">
                {editingEmp ? 'Edit Employee & Access Policies' : 'Create New Employee Account'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#73897C] hover:text-[#2D3D33] rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[#2D3D33] font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Custom Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. priya_cashier"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as Role)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-semibold"
                  >
                    <option value="owner">Owner (Full Administrator)</option>
                    <option value="manager">Manager (POS & Inventory)</option>
                    <option value="cashier">Cashier (Billing & POS)</option>
                    <option value="kitchen">Kitchen / Chef (KDS)</option>
                    <option value="waiter">Waiter (Table Service)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Custom Password</label>
                  <input
                    type="text"
                    placeholder="e.g. coffee2026"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">4-Digit POS PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="1234"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-mono tracking-widest text-center font-bold"
                  />
                </div>
              </div>

              {/* Feature Access Policies & Rules Section */}
              <div className="p-4 rounded-2xl bg-white border border-[#E3DCD1] space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E3DCD1] pb-2">
                  <div className="font-bold text-[#2D3D33] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#B86D43]" />
                    <span>Feature Access Policies & Rules</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToDefaults}
                    className="text-[11px] text-[#B86D43] hover:text-[#A45831] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Role Defaults</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#2D3D33]">
                    <input
                      type="checkbox"
                      checked={policies.canAccessPos}
                      onChange={(e) => setPolicies({ ...policies, canAccessPos: e.target.checked })}
                      className="rounded border-[#DDD5C8] text-[#526B5A] focus:ring-[#526B5A]"
                    />
                    <span>Allow Cashier POS & Billing</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#2D3D33]">
                    <input
                      type="checkbox"
                      checked={policies.canAccessKds}
                      onChange={(e) => setPolicies({ ...policies, canAccessKds: e.target.checked })}
                      className="rounded border-[#DDD5C8] text-[#526B5A] focus:ring-[#526B5A]"
                    />
                    <span>Allow Kitchen KDS Display</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#2D3D33]">
                    <input
                      type="checkbox"
                      checked={policies.canAccessInventory}
                      onChange={(e) => setPolicies({ ...policies, canAccessInventory: e.target.checked })}
                      className="rounded border-[#DDD5C8] text-[#526B5A] focus:ring-[#526B5A]"
                    />
                    <span>Allow Inventory & Stock Edit</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#2D3D33]">
                    <input
                      type="checkbox"
                      checked={policies.canAccessMenu}
                      onChange={(e) => setPolicies({ ...policies, canAccessMenu: e.target.checked })}
                      className="rounded border-[#DDD5C8] text-[#526B5A] focus:ring-[#526B5A]"
                    />
                    <span>Allow Menu Dishes & Pricing</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#2D3D33]">
                    <input
                      type="checkbox"
                      checked={policies.canAccessStaff}
                      onChange={(e) => setPolicies({ ...policies, canAccessStaff: e.target.checked })}
                      className="rounded border-[#DDD5C8] text-[#526B5A] focus:ring-[#526B5A]"
                    />
                    <span>Allow Staff Accounts Admin</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#2D3D33]">
                    <input
                      type="checkbox"
                      checked={policies.canAccessTableQr}
                      onChange={(e) => setPolicies({ ...policies, canAccessTableQr: e.target.checked })}
                      className="rounded border-[#DDD5C8] text-[#526B5A] focus:ring-[#526B5A]"
                    />
                    <span>Allow Table QR Standees</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#2D3D33]">
                    <input
                      type="checkbox"
                      checked={policies.canVoidOrders}
                      onChange={(e) => setPolicies({ ...policies, canVoidOrders: e.target.checked })}
                      className="rounded border-[#DDD5C8] text-[#526B5A] focus:ring-[#526B5A]"
                    />
                    <span>Authorize Void / Cancel Orders</span>
                  </label>
                </div>

                <div className="pt-2 border-t border-[#E3DCD1] flex items-center justify-between">
                  <label className="font-bold text-[#2D3D33]">Max Discount Limit Allowed:</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={policies.maxDiscountPercent}
                      onChange={(e) =>
                        setPolicies({ ...policies, maxDiscountPercent: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)) })
                      }
                      className="w-16 bg-[#F5F1E8] border border-[#DDD5C8] rounded-lg px-2 py-1 text-center font-bold text-[#B86D43]"
                    />
                    <span className="text-[#617568] font-bold">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="staff@cafe.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                  />
                </div>

                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">WhatsApp Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98200 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-[#2D3D33] font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-[#DDD5C8] text-[#526B5A] focus:ring-[#526B5A]"
                  />
                  <span>Account Active (Allowed to log in and operate POS)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E3DCD1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#617568] hover:text-[#2D3D33] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#B86D43] hover:bg-[#A45831] text-white font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Account & Policies
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
