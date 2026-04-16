import { useState } from "react";

// ── Service groups for conditional rendering ───────────────────────────────

const OR_SERVICES       = new Set(["OPENROUTER"]);
const OLLAMA_SERVICES   = new Set(["OLLAMA"]);
const KLING_SERVICES    = new Set(["KLING", "KLINGAI"]);
const CHATGPT_SERVICES  = new Set(["CHATGPT"]);

interface Props {
  serviceFilter: string;
  disabledCount: number;

  // OR actions
  syncingOR: boolean;
  orPrivacyRunning: boolean;
  orPrivacyProgress: string;
  cleaningOR: boolean;
  cleanORProgress: string;
  fixingPrivacy: boolean;
  fixPrivacyProgress: string;
  onSyncOR: () => void;
  onCheckORPrivacy: () => void;
  onCheckAndCleanOR: () => void;
  onFixORPrivacy: () => void;

  // Ollama actions
  syncingOllama: boolean;
  onSyncOllama: () => void;
  syncingOllama9router: boolean;
  previewing9router: boolean;
  onPreviewSyncOllama9router: () => void;

  // General sync
  syncing: boolean;
  syncingAuth: boolean;
  onSyncProxy: () => void;
  onSyncAuth: () => void;

  // Kling
  onKlingSession: () => void;

  // Delete disabled
  onDeleteDisabled: () => void;
}

export default function ActionsDropdown({
  serviceFilter, disabledCount,
  syncingOR, orPrivacyRunning, orPrivacyProgress,
  cleaningOR, cleanORProgress, fixingPrivacy, fixPrivacyProgress,
  onSyncOR, onCheckORPrivacy, onCheckAndCleanOR, onFixORPrivacy,
  syncingOllama, onSyncOllama, syncingOllama9router, previewing9router,
  onPreviewSyncOllama9router,
  syncing, syncingAuth, onSyncProxy, onSyncAuth,
  onKlingSession,
  onDeleteDisabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const run = (fn: () => void) => { close(); fn(); };

  const showOR      = serviceFilter === "ALL" || OR_SERVICES.has(serviceFilter);
  const showOllama  = serviceFilter === "ALL" || OLLAMA_SERVICES.has(serviceFilter);
  const showKling   = serviceFilter === "ALL" || KLING_SERVICES.has(serviceFilter);
  const showChatGPT = serviceFilter === "ALL" || CHATGPT_SERVICES.has(serviceFilter);

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="btn-secondary text-xs py-2 gap-1">
        Actions
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={close} />
          <div className="absolute right-0 top-full mt-1 z-30 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm">

            {/* Delete Disabled — always visible */}
            <button
              onClick={() => run(onDeleteDisabled)}
              disabled={disabledCount === 0}
              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Disabled
              {disabledCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                  {disabledCount}
                </span>
              )}
            </button>

            <div className="border-t border-gray-100 my-1" />

            {/* OR-specific actions */}
            {showOR && (
              <>
                <button onClick={() => run(onSyncOR)} disabled={syncingOR}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 disabled:opacity-40 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {syncingOR ? "Syncing OR…" : "Sync OR → CLIProxy"}
                </button>
                <button onClick={() => run(onCheckORPrivacy)} disabled={orPrivacyRunning}
                  className="w-full text-left px-4 py-2 hover:bg-orange-50 text-orange-700 disabled:opacity-40 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V7m0 0V5m0 2h2m-2 0H10M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                  </svg>
                  {orPrivacyRunning ? `Check OR Privacy… ${orPrivacyProgress}` : "Check OR Privacy"}
                </button>
              </>
            )}

            {/* Ollama-specific actions */}
            {showOllama && (
              <>
                <button onClick={() => run(onSyncOllama)} disabled={syncingOllama}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 disabled:opacity-40 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {syncingOllama ? "Syncing Ollama…" : "Sync Ollama → CLIProxy"}
                </button>
                <button onClick={() => run(onPreviewSyncOllama9router)} disabled={previewing9router}
                  className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-emerald-700 disabled:opacity-40 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 01-2 2v4a2 2 0 012 2h14a2 2 0 012-2v-4a2 2 0 01-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  {previewing9router ? "Previewing…" : "Sync Ollama → 9router"}
                </button>
              </>
            )}

            {/* ChatGPT sync */}
            {showChatGPT && (
              <>
                <button onClick={() => run(onSyncProxy)} disabled={syncing}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 disabled:opacity-40 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {syncing ? "Syncing…" : "Sync CLIProxy"}
                </button>
                <button onClick={() => run(onSyncAuth)} disabled={syncingAuth}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700 disabled:opacity-40 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  {syncingAuth ? "Syncing Auth…" : "Sync Auth"}
                </button>
              </>
            )}

            {/* Kling */}
            {showKling && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={() => run(onKlingSession)}
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 text-purple-700 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Kling Session
                </button>
              </>
            )}

            {/* OR destructive actions */}
            {showOR && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={() => run(onCheckAndCleanOR)} disabled={cleaningOR}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-700 disabled:opacity-40 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {cleaningOR ? `OR Clean… ${cleanORProgress}` : "Check & Clean OR"}
                </button>
                <button onClick={() => run(onFixORPrivacy)} disabled={fixingPrivacy}
                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-indigo-700 disabled:opacity-40 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {fixingPrivacy ? `Fix Privacy… ${fixPrivacyProgress}` : "Fix OR Privacy"}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
