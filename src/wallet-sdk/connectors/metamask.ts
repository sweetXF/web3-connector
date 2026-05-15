import { ethers } from 'ethers'
import type { Wallet } from '../types'

const getEthereum = ()=> typeof window !== 'undefined' ? (window as any).ethereum : undefined

console.log('metamask-ethereum',getEthereum())

//判断是否安装了metamask
const isMetaMaskInstalled = (): boolean => {
  const eth = getEthereum()
  return !!eth && eth.isMetaMask
}

//保存监听器引用，避免重复注册
let listenersBound = false
let handleAcountsChanged: ((accounts: string[]) => void) | null = null
let handleChainChanged: ((chainHex: string) => void) | null = null
let handleDisconnect: ((error: unknown) => void) | null = null

//绑定监听器
const bindListeners=(ethereum:any)=>{
  if(listenersBound) return
  //账户变化
  handleAcountsChanged = (newAccounts: string[]) => {
    if (!newAccounts || newAccounts.length === 0) {
      window.dispatchEvent(new CustomEvent('wallet_disconnected'))
      return
    } 
    const curChainId = Number(ethereum.chainId) //最新ChainId
      window.dispatchEvent(
        new CustomEvent('wallet_accounts_changed', {
          detail: { accounts: newAccounts, chainId: curChainId },
        }),
      ) 
  }
  //链变化
  handleChainChanged = (chainIdHex) => {
    const chainId = 
    typeof chainIdHex === 'string' && chainIdHex.startsWith('0x')
      ? parseInt(chainIdHex, 16)
      : Number(chainIdHex)
    window.dispatchEvent(
      new CustomEvent('wallet_chain_changed', { detail: { chainId: chainId } }),
    )
  }
  //断开连接
  handleDisconnect = (error: any) => {
    window.dispatchEvent(new CustomEvent('wallet_disconnected', { detail: error }))
  }

  ethereum.on('accountsChanged', handleAcountsChanged)
  ethereum.on('chainChanged', handleChainChanged)
  ethereum.on('disconnect', handleDisconnect)
  listenersBound = true
}

//监听器解绑
const unbindListeners=(ethereum:any)=>{
  if(!listenersBound) return
  if(handleAcountsChanged) ethereum.removeListener('accountsChanged', handleAcountsChanged)
  if(handleChainChanged) ethereum.removeListener('chainChanged', handleChainChanged)
  if(handleDisconnect) ethereum.removeListener('disconnect', handleDisconnect)
  listenersBound = false
}

//连接metamask钱包
const connectMetaMask = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed')
  }
    const ethereum = getEthereum()
    // 获取账户
    const accounts:string[]=await ethereum.request({ method: 'eth_requestAccounts' })
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found')
    }

    // 获取钱包信息
    const provider = new ethers.BrowserProvider(ethereum)
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    const { chainId } = await provider.getNetwork()

    bindListeners(ethereum)

    return {
      accounts,
      signer,
      address,
      chainId: Number(chainId),//类型对应 WalletState.chainID 
      provider,
      disconnect: async () => {
        unbindListeners(ethereum)
      },
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
