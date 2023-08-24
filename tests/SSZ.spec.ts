import {compile} from '@ton-community/blueprint';
import {Blockchain, SandboxContract} from '@ton-community/sandbox';
import '@ton-community/test-utils';
import {Cell, toNano} from 'ton-core';
import {SSZContract} from '../wrappers/SSZ';

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

        const calcHashRes = await sszContract.sendSSZ(increaser.getSender(), {
            value: toNano('0.5'),
        });

        // console.log(calcHashRes.transactions.map(t => t.vmLogs));

        await expect(calcHashRes.transactions).toHaveTransaction({
            from: increaser.address,
            to: sszContract.address,
            success: true,
        });
    });
});
