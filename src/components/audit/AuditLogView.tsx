import { useState, useMemo } from 'react';
import { AuditLog, AuditActionCategory, Employee } from '../../types/cafe';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  User,
  Activity,
  DollarSign,
  Lock,
  UtensilsCrossed,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface Props {
  auditLogs: AuditLog[];
  employees: Employee[];
  activeStaff: Employee;
  onClearLogs: () => void;
}

export default function AuditLogView({
  auditLogs,
  employees,
  activeStaff,
  onClearLogs,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL');
  const [confirmClear, setConfirmClear] = useState(false);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Category filter
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false;
      }
      // Staff filter
      if (selectedStaffId !== 'ALL' && log.staffId !== selectedStaffId) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          log.staffName.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [auditLogs, selectedCategory, selectedStaffId, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = auditLogs.length;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todayCount = auditLogs.filter((l) => new Date(l.timestamp).getTime() >= todayStart).length;
    const financialCount = auditLogs.filter((l) => l.category === 'BILLING').length;
    const authCount = auditLogs.filter((l) => l.category === 'AUTH').length;

    return { total, todayCount, financialCount, authCount };
  }, [auditLogs]);

  // Export handlers
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `brewpulse-audit-logs-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Staff Name', 'Staff Role', 'Category', 'Action', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.staffName}"`,
      `"${l.staffRole}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `brewpulse-audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getCategoryBadge = (category: AuditActionCategory) => {
    switch (category) {
      case 'AUTH':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'BILLING':
        return 'bg-[#F7EDE6] text-[#B86D43] border-[#EAD0C0]';
      case 'ORDER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MENU':
        return 'bg-[#526B5A]/20 text-[#2D3D33] border-[#526B5A]/30';
      case 'INVENTORY':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'STAFF':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F1E8] text-[#2D3D33]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#2D3D33] tracking-tight font-serif flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-[#B86D43]" />
              <span>Owner Audit Log & Security Trail</span>
            </h1>
            <span className="text-[10px] bg-[#B86D43] text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              OWNER PRIVILEGE
            </span>
          </div>
          <p className="text-xs text-[#617568] mt-1">
            Complete, timestamped audit log of all logins, billings, discounts applied, order changes, and menu adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="bg-white hover:bg-[#EDE7DC] text-[#2D3D33] border border-[#DDD5C8] font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#526B5A]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            className="bg-white hover:bg-[#EDE7DC] text-[#2D3D33] border border-[#DDD5C8] font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#B86D43]" />
            <span>Export JSON</span>
          </button>

          {auditLogs.length > 0 && (
            <button
              onClick={() => {
                if (confirmClear) {
                  onClearLogs();
                  setConfirmClear(false);
                } else {
                  setConfirmClear(true);
                }
              }}
              className={`font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
                confirmClear
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmClear ? 'Click Again to Confirm Clear' : 'Clear Log'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E3DCD1] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#617568] text-xs">
            <span className="font-semibold">Total Events</span>
            <Activity className="w-4 h-4 text-[#526B5A]" />
          </div>
          <p className="text-2xl font-black text-[#2D3D33] mt-1.5 font-serif">{metrics.total}</p>
          <span className="text-[10px] text-[#617568]">Logged across all sessions</span>
        </div>

        <div className="bg-white border border-[#E3DCD1] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#617568] text-xs">
            <span className="font-semibold">Today's Activity</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1.5 font-serif">{metrics.todayCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Actions executed today</span>
        </div>

        <div className="bg-white border border-[#E3DCD1] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#617568] text-xs">
            <span className="font-semibold">Financial & Discounts</span>
            <DollarSign className="w-4 h-4 text-[#B86D43]" />
          </div>
          <p className="text-2xl font-black text-[#B86D43] mt-1.5 font-serif">{metrics.financialCount}</p>
          <span className="text-[10px] text-[#617568]">Bills settled & discounts</span>
        </div>

        <div className="bg-white border border-[#E3DCD1] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#617568] text-xs">
            <span className="font-semibold">IAM Security Logins</span>
            <Lock className="w-4 h-4 text-purple-700" />
          </div>
          <p className="text-2xl font-black text-purple-800 mt-1.5 font-serif">{metrics.authCount}</p>
          <span className="text-[10px] text-[#617568]">Staff logins & switches</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E3DCD1] rounded-2xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search audit trail, staff, actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F1E8] border border-[#DDD5C8] rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
            />
            <Search className="w-4 h-4 text-[#73897C] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Category Pill Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['ALL', 'AUTH', 'BILLING', 'ORDER', 'MENU', 'INVENTORY', 'STAFF'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#526B5A] text-white shadow-2xs'
                    : 'bg-[#F5F1E8] hover:bg-[#EDE7DC] text-[#617568]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Staff Member dropdown */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <span className="text-xs text-[#617568] font-semibold shrink-0">Staff:</span>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="bg-[#F5F1E8] border border-[#DDD5C8] rounded-xl px-2.5 py-1.5 text-xs text-[#2D3D33] font-medium focus:outline-none focus:border-[#526B5A]"
            >
              <option value="ALL">All Staff Members</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Entries List */}
      <div className="bg-white border border-[#E3DCD1] rounded-3xl overflow-hidden shadow-sm">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-[#617568] space-y-2">
            <ShieldAlert className="w-10 h-10 text-[#73897C] mx-auto opacity-50" />
            <h3 className="font-bold text-sm text-[#2D3D33]">No Audit Events Found</h3>
            <p className="text-xs">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'Try adjusting your search query or category filters.'
                : 'All system activities will be securely recorded here in real-time.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E3DCD1] overflow-x-auto">
            {filteredLogs.map((log) => {
              const dateObj = new Date(log.timestamp);
              const formattedDate = dateObj.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const formattedTime = dateObj.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div key={log.id} className="p-4 hover:bg-[#FBF9F5] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Left: Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#F5F1E8] text-[#526B5A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-[#DDD5C8]">
                      {log.staffName.charAt(0)}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#2D3D33]">{log.staffName}</span>
                        <span className="text-[10px] text-[#617568] font-mono">({log.staffRole})</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${getCategoryBadge(log.category)}`}>
                          {log.category} · {log.action}
                        </span>
                      </div>

                      <p className="text-[#617568] text-xs leading-relaxed">{log.details}</p>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          {Object.entries(log.metadata).map(([k, v]) => (
                            <span key={k} className="font-mono text-[10px] bg-[#F5F1E8] border border-[#DDD5C8] px-1.5 py-0.5 rounded text-[#2D3D33]">
                              {k}: <strong>{String(v)}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Timestamp */}
                  <div className="text-right sm:shrink-0 text-[11px] text-[#617568] font-mono flex sm:flex-col items-center sm:items-end justify-between">
                    <span className="font-semibold text-[#2D3D33]">{formattedTime}</span>
                    <span>{formattedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
