// 共享的 EIP-1193 监听器逻辑：被 eip6963.ts 以及 fallback 的 metamask.ts/coinbase.ts 复用
// 通过 window CustomEvent 把钱包事件转发给 Provider

// 解析 chainId（兼容 hex / decimal / bigint）
export const parseChainId = (raw: string | number | bigint): number => {
  if (typeof raw === 'string') {
    return raw.startsWith('0x') ? parseInt(raw, 16) : Number(raw);
  }
  return Number(raw);
};

// 创建一个 EIP-1193 监听器集合，绑定到指定 provider；返回 unbind 方法
// 同一个 provider 多次 bind 会自动复用，不会重复注册
type Eip1193Provider = {
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  chainId?: string;
};

const boundProviders = new WeakMap<
  object,
  {
    onAccountsChanged: (accounts: string[]) => void;
    onChainChanged: (raw: string | number | bigint) => void;
    onDisconnect: (err: unknown) => void;
  }
>();

// 绑定监听器
export const bindProviderListeners = (provider: Eip1193Provider) => {
  if (boundProviders.has(provider as object)) return;

  //账户变化
  const onAccountsChanged = (accounts: string[]) => {
    if (!accounts || accounts.length === 0) {
      window.dispatchEvent(new CustomEvent('wallet_disconnected'));
      return;
    }
    const currentChainId = provider.chainId ? parseChainId(provider.chainId) : undefined;
    window.dispatchEvent(
      new CustomEvent('wallet_accounts_changed', {
        detail: { accounts, chainId: currentChainId },
      }),
    );
  };

  //链变化
  const onChainChanged = (raw: string | number | bigint) => {
    const chainId = parseChainId(raw);
    window.dispatchEvent(new CustomEvent('wallet_chain_changed', { detail: { chainId } }));
  };

  //断开连接
  const onDisconnect = (err: unknown) => {
    window.dispatchEvent(new CustomEvent('wallet_disconnected', { detail: err }));
  };

  provider.on('accountsChanged', onAccountsChanged);
  provider.on('chainChanged', onChainChanged);
  provider.on('disconnect', onDisconnect);

  boundProviders.set(provider as object, { onAccountsChanged, onChainChanged, onDisconnect });
};

// 解绑监听器
export const unbindProviderListeners = (provider: Eip1193Provider) => {
  const handlers = boundProviders.get(provider as object);
  if (!handlers) return;
  provider.removeListener('accountsChanged', handlers.onAccountsChanged);
  provider.removeListener('chainChanged', handlers.onChainChanged);
  provider.removeListener('disconnect', handlers.onDisconnect);
  boundProviders.delete(provider as object);
};

export type { Eip1193Provider };
