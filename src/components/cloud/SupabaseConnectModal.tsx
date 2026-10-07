import { useState, useEffect } from 'react';
import {
  getClientSupabaseConfig,
  saveClientSupabaseConfig,
  getBrowserSupabaseClient,
} from '../../lib/supabaseClient';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isSupabaseConnected: boolean;
  onConnectionChanged: () => void;
}

export default function SupabaseConnectModal({
  isOpen,
  onClose,
  isSupabaseConnected,
  onConnectionChanged,
}: Props) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getClientSupabaseConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, varName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Please provide both Supabase Project URL and Public Anon Key.',
      });
      setTesting(false);
      return;
    }

    try {
      saveClientSupabaseConfig(cleanUrl, cleanKey);
      const client = getBrowserSupabaseClient();
      if (!client) throw new Error('Could not initialize Supabase client');

      // Test connection with lightweight query
      const { error } = await client.from('cafe_settings').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      setTestResult({
        success: true,
        message: 'Connected to Supabase database successfully! Real-time sync is now active.',
      });
      onConnectionChanged();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Connection failed: ${err.message || 'Check your URL and API Key.'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FAF8F4] border border-[#DDD5C8] rounded-3xl max-w-lg w-full p-6 text-[#2D3D33] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#526B5A] text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5 text-[#F5D8C7]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D3D33] font-serif">
                Supabase Cloud Database Connection
              </h2>
              <p className="text-[11px] text-[#617568]">
                Real-time multi-device database for Netlify & POS terminals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#73897C] hover:text-[#2D3D33] rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Banner */}
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
            isSupabaseConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isSupabaseConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <p className="font-bold">
                {isSupabaseConnected ? 'Live Database Connected' : 'Local Offline Mode Active'}
              </p>
              <p className="text-[11px] opacity-80">
                {isSupabaseConnected
                  ? 'Your deployed site is actively synchronizing with Supabase in real-time.'
                  : 'Operating locally. Provide your Supabase keys below to connect.'}
              </p>
            </div>
          </div>
        </div>

        {/* Form to Connect */}
        <form onSubmit={handleTestAndSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#2D3D33] mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              required
              placeholder="https://your-project.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-xs font-mono text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2D3D33] mb-1">
              Supabase Anon Public Key (Safe for browser / Netlify)
            </label>
            <input
              type="text"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-xs font-mono text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={testing}
            className="w-full bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing Connection...' : 'Save & Connect to Database'}</span>
          </button>
        </form>

        {/* Permanent Netlify Setup Guide */}
        <div className="bg-[#EDE7DC] border border-[#DDD5C8] rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#2D3D33] flex items-center gap-1.5">
              <span>Permanent Netlify Configuration</span>
            </span>
            <a
              href="https://app.netlify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#526B5A] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Netlify Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-[11px] text-[#617568]">
            To ensure your live Netlify site automatically connects for all devices without entering keys manually:
          </p>

          <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#2D3D33] pl-1 font-medium">
            <li>
              Go to your Netlify site &gt; <strong>Site configuration</strong> &gt; <strong>Environment variables</strong>.
            </li>
            <li>
              Add variable:
              <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] bg-white p-1.5 rounded-lg border border-[#DDD5C8]">
                <span className="flex-1 text-[#526B5A]">VITE_SUPABASE_URL</span>
                <button
                  type="button"
                  onClick={() => handleCopy('VITE_SUPABASE_URL', 'VITE_SUPABASE_URL')}
                  className="text-[#617568] hover:text-[#2D3D33]"
                  title="Copy Name"
                >
                  {copiedVar === 'VITE_SUPABASE_URL' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </li>
            <li>
              Add variable:
              <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] bg-white p-1.5 rounded-lg border border-[#DDD5C8]">
                <span className="flex-1 text-[#526B5A]">VITE_SUPABASE_ANON_KEY</span>
                <button
                  type="button"
                  onClick={() => handleCopy('VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY')}
                  className="text-[#617568] hover:text-[#2D3D33]"
                  title="Copy Name"
                >
                  {copiedVar === 'VITE_SUPABASE_ANON_KEY' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </li>
            <li>
              Click <strong>Deploy site</strong> &gt; <strong>Trigger deploy</strong> &gt; <strong>Clear cache and deploy site</strong>.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
