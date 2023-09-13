import {PublicKey, Signature, aggregatePubkeys, verify} from '@chainsafe/blst';
import {getUint8ByteToBitBooleanArray} from '@chainsafe/ssz';
import {compile} from '@ton-community/blueprint';
import {Blockchain, SandboxContract} from '@ton-community/sandbox';
import '@ton-community/test-utils';
import {Cell, Dictionary, beginCell, toNano} from 'ton-core';
import {bytes} from '../evm-data/utils';
import {LightClient} from '../wrappers/LightClient';
import {getConfig} from './config';
import {LightClientFinalityUpdate, SyncCommittee} from './ssz/finally_update';
import UpdatesJson from './ssz/finally_update.json';
import {BeaconBlockHeader, SigningData} from './ssz/ssz-beacon-type';
import {SSZRootToCell, SSZUintToCell, getSSZContainer} from './ssz/ssz-to-cell';

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

function syncAggregateToCell(data: (typeof UpdatesJson)[0]['data']['sync_aggregate']) {
    return beginCell()
    .storeBuffer(bytes(data.sync_committee_bits))
    .storeRef(
        beginCell()
        .storeBuffer(bytes(data.sync_committee_signature))
        .endCell()
    )
    .endCell()
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

        const externalOutBodySlice = initResult.externals.map((ex) => ex.body.asSlice());
        // console.log(initResult.transactions.map((t) => t.vmLogs));
        console.log(externalOutBodySlice);

        // const pubkeys = await lightClient.getPubkeys();
        // console.log(pubkeys);

        expect(initResult.transactions).toHaveTransaction({
            from: user.address,
            to: lightClient.address,
            success: true,
        });
    });

    it('should should update pubkeys', async () => {
        const user = await blockchain.treasury('user');

        const update = LightClientFinalityUpdate.fromJson(UpdatesJson[1].data);
        let fixedCommitteeBits = '';
        update.syncAggregate.sync_committee_bits.uint8Array.forEach(el => {
            const a = getUint8ByteToBitBooleanArray(el);
            fixedCommitteeBits += parseInt(a.map(el => el ? 1 : 0).join(''), 2).toString(16);
        })

        const sig = Signature.fromBytes(
            update.syncAggregate.sync_committee_signature
        );


        const objectRoot = BeaconBlockHeader.hashTreeRoot(
            update.attestedHeader.beacon
          );
        const signingRoot = SigningData.hashTreeRoot({
            objectRoot,
            domain: bytes('0x0700000047eb72b3be36f08feffcaba760f0a2ed78c1a85f0654941a0d19d0fa'),
          });

          const beaconContainerCell = getSSZContainer(
            SSZUintToCell(
                { value: +UpdatesJson[1].data.attested_header.beacon.slot, size: 8, isInf: true },
                SSZUintToCell(
                    { value: +UpdatesJson[1].data.attested_header.beacon.proposer_index, size: 8, isInf: false },
                    SSZRootToCell(UpdatesJson[1].data.attested_header.beacon.parent_root, SSZRootToCell(UpdatesJson[1].data.attested_header.beacon.state_root, SSZRootToCell(UpdatesJson[1].data.attested_header.beacon.body_root)))
                )
            ),
        );

        const initResult = await lightClient.sendUpdateCommittee(user.getSender(), {
            value: toNano('15.05'),
            committee: committeeToCell(UpdatesJson[0].data.next_sync_committee),
            aggregate: syncAggregateToCell({...UpdatesJson[1].data.sync_aggregate, sync_committee_bits: '0x' + fixedCommitteeBits}),
            beaconSSZ: beaconContainerCell,
            msg: beginCell().storeBuffer(Buffer.from(signingRoot)).endCell()
        });

        const externalOutBodySlice = initResult.externals.map((ex) => ex.body.asSlice());
        console.log(initResult.transactions.map((t) => t.vmLogs));


        //  .LightClientFinalityUpdate.fromJson(UpdatesJson[0].data);

        const syncCommittee = SyncCommittee.fromJson(UpdatesJson[0].data.next_sync_committee);

        const participantPubkeys = update.syncAggregate.sync_committee_bits
        .intersectValues(syncCommittee.pubkeys)
        .map((a) => PublicKey.fromBytes(a));




        const aggPubkey = aggregatePubkeys(participantPubkeys);
        console.log(externalOutBodySlice);
        console.log(Buffer.from(aggPubkey.toBytes()).toString('hex'))




        const res = verify(signingRoot, aggPubkey, sig);
        console.log(res);
        console.log(Buffer.from(signingRoot).toString('hex'))

        // console.log(participantPubkeys.map(p => Buffer.from(p).toString('hex')))

        // expect(initResult.transactions).toHaveTransaction({
        //     from: user.address,
        //     to: lightClient.address,
        //     success: true,
        // });

    });
});


const domain = '0x0700000047eb72b3be36f08feffcaba760f0a2ed78c1a85f0654941a0d19d0fa';
