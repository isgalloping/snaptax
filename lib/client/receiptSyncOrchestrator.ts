import {
  fetchReceiptList,
  fetchReceiptSyncPage,
  type ReceiptListResponse,
} from "@/lib/client/receiptApi";
import { readDeletedReceiptIds } from "@/lib/client/receiptDeleteTombstones";
import {
  persistMergedReceipts,
  remoteReceiptsToLocal,
  UI_RECEIPT_LIMIT,
  unionMergeLWW,
} from "@/lib/client/receiptSync";
import {
  loadTopByUpdatedAt,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";

export type MergeServerReceiptsDeps = {
  fetchList?: (limit?: number) => Promise<ReceiptListResponse>;
  fetchSyncPages?: () => Promise<ReceiptListResponse>;
  readTombstones?: () => Promise<Set<string>>;
  loadVisible?: (limit: number) => Promise<StoredReceipt[]>;
  persistMerged?: typeof persistMergedReceipts;
  visibleLimit?: number;
  /** When true, prefer paginated /api/receipts/sync over top-N list. */
  useSyncPages?: boolean;
};

export type MergeServerReceiptsResult = {
  visible: StoredReceipt[];
  taxSavedEstimate: number;
};

export type CompleteSyncOptions = { requireComplete?: boolean };

export function assertCompleteSyncAvailable(
  isOnline: boolean,
  opts?: CompleteSyncOptions,
): void {
  if (!isOnline && opts?.requireComplete) {
    throw new Error("FETCH_RECEIPT_SYNC_FAILED");
  }
}

export async function fetchAllRemoteReceiptsViaSync(): Promise<ReceiptListResponse> {
  const receipts = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const page = await fetchReceiptSyncPage(cursor);
    receipts.push(...page.receipts);
    cursor = page.nextCursor ?? undefined;
    hasMore = page.hasMore;
  }

  return { receipts, taxSavedEstimate: 0 };
}

export async function mergeServerReceiptsIntoLocal(
  local: StoredReceipt[],
  deps: MergeServerReceiptsDeps = {},
): Promise<MergeServerReceiptsResult> {
  const fetchList = deps.fetchList ?? fetchReceiptList;
  const fetchSyncPages = deps.fetchSyncPages ?? fetchAllRemoteReceiptsViaSync;
  const readTombstones = deps.readTombstones ?? readDeletedReceiptIds;
  const loadVisible = deps.loadVisible ?? loadTopByUpdatedAt;
  const persistMerged = deps.persistMerged ?? persistMergedReceipts;
  const visibleLimit = deps.visibleLimit ?? UI_RECEIPT_LIMIT;

  const tombstones = await readTombstones();
  let remoteResponse: ReceiptListResponse;
  if (deps.useSyncPages) {
    remoteResponse = await fetchSyncPages();
  } else {
    remoteResponse = await fetchList(visibleLimit);
  }

  const { receipts: remote, taxSavedEstimate } = remoteResponse;
  const filteredRemote = remote.filter((r) => !tombstones.has(r.id));

  const fullMerged = unionMergeLWW(
    local,
    remoteReceiptsToLocal(filteredRemote),
  );
  await persistMerged(fullMerged, local);

  const visible = await loadVisible(visibleLimit);
  return { visible, taxSavedEstimate };
}
