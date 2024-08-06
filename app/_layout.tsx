import { useColorScheme } from "@/hooks/useColorScheme";
import { coinbaseWallet } from "@/lib/wagmi/connector";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http } from "@wagmi/core";
import { base } from "@wagmi/core/chains";
import { makeRedirectUri } from "expo-auth-session";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import PolyfillCrypto from "react-native-webview-crypto";
import { WagmiProvider } from "wagmi";
import { WebBrowserCommunicator } from "../lib/Communicator";
import { getTypedMMKVStorage } from "../lib/wagmi/storage";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const redirectUri = makeRedirectUri();

const communicator = new WebBrowserCommunicator(
  "https://browser-wallet-gateway.vercel.app/callback",
  redirectUri
);

const storage = getTypedMMKVStorage();

export const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      preference: "smartWalletOnly",
      keysUrl: "", // Not necessary when passing our own communicator
      appLogoUrl: "https://example.com/favicon.ico", // Required otherwise it will try to scrape the favicon which will fail in react native
      appName: "Expo Smart Wallet",
      communicator,
    }),
  ],
  transports: {
    [base.id]: http(),
  },
  storage,
});

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <PolyfillCrypto />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
