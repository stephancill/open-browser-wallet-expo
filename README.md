# Browser Wallet + Expo + Wagmi Demo

This is a demo using [Open Browser Wallet](https://github.com/stephancill/open-browser-wallet) in an Expo project with wagmi via a modified @coinbase/wallet-sdk package (in `lib/cbw-sdk`)

## Key Modifications

### @coinbase/wallet-sdk

- `core/communicator` uses [WebBrowser.openAuthSessionAsync](https://docs.expo.dev/versions/latest/sdk/webbrowser/#webbrowseropenauthsessionasyncurl-redirecturl-options) instead of popups
- Messages are passed via URL parameters instead of `postMessage` (see [`/callback` route](https://github.com/stephancill/open-browser-wallet/blob/main/src/app/callback/page.tsx) in Open Browser Wallet
- Disabled encryption due to lack of crypto support in React Native
- Modified constructor to take a `callbackUrl` parameter

### Development

```
yarn install
```

```
yarn ios
```

You need [Open Browser Wallet](https://github.com/stephancill/open-browser-wallet) running on port 3005, otherwise you can modify the `callbackUrl` param to use the production version at https://open-browser-wallet.vercel.app
