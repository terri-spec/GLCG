# Future Katie

An ADHD-friendly, browser-based career exploration prototype designed to help Katie try on possible advanced-degree careers without ranking them or forcing a final decision.

## Prototype scope

- Five problem-based entry doors
- Introductions, education pathways, UToledo planning notes, and job options for ten career worlds
- One complete Biomedical Engineer simulation using a wearable heart-monitor investigation
- Reflection, information-density controls, safe stopping points, comparison, local progress saving, and browser-print styling
- Placeholder boundaries for the remaining nine simulations

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Build with:

```bash
npm run build
```

Career content is maintained in `app/career-data.ts`. Progress is stored only in the browser on the current device.
