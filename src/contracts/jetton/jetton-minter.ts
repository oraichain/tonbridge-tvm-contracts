import { JettonMaster } from 'ton';
import { compileContract } from 'ton-compiler';
import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, toNano } from 'ton-core';

export type JettonMinterData = {
  totalSupply: bigint;
  adminAddress: Address;
  content: Cell;
  jettonWalletCode: Cell;
};

JettonMaster;

export class JettonMinter implements Contract {
  static async compile() {
    const result = await compileContract({
      files: [
        'src/func/bridge/utils/specific.fc',
        'src/func/jetton/op-codes.fc',
        'src/func/jetton/params.fc',
        'src/func/jetton/jetton-utils.fc',
        'src/func/jetton/jetton-minter.fc',
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

  constructor(workchain: number, code: Cell, data: JettonMinterData) {
    this.init = {
      code,
      data: beginCell()
        .storeCoins(data.totalSupply)
        .storeAddress(data.adminAddress)
        .storeRef(data.content)
        .storeRef(data.jettonWalletCode)
        .endCell(),
    };
    this.address = contractAddress(workchain, this.init);
  }

  async sendMint(
    provider: ContractProvider,
    via: Sender,
    params: {
      value?: bigint;
      address: Address;
      amount: bigint;
    },
  ) {
    return await provider.internal(via, {
      value: params.value ?? toNano('1'),
      body: beginCell()
        .storeUint(21, 32)
        .storeUint(0, 64)
        .storeAddress(params.address)
        .storeCoins(params.value ? params.value - toNano('0.2') : toNano('0.8'))
        .storeRef(
          beginCell()
            .storeUint(0x178d4519, 32)
            .storeUint(0, 64)
            .storeCoins(params.amount)
            .storeAddress(null)
            .storeAddress(null)
            .storeCoins(0)
            .storeBit(false)
            .endCell(),
        )
        .endCell(),
    });
  }

  async sendDeploy(
    provider: ContractProvider,
    via: Sender,
    params: {
      init: { code: Cell; data: Cell };
      body?: Cell;
      value?: bigint;
    },
  ) {
    await provider.internal(via, {
      value: params.value ?? toNano('0.1'),
    });
    return contractAddress(0, params.init);
  }

  async getWalletAddress(provider: ContractProvider, owner: Address) {
    const { stack } = await provider.get('get_wallet_address', [
      { type: 'slice', cell: beginCell().storeAddress(owner).endCell() },
    ]);
    const [address] = [stack.readAddress()];

    return {
      address,
    };
  }

  async getJettonData(provider: ContractProvider) {
    const { stack } = await provider.get('get_jetton_data', []);
    const [totalSupply, mintable, adminAddressess, content, walletCode] = [
      stack.readBigNumber(),
      stack.readBoolean(),
      stack.readAddress(),
      stack.readCell(),
      stack.readCell(),
    ];

    return {
      totalSupply,
      mintable,
      adminAddressess,
      content,
      walletCode,
    };
  }
}
