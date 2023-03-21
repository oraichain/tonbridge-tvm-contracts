import * as fs from 'fs';
import { WalletContractV4 } from 'ton';
import { KeyPair, mnemonicNew, mnemonicToPrivateKey } from 'ton-crypto';

export const recoverWalletV3R2FromSeed = async () => {
  let keyPair: KeyPair | null = null;
  try {
    const mnemonicsStr = fs.readFileSync('.artifacts/wallet.mnemonics', {
      encoding: 'utf8',
      flag: 'r',
    });
    keyPair = await mnemonicToPrivateKey(mnemonicsStr.split(','));
  } catch (err) {
    const mnemonics = await mnemonicNew(24);
    keyPair = await mnemonicToPrivateKey(mnemonics);
    fs.writeFileSync('.artifacts/wallet.mnemonics', mnemonics.join(','));
  }

  const adminWallet = WalletContractV4.create({
    publicKey: Buffer.from(keyPair.publicKey),
    workchain: 0,
  });

  return { adminWallet, adminWalletKeyPair: keyPair };
};
