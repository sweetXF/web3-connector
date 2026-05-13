import React,{createContext,useContext,useState,useEffect} from "react";
import type { WalletContextValue, WalletProviderProps, WalletState } from "../types";

//钱包全局上下文
const walletContext=createContext<WalletContextValue>({
    connect:async ()=>{},
    disconnect:async ()=>{},
    isConnected:false,
    isConnecting:false,
    address:"",
    chainID:0,
    switchChain:async ()=>{},
    openModal():void {},
    closeModal():void {},
    ensName:null,
    error:null,
    chains:[],
    provider:undefined
})

export const walletProvider:React.FC<WalletProviderProps> = ({
    children,
    chains,
    wallets,
    provider,
    autoConnect
}) => {
    //钱包状态
    const [state,setState] = useState<WalletState>({
            address:'',
            chainID:-1,
            isConnected:false,
            isConnecting:false,
            ensName:'',
            error:null,
            chains:chains,
            provider:provider,
    });

    const value:WalletContextValue={
        ...state,
        connect:async () => {},
        disconnect:async () => {},
        switchChain:async () => {},
        openModal:() => {},
        closeModal:() => {},
    }

    return (
        <walletContext.Provider value={value}>
            {children}
        </walletContext.Provider>
    )
}

export const useWaller=():WalletContextValue=>{
    const context=useContext(walletContext);
    console.log('useContext(walletContext)::',context);
    if(!context){
        throw new Error("useWaller must be used within a WalletProvider");
    }
    return context;
}

export default walletProvider;