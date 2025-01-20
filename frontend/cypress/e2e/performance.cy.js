describe('Performance Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads the dashboard within acceptable time', () => {
    cy.login('test@example.com', 'password123');
    
    cy.window().then((win) => {
      const performance = win.performance;
      const navigationStart = performance.timing.navigationStart;
      const loadEventEnd = performance.timing.loadEventEnd;
      const loadTime = loadEventEnd - navigationStart;
      
      expect(loadTime).to.be.lessThan(3000); // Should load within 3 seconds
    });
  });

  it('handles large shopping lists efficiently', () => {
    cy.login('test@example.com', 'password123');
    
    // Add 100 items to test performance
    for (let i = 0; i < 100; i++) {
      cy.get('[data-testid="add-item-input"]').type(`Item ${i}{enter}`);
    }
    
    // Measure scroll performance
    cy.window().then((win) => {
      const startTime = performance.now();
      cy.get('[data-testid="shopping-list"]').scrollTo('bottom');
      const endTime = performance.now();
      const scrollTime = endTime - startTime;
      
      expect(scrollTime).to.be.lessThan(100); // Scroll should be smooth
    });
  });

  it('maintains real-time sync performance', () => {
    cy.login('test@example.com', 'password123');
    
    // Measure time for real-time updates
    cy.window().then((win) => {
      const startTime = performance.now();
      
      cy.get('[data-testid="add-item-input"]').type('Test Item{enter}');
      
      // Wait for the item to appear in another session
      cy.get('[data-testid="shopping-list-item"]').should('contain', 'Test Item');
      
      const endTime = performance.now();
      const syncTime = endTime - startTime;
      
      expect(syncTime).to.be.lessThan(1000); // Real-time sync should be fast
    });
  });
});
