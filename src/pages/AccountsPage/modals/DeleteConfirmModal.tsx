interface Props {
  serviceFilter: string;
  disabledCount: number;
  deletingDisabled: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteConfirmModal({
  serviceFilter, disabledCount, deletingDisabled, onConfirm, onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => !deletingDisabled && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Xác nhận xóa</h2>
            <p className="text-sm text-gray-500 mt-0.5">Hành động này không thể hoàn tác</p>
          </div>
        </div>
        <p className="text-sm text-gray-700">
          Sẽ có{" "}
          <span className="font-bold text-red-600">{disabledCount}</span>{" "}
          tài khoản{" "}
          {serviceFilter !== "ALL" && <span className="font-semibold">{serviceFilter} </span>}
          ở trạng thái <span className="font-semibold text-red-600">disabled</span> sẽ bị xóa vĩnh viễn.
          Bạn có chắc muốn xóa không?
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} disabled={deletingDisabled} className="btn-secondary text-sm">
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={deletingDisabled}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deletingDisabled ? "Đang xóa..." : "Xóa ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}
