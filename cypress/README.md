# Cypress E2E Tests

End-to-end test suite for iVault Pro covering the five primary user journeys.

## Test File

`ivault-flow.cy.ts`

## Test Flows

| Flow | Description |
|---|---|
| Flow 1 | Loads the dashboard and verifies net worth cards and quick action tiles are visible |
| Flow 2 | Opens the WhatsApp simulator, submits a natural language expense message, and asserts the parsed response |
| Flow 3 | Navigates to the Medicine Tracker, logs a dose, and verifies the stock depletion UI |
| Flow 4 | Opens Settings, switches to the Emerald Wealth theme, and asserts the `--theme-primary` CSS variable is `#047857` |
| Flow 5 | Navigates to the Password Vault, unlocks it with the default PIN `1234`, and verifies the vault content is visible |

## Running Tests

```bash
# Interactive mode
npx cypress open

# Headless CI mode
npx cypress run
```

The app must be running on `http://localhost:3000` before executing tests (`npm run dev`).
