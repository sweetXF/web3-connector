import { useEffect, useState } from 'react';
import { subscribeWallets, type Eip6963ProviderDetail } from '../connectors/eip6963';

// 可选 hook：返回 EIP-6963 发现的钱包列表
export const useEip6963Wallets = (): Eip6963ProviderDetail[] => {
  const [wallets, setWallets] = useState<Eip6963ProviderDetail[]>([]);
  useEffect(() => {
    return subscribeWallets((list) => setWallets(list));
  }, []);
  return wallets;
};
