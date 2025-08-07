import { test, expect } from '@playwright/test';

test.describe('Tier List Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should load the application successfully', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Tier List Maker');
    await expect(page.locator('#createBtn')).toBeVisible();
    await expect(page.locator('#tierListTitle')).toBeVisible();
  });

  test('should create a new tier list', async ({ page }) => {
    // Fill in the tier list form
    await page.fill('#tierListTitle', 'My Test Tier List');
    await page.fill('#tierListDescription', 'This is a test description');

    // Click create button
    await page.click('#createBtn');

    // Wait for success message
    await expect(page.locator('#status')).toContainText('created successfully');

    // Check that the tier list editor is opened
    await expect(page.locator('#tierListEditor')).toBeVisible();
    await expect(page.locator('#editorTitle')).toContainText('My Test Tier List');
  });

  test('should add text items to tier list', async ({ page }) => {
    // Create a tier list first
    await page.fill('#tierListTitle', 'Test Tier List');
    await page.click('#createBtn');

    // Wait for editor to open
    await expect(page.locator('#tierListEditor')).toBeVisible();

    // Add a text item
    await page.fill('#textItemInput', 'Test Item 1');
    await page.click('#addTextBtn');

    // Check that item appears in unranked area
    await expect(page.locator('#unrankedItems .tier-item')).toContainText('Test Item 1');

    // Add another item
    await page.fill('#textItemInput', 'Test Item 2');
    await page.click('#addTextBtn');

    // Check that both items are present
    const items = page.locator('#unrankedItems .tier-item');
    await expect(items).toHaveCount(2);
  });

  test('should drag and drop items between tiers', async ({ page }) => {
    // Create a tier list and add items
    await page.fill('#tierListTitle', 'Drag Test');
    await page.click('#createBtn');
    await expect(page.locator('#tierListEditor')).toBeVisible();

    // Add test items
    await page.fill('#textItemInput', 'Item A');
    await page.click('#addTextBtn');
    await page.fill('#textItemInput', 'Item B');
    await page.click('#addTextBtn');

    // Get the first item and S tier
    const firstItem = page.locator('#unrankedItems .tier-item').first();
    const sTier = page.locator('[data-tier="S"] .tier-content');

    // Perform drag and drop
    await firstItem.dragTo(sTier);

    // Check that item moved to S tier
    await expect(page.locator('[data-tier="S"] .tier-item')).toHaveCount(1);
    await expect(page.locator('#unrankedItems .tier-item')).toHaveCount(1);
  });

  test('should save tier list automatically', async ({ page }) => {
    // Create and modify a tier list
    await page.fill('#tierListTitle', 'Auto Save Test');
    await page.click('#createBtn');
    await expect(page.locator('#tierListEditor')).toBeVisible();

    // Add an item
    await page.fill('#textItemInput', 'Save Test Item');
    await page.click('#addTextBtn');

    // Click save button
    await page.click('#saveBtn');

    // Check for save confirmation
    await expect(page.locator('#status')).toContainText('saved successfully');
  });

  test('should edit tier labels', async ({ page }) => {
    // Create a tier list
    await page.fill('#tierListTitle', 'Label Edit Test');
    await page.click('#createBtn');
    await expect(page.locator('#tierListEditor')).toBeVisible();

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
    await page.click('#createBtn');
    await page.click('#closeEditorBtn');

    await page.fill('#tierListTitle', 'Second List');
    await page.click('#createBtn');
    await page.click('#closeEditorBtn');

    // Check that both lists appear in the list
    const tierListCards = page.locator('.tier-list-card');
    await expect(tierListCards).toHaveCount(2);
    await expect(page.locator('.tier-list-card')).toContainText(['First List', 'Second List']);
  });

  test('should duplicate tier list', async ({ page }) => {
    // Create a tier list with items
    await page.fill('#tierListTitle', 'Original List');
    await page.click('#createBtn');
    await expect(page.locator('#tierListEditor')).toBeVisible();

    // Add an item
    await page.fill('#textItemInput', 'Original Item');
    await page.click('#addTextBtn');
    await page.click('#saveBtn');
    await page.click('#closeEditorBtn');

    // Duplicate the tier list
    await page.click('.tier-list-card .duplicate-btn');

    // Check that duplicate was created
    await expect(page.locator('#status')).toContainText('duplicated successfully');
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
    await page.click('#createBtn');
    await page.click('#closeEditorBtn');

    // Delete the tier list
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });

    await page.click('.tier-list-card .delete-btn');

    // Check that tier list was deleted
    await expect(page.locator('#status')).toContainText('deleted successfully');
    await expect(page.locator('.tier-list-card')).toHaveCount(0);
  });

  test('should export and import data', async ({ page }) => {
    // Create a tier list
    await page.fill('#tierListTitle', 'Export Test');
    await page.click('#createBtn');
    await page.click('#closeEditorBtn');

    // Export data
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportBtn');
    const download = await downloadPromise;

    // Check that download was triggered
    expect(download.suggestedFilename()).toContain('tierlist-data');

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
    await page.click('#storageInfoBtn');

    // Check that storage info is displayed
    await expect(page.locator('#status')).toContainText('Storage Type: local');
  });

  test('should handle image upload', async ({ page }) => {
    // Create a tier list
    await page.fill('#tierListTitle', 'Image Test');
    await page.click('#createBtn');
    await expect(page.locator('#tierListEditor')).toBeVisible();

    // Create a test image file
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    // Upload image
    await page.setInputFiles('#imageUpload', {
      name: 'test.png',
      mimeType: 'image/png',
      buffer: testImage,
    });

    // Check that image item was added
    await expect(page.locator('#unrankedItems .tier-item')).toHaveCount(1);
    await expect(page.locator('#unrankedItems .tier-item img')).toBeVisible();
  });

  test('should maintain state after page reload', async ({ page }) => {
    // Create a tier list with items
    await page.fill('#tierListTitle', 'Persistence Test');
    await page.click('#createBtn');
    await expect(page.locator('#tierListEditor')).toBeVisible();

    // Add an item and save
    await page.fill('#textItemInput', 'Persistent Item');
    await page.click('#addTextBtn');
    await page.click('#saveBtn');
    await page.click('#closeEditorBtn');

    // Reload the page
    await page.reload();

    // Check that tier list still exists
    await expect(page.locator('.tier-list-card')).toHaveCount(1);
    await expect(page.locator('.tier-list-card')).toContainText('Persistence Test');

    // Open the tier list and check that item is still there
    await page.click('.tier-list-card .view-btn');
    await expect(page.locator('#unrankedItems .tier-item')).toContainText('Persistent Item');
  });
});
