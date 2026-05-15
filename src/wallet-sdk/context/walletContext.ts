import { createContext } from 'react'
import type { WalletContextValue } from '../types'

// 钱包全局上下文（Provider 与 useWallet 共用同一个引用）
export const walletContext = createContext<WalletContextValue | undefined>(undefined)
