import {
  fetchReceiptList,
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
  readTombstones?: () => Promise<Set<string>>;
  loadVisible?: (limit: number) => Promise<StoredReceipt[]>;
  persistMerged?: typeof persistMergedReceipts;
  visibleLimit?: number;
};

export type MergeServerReceiptsResult = {
  visible: StoredReceipt[];
  taxSavedEstimate: number;
};

export async function mergeServerReceiptsIntoLocal(
  local: StoredReceipt[],
  deps: MergeServerReceiptsDeps = {},
): Promise<MergeServerReceiptsResult> {
  const fetchList = deps.fetchList ?? fetchReceiptList;
  const readTombstones = deps.readTombstones ?? readDeletedReceiptIds;
  const loadVisible = deps.loadVisible ?? loadTopByUpdatedAt;
  const persistMerged = deps.persistMerged ?? persistMergedReceipts;
  const visibleLimit = deps.visibleLimit ?? UI_RECEIPT_LIMIT;

  const tombstones = await readTombstones();
  const { receipts: remote, taxSavedEstimate } = await fetchList(visibleLimit);
  const filteredRemote = remote.filter((r) => !tombstones.has(r.id));

  const fullMerged = unionMergeLWW(
    local,
    remoteReceiptsToLocal(filteredRemote),
  );
  await persistMerged(fullMerged, local);

  const visible = await loadVisible(visibleLimit);
  return { visible, taxSavedEstimate };
}
