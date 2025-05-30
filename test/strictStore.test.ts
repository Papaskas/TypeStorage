import { strictStore, createKey } from '@src/strict-store';
import { keys } from '@test/keys';
import { Theme, User } from '@test/@types';
import { Serializable, StoreKey } from '@src/types';

describe('strictStore', () => {
  beforeEach(() => {
    strictStore.clear();
    localStorage.clear();
    sessionStorage.clear();
  });

  const strictTest = <T extends StoreKey<Serializable>>(key: T, value: T['__type']) => {
    expect(strictStore.get(key)).toStrictEqual(null);

    strictStore.save(key, value);
    expect(strictStore.get(key)).toStrictEqual(value);
  }

  const expectType = <T>(_value: T) => {}

  describe('Basic operations', () => {
    test('should return `null` value when empty', () => {
      expect(strictStore.get(keys.stringKey)).toBe(null);
    });

    test('should correct save and get this value', () => {
      strictStore.save(keys.stringKey, 'save and get test');
      expect(strictStore.get(keys.stringKey)).toBe('save and get test');
    });

    test('should correct removeAll method', () => {
      strictStore.save(keys.stringKey, 'remove test');
      strictStore.save(keys.numberKey, 45);

      expect(strictStore.length).toBe(2);

      strictStore.remove([
        keys.stringKey,
        keys.numberKey,
        keys.booleanKey,
        keys.enumKey,
        keys.literalKey,
        keys.setKey,
      ]);

      expect(strictStore.length).toBe(0);
    });

    test('should correct getAll method', () => {
      strictStore.save(keys.stringKey, 'remove test');
      strictStore.save(keys.numberKey, 45);

      const all = strictStore.getAll()

      expect(all.length).toBe(2);

      const stringEntry = all.find(entry => entry.key.endsWith('/test-ns:string'));
      const numberEntry = all.find(entry => entry.key.endsWith('/test-ns:number'));

      expect(stringEntry).toBeDefined();
      expect(stringEntry?.value).toBe('remove test');

      expect(numberEntry).toBeDefined();
      expect(numberEntry?.value).toBe(45);
    });

    test('should correct getAllByNamespace method', () => {
      strictStore.save(keys.stringKey, 'remove test');
      strictStore.save(keys.numberKey, 45);
      strictStore.save(createKey<number>(
        'ns-2',
        'name-2',
      ), 45);

      expect(strictStore.length).toBe(3);

      const all = strictStore.getAll("test-ns")

      expect(all.length).toBe(2);

      const stringEntry = all.find(entry => entry.key.endsWith('/test-ns:string'));
      const numberEntry = all.find(entry => entry.key.endsWith('/test-ns:number'));
      const unknownEntry = all.find(entry => entry.key.endsWith('/ns-2:name-2'));

      expect(stringEntry).toBeDefined();
      expect(stringEntry?.value).toBe('remove test');

      expect(numberEntry).toBeDefined();
      expect(numberEntry?.value).toBe(45);

      expect(unknownEntry).toBe(undefined);
    });

    test('should correct getSeveral method', () => {
      const themeKey = createKey<'light' | 'dark'>('app', 'theme');
      const langKey = createKey<'en' | 'ru'>('app', 'lang');

      strictStore.save(themeKey, 'dark')
      strictStore.save(langKey, 'en')

      const [theme, lang] = strictStore.pick([themeKey, langKey]);

      expectType<'light' | 'dark' | null>(theme)
      expectType<'en' | 'ru' | null>(lang)

      expect(theme).toBe('dark');
      expect(lang).toBe('en');
    });

    test('should Set and get primitive values', () => {
      new Map<StoreKey<Serializable>, Serializable>([
        [keys.stringKey, 'test primitive value'],
        [keys.booleanKey, false],
        [keys.numberKey, 141],
        [keys.nullableStringKey, null],
        [keys.bigIntKey, 98741954896215948924132156489498412315618948941321532156489748915618949484n],
      ]).forEach((value, key) => {
        strictTest(
          key,
          value,
        )
      })
    });

    test('should remove items and get default value', () => {
      strictStore.save(keys.stringKey, 'remove value');
      expect(strictStore.get(keys.stringKey)).toBe('remove value');
      expect(strictStore.length).toBe(1);

      strictStore.remove(keys.stringKey);
      expect(strictStore.get(keys.stringKey)).toBe(null);
      expect(strictStore.length).toBe(0);
    });

    test('should working clear method', () => {
      localStorage.setItem('1', '231')
      sessionStorage.setItem('1', '231')
      strictStore.save(keys.stringKey, 'clear value');

      expect(strictStore.length).toBe(1); // stringKey
      expect(localStorage.length).toBe(2); // stringKey, localKey
      expect(sessionStorage.length).toBe(1); // sessionKey

      strictStore.clear(); // only strictStore keys

      expect(strictStore.length).toBe(0); // strictStore keys
      expect(localStorage.length).toBe(1);
      expect(sessionStorage.length).toBe(1);
    });

    test('should working length method', () => {
      localStorage.setItem('localKey', 'asd')
      sessionStorage.setItem('sessionKey', 'asd')
      strictStore.save(keys.stringKey, 'value');

      expect(localStorage.length).toBe(2); // stringKey, localKey
      expect(sessionStorage.length).toBe(1); // sessionKey
      expect(strictStore.length).toBe(1); // stringKey

      strictStore.clear();

      expect(strictStore.length).toBe(0);
      expect(localStorage.length).toBe(1); // localKey
      expect(sessionStorage.length).toBe(1); // sessionKey
    });

    test('should working has method', () => {
      strictStore.save(keys.stringKey, 'clear value');
      expect(strictStore.has(keys.stringKey)).toBe(true);

      strictStore.remove(keys.stringKey);

      expect(strictStore.has(keys.stringKey)).toBe(false);
    })
  });

  describe('Namespaces operations', () => {
    test('correct generate ns', () => {
      strictStore.save(keys.stringKey, 'key1');

      const valueLib = strictStore.get(keys.stringKey)
      const valueCommon = localStorage.getItem('strict-store/test-ns:string');

      expect(valueCommon).not.toBe(null);
      expect(valueLib).toBe(JSON.parse(valueCommon!));
    });

    test('should correct clear one ns', () => {
      const nsKeys = {
        key1: createKey<string>(
          'ns1',
          'key1',
        ),

        key2: createKey<string>(
          'ns1',
          'key2',
        ),

        key3: createKey<string>(
          'ns2',
          'key3',
        ),
      } as const;

      strictStore.save(nsKeys.key1, 'new value1'); // ns1
      strictStore.save(nsKeys.key2, 'new value2'); // ns1
      strictStore.save(nsKeys.key3, 'new value3'); // ns2
      strictStore.clear('ns1');

      expect(strictStore.get(nsKeys.key1)).toBe(null);
      expect(strictStore.get(nsKeys.key2)).toBe(null);
      expect(strictStore.get(nsKeys.key3)).toBe('new value3');
    });
  });

  describe('Advanced methods', () => {
    describe('merge method', () => {
      test('should merge partial object into existing object', () => {
        const userKey = createKey<{ name: string; age: number; email?: string }>('test-ns', 'user');
        strictStore.save(userKey, { name: 'Ivan', age: 30 });

        strictStore.merge(userKey, { age: 31, email: 'ivan@example.com' });

        expect(strictStore.get(userKey)).toEqual({
          name: 'Ivan',
          age: 31,
          email: 'ivan@example.com'
        });
      });

      test('should set value if no value exists', () => {
        const userKey = createKey<{ name: string; age: number }>('test-ns', 'user2');
        expect(strictStore.get(userKey)).toBe(null);

        expect(() => {
          strictStore.merge(userKey, { name: 'Ivan' });
        }).toThrow('strictStore.merge: Cannot initialize the object. Use strictStore.save for initial value.');
      });

      test('should throw if trying to merge into non-object', () => {
        const numberKey = createKey<number>('test-ns', 'num');
        strictStore.save(numberKey, 123);

        expect(() => {
          // @ts-expect-error
          strictStore.merge(numberKey, { foo: 'bar' });
        }).toThrow('strictStore.merge: Can only merge into plain objects');
      });

      test('should merge only provided fields (shallow merge)', () => {
        const objKey = createKey<{ a: number; b: { c: number; d: number } }>('test-ns', 'shallow');
        strictStore.save(objKey, { a: 1, b: { c: 2, d: 3 } });

        strictStore.merge(objKey, { b: { c: 99 } });

        expect(strictStore.get(objKey)).toEqual({ a: 1, b: { c: 99, d: 3 } });
      });

      test('should merge object with array property', () => {
        const arrKey = createKey<{ name: string; tags: string[] }>('test-ns', 'arr');
        strictStore.save(arrKey, { name: 'Alex', tags: ['ts', 'storage'] });

        strictStore.merge(arrKey, { tags: ['typescript', 'store', 'util'] });

        expect(strictStore.get(arrKey)).toEqual({ name: 'Alex', tags: ['typescript', 'store', 'util'] });
      });

      test('should merge object with Set property', () => {
        const setKey = createKey<{ name: string; roles: Set<string> }>('test-ns', 'set');
        strictStore.save(setKey, { name: 'Bob', roles: new Set(['admin', 'user']) });

        strictStore.merge(setKey, { roles: new Set(['editor']) });

        const result = strictStore.get(setKey);
        expect(result?.name).toBe('Bob');
        expect(result?.roles instanceof Set).toBe(true);
        expect(Array.from(result!.roles)).toEqual(['editor']);
      });

      test('should merge object with Map property', () => {
        const mapKey = createKey<{ name: string; scores: Map<string, number> }>('test-ns', 'map');
        strictStore.save(mapKey, { name: 'Carl', scores: new Map([['math', 5], ['eng', 4]]) });

        strictStore.merge(mapKey, { scores: new Map([['fr', 4], ['sci', 3]]) });

        const result = strictStore.get(mapKey);
        expect(result?.name).toBe('Carl');
        expect(result?.scores instanceof Map).toBe(true);
        expect(Array.from(result!.scores.entries())).toEqual([
          ['fr', 4],
          ['sci', 3]
        ]);
      });

      test('should merge deeply nested object with array and set', () => {
        const complexKey = createKey<{
          user: {
            name: string;
            tags: string[];
            permissions: Set<string>;
          }
        }>('test-ns', 'complex');

        strictStore.save(complexKey, {
          user: {
            name: 'Dina',
            tags: ['a', 'b'],
            permissions: new Set(['read'])
          }
        });

        strictStore.merge(complexKey, {
          user: {
            tags: ['c'],
            permissions: new Set(['write'])
          }
        });

        const result = strictStore.get(complexKey);
        expect(result?.user.name).toBe('Dina');
        expect(result?.user.tags).toEqual(['c']);
        expect(result?.user.permissions instanceof Set).toBe(true);
        expect(Array.from(result!.user.permissions)).toEqual(['write']);
      });

    });
  });

  describe('createKey correct working', () => {
    test('should throw an exception if the name or ns is incorrect.', () => {
      const nsKey = () => createKey('ans:dassda', 'name')
      const nameKey = () => createKey('namespace', 'nam:e')

      expect(nameKey).toThrow('Namespace and name must not contain the ":" character.');
      expect(nsKey).toThrow('Namespace and name must not contain the ":" character.');
    });

    test('should throw an exception if the ns or name is empty.', () => {
      const nsKey = () => createKey('', 'name',)
      const nameKey = () => createKey('ns', '',)

      expect(nsKey).toThrow('The name or namespace cannot be empty.');
      expect(nameKey).toThrow('The name or namespace cannot be empty.');
    });

    test('createKey return correct type', () => {
      const key = createKey<string>('namespace', 'name');
      const key2 = createKey<{ key: string; value: number; }>('namespace', 'name');

      expectType<StoreKey<string>>(key)
      expectType<StoreKey<{ key: string, value: number }>>(key2)
    });
  })

  describe('advanced types', () => {
    test('enum', () => {
      strictTest(
        keys.enumKey,
        Theme.Light
      )
    });

    test('array<number>', () => {
      strictTest(
        keys.arrayIntKey,
        [312, 0.31]
      )
    });

    test('array<User>', () => {
      const users: User[] = [
        {
          first_name: '1',
          last_name: '1',
          age: 44,
          cash: 1000n,
          hasEmail: true,
        },
        {
          first_name: 'null',
          last_name: null,
          age: 55,
          cash: 10000000n,
          hasEmail: false,
        },
      ]

      strictTest(
        keys.usersKey,
        users
      )
    });

    test('union', () => {
      strictTest<StoreKey<'light' | 'dark' | null>>(
        keys.literalKey,
        'dark'
      )
    });

    test('object', () => {
      const user: User = {
        first_name: 'Pavel',
        last_name: 'Dev',
        age: 46,
        cash: 900n,
        hasEmail: true,
      }

      strictTest(
        keys.objectKey,
        user
      )
    });

    test('bigint', () => {
      strictTest(
        keys.bigIntKey,
        8641975320864197532085418919512894521652189189232156486484318163498451654894894119753208641975321n
      )
    });

    test('map', () => {
      const map = new Map([
        ["key1", 123],
        ["key2", 321],
      ]);

      strictTest(
        keys.mapKey,
        map,
      )
    });

    test('set', () => {
      strictTest(
        keys.setKey,
        new Set(['third', 'Fourth']),
      )
    });

    test('TypedArray', () => {
      [
        new Int8Array([3, -2, 1]),
        new Uint8Array([1, 2, 3]),
        new Uint8ClampedArray([1, 2, 256]),
        new Int16Array([3000, 1000, -2000]),
        new Uint16Array([3000, 1000, 2000]),
        new Int32Array([300000, 100000, -200000]),
        new Uint32Array([300000, 100000, 200000]),
        new Float32Array([1.5, -2.5, 3.5]),
        new Float64Array([-2.987654321, 1.123456789]),
        new BigInt64Array([3n, 1n, -2n]),
        new BigUint64Array([3n, 1n, 2n]),
      ].forEach((value, index) => {
        const key = createKey<typeof value>(
          'test-ns',
          `typedArray${index}`,
        )

        strictTest(
          key,
          value
        )
      })
    });
  })
});
