import { WalletProvider, ConnectButton } from './wallet-sdk'
import type { Chain, Wallet } from './wallet-sdk/types'
import metamaskWallet from './wallet-sdk/connectors/metamask'
import coinbaseWallet from './wallet-sdk/connectors/coinbase'

const rpcUrl=import.meta.env.VITE_MAINNET_RPC ?? 'https://eth.llamarpc.com'

const chains: Chain[]= [
  {
    id: 1,
    name: 'Ethereum',
    rpcUrl,
    currency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: {
      name: 'Etherscan',
      url: 'https://etherscan.io',
    },
  },{
    id: 11155111,
    name: 'Sepolia',
    rpcUrl,
    currency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: { 
      name: 'Etherscan', 
      url: 'https://sepolia.etherscan.io' 
    }

  }

  
]

const wallets: Wallet[] = [metamaskWallet, coinbaseWallet]

function App() {

  return (
      <WalletProvider chains={chains} autoConnect wallets={wallets}>
        <ConnectButton />
      </WalletProvider>
  )
}

export default App
