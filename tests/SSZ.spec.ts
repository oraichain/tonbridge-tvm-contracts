import {ByteListType, ByteVectorType, ContainerType, ListCompositeType, UintNumberType, VectorCompositeType, hash64, } from '@chainsafe/ssz';
import {splitIntoRootChunks} from '@chainsafe/ssz/lib/util/merkleize';
import {compile} from '@ton-community/blueprint';
import {Blockchain, SandboxContract} from '@ton-community/sandbox';
import '@ton-community/test-utils';
import {Cell, Dictionary, beginCell, toNano} from 'ton-core';
import {bytes} from '../evm-data/utils';
import {Opcodes, SSZContract} from '../wrappers/SSZ';
import {buildBlockCell} from './ssz';
import {BLSPubkey, EXECUTION_PAYLOAD_DEPTH, ExecutionPayloadHeader, SYNC_COMMITTEE_SIZE, SyncCommittee, executionBranch} from './ssz/finally_update';
import updateJson from './ssz/finally_update.json';
import {getTestData} from './ssz/finally_update.mock';
import {MAX_PROPOSER_SLASHINGS, ProposerSlashing} from './ssz/ssz-beacon-type';
import {SSZRootToCell} from './ssz/ssz-to-cell';

const Bytes96 = new ByteVectorType(96);
const BLSSignature = Bytes96;
const MAX_BYTES_PER_TRANSACTION = 1073741824;
const MAX_TRANSACTIONS_PER_PAYLOAD = 1048576;
const tx = new ListCompositeType(new ByteListType(MAX_BYTES_PER_TRANSACTION), MAX_TRANSACTIONS_PER_PAYLOAD);

const blsSignature = '0x912c3615f69575407db9392eb21fee18fff797eeb2fbe1816366ca2a08ae574d8824dbfafb4c9eaa1cf61b63c6f9b69911f269b664c42947dd1b53ef1081926c1e82bb2a465f927124b08391a5249036146d6f3f1e17ff5f162f779746d830d1';


