import { useWallet } from "../provider";
import { useState } from "react";
interface ConnectButtonProps {
    label?: string;
    showBalance?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
    onConnect?: () => void;
    onDisconnect?: () => void;
    OnChainChange?: (chainId:number) => void;
    onBalanceChange?: (balance:string) => void;
}

const ConnectButton = ({
    label="Connect Wallet",
    showBalance=false,
    size="md",
    className="",
    onConnect,
    onDisconnect,
    OnChainChange,
    onBalanceChange
}:ConnectButtonProps) => {
    const {connect, disconnect,isConnected,address,chainID,ensName,error,openModal}=useWallet();

    const [balance, setBalance] = useState('');

    const sizeClasses = { //tailwindcss
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-5 py-2.5',
    };

    const handleConnect = async () => {
        await connect('inject');
        if(onConnect){
            onConnect();
        }
    };

    const handleDisconnect = async () => {
        await disconnect();
        if(onDisconnect){
            onDisconnect();
        }
    };

    // 如果钱包未连接
    if(!isConnected){
        return (
            <button className={`bg-blue-500 text-white font-bold py-2 px-4 rounded ${sizeClasses[size]}`}
            onClick={openModal}>
                {label}
            </button>
        )
    }

    // 如果钱包已连接
    return (
       <button className={`bg-blue-500 text-white font-bold py-2 px-4 rounded ${sizeClasses[size] }`}
       onClick={handleDisconnect}>
        {label}
       </button>
    )
}

export default ConnectButton;