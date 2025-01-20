describe('User Journey', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('completes the main user journey', () => {
    // Login
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    // Create a new household
    cy.get('[data-testid="create-household-button"]').click();
    cy.get('[data-testid="household-name-input"]').type('My Family');
    cy.get('[data-testid="submit-household-button"]').click();

    // Create a shopping list
    cy.get('[data-testid="create-list-button"]').click();
    cy.get('[data-testid="list-name-input"]').type('Groceries');
    cy.get('[data-testid="submit-list-button"]').click();

    // Add items to the list
    cy.get('[data-testid="add-item-input"]').type('Milk');
    cy.get('[data-testid="add-item-button"]').click();

    // Verify item was added
    cy.get('[data-testid="shopping-list-item"]').should('contain', 'Milk');

    // Mark item as complete
    cy.get('[data-testid="item-checkbox"]').click();
    cy.get('[data-testid="shopping-list-item"]').should('have.class', 'completed');

    // Share list with household member
    cy.get('[data-testid="share-list-button"]').click();
    cy.get('[data-testid="member-email-input"]').type('family@example.com');
    cy.get('[data-testid="share-submit-button"]').click();

    // Verify sharing confirmation
    cy.get('[data-testid="share-confirmation"]').should('be.visible');
  });
});
