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
    TupleItemSlice,
} from 'ton-core';
import {crc32} from '../crc32';

export type LightClientConfig = {
    // adapterAddr?: Address;
    initialBeacon?: Cell;
    key?: Uint8Array;
};

export function lightClientConfigToCell(config: LightClientConfig): Cell {
    const CommitteeContent = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Buffer(48));
    const BeaconsContent = Dictionary.empty(Dictionary.Keys.BigUint(32 * 8), Dictionary.Values.Cell());
    const BeaconsMetaContent = Dictionary.empty(Dictionary.Keys.BigUint(32 * 8), Dictionary.Values.Cell());
    if (config.initialBeacon && config.key) {
        // console.log(Buffer.from(config.key).toString('hex'))
        BeaconsContent.set(BigInt('0x' + Buffer.from(config.key).toString('hex')) , config.initialBeacon);

    }
    return beginCell()
        .storeRef(beginCell().storeDict(CommitteeContent).endCell())
        .storeRef(beginCell().storeDict(BeaconsContent).endCell())
        .storeRef(beginCell().storeDict(BeaconsMetaContent).endCell())
        .storeRef(beginCell().storeUint(0, 32 * 8).endCell())
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
    init_committee: crc32('op::init_committee'),
    add_optimistic_update: crc32('op::add_optimistic_update'),
    add_execution: crc32('op::add_execution'),
    add_next_sync_committee: crc32('op::add_next_sync_committee'),
    add_finally_update: crc32('op::add_finally_update'),
    verifyProof: crc32('verify_receipt'),
    calc_aggr_pubkey: crc32('beacons_meta_slice'),
    calc_committee_hash: crc32('calc_committee_hash'),
    verify_committee: crc32('verify_committee'),
    verify_optimistic: crc32('verify_optimistic'),
    aggregate_pubkey: crc32('aggregate_pubkey'),
    init_beacon: crc32('init_beacon'),
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

    async sendInitOptimisticUpdate(
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
                .storeUint(Opcodes.init_beacon, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.beacon)
                .endCell(),
        });
    }

    async sendAddOptimisticUpdate(
        provider: ContractProvider,
        via: Sender,
        opts: {

            value: bigint;
            queryID?: number;
            beacon: Cell;
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

    async sendVerifyOptimisticUpdate(
        provider: ContractProvider,
        via: Sender,
        opts: {

            value: bigint;
            queryID?: number;
            beacon: Cell;
            nextHash: string;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.verify_optimistic, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeBuffer(Buffer.from(opts.nextHash.slice(2), 'hex'))
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
                .storeRef(opts.beacon_hash)
                .endCell(),
        });
    }

    async sendCalcNextCommitteeHash(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
            beacon_hash: Cell;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.calc_committee_hash, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.beacon_hash)
                .endCell(),
        });
    }

    async sendVerifyNextCommittee(
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
                .storeUint(Opcodes.verify_committee, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.committee)
                .storeRef(opts.committee_branch)
                .storeRef(opts.beacon_hash)
                .endCell(),
        });
    }

    async sendAggregatePubkey(
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
                .storeUint(Opcodes.aggregate_pubkey, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.aggregate)
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

    async getBeaconValidationStatus(provider: ContractProvider, hash: string) {
        const state = await provider.getState();
        if (state.state.type !== 'active') {
            return { amount: 0n };
        }
        const { stack } = await provider.get('get_update_validation_status', [
            {
                type: 'slice',
                cell: beginCell().storeBuffer(Buffer.from(hash, 'hex'), 32).endCell()
            } as TupleItemSlice
        ]);
        const [isValid] = [stack.readNumber()];
        return { isValid: isValid === 1 };
    }

    async getLastFinalityHash(provider: ContractProvider) {
        const state = await provider.getState();
        if (state.state.type !== 'active') {
            return { amount: 0n };
        }
        const { stack } = await provider.get('get_last_filaity_hash', []);
        const [hash] = [stack.readBigNumber().toString(16) ];
        return { hash };
    }
}
