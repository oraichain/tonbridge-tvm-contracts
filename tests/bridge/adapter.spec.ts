import { Blockchain, OpenedContract, TreasuryContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';
import { Cell, Dictionary, beginCell, toNano } from 'ton-core';
import { sha256 } from 'ton-crypto';
import { Adapter } from '../../src/contracts/adapter/adapter';
import { JettonMinter } from '../../src/contracts/jetton/jetton-minter';
import { JettonWallet } from '../../src/contracts/jetton/jetton-wallet';
import { IReceiptJSON, Receipt } from '../../src/evm-data/receipt';
import { jsonReceipt } from '../mocks';
import { expectSuccess } from '../utils';

describe('Adapter test', () => {
  let bc: Blockchain;

  let admin: OpenedContract<TreasuryContract>;
  let user: OpenedContract<TreasuryContract>;

  let adapter: OpenedContract<Adapter>;
  let jETH: OpenedContract<JettonMinter>;

  const tonAddr = '0xacdbb697940e09b94c0dd1232ba817ee66786213116d2e3f603e2f9354886519';

  beforeAll(async () => {
    bc = await Blockchain.create();
    admin = await bc.treasury('admin');
    user = await bc.treasury('user');

    adapter = bc.openContract(
      new Adapter(0, Cell.fromBase64((await Adapter.compile()).toString('base64')), { version: BigInt(1) }),
    );
    const deployResult = await adapter.sendDeploy(admin.getSender(), toNano('0.1'), {
      init: adapter.init,
    });

    expectSuccess(deployResult.transactions, admin.getSender().address, adapter.address, true);

    const jETHContent = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
    jETHContent
      .set(
        BigInt('0x' + (await sha256('name')).toString('hex')),
        beginCell().storeUint(0x00, 8).storeBuffer(Buffer.from('wETH', 'utf8')).endCell(),
      )
      .set(
        BigInt('0x' + (await sha256('decimals')).toString('hex')),
        beginCell().storeUint(0x00, 8).storeBuffer(Buffer.from('18', 'utf8')).endCell(),
      );

    jETH = bc.openContract(
      new JettonMinter(0, Cell.fromBase64((await JettonMinter.compile()).toString('base64')), {
        totalSupply: BigInt(0),
        adminAddress: adapter.address,
        // adminAddress: admin.address, //adapter.address,
        content: beginCell().storeInt(0x00, 8).storeDict(jETHContent).endCell(),
        jettonWalletCode: Cell.fromBase64((await JettonWallet.compile()).toString('base64')),
      }),
    );

    const deployjETH = await jETH.sendDeploy(admin.getSender(), { init: jETH.init });
    expectSuccess(deployjETH.transactions, admin.getSender().address, jETH.address, true);

    // const ggrMintResult = await jETH.sendMint(admin.getSender(), {
    //   address: admin.getSender().address,
    //   amount: parseUnits('100'),
    // });
    // const ggrMintResult2 = await jETH.sendMint(admin.getSender(), {
    //   address: user.address,
    //   amount: parseUnits('100'),
    // });

    // console.log(
    //   ggrMintResult.transactions.filter((t) => t.description.type === 'generic' && t.description.aborted),
    //   // .map((t) => t.outMessages.values().map((m) => (m.info as any).value)),
    // );

    // const adminGgrWallet = bc.openContract(
    //   new JettonWallet((await jETH.getWalletAddress(admin.getSender().address)).address),
    // );
    // console.log(await adminGgrWallet.getBalance());
  });

  it('should emit log after receive ETH log', async () => {
    // const amount = toNano('1');
    const userGgrWallet = bc.openContract(new JettonWallet((await jETH.getWalletAddress(user.address)).address));

    // console.log(await userGgrWallet.getBalance());

    const wrapResult = await adapter.sendETH(admin.getSender(), jETH.address, user.address, toNano('2.2'));
    // const wrapResult2 = await adapter.sendETH(admin.getSender(), jETH.address, user.address, toNano('2.2'));
    const tonAddress = user.address.toString(); // 'EQCs27aXlA4JuUwN0SMrqBfuZnhiExFtLj9gPi-TVIhlGVWa';
    let generatedTonAddr = '';

    wrapResult.transactions.map((e) => {
      // console.log('transaction:', e);
      const tx = e.outMessages.get(0);
      if (tx) {
        if (tx.info.type !== 'external-out') {
          return e;
        }
        try {
          const slice = tx.body.beginParse();
          generatedTonAddr = slice.loadAddress().toString();
        } catch (error) {}
      }

      return undefined;
    });

    // console.log(jETH.address.toString());
    // console.log(wrapResult.transactions.map((t) => t.outMessages.values().map((m) => m.info)));

    console.log(
      ...wrapResult.transactions
        .filter((t) => t.description.type === 'generic' && t.description.aborted)
        .map((t) => t.description),
      // .map((t) => (t.description.type === 'generic' ? (t.description.computePhase as any).exitCode : '')),
      // .map((t) => t.outMessages.values().map((m) => m.info)),
      // .map((t) => t.outMessages.values().map((m) => (m.info as any).value)),
    );
    // console.log(await userGgrWallet.getBalance());
    // expectSuccess(wrapResult.transactions, admin.getSender().address, adapter.address);
    // expectSuccess(wrapResult2.transactions, admin.getSender().address, adapter.address);
    // expect(generatedTonAddr).toBe(tonAddress);
  });

  it('should parse receipt', async () => {
    const r = Receipt.fromJSON(jsonReceipt as unknown as IReceiptJSON);
    const cell = r.toCell();

    const wrapResult = await adapter.sendETH(admin.getSender(), jETH.address, user.address, toNano('200.2'));
    // const wrapResult = await adapter.sendReceipt(admin.getSender(), jETH.address, user.address, toNano('2.2'), cell);
    console.log(
      ...wrapResult.transactions
        .filter((t) => t.description.type === 'generic' && t.description.aborted)
        .map((t) => t.description),
      // .map((t) => (t.description.type === 'generic' ? (t.description.computePhase as any).exitCode : '')),
      // .map((t) =>
      //   t.outMessages.values().map((m) => {
      //     if (m.info.type === 'external-out') {
      //       // const slice = m.body.beginParse();
      //       // const num = slice.loadUintBig(256);
      //       // const topicId = slice.loadUintBig(256); //slice.loadBuffer(32).toString('hex');
      //       // console.log({ num, topicId });
      //       console.log('found!');
      //     }
      //     return m.body;
      //   }),
      // ),
      // .map((t) => t.outMessages.values()),
      // .map((t) => t.outMessages.values().map((m) => (m.info as any).value)),
    );
    expectSuccess(wrapResult.transactions, admin.getSender().address, adapter.address);
  });
});
