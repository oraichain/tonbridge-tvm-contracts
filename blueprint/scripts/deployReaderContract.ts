import { toNano } from 'ton-core';
import { ReaderContract } from '../wrappers/ReaderContract';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const readerContract = provider.open(
        ReaderContract.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
            },
            await compile('ReaderContract')
        )
    );

    await readerContract.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(readerContract.address);

    console.log('ID', await readerContract.getID());
}
