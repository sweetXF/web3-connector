import React,{createContext,useContext,useState,useEffect, useMemo} from "react";
import type { Wallet, WalletContextValue, WalletProviderProps, WalletState } from "../types";
import WalletModal from "../components/WalletModal";

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

export const WalletProvider:React.FC<WalletProviderProps> = ({ //组件接收子组件传过来的参数类型 WalletProviderProps
    children,
    chains,
    wallets,
    provider,
    autoConnect
}) => {
    //钱包状态
    const [state,setState] = useState<WalletState>({ //组件内部状态类型 WalletState
            address:'',
            chainID:-1,
            isConnected:false,
            isConnecting:false,
            ensName:null,
            error:null,
            chains:chains,
            provider:provider,
    });

    const [modalOpen,setModalOpen] = useState(false);

    //wallets = [ { id: 'metamask', name: 'MetaMask', ... },            { id: "coinbase", name: "Coinbase", ... }]
    //walletsMap= { metamask: { id: "metamask", name: "MetaMask", ... }, coinbase: { id: "coinbase", name: "Coinbase", ... } }
    //钱包映射表
    const walletsMap=useMemo(()=>{
        return wallets.reduce((acc,wallet)=>{
            acc[wallet.id]=wallet;
            return acc;
        },{} as Record<string,Wallet>)
    },[wallets])

    //自动连接
    useEffect(()=>{
        if(autoConnect && wallets.length>0){
            console.log('wallets:',wallets);
        }
    },[autoConnect,wallets])

    //上下文value
    const value:WalletContextValue={ 
        ...state,
        connect:async (walletID:string) => {
            const wallet=walletsMap[walletID];
            console.log('wallet:',wallet);
            if(!wallet){
                throw new Error("Wallet not found");
            }
            //开始连接
            setState((prev)=>({
                ...prev,
                isConnecting:true,
                error:null
            }))
            //执行连接 
            try{
                const connector= await wallet.connector();
                console.log('wallet.connector',connector);
                setState((prev)=>({
                    ...prev,
                    isConnecting:false,
                    isConnected:true,
                    address:connector?.address || "",
                    chainID:connector?.chainID ||  0
                }));
                setModalOpen(false);// 连接成功关闭弹窗
               
            }catch(err){
                setState((prev)=>({
                    ...prev,
                    isConnecting:false,
                    error: err as Error
                }));
            }
        },
        //断开连接
        disconnect:async () => {
            setState({
                address:'',
                chainID:-1,
                isConnected:false,
                isConnecting:false,
                ensName:null,
                error:null,
                chains:chains,
                provider:null
            })
        },
        //切换链
        switchChain:async (curChainId:number) => {
            try{
                setState((prev)=>({
                    ...prev,
                    error:null
                }))
                setState((prev)=>({
                    ...prev,
                    chainID:curChainId
                }))
            }catch(err){
                setState((prev)=>({
                    ...prev,
                    error:err as Error
                }))
            }
        },
        openModal:() => {
            setModalOpen(true);
        },
        closeModal:() => {
            setModalOpen(false);
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

export const useWallet=():WalletContextValue=>{ //函数返回值类型 WalletContextValue
    const context=useContext(walletContext);
    console.log('useContext(walletContext)::',context);
    if(!context){
        throw new Error("useWaller must be used within a WalletProvider");
    }
    return context;
}

export default WalletProvider;