import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bekiuz.build",
  appName: "BEKIUZ BUILD",
  webDir: "dist",
  android: {
    allowMixedContent: false
  },
  server: {
    androidScheme: "https"
  }
};

export default config;
