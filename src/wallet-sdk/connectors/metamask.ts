import { ethers } from 'ethers'
import type { Wallet } from '../types'

//判断是否安装了metamask
const isMetaMaskInstalled = (): boolean => {
  const ethereum = (window as any).ethereum
  const isMetaMask = ethereum.isMetaMask
  return typeof window !== 'undefined' && !!ethereum && (isMetaMask ?? false)
}

//连接metamask钱包
const connectMetaMask = async (): Promise<any> => {
  if (!isMetaMaskInstalled) {
    throw new Error('MetaMask is not installed')
  }
  try {
    const ethereum = window.ethereum
    if (!ethereum) throw new Error('No ethereum provider found"')

    // 请求授权账户
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found')
    }

    // 获取钱包信息
    const provider = new ethers.BrowserProvider(ethereum)
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    const { chainId } = await provider.getNetwork()

    //监听账户连接变化
    ethereum.on('accountsChanged', (newAccounts: string[]) => {
      console.log('accountsChanged', newAccounts)
      if (newAccounts.length === 0) {
        window.dispatchEvent(new CustomEvent('wallet_disconnected'))
      } else {
        window.dispatchEvent(
          new CustomEvent('wallet_accounts_changed', {
            detail: { accounts: newAccounts, chainId: chainId.toString() },
          }),
        )
      }
    })

    //监听链变化
    ethereum.on('chainChanged', (newChainIdHex: string | number | bigint) => {
      const newChainId = parseInt(newChainIdHex.toString(), 16) //解析链ID
      console.log('chainChanged', newChainId)
      window.dispatchEvent(
        new CustomEvent('wallet_chain_changed', { detail: { chainId: newChainId } }),
      )
    })

    //监听断开连接
    ethereum.on('disconnect', (error: any) => {
      window.dispatchEvent(new CustomEvent('wallet_disconnected', { detail: error }))
    })

    return {
      accounts,
      signer,
      address,
      chainId: chainId.toString(),
      provider,
      disconnect: async () => {
        ethereum.removeAllListeners()
      },
    }
  } catch (error: any) {
    console.error('MetaMask connection failed', error)
    throw error
  }
}

export const metamaskWallet: Wallet = {
  id: 'metamask',
  name: 'MetaMask',
  icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1696501628',
  connector: connectMetaMask,
  description: 'MetaMask is a non-custodial hot wallet',
  installed: isMetaMaskInstalled(),
  downloadLink: 'https://metamask.io/download/',
}

export default metamaskWallet
