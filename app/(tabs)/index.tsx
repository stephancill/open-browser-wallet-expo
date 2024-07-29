import React, { useEffect, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  useAccount,
  useConnect,
  useDisconnect,
  usePublicClient,
  useSignMessage,
} from "wagmi";
import * as WebBrowser from "expo-web-browser";

function App() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const publicClient = usePublicClient();
  const [signResult, setSignResult] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (signResult) setSignResult(null);
  }, [account.address]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.heading}>Account</Text>

        <Text>status: {account.status}</Text>
        <Text>addresses: {JSON.stringify(account.addresses)}</Text>
        <Text>chainId: {account.chainId}</Text>

        {account.status === "connected" && (
          <Button title="Disconnect" onPress={() => disconnect()} />
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.heading}>Connect</Text>
        {!account.address &&
          connectors.map((connector) => (
            <Button
              key={connector.uid}
              title="Connect Wallet"
              onPress={() => connect({ connector })}
            />
          ))}
        {account.address && publicClient && (
          <Button
            onPress={async () => {
              const message = "Hello, world!";
              const signature = await signMessageAsync({
                message,
              });

              console.log(signature);

              const verifyResult = await publicClient.verifyMessage({
                message,
                signature,
                address: account.address!,
              });

              setSignResult(
                JSON.stringify(
                  {
                    verifyResult,
                    message,
                    signature,
                  },
                  null,
                  2
                )
              );
            }}
            title="Sign test message"
          ></Button>
        )}
        <Text>{status}</Text>
        <Text>{error?.message}</Text>
        <Text>{signResult}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default App;
