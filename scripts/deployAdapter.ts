import { toNano } from 'ton-core';
import { Adapter } from '../wrappers/Adapter';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const adapter = provider.open(Adapter.createFromConfig({}, await compile('Adapter')));

    await adapter.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(adapter.address);

    // run methods on `adapter`
}
