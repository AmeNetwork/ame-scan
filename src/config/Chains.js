const Chains = new Map([
  [
    "0x7a69",
    {
      Network: {
        chainId: "0x7a69",
        chainName: "Localhost",
        rpcUrls: ["http://127.0.0.1:7545"],
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18,
        },
        blockExplorerUrls: ["http://127.0.0.1:7545"],
      },
      ameWorld: "0xe1Aa25618fA0c7A1CFDab5d6B456af611873b629",
    },
  ],
  [
    "0xaa37dc",
    {
      Network: {
        chainId: "0xaa37dc",
        chainName: "OP Sepolia",
        rpcUrls: ["https://sepolia.optimism.io"],
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18,
        },
        blockExplorerUrls: ["https://sepolia-optimism.etherscan.io"],
      },
      ameWorld: "0xAFAcad0039eE54C31b0f6E44186a8113A3531334",
    },
  ],
  [
    "0x6a63bb8",
    {
      Network: {
        chainId: "0x6a63bb8",
        chainName: "Cyber Testnet",
        rpcUrls: ["https://cyber-testnet.alt.technology/"],
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18,
        },
        blockExplorerUrls: ["https://testnet.cyberscan.co/"],
      },
      ameWorld: "0xD50010428543A20220360d7B031a720Fc2c8ca1C",
    },
  ],
  [
    "0x14a34",
    {
      Network: {
        chainId: "0x14a34",
        chainName: "Base Sepolia",
        rpcUrls: ["https://sepolia.base.org"],
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18,
        },
        blockExplorerUrls: ["https://base-sepolia.blockscout.com"],
      },
      ameWorld: "0xAFAcad0039eE54C31b0f6E44186a8113A3531334",
    },
  ],
  [
    "0x3b9ac9ff",
    {
      Network: {
        chainId: "0x3b9ac9ff",
        chainName: "Zora Sepolia",
        rpcUrls: ["https://sepolia.rpc.zora.energy"],
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18,
        },
        blockExplorerUrls: ["https://sepolia.explorer.zora.energy"],
      },
      ameWorld: "0xAFAcad0039eE54C31b0f6E44186a8113A3531334",
    },
  ],
  [
    "0x15eb",
    {
      Network: {
        chainId: "0x15eb",
        chainName: "OpBNB Testnet",
        rpcUrls: [
          "https://opbnb-testnet.nodereal.io/v1/9989d39cb7484ee9abcec2132a242315",
        ],
        nativeCurrency: {
          name: "BNB",
          symbol: "BNB",
          decimals: 18,
        },
        blockExplorerUrls: ["https://opbnbscan.com/"],
      },
      ameWorld: "0xAFAcad0039eE54C31b0f6E44186a8113A3531334",
    },
  ],
  [
    "0x4269",
    {
      Network: {
        chainId: "0x4269",
        chainName: "Redstone Holesky",
        rpcUrls: ["https://rpc.holesky.redstone.xyz"],
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18,
        },
        blockExplorerUrls: ["https://explorer.holesky.redstone.xyz"],
      },
      ameWorld: "0x736F3D2169B42eFbD4a7A4f760ebd4f5907Ef57e",
    },
  ],
]);

export default Chains;
