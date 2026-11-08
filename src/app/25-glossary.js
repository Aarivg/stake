  /* ---------- plain-English definitions ---------- */
  const GLOSS = {
    shares: 'Common shares issued today, usually to founders and early employees or advisors.',
    optionsGranted: 'Options already promised to employees. They count in ownership and are treated as exercised in the exit waterfall.',
    pool: 'Shares set aside for future hires but not yet granted. Investors count the pool as part of your side of the table, so it dilutes you, not them.',
    post: 'Post-money SAFE, the YC standard since 2018. The cap is measured after every SAFE converts, so the holder’s percentage is locked in: amount ÷ cap.',
    pre: 'Pre-money SAFE. The cap is measured before the SAFE money comes in, so SAFE holders dilute each other as well as the founders.',
    mfn: 'Uncapped SAFE with a most-favored-nation clause. It copies the best cap and discount of SAFEs issued after it in the same round; with none, it converts at the round price.',
    note: 'Debt that converts into equity at the next priced round. Interest is added to the amount that converts.',
    cap: 'The highest valuation the money converts at. A lower cap means more shares for the investor.',
    discount: 'The investor converts at this percentage off the round price when that beats the cap.',
    convertsAt: 'The priced round where this converts. Pick a later round for a bridge raised between rounds.',
    premoney: 'What the company is worth before the new money. Price per share = pre-money ÷ fully diluted shares before the new money.',
    raise: 'New money from this round’s investors. They get raise ÷ post-money of the company.',
    poolTarget: 'The unallocated pool investors want after the round, as a share of the post-money. Any top-up is created inside the pre-money, so existing holders pay for it (the pool shuffle).',
    liqpref: 'In a sale, preferred holders get this multiple of their money back before common shareholders, unless converting to common pays them more.',
    participating: 'Participating preferred takes its preference and then also shares in what is left, as if it had converted. Founder-unfriendly; uncommon in early rounds.',
    partcap: 'Limits a participating holder’s total payout to this multiple of their investment. Above that, they convert to common instead.',
    antidilution: 'If a later round prices below this one, these investors get extra shares. Broad-based weighted average is the market standard; full ratchet reprices them all the way down to the new price.',
    seniority: 'Newest round first: the latest investors are repaid before earlier ones. Pari passu: every preference shares pro rata.',
    exit: 'What shareholders receive from a sale, after debt and deal fees are paid.',
    alive: 'Paul Graham’s test: on today’s growth and spending, does revenue cover costs before the cash runs out?',
    burnGrowth: 'How fast monthly expenses rise, for example from hiring.'
  };
  const q = k => `<span class="q" tabindex="0" role="button" aria-label="${esc(GLOSS[k])}" data-hover="gloss" data-q="${k}">?</span>`;
  scope = 'static';
  reg('gloss', (e, t) => `<div class="t">What this means</div><div style="font-size:12.5px;line-height:1.45">${esc(GLOSS[t.dataset.q])}</div>`);
  scope = 'view';
  document.addEventListener('focusin', e => {
    const t = e.target;
    if (t.classList && t.classList.contains('q')) { const b = t.getBoundingClientRect(); showTip(hovers.gloss(e, t), b.right, b.bottom); }
  });
  document.addEventListener('focusout', e => { if (e.target.classList && e.target.classList.contains('q')) hideTip(); });
