import {compile} from '@ton-community/blueprint';
import {Blockchain, SandboxContract, TreasuryContract} from '@ton-community/sandbox';
import '@ton-community/test-utils';
import {ethers} from 'ethers';
import {Cell, Dictionary, ExternalAddress, address, beginCell, loadTransaction, toNano} from 'ton-core';
import {sha256} from 'ton-crypto';
import {IReceiptJSON, Receipt} from '../evm-data/receipt';
import {Adapter} from '../wrappers/Adapter';
import {JettonMinter} from '../wrappers/JettonMinter';
import {JettonWallet} from '../wrappers/JettonWallet';
import {burnReceipt, dataForEvm, j2, jsonReceipt, mintForEvm} from './mock/receiptWithEvents';
import {expectFail, expectSuccess} from './utils/tests';

const originalTopicId = '0x6888ec7969c035bf2b2a4f1c3d41fd8e393fee76a9fa186e4c9405c1a01f9b72';
const receipt = JSON.stringify(jsonReceipt);
const receipt2 = JSON.stringify(j2);
const burnRec = JSON.stringify(burnReceipt);

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

        admin = await blockchain.treasury('admin');
        user = await blockchain.treasury('user');

        adapter = blockchain.openContract(Adapter.createFromConfig({
            // jminter_addr: jettonMinter.address,
            topic_burn_id: '0x09a9af46918f2e52460329a694cdd4cd6d55354ea9b336b88b4dea59914a9a83',
            topic_mint_id: originalTopicId,
            light_client_addr: admin.address,
        }, code));

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

        const adapterDeployRes = await adapter.sendDeploy(admin.getSender(), toNano('0.05'));

        await adapter.sendJminterAddr(admin.getSender(), {
            value: toNano('0.05'),
            jminterAddr: jettonMinter.address,
        })

        expect(adapterDeployRes.transactions).toHaveTransaction({
            from: admin.address,
            to: adapter.address,
            deploy: true,
            success: true,
        });

        expect(minterDeployRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            deploy: true,
            success: true,
        });
    });

    it('should generate msg', async () => {
         const cells = Cell.fromBoc(Buffer.from(dataForEvm.txBoc, 'hex'));
         const tx =  loadTransaction(cells[0].beginParse(true));
        //  console.log(tx.outMessages.values());

         const cells2 = Cell.fromBoc(Buffer.from(mintForEvm.txBoc, 'hex'));
         const tx2 =  loadTransaction(cells2[0].beginParse(true));
        //  console.log(tx2.outMessages.values());

        //  0xC7296D50dDB12de4d2Cd8C889A73B98538624f61

        const r2 = Receipt.fromJSON(JSON.parse(burnRec) as unknown as IReceiptJSON);
        const cell2 = r2.toCell();
        // console.log(cell2);


        const dataArr = jsonReceipt.logs.filter((l) => l.topics.includes(originalTopicId)).map((l) => l.data);
        const r = Receipt.fromJSON(JSON.parse(receipt) as unknown as IReceiptJSON);
        const cell = r.toCell();


        // console.log(cell);
        const rAddr = '0:0112aeb9f1d2e0d4ac4f8576718f4bdaa5930d61ebe8b6a788347efcea5a70c1';
        let testAddress = address(rAddr);

        const userWalletAddr = await jettonMinter.getWalletAddress(testAddress);
        const jettonWallet = blockchain.openContract(JettonWallet.createFromAddress(userWalletAddr));

        const sendReceiptResult = await adapter.sendConfirmReceipt(admin.getSender(), {
            value: toNano('1.05'),
            receipt: cell,
        });

        console.log('ALARM:', sendReceiptResult.transactions.map(t => t.totalFees));

        const sendReceiptResult2 = await adapter.sendConfirmReceipt(admin.getSender(), {
            value: toNano('11.05'),
            receipt: cell2,
        });

        const userBalance = await jettonWallet.getBalance();
        // await jettonWallet.sendBurn(admin, {

        // });
        expectSuccess(sendReceiptResult.transactions, admin.address, adapter.address);
        expectSuccess(sendReceiptResult.transactions, adapter.address, jettonMinter.address);
        expectSuccess(sendReceiptResult.transactions, jettonMinter.address, jettonWallet.address);

        // console.log(sendReceiptResult2.transactions.map(t => t.vmLogs));

        expectSuccess(sendReceiptResult2.transactions, admin.address, adapter.address);
        // expectSuccess(sendReceiptResult2.transactions, adapter.address, admin.address);
        // expectSuccess(sendReceiptResult2.transactions, jettonMinter.address, jettonWallet.address);

        // expect(userBalance.amount).toBe(2n * BigInt('0x3e8'));
    });

    it('should burn tokens', async () => {
        const userWalletAddr = await jettonMinter.getWalletAddress(user.address);
        const adapterWalletAddr = await jettonMinter.getWalletAddress(adapter.address);
        const jettonWalletUser = blockchain.openContract(JettonWallet.createFromAddress(userWalletAddr));
        const jettonWalletAdapter = blockchain.openContract(JettonWallet.createFromAddress(adapterWalletAddr));

        const r = Receipt.fromJSON(JSON.parse(receipt) as IReceiptJSON);
        const cell = r.toCell();



        const res = await adapter.sendReceipt(admin.getSender(), {
            // addrStr: '0x' + user.address.hash.toString('hex'),
            value: toNano('1.05'),
            receipt: cell,
            // jminterAddr: jettonMinter.address,
        });



        const dataArr = jsonReceipt.logs.filter((l) => l.topics.includes(originalTopicId)).map((l) => l.data);
        const walletBalance = await jettonWalletUser.getBalance();
        const initialSupply = await jettonMinter.getTotalsupply();



        // expect(walletBalance.amount).toBe(BigInt(dataArr[0]));

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


        console.log(burnRes.transactions);

        return;

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
