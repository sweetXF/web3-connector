// https://eips.ethereum.org/EIPS/eip-6963
// - 钱包广播 `eip6963:announceProvider` 事件，detail 包含 info 和 provider
// - dapp 派发 `eip6963:requestProvider` 让钱包重播
// 通过该协议可同时发现多个钱包，每家钱包都暴露独立 provider，彻底避免 window.ethereum 冲突。

import { ethers } from 'ethers'
import type { Wallet, WalletConnector } from '../types'
import { bindProviderListeners, unbindProviderListeners, type Eip1193Provider } from './eip1193'

// EIP-6963 钱包元信息
export type Eip6963ProviderInfo = {
  uuid: string
  name: string
  icon: string
  rdns: string // reverse DNS, 如 "io.metamask"
}

export type Eip6963ProviderDetail = {
  info: Eip6963ProviderInfo
  provider: Eip1193Provider
}

// rdns -> detail 映射
const discovered = new Map<string, Eip6963ProviderDetail>()
// 订阅者列表
const subscribers = new Set<(wallets: Eip6963ProviderDetail[]) => void>()

// 通知所有订阅者
const notify = () => {
  const list = Array.from(discovered.values())
  subscribers.forEach((cb) => cb(list))
}

// 监听钱包广播
const handleAnnounce = (event: Event) => {
  const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail
  if (!detail || !detail.info?.rdns || !detail.provider) return
  // 以 rdns 为唯一键去重；如果同 rdns 重复广播，覆盖为最新的
  discovered.set(detail.info.rdns, detail)
  notify()
}

// 模块加载时立即开始监听 + 主动请求
let initialized = false
const initialize = () => {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  window.addEventListener('eip6963:announceProvider', handleAnnounce)
  // 主动请求一次（钱包注入时机可能早于监听，需要重播）
  window.dispatchEvent(new Event('eip6963:requestProvider'))
}
initialize()

// 获取已发现的钱包（同步快照）
export const getDiscoveredWallets = (): Eip6963ProviderDetail[] => {
  return Array.from(discovered.values())
}

// 订阅钱包列表变化，返回取消订阅函数
export const subscribeWallets = (
  callback: (wallets: Eip6963ProviderDetail[]) => void,
): (() => void) => {
  subscribers.add(callback)
  // 立即推一次当前快照
  callback(Array.from(discovered.values()))
  return () => {
    subscribers.delete(callback)
  }
}

// 把一个 EIP-6963 钱包包装为 SDK 的 Wallet 对象
export const createEip6963Wallet = (detail: Eip6963ProviderDetail): Wallet => {
  const { info, provider } = detail

  const connector = async (): Promise<WalletConnector> => {
    // 直接用 EIP-6963 提供的 provider 实例，跳过 window.ethereum 冲突
    const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' })
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found')
    }

    const ethersProvider = new ethers.BrowserProvider(provider as any)
    const signer = await ethersProvider.getSigner()
    const address = await signer.getAddress()
    const { chainId } = await ethersProvider.getNetwork()

    bindProviderListeners(provider)

    return {
      accounts,
      signer,
      address,
      chainId: Number(chainId),
      provider: ethersProvider,
      disconnect: async () => {
        unbindProviderListeners(provider)
      },
    }
  }

  return {
    id: `eip6963:${info.rdns}`,
    name: info.name,
    icon: info.icon,
    connector,
    description: `${info.name} (EIP-6963)`,
    installed: true,
  }
}

// 类型补丁：Window 上的 EIP-6963 事件
declare global {
  interface WindowEventMap {
    'eip6963:announceProvider': CustomEvent<Eip6963ProviderDetail>
    'eip6963:requestProvider': Event
  }
}
