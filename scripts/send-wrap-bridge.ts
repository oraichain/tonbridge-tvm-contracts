import { ethers } from 'ethers';
import { TonClient } from 'ton';
import { Address, toNano } from 'ton-core';
import { Bridge } from '../src/contracts/bridge/bridge';
import { recoverWalletV3R2FromSeed } from '../src/contracts/utils';

require('dotenv').config();

const bridgeAddr = 'EQCfz4RUw-_AeFidWd5G5j1PRE8rII3Z-WwQVA9r4AMf0FGW';
const ethAddr = ethers.Wallet.createRandom().address;
const amount = toNano(1);

const main = async () => {
  const tonClient = new TonClient({
    endpoint: process.env.TON_CLIENT_ENDPOINT!,
    apiKey: process.env.TON_CLIENT_API_KEY!,
  });
  const { adminWallet, adminWalletKeyPair } = await recoverWalletV3R2FromSeed();

  const bridge = tonClient.open(new Bridge(undefined, undefined, undefined, Address.parse(bridgeAddr)));

  await bridge.sendWrap(
    adminWallet.sender(tonClient.provider(adminWallet.address, adminWallet.init), adminWalletKeyPair.secretKey),
    toNano('0.2') + amount,
    {
      amount,
      ethAddr,
    },
  );
};

main();
