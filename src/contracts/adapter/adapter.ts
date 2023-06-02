import { compileContract } from 'ton-compiler';
import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender } from 'ton-core';

export type AdapterData = {
  version: bigint;
};

export class Adapter implements Contract {
  static async compile() {
    const result = await compileContract({
      files: ['src/func/bridge/utils/specific.fc', 'src/func/bridge/adapter.fc'],
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

  constructor(workchain: number = 0, code?: Cell, data?: AdapterData, addr?: Address) {
    if (code && data) {
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

  async sendETH(provider: ContractProvider, via: Sender, addr: Address, destAddr: Address, value: bigint) {
    return await provider.internal(via, {
      value,
      body: beginCell()
        .storeBuffer(Buffer.from(destAddr.hash.toString('hex'), 'hex'), 32)
        .storeUint(BigInt('0x00000000000000000000000000000000000000000000000000000000000186a0'), 256)
        .storeAddress(addr)
        .endCell(),
    });
  }

  async sendReceipt(
    provider: ContractProvider,
    via: Sender,
    addr: Address,
    destAddr: Address,
    value: bigint,
    receipt: Cell,
  ) {
    return await provider.internal(via, {
      value,
      body: beginCell()
        .storeBuffer(Buffer.from(destAddr.hash.toString('hex'), 'hex'), 32)
        .storeUint(BigInt('0x00000000000000000000000000000000000000000000000000000000000186a0'), 256)
        .storeAddress(addr)
        .storeRef(receipt)
        .endCell(),
    });
  }
}
