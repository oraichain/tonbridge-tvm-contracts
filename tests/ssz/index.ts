import { ByteListType, ByteVectorType } from '@chainsafe/ssz';
import { splitIntoRootChunks } from '@chainsafe/ssz/lib/util/merkleize';
import { Cell, beginCell } from 'ton-core';
import { bytes } from '../../evm-data/utils';
import { Opcodes } from '../../wrappers/SSZ';
import blockJson from './beacon-block.json';
import {
    BYTES_PER_LOGS_BLOOM,
    Bytes20,
    MAX_ATTESTATIONS,
    MAX_ATTESTER_SLASHINGS,
    MAX_DEPOSITS,
    MAX_EXTRA_DATA_BYTES,
    MAX_PROPOSER_SLASHINGS,
    MAX_VALIDATORS_PER_COMMITTEE,
    MAX_VOLUNTARY_EXITS,
    SYNC_COMMITTEE_SIZE,
    SignedBeaconBlock,
    Transactions,
    UintBn256,
    stringToBitArray
} from './ssz-beacon-type';
import { BLSSignatureToCell, SSZBitVectorToCell, SSZByteVectorTypeToCell, SSZRootToCell, SSZUintToCell } from './ssz-to-cell';

interface IBeaconMessage {
    slot: number;
    proposer_index: number;
    parent_root: string;
    state_root: string;
    body: {
        randao_reveal: string;
        eth1_data: {
            deposit_root: string;
            deposit_count: number;
            block_hash: string;
        };
        graffiti: string;
        proposer_slashings: any[];
        attester_slashings: any[];
        attestations: typeof blockJson.data.message.body.attestations;
        deposits: any[];
        voluntary_exits: any[];
        sync_aggregate: typeof blockJson.data.message.body.sync_aggregate;
        execution_payload: typeof blockJson.data.message.body.execution_payload;
    };
}

export function buildBlockCell() {
    const block = blockJson.data;

    const hash = SignedBeaconBlock.hashTreeRoot({
        message: {
            ...block.message,
            parent_root: bytes(block.message.parent_root),
            state_root: bytes(block.message.state_root),
            body: {
                ...block.message.body,
                randao_reveal: bytes(block.message.body.randao_reveal),
                eth1_data: {
                    ...block.message.body.eth1_data,
                    deposit_root: bytes(block.message.body.eth1_data.deposit_root),
                    deposit_count: block.message.body.eth1_data.deposit_count,
                    block_hash: bytes(block.message.body.eth1_data.block_hash),
                },
                graffiti: bytes(block.message.body.graffiti),
                proposer_slashings: block.message.body.proposer_slashings,
                attester_slashings: block.message.body.attester_slashings,
                attestations: [
                    ...block.message.body.attestations.map((att) => {
                        return {
                            ...att,
                            aggregation_bits: stringToBitArray(att.aggregation_bits),
                            data: {
                                ...att.data,
                                slot: att.data.slot,
                                index: att.data.index,
                                beacon_block_root: bytes(att.data.beacon_block_root),
                                source: {
                                    epoch: att.data.source.epoch,
                                    root: bytes(att.data.source.root),
                                },
                                target: {
                                    epoch: att.data.target.epoch,
                                    root: bytes(att.data.target.root),
                                },
                            },
                            signature: bytes(att.signature),
                        };
                    }),
                ],
                deposits: block.message.body.deposits,
                voluntary_exits: block.message.body.voluntary_exits,
                sync_aggregate: {
                  sync_committee_bits: stringToBitArray(block.message.body.sync_aggregate.sync_committee_bits),
                  sync_committee_signature: bytes(block.message.body.sync_aggregate.sync_committee_signature)
                },
                execution_payload: {
                  parent_hash: bytes(block.message.body.execution_payload.parent_hash),
                  fee_recipient: bytes(block.message.body.execution_payload.fee_recipient),
                  state_root: bytes(block.message.body.execution_payload.state_root),
                  receipts_root: bytes(block.message.body.execution_payload.receipts_root),
                  logs_bloom: bytes(block.message.body.execution_payload.logs_bloom),
                  prev_randao: bytes(block.message.body.execution_payload.prev_randao),
                  block_number: block.message.body.execution_payload.block_number,
                  gas_limit: block.message.body.execution_payload.gas_limit,
                  gas_used: block.message.body.execution_payload.gas_used,
                  timestamp: block.message.body.execution_payload.timestamp,
                  extra_data: bytes(block.message.body.execution_payload.extra_data),
                  base_fee_per_gas: BigInt(block.message.body.execution_payload.base_fee_per_gas),
                  block_Hash: bytes(block.message.body.execution_payload.block_hash),
                  transactions: block.message.body.execution_payload.transactions.map(bytes)
                  // bec521ab86a14d3d059af878a296e2f321b4d7b0602998571d30eee995601ab5
                  // transactions: Transactions.hashTreeRoot(block.message.body.execution_payload.transactions.map(bytes))
                }
            },
        },
        signature: bytes(block.signature),
    });

    return {
        hash,
        cell: SignedBeaconBlockToCell(block),
    };
}

