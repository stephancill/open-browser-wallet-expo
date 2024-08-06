import * as WebBrowser from "expo-web-browser";
import {type CommunicatorType, type MessageTypes, ErrorTypes} from "coinbase-wallet-sdk-react-native"
import { replacer, reviver } from "./json";

/**
 * Communicates with a WebBrowser AuthSession for Coinbase keys.coinbase.com (or another url)
 * to send and receive messages.
 *
 * This class is responsible for opening an AuthSession, posting messages to it,
 * and parsing and returning redirects.
 */
export class WebBrowserCommunicator implements CommunicatorType {
  private readonly url: URL;
  private readonly callbackUrl: string;

  constructor(url: string, callbackUrl: string) {
    this.url = new URL(url);
    this.callbackUrl = callbackUrl;
  }

  /**
   * Posts a message to the popup window
   */
  postMessage = async (message: MessageTypes.Message) => {
    const url = new URL(this.url.toString());
    url.searchParams.set(
      "message",
      JSON.stringify({ data: message }, replacer)
    );
    url.searchParams.set("callbackUrl", this.callbackUrl);

    const result = await WebBrowser.openAuthSessionAsync(url.toString());
    return result;
  };

  /**
   * Posts a request to the popup window and waits for a response
   */
  postRequestAndWaitForResponse = async <M extends MessageTypes.Message>(
    request: MessageTypes.Message & { id: MessageTypes.MessageID }
  ): Promise<M> => {
    const result = await this.postMessage(request);
    if (result.type === "success") {
      const resultUrl = new URL(result.url);
      if (resultUrl.searchParams.has("message")) {
        const message = JSON.parse(
          resultUrl.searchParams.get("message")!,
          reviver
        );
        return message as M;
      }
    }
    throw ErrorTypes.standardErrors.provider.userRejectedRequest("User rejected request");
  };

  onMessage<M extends MessageTypes.Message>(predicate: (_: Partial<M>) => boolean): Promise<M> {
      // Dummy implementation
      return Promise.resolve({} as M);
  }

  waitForPopupLoaded(): Promise<Window> {
    // Dummy implementation
    return Promise.resolve(window);
  }
}
