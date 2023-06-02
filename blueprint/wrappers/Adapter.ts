import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type AdapterConfig = {};

export function adapterConfigToCell(config: AdapterConfig): Cell {
    return beginCell().endCell();
}

export class Adapter implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Adapter(address);
    }

    static createFromConfig(config: AdapterConfig, code: Cell, workchain = 0) {
        const data = adapterConfigToCell(config);
        const init = { code, data };
        return new Adapter(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendReceipt(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            receipt: Cell;
            addrStr: string;
            jminterAddr: Address;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeUint(BigInt(opts.addrStr), 256)
                .storeAddress(opts.jminterAddr)
                .storeRef(opts.receipt)
                .endCell(),
        });
    }
}