function SignedBeaconBlockToCell<
    T extends {
        message: IBeaconMessage;
        signature: string;
    }
>(value: T) {
    return beginCell()
        .storeUint(Opcodes.type__container, 32)
        .storeRef(BeaconBlockMessageToCell(value.message, BLSSignatureToCell(value.signature)))
        .endCell();
}

function BeaconBlockMessageToCell<T extends IBeaconMessage>(value: T, leaf?: Cell) {
    let builder = beginCell()
        .storeUint(Opcodes.type__container, 32)
        .storeRef(
            SSZUintToCell(
                {value: value.slot,
                size: 8,
                isInf: true},
                SSZUintToCell(
                    {value: value.proposer_index,
                    size: 8,
                    isInf: false},
                    SSZRootToCell(
                        value.parent_root,
                        SSZRootToCell(
                            value.state_root,
                            beginCell()
                                .storeUint(Opcodes.type__container, 32)
                                .storeRef(
                                    BLSSignatureToCell(
                                        value.body.randao_reveal,
                                        beginCell()
                                            .storeUint(Opcodes.type__container, 32)
                                            .storeRef(
                                                SSZRootToCell(
                                                    value.body.eth1_data.deposit_root,
                                                    SSZUintToCell(
                                                        {value: value.body.eth1_data.deposit_count,
                                                        size: 8,
                                                        isInf: false},
                                                        SSZRootToCell(value.body.eth1_data.block_hash)
                                                    )
                                                )
                                            )
                                            .storeRef(
                                                SSZRootToCell(
                                                    value.body.graffiti,
                                                    beginCell()
                                                        .storeUint(Opcodes.type__list, 32)
                                                        .storeUint(MAX_PROPOSER_SLASHINGS, 64)
                                                        .storeBit(true)
                                                        .storeRef(
                                                            beginCell().storeUint(Opcodes.type__empty, 32).endCell()
                                                        )
                                                        .storeRef(
                                                            beginCell()
                                                                .storeUint(Opcodes.type__list, 32)
                                                                .storeUint(MAX_ATTESTER_SLASHINGS, 64)
                                                                .storeBit(true)
                                                                .storeRef(
                                                                    beginCell()
                                                                        .storeUint(Opcodes.type__empty, 32)
                                                                        .endCell()
                                                                )
                                                                .storeRef(
                                                                  SSZAttestationsToCell(value.body.attestations,
                                                                      beginCell()
                                                                        .storeUint(Opcodes.type__list, 32)
                                                                        .storeUint(MAX_DEPOSITS, 64)
                                                                        .storeBit(true)
                                                                        .storeRef(
                                                                          beginCell()
                                                                              .storeUint(Opcodes.type__empty, 32)
                                                                              .endCell()
                                                                        )
                                                                        .storeRef(
                                                                          beginCell()
                                                                            .storeUint(Opcodes.type__list, 32)
                                                                            .storeUint(MAX_VOLUNTARY_EXITS, 64)
                                                                            .storeBit(true)
                                                                            .storeRef(
                                                                              beginCell()
                                                                                  .storeUint(Opcodes.type__empty, 32)
                                                                                  .endCell()
                                                                            )
                                                                            .storeRef(
                                                                              beginCell()
                                                                              .storeUint(Opcodes.type__container, 32)
                                                                              .storeRef(
                                                                                SSZBitVectorToCell(
                                                                                  value.body.sync_aggregate.sync_committee_bits,
                                                                                  SYNC_COMMITTEE_SIZE,
                                                                                  BLSSignatureToCell(value.body.sync_aggregate.sync_committee_signature)
                                                                                  )
                                                                              )
                                                                              .storeRef(SSZExecutionPayloadToCell(value.body.execution_payload))
                                                                              .endCell()

                                                                            )
                                                                          .endCell()
                                                                        )
                                                                      .endCell()
                                                                    )
                                                                )
                                                        )
                                                        .endCell()
                                                )
                                            )
                                            .endCell()
                                    )
                                )

                                .endCell()
                        )
                    )
                )
            )
        );

    if (leaf) {
        builder = builder.storeRef(leaf);
    }

    return builder.endCell();
}





