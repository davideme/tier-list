import { test, expect } from '@playwright/test';

test.describe('Tier List Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should load the application successfully', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('🏆 Tier List App');
    await expect(page.locator('#tierListTitle')).toBeVisible();
    await expect(page.locator('#tierListDescription')).toBeVisible();
    await expect(page.getByText('Create Tier List')).toBeVisible();
  });

  test('should create a new tier list', async ({ page }) => {
    // Fill in the tier list form
    await page.fill('#tierListTitle', 'My Test Tier List');
    await page.fill('#tierListDescription', 'This is a test description');

    // Click create button
    await page.click('button:has-text("Create Tier List")');

    // Check that the tier list editor is opened (this indicates successful creation)
    await expect(page.locator('.tier-list-container')).toBeVisible();
    await expect(page.locator('.tier-list-title')).toContainText('My Test Tier List');
    
    // Verify the tier list is automatically opened for editing
    await expect(page.locator('.status')).toContainText('Editing tier list: My Test Tier List');
  });

  test('should add text items to tier list', async ({ page }) => {
    // Create a tier list first
    await page.fill('#tierListTitle', 'Test Tier List');
    await page.click('button:has-text("Create Tier List")');

    // Wait for editor to open
    await expect(page.locator('.tier-list-container')).toBeVisible();

    // Add a text item
    await page.fill('.add-item-input', 'Test Item 1');
    await page.locator('.add-item-controls button:has-text("Add Text")').click();

    // Check that item appears in unranked area
    await expect(page.locator('.unranked-content .tier-item')).toContainText('Test Item 1');

    // Add another item
    await page.fill('.add-item-input', 'Test Item 2');
    await page.locator('.add-item-controls button:has-text("Add Text")').click();

    // Check that both items are present
    const items = page.locator('.unranked-content .tier-item');
    await expect(items).toHaveCount(2);
  });

  test('should drag and drop items between tiers', async ({ page }) => {
    // Create a tier list and add items
    await page.fill('#tierListTitle', 'Drag Test');
    await page.click('button:has-text("Create Tier List")');
    await expect(page.locator('.tier-list-container')).toBeVisible();

    // Add test items
    await page.fill('.add-item-input', 'Item A');
    await page.locator('.add-item-controls button:has-text("Add Text")').click();
    await page.fill('.add-item-input', 'Item B');
    await page.locator('.add-item-controls button:has-text("Add Text")').click();

    // Get the first item and S tier
    const firstItem = page.locator('.unranked-content .tier-item').first();
    const sTier = page.locator('[data-tier="S"] .tier-content');

    // Perform drag and drop
    await firstItem.dragTo(sTier);

    // Check that item moved to S tier
    await expect(page.locator('[data-tier="S"] .tier-item')).toHaveCount(1);
    await expect(page.locator('.unranked-content .tier-item')).toHaveCount(1);
  });

  test('should save tier list automatically', async ({ page }) => {
    // Create and modify a tier list
    await page.fill('#tierListTitle', 'Auto Save Test');
    await page.click('button:has-text("Create Tier List")');
    await expect(page.locator('.tier-list-container')).toBeVisible();

    // Add an item
    await page.fill('.add-item-input', 'Save Test Item');
    await page.locator('.add-item-controls button:has-text("Add Text")').click();

    // Click save button
    await page.click('button:has-text("💾 Save")');

    // Check for save confirmation
    await expect(page.locator('.status')).toContainText('saved successfully');
  });

  test('should edit tier labels', async ({ page }) => {
    // Create a tier list
    await page.fill('#tierListTitle', 'Label Edit Test');
    await page.click('button:has-text("Create Tier List")');
    await expect(page.locator('.tier-list-container')).toBeVisible();

    // Click on S tier label to edit
    await page.click('[data-tier="S"] .tier-label');

    // Wait for prompt and enter new label
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Enter new label');
      await dialog.accept('Super');
    });

    // Trigger the edit
    await page.click('[data-tier="S"] .tier-label');

    // Check that label was updated
    await expect(page.locator('[data-tier="S"] .tier-label')).toContainText('Super');
  });

  test('should list existing tier lists', async ({ page }) => {
    // Create multiple tier lists
    await page.fill('#tierListTitle', 'First List');
    await page.click('button:has-text("Create Tier List")');
    await page.click('button:has-text("✕ Close")');

    await page.fill('#tierListTitle', 'Second List');
    await page.click('button:has-text("Create Tier List")');
    await page.click('button:has-text("✕ Close")');

    // Check that both lists appear in the list
    const tierListCards = page.locator('.tier-list-card');
    await expect(tierListCards).toHaveCount(2);
    await expect(page.locator('.tier-list-card')).toContainText(['First List', 'Second List']);
  });

  test('should duplicate tier list', async ({ page }) => {
    // Create a tier list with items
    await page.fill('#tierListTitle', 'Original List');
    await page.click('button:has-text("Create Tier List")');
    await expect(page.locator('.tier-list-container')).toBeVisible();

    // Add an item
    await page.fill('.add-item-input', 'Original Item');
    await page.locator('.add-item-controls button:has-text("Add Text")').click();
    await page.click('button:has-text("💾 Save")');
    await page.click('button:has-text("✕ Close")');

    // Duplicate the tier list
    await page.click('.tier-list-card .duplicate-btn');

    // Check that duplicate was created
    await expect(page.locator('.status')).toContainText('duplicated successfully');
    const tierListCards = page.locator('.tier-list-card');
    await expect(tierListCards).toHaveCount(2);
    await expect(page.locator('.tier-list-card')).toContainText([
      'Original List',
      'Original List (Copy)',
    ]);
  });

  test('should delete tier list', async ({ page }) => {
    // Create a tier list
    await page.fill('#tierListTitle', 'To Delete');
    await page.click('button:has-text("Create Tier List")');
    await page.click('button:has-text("✕ Close")');

    // Delete the tier list
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });

    await page.click('.tier-list-card .delete-btn');

    // Check that tier list was deleted
    await expect(page.locator('.status')).toContainText('deleted successfully');
    await expect(page.locator('.tier-list-card')).toHaveCount(0);
  });

  test('should export and import data', async ({ page }) => {
    // Create a tier list
    await page.fill('#tierListTitle', 'Export Test');
    await page.click('button:has-text("Create Tier List")');
    await page.click('button:has-text("✕ Close")');

    // Export data
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export All Data")');
    const download = await downloadPromise;

    // Check that download was triggered
    expect(download.suggestedFilename()).toContain('tierlist-backup');

    // Clear data
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Check that no tier lists exist
    await expect(page.locator('.tier-list-card')).toHaveCount(0);

    // Note: Full import testing would require file upload simulation
    // which is more complex in Playwright and depends on the specific implementation
  });

  test('should show storage information', async ({ page }) => {
    // Click storage info button
    await page.click('button:has-text("Storage Info")');

    // Check that storage info is displayed (it shows as an alert dialog)
    // Since it's an alert, we need to handle it differently
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Storage Type: local');
      await dialog.accept();
    });

    // Trigger the storage info dialog
    await page.click('button:has-text("Storage Info")');
  });

  test('should handle image upload', async ({ page }) => {
    // Create a tier list
    await page.fill('#tierListTitle', 'Image Test');
    await page.click('button:has-text("Create Tier List")');
    await expect(page.locator('.tier-list-container')).toBeVisible();

    // Create a test image file
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    // Upload image via the hidden file input in the file-input-wrapper
    await page.setInputFiles('.file-input-wrapper input[type="file"]', {
      name: 'test.png',
      mimeType: 'image/png',
      buffer: testImage,
    });

    // Check that image item was added
    await expect(page.locator('.unranked-content .tier-item')).toHaveCount(1);
    await expect(page.locator('.unranked-content .tier-item img')).toBeVisible();
  });

  test('should maintain state after page reload', async ({ page }) => {
    // Create a tier list with items
    await page.fill('#tierListTitle', 'Persistence Test');
    await page.click('button:has-text("Create Tier List")');
    await expect(page.locator('.tier-list-container')).toBeVisible();

    // Add an item and save
    await page.fill('.add-item-input', 'Persistent Item');
    await page.locator('.add-item-controls button:has-text("Add Text")').click();
    await page.click('button:has-text("💾 Save")');
    await page.click('button:has-text("✕ Close")');

    // Reload the page
    await page.reload();

    // Check that tier list still exists
    await expect(page.locator('.tier-list-card')).toHaveCount(1);
    await expect(page.locator('.tier-list-card')).toContainText('Persistence Test');

    // Open the tier list and check that item is still there
    await page.click('.tier-list-card .view-btn');
    await expect(page.locator('.unranked-content .tier-item')).toContainText('Persistent Item');
  });
});
