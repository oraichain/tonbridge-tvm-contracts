import {ByteListType, UintNumberType} from '@chainsafe/ssz';
import {splitIntoRootChunks} from '@chainsafe/ssz/lib/util/merkleize';
import {compile} from '@ton-community/blueprint';
import {Blockchain, SandboxContract} from '@ton-community/sandbox';
import '@ton-community/test-utils';
import {Cell, beginCell, toNano} from 'ton-core';
import {Opcodes, SSZContract} from '../wrappers/SSZ';

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
        const data_in = Infinity;
        console.log(data_in.toString(16));
        console.log(Buffer.from(sszBuilder.hashTreeRoot(data_in)).toString('hex') );
        // const data = true;

        const calcHashRes = await sszContract.sendSSZ(increaser.getSender(), {
            value: toNano('0.5'),
            data: beginCell()
            // .storeUint(Opcodes.type__bool, 32)
            // .storeBit(data)
            .storeUint(Opcodes.type__uint, 32)
            .storeBit(isInf)
            .storeUint(size, 16)
            .storeUint(0, size * 8)
            .endCell()
        });

        // console.log(calcHashRes.transactions.map(t => t.vmLogs));
        const externalOutBodySlice = calcHashRes.externals[0].body.asSlice();
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
});
