import {BooleanType, ByteListType, ByteVectorType, ContainerType, UintBigintType, UintNumberType, VectorCompositeType} from "@chainsafe/ssz";
import {BeaconBlockHeader, SyncAggregate, Uint256} from './ssz-beacon-type';

export const MAX_WITHDRAWALS_PER_PAYLOAD = 16;
export const BYTES_PER_LOGS_BLOOM = 256;
export const MAX_EXTRA_DATA_BYTES = 32;
export const MAX_BLS_TO_EXECUTION_CHANGES = 16;
export const FINALIZED_ROOT_DEPTH = 6;
export const BLOCK_BODY_EXECUTION_PAYLOAD_DEPTH = 4;

export const EXECUTION_PAYLOAD_DEPTH = BLOCK_BODY_EXECUTION_PAYLOAD_DEPTH;

export const Boolean = new BooleanType();
export const Byte = new UintNumberType(1);
export const Bytes4 = new ByteVectorType(4);
export const Bytes8 = new ByteVectorType(8);
export const Bytes20 = new ByteVectorType(20);
export const Bytes32 = new ByteVectorType(32);
export const Bytes48 = new ByteVectorType(48);
export const Bytes96 = new ByteVectorType(96);
export const Uint8 = new UintNumberType(1);
export const Uint16 = new UintNumberType(2);
export const Uint32 = new UintNumberType(4);
export const UintNum64 = new UintNumberType(8);
export const UintNumInf64 = new UintNumberType(8, {clipInfinity: true});
export const UintBn64 = new UintBigintType(8);
export const UintBn128 = new UintBigintType(16);
export const UintBn256 = new UintBigintType(32);

// Custom types, defined for type hinting and readability

/**
 * Use JS Number for performance, values must be limited to 2**52-1.
 * Slot is a time unit, so in all usages it's bounded by the clock, ensuring < 2**53-1
 */
export const Slot = UintNum64;
/**
 * Use JS Number for performance, values must be limited to 2**52-1.
 * Epoch is a time unit, so in all usages it's bounded by the clock, ensuring < 2**53-1
 */
export const Epoch = UintNum64;
/** Same as @see Epoch + some validator properties must represent 2**52-1 also, which we map to `Infinity` */
export const EpochInf = UintNumInf64;
/**
 * Use JS Number for performance, values must be limited to 2**52-1.
 * SyncPeriod is a time unit, so in all usages it's bounded by the clock, ensuring < 2**53-1
 */
export const SyncPeriod = UintNum64;
/**
 * Use JS Number for performance, values must be limited to 2**52-1.
 * CommitteeIndex is bounded by the max possible number of committees which is bounded by `VALIDATOR_REGISTRY_LIMIT`
 */
export const CommitteeIndex = UintNum64;
/** @see CommitteeIndex */
export const SubcommitteeIndex = UintNum64;
/**
 * Use JS Number for performance, values must be limited to 2**52-1.
 * ValidatorIndex is bounded by `VALIDATOR_REGISTRY_LIMIT`
 */
export const ValidatorIndex = UintNum64;
export const WithdrawalIndex = UintNum64;
export const Gwei = UintBn64;
export const Wei = UintBn256;
export const Root = new ByteVectorType(32);
export const BlobIndex = UintNum64;

export const Version = Bytes4;
export const DomainType = Bytes4;
export const ForkDigest = Bytes4;
export const BLSPubkey = Bytes48;
export const BLSSignature = Bytes96;
export const Domain = Bytes32;
export const ParticipationFlags = new UintNumberType(1, {setBitwiseOR: true});
export const ExecutionAddress = Bytes20;

export const finalityBranch = new VectorCompositeType(Bytes32, FINALIZED_ROOT_DEPTH);
export const executionBranch = new VectorCompositeType(Bytes32, EXECUTION_PAYLOAD_DEPTH);

export const SYNC_COMMITTEE_SIZE = 512;

export const SyncCommittee = new ContainerType(
  {
    pubkeys: new VectorCompositeType(BLSPubkey, SYNC_COMMITTEE_SIZE),
    aggregatePubkey: BLSPubkey,
  },
  {typeName: "SyncCommittee", jsonCase: "eth2"}
);

export const ExecutionPayloadHeader = new ContainerType(
  {
    parentHash: Root,
    feeRecipient: ExecutionAddress,
    stateRoot: Bytes32,
    receiptsRoot: Bytes32,
    logsBloom: new ByteVectorType(BYTES_PER_LOGS_BLOOM),
    prevRandao: Bytes32,
    blockNumber: UintNum64,
    gasLimit: UintNum64,
    gasUsed: UintNum64,
    timestamp: UintNum64,
    // TODO: if there is perf issue, consider making ByteListType
    extraData: new ByteListType(MAX_EXTRA_DATA_BYTES),
    baseFeePerGas: Uint256,
    blockHash: Root,
    transactionsRoot: Root,
    withdrawalsRoot: Root, // New in capella
  },
  {typeName: "ExecutionPayloadHeader", jsonCase: "eth2"}
);

export const LightClientHeader = new ContainerType(
  {
    beacon: BeaconBlockHeader,
    execution: ExecutionPayloadHeader,
    executionBranch,
  },
  {typeName: "LightClientHeader", jsonCase: "eth2"}
);

export const LightClientFinalityUpdate = new ContainerType(
  {
    attestedHeader: LightClientHeader,
    finalizedHeader: LightClientHeader,
    finalityBranch: finalityBranch,
    syncAggregate: SyncAggregate,
    signatureSlot: Slot,
  },
  {typeName: "LightClientFinalityUpdate", jsonCase: "eth2"}
);
