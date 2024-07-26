// Copyright (c) 2018-2024 Coinbase, Inc. <https://www.coinbase.com/>

import { MMKV } from "react-native-mmkv";

export class ScopedLocalStorage {
  private storage: MMKV;

  constructor(private scope: "CBWSDK" | "walletlink", private module?: string) {
    this.storage = new MMKV({ id: `${scope}${module ? `:${module}` : ""}` });
  }

  setItem(key: string, value: any) {
    this.storage.set(this.scopedKey(key), value);
  }

  getItem(key: string) {
    return this.storage.getString(this.scopedKey(key)) || null;
  }

  removeItem(key: string) {
    this.storage.delete(this.scopedKey(key));
  }

  clear() {
    this.storage.clearAll();
  }

  scopedKey(key: string) {
    return `-${this.scope}${this.module ? `:${this.module}` : ""}:${key}`;
  }

  static clearAll() {
    new ScopedLocalStorage("CBWSDK").clear();
    new ScopedLocalStorage("walletlink").clear();
  }
}
