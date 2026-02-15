---
description: Feature development guidelines and best practices
globs: 
---

# Feature Development Guidelines

## Planning Phase

- Break down features into small, testable units
- Define clear acceptance criteria
- Consider edge cases and error scenarios
- Plan for backwards compatibility

## Implementation

- Follow TDD when possible
- Write self-documenting code
- Implement proper error handling
- Add logging for debugging

## Testing

- Use Playwright for end-to-end testing
- Use Playwright's component testing for React components
- Write tests for critical user flows
- Test edge cases and error conditions
- Use `test.beforeEach` for test setup and isolation
- Use web-first assertions (e.g., `toBeVisible()`) for better reliability
- Update existing tests when features change

## Code Examples

```typescript
// Good: Feature implementation with proper structure
class UserService {
  async createUser(userData: CreateUserRequest): Promise<User> {
    // Validate input
    const validatedData = await this.validateUserData(userData);
    
    // Check for existing user
    const existingUser = await this.findByEmail(validatedData.email);
    if (existingUser) {
      throw new ConflictError('User already exists');
    }
    
    // Create user
    const user = await this.userRepository.create(validatedData);
    
    return user;
  }
}
```

## Playwright Testing Examples

```typescript
// Good: E2E test with setup
import { test, expect } from '@playwright/test';

test.describe('Events Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate and authenticate
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new event', async ({ page }) => {
    await page.goto('/events');
    await page.getByRole('button', { name: 'Create Event' }).click();
    
    await page.getByLabel('Title').fill('Test Event');
    await page.getByLabel('Description').fill('Test Description');
    await page.getByRole('button', { name: 'Submit' }).click();
    
    await expect(page.getByText('Test Event')).toBeVisible();
  });
});
```

```typescript
// Good: Component test with Playwright
import { test, expect } from '@playwright/experimental-ct-react';
import { EventCard } from '@/components/EventCard';

test('EventCard displays event information', async ({ mount }) => {
  const component = await mount(
    <EventCard 
      event={{
        id: '1',
        title: 'Test Event',
        description: 'Test Description'
      }} 
    />
  );
  
  await expect(component.getByText('Test Event')).toBeVisible();
  await expect(component.getByText('Test Description')).toBeVisible();
});
```
