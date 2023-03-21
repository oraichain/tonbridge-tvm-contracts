import { compileContract } from 'ton-compiler';
import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender } from 'ton-core';
import { BridgeOpCodes } from '../utils/op-codes';

export type BridgeData = {
  version: bigint;
};

export class Bridge implements Contract {
  static async compile() {
    const result = await compileContract({
      files: ['src/func/bridge/bridge.fc'],
      stdlib: true,
      version: 'latest',
    });

    if (!result.ok) {
      console.log(result.log);
      throw new Error('Compile error!');
    } else {
      return result.output;
    }
  }

  readonly address: Address;
  readonly init: { code: Cell; data: Cell };

  constructor(workchain?: number, code?: Cell, data?: BridgeData, addr?: Address) {
    if (workchain && code && data) {
      this.init = {
        code,
        data: beginCell().storeUint(data.version, 8).endCell(),
      };
      this.address = contractAddress(workchain, this.init);
    } else {
      this.init = {
        code: Cell.EMPTY,
        data: Cell.EMPTY,
      };
      this.address = addr!;
    }
  }

  async sendDeploy(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    params: {
      init: { code: Cell; data: Cell };
      body?: Cell;
    },
  ) {
    await provider.internal(via, { value });
    return contractAddress(0, params.init);
  }

  async sendWrap(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    params: {
      ethAddr: string;
      amount: bigint;
    },
  ) {
    return await provider.internal(via, {
      value,
      body: beginCell()
        .storeUint(BridgeOpCodes.WRAP, 32)
        .storeUint(0, 64)
        .storeUint(BigInt(params.ethAddr), 160)
        .storeCoins(params.amount)
        .endCell(),
    });
  }
}
