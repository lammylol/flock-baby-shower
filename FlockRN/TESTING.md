# Testing Guide for Flock

This guide covers testing patterns and best practices used in the Flock React Native project.

## Table of Contents

- [Setup](#setup)
- [Firebase Mocking](#firebase-mocking)
- [React Native Testing](#react-native-testing)
- [Test Patterns](#test-patterns)
- [Best Practices](#best-practices)
- [Common Issues](#common-issues)

## Setup

### Jest Configuration

The project uses a custom Jest configuration in `package.json`:

```json
{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["./jest.setup.js"],
    "moduleNameMapper": {
      "^firebase/(.*)$": "<rootDir>/__mocks__/firebase/$1",
      "^@/(.*)$": "<rootDir>/$1"
    },
    "testEnvironment": "node",
    "collectCoverage": true
  }
}
```

### Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:ci

# Run specific test file
npm test -- path/to/test.ts

# Run tests with coverage
npm test -- --coverage
```

## Firebase Mocking

### Global Mock Setup

The project uses global Firebase mocks via `moduleNameMapper`. All Firebase imports are automatically redirected to mock files:

```typescript
// This import in your code:
import { Timestamp } from 'firebase/firestore';

// Gets redirected to:
import { Timestamp } from '__mocks__/firebase/firestore';
```

### Mock Files Structure

```
__mocks__/
├── firebase/
│   ├── app.ts          # Firebase app initialization
│   ├── auth.ts         # Authentication mocks
│   ├── firestore.ts    # Firestore mocks (including Timestamp)
│   └── functions.ts    # Cloud Functions mocks
└── @/
    └── firebase/
        └── firebaseConfig.tsx  # Firebase config mocks
```

### Key Mock Classes

#### Timestamp Mock

```typescript
// __mocks__/firebase/firestore.ts
export class Timestamp {
  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  toDate(): Date {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1e6);
  }

  static fromDate(date: Date): Timestamp {
    const seconds = Math.floor(date.getTime() / 1000);
    const nanoseconds = (date.getTime() % 1000) * 1e6;
    return new Timestamp(seconds, nanoseconds);
  }
}
```

### When to Use Additional Mocks

**Don't mock Firebase in individual test files** unless you need specific behavior:

```typescript
// ❌ Don't do this (overrides global mock)
jest.mock('firebase/firestore');

// ✅ Do this if you need specific behavior
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  // Add specific overrides here
}));
```

## React Native Testing

### Testing React Components

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('handles user interaction', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MyComponent onPress={onPress} />);

    fireEvent.press(getByText('Button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Testing Custom Hooks

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(initialValue);
  });

  it('updates state correctly', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.updateValue('new value');
    });

    expect(result.current.value).toBe('new value');
  });
});
```

### Testing Context Providers

```typescript
import { render } from '@testing-library/react-native';
import { MyContextProvider } from '../MyContext';

const TestWrapper = ({ children }) => (
  <MyContextProvider>
    {children}
  </MyContextProvider>
);

describe('Component with Context', () => {
  it('renders with context', () => {
    const { getByText } = render(
      <TestWrapper>
        <MyComponent />
      </TestWrapper>
    );
    expect(getByText('Context Value')).toBeTruthy();
  });
});
```

## Test Patterns

### Testing Date Utilities

```typescript
import { normalizeDate, getDateString } from '../utils/dateUtils';
import { Timestamp } from 'firebase/firestore';

describe('dateUtils', () => {
  it('handles different timestamp formats', () => {
    // Test with underscore format
    const timestamp1 = { _seconds: 1751322593, _nanoseconds: 944000000 };
    const date1 = normalizeDate(timestamp1);
    expect(date1).toBeInstanceOf(Date);

    // Test with regular format
    const timestamp2 = { seconds: 1751263128, nanoseconds: 113000000 };
    const date2 = normalizeDate(timestamp2);
    expect(date2).toBeInstanceOf(Date);

    // Test with Timestamp object
    const timestamp3 = new Timestamp(1751322593, 944000000);
    const date3 = normalizeDate(timestamp3);
    expect(date3).toBeInstanceOf(Date);
  });
});
```

### Testing Async Operations

```typescript
import { waitFor } from '@testing-library/react-native';

describe('Async Operations', () => {
  it('handles async data loading', async () => {
    const { getByText, queryByText } = render(<AsyncComponent />);

    // Initially shows loading
    expect(getByText('Loading...')).toBeTruthy();

    // Wait for data to load
    await waitFor(() => {
      expect(queryByText('Loading...')).toBeFalsy();
    });

    expect(getByText('Data loaded')).toBeTruthy();
  });
});
```

### Testing Error Handling

```typescript
describe('Error Handling', () => {
  it('handles errors gracefully', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Test error-prone code
    const result = someFunctionThatMightError();

    expect(result).toBeDefined();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
```

### Testing Zustand Stores

```typescript
import { renderHook } from '@testing-library/react-hooks';
import { useMyStore } from '../store';

describe('Zustand Store', () => {
  beforeEach(() => {
    // Reset store state
    useMyStore.setState({ value: 'initial' });
  });

  it('updates state correctly', () => {
    const { result } = renderHook(() => useMyStore());

    act(() => {
      result.current.setValue('new value');
    });

    expect(result.current.value).toBe('new value');
  });
});
```

## Best Practices

### 1. Test Organization

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Common setup
  });

  // Happy path tests
  describe('when everything works', () => {
    it('should render correctly', () => {
      // Test
    });
  });

  // Edge cases
  describe('when data is missing', () => {
    it('should show fallback', () => {
      // Test
    });
  });

  // Error cases
  describe('when errors occur', () => {
    it('should handle errors gracefully', () => {
      // Test
    });
  });
});
```

### 2. Mock Naming

```typescript
// Use descriptive names for mocks
const mockOnPress = jest.fn();
const mockUser = { id: '123', name: 'Test User' };
const mockTimestamp = new Timestamp(1751322593, 944000000);
```

### 3. Test Data

```typescript
// Create test data factories
const createTestPrayer = (overrides = {}) => ({
  id: 'test-id',
  content: 'Test prayer',
  createdAt: new Date(),
  authorId: 'user-123',
  ...overrides,
});

