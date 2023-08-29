import {ByteListType, ByteVectorType, ContainerType, ListCompositeType, UintNumberType, } from '@chainsafe/ssz';
import {splitIntoRootChunks} from '@chainsafe/ssz/lib/util/merkleize';
import {compile} from '@ton-community/blueprint';
import {Blockchain, SandboxContract} from '@ton-community/sandbox';
import '@ton-community/test-utils';
import {Cell, beginCell, toNano} from 'ton-core';
import {bytes} from '../evm-data/utils';
import {Opcodes, SSZContract} from '../wrappers/SSZ';
import {getTestData} from './ssz/finally_update.mock';

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

// it('should return correct hash of beacon block', async () => {
//     const user = await blockchain.treasury('user');
//     const {hash, cell} = buildBlockCell();

//     const sszRes = await sszContract.sendSSZ(user.getSender(), {
//         value: toNano('1.5'),
//         data: cell
//     })

//     const ttt = new ListCompositeType(ProposerSlashing, MAX_PROPOSER_SLASHINGS);
//     console.log('void list hash: ', Buffer.from(ttt.hashTreeRoot([])).toString('hex'));

//     console.log(sszRes.transactions.map(t => t.vmLogs));
//     const externalOutBodySlice = sszRes.externals.map(ex => ex.body.asSlice());
//     console.log(externalOutBodySlice);
//     const hashToString = Buffer.from(hash).toString('hex');
//     const contractResToString = externalOutBodySlice[externalOutBodySlice.length - 1].loadBuffer(32).toString('hex');

//     console.log(hashToString, contractResToString)

//     expect(sszRes.transactions).toHaveTransaction({
//         from: user.address,
//         to: sszContract.address,
//         success: true,
//     });

//     expect(contractResToString).toEqual(hashToString);
// })

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

});
