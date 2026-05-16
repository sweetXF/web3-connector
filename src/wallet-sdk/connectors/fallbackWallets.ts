// 当用户没装某家钱包时，仍在 Modal 里展示一个"占位入口"，点击跳转下载页
// 已装的钱包会通过 EIP-6963 自动覆盖这里的 fallback 项（基于 rdns 映射去重）
//
// 注意：EIP-6963 已发现的钱包优先；这里的 fallback 只在 EIP-6963 没发现该钱包时才会显示。

import type { Wallet } from '../types';
import metamaskIcon from '../assets/wallet-icons/metamask.svg';
import okxIcon from '../assets/wallet-icons/okx.svg';
import coinbaseIcon from '../assets/wallet-icons/coinbase.svg';
import phantomIcon from '../assets/wallet-icons/phantom.svg';

// 占位 connector：未安装时被点击会抛错
const notInstalled = (name: string) => async () => {
  throw new Error(`${name} is not installed`);
};

export const metamaskFallback: Wallet = {
  id: 'metamask',
  name: 'MetaMask',
  icon: metamaskIcon,
  description: 'MetaMask is a non-custodial hot wallet',
  connector: notInstalled('MetaMask'),
  installed: false,
  downloadLink: 'https://metamask.io/download/',
};

export const okxFallback: Wallet = {
  id: 'okx',
  name: 'OKX Wallet',
  icon: okxIcon,
  description: 'OKX Wallet, a multi-chain wallet',
  connector: notInstalled('OKX Wallet'),
  installed: false,
  downloadLink: 'https://www.okx.com/web3',
};

export const coinbaseFallback: Wallet = {
  id: 'coinbase',
  name: 'Coinbase Wallet',
  icon: coinbaseIcon,
  description: 'Coinbase Wallet is a secure and easy-to-use wallet',
  connector: notInstalled('Coinbase Wallet'),
  installed: false,
  downloadLink: 'https://www.coinbase.com/wallet',
};

export const phantomFallback: Wallet = {
  id: 'phantom',
  name: 'Phantom',
  icon: phantomIcon,
  description: 'Phantom is a multi-chain wallet (EVM / Solana)',
  connector: notInstalled('Phantom'),
  installed: false,
  downloadLink: 'https://phantom.app/download',
};

// 一次性提供四家钱包的 fallback
export const defaultFallbackWallets: Wallet[] = [metamaskFallback, okxFallback, coinbaseFallback, phantomFallback];
