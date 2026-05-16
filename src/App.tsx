import { WalletProvider, ConnectButton } from './wallet-sdk';
import type { Chain, Wallet } from './wallet-sdk/types';
import { defaultFallbackWallets } from './wallet-sdk/connectors/fallbackWallets';

const rpcUrl = import.meta.env.VITE_MAINNET_RPC ?? 'https://eth.llamarpc.com';

const chains: Chain[] = [
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
  },
  {
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
      url: 'https://sepolia.etherscan.io',
    },
  },
];

// 提供 MetaMask / OKX / Coinbase / Phantom 四家钱包的"未安装兜底"项
// 已安装的钱包会被 EIP-6963 自动发现并替换这里的占位项
const wallets: Wallet[] = defaultFallbackWallets;

function App() {
  return (
    <WalletProvider chains={chains} autoConnect wallets={wallets}>
      <ConnectButton />
    </WalletProvider>
  );
}

export default App;
