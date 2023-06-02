import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, Dictionary, beginCell, toNano } from 'ton-core';
import { Adapter } from '../wrappers/Adapter';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { IReceiptJSON, Receipt } from '../evm-data/receipt';
import { jsonReceipt } from './mocks';
import { JettonMinter } from '../wrappers/JettonMinter';
import { sha256 } from 'ton-crypto';
import { JettonWallet } from '../wrappers/JettonWallet';

describe('Adapter', () => {
    let code: Cell;
    let minterCode: Cell;
    let walletCode: Cell;

    beforeAll(async () => {
        code = await compile('Adapter');
        minterCode = await compile('JettonMinter');
        walletCode = await compile('JettonWallet');
    });

    let blockchain: Blockchain;
    let adapter: SandboxContract<Adapter>;
    let admin: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let jettonMinter: SandboxContract<JettonMinter>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        adapter = blockchain.openContract(Adapter.createFromConfig({}, code));

        admin = await blockchain.treasury('admin');
        user = await blockchain.treasury('user');

        const deployResult = await adapter.sendDeploy(admin.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: admin.address,
            to: adapter.address,
            deploy: true,
            success: true,
        });

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
                    adminAddress: adapter.address,
                    content: beginCell().storeInt(0x00, 8).storeDict(jETHContent).endCell(),
                    jettonWalletCode: walletCode,
                },
                minterCode
            )
        );

        const deployer = await blockchain.treasury('deployer');

        const deployResult2 = await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult2.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            deploy: true,
            success: true,
        });

        
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and adapter are ready to use
    });

    it('should generate msg', async () => {
        const r = Receipt.fromJSON(jsonReceipt as unknown as IReceiptJSON);
        const cell = r.toCell();
        const userWalletAddr = await jettonMinter.getWalletAddress(user.address);
        const jettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(userWalletAddr)
        );

        console.log(await jettonWallet.getBalance())

        const sendReceiptResult = await adapter.sendReceipt(admin.getSender(), {
            addrStr: '0x' + user.address.hash.toString('hex'),
            value: toNano('1.05'),
            receipt: cell,
            jminterAddr: jettonMinter.address,
        });

        console.log(await jettonWallet.getBalance())

        const sendReceiptResult2 = await adapter.sendReceipt(admin.getSender(), {
            addrStr: '0x' + user.address.hash.toString('hex'),
            value: toNano('1.05'),
            receipt: cell,
            jminterAddr: jettonMinter.address,
        });

        console.log(await jettonWallet.getBalance())

        const userBalance = await jettonWallet.getBalance();

        expect(sendReceiptResult.transactions).toHaveTransaction({
            from: admin.address,
            to: adapter.address,
            success: true,
        });

        expect(sendReceiptResult.transactions).toHaveTransaction({
            from: adapter.address,
            to: jettonMinter.address,
            success: true,
        });

        expect(sendReceiptResult.transactions).toHaveTransaction({
            from: jettonMinter.address,
            to: jettonWallet.address,
            success: true,
        });
        console.log(...sendReceiptResult2.transactions.filter(t => t.description.type === 'generic' && t.description.aborted)
        .map(t => t.description))

        expect(sendReceiptResult2.transactions).toHaveTransaction({
            from: admin.address,
            to: adapter.address,
            success: true,
        });

        expect(sendReceiptResult2.transactions).toHaveTransaction({
            from: adapter.address,
            to: jettonMinter.address,
            success: true,
        });

        expect(sendReceiptResult2.transactions).toHaveTransaction({
            from: jettonMinter.address,
            to: jettonWallet.address,
            success: true,
        });

        expect(userBalance.amount).toBeGreaterThan(1n);

    });
});
