import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect to sign in when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/auth/signin');
  });

  test('should display sign in page', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await expect(page.locator('h1')).toContainText('Welcome to Dayflow');
    await expect(page.locator('text=Sign in to access your daily planner')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with GitHub")')).toBeVisible();
  });

  test('should redirect to dashboard after sign in', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Mock successful authentication
    await page.route('**/api/auth/signin/google', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/dashboard',
        },
      });
    });
    
    await page.click('button:has-text("Continue with Google")');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle sign out', async ({ page }) => {
    // Sign in first
    await page.goto('/auth/signin');
    await page.route('**/api/auth/signin/google', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/dashboard',
        },
      });
    });
    await page.click('button:has-text("Continue with Google")');
    await expect(page).toHaveURL('/dashboard');
    
    // Sign out
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="sign-out"]');
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/auth/signin');
  });
});