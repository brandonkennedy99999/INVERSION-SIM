// BlockchainStore.ts

/**
 * Ethereum Anomaly Storage
 * This file manages the storage of anomalies detected in Ethereum blockchain transactions.
 */

class BlockchainStore {
    private anomalies: any[];

    constructor() {
        this.anomalies = [];
    }

    addAnomaly(anomaly: any): void {
        this.anomalies.push(anomaly);
    }

    getAnomalies(): any[] {
        return this.anomalies;
    }

    clearAnomalies(): void {
        this.anomalies = [];
    }
}

export default BlockchainStore;
