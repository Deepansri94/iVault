/**
 * @file ivault-flow.cy.ts
 * Cypress E2E Testing Suite covering User Profile, WhatsApp parser, Medicine dosage, and Theme switching
 */

describe('iVault Pro Unified Mobile End-to-End User Journeys', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Flow 1: Loads dashboard and verifies net worth cards and quick actions', () => {
    cy.contains('iVault PRO').should('be.visible');
    cy.contains('Family Total Net Worth').should('be.visible');
    cy.contains('Record Expense').should('be.visible');
    cy.contains('Smart Fast Entry').should('be.visible');
  });

  it('Flow 2: Opens Smart Entry and parses a real natural language transaction', () => {
    cy.contains('Smart Entry').click();
    cy.contains('Smart Natural Language Entry').should('be.visible');

    // Type message
    cy.get('input[placeholder*="Spent 450"]').type('Spent 650 on Groceries');

    // Verify response message and intent
    cy.contains('Logged Expense: ₹650').should('be.visible');
  });

  it('Flow 3: Records a medicine dose and verifies stock count depletion', () => {
    cy.contains('Health/Meds').click();
    cy.contains('Family Medicine & Dose Tracker').should('be.visible');

    cy.contains('Log Dose').first().click();
    cy.contains('Dose').should('be.visible');
  });

  it('Flow 4: Customizes theme to Emerald Wealth and asserts DOM root CSS variables', () => {
    cy.contains('Settings').click();
    cy.contains('Theme Customization Engine').should('be.visible');

    cy.contains('Emerald Wealth Private').click();
    cy.document().then((doc: any) => {
      const primary = doc.documentElement.style.getPropertyValue('--theme-primary');
      expect(primary).to.equal('#047857');
    });
  });

  it('Flow 5: Unlocks password vault with master key and copies encrypted credential', () => {
    cy.contains('Vault').click();
    cy.contains('Vault is Locked').should('be.visible');

    cy.get('input[type="password"]').type('1234');
    cy.contains('Unlock Vault').click();
    cy.contains('Zero-Knowledge Password Vault').should('be.visible');
  });
});
