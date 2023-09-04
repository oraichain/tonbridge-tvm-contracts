import {Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode} from 'ton-core';

export type SSZContractConfig = {

};

export function readerContractConfigToCell(config: SSZContractConfig): Cell {
    return beginCell().endCell();
}

export const Opcodes = {
  run_ssz: 0x86f1bcc5,
  run_verify_receipt: 0x44b4412c,

  type__bool: 0xf43a7aa,
  type__uint: 0xcc771d29,

  type__byteVector: 0x8f2cdfd8,
  type__bytelist: 0x31ffdd28,
  type__container: 0x81706e6d,
  type__list: 0x1e0a6920,
  type__vector: 0x8bf90db0,
  type__empty: 0x409f47cb,
  type__bitlist: 0x501abea0,
  type__bitVector: 0xa8cd9c9c
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
            data: Cell;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.run_ssz, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.data)
                .endCell(),
        });
    }

    async sendVerifyReceipt(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
            data: Cell;
            committee_branch: Cell;
            committee_pubs_cell: Cell;
            next_committee_data: Cell;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.run_verify_receipt, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.data)
                .storeRef(opts.committee_branch)
                .storeRef(opts.committee_pubs_cell)
                .storeRef(opts.next_committee_data)
                .endCell(),
        });
    }

    async getID(provider: ContractProvider) {
        const result = await provider.get('get_id', []);
        return result.stack.readNumber();
    }
}