describe('SSZContract', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('SSZ');
    });

    let blockchain: Blockchain;
    let sszContract: SandboxContract<SSZContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        sszContract = blockchain.openContract(SSZContract.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await sszContract.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: sszContract.address,
            deploy: true,
            success: true,
        });
    });

    it('should emit correct hash', async () => {
        const increaser = await blockchain.treasury('increaser');

        // const sszBuilder = new BooleanType();
        // console.log(Buffer.from(sszBuilder.hashTreeRoot(true)).toString('hex') );
        const size = 8;
        const isInf = true;
        const sszBuilder = new UintNumberType(size, {clipInfinity: true});
        const data_in = 16;
        console.log(data_in.toString(16));
        console.log('int test', Buffer.from(sszBuilder.hashTreeRoot(data_in)).toString('hex') );
        // const data = true;

        const calcHashRes = await sszContract.sendSSZ(increaser.getSender(), {
            value: toNano('0.5'),
            data: beginCell()
            // .storeUint(Opcodes.type__bool, 32)
            // .storeBit(data)
            .storeUint(Opcodes.type__uint, 32)
            .storeBit(isInf)
            .storeUint(size, 16)
            .storeUint(data_in, size * 8)
            .endCell()
        });

        // console.log(calcHashRes.transactions.map(t => t.vmLogs));
        const externalOutBodySlice = calcHashRes.externals.map(ex => ex.body.asSlice());
    console.log(externalOutBodySlice);

        expect(calcHashRes.transactions).toHaveTransaction({
            from: increaser.address,
            to: sszContract.address,
            success: true,
        });
    });

    it('should emit bytelist', async () => {
      const increaser = await blockchain.treasury('increaser');

      const MAX_BYTES_PER_TRANSACTION = 1073741824;
      const sszBuilder = new ByteListType(MAX_BYTES_PER_TRANSACTION);

      const data = "12341818181818181818181f2f18181818181f2f18181818181f2f18181818181f2f18181818181f2f18181818181818181818181f2f18181818181f2f18181818181f2f18181818181f2f18181818181f2f";

      let chunks = splitIntoRootChunks(
        Uint8Array.from(Buffer.from(data, 'hex'))
      ).reverse()
      .map((chunk: any) => beginCell().storeBuffer(Buffer.from(chunk)))
      .reduce((acc, memo, index) => {
        if (index === 0) {
          return memo.endCell()
        }

        return memo.storeRef(acc).endCell();
      }, undefined as any as Cell);

      // console.log('len', Buffer.from(data, 'hex'))
      const maxChunkCount = sszBuilder.maxChunkCount;
      // console.log(maxChunkCount);
      console.log('hashTreeRoot:', Buffer.from(sszBuilder.hashTreeRoot(Uint8Array.from(Buffer.from(data, 'hex')))).toString('hex') );

      const calcHashRes = await sszContract.sendSSZ(increaser.getSender(), {
          value: toNano('1.5'),
          data: beginCell()
          .storeUint(Opcodes.type__bytelist, 32)
          .storeUint(maxChunkCount, 32)
          .storeUint(Uint8Array.from(Buffer.from(data, 'hex')).length, 64)
          .storeRef(chunks)
          .endCell()
      });

      console.log(calcHashRes.transactions.map(t => t.vmLogs));
      const externalOutBodySlice = calcHashRes.externals.map(ex => ex.body.asSlice());
      console.log(externalOutBodySlice);

      expect(calcHashRes.transactions).toHaveTransaction({
          from: increaser.address,
          to: sszContract.address,
          success: true,
      });
  });

  it('should emit correct hash (byte vector)', async () => {
    const increaser = await blockchain.treasury('increaser');

    const sszBuilder = BLSSignature;

    console.log('sign', BLSSignature.maxChunkCount, BLSSignature.maxSize);
    console.log(sszBuilder.maxChunkCount);
    console.log(Buffer.from(sszBuilder.hashTreeRoot(bytes(blsSignature))).toString('hex') );

    let chunks = splitIntoRootChunks(
        Uint8Array.from(Buffer.from(blsSignature.replace('0x', ''), 'hex'))
      ).reverse()
      .map((chunk: any) => beginCell().storeBuffer(Buffer.from(chunk)))
      .reduce((acc, memo, index) => {
        if (index === 0) {
          return memo.endCell()
        }

        return memo.storeRef(acc).endCell();
      }, undefined as any as Cell);

    const calcHashRes = await sszContract.sendSSZ(increaser.getSender(), {
        value: toNano('1.5'),
        data: beginCell()
        .storeUint(Opcodes.type__byteVector, 32)
        .storeUint(BLSSignature.maxChunkCount, 32)
        .storeUint(96, 64)
        .storeRef(chunks)
        .endCell()
    });

    // console.log(calcHashRes.transactions.map(t => t.vmLogs));
    const externalOutBodySlice = calcHashRes.externals.map(ex => ex.body.asSlice());
    console.log(externalOutBodySlice);

    expect(calcHashRes.transactions).toHaveTransaction({
        from: increaser.address,
        to: sszContract.address,
        success: true,
    });
})

  it('should emit correct hash (container type)', async () => {
    const increaser = await blockchain.treasury('increaser');

    const sszBuilder = new ContainerType({
        message: new ContainerType({
            slot: new UintNumberType(8, {clipInfinity: true})
        }),
        signature: BLSSignature,
    });

    console.log(Buffer.from(sszBuilder.hashTreeRoot({
        message: {
            slot: 16
        },
        signature: bytes(blsSignature)
    })).toString('hex') );

    let chunks = splitIntoRootChunks(
        Uint8Array.from(Buffer.from(blsSignature.replace('0x', ''), 'hex'))
      ).reverse()
      .map((chunk: any) => beginCell().storeBuffer(Buffer.from(chunk)))
      .reduce((acc, memo, index) => {
        if (index === 0) {
          return memo.endCell()
        }

        return memo.storeRef(acc).endCell();
      }, undefined as any as Cell);

    const calcHashRes = await sszContract.sendSSZ(increaser.getSender(), {
        value: toNano('1.5'),
        data: beginCell()
        .storeUint(Opcodes.type__container, 32)
        .storeRef(
            beginCell()
            .storeUint(Opcodes.type__container, 32)
            .storeRef(
                beginCell()
                    .storeUint(Opcodes.type__uint, 32)
                    .storeBit(true)
                    .storeUint(8, 16)
                    .storeUint(16, 8 * 8)
                .endCell()
            )
            .storeRef(
                beginCell()
                .storeUint(Opcodes.type__byteVector, 32)
                .storeUint(BLSSignature.maxChunkCount, 32)
                .storeUint(96, 64)
                .storeRef(chunks)
                .endCell()
            )
            .endCell()
        )
        .endCell()
    });

    console.log(calcHashRes.transactions.map(t => t.vmLogs));
    const externalOutBodySlice = calcHashRes.externals.map(ex => ex.body.asSlice());
    console.log(externalOutBodySlice);

    expect(calcHashRes.transactions).toHaveTransaction({
        from: increaser.address,
        to: sszContract.address,
        success: true,
    });
});

