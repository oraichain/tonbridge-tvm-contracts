import { compile } from '@ton-community/blueprint';
import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';
import { Cell, Dictionary, beginCell, toNano } from 'ton-core';
import { sha256 } from 'ton-crypto';
import { IReceiptJSON, Receipt } from '../evm-data/receipt';
import { Adapter } from '../wrappers/Adapter';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { jsonReceipt } from './mocks';

const eth_addr = '0xC7296D50dDB12de4d2Cd8C889A73B98538624f61';

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
        const jettonWallet = blockchain.openContract(JettonWallet.createFromAddress(userWalletAddr));

        console.log('HEEEX:', user.address.hash.toString('hex'));

        const sendReceiptResult = await adapter.sendReceipt(admin.getSender(), {
            addrStr: '0x' + user.address.hash.toString('hex'),
            value: toNano('1.05'),
            receipt: cell,
            jminterAddr: jettonMinter.address,
        });

        const sendReceiptResult2 = await adapter.sendReceipt(admin.getSender(), {
            addrStr: '0x' + user.address.hash.toString('hex'),
            value: toNano('1.05'),
            receipt: cell,
            jminterAddr: jettonMinter.address,
        });

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
        console.log(userBalance.amount);

        const burnRes = await jettonWallet.sendBurn(user.getSender(), {
            value: toNano('100'),
            jettonAmount: 2000n,
            queryId: 0,
            adapter_addr: adapter.address,
            eth_addr: BigInt(eth_addr),
        });

        const msgOfMsg = sendReceiptResult2.transactions.map((tx) => tx.outMessages.values());
        const parsed = msgOfMsg.map((msgs) =>
            msgs.map((m) => {
                return { ...m, body: parseMsgPart(m.body) };
            })
        );
        console.log(parsed.flat(5));
        console.log(
            burnRes.transactions
                .filter((t) => t.description.type === 'generic' && t.description.aborted === true)
                .map((t) => t.description)
        );
        const addresses = {
            adapter: adapter.address.toString(),
            minter: jettonMinter.address.toString(),
            userJWallet: jettonWallet.address.toString(),
            user: user.address.toString(),
        };
        console.log(addresses);
    });

    // it('should burn tokens', async () => {
    //     const userWalletAddr = await jettonMinter.getWalletAddress(user.address);
    //     const jettonWallet = blockchain.openContract(JettonWallet.createFromAddress(userWalletAddr));

    //     const r = Receipt.fromJSON(jsonReceipt as unknown as IReceiptJSON);
    //     const cell = r.toCell();

    //     const sendReceiptResult = await adapter.sendReceipt(admin.getSender(), {
    //         addrStr: '0x' + user.address.hash.toString('hex'),
    //         value: toNano('1.05'),
    //         receipt: cell,
    //         jminterAddr: jettonMinter.address,
    //     });

    //     console.log(await jettonWallet.getBalance())

    //     const burnRes = await jettonWallet.sendBurn(user.getSender(), {
    //         value: toNano('100'),
    //         jettonAmount: 2000n,
    //         queryId: 0,
    //     });

    //     const msgOfMsg = burnRes.transactions.map((tx) => tx.outMessages.values());
    //     const parsed = msgOfMsg.map((msgs) =>
    //         msgs.map((m) => {
    //             return { ...m, body: parseMsgPart(m.body) };
    //         })
    //     );
    //     console.log(parsed.flat(5));
    //     console.log(
    //         burnRes.transactions.filter((t) => t.description.type === 'generic' && t.description.aborted === true)
    //         .map(t => t.description)
    //     );
    // });
});

function parseMsgPart(body: Cell) {
    const cs = body.beginParse();
    const op = cs.loadUint(32);
    const query1 = cs.loadUint(32);
    const query2 = cs.loadUint(32);
    const rest = cs;
    return { op: op.toString(16), query1: query1.toString(16), query2: query2.toString(16), cs: rest };
}
