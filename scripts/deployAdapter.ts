import {compile, NetworkProvider} from '@ton-community/blueprint';
import {Address, toNano} from 'ton-core';
import {Adapter} from '../wrappers/Adapter';

const mint_topic = '0x6888ec7969c035bf2b2a4f1c3d41fd8e393fee76a9fa186e4c9405c1a01f9b72';
const burn_topic = '0x09a9af46918f2e52460329a694cdd4cd6d55354ea9b336b88b4dea59914a9a83';
const lite_client = Address.parse('EQDnI8km8-6aZiPewBpx-5ZNTDSOScH3lcvi6MIt3TXi60Gx');
// adapter: EQBM3c_ElsKvQH6l2jKW1uHk7qemPBX6rcwgYxRuQccw6nkj
// jettonMinter: EQCelep7WMhLCoTCkQazh50aW77GihEfCxDHXyZuU7SAmm5A

export async function run(provider: NetworkProvider) {
    const adapter = provider.open(Adapter.createFromConfig({
        // jminter_addr: jettonMinter.address,
        topic_mint_id: mint_topic,
        topic_burn_id: burn_topic,
        light_client_addr: lite_client,
    }, await compile('Adapter')));

    await adapter.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(adapter.address);

    console.log("Adapter:", adapter.address)

    // run methods on `adapter`
}
