import {compile} from '@ton-community/blueprint';
import {Blockchain, SandboxContract} from '@ton-community/sandbox';
import '@ton-community/test-utils';
import {Cell, toNano} from 'ton-core';
import {IReceiptJSON, Receipt} from '../evm-data/receipt';
import {ReaderContract} from '../wrappers/ReaderContract';
import {jsonReceipt} from './mocks';

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

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and readerContract are ready to use
    });

    it('should increase counter', async () => {
        const increaseTimes = 3;
        const r = Receipt.fromJSON(jsonReceipt as unknown as IReceiptJSON);
        const cell = r.toCell();

        const increaser = await blockchain.treasury('increaser');
        const increaseResult = await readerContract.sendIncrease(increaser.getSender(), {
            increaseBy: 1,
            value: toNano('0.05'),
            receipt: cell,
        });

        console.log(increaseResult.externals[0].body);
        const receiptCell = r.toCell();
        // console.log('data to serialize:');
        const parseData = getDataForHash(receiptCell);
        console.log(parseData.map(c => c.toString('hex')));
        // console.log('hash:');
        console.log(Receipt.testSerialize(parseData).toString('hex').toUpperCase());

        expect(increaseResult.transactions).toHaveTransaction({
            from: increaser.address,
            to: readerContract.address,
            success: true,
        });
    });
});

function getDataForHash(receiptCell: Cell) {
    const start = receiptCell.beginParse();
    const baseData = start.loadBuffer(4);
    let logsBloomRef = start.loadRef().beginParse();
    const logsBloom1 = logsBloomRef.loadBuffer(32 * 3);
    logsBloomRef = logsBloomRef.loadRef().beginParse();
    const logsBloom2 = logsBloomRef.loadBuffer(32 * 3);
    logsBloomRef = logsBloomRef.loadRef().beginParse();

    const logsBloom3 = logsBloomRef.loadBuffer(logsBloomRef.remainingBits / 8);

    return [
        baseData,
        logsBloom1,
        logsBloom2,
        logsBloom3
    ]
}
