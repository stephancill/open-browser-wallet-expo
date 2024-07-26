import { Message, MessageID } from "./Message";
import { SerializedEthereumRpcError } from "@/lib/cbw-sdk/core/error";
import { AppMetadata } from "@/lib/cbw-sdk/core/provider/interface";

interface RPCMessage extends Message {
  id: MessageID;
  sender: string; // hex encoded public key of the sender
  content: unknown;
  timestamp: Date;
}

export type EncryptedData = {
  iv: ArrayBuffer;
  cipherText: ArrayBuffer;
};

export interface RPCRequestMessage extends RPCMessage {
  content:
    | {
        handshake: RequestAccountsAction;
      }
    | {
        encrypted: EncryptedData;
      }
    | {
        plaintext: string;
      };
}

export interface RPCResponseMessage extends RPCMessage {
  requestId: MessageID;
  content:
    | {
        encrypted: EncryptedData;
      }
    | {
        failure: SerializedEthereumRpcError;
      };
}

type RequestAccountsAction = {
  method: "eth_requestAccounts";
  params: AppMetadata;
};