function SSZAttestationsToCell(value: IBeaconMessage['body']['attestations'], tail?: Cell) {
  const listChildren = value.reverse().reduce((acc, memo, index)=> {
    if (index === 0) {
      return SSZAttestationToCell(memo);
    }
    return SSZAttestationToCell(memo, acc);
  }, undefined as any as Cell)

  let builder = beginCell()
    .storeUint(Opcodes.type__list, 32)
    .storeUint(MAX_ATTESTATIONS, 64)
    .storeBit(false)
    .storeRef(listChildren);

    if (tail) {
        builder = builder.storeRef(tail);
    }

    return builder.endCell();
}

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

function SSZAttestationToCell(value: ArrayElement<IBeaconMessage['body']['attestations']>, tail?: Cell) {

  const sigCell = BLSSignatureToCell(value.signature);
  const dataCell = SSZAttestationDataToCell(value.data, sigCell);
  const aggregationBitsCell = SSZBitListToCell(value.aggregation_bits, MAX_VALIDATORS_PER_COMMITTEE, dataCell);


  let builder = beginCell()
  .storeUint(Opcodes.type__container, 32)
  .storeRef(
    aggregationBitsCell
  );

  if(tail) {
    builder = builder.storeRef(tail);
  }

  return builder.endCell();
}

function SSZAttestationDataToCell(value: ArrayElement<IBeaconMessage['body']['attestations']>['data'], tail?: Cell) {
  const targetCell = SSZCheckpointToCell(value.target);
  const sourceCell = SSZCheckpointToCell(value.source, targetCell);
  const beaconBlockRootCell = SSZRootToCell(value.beacon_block_root, sourceCell);
  const indexCell = SSZUintToCell({value: value.index, size: 8, isInf:false}, beaconBlockRootCell);
  const slotCell = SSZUintToCell({value:value.slot, size: 8, isInf: true}, indexCell);

  let builder = beginCell()
  .storeUint(Opcodes.type__container, 32)
  .storeRef(slotCell)


  if(tail) {
    builder = builder.storeRef(tail);
  }

  return builder.endCell();
}

function SSZCheckpointToCell<T extends {
  epoch: number;
  root: string;
}>(value: T, tail?: Cell) {
  const rootCell = SSZRootToCell(value.root);
  const epochCell = SSZUintToCell({value: value.epoch, size: 8, isInf:true}, rootCell);

  let builder = beginCell()
  .storeUint(Opcodes.type__container, 32)
  .storeRef(epochCell)


  if(tail) {
    builder = builder.storeRef(tail);
  }

  return builder.endCell();

}

