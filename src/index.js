import { WagmiProvider, createConfig } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import config from './config';
import {
  RainbowKitProvider,
  darkTheme
} from "@rainbow-me/rainbowkit";
import ReactDOM from 'react-dom/client';
import './index.css';
import "@rainbow-me/rainbowkit/styles.css";
import reportWebVitals from './reportWebVitals';
import Scan from './page/Scan';
import Avvvatars from 'avvvatars-react'
const root = ReactDOM.createRoot(document.getElementById('root'));
const queryClient = new QueryClient();

const CustomAvatar = ({ address, ensImage, size }) => {
  return  <Avvvatars value={address} style="shapes"/>;
};
root.render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        modalSize="compact"
        avatar={CustomAvatar}
        locale="en-US"
        theme={darkTheme({
          accentColor: "#4348C6",
          accentColorForeground: "white",
          borderRadius: "small",
        })}
      >

          <Scan></Scan>

      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>

);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
