import {Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode} from 'ton-core';
import {bytes32, crc32} from '../evm-data/utils';

export type AdapterConfig = {
    topic_mint_id?: string;
    topic_burn_id?: string;
    light_client_addr: Address;
    // jminter_addr: Address;
};

export enum BridgeOpCodes {
    WRAP =  0xf0a28992,
    SEND_RECEIPT = crc32('send_receipt'),
    CONFIRM_RECEIPT = crc32('receipt_confirmed'),
    SET_JMINTER = crc32('set_jminter'),
}

export function adapterConfigToCell(config: AdapterConfig): Cell {
    return beginCell()
        .storeRef(
            beginCell()
                .storeAddress(config.light_client_addr)
            .endCell()
        )
        .storeRef(
            beginCell()
                .storeBuffer(bytes32(config.topic_mint_id || '0x0'), 32)
            .endCell()
        )
        .storeRef(
            beginCell()
                .storeBuffer(bytes32(config.topic_burn_id || '0x0'), 32)
            .endCell()
        )
        .storeRef(
            beginCell()
                .storeSlice(
                    beginCell()
                        .storeUint(0, 2)
                    .endCell().beginParse()
                )
                // .storeAddress(config.jminter_addr)
            .endCell()
        )
    .endCell();
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
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(BridgeOpCodes.SEND_RECEIPT, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.receipt)
                .endCell(),
        });
    }

    async sendConfirmReceipt(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            receipt: Cell;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(BridgeOpCodes.CONFIRM_RECEIPT, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.receipt)
                .endCell(),
        });
    }

    async sendWrap(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        params: {
            ethAddr: string;
            amount: bigint;
        }
    ) {
        return await provider.internal(via, {
            value,
            body: beginCell()
                .storeUint(BridgeOpCodes.WRAP, 32)
                .storeUint(0, 64)
                .storeUint(BigInt(params.ethAddr), 256)
                .storeUint(params.amount, 256)
                .endCell(),
        });
    }

    async sendJminterAddr(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            jminterAddr: Address;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(BridgeOpCodes.SET_JMINTER, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeAddress(opts.jminterAddr)
                .endCell(),
        });
    }
}
