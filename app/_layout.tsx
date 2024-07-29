import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { createConfig, http } from "@wagmi/core";
import { base } from "@wagmi/core/chains";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { coinbaseWallet } from "@/lib/cbw-sdk/wagmi/connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { makeRedirectUri } from "expo-auth-session";
import PolyfillCrypto from "react-native-webview-crypto";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const redirectUri = makeRedirectUri();

export const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      preference: "smartWalletOnly",
      callbackUrl: redirectUri,
      // keysUrl: "http://localhost:3004/callback",
      keysUrl: "https://browser-wallet-gateway.vercel.app/callback",
    }),
  ],
  transports: {
    [base.id]: http(),
  },
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
