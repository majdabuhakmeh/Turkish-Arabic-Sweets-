import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveBranches, findNearestBranches, getBranchInventoryBySlug } from "@/lib/branches.functions";

export type Branch = {
  id: string;
  restaurant_id: string;
  name: string;
  code: string;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  delivery_radius_km?: number | string | null;
  delivery_fee?: number | string | null;
  eta_minutes?: number | null;
  distance_km?: number;
  in_range?: boolean;
};

export type BranchInventoryEntry = {
  available: boolean;
  price_override: number | null;
  stock: number | null;
};

type BranchCtx = {
  branches: Branch[];
  selected: Branch | null;
  selectBranch: (id: string) => void;
  detectLocation: () => Promise<void>;
  detecting: boolean;
  located: { lat: number; lng: number } | null;
  inventory: Record<string, BranchInventoryEntry>;
  inventoryReady: boolean;
  isAvailable: (slug: string) => boolean;
  effectivePrice: (slug: string, basePrice: number) => number;
  /** Scope branch selection to a specific restaurant (e.g. on `/r/:slug`). Pass null to clear. */
  setRestaurantScope: (restaurantId: string | null) => void;
};

const Ctx = createContext<BranchCtx | null>(null);
const STORAGE_KEY = "royalsweets.branch"; // global last-selected (for /menu and unscoped pages)
const STORAGE_MAP_KEY = "royalsweets.branchByRestaurant"; // { [restaurantId]: branchId }

function readMap(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string>) {
  try {
    window.localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(map));
  } catch {}
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const list = useServerFn(listActiveBranches);
  const findNear = useServerFn(findNearestBranches);
  const [located, setLocated] = useState<{ lat: number; lng: number } | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scopeRestaurantId, setScopeRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v) setSelectedId(v);
    } catch {}
  }, []);

  const { data: rawBranches = [] } = useQuery({
    queryKey: ["branches", "active"],
    queryFn: () => list({ data: {} }),
    staleTime: 60_000,
  });

  const { data: ranked } = useQuery({
    queryKey: ["branches", "nearest", located?.lat, located?.lng],
    queryFn: () => findNear({ data: { lat: located!.lat, lng: located!.lng } }),
    enabled: !!located,
    staleTime: 60_000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branches: Branch[] = (ranked ?? rawBranches) as any;

  // When the scope changes, prefer the per-restaurant stored branch over the global one.
  useEffect(() => {
    if (!scopeRestaurantId) return;
    if (!branches.length) return;
    const map = readMap();
    const storedForRestaurant = map[scopeRestaurantId];
    if (storedForRestaurant && branches.some((b) => b.id === storedForRestaurant)) {
      if (selectedId !== storedForRestaurant) setSelectedId(storedForRestaurant);
      return;
    }
    // No stored choice for this restaurant — if current selection belongs to another
    // restaurant, switch to a sensible default within scope.
    const current = branches.find((b) => b.id === selectedId);
    if (current && current.restaurant_id === scopeRestaurantId) return;
    const scoped = branches.filter((b) => b.restaurant_id === scopeRestaurantId);
    if (!scoped.length) return;
    const inRange = scoped.find((b) => b.in_range);
    const next = inRange ?? scoped[0];
    setSelectedId(next.id);
  }, [scopeRestaurantId, branches, selectedId]);

  // Unscoped auto-pick: stored → nearest in-range → first
  useEffect(() => {
    if (scopeRestaurantId) return;
    if (!branches.length) return;
    if (selectedId && branches.some((b) => b.id === selectedId)) return;
    const inRange = branches.find((b) => b.in_range);
    const next = inRange ?? branches[0];
    setSelectedId(next.id);
  }, [branches, selectedId, scopeRestaurantId]);

  const selected = branches.find((b) => b.id === selectedId) ?? null;

  const selectBranch = useCallback(
    (id: string) => {
      setSelectedId(id);
      try {
        window.localStorage.setItem(STORAGE_KEY, id);
      } catch {}
      // Persist per-restaurant choice for the branch's restaurant.
      const branch = branches.find((b) => b.id === id);
      if (branch?.restaurant_id) {
        const map = readMap();
        map[branch.restaurant_id] = id;
        writeMap(map);
      }
    },
    [branches],
  );

  const setRestaurantScope = useCallback((restaurantId: string | null) => {
    setScopeRestaurantId(restaurantId);
  }, []);

  const detectLocation = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setDetecting(true);
    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocated({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          resolve();
        },
        () => resolve(),
        { timeout: 8000 },
      );
    });
    setDetecting(false);
  }, []);

  const fetchInventory = useServerFn(getBranchInventoryBySlug);
  const { data: inventory = {}, isSuccess: inventoryReady } = useQuery({
    queryKey: ["branch-inventory", selected?.id],
    queryFn: () => fetchInventory({ data: { branchId: selected!.id } }),
    enabled: !!selected?.id,
    staleTime: 30_000,
  });

  const helpers = useMemo(() => {
    const isAvailable = (slug: string) => {
      const e = inventory[slug];
      if (!e) return true;
      if (!e.available) return false;
      if (e.stock != null && e.stock <= 0) return false;
      return true;
    };
    const effectivePrice = (slug: string, basePrice: number) => {
      const o = inventory[slug]?.price_override;
      return o != null ? o : basePrice;
    };
    return { isAvailable, effectivePrice };
  }, [inventory]);

  return (
    <Ctx.Provider
      value={{
        branches,
        selected,
        selectBranch,
        detectLocation,
        detecting,
        located,
        inventory,
        inventoryReady,
        setRestaurantScope,
        ...helpers,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBranch must be used inside BranchProvider");
  return ctx;
}
