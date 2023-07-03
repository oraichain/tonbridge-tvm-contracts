import {compile} from '@ton-community/blueprint';
import {Blockchain, SandboxContract} from '@ton-community/sandbox';
import '@ton-community/test-utils';
import {rlp} from 'ethereumjs-util';
import {Cell, toNano} from 'ton-core';
import {IReceiptJSON, Receipt} from '../evm-data/receipt';
import {bytes256, uint} from '../evm-data/utils';
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
        const parseData = getDataForHash(jsonReceipt as unknown as IReceiptJSON);
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
        console.log(increaseResult.externals[1].body);
        const receiptCell = r.toCell();
        // console.log('data to serialize:');

        console.log('parseData:', parseData.map(c => Array.isArray(c) ? c : c.toString('hex')));
        // console.log(parseData[3]);
        console.log(rlp.encode(parseData).toString('hex'));
        // console.log('hash:');
        console.log(Receipt.testSerialize(rlp.encode(parseData)).toString('hex').toUpperCase());

        expect(increaseResult.transactions).toHaveTransaction({
            from: increaser.address,
            to: readerContract.address,
            success: true,
        });
    });
});

function getDataForHash(jsonReceipt: IReceiptJSON) {
    // const start = receiptCell.beginParse();
    // const baseData = start.loadBuffer(4);
    // let logsBloomRef = start.loadRef().beginParse();
    // const logsBloom1 = logsBloomRef.loadBuffer(32 * 3);
    // logsBloomRef = logsBloomRef.loadRef().beginParse();
    // const logsBloom2 = logsBloomRef.loadBuffer(32 * 3);
    // logsBloomRef = logsBloomRef.loadRef().beginParse();

    // const logsBloom3 = logsBloomRef.loadBuffer(logsBloomRef.remainingBits / 8);

    const receiptBinary /* : TReceiptBinary */ = [
        // uint(jsonReceipt.status || jsonReceipt.root),
        // uint(jsonReceipt.cumulativeGasUsed),
        bytes256(jsonReceipt.logsBloom),
        // jsonReceipt.logs.map(l => [
        //   address(l.address),
        //   l.topics.map(bytes32),
        //   bytes(l.data)
        // ])
      ].slice(jsonReceipt.status === null && jsonReceipt.root === null ? 1 : 0); // as Receipt;

    return receiptBinary;

    return [
        uint(jsonReceipt.status || jsonReceipt.root),
        uint(jsonReceipt.cumulativeGasUsed),
        // logsBloom1,
        // logsBloom2,
        // logsBloom3
    ]
}
