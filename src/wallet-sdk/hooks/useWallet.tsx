import { createContext, useContext } from "react"
import type { WalletContextValue } from "../types"

//钱包全局上下文
const walletContext = createContext<WalletContextValue>({
  connect: async () => {},
  disconnect: async () => {},
  isConnected: false,
  isConnecting: false,
  address: '',
  chainID: 0,
  switchChain: async () => {},
  openModal(): void {},
  closeModal(): void {},
  ensName: null,
  error: null,
  chains: [],
  provider: undefined,
})

export const useWallet = (): WalletContextValue => {
  const context = useContext(walletContext)
  console.log('walletContext::', context)
  if (!context) {
    throw new Error('useWaller must be used within a WalletProvider')
  }
  return context
}