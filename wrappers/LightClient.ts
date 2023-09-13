import {Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, Sender, SendMode} from 'ton-core';

export type LightClientConfig = {
    // id: number;
};

export function lightClientConfigToCell(config: LightClientConfig): Cell {
    const CommitteeContent = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Buffer(48));
    return beginCell()
    .storeRef(beginCell().storeDict(CommitteeContent).endCell())
    .storeRef(beginCell().endCell())
    .storeRef(beginCell().storeUint(0, 32 * 8).endCell())
    .endCell();
}

export const Opcodes = {
    init_committee: 0xed62943d,
    update_committee: 0xd162d319,
    update_beacon: 0x594d8d1c,
    proof_receipt: 0x8d684a04,
};

export class LightClient implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new LightClient(address);
    }

    static createFromConfig(config: LightClientConfig, code: Cell, workchain = 0) {
        const data = lightClientConfigToCell(config);
        const init = { code, data };
        return new LightClient(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendInitCommittee(
        provider: ContractProvider,
        via: Sender,
        opts: {

            value: bigint;
            queryID?: number;
            committee: Cell
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.init_committee, 32)
                .storeUint(opts.queryID ?? 0, 64)

                .storeRef(opts.committee)
                .endCell(),
        });
    }

    async sendUpdateCommittee(
        provider: ContractProvider,
        via: Sender,
        opts: {

            value: bigint;
            queryID?: number;
            committee: Cell;
            committee_branch: Cell;

        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.update_committee, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.committee)
                .storeRef(opts.committee_branch)
                .endCell(),
        });
    }

    async sendUpdateBeacon(
        provider: ContractProvider,
        via: Sender,
        opts: {

            value: bigint;
            queryID?: number;
            aggregate: Cell;
            beaconSSZ: Cell;

        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.update_beacon, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.aggregate)
                .storeRef(opts.beaconSSZ)

                .endCell(),
        });
    }

    async sendUpdateReceipt(
        provider: ContractProvider,
        via: Sender,
        opts: {

            value: bigint;
            queryID?: number;
            execution: Cell;
            execution_branch: Cell;

        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.proof_receipt, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.execution)
                .storeRef(opts.execution_branch)

                .endCell(),
        });
    }

    // async getCounter(provider: ContractProvider) {
    //     const result = await provider.get('get_counter', []);
    //     return result.stack.readNumber();
    // }

    // async getID(provider: ContractProvider) {
    //     const result = await provider.get('get_id', []);
    //     return result.stack.readNumber();
    // }

    async getPubkeys(provider: ContractProvider) {
        const result = await provider.get('get_pubkeys', []);
        return result.stack.readCell();
    }
}
