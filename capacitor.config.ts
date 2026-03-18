import type { CapacitorConfig } from "@capacitor/cli";

const devMode = process.env.CAPACITOR_DEV === "true";

const config: CapacitorConfig = {
  appId: "com.chewiq.app",
  appName: "ChewIQ",
  webDir: "out",
  server: devMode
    ? { url: "http://localhost:3000", cleartext: true }
    : { url: "https://chewiq.app", cleartext: false },
  ios: {
    scheme: "ChewIQ",
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: "CENTER_CROP",
    },
  },
};

export default config;
