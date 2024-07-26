import { RequestArguments } from "@/lib/cbw-sdk/core/provider/interface";

export type RPCRequest = {
  action: RequestArguments; // JSON-RPC call
  chainId: number;
};
