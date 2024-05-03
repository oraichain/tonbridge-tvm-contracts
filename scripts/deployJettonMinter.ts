import { NetworkProvider, compile } from '@ton-community/blueprint';
import { Address, Dictionary, beginCell, toNano } from 'ton-core';
import { sha256 } from 'ton-crypto';
import { Adapter } from '../wrappers/Adapter';
import { JettonMinter } from '../wrappers/JettonMinter';

const adapter_addr = Address.parse('EQBXGmE4yMbdaljWGMfiYkAvOm3YpmY4WAOzFoK3L01iaMXp');

export async function run(provider: NetworkProvider) {

    const randomSeed = Math.floor(Math.random() * 10000);

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

    const jettonMinter = provider.open(JettonMinter.createFromConfig({

        adminAddress: adapter_addr,
        content: beginCell().storeInt(0x00, 8).storeDict(jETHContent).endCell(),
        jettonWalletCode: await compile('JettonWallet')

    }, await compile('JettonMinter')));

    await jettonMinter.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(jettonMinter.address);

    const adapter = provider.open(Adapter.createFromAddress(adapter_addr));

    await adapter.sendJminterAddr(provider.sender(), {
        value: toNano('0.05'),
        jminterAddr: jettonMinter.address,
    })

    // run methods on `jettonMinter`
}
