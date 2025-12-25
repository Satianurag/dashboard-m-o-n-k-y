
import { test, expect } from '@playwright/test';

test('Dashboard Loads', async ({ page }) => {
    await page.goto('http://localhost:5000');
    await expect(page).toHaveTitle(/Xandeum/i);
    await expect(page.getByText('TOTAL PNODES')).toBeVisible();
    await expect(page.getByText('NETWORK HEALTH')).toBeVisible();
});

test('Chat Functionality', async ({ page }) => {
    await page.goto('http://localhost:5000');
    // Wait for chat to load (it might be collapsed)
    // Assuming there is a "Chat" button or it is visible at bottom
    // The Chat component is at bottom "ChatHeader".

    // Click to expand if needed. The header is typically visible.
    await page.getByText('Global Chat').click();
    await expect(page.getByPlaceholder('Type a message...')).toBeVisible();

    // Type message
    await page.getByPlaceholder('Type a message...').fill('Hello from Playwright');
    await page.getByRole('button', { name: 'Send' }).click();

    // Expect message to appear
    await expect(page.getByText('Hello from Playwright')).toBeVisible();
});

test('Ingest API', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/ingest');
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.success).toBeTruthy();
});
