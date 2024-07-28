import { Buffer } from "@craftzdog/react-native-buffer";
import * as Crypto from "expo-crypto";

import "@expo/browser-polyfill";
import "react-native-webview-crypto";

global.Buffer = Buffer;

crypto.getRandomValues = Crypto.getRandomValues;

import "expo-router/entry";
