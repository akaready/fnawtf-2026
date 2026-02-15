---
description: Comprehensive code quality standards and best practices for The Portal project
globs: "**/*.{ts,tsx,js,jsx}"
---

# Code Quality Excellence Framework

## Core Quality Principles

### The SOLID Foundation
Apply SOLID principles for maintainable, scalable code:

```typescript
// Good: Single Responsibility Principle
class UserValidator {
  validate(user: UserData): ValidationResult {
    const errors: string[] = [];
    
    if (!this.isValidEmail(user.email)) {
      errors.push('Invalid email format');
    }
    
    if (!this.isValidAge(user.age)) {
      errors.push('Age must be between 13 and 120');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  private isValidEmail(email: string): boolean {
    return /^[^s@]+@[^s@]+.[^s@]+$/.test(email);
  }
  
  private isValidAge(age: number): boolean {
    return age >= 13 && age <= 120;
  }
}

// Good: Open/Closed Principle - extensible without modification
abstract class PaymentProcessor {
  abstract process(payment: Payment): Promise<PaymentResult>;
  
  protected logTransaction(payment: Payment, result: PaymentResult): void {
    this.logger.info('Payment processed', { payment, result });
  }
}

class CreditCardProcessor extends PaymentProcessor {
  async process(payment: Payment): Promise<PaymentResult> {
    const result = await this.creditCardGateway.charge(payment);
    this.logTransaction(payment, result);
    return result;
  }
}
```

### Defensive Programming
Build robust code that handles edge cases gracefully:

```typescript
// Good: Comprehensive input validation and error handling
class UserService {
  async createUser(userData: CreateUserRequest): Promise<User> {
    // Validate preconditions
    this.validateCreateUserRequest(userData);
    
    // Normalize and sanitize input
    const normalizedData = this.normalizeUserData(userData);
    
    // Check business rules
    await this.validateBusinessRules(normalizedData);
    
    try {
      // Create user with transaction
      const user = await this.database.transaction(async (tx) => {
        const createdUser = await this.userRepository.create(normalizedData, tx);
        await this.profileRepository.createDefault(createdUser.id, tx);
        await this.auditRepository.logUserCreation(createdUser.id, tx);
        return createdUser;
      });
      
      // Send welcome email asynchronously
      this.emailService.sendWelcomeEmail(user.email)
        .catch(error => this.logger.error('Failed to send welcome email', { userId: user.id, error }));
      
      return user;
    } catch (error) {
      this.logger.error('User creation failed', { userData: normalizedData, error });
      
      if (error.code === 'UNIQUE_VIOLATION') {
        throw new ConflictError('User with this email already exists');
      }
      
      throw new InternalServerError('Failed to create user');
    }
  }
}
```

## Code Organization Principles

### Clean Architecture Pattern
Organize code in layers with clear dependencies:

```typescript
// Domain Layer - Business logic (no external dependencies)
export class User {
  constructor(
    public readonly id: UserId,
    public readonly email: Email,
    public readonly name: string,
    private password: HashedPassword
  ) {}
  
  changePassword(newPassword: string, passwordHasher: PasswordHasher): void {
    if (newPassword.length < 8) {
      throw new DomainError('Password must be at least 8 characters');
    }
    
    this.password = passwordHasher.hash(newPassword);
  }
}

// Application Layer - Use cases
export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher,
    private emailService: EmailService
  ) {}
  
  async execute(request: CreateUserRequest): Promise<User> {
    // Validate input
    if (!request.email || !request.password) {
      throw new ValidationError('Email and password are required');
    }
    
    // Create and save user
    const userId = UserId.generate();
    const user = new User(
      userId,
      new Email(request.email),
      request.name,
      this.passwordHasher.hash(request.password)
    );
    
    await this.userRepository.save(user);
    await this.emailService.sendWelcomeEmail(user.email.value);
    
    return user;
  }
}
```

### Function Design Excellence
Write functions that are pure, testable, and focused:

```typescript
// Good: Pure functions with single responsibility
type ValidationRule<T> = (value: T) => string | null;

const createEmailValidator = (): ValidationRule<string> => (email: string) => {
  if (!email) return 'Email is required';
  if (!email.includes('@')) return 'Email must contain @';
  if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(email)) return 'Invalid email format';
  return null;
};

// Good: Composition over inheritance
const validateUser = (user: UserInput): ValidationResult => {
  const emailError = createEmailValidator()(user.email);
  const passwordError = createPasswordValidator()(user.password);
  
  const errors = [emailError, passwordError].filter(Boolean);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Good: Error handling with Result pattern
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

## Performance and Security

### Memory Management and Performance
Write efficient code that scales:

```typescript
// Good: Memoization for expensive computations
const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
};
```

### Security Best Practices
Build secure applications from the ground up:

```typescript
// Good: Secure input handling and validation
import { escape } from 'html-escaper';

class SecureUserService {
  async updateUserProfile(userId: string, updates: UserProfileUpdate): Promise<User> {
    // Validate authorization
    await this.authService.requireUserAccess(userId);
    
    // Sanitize inputs
    const sanitizedUpdates = this.sanitizeUserInput(updates);
    
    return await this.userRepository.update(userId, sanitizedUpdates);
  }
  
  private sanitizeUserInput(input: UserProfileUpdate): UserProfileUpdate {
    return {
      name: input.name ? escape(input.name.trim()) : undefined,
      bio: input.bio ? this.sanitizeHtml(input.bio) : undefined,
      website: input.website ? this.validateUrl(input.website) : undefined,
    };
  }
}
```

## Applied Quality Rules

Based on The Portal project configuration:

- No `any` types allowed
- Strict TypeScript mode
- Enforce error boundaries
- JSDoc comments: Optional but encouraged for complex logic, public APIs, and utilities

### Documentation Level: comprehensive

- Comment Styles: JSDoc format for complex functions, inline comments for complex logic, TODO comments for future improvements
- README Requirements: Setup and installation instructions, API documentation

Remember: Code quality is not just about following rules—it's about creating maintainable, secure, and performant software that serves users reliably.
