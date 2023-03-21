import { Blockchain, OpenedContract, TreasuryContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';
import { ethers } from 'ethers';
import { Cell, toNano } from 'ton-core';
import { Bridge } from '../../src/contracts/bridge/bridge';
import { BridgeErrors } from '../../src/contracts/utils/errors';
import { expectFail, expectSuccess } from '../utils';

describe('Bridge test', () => {
  let bc: Blockchain;

  let admin: OpenedContract<TreasuryContract>;
  let user: OpenedContract<TreasuryContract>;

  let bridge: OpenedContract<Bridge>;

  const ethAddr = ethers.Wallet.createRandom().address;

  beforeAll(async () => {
    bc = await Blockchain.create();
    admin = await bc.treasury('admin');
    user = await bc.treasury('user');

    bridge = bc.openContract(
      new Bridge(0, Cell.fromBase64((await Bridge.compile()).toString('base64')), { version: BigInt(1) }),
    );
    const deployResult = await bridge.sendDeploy(admin.getSender(), toNano('0.1'), {
      init: bridge.init,
    });

    expectSuccess(deployResult.transactions, admin.getSender().address, bridge.address, true);
  });

  it('should throw MSG_VALUE_TOO_SMALL if msg.value less that amount + 0.2 TON', async () => {
    const amount = toNano('1');
    const wrapResult = await bridge.sendWrap(admin.getSender(), toNano('0.1'), {
      amount,
      ethAddr,
    });

    expectFail(wrapResult.transactions, admin.getSender().address, bridge.address, BridgeErrors.MSG_VALUE_TOO_SMALL);
  });

  it('should emit log after receive wrap op', async () => {
    const amount = toNano('1');
    const wrapResult = await bridge.sendWrap(admin.getSender(), toNano('0.2') + amount, {
      amount,
      ethAddr,
    });

    expectSuccess(wrapResult.transactions, admin.getSender().address, bridge.address);
  });
});
