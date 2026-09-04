import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication Flow
 * 
 * Tests the complete user journey:
 * - Registration
 * - Login
 * - Dashboard access
 * - Protected route behavior
 */

test.describe('Authentication Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'password123';
  const testFullName = 'Maria Silva';
  const testTenantName = `Salão Teste ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should redirect unauthenticated user to login when accessing dashboard', async ({ page }) => {
    // Attempt to access dashboard without authentication
    await page.goto('/app/dashboard');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should complete full registration and login flow', async ({ page }) => {
    // 1. Navigate to register page
    await page.goto('/register');
    await expect(page.locator('h1, h2, h3')).toContainText('Criar Conta');

    // 2. Fill registration form
    await page.fill('input[name="fullName"]', testFullName);
    await page.fill('input[name="tenantName"]', testTenantName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    // 3. Submit form
    await page.click('button[type="submit"]');

    // 4. Should redirect to dashboard after successful registration
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Dashboard');

    // 5. Sign out
    await page.click('button:has-text("Sair")');
    await expect(page).toHaveURL(/\/login/);

    // 6. Login with the created account
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // 7. Should be back in dashboard
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    // Try to login with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('[role="alert"]')).toContainText('E-mail ou senha incorretos');
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.goto('/login');

    // Try to submit with short password
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', '123');
    
    // HTML5 validation should prevent submission
    const passwordInput = page.locator('input[name="password"]');
    const validationMessage = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should navigate between login and register pages', async ({ page }) => {
    // Start at login
    await page.goto('/login');
    await expect(page.locator('h1, h2, h3')).toContainText('Entrar');

    // Click "Criar conta" link
    await page.click('text=Criar conta');
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('h1, h2, h3')).toContainText('Criar Conta');

    // Click "Fazer login" link
    await page.click('text=Fazer login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1, h2, h3')).toContainText('Entrar');
  });
});

test.describe('Accessibility', () => {
  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login');

    // Check for proper form labels
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="password"]')).toBeFocused();
  });

  test('register page should be accessible', async ({ page }) => {
    await page.goto('/register');

    // Check for proper form labels
    await expect(page.locator('label[for="fullName"]')).toBeVisible();
    await expect(page.locator('label[for="tenantName"]')).toBeVisible();
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
  });
});
