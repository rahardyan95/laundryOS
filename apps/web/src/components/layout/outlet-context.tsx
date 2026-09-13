"use client";

import { createContext, useContext } from "react";

interface OutletState {
  outletId: string;
  setOutletId: (id: string) => void;
}

export const OutletContext = createContext<OutletState>({
  outletId: "",
  setOutletId: () => {},
});

export function useOutlet(): OutletState {
  return useContext(OutletContext);
}
