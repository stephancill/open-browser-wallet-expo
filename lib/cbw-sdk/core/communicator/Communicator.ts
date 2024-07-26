import { LIB_VERSION } from "../../version";
import { ConfigMessage, Message, MessageID } from "../message";
import { CB_KEYS_URL } from "@/lib/cbw-sdk/core/constants";
import { standardErrors } from "@/lib/cbw-sdk/core/error";
import { closePopup, openPopup } from "@/lib/cbw-sdk/util/web";
import * as WebBrowser from "expo-web-browser";

/**
 * Communicates with a popup window for Coinbase keys.coinbase.com (or another url)
 * to send and receive messages.
 *
 * This class is responsible for opening a popup window, posting messages to it,
 * and listening for responses.
 *
 * It also handles cleanup of event listeners and the popup window itself when necessary.
 */
export class Communicator {
  private readonly url: URL;
  private readonly callbackUrl: string;
  private popup: Window | null = null;
  private listeners = new Map<
    (_: MessageEvent) => void,
    { reject: (_: Error) => void }
  >();

  constructor(url: string = CB_KEYS_URL, callbackUrl: string) {
    this.url = new URL(url);
    this.callbackUrl = callbackUrl;
  }

  /**
   * Posts a message to the popup window
   */
  postMessage = async (message: Message) => {
    const url = new URL(this.url.toString());
    url.searchParams.set("message", JSON.stringify({ data: message }));
    url.searchParams.set("callbackUrl", this.callbackUrl);

    // const popup = await this.waitForPopupLoaded();
    // popup.postMessage(message, this.url.origin);
    const result = await WebBrowser.openAuthSessionAsync(url.toString());
    return result;
  };

  /**
   * Posts a request to the popup window and waits for a response
   */
  postRequestAndWaitForResponse = async <M extends Message>(
    request: Message & { id: MessageID }
  ): Promise<M> => {
    // const responsePromise = this.onMessage<M>(
    //   ({ requestId }) => requestId === request.id
    // );
    const result = await this.postMessage(request);
    if (result.type === "success") {
      const resultUrl = new URL(result.url);
      if (resultUrl.searchParams.has("message")) {
        const message = JSON.parse(resultUrl.searchParams.get("message")!);
        return message as M;
      }
    }
    throw standardErrors.rpc.internal();
  };

  /**
   * Closes the popup, rejects all requests and clears the listeners
   */
  private disconnect = () => {
    // Note: keys popup handles closing itself. this is a fallback.
    closePopup(this.popup);
    this.popup = null;

    this.listeners.forEach(({ reject }, listener) => {
      reject(standardErrors.provider.userRejectedRequest("Request rejected"));
      window.removeEventListener("message", listener);
    });
    this.listeners.clear();
  };
}
