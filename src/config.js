import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  phantomWallet
} from '@rainbow-me/rainbowkit/wallets';
import { http} from "@wagmi/core";
import { sepolia,localhost,baseSepolia,optimismSepolia,bscTestnet} from 'wagmi/chains';

localhost.id=31337

const config = getDefaultConfig({
  wallets:[
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, phantomWallet],
    }
  ],
  appName: 'Ame Scan',
  projectId: 'YOUR_PROJECT_ID',
  chains: [localhost,sepolia,baseSepolia,optimismSepolia,bscTestnet],
  transports: {
    [localhost.id]: http(),
    [baseSepolia.id]: http("https://base-sepolia.g.alchemy.com/v2/RjKcVJaEKrQDoKYb4VqNN"),
    [optimismSepolia.id]: http("https://opt-sepolia.g.alchemy.com/v2/RjKcVJaEKrQDoKYb4VqNN"),
    [bscTestnet.id]: http("https://bnb-testnet.g.alchemy.com/v2/RjKcVJaEKrQDoKYb4VqNN"),
    [sepolia.id]: http("https://eth-sepolia.g.alchemy.com/v2/RjKcVJaEKrQDoKYb4VqNN"),

  },

});

export default config