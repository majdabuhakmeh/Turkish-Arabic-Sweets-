import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveBranches, findNearestBranches } from "@/lib/branches.functions";

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

type BranchCtx = {
  branches: Branch[];
  selected: Branch | null;
  selectBranch: (id: string) => void;
  detectLocation: () => Promise<void>;
  detecting: boolean;
  located: { lat: number; lng: number } | null;
};

const Ctx = createContext<BranchCtx | null>(null);
const STORAGE_KEY = "royalsweets.branch";

export function BranchProvider({ children }: { children: ReactNode }) {
  const list = useServerFn(listActiveBranches);
  const findNear = useServerFn(findNearestBranches);
  const [located, setLocated] = useState<{ lat: number; lng: number } | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  // Auto-pick: stored → nearest in-range → first
  useEffect(() => {
    if (!branches.length) return;
    if (selectedId && branches.some((b) => b.id === selectedId)) return;
    const inRange = branches.find((b) => b.in_range);
    const next = inRange ?? branches[0];
    setSelectedId(next.id);
  }, [branches, selectedId]);

  const selected = branches.find((b) => b.id === selectedId) ?? null;

  const selectBranch = useCallback((id: string) => {
    setSelectedId(id);
    try { window.localStorage.setItem(STORAGE_KEY, id); } catch {}
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

  return (
    <Ctx.Provider value={{ branches, selected, selectBranch, detectLocation, detecting, located }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBranch must be used inside BranchProvider");
  return ctx;
}
