import {ethers} from "ethers";
import {WalletProvider,ConnectButton} from "./wallet-sdk";
import type { Wallet } from "./wallet-sdk/types";

declare global {
  interface Window {
   ethereum: any;
  }
}

const chains = [
  {
    id: 1,
    name: "Ethereum",
    rpcUrl: "http://localhost:8545",
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

const wallets : Wallet[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "https://cdn.metamask.io/images/logo.png",
    connector: () => {
      return new Promise((resolve) => {
        resolve(new ethers.BrowserProvider(window.ethereum));
      });
    },
  },
]

function App() {
  const provider =new ethers.BrowserProvider(window.ethereum);

  return (
    <>
      <WalletProvider chains={chains} provider={provider} autoConnect={true} wallets={wallets}>
          {/* <ConnectButton /> */}
          <div>src/App  WalletProvider</div>
      </WalletProvider>
    </>
  )
}

export default App
