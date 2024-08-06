import { MMKV } from 'react-native-mmkv';
import { createStorage, Storage } from '@wagmi/core';

const mmkv = new MMKV();

const mmkvStorage = {
  getItem: (key: string) => {
    const value = mmkv.getString(key);
    return value === undefined ? null : value;
  },
  setItem: (key: string, value: string) => {
    mmkv.set(key, value);
  },
  removeItem: (key: string) => {
    mmkv.delete(key);
  },
};

export const wagmiMMKVStorage = createStorage({
  storage: mmkvStorage,
  key: 'wagmi', 
});

export function getTypedMMKVStorage<T extends Record<string, unknown>>(): Storage<T> {
  return wagmiMMKVStorage as Storage<T>;
}