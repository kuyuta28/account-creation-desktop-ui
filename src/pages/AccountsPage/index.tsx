import { useState } from "react";
import GmailVariationsModal from "../../components/GmailVariationsModal";
import SyncModal from "../../components/SyncModal";
import FilterBar from "../../components/FilterBar";
import { Account } from "../../api/client";
import { MAILBOX_PROVIDER_SERVICES } from "../../constants/accounts";
import { useAccounts } from "./useAccounts";
import { useAccountActions } from "./useAccountActions";
import { useAACheckSessions } from "../../hooks/useAACheckSessions";
import { useAABatchRelogin } from "../../hooks/useAABatchRelogin";
import AccountsTable from "./AccountsTable";
import ActionsDropdown from "./ActionsDropdown";
import ColsToggle from "./ColsToggle";
import AddModal from "./modals/AddModal";
import EditModal from "./modals/EditModal";
import DetailModal from "./modals/DetailModal";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";

export default function AccountsPage() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const [copied, setCopied] = useState<string | null>(null);
  const [showAddModal, setShowAddModal]             = useState(false);
  const [showDeleteDisabledModal, setDeleteModal]   = useState(false);
  const [gmailVariationsAcc, setGmailVariationsAcc] = useState<Account | null>(null);
  const [gmailVariationsService, setGmailVariationsService] = useState("");

  const accounts  = useAccounts(showToast);
  const actions    = useAccountActions({ onRefresh: accounts.load, onToast: showToast });
  const aaCheck       = useAACheckSessions(accounts.load);
  const aaRelogin    = useAABatchRelogin(accounts.load);

  const {
    allAccounts, services, loading, load,
    serviceFilter, setServiceFilter,
    sortKey, sortDir, handleSort,
    filters, updateFilters, resetFilters,
    page, setPage, filtered, sorted, pageData, totalPages,
    serviceCounts, disabledCountForService, activeCount, withKeyCount,
    visibleCols, col, toggleCol,
  } = accounts;

  const {
    checking, batchRunning, batchProgress, checkOne, checkAll,
    syncingOR, syncOpenRouterToCliproxy,
    orPrivacyRunning, orPrivacyProgress, checkORPrivacy,
    cleaningOR, cleanORProgress, checkAndCleanOR,
    fixingPrivacy, fixPrivacyProgress, fixORPrivacy,
    // OR sync modal
    orSyncModalOpen, setOrSyncModalOpen,
    orPreviewLoading, orSyncPreview, previewSyncOR,
    // Ollama
    syncingOllama, syncOllamaToCliproxy,
    syncingOllama9router, previewing9router, previewSyncOllamaTo9router,
    syncing, syncProxy, syncingAuth, syncAuth, launchKlingSession,
    deletingDisabled, deleteDisabled,
    addForm, setAddForm, addError, adding, handleAddAccount, resetAddForm,
    editAcc, setEditAcc, editForm, setEditForm, editError, editing, openEdit, handleEditAccount,
    toggleDisabled, remove,
    detailAcc, setDetailAcc, detailData, detailLoading, detailError, openDetail,
    sync9routerPreview, show9routerModal, setShow9routerModal, syncOllamaTo9router,
  } = actions;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Accounts</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length.toLocaleString()} / {allAccounts.length.toLocaleString()} shown
            &nbsp;·&nbsp;
            <span className="text-emerald-600 font-medium">{activeCount.toLocaleString()} active</span>
            &nbsp;·&nbsp;
            <span className="text-violet-600 font-medium">{withKeyCount.toLocaleString()} with key</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Add */}
          <button onClick={() => setShowAddModal(true)} className="btn-primary gap-1.5 text-xs py-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>

          {/* Check All / AA Check Sessions */}
          {serviceFilter === "ARTIFICIALANALYSIS" ? (
            aaCheck.checkingAll ? (
              <button
                onClick={aaCheck.handleStopCheckSessions}
                className="btn-secondary gap-1.5 text-xs py-2 border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Stop&nbsp;({aaCheck.checkProgress?.checked}/{aaCheck.checkProgress?.total}
                &nbsp;·&nbsp;✓{aaCheck.checkProgress?.valid}
                &nbsp;·&nbsp;⚠{aaCheck.checkProgress?.expired})
              </button>
            ) : (
              <button
                onClick={aaCheck.handleCheckAllSessions}
                className="btn-secondary gap-1.5 text-xs py-2 text-violet-600 border-violet-200 hover:bg-violet-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Check Sessions
              </button>
            )
          ) : null}

          {/* AA Batch Relogin — chỉ testmail, chỉ tab AA */}
          {serviceFilter === "ARTIFICIALANALYSIS" && (
            aaRelogin.relogging ? (
              <button
                onClick={aaRelogin.handleStopBatchRelogin}
                className="btn-secondary gap-1.5 text-xs py-2 border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Stop Relogin&nbsp;({aaRelogin.reloginProgress?.done}/{aaRelogin.reloginProgress?.total}
                &nbsp;·&nbsp;✓{aaRelogin.reloginProgress?.success}
                &nbsp;·&nbsp;✗{aaRelogin.reloginProgress?.failed})
              </button>
            ) : (
              <button
                onClick={aaRelogin.handleBatchRelogin}
                className="btn-secondary gap-1.5 text-xs py-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Relogin Expired
              </button>
            )
          )}

          {/* Check All (non-AA services) */}
          {serviceFilter !== "ARTIFICIALANALYSIS" && (
            <button onClick={() => checkAll(serviceFilter)} disabled={batchRunning} className="btn-secondary gap-1.5 text-xs py-2">
              {batchRunning ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {batchProgress}
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Check All
                </>
              )}
            </button>
          )}

          {/* Actions dropdown — service-aware */}
          <ActionsDropdown
            serviceFilter={serviceFilter}
            disabledCount={disabledCountForService}
            syncingOR={syncingOR}
            orPrivacyRunning={orPrivacyRunning}
            orPrivacyProgress={orPrivacyProgress}
            cleaningOR={cleaningOR}
            cleanORProgress={cleanORProgress}
            fixingPrivacy={fixingPrivacy}
            fixPrivacyProgress={fixPrivacyProgress}
            onSyncOR={syncOpenRouterToCliproxy}
            onCheckORPrivacy={checkORPrivacy}
            onCheckAndCleanOR={checkAndCleanOR}
            onFixORPrivacy={fixORPrivacy}
            syncingOllama={syncingOllama}
            onSyncOllama={syncOllamaToCliproxy}
            syncingOllama9router={syncingOllama9router}
            previewing9router={previewing9router}
            onPreviewSyncOllama9router={previewSyncOllamaTo9router}
            syncing={syncing}
            syncingAuth={syncingAuth}
            onSyncProxy={syncProxy}
            onSyncAuth={syncAuth}
            onKlingSession={launchKlingSession}
            onDeleteDisabled={() => setDeleteModal(true)}
          />

          {/* Columns toggle */}
          <ColsToggle visibleCols={visibleCols} onToggle={toggleCol} />

          {/* Refresh */}
          <button onClick={load} aria-label="Refresh" className="btn-secondary py-2" disabled={loading}>
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Service tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {services.map((s) => (
          <button
            key={s}
            onClick={() => { setServiceFilter(s); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
              serviceFilter === s
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {s}
            <span className={`ml-1.5 text-xs ${serviceFilter === s ? "text-brand-400" : "text-gray-400"}`}>
              {serviceCounts[s] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onChange={updateFilters}
        onReset={resetFilters}
        activeCount={filtered.length}
      />

      {/* Table */}
      <AccountsTable
        pageData={pageData}
        loading={loading}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        sortedCount={sorted.length}
        visibleCols={visibleCols}
        col={col}
        checking={checking}
        copied={copied}
        setCopied={setCopied}
        onToast={showToast}
        onCheckOne={checkOne}
        onOpenDetail={openDetail}
        onOpenEdit={openEdit}
        onToggleDisabled={toggleDisabled}
        onRemove={remove}
        onGmailVariations={(acc) => { setGmailVariationsAcc(acc); setGmailVariationsService(""); }}
      />

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {showDeleteDisabledModal && (
        <DeleteConfirmModal
          serviceFilter={serviceFilter}
          disabledCount={disabledCountForService}
          deletingDisabled={deletingDisabled}
          onConfirm={() => deleteDisabled(serviceFilter)}
          onClose={() => !deletingDisabled && setDeleteModal(false)}
        />
      )}

      {showAddModal && (
        <AddModal
          services={services}
          form={addForm}
          setForm={setAddForm}
          error={addError}
          adding={adding}
          onSubmit={handleAddAccount}
          onClose={() => { setShowAddModal(false); resetAddForm(); }}
        />
      )}

      {detailAcc && (
        <DetailModal
          acc={detailAcc}
          data={detailData}
          loading={detailLoading}
          error={detailError}
          onClose={() => setDetailAcc(null)}
        />
      )}

      {editAcc && (
        <EditModal
          acc={editAcc}
          form={editForm}
          setForm={setEditForm}
          error={editError}
          editing={editing}
          onSubmit={handleEditAccount}
          onClose={() => setEditAcc(null)}
        />
      )}

      {gmailVariationsAcc && (
        <GmailVariationsModal
          baseEmail={gmailVariationsAcc.email}
          service={gmailVariationsService || "ELEVENLABS"}
          availableServices={services.filter((s) => s !== "ALL" && !MAILBOX_PROVIDER_SERVICES.has(s))}
          onServiceChange={setGmailVariationsService}
          onClose={() => { setGmailVariationsAcc(null); setGmailVariationsService(""); }}
          onAdded={(count) => { showToast(`Đã thêm ${count} Gmail variations`, true); load(); }}
        />
      )}

      {/* Sync Ollama → 9router Modal */}
      <SyncModal
        open={show9routerModal}
        onClose={() => setShow9routerModal(false)}
        title="Sync Ollama → 9router"
        targetName="9router"
        items={(sync9routerPreview?.items || []).map((i: any) => ({
          ...i,
          exists_in_target: i.exists_in_9router,
        }))}
        loading={previewing9router}
        onSync={(emails) => syncOllamaTo9router(emails)}
        syncing={syncingOllama9router}
        total={sync9routerPreview?.total || 0}
        newCount={sync9routerPreview?.new_count || 0}
        existsCount={sync9routerPreview?.exists_count || 0}
      />

      {/* Sync OpenRouter → CLIProxy Modal */}
      <SyncModal
        open={orSyncModalOpen}
        onClose={() => setOrSyncModalOpen(false)}
        title="Sync OpenRouter → CLIProxy"
        targetName="CLIProxy"
        items={orSyncPreview?.items || []}
        loading={orPreviewLoading}
        onSync={(emails) => syncOpenRouterToCliproxy(emails)}
        syncing={syncingOR}
        total={orSyncPreview?.total || 0}
        newCount={orSyncPreview?.will_sync || 0}
        existsCount={orSyncPreview?.exists_count || 0}
      />
    </div>
  );
}