it('should return correct hash of beacon block', async () => {
    const user = await blockchain.treasury('user');
    const {hash, cell} = buildBlockCell();

    const sszRes = await sszContract.sendSSZ(user.getSender(), {
        value: toNano('1.5'),
        data: cell
    })

    const ttt = new ListCompositeType(ProposerSlashing, MAX_PROPOSER_SLASHINGS);
    console.log('void list hash: ', Buffer.from(ttt.hashTreeRoot([])).toString('hex'));

    console.log(sszRes.transactions.map(t => t.vmLogs));
    const externalOutBodySlice = sszRes.externals.map(ex => ex.body.asSlice());
    console.log(externalOutBodySlice);
    const hashToString = Buffer.from(hash).toString('hex');
    const contractResToString = externalOutBodySlice[externalOutBodySlice.length - 1]?.loadBuffer(32).toString('hex');

    console.log(hashToString, contractResToString)

    expect(sszRes.transactions).toHaveTransaction({
        from: user.address,
        to: sszContract.address,
        success: true,
    });

    expect(contractResToString).toEqual(hashToString);
})

it('should return correct hash of finally update', async () => {
    const user = await blockchain.treasury('user');
    const {expectedHash: hash, cell} = getTestData();

    const sszRes = await sszContract.sendSSZ(user.getSender(), {
        value: toNano('1.5'),
        data: cell
    })

    console.log(sszRes.transactions.map(t => t.vmLogs));
    const externalOutBodySlice = sszRes.externals.map(ex => ex.body.asSlice());
    console.log(externalOutBodySlice);
    const hashToString = Buffer.from(hash).toString('hex');
    const contractResToString = externalOutBodySlice[externalOutBodySlice.length - 1].loadBuffer(32).toString('hex');

    console.log(hashToString, contractResToString)

    expect(sszRes.transactions).toHaveTransaction({
        from: user.address,
        to: sszContract.address,
        success: true,
    });

    expect(contractResToString).toEqual(hashToString);
})

it ('ssz for bytevector', async () => {
    const user = await blockchain.treasury('user');
    const data = updateJson[0].data;
    const arr = data.finalized_header.execution_branch;
    const expectedHash = executionBranch.hashTreeRoot(arr.map(bytes));



    let bytesList!:Cell;

    for (let i = 0; i < arr.length; i++) {
        const elem = arr[i];
        bytesList = SSZRootToCell(elem, bytesList);
    }


    const cell: Cell = beginCell()
    .storeUint(Opcodes.type__vector, 32)
    .storeUint(EXECUTION_PAYLOAD_DEPTH, 64)
    .storeBit(false)
    .storeRef(
        bytesList
    )
    .endCell();

    const sszRes = await sszContract.sendSSZ(user.getSender(), {
        value: toNano('2.5'),
        data: cell
    })

    console.log(sszRes.transactions.map(t => t.vmLogs));
    const externalOutBodySlice = sszRes.externals.map(ex => ex.body.asSlice());
    console.log(externalOutBodySlice);
    const hashToString = Buffer.from(expectedHash).toString('hex');
    const contractResToString = externalOutBodySlice[externalOutBodySlice.length - 1]?.loadBuffer(32).toString('hex');

    console.log(hashToString, contractResToString);
    console.log(executionBranch.maxChunkCount);

    expect(sszRes.transactions).toHaveTransaction({
        from: user.address,
        to: sszContract.address,
        success: true,
    });

    expect(contractResToString).toEqual(hashToString);
})

