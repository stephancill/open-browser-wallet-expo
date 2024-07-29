# Browser Wallet + Expo + Wagmi Demo

This is a demo using Coinbase Smart Wallet and [Open Browser Wallet](https://github.com/stephancill/open-browser-wallet) in an Expo project with wagmi via the [Browser Wallet Gateway](https://github.com/stephancill/browser-wallet-gateway) and a modified version of the [@coinbase/wallet-sdk](https://github.com/coinbase/coinbase-wallet-sdk).

## Key Modifications

### @coinbase/wallet-sdk

- `core/communicator` uses [WebBrowser.openAuthSessionAsync](https://docs.expo.dev/versions/latest/sdk/webbrowser/#webbrowseropenauthsessionasyncurl-redirecturl-options) instead of popups
- Messages are passed via URL parameters instead of `postMessage` (see [`/callback` route](https://github.com/stephancill/open-browser-wallet/blob/main/src/app/callback/page.tsx) in Open Browser Wallet)
- Modified constructor to take a `callbackUrl` parameter

### Development

```
yarn install
```

```
yarn ios
```

Modify the `callbackUrl` param to use a local version of the Browser Wallet Gateway in `_layout.tsx`.
