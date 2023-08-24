import {Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode} from 'ton-core';

export type SSZContractConfig = {

};

export function readerContractConfigToCell(config: SSZContractConfig): Cell {
    return beginCell().endCell();
}

export const Opcodes = {
  run_ssz: 0x86f1bcc5
};

export class SSZContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new SSZContract(address);
    }

    static createFromConfig(config: SSZContractConfig, code: Cell, workchain = 0) {
        const data = readerContractConfigToCell(config);
        const init = { code, data };
        return new SSZContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendSSZ(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
            // receipt: Cell;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.run_ssz, 32)
                .storeUint(opts.queryID ?? 0, 64)
                // .storeRef(opts.receipt)
                .endCell(),
        });
    }

    async getID(provider: ContractProvider) {
        const result = await provider.get('get_id', []);
        return result.stack.readNumber();
    }
}
