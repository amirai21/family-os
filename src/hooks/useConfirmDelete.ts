/**
 * useConfirmDelete — lightweight hook to gate any delete action behind a
 * confirmation dialog.
 *
 * Usage:
 *   const { confirmVisible, requestDelete, confirmDelete, dismissConfirm } =
 *     useConfirmDelete();
 *
 *   // Replace: onPress={() => deleteItem(id)}
 *   // With:    onPress={() => requestDelete(() => deleteItem(id))}
 *
 *   // Then mount once per screen:
 *   <ConfirmDeleteModal
 *     visible={confirmVisible}
 *     onConfirm={confirmDelete}
 *     onDismiss={dismissConfirm}
 *   />
 */

import { useState, useCallback } from "react";

export function useConfirmDelete() {
  // Store the pending action as a wrapped function so React's functional
  // setState form ( setState(fn) calls fn to compute new state ) doesn't
  // accidentally invoke it:  setState(() => action)  →  state becomes `action`.
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requestDelete = useCallback((action: () => void) => {
    setPendingAction(() => action);
  }, []);

  const confirmDelete = useCallback(() => {
    pendingAction?.();
    setPendingAction(null);
  }, [pendingAction]);

  const dismissConfirm = useCallback(() => {
    setPendingAction(null);
  }, []);

  return {
    confirmVisible: pendingAction !== null,
    requestDelete,
    confirmDelete,
    dismissConfirm,
  };
}
