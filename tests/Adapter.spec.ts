import { compile } from '@ton-community/blueprint';
import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';
import { ethers } from 'ethers';
import { beginCell, Cell, Dictionary, ExternalAddress, toNano } from 'ton-core';
import { sha256 } from 'ton-crypto';
import { IReceiptJSON, Receipt } from '../evm-data/receipt';
import { Adapter } from '../wrappers/Adapter';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { jsonReceipt } from './mocks';
import { expectFail, expectSuccess } from './utils/tests';

const eth_addr = '0xC7296D50dDB12de4d2Cd8C889A73B98538624f61';
const originalTopicId = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
const receipt = JSON.stringify(jsonReceipt);

export enum BridgeErrors {
    MSG_VALUE_TOO_SMALL = 200,
}

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

    const ethAddr = ethers.Wallet.createRandom().address;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        adapter = blockchain.openContract(Adapter.createFromConfig({}, code));

        admin = await blockchain.treasury('admin');
        user = await blockchain.treasury('user');

        const adapterDeployRes = await adapter.sendDeploy(admin.getSender(), toNano('0.05'));

        expect(adapterDeployRes.transactions).toHaveTransaction({
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

        const minterDeployRes = await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(minterDeployRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            deploy: true,
            success: true,
        });
    });

    it('should generate msg', async () => {
        const dataArr = jsonReceipt.logs.filter((l) => l.topics.includes(originalTopicId)).map((l) => l.data);

        const r = Receipt.fromJSON(JSON.parse(receipt) as unknown as IReceiptJSON);
        const cell = r.toCell();
        const userWalletAddr = await jettonMinter.getWalletAddress(user.address);
        const jettonWallet = blockchain.openContract(JettonWallet.createFromAddress(userWalletAddr));

        // console.log('HEEEX:', user.address.hash.toString('hex'));

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

        expectSuccess(sendReceiptResult.transactions, admin.address, adapter.address);
        expectSuccess(sendReceiptResult.transactions, adapter.address, jettonMinter.address);
        expectSuccess(sendReceiptResult.transactions, jettonMinter.address, jettonWallet.address);

        expectSuccess(sendReceiptResult2.transactions, admin.address, adapter.address);
        expectSuccess(sendReceiptResult2.transactions, adapter.address, jettonMinter.address);
        expectSuccess(sendReceiptResult2.transactions, jettonMinter.address, jettonWallet.address);

        expect(userBalance.amount).toBe(2n * BigInt(dataArr[0])); // we send 2 receipts
    });

    it('should burn tokens', async () => {
        const userWalletAddr = await jettonMinter.getWalletAddress(user.address);
        const adapterWalletAddr = await jettonMinter.getWalletAddress(adapter.address);
        const jettonWalletUser = blockchain.openContract(JettonWallet.createFromAddress(userWalletAddr));
        const jettonWalletAdapter = blockchain.openContract(JettonWallet.createFromAddress(adapterWalletAddr));

        const r = Receipt.fromJSON(JSON.parse(receipt) as unknown as IReceiptJSON);
        const cell = r.toCell();

        await adapter.sendReceipt(admin.getSender(), {
            addrStr: '0x' + user.address.hash.toString('hex'),
            value: toNano('1.05'),
            receipt: cell,
            jminterAddr: jettonMinter.address,
        });

        const dataArr = jsonReceipt.logs.filter((l) => l.topics.includes(originalTopicId)).map((l) => l.data);
        const walletBalance = await jettonWalletUser.getBalance();
        const initialSupply = await jettonMinter.getTotalsupply();

        expect(walletBalance.amount).toBe(BigInt(dataArr[0]));

        const burningAmount = 100000n;

        const burnRes = await jettonWalletUser.sendTransfer(user.getSender(), {
            value: toNano('1'),
            toAddress: adapter.address,
            queryId: 0,
            fwdAmount: toNano('0.05'),
            jettonAmount: burningAmount,
            ethAddress: BigInt(ethAddr),
        });

        console.log({
            user: user.address,
            jWalletUser: jettonWalletUser.address,
            jettonWalletAdapter: jettonWalletAdapter.address,
            adapter: adapter.address,
        });

        expectSuccess(burnRes.transactions, user.address, jettonWalletUser.address);
        expectSuccess(burnRes.transactions, jettonWalletUser.address, jettonWalletAdapter.address);
        expectSuccess(burnRes.transactions, jettonWalletAdapter.address, adapter.address);
        expectSuccess(burnRes.transactions, adapter.address, jettonWalletAdapter.address);
        expectSuccess(burnRes.transactions, jettonWalletAdapter.address, jettonMinter.address);
        expectSuccess(burnRes.transactions, jettonMinter.address, user.address);

        expect(
            burnRes.transactions
                .filter((t) => t.externals.length > 0)
                .map((t) =>
                    t.outMessages
                        .values()
                        .filter((m) => m.info.dest instanceof ExternalAddress)
                        .map((m) => m.info.dest?.toString())
                )
        ).toStrictEqual([['External<256:2>']]); // log::burn = 2;

        const walletBalanceBurned = await jettonWalletUser.getBalance();
        expect(walletBalanceBurned.amount).toBe(BigInt(dataArr[0]) - burningAmount);

        const expectedSupply = await jettonMinter.getTotalsupply();
        expect(expectedSupply).toBe(initialSupply - burningAmount);
    });

    it('should throw MSG_VALUE_TOO_SMALL if msg.value less that amount + 0.2 TON', async () => {
        const amount = toNano('1');
        const wrapResult = await adapter.sendWrap(admin.getSender(), toNano('0.1'), {
            amount,
            ethAddr,
        });

        expectFail(
            wrapResult.transactions,
            admin.getSender().address,
            adapter.address,
            BridgeErrors.MSG_VALUE_TOO_SMALL
        );
    });

    it('should emit log after receive wrap op', async () => {
        const amount = toNano('1');
        const wrapResult = await adapter.sendWrap(admin.getSender(), toNano('0.2') + amount, {
            amount,
            ethAddr,
        });

        expectSuccess(wrapResult.transactions, admin.getSender().address, adapter.address);
        // TODO: how to check in another way
        expect(
            wrapResult.transactions
                .filter((t) => t.externals.length > 0)
                .map((t) => t.outMessages.values().map((m) => m.info.dest?.toString()))
        ).toStrictEqual([['External<256:1>']]); // log::wrap = 1
    });
});

function parseMsgPart(body: Cell) {
    const cs = body.beginParse();
    const op = cs.loadUint(32);
    const query1 = cs.loadUint(32);
    const query2 = cs.loadUint(32);
    const rest = cs;
    return { op: op.toString(16), query1: query1.toString(16), query2: query2.toString(16), cs: rest };
}
