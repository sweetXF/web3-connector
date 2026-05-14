export type Chain = {
    id:number;
    name:string;
    rpcUrl:string;//rpc地址
    currency:{//币种信息
        name:string;
        symbol:string;
        decimals:number;
    };
    blockExplorer:{//区块浏览器地址
        name:string;
        url:string;
    }
}

export interface WalletState{
    address:string | null;
    chainID:number | null;
    isConnected:boolean;
    isConnecting:boolean;
    ensName:string | null;
    error:Error | null;
    chains:Chain[];
    provider:any;
}

export interface WalletContextValue extends WalletState{
    connect:(walletID:string) => Promise<void>;
    disconnect:() => Promise<void>;//断开连接
    switchChain:(chainID:number) => Promise<void>;//切换链
    openModal:() => void;//打开弹窗
    closeModal:() => void;//关闭弹窗
}
 
export interface Wallet {
    id:string;
    name:string;
    icon:string;
    connector:() => Promise<any>;//钱包连接器
    description?:string;//描述
    installed?:boolean;//是否已安装
    downloadLink?:string;//未安装就导航到下载地址
}

//钱包上下文提供者属性
export type WalletProviderProps = {
    children:React.ReactNode;
    chains:Chain[];
    wallets:Wallet[];
    autoConnect?:boolean;//是否自动连接
    provider?:any;
}