import { StatusBar } from "expo-status-bar";
import { Box, NativeBaseProvider, Text, View } from "native-base";
import Navigation from "./src/layouts/Navigation";
import { AuthProvider } from "./src/context/AuthContext";
import { AxiosProvider } from "./src/context/AxiosContext";
import Report from "./src/screens/User/Report";

export default function App() {
  return (
    <AuthProvider>
      <AxiosProvider>
        <NativeBaseProvider>
          <Box safeArea />
          <StatusBar style="auto" />
          <Navigation />
          {/* <Report /> */}
        </NativeBaseProvider>
      </AxiosProvider>
    </AuthProvider>
  );
}
