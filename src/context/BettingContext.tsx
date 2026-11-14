"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type BetOutcome = {
  label: string;
  odds: number;
  probability: number;
};

export type ActiveBet = {
  id: string;
  eventId: string;
  eventTitle: string;
  outcomeLabel: string;
  category?: string;
  stake: number;
  oddsAtPlacement: number;
  potentialPayout: number;
  status: "Pending" | "Won" | "Lost";
  placedAt: string;
};

export type BetSlipItem = {
  eventId: string;
  eventTitle: string;
  category?: string;
  outcome: BetOutcome;
};

interface BettingContextType {
  balance: number;
  activeBets: ActiveBet[];
  betSlip: BetSlipItem | null;
  openBetSlip: (item: BetSlipItem) => void;
  closeBetSlip: () => void;
  placeBet: (stake: number) => boolean;
  deductStake: (stake: number) => boolean;
  addActiveBet: (bet: ActiveBet) => void;
  topUpBalance: (amount?: number) => void;
  resetBalance: () => void;
  cancelBet: (betId: string) => void;
}

const BettingContext = createContext<BettingContextType | undefined>(undefined);

// Round to the nearest cent to avoid floating point drift (e.g. 10.1 + 0.2 !== 10.3)
// corrupting the wallet balance or blocking a user from staking their exact balance.
function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function BettingProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(10000.00); // $10,000 virtual balance
  const [activeBets, setActiveBets] = useState<ActiveBet[]>([]);
  const [betSlip, setBetSlip] = useState<BetSlipItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount
  React.useEffect(() => {
    try {
      const savedBalance = localStorage.getItem("sfh_virtual_balance");
      const savedBets = localStorage.getItem("sfh_active_bets");
      
      if (savedBalance) setBalance(parseFloat(savedBalance));
      if (savedBets) setActiveBets(JSON.parse(savedBets));
    } catch (e) {
      console.warn("Failed to load betting data from local storage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage whenever they change
  React.useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("sfh_virtual_balance", balance.toString());
      localStorage.setItem("sfh_active_bets", JSON.stringify(activeBets));
    } catch (e) {
      console.warn("Failed to save betting data to local storage", e);
    }
  }, [balance, activeBets, isLoaded]);

  const openBetSlip = (item: BetSlipItem) => {
    setBetSlip(item);
  };

  const closeBetSlip = () => {
    setBetSlip(null);
  };

  const deductStake = (stake: number): boolean => {
    const roundedStake = toCents(stake);
    if (!(roundedStake > 0) || roundedStake > toCents(balance)) return false;
    setBalance(prev => toCents(prev - roundedStake));
    return true;
  };

  const addActiveBet = (bet: ActiveBet) => {
    setActiveBets(prev => [bet, ...prev]);
  };

  const placeBet = (stake: number): boolean => {
    if (!betSlip) return false;
    const roundedStake = toCents(stake);
    if (!(roundedStake > 0)) return false;

    if (roundedStake > toCents(balance)) return false;
    
    setBalance(prev => toCents(prev - roundedStake));

    const newBet: ActiveBet = {
      id: `bet-${Date.now()}`,
      eventId: betSlip.eventId,
      eventTitle: betSlip.eventTitle,
      outcomeLabel: betSlip.outcome.label,
      category: betSlip.category || "Equities",
      stake: roundedStake,
      oddsAtPlacement: betSlip.outcome.odds,
      potentialPayout: toCents(roundedStake * betSlip.outcome.odds),
      status: "Pending",
      placedAt: new Date().toISOString(),
    };

    setActiveBets(prev => [newBet, ...prev]);
    // Note: Do NOT setBetSlip(null) here. The BetSlipSidebar has a 1.6s success
    // animation (confetti + checkmark) that handles its own closing sequence.
    return true;
  };

  const topUpBalance = (amount = 10000) => {
    const toAdd = toCents(amount);
    setBalance(prev => {
      const next = toCents(prev + toAdd);
      try {
        localStorage.setItem("sfh_virtual_balance", next.toString());
      } catch {}
      return next;
    });
  };

  const resetBalance = () => {
    setBalance(10000.00);
    setActiveBets([]);
    try {
      localStorage.setItem("sfh_virtual_balance", "10000");
      localStorage.setItem("sfh_active_bets", "[]");
    } catch {}
  };

  const cancelBet = (betId: string) => {
    const target = activeBets.find(b => b.id === betId);
    if (!target) return;
    setBalance(prev => {
      const next = toCents(prev + target.stake);
      try {
        localStorage.setItem("sfh_virtual_balance", next.toString());
      } catch {}
      return next;
    });
    setActiveBets(prev => {
      const next = prev.filter(b => b.id !== betId);
      try {
        localStorage.setItem("sfh_active_bets", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <BettingContext.Provider value={{ balance, activeBets, betSlip, openBetSlip, closeBetSlip, placeBet, deductStake, addActiveBet, topUpBalance, resetBalance, cancelBet }}>
      {children}
    </BettingContext.Provider>
  );
}

export function useBetting() {
  const context = useContext(BettingContext);
  if (context === undefined) {
    throw new Error("useBetting must be used within a BettingProvider");
  }
  return context;
}
