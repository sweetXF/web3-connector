import { ethers } from 'ethers'
import { WalletProvider, ConnectButton } from './wallet-sdk'
import type { Wallet } from './wallet-sdk/types'
import metamaskWallet from './wallet-sdk/connectors/metamask'
import coinbaseWallet from './wallet-sdk/connectors/coinbase'

declare global {
  interface Window {
    ethereum: any
  }
}

const infuraId = process.env.PUBLIC_INFURA_ID;

if (!infuraId) {
  throw new Error('请在 .env.local 中配置PUBLIC_INFURA_ID' );
}

const chains = [
  {
    id: 1,
    name: 'Ethereum',
    rpcUrl: `https://sepolia.infura.io/v3/${infuraId}`,
    currency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
]

const wallets: Wallet[] = [metamaskWallet, coinbaseWallet]

function App() {
  const provider = new ethers.BrowserProvider(window.ethereum)

  return (
    <>
      <WalletProvider chains={chains} provider={provider} autoConnect={true} wallets={wallets}>
        <ConnectButton />
      </WalletProvider>
    </>
  )
}

export default App
