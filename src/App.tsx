import {ethers} from "ethers";
import {WalletProvider,ConnectButton} from "./wallet-sdk";
import type { Wallet } from "./wallet-sdk/types";
import metamaskWallet from "./wallet-sdk/connectors/metamask";

declare global {
  interface Window {
   ethereum: any;
  }
}

const chains = [
  {
    id: 1,
    name: "Ethereum",
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/your-api-key",
    currency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
    },
    blockExplorer: {
      name: "Etherscan",
      url: "https://etherscan.io"
    }
  },
]

const wallets : Wallet[] = [metamaskWallet];

function App() {
  const provider =new ethers.BrowserProvider(window.ethereum);

  return (
    <>
      <WalletProvider chains={chains} provider={provider} autoConnect={true} wallets={wallets}>
          <ConnectButton />
      </WalletProvider>
    </>
  )
}

export default App