it('check receipt root merkle proof', async () => {
    const data = updateJson[0].data;
    const expectedRoot = bytes(data.finalized_header.beacon.body_root);

    const res = is_valid_merkle_branch(
        Buffer.from(ExecutionPayloadHeader.hashTreeRoot({
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
        })),
        data.finalized_header.execution_branch.map(bytes),
        data.finalized_header.execution_branch.length,
        9,
        expectedRoot
    );


    // 55 for commitee
    const res2 = is_valid_merkle_branch(
        Buffer.from(SyncCommittee.hashTreeRoot({
            pubkeys: data.next_sync_committee.pubkeys.map(bytes),
            aggregatePubkey: bytes(data.next_sync_committee.aggregate_pubkey)
        })),
        data.next_sync_committee_branch.map(bytes),
        5,
        23,
        bytes(data.attested_header.beacon.state_root),
    )

    // const res = await verifyMerkleProof(
    //     expectedRoot, // expected merkle root
    //     rlp.encode(toNumber(path)), // path, which is the transsactionIndex
    //     proof.map(bytes), // array of Buffer with the merkle-proof-data
    //     expectedValue,
    //     'The TransactionReceipt can not be verified'
    // );



    let committee_branch_cell!: Cell;
    for (let i = 0; i < data.next_sync_committee_branch.length; i++) {
        const branch_item = data.next_sync_committee_branch[i];
        if (!committee_branch_cell) {
            committee_branch_cell = beginCell()
            .storeBuffer(bytes(branch_item))
            .endCell();
        } else {
            committee_branch_cell = beginCell()
            .storeBuffer(bytes(branch_item))
            .storeRef(committee_branch_cell)
            .endCell();
        }
    }

    const CommitteeContent = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Buffer(48));
    data.next_sync_committee.pubkeys.forEach((item, i) => {
        CommitteeContent.set(
            i,
            bytes(item)
        )
    })
        // CommitteeContent
        //     .set(
        //         BigInt('0x' + (await sha256('name')).toString('hex')),
        //         beginCell().storeUint(0x00, 8).storeBuffer(Buffer.from('wETH', 'utf8')).endCell()
        //     )
        //     .set(
        //         BigInt('0x' + (await sha256('decimals')).toString('hex')),
        //         beginCell().storeUint(0x00, 8).storeBuffer(Buffer.from('18', 'utf8')).endCell()
        //     );

    const committee_pubs_hash = Buffer.from(SyncCommittee.hashTreeRoot({
        pubkeys: data.next_sync_committee.pubkeys.map(bytes),
        aggregatePubkey: bytes(data.next_sync_committee.aggregate_pubkey)
    }));

    const committee_pubs_cell = beginCell()
    .storeBuffer(committee_pubs_hash)
    .endCell();


    const user = await blockchain.treasury('user');
    const {expectedHash: hash, cell} = getTestData();

    const sszRes = await sszContract.sendVerifyReceipt(user.getSender(), {
        value: toNano('5.5'),
        data: cell,
        committee_branch: committee_branch_cell,
        committee_pubs_cell,
        next_committee_data: beginCell()
        .storeBuffer(bytes(data.next_sync_committee.aggregate_pubkey))
        .storeRef(beginCell().storeDict(CommitteeContent).endCell())
        .endCell()
    })

    console.log('ok', res, res2);
    console.log(sszRes.transactions.map(t => t.vmLogs));
    const externalOutBodySlice = sszRes.externals.map(ex => ex.body.asSlice());
    console.log(externalOutBodySlice);

    console.log(splitIntoRootChunks(bytes(data.next_sync_committee.aggregate_pubkey)));
    console.log(Buffer.from(BLSPubkey.hashTreeRoot(bytes(data.next_sync_committee.aggregate_pubkey))).toString('hex'));
    console.log(BLSPubkey.maxChunkCount, (new VectorCompositeType(BLSPubkey, SYNC_COMMITTEE_SIZE)).maxChunkCount);
    // const hashToString = Buffer.from(hash).toString('hex');
    // const contractResToString = externalOutBodySlice[externalOutBodySlice.length - 1]?.loadBuffer(32).toString('hex');

    // console.log(hashToString, contractResToString)

    // expect(sszRes.transactions).toHaveTransaction({
    //     from: user.address,
    //     to: sszContract.address,
    //     success: true,
    // });

    // expect(contractResToString).toEqual(hashToString);

});
});

function is_valid_merkle_branch(leaf: Buffer, branch: Buffer[], depth: number, index: number, root: Buffer) {
    let value = leaf;
    console.log('begin proof');
    console.log(value.toString('hex'), root.toString('hex'))
    for (let i = 0; i < depth; i++) {
        console.log(value.toString('hex'), branch[i]?.toString('hex'), i)
        if (Math.floor(index / (2 ** i) % 2)) {
            value = Buffer.from(hash64(branch[i], value));
        } else {
            value = Buffer.from(hash64(value, branch[i]));
        }
        console.log(value.toString('hex'))
    }
    return value.equals(root);
}
