import {BitArray, BitListType, ByteVectorType, ContainerType, ListCompositeType, UintNumberType} from '@chainsafe/ssz';
import {bytes} from '../../evm-data/utils';

export const MAX_PROPOSER_SLASHINGS = 16;
export const MAX_ATTESTER_SLASHINGS = 2;
export const MAX_ATTESTATIONS = 128;
export const MAX_VALIDATORS_PER_COMMITTEE = 2048;

export const Bytes96 = new ByteVectorType(96);
export const UintNumInf64 = new UintNumberType(8, {clipInfinity: true});
export const UintNum64 = new UintNumberType(8);
export const Bytes32 = new ByteVectorType(32);

export const BLSSignature = Bytes96;
export const Slot = UintNumInf64;
export const ValidatorIndex = UintNum64;
export const Root = new ByteVectorType(32);
export const CommitteeIndex = UintNum64;
export const Epoch = UintNumInf64;

export const CommitteeBits = new BitListType(MAX_VALIDATORS_PER_COMMITTEE);

// export const ExecutionPayload = new ContainerType(
//   {
//     // ...executionPayloadFields,
//     // transactions: Transactions,
//   }
// );

export function stringToBitArray(value: string) {
  return new BitArray(Uint8Array.from(bytes(value)), Uint8Array.from(bytes(value)).length * 8)
}

export const Checkpoint = new ContainerType(
  {
    epoch: Epoch,
    root: Root,
  },
  {typeName: "Checkpoint", jsonCase: "eth2"}
);

export const AttestationData = new ContainerType(
  {
    slot: Slot,
    index: CommitteeIndex,
    beacon_block_root: Root,
    source: Checkpoint,
    target: Checkpoint,
  },
  {typeName: "AttestationData", jsonCase: "eth2"}
);

export const Attestation = new ContainerType(
  {
    aggregation_bits: CommitteeBits,
    data: AttestationData,
    signature: BLSSignature,
  },
  {typeName: "Attestation", jsonCase: "eth2"}
);

export const IndexedAttestation = new ContainerType(
  {
    // attestingIndices: CommitteeIndices,
    // data: AttestationData,
    signature: BLSSignature,
  },
  {typeName: "IndexedAttestation", jsonCase: "eth2"}
);

export const AttesterSlashing = new ContainerType(
  {
    attestation1: IndexedAttestation,
    attestation2: IndexedAttestation,
  },
  {typeName: "AttesterSlashing", jsonCase: "eth2"}
);

export const BeaconBlockHeader = new ContainerType(
  {
    slot: Slot,
    proposerIndex: ValidatorIndex,
    parentRoot: Root,
    stateRoot: Root,
    bodyRoot: Root,
  },
  {typeName: "BeaconBlockHeader", jsonCase: "eth2"}
);

export const SignedBeaconBlockHeader = new ContainerType(
  {
    message: BeaconBlockHeader,
    signature: BLSSignature,
  },
  {typeName: "SignedBeaconBlockHeader", jsonCase: "eth2"}
);

export const ProposerSlashing = new ContainerType(
  {
    signedHeader1: SignedBeaconBlockHeader,
    signedHeader2: SignedBeaconBlockHeader,
  },
  {typeName: "ProposerSlashing", jsonCase: "eth2"}
);

export const Eth1Data = new ContainerType(
  {
    deposit_root: Root,
    deposit_count: UintNum64,
    block_hash: Bytes32,
  },
  {typeName: "Eth1Data", jsonCase: "eth2"}
);

export const BeaconBlockBody = new ContainerType(
  {
    randao_reveal: BLSSignature,
    eth1_data: Eth1Data,
    graffiti: Bytes32,
    proposer_slashings: new ListCompositeType(ProposerSlashing, MAX_PROPOSER_SLASHINGS),
    attester_slashings: new ListCompositeType(AttesterSlashing, MAX_ATTESTER_SLASHINGS),
    attestations: new ListCompositeType(Attestation, MAX_ATTESTATIONS),
    // deposits: new ListCompositeType(Deposit, MAX_DEPOSITS),
    // voluntaryExits: new ListCompositeType(SignedVoluntaryExit, MAX_VOLUNTARY_EXITS),
    // ...altairSsz.BeaconBlockBody.fields,
    // executionPayload: ExecutionPayload,
  },
);

export const BeaconBlock = new ContainerType(
  {
    slot: Slot,
    proposer_index: ValidatorIndex,
    // Reclare expandedType() with altair block and altair state
    parent_root: Root,
    state_root: Root,
    body: BeaconBlockBody,
  },
  {typeName: "BeaconBlock", jsonCase: "eth2"}
);

export const SignedBeaconBlock = new ContainerType(
  {
    message: BeaconBlock,
    signature: BLSSignature,
  },
  {typeName: "SignedBeaconBlock", jsonCase: "eth2"}
);
