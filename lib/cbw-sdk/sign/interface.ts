import { AddressString, Chain } from "@/lib/cbw-sdk/core/type";

export interface StateUpdateListener {
  onAccountsUpdate: (_: AddressString[]) => void;
  onChainUpdate: (_: Chain) => void;
}
