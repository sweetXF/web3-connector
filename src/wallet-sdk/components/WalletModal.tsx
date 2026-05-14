import type { Wallet } from "../types";

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    wallets: Wallet[];
    onSelectWallet: (wallet: Wallet) => void;
    isConnecting: boolean;
    error: Error | null;
}

const WalletModal = ({
    isOpen,
    onClose,
    wallets,
    onSelectWallet,
    isConnecting,
    error
}:WalletModalProps) => {
    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex justify-center items-center" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg w-80" onClick={(e)=>e.stopPropagation()}>
                
                <h2 className="text-2xl font-bold"> Select a Wallet</h2>

                {isConnecting && (
                    <p className="text-blue-500 text-sm mb-2">Connecting wallet...</p>
                )}

                {error && (
                    <p  className="text-blue-500 text-sm mb-2">{error.message}</p>
                )}

                {/* 渲染 wallets */}
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {wallets.map((wallet) => (
                        <div key={wallet.id} className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                         onClick={()=>onSelectWallet(wallet)}>
                            <img src={wallet.icon} alt={wallet.name} className="w-6 h-6 mr-2" />
                            <span className="text-sm">{wallet.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default WalletModal;