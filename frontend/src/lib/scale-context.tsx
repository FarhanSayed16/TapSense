"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "tapsense.building_id";
const DEFAULT_BUILDING = "building_hostel";

type ScaleContextValue = {
  buildingId: string;
  setBuildingId: (id: string) => void;
  overviewPath: string;
};

const ScaleContext = createContext<ScaleContextValue | null>(null);

export function ScaleProvider({ children }: { children: React.ReactNode }) {
  const [buildingId, setBuildingIdState] = useState(DEFAULT_BUILDING);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setBuildingIdState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setBuildingId = useCallback((id: string) => {
    setBuildingIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      buildingId,
      setBuildingId,
      overviewPath: `/api/v1/overview?building_id=${encodeURIComponent(buildingId)}`,
    }),
    [buildingId, setBuildingId],
  );

  return <ScaleContext.Provider value={value}>{children}</ScaleContext.Provider>;
}

export function useScale() {
  const ctx = useContext(ScaleContext);
  if (!ctx) {
    return {
      buildingId: DEFAULT_BUILDING,
      setBuildingId: () => undefined,
      overviewPath: `/api/v1/overview?building_id=${DEFAULT_BUILDING}`,
    };
  }
  return ctx;
}
