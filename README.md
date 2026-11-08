# Stake

A cap table, SAFE and exit simulator for founders. See what you actually own after your SAFEs convert and each round closes, and what you take home when the company sells.

**[Open the live app →](https://aarivg.github.io/stake/)**

![30-second demo of Stake](docs/demo.gif)

## Features

- **SAFEs and notes:** post-money, pre-money and uncapped MFN SAFEs, and convertible notes, with caps, discounts and bridge rounds
- **Priced rounds:** Seed through Series G, the option pool shuffle, liquidation preferences, participation and anti-dilution
- **Exit waterfall:** drag an exit value to see every holder's payout
- **Runway:** months of cash, default alive or dead, and how much to raise
- **Scenarios:** save, compare side by side, share as a link
- **Learn mode and Pro view:** an 8-lesson course for beginners; a sensitivity table, goal seek and a command palette (⌘K) for experts

The math is covered by tests in [`tests/`](tests), including YC's own SAFE examples. For modelling and learning, not legal or investment advice.

## Run locally

Open `index.html` in a browser. To work on the code (Node 18+):

```bash
npm test         # run the tests
npm run build    # rebuild index.html from src/
```

## License

MIT © Aariv Gupta
