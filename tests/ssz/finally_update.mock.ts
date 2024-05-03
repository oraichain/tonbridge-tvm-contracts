import { ByteListType, ByteVectorType } from '@chainsafe/ssz';
import { Cell } from 'ton-core';
import { bytes } from '../../evm-data/utils';
import {
    BYTES_PER_LOGS_BLOOM,
    Bytes20,
    EXECUTION_PAYLOAD_DEPTH,
    FINALIZED_ROOT_DEPTH,
    LightClientFinalityUpdate,
    MAX_EXTRA_DATA_BYTES,
    UintBn256,
    executionBranch
} from './finally_update';
import updateJson from './finally_update.json';
import { SYNC_COMMITTEE_SIZE, stringToBitArray } from './ssz-beacon-type';
import {
    BLSSignatureToCell,
    SSZBitVectorToCell,
    SSZByteVectorTypeToCell,
    SSZRootToCell,
    SSZUintToCell,
    SSZVectorToCell,
    getSSZContainer,
} from './ssz-to-cell';

type BlockData =  (typeof updateJson)[0];

export function getTestData() {
    const obj = updateJson[0].data;

    return {
        json: obj,
        expectedHash: getExpectedHash(obj),
        cell: getFinallyUpdateCell(obj),
    };
}

export function getExpectedHash(data: BlockData['data']) {
    return LightClientFinalityUpdate.hashTreeRoot({
        attestedHeader: {
            beacon: {
                slot: +data.attested_header.beacon.slot,
                proposerIndex: +data.attested_header.beacon.proposer_index,
                parentRoot: bytes(data.attested_header.beacon.parent_root),
                stateRoot: bytes(data.attested_header.beacon.state_root),
                bodyRoot: bytes(data.attested_header.beacon.body_root),
            },
            execution: {
                parentHash: bytes(data.attested_header.execution.parent_hash),
                feeRecipient: bytes(data.attested_header.execution.fee_recipient),
                stateRoot: bytes(data.attested_header.execution.state_root),
                receiptsRoot: bytes(data.attested_header.execution.receipts_root),
                logsBloom: bytes(data.attested_header.execution.logs_bloom),
                prevRandao: bytes(data.attested_header.execution.prev_randao),
                blockNumber: +data.attested_header.execution.block_number,
                gasLimit: +data.attested_header.execution.gas_limit,
                gasUsed: +data.attested_header.execution.gas_used,
                timestamp: +data.attested_header.execution.timestamp,
                extraData: bytes(data.attested_header.execution.extra_data),
                baseFeePerGas: BigInt(data.attested_header.execution.base_fee_per_gas),
                blockHash: bytes(data.attested_header.execution.block_hash),
                transactionsRoot: bytes(data.attested_header.execution.transactions_root),
                withdrawalsRoot: bytes(data.attested_header.execution.withdrawals_root),
            },
            executionBranch: data.attested_header.execution_branch.map(bytes),
        },
        finalizedHeader: {
            beacon: {
                slot: +data.finalized_header.beacon.slot,
                proposerIndex: +data.finalized_header.beacon.proposer_index,
                parentRoot: bytes(data.finalized_header.beacon.parent_root),
                stateRoot: bytes(data.finalized_header.beacon.state_root),
                bodyRoot: bytes(data.finalized_header.beacon.body_root),
            },
            execution: {
                parentHash: bytes(data.finalized_header.execution.parent_hash),
                feeRecipient: bytes(data.finalized_header.execution.fee_recipient),
                stateRoot: bytes(data.finalized_header.execution.state_root),
                receiptsRoot: bytes(data.finalized_header.execution.receipts_root),
                logsBloom: bytes(data.finalized_header.execution.logs_bloom),
                prevRandao: bytes(data.finalized_header.execution.prev_randao),
                blockNumber: +data.finalized_header.execution.block_number,
                gasLimit: +data.finalized_header.execution.gas_limit,
                gasUsed: +data.finalized_header.execution.gas_used,
                timestamp: +data.finalized_header.execution.timestamp,
                extraData: bytes(data.finalized_header.execution.extra_data),
                baseFeePerGas: BigInt(data.finalized_header.execution.base_fee_per_gas),
                blockHash: bytes(data.finalized_header.execution.block_hash),
                transactionsRoot: bytes(data.finalized_header.execution.transactions_root),
                withdrawalsRoot: bytes(data.finalized_header.execution.withdrawals_root),
            },
            executionBranch: data.finalized_header.execution_branch.map(bytes),
        },
        finalityBranch: data.finality_branch.map(bytes),
        syncAggregate: {
            sync_committee_bits: stringToBitArray(data.sync_aggregate.sync_committee_bits),
            sync_committee_signature: bytes(data.sync_aggregate.sync_committee_signature),
        },
        signatureSlot: +data.signature_slot,
    });
}

