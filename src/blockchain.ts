import { ethers } from 'ethers';

export class BlockchainManager {
  wallet: ethers.Wallet | null;
  provider: ethers.JsonRpcProvider | null;

  constructor() {
    // Disable blockchain for now
    this.wallet = null;
    this.provider = null;
  }

  async postResults(results: any) {
    // Stub: log to console
    console.log('Posting to blockchain:', results);
  }
}
