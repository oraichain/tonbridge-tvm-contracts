import {compile, NetworkProvider} from '@ton-community/blueprint';
import {toNano} from 'ton-core';
import {LightClient} from '../wrappers/LightClient';

export async function run(provider: NetworkProvider) {
    const lightClient = provider.open(LightClient.createFromConfig({}, await compile('LightClient')));

    await lightClient.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(lightClient.address);

    // run methods on `lightClient`
    console.log('Light Client addr:', lightClient.address.toString({urlSafe: true}))
}
