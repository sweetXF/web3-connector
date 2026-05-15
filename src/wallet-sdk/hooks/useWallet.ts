import { useContext } from 'react'
import type { WalletContextValue } from '../types'
import { walletContext } from '../context/walletContext'

//获取钱包数据（钱包上下文： 状态 / 方法）
export const useWallet = (): WalletContextValue => {
  const context = useContext(walletContext)
  console.log('walletContext::', context)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
