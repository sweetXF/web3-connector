import { ethers } from 'ethers';
import type { Wallet } from '../types';

// 获取真正的 MetaMask provider
// 注意：OKX / Coinbase / TokenPocket 等钱包会把自己的 provider 挂到 window.ethereum，
// 并把 isMetaMask 也设为 true 来"伪装"。所以需要精确挑选。
const getMetaMaskProvider = (): any | undefined => {
  if (typeof window === 'undefined') return undefined;
  const w = window as any;

  // 1: 多 provider 共存场景：window.ethereum.providers 是数组
  if (w.ethereum?.providers && Array.isArray(w.ethereum.providers)) {
    const found = w.ethereum.providers.find(
      (p: any) =>
        p?.isMetaMask &&
        !p?.isOkxWallet &&
        !p?.isOKExWallet &&
        !p?.isCoinbaseWallet &&
        !p?.isBraveWallet &&
        !p?.isTokenPocket &&
        !p?.isTrust &&
        !p?.isRabby,
    );
    if (found) return found;
  }

  // 2: 单 provider 场景：直接判断 window.ethereum 是否是真 MetaMask
  const eth = w.ethereum;
  if (
    eth?.isMetaMask &&
    !eth?.isOkxWallet &&
    !eth?.isOKExWallet &&
    !eth?.isCoinbaseWallet &&
    !eth?.isBraveWallet &&
    !eth?.isTokenPocket &&
    !eth?.isTrust &&
    !eth?.isRabby
  ) {
    return eth;
  }

  return undefined;
};

//判断是否安装了metamask
const isMetaMaskInstalled = (): boolean => {
  return !!getMetaMaskProvider();
};

//保存监听器引用，避免重复注册
let listenersBound = false;
let boundProvider: any = null;
let handleAcountsChanged: ((accounts: string[]) => void) | null = null;
let handleChainChanged: ((chainHex: string) => void) | null = null;
let handleDisconnect: ((error: unknown) => void) | null = null;

//绑定监听器
const bindListeners = (ethereum: any) => {
  if (listenersBound) return;
  //账户变化
  handleAcountsChanged = (newAccounts: string[]) => {
    if (!newAccounts || newAccounts.length === 0) {
      window.dispatchEvent(new CustomEvent('wallet_disconnected'));
      return;
    }
    const curChainId = Number(ethereum.chainId); //最新ChainId
    window.dispatchEvent(
      new CustomEvent('wallet_accounts_changed', {
        detail: { accounts: newAccounts, chainId: curChainId },
      }),
    );
  };
  //链变化
  handleChainChanged = (chainIdHex) => {
    const chainId =
      typeof chainIdHex === 'string' && chainIdHex.startsWith('0x') ? parseInt(chainIdHex, 16) : Number(chainIdHex);
    window.dispatchEvent(new CustomEvent('wallet_chain_changed', { detail: { chainId: chainId } }));
  };
  //断开连接
  handleDisconnect = (error: any) => {
    window.dispatchEvent(new CustomEvent('wallet_disconnected', { detail: error }));
  };

  ethereum.on('accountsChanged', handleAcountsChanged);
  ethereum.on('chainChanged', handleChainChanged);
  ethereum.on('disconnect', handleDisconnect);
  boundProvider = ethereum;
  listenersBound = true;
};

//监听器解绑
const unbindListeners = () => {
  if (!listenersBound || !boundProvider) return;
  if (handleAcountsChanged) boundProvider.removeListener('accountsChanged', handleAcountsChanged);
  if (handleChainChanged) boundProvider.removeListener('chainChanged', handleChainChanged);
  if (handleDisconnect) boundProvider.removeListener('disconnect', handleDisconnect);
  handleAcountsChanged = null;
  handleChainChanged = null;
  handleDisconnect = null;
  boundProvider = null;
  listenersBound = false;
};

//连接metamask钱包
const connectMetaMask = async () => {
  const ethereum = getMetaMaskProvider();
  if (!ethereum) {
    throw new Error('MetaMask is not installed');
  }

  // 获取账户（这里 ethereum 是真正的 MetaMask provider，不会再被 OKX 截胡）
  const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found');
  }

  // 获取钱包信息
  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const { chainId } = await provider.getNetwork();

  bindListeners(ethereum);

  return {
    accounts,
    signer,
    address,
    chainId: Number(chainId), //类型对应 WalletState.chainID
    provider,
    disconnect: async () => {
      unbindListeners();
    },
  };
};

export const metamaskWallet: Wallet = {
  id: 'metamask',
  name: 'MetaMask',
  icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1696501628',
  connector: connectMetaMask,
  description: 'MetaMask is a non-custodial hot wallet',
  installed: isMetaMaskInstalled(),
  downloadLink: 'https://metamask.io/download/',
};

export default metamaskWallet;
