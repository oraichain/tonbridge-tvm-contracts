import { compileContract } from 'ton-compiler';
import { Address, beginCell, Cell, Contract, ContractProvider, Dictionary, Sender } from 'ton-core';

export class JettonWallet implements Contract {
  static async compile() {
    const result = await compileContract({
      files: [
        'src/func/bridge/utils/specific.fc',
        'src/func/jetton/op-codes.fc',
        'src/func/jetton/params.fc',
        'src/func/jetton/jetton-utils.fc',
        'src/func/jetton/jetton-wallet.fc',
      ],
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

  constructor(address: Address) {
    this.init = {
      code: new Cell(),
      data: new Cell(),
    };
    this.address = address;
  }

  async sendTransfer(
    provider: ContractProvider,
    via: Sender,
    params: {
      coinAmount: bigint;
      destAddr: Address;
      tokenAmount: bigint;
      responseAddr: Address;
      customPayload: Dictionary<any, any>;
      forwardCoinAmount: bigint;
      forwardMsg: Cell | null;
    },
  ) {
    return await provider.internal(via, {
      value: params.coinAmount,
      body: beginCell()
        .storeUint(0xf8a7ea5, 32)
        .storeUint(0, 64)
        .storeCoins(params.tokenAmount)
        .storeAddress(params.destAddr)
        .storeAddress(params.responseAddr)
        .storeDict(params.customPayload)
        .storeCoins(params.forwardCoinAmount)
        .storeMaybeRef(params.forwardMsg)
        .endCell(),
    });
  }

  async getBalance(provider: ContractProvider) {
    const state = await provider.getState();
    if (state.state.type !== 'active') {
      return { amount: 0n };
    }
    const { stack } = await provider.get('get_wallet_data', []);
    const [amount] = [stack.readBigNumber()];
    return { amount };
  }
}
