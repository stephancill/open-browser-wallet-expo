import { CoinbaseWalletParameters } from "@wagmi/connectors";
import {
  ChainNotConfiguredError,
  type Connector,
  createConnector,
} from "@wagmi/core";
import type { Compute, Mutable, Omit } from "@wagmi/core/internal";
import {
  type AddEthereumChainParameter,
  type Hex,
  type ProviderRpcError,
  SwitchChainError,
  UserRejectedRequestError,
  getAddress,
  numberToHex,
} from "viem";
import { CoinbaseWalletSDK } from "../CoinbaseWalletSDK";
import { Preference, ProviderInterface } from "../core/provider/interface";

type Version4Parameters = Mutable<
  Omit<
    ConstructorParameters<typeof CoinbaseWalletSDK>[0],
    "appChainIds" // set via wagmi config
  > & {
    /**
     * Preference for the type of wallet to display.
     * @default 'all'
     */
    preference?: Preference["options"] | undefined;
    keysUrl?: string;
    callbackUrl: string;
  }
>;

coinbaseWallet.type = "coinbaseWallet" as const;
export function coinbaseWallet(
  parameters: Version4Parameters = {} as any
): ReturnType<typeof version4> {
  return version4(parameters as Version4Parameters) as any;
}

function version4(parameters: Version4Parameters) {
  type Provider = ProviderInterface & {
    // for backwards compatibility
    close?(): void;
  };

  let sdk: CoinbaseWalletSDK | undefined;
  let walletProvider: Provider | undefined;

  let accountsChanged: Connector["onAccountsChanged"] | undefined;
  let chainChanged: Connector["onChainChanged"] | undefined;
  let disconnect: Connector["onDisconnect"] | undefined;

  return createConnector<Provider>((config) => ({
    id: "coinbaseWalletSDK",
    name: "Coinbase Wallet SDK",
    supportsSimulation: true,
    type: coinbaseWallet.type,
    async connect({ chainId } = {}) {
      try {
        const provider = await this.getProvider();
        const accounts = (
          (await provider.request({
            method: "eth_requestAccounts",
          })) as string[]
        ).map((x) => getAddress(x));

        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this);
          provider.on("accountsChanged", accountsChanged);
        }
        if (!chainChanged) {
          chainChanged = this.onChainChanged.bind(this);
          provider.on("chainChanged", chainChanged);
        }
        if (!disconnect) {
          disconnect = this.onDisconnect.bind(this);
          provider.on("disconnect", disconnect);
        }

        // Switch to chain if provided
        let currentChainId = await this.getChainId();
        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain!({ chainId }).catch((error) => {
            if (error.code === UserRejectedRequestError.code) throw error;
            return { id: currentChainId };
          });
          currentChainId = chain?.id ?? currentChainId;
        }

        return { accounts, chainId: currentChainId };
      } catch (error) {
        if (
          /(user closed modal|accounts received is empty|user denied account|request rejected)/i.test(
            (error as Error).message
          )
        )
          throw new UserRejectedRequestError(error as Error);
        throw error;
      }
    },
    async disconnect() {
      const provider = await this.getProvider();

      if (accountsChanged) {
        provider.removeListener("accountsChanged", accountsChanged);
        accountsChanged = undefined;
      }
      if (chainChanged) {
        provider.removeListener("chainChanged", chainChanged);
        chainChanged = undefined;
      }
      if (disconnect) {
        provider.removeListener("disconnect", disconnect);
        disconnect = undefined;
      }

      provider.disconnect();
      provider.close?.();
    },
    async getAccounts() {
      const provider = await this.getProvider();
      return (
        await provider.request<string[]>({
          method: "eth_accounts",
        })
      ).map((x) => getAddress(x));
    },
    async getChainId() {
      const provider = await this.getProvider();
      const chainId = await provider.request<Hex>({
        method: "eth_chainId",
      });
      return Number(chainId);
    },
    async getProvider() {
      if (!walletProvider) {
        // Unwrapping import for Vite compatibility.
        // See: https://github.com/vitejs/vite/issues/9703

        sdk = new CoinbaseWalletSDK({
          ...parameters,
          appChainIds: config.chains.map((x) => x.id),
        });

        walletProvider = sdk.makeWeb3Provider({
          ...parameters,
          options: parameters.preference ?? "all",
        });
      }

      return walletProvider;
    },
    async isAuthorized() {
      try {
        const accounts = await this.getAccounts();
        return !!accounts.length;
      } catch {
        return false;
      }
    },
    async switchChain({ addEthereumChainParameter, chainId }) {
      const chain = config.chains.find((chain) => chain.id === chainId);
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());

      const provider = await this.getProvider();

      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: numberToHex(chain.id) }],
        });
        return chain;
      } catch (error) {
        // Indicates chain is not added to provider
        if ((error as ProviderRpcError).code === 4902) {
          try {
            let blockExplorerUrls: string[] | undefined;
            if (addEthereumChainParameter?.blockExplorerUrls)
              blockExplorerUrls = addEthereumChainParameter.blockExplorerUrls;
            else
              blockExplorerUrls = chain.blockExplorers?.default.url
                ? [chain.blockExplorers?.default.url]
                : [];

            let rpcUrls: readonly string[];
            if (addEthereumChainParameter?.rpcUrls?.length)
              rpcUrls = addEthereumChainParameter.rpcUrls;
            else rpcUrls = [chain.rpcUrls.default?.http[0] ?? ""];

            const addEthereumChain = {
              blockExplorerUrls,
              chainId: numberToHex(chainId),
              chainName: addEthereumChainParameter?.chainName ?? chain.name,
              iconUrls: addEthereumChainParameter?.iconUrls,
              nativeCurrency:
                addEthereumChainParameter?.nativeCurrency ??
                chain.nativeCurrency,
              rpcUrls,
            } satisfies AddEthereumChainParameter;

            await provider.request({
              method: "wallet_addEthereumChain",
              params: [addEthereumChain],
            });

            return chain;
          } catch (error) {
            throw new UserRejectedRequestError(error as Error);
          }
        }

        throw new SwitchChainError(error as Error);
      }
    },
    onAccountsChanged(accounts) {
      if (accounts.length === 0) this.onDisconnect();
      else
        config.emitter.emit("change", {
          accounts: accounts.map((x) => getAddress(x)),
        });
    },
    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit("change", { chainId });
    },
    async onDisconnect(_error) {
      config.emitter.emit("disconnect");

      const provider = await this.getProvider();
      if (accountsChanged) {
        provider.removeListener("accountsChanged", accountsChanged);
        accountsChanged = undefined;
      }
      if (chainChanged) {
        provider.removeListener("chainChanged", chainChanged);
        chainChanged = undefined;
      }
      if (disconnect) {
        provider.removeListener("disconnect", disconnect);
        disconnect = undefined;
      }
    },
  }));
}
