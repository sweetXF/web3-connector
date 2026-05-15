import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ethers } from 'ethers'
import type {
  Chain,
  Wallet,
  WalletConnector,
  WalletContextValue,
  WalletProviderProps,
  WalletState,
} from '../types'
import WalletModal from '../components/WalletModal'

//localStorage key 存储上次连接的钱包id，用于 autoConnect 恢复
const LAST_CONNECTED_KEY = 'wallet:lastConnectedId'

//RPC URL:用于 ENS 反查的主网 provider
const MAINNET_RPC = process.env.PUBLIC_INFURA_ID

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

export const WalletProvider: React.FC<WalletProviderProps> = ({
  //组件接收子组件传过来的参数类型 WalletProviderProps
  children,
  chains,
  wallets,
  provider,
  autoConnect,
}) => {
  //钱包状态
  const [state, setState] = useState<WalletState>({
    //组件内部状态类型 WalletState
    address: '',
    chainID: -1,
    isConnected: false,
    isConnecting: false,
    ensName: null,
    error: null,
    chains: chains,
    provider: provider,
  })

  const [modalOpen, setModalOpen] = useState(false)

  // 保存当前活跃 connector 的 disconnect 方法，断开连接时用于卸载底层监听器
  const activeDisconnectRef = useRef<(() => Promise<void>) | null>(null)

  //wallets = [ { id: 'metamask', name: 'MetaMask', ... },            { id: "coinbase", name: "Coinbase", ... }]
  //walletsMap= { metamask: { id: "metamask", name: "MetaMask", ... }, coinbase: { id: "coinbase", name: "Coinbase", ... } }
  //钱包映射表
  const walletsMap = useMemo(() => {
    return wallets.reduce(
      (acc, wallet) => {
        acc[wallet.id] = wallet
        return acc
      },
      {} as Record<string, Wallet>,
    )
  }, [wallets])

  // 用 ref 保存上次 walletsMap。组件多次渲染，ref 对象始终是同一个对象
  const walletsMapRef = useRef(walletsMap)
  useEffect(() => {
    //每次更新记录旧值(walletsMapRef.current)
    walletsMapRef.current = walletsMap
  }, [walletsMap])

  // 通过walletID连接钱包：useEffect / autoConnect / context.connect 都复用它
  const connectById = useCallback(async (walletID: string) => {
    const wallet = walletsMapRef.current[walletID]
    console.log('cur-wallet:', wallet)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    setState((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
    }))

    try {
      const connector = (await wallet.connector()) as WalletConnector
      console.log('wallet-connector:', connector)

      // 如果之前有活跃连接，先卸载它的监听器再切换
      if (activeDisconnectRef.current) {
        await activeDisconnectRef.current().catch(() => {})
      }
      activeDisconnectRef.current = connector?.disconnect ?? null

      // 持久化当前 walletId，供 autoConnect 下次启动时恢复
      try {
        localStorage.setItem(LAST_CONNECTED_KEY, walletID)
      } catch {
        // 隐私模式 / 禁用 storage 时忽略
        console.warn('Failed to save last connected wallet ID')
      }

      setState((prev) => ({
        ...prev,
        isConnecting: false,
        isConnected: true,
        address: connector?.address || '',
        chainID: connector?.chainId ?? 0,
        provider: connector?.provider ?? prev.provider,
      }))
      setModalOpen(false) // 连接成功关闭弹窗
    } catch (err) {
      // 连接失败时清掉持久化标记，避免下次自动连接还触发同一个失败钱包
      try {
        localStorage.removeItem(LAST_CONNECTED_KEY)
      } catch {
        /* ignore */
        console.warn('Failed to remove last connected wallet ID')
      }
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: err as Error,
      }))
      throw err
    }
  }, [])

  //自动连接autoConnect：页面挂载后尝试用上次的 walletId 恢复
  useEffect(() => {
    if (!autoConnect || wallets.length === 0) return

    let lastId: string | null = null
    try {
      lastId = localStorage.getItem(LAST_CONNECTED_KEY)
    } catch {
      /* ignore */
      console.warn('Failed to get last connected wallet ID')
    }
    if (!lastId) return
    if (!walletsMapRef.current[lastId]) return

    connectById(lastId).catch((err) => {
      console.warn('autoConnect failed:', err)
    })
    // 仅在挂载时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ENS 反向解析：address 变化时根据主网 provider 查询 ensName
  useEffect(() => {
    if (!state.address) {
      setState((prev) => (prev.ensName === null ? prev : { ...prev, ensName: null }))
      return
    }

    let cancelled = false // 取消请求
    ;(async () => {
      try {
        const mainnetProvider = new ethers.JsonRpcProvider(MAINNET_RPC) // 主网 provider
        const name = await mainnetProvider.lookupAddress(state.address as string)
        if (cancelled) return
        setState((prev) =>
          prev.address === state.address ? { ...prev, ensName: name ?? null } : prev,
        )
      } catch (err) {
        if (cancelled) return
        console.warn('ENS lookup failed:', err)
        setState((prev) =>
          prev.address === state.address ? { ...prev, ensName: null } : prev,
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [state.address])

  // 监听 connector 派发的钱包事件，更新同步到 state
  useEffect(() => {
    // 监听账户变化
    const onAccountsChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ accounts: string[]; chainId?: number }>).detail
      if (!detail || !detail.accounts || detail.accounts.length === 0) return
      setState((prev) => ({
        ...prev,
        address: detail.accounts[0] ?? '',
        chainID: typeof detail.chainId === 'number' ? detail.chainId : prev.chainID,
        isConnected: true,
      }))
    }

    // 监听链变化
    const onChainChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ chainId: number }>).detail
      if (!detail || typeof detail.chainId !== 'number') return
      setState((prev) => ({
        ...prev,
        chainID: detail.chainId,
      }))
    }

    // 监听断开连接
    const onDisconnected = () => {
      // 调用底层卸载监听
      activeDisconnectRef.current?.().catch(() => {})
      activeDisconnectRef.current = null

      // 清掉 autoConnect 持久化
      try {
        localStorage.removeItem(LAST_CONNECTED_KEY)
      } catch {
        /* ignore */
        console.warn('Failed to remove last connected wallet ID')
      }

      setState((prev) => ({
        ...prev,
        address: '',
        chainID: -1,
        isConnected: false,
        isConnecting: false,
        ensName: null,
        provider: null,
      }))
    }

    //增加事件监听
    window.addEventListener('wallet_accounts_changed', onAccountsChanged)
    window.addEventListener('wallet_chain_changed', onChainChanged)
    window.addEventListener('wallet_disconnected', onDisconnected)

    return () => {
      //移除事件监听
      window.removeEventListener('wallet_accounts_changed', onAccountsChanged)
      window.removeEventListener('wallet_chain_changed', onChainChanged)
      window.removeEventListener('wallet_disconnected', onDisconnected)
    }
  }, [])

  //上下文value
  const value: WalletContextValue = {
    ...state,
    connect: connectById,
    //断开连接
    disconnect: async () => {
      // 调用底层 connector 的 disconnect，移除事件监听
      if (activeDisconnectRef.current) {
        await activeDisconnectRef.current().catch(() => {})
        activeDisconnectRef.current = null
      }

      // 清理 autoConnect 的持久化标记
      try {
        localStorage.removeItem(LAST_CONNECTED_KEY)
      } catch {
        /* ignore */
        console.warn('Failed to remove last connected wallet ID')
      }

      setState({
        address: '',
        chainID: -1,
        isConnected: false,
        isConnecting: false,
        ensName: null,
        error: null,
        chains: chains,
        provider: null,
      })
    },
    //切换链
    switchChain: async (curChainId: number) => {
      const eth = (window as any).ethereum
      if (!eth) return
      const hexChainId = '0x' + curChainId.toString(16)
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }],
        })
        // 成功后会通过 chainChanged 事件回流到 state，这里清空 error
        setState((prev) => ({ ...prev, error: null }))
      } catch (err: any) {
        // 4902：链未添加到钱包，尝试添加
        const code = err?.code ?? err?.data?.originalError?.code
        if (code === 4902) {
          const target: Chain | undefined = chains.find((c) => c.id === curChainId)
          if (!target) {
            setState((prev) => ({ ...prev, error: err as Error }))
            return
          }
          try {
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: hexChainId,
                  chainName: target.name,
                  rpcUrls: [target.rpcUrl],
                  nativeCurrency: {
                    name: target.currency.name,
                    symbol: target.currency.symbol,
                    decimals: target.currency.decimals,
                  },
                  blockExplorerUrls: target.blockExplorer?.url ? [target.blockExplorer.url] : [],
                },
              ],
            })
            // 添加成功后通常会自动切链；为保险再尝试一次 switch
            await eth
              .request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: hexChainId }],
              })
              .catch(() => {})
            setState((prev) => ({ ...prev, error: null }))
          } catch (addErr) {
            setState((prev) => ({ ...prev, error: addErr as Error }))
          }
          return
        }

        setState((prev) => ({
          ...prev,
          error: err as Error,
        }))
      }
    },
    openModal: () => {
      setModalOpen(true)
    },
    closeModal: () => {
      setModalOpen(false)
    },
  }

  return (
    // 把 value 共享给所有子组件
    <walletContext.Provider value={value}>
      {children}
      <WalletModal
        isOpen={modalOpen}
        onClose={value.closeModal}
        wallets={wallets}
        onSelectWallet={(wallet) => value.connect(wallet.id)}
        isConnecting={state.isConnecting}
        error={state.error}
      />
    </walletContext.Provider>
  )
}

export default WalletProvider
