  /* ---------- presets ---------- */
  const PRESETS = {
    blank: { label: 'Blank: enter your own numbers', make: () => ({
      holders: [{ id: nid(), name: 'Founder', type: 'founder', shares: 8000000 }],
      optionsGranted: 0, poolUnallocated: 0,
      instruments: [], rounds: [], seniority: 'standard',
      runway: { cash: 250000, burn: 25000, burnGrowth: 2, mrr: 0, growth: 10, raise: 1000000, raiseMonth: 6 }
    }) },
    yc: { label: 'YC deal → Seed → Series A', make: () => ({
      holders: [{ id: nid(), name: 'Founder A', type: 'founder', shares: 4500000 }, { id: nid(), name: 'Founder B', type: 'founder', shares: 4500000 }],
      optionsGranted: 300000, poolUnallocated: 700000,
      instruments: [
        { id: nid(), name: 'YC $125K for 7%', kind: 'post', amount: 125000, cap: 125000 / 0.07, discount: 0, rate: 0, months: 0 },
        { id: nid(), name: 'YC uncapped MFN', kind: 'mfn', amount: 375000, cap: 0, discount: 0, rate: 0, months: 0 },
        { id: nid(), name: 'Demo Day angels', kind: 'post', amount: 1000000, cap: 15000000, discount: 0, rate: 0, months: 0 }
      ],
      rounds: [
        { id: nid(), name: 'Seed', preMoney: 16000000, raise: 4000000, poolPct: 10, multiple: 1, participating: false },
        { id: nid(), name: 'Series A', preMoney: 45000000, raise: 15000000, poolPct: 12, multiple: 1, participating: false }
      ],
      seniority: 'standard',
      runway: { cash: 1400000, burn: 110000, burnGrowth: 3, mrr: 18000, growth: 9, raise: 4000000, raiseMonth: 7 }
    }) },
    angels: { label: 'Note + angel SAFEs → priced Seed', make: () => ({
      holders: [{ id: nid(), name: 'Founder A', type: 'founder', shares: 4000000 }, { id: nid(), name: 'Founder B', type: 'founder', shares: 4000000 }, { id: nid(), name: 'Advisor', type: 'common', shares: 150000 }],
      optionsGranted: 250000, poolUnallocated: 600000,
      instruments: [
        { id: nid(), name: 'Friends & family note', kind: 'note', amount: 100000, cap: 4000000, discount: 20, rate: 6, months: 18 },
        { id: nid(), name: 'Pre-seed SAFE', kind: 'post', amount: 300000, cap: 6000000, discount: 0, rate: 0, months: 0 },
        { id: nid(), name: 'Angel SAFE', kind: 'post', amount: 400000, cap: 9000000, discount: 15, rate: 0, months: 0 }
      ],
      rounds: [{ id: nid(), name: 'Seed', preMoney: 12000000, raise: 3000000, poolPct: 10, multiple: 1, participating: false }],
      seniority: 'standard',
      runway: { cash: 650000, burn: 55000, burnGrowth: 2, mrr: 6000, growth: 12, raise: 3000000, raiseMonth: 5 }
    }) },
    tough: { label: 'Tough terms: participating Series B', make: () => {
      const s = PRESETS.yc.make();
      s.rounds.push({ id: nid(), name: 'Series B', preMoney: 70000000, raise: 30000000, poolPct: 10, multiple: 1.5, participating: true });
      s.runway = { cash: 9000000, burn: 900000, burnGrowth: 2, mrr: 350000, growth: 5, raise: 30000000, raiseMonth: 6 };
      return s;
    } },
    solo: { label: 'Solo founder, clean priced Seed', make: () => ({
      holders: [{ id: nid(), name: 'Founder', type: 'founder', shares: 9000000 }],
      optionsGranted: 0, poolUnallocated: 1000000,
      instruments: [],
      rounds: [{ id: nid(), name: 'Seed', preMoney: 8000000, raise: 2000000, poolPct: 10, multiple: 1, participating: false }],
      seniority: 'standard',
      runway: { cash: 250000, burn: 30000, burnGrowth: 2, mrr: 4000, growth: 15, raise: 2000000, raiseMonth: 4 }
    }) }
  };
