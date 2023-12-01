import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    Sender,
    SendMode,
} from 'ton-core';

export type LightClientConfig = {
    // adapterAddr?: Address;
};

export function lightClientConfigToCell(config: LightClientConfig): Cell {
    const CommitteeContent = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Buffer(48));
    const BeaconsContent = Dictionary.empty(Dictionary.Keys.Uint(32 * 8), Dictionary.Values.Cell());
    return beginCell()
        .storeRef(beginCell().storeDict(CommitteeContent).endCell())
        .storeRef(beginCell().storeDict(BeaconsContent).endCell())
        // .storeRef(
        //     adapterAddr ?
        //     beginCell()
        //         .storeAddress(adapterAddr)
        //     .endCell() :
        //     beginCell()
        //         .storeSlice(
        //             beginCell()
        //                 .storeUint(0, 2)
        //             .endCell().beginParse()
        //         )
        //     .endCell()
        // )
        .endCell();
}

export const Opcodes = {
    init_committee: 0xed62943d,
    add_optimistic_update: 0x70a8758c,
    add_execution: 0xc52dcbd0,
    add_next_sync_committee: 0x1440cfc,
    add_finally_update: 0x57ef7473,
    verifyProof: 0x5e742370,
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

    async sendAddOptimisticUpdate(
        provider: ContractProvider,
        via: Sender,
        opts: {

            value: bigint;
            queryID?: number;
            beacon: Cell
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.add_optimistic_update, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.beacon)
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
            beacon_hash: Cell;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.add_execution, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.execution)
                .storeRef(opts.execution_branch)
                .storeRef(opts.beacon_hash)
                .endCell(),
        });
    }

    async sendNextCommittee(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
            committee: Cell;
            committee_branch: Cell;
            beacon_hash: Cell;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.add_next_sync_committee, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.committee)
                .storeRef(opts.committee_branch)
                .storeRef(opts.beacon_hash)
                .endCell(),
        });
    }

    async sendFinalityUpdate(
        provider: ContractProvider,
        via: Sender,
        opts: {

            value: bigint;
            queryID?: number;
            aggregate: Cell;
            beacon_hash: Cell;

        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.add_finally_update, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.aggregate)
                .storeRef(opts.beacon_hash)

                .endCell(),
        });
    }

    async sendVerifyProof(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
            receipt: Cell;
            adapterAddr: Address;
            path: Cell;
            receiptProof: Cell;
            beacon_hash: Cell;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.verifyProof, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.receipt)
                .storeRef(
                    beginCell()
                        .storeAddress(opts.adapterAddr)
                        .storeRef(opts.beacon_hash)
                    .endCell()
                )
                .storeRef(opts.path)
                .storeRef(opts.receiptProof)
                .endCell(),
        });
    }
}
