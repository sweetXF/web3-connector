import { ethers } from 'ethers'
import type { Wallet } from '../types'

// 取出 Coinbase 注入的 provider
// 兼容三种注入方式：
// 1) window.coinbaseWalletExtension（旧版扩展）
// 2) window.ethereum.isCoinbaseWallet（独占注入）
// 3) window.ethereum.providers 中含 isCoinbaseWallet 的项（多钱包共存场景，比如同时装了 MetaMask）
const getCoinbaseProvider = (): any | undefined => {
  if (typeof window === 'undefined') return undefined
  const w = window as any
  //旧版扩展
  if (w.coinbaseWalletExtension) return w.coinbaseWalletExtension 

  const eth = w.ethereum
  if (!eth) return undefined
  // 多钱包共存场景
  if (Array.isArray(eth.providers)) {
    const found = eth.providers.find((p: any) => p?.isCoinbaseWallet)
    if (found) return found
  }
  //独占注入
  if (eth.isCoinbaseWallet) return eth 

  return undefined
}

// 判断 Coinbase 是否安装
const isCoinbaseWalletInstalled = (): boolean => {
  return !!getCoinbaseProvider()
}

// 保存监听器引用，避免重复注册
let listenersBound = false
let boundProvider: any = null
let handleAccountsChanged: ((accounts: string[]) => void) | null = null
let handleChainChanged: ((chainHex: string | number | bigint) => void) | null = null
let handleDisconnect: ((err: unknown) => void) | null = null

// 解析 chainId
const parseChainId = (chainId: string | number | bigint): number => {
  if (typeof chainId === 'string') {
    return chainId.startsWith('0x') ? parseInt(chainId, 16) : Number(chainId)
  }
  return Number(chainId)
}

// 绑定监听器
const bindListeners = (provider: any) => {
  if (listenersBound) return

  // 账户变化
  handleAccountsChanged = (newAccounts) => {
    if (!newAccounts || newAccounts.length === 0) {
      window.dispatchEvent(new CustomEvent('wallet_disconnected'))
      return
    }
    // 读取最新 chainId，避免使用旧值
    const currentChainId = provider.chainId ? parseChainId(provider.chainId) : undefined
    window.dispatchEvent(
      new CustomEvent('wallet_accounts_changed', {
        detail: { accounts: newAccounts, chainId: currentChainId },
      }),
    )
  }

  // 链变化
  handleChainChanged = (id) => {
    const chainId = parseChainId(id)
    window.dispatchEvent(new CustomEvent('wallet_chain_changed', { detail: { chainId } }))
  }

  // 断开连接
  handleDisconnect = (error) => {
    window.dispatchEvent(new CustomEvent('wallet_disconnected', { detail: error }))
  }

  provider.on('accountsChanged', handleAccountsChanged)
  provider.on('chainChanged', handleChainChanged)
  provider.on('disconnect', handleDisconnect)

  boundProvider = provider
  listenersBound = true
}

// 解绑监听器
const unbindListeners = () => {
  if (!listenersBound || !boundProvider) return
  if (handleAccountsChanged) boundProvider.removeListener('accountsChanged', handleAccountsChanged)
  if (handleChainChanged) boundProvider.removeListener('chainChanged', handleChainChanged)
  if (handleDisconnect) boundProvider.removeListener('disconnect', handleDisconnect)

  handleAccountsChanged = null
  handleChainChanged = null
  handleDisconnect = null
  boundProvider = null
  listenersBound = false
}

// 连接 Coinbase 钱包
const connectCoinbaseWallet = async () => {
  const coinbaseProvider = getCoinbaseProvider()
  if (!coinbaseProvider) {
    throw new Error('Coinbase Wallet is not installed')
  }

  try {
    // 请求账户
    const accounts: string[] = await coinbaseProvider.request({ method: 'eth_requestAccounts' })
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found')
    }

    // 获取钱包信息
    const provider = new ethers.BrowserProvider(coinbaseProvider)
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    const { chainId } = await provider.getNetwork()

    // 注册监听器（仅一次）
    bindListeners(coinbaseProvider)

    return {
      accounts,
      signer,
      address,
      chainId: Number(chainId),
      provider,
      disconnect: async () => unbindListeners(),
    }
  } catch (error) {
    console.error('Coinbase Wallet connection error', error)
    throw error
  }
}

const coinbaseWallet: Wallet = {
  id: 'coinbase',
  name: 'Coinbase Wallet',
  icon: 'https://avatars.githubusercontent.com/u/18060234?s=280&v=4',
  connector: connectCoinbaseWallet,
  installed: isCoinbaseWalletInstalled(),
  description: 'Coinbase Wallet is a secure and easy-to-use wallet',
  downloadLink: 'https://www.coinbase.com/wallet',
}

export default coinbaseWallet
