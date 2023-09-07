import bls from "@chainsafe/blst";
import sszAltair from '@lodestar/types/altair';
import ssz from '@lodestar/types/capella';
import {compile} from '@ton-community/blueprint';
import {Blockchain, SandboxContract} from '@ton-community/sandbox';
import '@ton-community/test-utils';
import {Cell, Dictionary, beginCell, toNano} from 'ton-core';
import {bytes} from '../evm-data/utils';
import {LightClient} from '../wrappers/LightClient';
import {getConfig} from './config';
import UpdatesJson from './ssz/finally_update.json';

function committeeToCell(data: (typeof UpdatesJson)[0]['data']['next_sync_committee']) {
    const CommitteeContent = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Buffer(48));
    data.pubkeys.forEach((item, i) => {
        CommitteeContent.set(i, bytes(item));
    });

    return beginCell()
        .storeBuffer(bytes(data.aggregate_pubkey))
        .storeRef(beginCell().storeDict(CommitteeContent).endCell())
        .endCell();
}

describe('LightClient', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('LightClient');
    });

    let blockchain: Blockchain;
    let lightClient: SandboxContract<LightClient>;

    beforeEach(async () => {
        blockchain = await Blockchain.create({ config: getConfig() });

        lightClient = blockchain.openContract(
            LightClient.createFromConfig(
                {
                    id: 0,
                },
                code
            )
        );

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await lightClient.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: lightClient.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and lightClient are ready to use
        const a = UpdatesJson;
    });

    it('should init pubkeys', async () => {
        const user = await blockchain.treasury('user');

        const initResult = await lightClient.sendInitCommittee(user.getSender(), {
            value: toNano('15.05'),
            committee: committeeToCell(UpdatesJson[0].data.next_sync_committee),
        });

        const update = ssz.ssz.LightClientFinalityUpdate.fromJson(UpdatesJson[0].data);

        //  .LightClientFinalityUpdate.fromJson(UpdatesJson[0].data);

        const syncCommittee = sszAltair.ssz.SyncCommittee.fromJson(UpdatesJson[0].data.next_sync_committee);

        const participantPubkeys = update.syncAggregate.syncCommitteeBits
            .intersectValues(syncCommittee.pubkeys)
            .map((a) => bls.PublicKey.fromBytes(a));


        console.log(participantPubkeys.map(p => p))
        // const externalOutBodySlice = initResult.externals.map((ex) => ex.body.asSlice());
        // console.log(externalOutBodySlice);
        // console.log(initResult.transactions.map((t) => t.vmLogs));

        // expect(initResult.transactions).toHaveTransaction({
        //     from: user.address,
        //     to: lightClient.address,
        //     success: true,
        // });
    });

    // it('should should update pubkeys', async () => {
    //     const user = await blockchain.treasury('user');

    //     const initResult = await lightClient.sendInitCommittee(user.getSender(), {
    //         value: toNano('15.05'),
    //         committee: committeeToCell(UpdatesJson[1].data.next_sync_committee),
    //     });

    //     const externalOutBodySlice = initResult.externals.map((ex) => ex.body.asSlice());
    //     console.log(externalOutBodySlice);
    //     console.log(initResult.transactions.map((t) => t.vmLogs));

    //     // expect(initResult.transactions).toHaveTransaction({
    //     //     from: user.address,
    //     //     to: lightClient.address,
    //     //     success: true,
    //     // });

    // });
});
