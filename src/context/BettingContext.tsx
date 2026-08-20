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
  stake: number;
  oddsAtPlacement: number;
  potentialPayout: number;
  status: "Pending" | "Won" | "Lost";
  placedAt: string;
};

export type BetSlipItem = {
  eventId: string;
  eventTitle: string;
  outcome: BetOutcome;
};

interface BettingContextType {
  balance: number;
  activeBets: ActiveBet[];
  betSlip: BetSlipItem | null;
  openBetSlip: (item: BetSlipItem) => void;
  closeBetSlip: () => void;
  placeBet: (stake: number) => boolean;
  // Deducts a stake directly from the wallet (the actual escrow lock), independent of the
  // bet slip flow. Used e.g. when a user creates a brand new market and funds its pool.
  deductStake: (stake: number) => boolean;
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

  const placeBet = (stake: number): boolean => {
    if (!betSlip) return false;
    const roundedStake = toCents(stake);
    if (!(roundedStake > 0) || roundedStake > toCents(balance)) return false;

    const newBet: ActiveBet = {
      id: `bet-${Date.now()}`,
      eventId: betSlip.eventId,
      eventTitle: betSlip.eventTitle,
      outcomeLabel: betSlip.outcome.label,
      stake: roundedStake,
      oddsAtPlacement: betSlip.outcome.odds,
      potentialPayout: toCents(roundedStake * betSlip.outcome.odds),
      status: "Pending",
      placedAt: new Date().toISOString(),
    };

    // Actually lock the stake in escrow by deducting it from the spendable balance.
    setBalance(prev => toCents(prev - roundedStake));
    setActiveBets(prev => [newBet, ...prev]);
    setBetSlip(null);
    return true;
  };

  return (
    <BettingContext.Provider value={{ balance, activeBets, betSlip, openBetSlip, closeBetSlip, placeBet, deductStake }}>
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
