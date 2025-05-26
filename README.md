# Strict Storage

[![npm version](https://img.shields.io/npm/v/strict-store)](https://www.npmjs.com/package/strict-store)
[![license](https://img.shields.io/npm/l/strict-store?v=2)](https://github.com/Papaskas/strict-store/blob/main/LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/min/strict-store)](https://bundlephobia.com/package/strict-store)

A **type-safe** wrapper around localStorage and sessionStorage with TypeScript support, ns isolation, and automatic serialization.

## Features
- 🛡 **Full Type Safety** - Compile-time type checking for all operations
- 🧠 **Smart Serialization** - Automatic handling of:
    - Primitive types
    - Complex types
    - Special types
    - TypedArray
- 🗂 **Namespace Isolation** - Prevent name collisions with hierarchical organization
- ⚡ **Dual Storage Support** - Switch between localStorage (persistent) and sessionStorage (session-based)

### Supported types:

> - string
> - number
> - boolean
> - null
> - union
> - object
> - array
> - enum
> - BigInt
> - Map
> - Set
> - Int8Array
> - Uint8Array
> - Uint8ClampedArray
> - Int16Array
> - Uint16Array
> - Int32Array
> - Uint32Array
> - Float32Array
> - Float64Array
> - BigInt64Array
> - BigUint64Array

## Installation

```bash
npm install strict-storage
# or
yarn add strict-storage
# or
pnpm add strict-store
```

## Quick start

```typescript
import { createKey, strictStore } from 'strict-storage';

// Create a type-safe name
const themeKey = createKey<'light' | 'dark'>(
  'app', // namaspace
  'theme', // name name
  'local' // storage (localStorage, sessionStorage)
);

// Save with type checking
strictStore.save(themeKey, 'dark'); // Only 'light' or 'dark' allowed

// Retrieve with correct type inference
const theme: 'light' | 'dark' | null = strictStore.get(themeKey); // Type: 'light' | 'dark' | null

// Remove when done
strictStore.remove(themeKey);

// Check name
strictStore.has(userKey);  // → true

// Get all items count
console.log(`Total items: ${strictStore.length}`);

// Clears all keys in storage that belong to a specific ns
strictStore.clearNamespace('app');

// Clears all items from storage (including non-namespaced)
strictStore.clear();
```

## Storage type selection

Choose between localStorage (persistent) and sessionStorage (tab-specific):

```typescript
const localKey = createKey(..., 'local');
const sessionKey = createKey(..., 'session');
```

### API References

Creates a type-safe storage name.

```typescript
createKey<T>(
  ns: string, 
  name: string, 
  storeType?: 'sessin' | 'local' = 'local'
): StoreKey<T>
```

```typescript
strictStore
  .get(name: StoreKey): T // Retrieves a value
  .save<T>(name: StoreKey, value: T): void // Stores a value
  .remove(name: StoreKey): void // Removes a name
  .has(name: StoreKey): boolean // Checks for name existence
  .length(): number // Total items count
  .clear(): void // Clears all storage
  .clearNamespace(ns: string): void // Clears a ns
```

## Type Safety

The library enforces type safety at compile time:

```typescript
const counterKey = createKey<number>('app', 'counter');

strictStore.save(counterKey, 'text'); // Error: Type 'string' is not assignable to type 'number'
strictStore.save(counterKey, 42); // OK
```

### Complex Type Examples

**Arrays:**

```typescript
const tagsKey = createKey<string[]>(
  'app', 
  'tags',
);

strictStore.save(tagsKey, ['ts', 'storage', 'util']); // string[] preserved
```

**Objects:**
```typescript
type User = {
  id: number;
  name: string;
  settings: {
    darkMode: boolean
  }
};

const userKey = createKey<User>(
  'app',
  'user',
);

strictStore.save(userKey, {
  id: 1,
  name: 'Alex',
  settings: { darkMode: true }
}); // Structure is type-checked
```

## Limitations

1. Avoid using colons (':') in ns or name values — this symbol is reserved as a ns delimiter.
2. The undefined type is not supported — it will be converted to null during JSON serialization

## Required
1. TypeScript >= 4.9.0