// Use in tests
const prayer = createTestPrayer({ content: 'Custom content' });
```

### 4. Cleanup

```typescript
describe('Test Suite', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });
});
```

## Common Issues

### 1. Firebase Timestamp Issues

**Problem**: Tests fail with "Cannot read properties of undefined"

**Solution**: Ensure you're using the mock Timestamp class:

```typescript
import { Timestamp } from 'firebase/firestore';

// This will use the mock Timestamp
const timestamp = new Timestamp(1751322593, 944000000);
```

### 2. Date.now() in Tests

**Problem**: Tests using current time are flaky

**Solution**: Mock Date.now() for specific tests:

```typescript
describe('Time-dependent tests', () => {
  let dateNowSpy: jest.SpyInstance;

  beforeEach(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1735732800000);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });
});
```

### 3. Async Testing Issues

**Problem**: Tests fail due to timing issues

**Solution**: Use proper async testing utilities:

```typescript
import { waitFor } from '@testing-library/react-native';

it('handles async operations', async () => {
  const { getByText } = render(<AsyncComponent />);

  await waitFor(() => {
    expect(getByText('Loaded')).toBeTruthy();
  });
});
```

### 4. Context Provider Testing

**Problem**: Components that need context fail to render

**Solution**: Create test wrappers:

```typescript
const TestWrapper = ({ children }) => (
  <AuthProvider>
    <PrayerProvider>
      {children}
    </PrayerProvider>
  </AuthProvider>
);

const { getByText } = render(
  <TestWrapper>
    <MyComponent />
  </TestWrapper>
);
```

## Coverage

The project is configured to collect coverage. View coverage reports:

```bash
# Run tests with coverage
npm test -- --coverage

# Coverage report will be available in coverage/lcov-report/index.html
```

## Debugging Tests

### Debug Mode

```bash
# Run tests in debug mode
npm test -- --verbose --no-coverage
```

### Console Logging

```typescript
// Add console.log for debugging
it('debug test', () => {
  console.log('Debug info:', someValue);
  expect(someValue).toBe(expected);
});
```

### Jest Debugger

```bash
# Run specific test with debugger
node --inspect-brk node_modules/.bin/jest --runInBand path/to/test.ts
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Firebase Testing](https://firebase.google.com/docs/rules/unit-tests)
- [Testing React Hooks](https://react-hooks-testing-library.com/)

## Contributing

When adding new tests:

1. Follow the existing patterns in the codebase
2. Use descriptive test names
3. Test both success and error cases
4. Keep tests focused and isolated
5. Update this guide if you discover new patterns
