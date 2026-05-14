// function isCoinbaseWalletInstalled(){
//     return typeof window !== 'undefined' && typeof (window as any).coinbaseWalletExtension !== 'undefined';
// }

const isCoinbaseWalletInstalled = typeof window !== 'undefined' && typeof (window as any).coinbaseWalletExtension !== 'undefined';

