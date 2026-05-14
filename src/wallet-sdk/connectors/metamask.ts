import { ethers } from "ethers";
import type { Wallet } from "../types";

const connectMetaMask = async (): Promise<any> => {
    if (window.ethereum) {
        try {
            const accounts=await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            };

            const provider=new ethers.BrowserProvider(window.ethereum);
            // 获取用户钱包信息
            const signer=provider.getSigner();
            const address = await (await signer).getAddress();
            const {chainId}=await provider.getNetwork();
            
            //监听账户连接变化
            window.ethereum.on('accountsChanged', (newAccounts:string[]) => {
                console.log('accountsChanged', newAccounts);
                if(newAccounts.length===0){
                    window.dispatchEvent(new CustomEvent('wallet_disconnected'));
                }else{
                    window.dispatchEvent(new CustomEvent('wallet_accounts_changed',{detail:{accounts:newAccounts,chainId}}));
                }
            });

            //监听区块链变化（网络切换）
            window.ethereum.on('chainChanged', (newChainIdHex:string) => {
                const newChainId=parseInt(newChainIdHex);
                console.log('chainChanged', newChainId);
                window.dispatchEvent(new CustomEvent('wallet_chain_changed',{detail:{chainId:newChainId}}));
            });

            return { accounts,signer, address,chainId};
        } catch (error: any) {
            throw new Error(error.message, { cause: error });
        }
    } else {
        throw new Error('MetaMask not installed');
    }
};

export const metamaskWallet:Wallet={
    id:'metamask',
    name:'MetaMask',
    icon:'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1696501628',
    connector:connectMetaMask,
    description:'MetaMask is a non-custodial hot wallet',
    installed:true,
    downloadLink:'https://metamask.io/download/'
};

export default metamaskWallet;