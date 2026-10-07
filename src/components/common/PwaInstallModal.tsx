import { useState } from 'react';
import { usePWAInstall } from '../../lib/usePWAInstall';
import {
  Download,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  X,
  Share2,
  PlusSquare,
  Sparkles,
  ExternalLink,
  Laptop,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PwaInstallModal({ isOpen, onClose }: Props) {
  const {
    canInstall,
    isInstalled,
    isIOS,
    isAndroid,
    isDesktop,
    promptInstall,
    downloadShortcutFile,
  } = usePWAInstall();

  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#F5F1E8] border border-[#E3DCD1] rounded-3xl max-w-lg w-full text-[#2D3D33] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#E3DCD1] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#526B5A] text-white flex items-center justify-center shadow-md">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D3D33] font-serif flex items-center gap-2">
                <span>Download & Install App Shortcut</span>
                <span className="text-[10px] bg-[#B86D43] text-white px-2 py-0.5 rounded-full font-sans font-bold">
                  Chrome PWA
                </span>
              </h2>
              <p className="text-xs text-[#617568]">
                One-tap Chrome app icon for Phone, Tablet & Desktop PC
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#73897C] hover:text-[#2D3D33] rounded-lg hover:bg-[#F5F1E8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {isInstalled || installSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-2 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm">BrewPulse is Installed!</h3>
              <p className="text-xs text-emerald-700 leading-relaxed">
                The application shortcut is running on your home screen/desktop. Each IAM staff user can launch directly without typing URLs.
              </p>
            </div>
          ) : (
            <>
              {/* Native Prompt Banner if available */}
              {canInstall && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#526B5A] to-[#3E5244] text-white shadow-md space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-[#F1BA9B]" />
                    <span>Instant 1-Click Chrome App Install</span>
                  </div>
                  <p className="text-xs text-[#E3DCD1] leading-relaxed">
                    Chrome detected! Click below to create a dedicated app shortcut on your Phone, Tablet, or PC desktop immediately.
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-[#B86D43] hover:bg-[#A45831] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install BrewPulse App Now</span>
                  </button>
                </div>
              )}

              {/* Device Specific Guidance */}
              <div className="space-y-3">
                <div className="font-bold text-xs text-[#2D3D33] flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-[#B86D43]" />
                  <span>Instructions for All Devices & IAM Staff:</span>
                </div>

                {/* PC / Chrome on Desktop */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#E3DCD1] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#2D3D33]">
                    <Monitor className="w-4 h-4 text-[#526B5A]" />
                    <span>On Chrome (PC / Mac / Laptop)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[#617568] text-[11px] leading-relaxed pl-1">
                    <li>Look at the top-right of your Chrome URL address bar.</li>
                    <li>
                      Click the <strong>"Install app"</strong> icon (or click Chrome <strong>⋮ Menu → Save and share → Create shortcut / Install BrewPulse</strong>).
                    </li>
                    <li>Check <strong>"Open as window"</strong> so it launches like a native PC program.</li>
                  </ol>
                  <div className="pt-1">
                    <button
                      onClick={downloadShortcutFile}
                      className="bg-[#F5F1E8] hover:bg-[#EAE4DC] text-[#2D3D33] border border-[#DDD5C8] font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#B86D43]" />
                      <span>Download Windows Desktop Shortcut (.url file)</span>
                    </button>
                  </div>
                </div>

                {/* Phone & Tablet (Android / Chrome) */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#E3DCD1] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#2D3D33]">
                    <Smartphone className="w-4 h-4 text-[#526B5A]" />
                    <span>On Android Phone & Tablet (Chrome)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[#617568] text-[11px] leading-relaxed pl-1">
                    <li>Tap the <strong>three dots (⋮)</strong> at the top right of Chrome.</li>
                    <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                    <li>Confirm <strong>"Install"</strong> — an app icon will appear on your phone/tablet launcher.</li>
                  </ol>
                </div>

                {/* iPad / iPhone Safari */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#E3DCD1] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#2D3D33]">
                    <Tablet className="w-4 h-4 text-[#526B5A]" />
                    <span>On iPad & iPhone (Safari)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[#617568] text-[11px] leading-relaxed pl-1">
                    <li className="flex items-center gap-1.5">
                      Tap the <strong>Share</strong> button <Share2 className="w-3 h-3 text-[#526B5A] inline" /> at the bottom/top bar.
                    </li>
                    <li className="flex items-center gap-1.5">
                      Scroll and tap <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3 h-3 text-[#526B5A] inline" />.
                    </li>
                    <li>Tap <strong>"Add"</strong> in the top right.</li>
                  </ol>
                </div>
              </div>

              {/* Key Features of Shortcut */}
              <div className="p-3 rounded-2xl bg-[#EDE7DC] border border-[#DDD5C8] text-[11px] text-[#617568] space-y-1">
                <div className="font-bold text-[#2D3D33] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Why install as Chrome App Shortcut?</span>
                </div>
                <p>• Runs standalone without browser address bar clutter.</p>
                <p>• Retains IAM user session so cashiers, kitchen & waitstaff can access in seconds.</p>
                <p>• Works identically across cash registers, kitchen wall tablets, and mobile order pads.</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E3DCD1] bg-[#EDE7DC] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#526B5A] hover:bg-[#43584A] text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