export function getFinallyUpdateCell(data: BlockData['data']) {
    const signatureSlotCell = SSZUintToCell({ value: +data.signature_slot, size: 8 });
    const syncAggregate = getSSZContainer(
        SSZBitVectorToCell(
            data.sync_aggregate.sync_committee_bits,
            SYNC_COMMITTEE_SIZE,
            BLSSignatureToCell(data.sync_aggregate.sync_committee_signature)
        ),
        signatureSlotCell
    );

    let finalityBranchData!:Cell;

    for (let i = 0; i < data.finality_branch.length; i++) {
        const elem = data.finality_branch[i];
        finalityBranchData = SSZRootToCell(elem, finalityBranchData);
    }

    // const executionBranch2Cell = SSZVectorToCell(executionItemsCell, EXECUTION_PAYLOAD_DEPTH);

    // const finalityBranchData = Buffer.from(finalityBranch.hashTreeRoot(data.finality_branch.map(bytes))).toString(
    //     'hex'
    // );
    const finalityBranchCell = SSZVectorToCell(finalityBranchData, FINALIZED_ROOT_DEPTH, syncAggregate);

    const finalizedHeaderCell = getLightClientHeaderCell(data.finalized_header, finalityBranchCell);
    const attestedHeader = getLightClientHeaderCell(data.attested_header, finalizedHeaderCell);

    return getSSZContainer(attestedHeader);
}

export function getLightClientHeaderCell(data: BlockData['data']['attested_header'], tail?: Cell) {
    const executionBranch2Hash = Buffer.from(executionBranch.hashTreeRoot(data.execution_branch.map(bytes))).toString(
        'hex'
    );

    let executionItemsCell!:Cell;

    for (let i = 0; i < data.execution_branch.length; i++) {
        const elem = data.execution_branch[i];
        executionItemsCell = SSZRootToCell(elem, executionItemsCell);
    }

    const executionBranch2Cell = SSZVectorToCell(executionItemsCell, EXECUTION_PAYLOAD_DEPTH);

    const executionContainerCell = getExecutionContainerCell(data.execution, executionBranch2Cell);
    const beaconContainerCell = getSSZContainer(
        SSZUintToCell(
            { value: +data.beacon.slot, size: 8, isInf: true },
            SSZUintToCell(
                { value: +data.beacon.proposer_index, size: 8, isInf: false },
                SSZRootToCell(data.beacon.parent_root, SSZRootToCell(data.beacon.state_root, SSZRootToCell(data.beacon.body_root)))
            )
        ),
        executionContainerCell
    );

    return getSSZContainer(beaconContainerCell, tail);
}

export function getExecutionContainerCell(data: BlockData['data']['attested_header']['execution'], tail?: Cell) {
    const withdrawalsRootCell = SSZRootToCell(data.withdrawals_root);
    const transactionsCell = SSZRootToCell(data.transactions_root, withdrawalsRootCell);
    const blockHashCell = SSZRootToCell(data.block_hash, transactionsCell);
    const baseFeePerGasCell = SSZRootToCell(
        '0x' + Buffer.from(UintBn256.hashTreeRoot(BigInt(data.base_fee_per_gas))).toString('hex'),
        blockHashCell
    );
    const tmp = new ByteListType(MAX_EXTRA_DATA_BYTES);
    const extraDataCell = SSZRootToCell(
        '0x' + Buffer.from(tmp.hashTreeRoot(bytes(data.extra_data))).toString('hex'),
        baseFeePerGasCell
    );
    const timestampCell = SSZUintToCell({ value: +data.timestamp, size: 8, isInf: false }, extraDataCell);
    const gas_usedCell = SSZUintToCell({ value: +data.gas_used, size: 8, isInf: false }, timestampCell);
    const gas_limitCell = SSZUintToCell({ value: +data.gas_limit, size: 8, isInf: false }, gas_usedCell);
    const block_numberCell = SSZUintToCell({ value: +data.block_number, size: 8, isInf: false }, gas_limitCell);
    const prev_randao = SSZRootToCell(data.prev_randao, block_numberCell);
    const tmp2 = new ByteVectorType(BYTES_PER_LOGS_BLOOM);
    const logs_bloomCell = SSZByteVectorTypeToCell(
        data.logs_bloom,
        BYTES_PER_LOGS_BLOOM,
        tmp2.maxChunkCount,
        prev_randao
    );
    const receipts_root = SSZRootToCell(data.receipts_root, logs_bloomCell);
    const state_root = SSZRootToCell(data.state_root, receipts_root);
    const fee_recipient = SSZByteVectorTypeToCell(data.fee_recipient, 20, Bytes20.maxChunkCount, state_root);
    const parent_hash = SSZRootToCell(data.parent_hash, fee_recipient);

    return getSSZContainer(parent_hash, tail);
}
