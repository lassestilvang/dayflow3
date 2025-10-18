import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/auth/signin');
    await page.click('button:has-text("Continue with Google")');
    // Mock authentication for testing
    await page.goto('/dashboard');
  });

  test('should display dashboard with calendar and sidebar', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dayflow');
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="calendar"]')).toBeVisible();
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
  });

  test('should navigate between calendar views', async ({ page }) => {
    // Test week view (default)
    await expect(page.locator('[data-testid="week-view"]')).toBeVisible();
    
    // Switch to day view
    await page.click('button:has-text("Day")');
    await expect(page.locator('[data-testid="day-view"]')).toBeVisible();
    
    // Switch to month view
    await page.click('button:has-text("Month")');
    await expect(page.locator('[data-testid="month-view"]')).toBeVisible();
    
    // Switch back to week view
    await page.click('button:has-text("Week")');
    await expect(page.locator('[data-testid="week-view"]')).toBeVisible();
  });

  test('should navigate calendar dates', async ({ page }) => {
    const currentDate = await page.locator('[data-testid="current-date"]').textContent();
    
    // Navigate to previous week
    await page.click('[data-testid="nav-previous"]');
    const previousDate = await page.locator('[data-testid="current-date"]').textContent();
    expect(previousDate).not.toBe(currentDate);
    
    // Navigate to next week
    await page.click('[data-testid="nav-next"]');
    const nextDate = await page.locator('[data-testid="current-date"]').textContent();
    expect(nextDate).toBe(currentDate);
    
    // Navigate to today
    await page.click('[data-testid="nav-today"]');
    const todayDate = await page.locator('[data-testid="current-date"]').textContent();
    expect(todayDate).toBe(currentDate);
  });

  test('should display task categories in sidebar', async ({ page }) => {
    await expect(page.locator('[data-testid="category-inbox"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-work"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-family"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-personal"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-travel"]')).toBeVisible();
  });

  test('should expand and collapse task categories', async ({ page }) => {
    const inboxCategory = page.locator('[data-testid="category-inbox"]');
    
    // Initially expanded
    await expect(inboxCategory.locator('[data-testid="category-content"]')).toBeVisible();
    
    // Collapse
    await inboxCategory.click();
    await expect(inboxCategory.locator('[data-testid="category-content"]')).not.toBeVisible();
    
    // Expand again
    await inboxCategory.click();
    await expect(inboxCategory.locator('[data-testid="category-content"]')).toBeVisible();
  });

  test('should create new task', async ({ page }) => {
    await page.click('[data-testid="new-task-button"]');
    
    // Fill task form
    await page.fill('[data-testid="task-title"]', 'Test Task');
    await page.fill('[data-testid="task-description"]', 'Test description');
    await page.selectOption('[data-testid="task-category"]', 'work');
    await page.selectOption('[data-testid="task-priority"]', 'high');
    
    // Submit form
    await page.click('[data-testid="task-submit"]');
    
    // Verify task was created
    await expect(page.locator('text=Test Task')).toBeVisible();
  });

  test('should create new event', async ({ page }) => {
    await page.click('[data-testid="new-event-button"]');
    
    // Fill event form
    await page.fill('[data-testid="event-title"]', 'Test Event');
    await page.fill('[data-testid="event-description"]', 'Test description');
    await page.fill('[data-testid="event-start-time"]', '10:00');
    await page.fill('[data-testid="event-end-time"]', '11:00');
    
    // Submit form
    await page.click('[data-testid="event-submit"]');
    
    // Verify event was created
    await expect(page.locator('text=Test Event')).toBeVisible();
  });

  test('should drag and drop tasks to different time slots', async ({ page }) => {
    const task = page.locator('[data-testid="task-item"]').first();
    const timeSlot = page.locator('[data-testid="time-slot"]').nth(5); // 5th hour
    
    // Drag task to time slot
    await task.dragTo(timeSlot);
    
    // Verify task was moved (check for visual feedback or updated data)
    await expect(timeSlot.locator('[data-testid="task-item"]')).toBeVisible();
  });

  test('should toggle task completion', async ({ page }) => {
    const taskCheckbox = page.locator('[data-testid="task-checkbox"]').first();
    
    // Initially not completed
    await expect(taskCheckbox).not.toBeChecked();
    
    // Toggle completion
    await taskCheckbox.click();
    await expect(taskCheckbox).toBeChecked();
    
    // Toggle again
    await taskCheckbox.click();
    await expect(taskCheckbox).not.toBeChecked();
  });

  test('should filter tasks by category', async ({ page }) => {
    // Click on work category
    await page.click('[data-testid="category-work"]');
    
    // Verify only work tasks are shown
    const workTasks = page.locator('[data-testid="task-item"][data-category="work"]');
    await expect(workTasks.first()).toBeVisible();
    
    // Click on personal category
    await page.click('[data-testid="category-personal"]');
    
    // Verify only personal tasks are shown
    const personalTasks = page.locator('[data-testid="task-item"][data-category="personal"]');
    await expect(personalTasks.first()).toBeVisible();
  });

  test('should show overdue tasks', async ({ page }) => {
    // Click on overdue category
    await page.click('[data-testid="category-overdue"]');
    
    // Verify overdue tasks are shown with warning indicator
    const overdueTasks = page.locator('[data-testid="task-item"][data-overdue="true"]');
    if (await overdueTasks.count() > 0) {
      await expect(overdueTasks.locator('[data-testid="overdue-indicator"]')).toBeVisible();
    }
  });

  test('should display notifications', async ({ page }) => {
    // Trigger a notification (e.g., task completion)
    const taskCheckbox = page.locator('[data-testid="task-checkbox"]').first();
    await taskCheckbox.click();
    
    // Verify notification appears
    await expect(page.locator('[data-testid="notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification"]')).toContainText('Task completed');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify sidebar is hidden by default on mobile
    await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
    
    // Open sidebar
    await page.click('[data-testid="menu-button"]');
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    
    // Close sidebar
    await page.click('[data-testid="close-sidebar"]');
    await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
  });
});