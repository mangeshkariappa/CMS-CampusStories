import { ShieldAlert, LogIn, ArrowRight } from 'lucide-react';
import { Employee } from '../../types/cafe';

interface Props {
  moduleName: string;
  requiredPermissionLabel: string;
  activeStaff: Employee;
  onOpenLoginModal: () => void;
  onNavigateToAllowed: () => void;
}

export default function AccessRestrictedView({
  moduleName,
  requiredPermissionLabel,
  activeStaff,
  onOpenLoginModal,
  onNavigateToAllowed,
}: Props) {
  return (
    <div className="p-6 max-w-xl mx-auto my-12 text-center animate-in fade-in duration-200">
      <div className="bg-white border border-[#E3DCD1] rounded-3xl p-8 shadow-sm space-y-5 text-[#2D3D33]">
        <div className="w-16 h-16 rounded-full bg-[#F7EDE6] border border-[#EAD0C0] text-[#B86D43] mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight font-serif text-[#2D3D33]">
            Feature Access Restricted
          </h2>
          <p className="text-xs text-[#617568]">
            Access Policy Enforcement Rule
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F5F1E8] border border-[#E3DCD1] text-xs text-left space-y-2">
          <div className="flex justify-between items-center text-[#617568]">
            <span>Requested Module:</span>
            <span className="font-bold text-[#2D3D33]">{moduleName}</span>
          </div>
          <div className="flex justify-between items-center text-[#617568]">
            <span>Required Policy:</span>
            <span className="font-bold text-[#B86D43] bg-[#F7EDE6] border border-[#EAD0C0] px-2 py-0.5 rounded">
              {requiredPermissionLabel}
            </span>
          </div>
          <div className="flex justify-between items-center text-[#617568] border-t border-[#E3DCD1] pt-2">
            <span>Active Session:</span>
            <span className="font-bold text-[#2D3D33]">
              {activeStaff.name} ({activeStaff.role})
            </span>
          </div>
        </div>

        <p className="text-xs text-[#617568] leading-relaxed">
          Your account policy does not authorize access to this feature. To access this section, please switch to an account with authorized privileges (such as the Cafe Owner or Manager).
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={onOpenLoginModal}
            className="flex-1 bg-[#B86D43] hover:bg-[#A45831] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Switch Staff Account</span>
          </button>
          <button
            onClick={onNavigateToAllowed}
            className="flex-1 bg-white hover:bg-[#F5F1E8] text-[#2D3D33] border border-[#DDD5C8] font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Go to Authorized View</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
