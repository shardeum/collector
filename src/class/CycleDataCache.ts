import * as DataSync from './DataSync'

// A class to store one cycle data at a time in cache
export class CycleDataCache {
    cycleNumber: number;
    receiptCount: number;
    transactionCount: number;

    constructor() {
        this.cycleNumber = -1;
        this.receiptCount = -1;
        this.transactionCount = -1;
    }

    async getCycleDataFor(cycleNumber: number): Promise<{ receiptCount: number, transactionCount: number } | null> {
        if (this.cycleNumber === cycleNumber) {
            // return receipt and transaction count
            return { receiptCount: this.receiptCount, transactionCount: this.transactionCount };
        }
        console.log(`Cache miss for cycle number:  ${cycleNumber}. Fetching data from distributor`);
        // fetch data from distributor
        await this.fetchCycleData(cycleNumber);
        if (this.cycleNumber === cycleNumber) {
            return { receiptCount: this.receiptCount, transactionCount: this.transactionCount };
        } else {
            return null;
        }
    }

    async fetchCycleData(cycleNumber: number): Promise<void> {
        const response = await DataSync.queryFromDistributor(DataSync.DataType.CYCLEDATA, {
            cycle: cycleNumber,
        })

        if (response) {
            this.cycleNumber = cycleNumber;
            this.receiptCount = response.data.totalReceipts;
            this.transactionCount = response.data.totalTransactions;
        }
    }

}