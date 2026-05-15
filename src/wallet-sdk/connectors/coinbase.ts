import { ethers } from 'ethers'
import type { Wallet } from '../types'

//判断coinbase是否安装
const isCoinbaseWalletInstalled = (): boolean => {
  if (typeof window === 'undefined') return false

  const ethereum = (window as any).ethereum
  const coinbaseWallet = (window as any).coinbaseWalletExtension

  return !!coinbaseWallet || (ethereum && ethereum.isCoinbaseWallet)
}

//连接coinbase钱包
const connectCoinbaseWallet = async () => {
  if (!isCoinbaseWalletInstalled()) {
    throw new Error('Coinbase Wallet is not installed')
  }

  try {
    //创建coinbase的provider
    const coinbaseProvider = (window as any).coinbaseWalletExtension
    const provider = new ethers.BrowserProvider(coinbaseProvider)

    //获取连接的账户
    // const accounts = await provider.send('eth_requestAccounts', []);
    const accounts = await coinbaseProvider.request({ method: 'eth_requestAccounts' })
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found')
    }

    //获取用户的钱包签名和地址
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    const { chainId } = await provider.getNetwork() //获取链ID

    //监听链变化
    coinbaseProvider.on('chainChanged', (chainId: string | number | bigint) => {
      window.dispatchEvent(new CustomEvent('wallet_chain_changed', { detail: { chainId } }))
    })

    //监听账户变化
    coinbaseProvider.on('accountsChanged', (accounts: string[]) => {
      window.dispatchEvent(new CustomEvent('wallet_accounts_changed', { detail: { accounts } }))
    })

    //监听断开连接
    coinbaseProvider.on('disconnect', (error: any) => {
      window.dispatchEvent(new CustomEvent('wallet_disconnected', { detail: { error } }))
    })

    return {
      accounts,
      signer,
      address,
      chainId,
      provider,
      disconnect: async () => {
        provider.removeAllListeners()
      },
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
