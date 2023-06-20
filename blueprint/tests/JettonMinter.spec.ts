import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, Dictionary, beginCell, toNano } from 'ton-core';
import { JettonMinter } from '../wrappers/JettonMinter';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { sha256 } from 'ton-crypto';
import { JettonWallet } from '../wrappers/JettonWallet';

describe('JettonMinter', () => {
    let code: Cell;
    let walletCode: Cell;

    beforeAll(async () => {
        code = await compile('JettonMinter');
        walletCode = await compile('JettonWallet');
    });

    let blockchain: Blockchain;
    let jettonMinter: SandboxContract<JettonMinter>;
    let admin: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        admin = await blockchain.treasury('admin');
        user = await blockchain.treasury('user');

        const jETHContent = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        jETHContent
            .set(
                BigInt('0x' + (await sha256('name')).toString('hex')),
                beginCell().storeUint(0x00, 8).storeBuffer(Buffer.from('wETH', 'utf8')).endCell()
            )
            .set(
                BigInt('0x' + (await sha256('decimals')).toString('hex')),
                beginCell().storeUint(0x00, 8).storeBuffer(Buffer.from('18', 'utf8')).endCell()
            );

        jettonMinter = blockchain.openContract(
            JettonMinter.createFromConfig(
                {
                    adminAddress: admin.address,
                    content: beginCell().storeInt(0x00, 8).storeDict(jETHContent).endCell(),
                    // jettonWalletCode: beginCell().endCell()  
                    jettonWalletCode:  walletCode,
                },
                code
            )
        );

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jettonMinter are ready to use
    });

    it('should mint twice', async () => {
        await jettonMinter.sendMint(admin.getSender(), {
            amount: toNano('0.05'),
            jettonAmount: 500n,
            queryId: 0,
            toAddress: admin.address,
            value: toNano('0.05'),
        });

        await jettonMinter.sendMint(admin.getSender(), {
            amount: toNano('0.05'),
            jettonAmount: 500n,
            queryId: 0,
            toAddress: admin.address,
            value: toNano('0.05'),
        });

        const jettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(admin.address))
        );

        const userBalance = await jettonWallet.getBalance();
        expect(userBalance.amount).toBe(1000n);
    });
});
