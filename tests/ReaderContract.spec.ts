import { compile } from '@ton-community/blueprint';
import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';
import { Cell, toNano } from 'ton-core';
import { IReceiptJSON, Receipt } from '../evm-data/receipt';
import { ReaderContract } from '../wrappers/ReaderContract';
import { jsonReceipt } from './mocks';

describe('ReaderContract', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('ReaderContract');
    });

    let blockchain: Blockchain;
    let readerContract: SandboxContract<ReaderContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        readerContract = blockchain.openContract(
            ReaderContract.createFromConfig(
                {
                    id: 0,
                    counter: 0,
                },
                code
            )
        );

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await readerContract.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: readerContract.address,
            deploy: true,
            success: true,
        });
    });

    it('should emit correct hash', async () => {
        const r = Receipt.fromJSON(jsonReceipt as unknown as IReceiptJSON);
        const cell = r.toCell();

        const expectedHash = BigInt('0x' + r.hash().toString('hex'));

        const increaser = await blockchain.treasury('increaser');
        const calcHashRes = await readerContract.sendCalcHash(increaser.getSender(), {
            value: toNano('0.5'),
            receipt: cell,
        });

        expect(calcHashRes.transactions).toHaveTransaction({
            from: increaser.address,
            to: readerContract.address,
            success: true,
        });

        expect(calcHashRes.externals.length).toEqual(1);

        const externalOutBodySlice = calcHashRes.externals[0].body.asSlice();
        const actualHash = externalOutBodySlice.loadUintBig(256);
        expect(expectedHash).toBe(actualHash);
    });
});
