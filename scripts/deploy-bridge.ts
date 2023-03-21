import { Cell, TonClient } from 'ton';
import { toNano } from 'ton-core';
import { Bridge } from '../src/contracts/bridge/bridge';
import { recoverWalletV3R2FromSeed } from '../src/contracts/utils';
import { sleep } from '../src/contracts/utils/time';

require('dotenv').config();

const VERSION = BigInt(1);

const main = async () => {
  const tonClient = new TonClient({
    endpoint: process.env.TON_CLIENT_ENDPOINT!,
    apiKey: process.env.TON_CLIENT_API_KEY!,
  });
  const { adminWallet, adminWalletKeyPair } = await recoverWalletV3R2FromSeed();

  const bridge = tonClient.open(
    new Bridge(0, Cell.fromBase64((await Bridge.compile()).toString('base64')), {
      version: VERSION,
    }),
  );

  const deployBridgeResult = await bridge.sendDeploy(
    adminWallet.sender(tonClient.provider(adminWallet.address, adminWallet.init), adminWalletKeyPair.secretKey),
    toNano('0.1'),
    {
      init: bridge.init,
    },
  );

  await sleep(5000);

  console.log('bridgeAddr', deployBridgeResult);
};

main();
