import { StateUpdateListener } from "./interface";
import { SCWSigner } from "./scw/SCWSigner";
import { Communicator } from "@/lib/cbw-sdk/core/communicator/Communicator";
import { standardErrors } from "@/lib/cbw-sdk/core/error";
import {
  ConfigMessage,
  MessageID,
  SignerType,
} from "@/lib/cbw-sdk/core/message";
import {
  AppMetadata,
  Preference,
  Signer,
} from "@/lib/cbw-sdk/core/provider/interface";
import { getCoinbaseInjectedSigner } from "@/lib/cbw-sdk/util/provider";
import { ScopedLocalStorage } from "@/lib/cbw-sdk/util/ScopedLocalStorage";
import * as Crypto from "expo-crypto";

const SIGNER_TYPE_KEY = "SignerType";
const storage = new ScopedLocalStorage("CBWSDK", "SignerConfigurator");

export function loadSignerType(): SignerType | null {
  return storage.getItem(SIGNER_TYPE_KEY) as SignerType;
}

export function storeSignerType(signerType: SignerType) {
  storage.setItem(SIGNER_TYPE_KEY, signerType);
}

export async function fetchSignerType(params: {
  communicator: Communicator;
  preference: Preference;
  metadata: AppMetadata; // for WalletLink
}): Promise<SignerType> {
  const { communicator, metadata } = params;

  const request: ConfigMessage & { id: MessageID } = {
    id: Crypto.randomUUID() as MessageID,
    event: "selectSignerType",
    data: params.preference,
  };
  const { data } = await communicator.postRequestAndWaitForResponse(request);
  return data as SignerType;
}

export function createSigner(params: {
  signerType: SignerType;
  metadata: AppMetadata;
  communicator: Communicator;
  updateListener: StateUpdateListener;
}): Signer {
  const { signerType, metadata, communicator, updateListener } = params;
  switch (signerType) {
    case "scw":
      return new SCWSigner({
        metadata,
        updateListener,
        communicator,
      });
    default:
      throw standardErrors.rpc.internal(
        "WalletLink/Extension signer not supported"
      );
  }
}