function SSZBitListToCell(value: string, bitLimit: number, tail?: Cell) {
  const bitString = value.startsWith('0x') ? value.replace('0x', '') : value;
    const uint8Arr = Uint8Array.from(Buffer.from(bitString, 'hex'));

    const chunks = splitIntoRootChunks(uint8Arr)
        .reverse()
        .map((chunk: any) => beginCell().storeBuffer(Buffer.from(chunk)))
        .reduce((acc, memo, index) => {
            if (index === 0) {
                return memo.endCell();
            }

            return memo.storeRef(acc).endCell();
        }, undefined as any as Cell);

  let builder = beginCell()
  .storeUint(Opcodes.type__bitlist, 32)
  .storeUint(bitLimit, 128)
  .storeUint(stringToBitArray(value).bitLen, 256)
  .storeRef(chunks)


  if(tail) {
    builder = builder.storeRef(tail);
  }

  return builder.endCell();
}



function SSZByteListToCell(value: string, size: number, maxChunks: number, tail?: Cell) {
  const signatureString = value.startsWith('0x') ? value.replace('0x', '') : value;
  const uint8Arr = Uint8Array.from(Buffer.from(signatureString, 'hex'));

  const chunks = splitIntoRootChunks(uint8Arr)
      .reverse()
      .map((chunk: any) => beginCell().storeBuffer(Buffer.from(chunk)))
      .reduce((acc, memo, index) => {
          if (index === 0) {
              return memo.endCell();
          }

          return memo.storeRef(acc).endCell();
      }, undefined as any as Cell);

  let builder = beginCell()
      .storeUint(Opcodes.type__bytelist, 32)
      .storeUint(maxChunks, 32)
      .storeUint(size, 64)
      .storeRef(chunks);

  if (tail) {
      builder = builder.storeRef(tail);
  }

  return builder.endCell();
}

function SSZExecutionPayloadToCell(value: typeof blockJson.data.message.body.execution_payload, tail?: Cell) {
  const transactionHash = Transactions.hashTreeRoot(value.transactions.map(bytes));
  const transactionsCell = SSZRootToCell('0x' + Buffer.from(transactionHash).toString('hex'));
  const blockHashCell = SSZRootToCell(value.block_hash, transactionsCell);
  // console.log('root of fee:', Buffer.from(UintBn256.hashTreeRoot(BigInt(value.base_fee_per_gas))));
  const baseFeePerGasCell = SSZRootToCell('0x' + Buffer.from(UintBn256.hashTreeRoot(BigInt(value.base_fee_per_gas))).toString('hex'), blockHashCell);
  const tmp = new ByteListType(MAX_EXTRA_DATA_BYTES);
  // const extraDataCell =  SSZByteListToCell(value.extra_data, MAX_EXTRA_DATA_BYTES, tmp.maxChunkCount);//, baseFeePerGasCell);
  const extraDataCell = SSZRootToCell('0x' + Buffer.from(tmp.hashTreeRoot(bytes(value.extra_data))).toString('hex'), baseFeePerGasCell);
  const timestampCell = SSZUintToCell({value: value.timestamp, size: 8, isInf: false}, extraDataCell);
  const gas_usedCell = SSZUintToCell({value: value.gas_used, size: 8, isInf: false}, timestampCell);
  const gas_limitCell = SSZUintToCell({value: value.gas_limit, size: 8, isInf:false}, gas_usedCell);
  const block_numberCell = SSZUintToCell({value: value.block_number, size: 8, isInf:false}, gas_limitCell);
  const prev_randao = SSZRootToCell(value.prev_randao, block_numberCell);
  const tmp2 = new ByteVectorType(BYTES_PER_LOGS_BLOOM);
  const logs_bloomCell = SSZByteVectorTypeToCell(value.logs_bloom, BYTES_PER_LOGS_BLOOM, tmp2.maxChunkCount, prev_randao);
  const receipts_root = SSZRootToCell(value.receipts_root, logs_bloomCell);
  const state_root = SSZRootToCell(value.state_root, receipts_root);
  const fee_recipient = SSZByteVectorTypeToCell(value.fee_recipient, 20, Bytes20.maxChunkCount, state_root);
  const parent_hash = SSZRootToCell(value.parent_hash, fee_recipient);



  let builder = beginCell()
  .storeUint(Opcodes.type__container, 32)
  .storeRef(parent_hash)

  if(tail) {
    builder = builder.storeRef(tail);
  }

  return builder.endCell();
}
