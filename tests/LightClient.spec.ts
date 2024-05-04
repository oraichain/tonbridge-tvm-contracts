import {ByteListType, ByteVectorType, getUint8ByteToBitBooleanArray} from '@chainsafe/ssz';
import {compile} from '@ton-community/blueprint';
import {Blockchain, EventMessageSent, SandboxContract} from '@ton-community/sandbox';
import '@ton-community/test-utils';
import {rlp} from 'ethereumjs-util';
import {Builder, Cell, Dictionary, beginCell, toNano} from 'ton-core';
import {sha256} from 'ton-crypto';
import {BlockHeader} from '../evm-data/block-header';
import {IReceiptJSON, Receipt} from '../evm-data/receipt';
import {bytes, toNumber} from '../evm-data/utils';
import {Adapter} from '../wrappers/Adapter';
import {JettonMinter} from '../wrappers/JettonMinter';
import {LightClient} from '../wrappers/LightClient';
import J3905472 from './mock/476/122046/3905472.fake.json';
import J3905472F from './mock/476/122046/3905472.finality.json';
import J3905473 from './mock/476/122046/3905473.fake.json';
import J3905474 from './mock/476/122046/3905474.fake.json';
import J3905475 from './mock/476/122046/3905475.fake.json';
import AllCommittees from './mock/upates.475.json';
import UpdatesJson from './ssz/finally_update.json';
import {getExecutionContainerCell} from './ssz/finally_update.mock';
import {
    BYTES_PER_LOGS_BLOOM,
    BeaconBlockHeader,
    Bytes20,
    MAX_EXTRA_DATA_BYTES,
    UintBn256,
} from './ssz/ssz-beacon-type';
import {SSZByteVectorTypeToCell, SSZRootToCell, SSZUintToCell, getSSZContainer} from './ssz/ssz-to-cell';

const testUpdate = {
    id: 344,
    slot: 4332168,
    proposerIndex: 1398,
    parentRoot: '0x98ac4ad2a3d497c211a35d6767e957d8bb57777895d63c9311bc5ad9c9100011',
    stateRoot: '0x98963c5e55ffd1668b3c9695aeec1dee80034302742ddb6ac31e8a31a6577bdc',
    bodyRoot: '0xc0cc781e12d3a5c593e29c121d409615086fbcc6a2fa473fc5467aa0c080f4fa',
    selfHash: '0xa0a05e3a7ddd7836c9243a1397ba86b67c8ca505ec43db48a5294a5e91421345',
    isFinality: false,
    ParentBeaconId: 343,
};

const receiptData = {
    receipt: {
        transactionHash: '0x11914d9f106d372a7ffc295dfd0db47cadfa6c354be311d4a3ac231f2c0bff4f',
        transactionIndex: '0x48',
        blockHash: '0xfc917def50ab4f902315946ebda29981a0912c286941749058a5a6467835a50f',
        blockNumber: '0x506d69',
        cumulativeGasUsed: '0x156c909',
        gasUsed: '0x8292',
        effectiveGasPrice: '0x8f8ff80e',
        from: '0xc7296d50ddb12de4d2cd8c889a73b98538624f61',
        to: '0xed53f9702841e91b3edf50a2a56c3a719c45aa5e',
        contractAddress: null,
        logs: [
            {
                removed: false,
                logIndex: '0x18a',
                transactionIndex: '0x48',
                transactionHash: '0x11914d9f106d372a7ffc295dfd0db47cadfa6c354be311d4a3ac231f2c0bff4f',
                blockHash: '0xfc917def50ab4f902315946ebda29981a0912c286941749058a5a6467835a50f',
                blockNumber: '0x506d69',
                address: '0xa922bfac455a5b3e26b4ba442d8c76b78bfc68b6',
                data: '0x80e2761bd251e74ffa3a4925da9fcffb5d6c5f9d19d22f66df902c725598aed200000000000000000000000000000000000000000000000000005af3107a4000',
                topics: ['0x6888ec7969c035bf2b2a4f1c3d41fd8e393fee76a9fa186e4c9405c1a01f9b72'],
            },
        ],
        logsBloom:
            '0x00000000000000000040000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        status: '0x1',
        type: '0x2',
    },
    txProof: [
        '0xf90111a032d775542d21fba84b3d0aeb24e8769d61e6c0c131eb6e11ff6697e1d8265e39a0e60f2e1fa4cb0ea4a39c1a5fea5e9f439269a639186270139dfe574145341d12a0dd22195aa06629703612bc68c87bc32279e945ce0f8de14134ae26d0d34b94a9a044f99769dff8e2a8fc193d3225fc2c6c80070770d33f3b029f2796e381eacff5a07e76c349c5c64ac1575468672ede78084e77139053981794e4e38006e5602bffa00ac891d7bd6053f606d8cfa272414b832655e7287c336195eeffefcef4722506a09bac77645ad1f3d4959a9892fba272f6132d30374a1f34917d29ef0ba66702b780a0abb0527f7afd1d8a642606998cd7eadd45d10a0224f0dd805eec6cb9566fcfa78080808080808080',
        '0xf90211a02edc7f38b5634074a6e785da9702b5238f82b02019f57136ed7a04209c0c0262a04391910c56f68f241da32450c799d3f1a5b6e0cc0508643945225eec4f06d8a3a098bef1bdb0535078da41a6fe03143060d4ae57171b6b4975d0915ae50722a496a0ee32468b8a86d4b01330a3f170eb2a29b5024933e3fcbe3e9f59729bdd792178a067de0fd1128ab9c38636390fd9a82fb0dc01c31c8ed7f914aabe119848e4df2ea074b76ed1975e68a307e3ed6bb15ac5d8b6623bef75fe3158037778c50bba43d9a0fcf0a72a2cc009ff2f507a91acbfa6d0506d7ff559b8b5c80db128d97d9f5d83a09d7913556c4052cf37e8d323ef235d25f093dc6db6efeed6959ad01a773ed6cba03fe74ca98f0526552384d4112eace4f3726efcaec533ceebd029c19b11e334eda02e9eca48b34d9e677e1e129177eb797679095ed1bb7ff0504db9de44bc4cd209a09d8a9107bff3f0714c8b90de08109dc8ce74ae1868de14b4b332617b6083605da0fbf9d60ff6c72005821da574723a11e979f65c39acd2589e839b4160696510d0a000fd545eaf58ae7a34ba49bf39a728ce3b802f15a10e45bcce9fb2b0e7e11b39a02e4175a8c33b984ffbc66b48403d27cf7ccfd2b72526d38546bf66ca24fd72c5a016174628839c064dbbf815d4b80cab0b8cbb6fe7c098f768c51b0b83decc8a94a040374d2d84c1188c5a45faf37d2f484a67a92c1e5542c35ec59d85f4f75db3c180',
        '0xf8c020b8bd02f8ba83aa36a78205d58459682f008499a76e5482855e94ed53f9702841e91b3edf50a2a56c3a719c45aa5e865af3107a4000b844d9fcea4e80e2761bd251e74ffa3a4925da9fcffb5d6c5f9d19d22f66df902c725598aed2000000000000000000000000a922bfac455a5b3e26b4ba442d8c76b78bfc68b6c001a0b3a9f5d52f19486e04916ebf929a411c37ae526b04244a241c893e2ff136290da010b91ff887a29c1087adb8da0fffae0a4e5501249b1ad72ab77db6dc160103a4',
    ],
    receiptProof: [
        '0xf90111a0d39bf87463d0567907ca94f7a12f8b91b41e836090f423f5fc2a933c47402a2ba070887969bf223bc350c1f6f188569289918829eba71110346ecee6012f7c39c8a0116ad783f00a9cdc5e6da9cb7501d73f4a01a8067e0013256e32255759f6bb33a009656b55cd7ec3bc60e4956146e6160cec33cf1349d5386861bbe98262c82015a0e9e51c358db7815647b816452b2e58196c8d6ca5b826989c42f7173dcdc47aa4a02451e7fea55d5011f5123d13842657e34f632a99eb598a9bb0f4f90628e09801a02e49c65bfecac93fe301e74524de4b6e461783c71a864b8d3e0d88c1a85a43fd80a0a2eefb09287d1c240be951f356ff9fc9858af927c457b1765edcf6915eded8758080808080808080',
        '0xf90211a065aadecf8e490855d8191a4543afb8a73e7a2288b3e8e6807e98fba10a2a7527a0e0d6e5c456ac3bc50a2a401ce730db933d985d92fa48480c288f6c6fb6dc4f9aa0d4c8cf87e230c44cf8dec74564ae743a4ec49badb4d58df3506fdcc1ffa32b32a0553eab8dc8f06c7e6e1db9cf968ff4d43cbaa5a7f587a9d180280e3f1b21185da048c269eaf40affdf6e9c3758dae3adce25fd714d6d42351068992deedd3ed770a03e8c79237c7d0495a6a4dc76b5c97e8a5cc0f7f6a764fd65a5eb23a66ebc56b6a08282c540fb0dd1c37099c16d0f9896b2e1b4283263509081d4b56c2ecd93f635a0efc444c76dc21e72701fe900bfdc83189e554826e1654d7c4f3fcf1733b0749ba0ce1ed8ea4bcf645683612955472f68f1c6045f336a1fd4ed94ebce649c54fe92a0e72d096b22d3448349f91b59dbd576736a38b05135641bb031dd54abd3c68d75a0b029af68909be13d4f7cb692292c046d6deb0d1f22f679a65222d8f9f959c9eda09c19ff9bbda99c502965c8070d9f5c726f70dd7ce10bb72a3eaa237303bfd31ba0df6617067da80148fdd1f095a90097c8fc84d3fbab85ad7a49f949abd52bf200a0090648f19f6c432e75dabff36b05bafbda7f16cf3426abc6d3b75299a33a3614a0cd763ad01a3b848fdd281783f253c3c2e24e5ec5abcad1144082df06e51f9e6ca0af2ef361838600ab4c04f9f1b9263bb76c58396fb62e9b09f4e182320262673e80',
        '0xf9018e20b9018a02f9018601840156c909b9010000000000000000000040000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f87bf87994a922bfac455a5b3e26b4ba442d8c76b78bfc68b6e1a06888ec7969c035bf2b2a4f1c3d41fd8e393fee76a9fa186e4c9405c1a01f9b72b84080e2761bd251e74ffa3a4925da9fcffb5d6c5f9d19d22f66df902c725598aed200000000000000000000000000000000000000000000000000005af3107a4000',
    ],
    blockHeader:
        '0xf90265a0227cef1e62a05263351330c36a9ce9e3b334b11b18a1a1357b84bd64114c959da01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d4934794c4bfccb1668d6e464f33a76badd8c8d7d341e04aa0edccdc5e6abdda53d31d0187016e9dfebe2b0c176ec5eaaf21358b11dd2b9990a04b7afcefbc8129aba05a1d6ba010d3c5e2aeaec5af17f566fbbf324e53671c29a0beccd7598717600357f8614091398f8d7f74318392afd23c6e944856741456b4b901000850904f8c20409b28db46a2910454899c2b101000c0400543505a666deb09164c0a18b4a03c5431e886034e401fb0c72427822602e102e18508f083a0a4a59c40caa08b211f1001d14e55aa85087b838c26dc5665a662815ecc8010384201a4982b44da96406250a5555e057e75ab25064e2ccf0b2e049401188258971c0c9686ccc00c58ce04c8788cab0bcae011c30db301210004c02598bb515e6c41ba54228c12a289a4002e4ce541806c164e4d164761d86419ed9dee9006862e425002009a1372c73c204a45041837ec9e8917013a23711165813f8280980072cd6dba3b7197d88b6116064a404a08749ea30c64fa43444a102193e927034a33a856178083506d698401c9c3808401b3f80f8465c9bbc099d883010d0b846765746888676f312e32312e33856c696e7578a0cfcf5baa184aaf26845e9ea81ed7bcba67c722b27ae10c1f64029da6868f46ac880000000000000000843627c90ea0c953264a9b0b7834f6e1e3b1e6c86a006cb8dd5cc084b1687c97f619415382bc830c00008404c20000a098ac4ad2a3d497c211a35d6767e957d8bb57777895d63c9311bc5ad9c9100011',
};

const execution = {
    id: 340,
    parentHash: '0x227cef1e62a05263351330c36a9ce9e3b334b11b18a1a1357b84bd64114c959d',
    feeRecipient: '0xc4bfccb1668d6e464f33a76badd8c8d7d341e04a',
    stateRoot: '0xedccdc5e6abdda53d31d0187016e9dfebe2b0c176ec5eaaf21358b11dd2b9990',
    receiptsRoot: '0xbeccd7598717600357f8614091398f8d7f74318392afd23c6e944856741456b4',
    logsBloom:
        '0x0850904f8c20409b28db46a2910454899c2b101000c0400543505a666deb09164c0a18b4a03c5431e886034e401fb0c72427822602e102e18508f083a0a4a59c40caa08b211f1001d14e55aa85087b838c26dc5665a662815ecc8010384201a4982b44da96406250a5555e057e75ab25064e2ccf0b2e049401188258971c0c9686ccc00c58ce04c8788cab0bcae011c30db301210004c02598bb515e6c41ba54228c12a289a4002e4ce541806c164e4d164761d86419ed9dee9006862e425002009a1372c73c204a45041837ec9e8917013a23711165813f8280980072cd6dba3b7197d88b6116064a404a08749ea30c64fa43444a102193e927034a33a85617',
    prevRandao: '0xcfcf5baa184aaf26845e9ea81ed7bcba67c722b27ae10c1f64029da6868f46ac',
    blockNumber: 5270889,
    gasLimit: 30000000,
    gasUsed: 28571663,
    timestamp: 1707719616,
    extraData: '0xd883010d0b846765746888676f312e32312e33856c696e7578',
    baseFeePerGas: '908577038',
    blockHash: '0xfc917def50ab4f902315946ebda29981a0912c286941749058a5a6467835a50f',
    transactionsRoot: '0x8bf8bd7b1a5535aefb8e33b6071ef17c62acc5bb110c364a30273bee6bff8dc2',
    withdrawalsRoot: '0x6de5627691f1b1be1395e392350a29b1d4afcd05fdf9599642f7233fe8f6ab1f',
    beaconId: 344,
    executionBranch1: '0x5691db54beee3ed14ee2a546e9405cce6ec6a9264baad669a207efed42dd686b',
    executionBranch2: '0xef26adff05ccd591c897256e2128797fb27b3ec9bc4d619e0dd050228058571d',
    executionBranch3: '0xdb56114e00fdd4c1f85c892bf35ac9a89289aaecb1ebd0a96cde606a748b5d71',
    executionBranch4: '0x59570d5dec204f40eba5abc11d1319f5a1852d4617ad94c867720742714d7dfd',
};

export function getExecutionContainerCell2(data: any, tail?: Cell) {
    const withdrawalsRootCell = SSZRootToCell(data.withdrawalsRoot);
    const transactionsCell = SSZRootToCell(data.transactionsRoot, withdrawalsRootCell);
    const blockHashCell = SSZRootToCell(data.blockHash, transactionsCell);
    const baseFeePerGasCell = SSZRootToCell(
        '0x' + Buffer.from(UintBn256.hashTreeRoot(BigInt(data.baseFeePerGas))).toString('hex'),
        blockHashCell
    );
    const tmp = new ByteListType(MAX_EXTRA_DATA_BYTES);
    const extraDataCell = SSZRootToCell(
        '0x' + Buffer.from(tmp.hashTreeRoot(bytes(data.extraData))).toString('hex'),
        baseFeePerGasCell
    );
    const timestampCell = SSZUintToCell({ value: +data.timestamp, size: 8, isInf: false }, extraDataCell);
    const gas_usedCell = SSZUintToCell({ value: +data.gasUsed, size: 8, isInf: false }, timestampCell);
    const gas_limitCell = SSZUintToCell({ value: +data.gasLimit, size: 8, isInf: false }, gas_usedCell);
    const block_numberCell = SSZUintToCell({ value: +data.blockNumber, size: 8, isInf: false }, gas_limitCell);
    const prev_randao = SSZRootToCell(data.prevRandao, block_numberCell);
    const tmp2 = new ByteVectorType(BYTES_PER_LOGS_BLOOM);
    const logs_bloomCell = SSZByteVectorTypeToCell(
        data.logsBloom,
        BYTES_PER_LOGS_BLOOM,
        tmp2.maxChunkCount,
        prev_randao
    );
    const receipts_root = SSZRootToCell(data.receiptsRoot, logs_bloomCell);
    const state_root = SSZRootToCell(data.stateRoot, receipts_root);
    const fee_recipient = SSZByteVectorTypeToCell(data.feeRecipient, 20, Bytes20.maxChunkCount, state_root);
    const parent_hash = SSZRootToCell(data.parentHash, fee_recipient);

    return getSSZContainer(parent_hash, tail);
}

const execution_branch = [
    '0x5691db54beee3ed14ee2a546e9405cce6ec6a9264baad669a207efed42dd686b',
    '0xef26adff05ccd591c897256e2128797fb27b3ec9bc4d619e0dd050228058571d',
    '0xdb56114e00fdd4c1f85c892bf35ac9a89289aaecb1ebd0a96cde606a748b5d71',
    '0x59570d5dec204f40eba5abc11d1319f5a1852d4617ad94c867720742714d7dfd',
];

// execution_branch.reverse();

function committeeToCell(data: (typeof UpdatesJson)[0]['data']['next_sync_committee'], skip = false) {
    const CommitteeContent = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Buffer(48));
    data.pubkeys.forEach((item, i) => {
        CommitteeContent.set(i, bytes(item));
    });

    if (skip) {
        return (
            beginCell()
                .storeBuffer(bytes(data.aggregate_pubkey))
                // .storeRef(beginCell().storeDict(CommitteeContent).endCell())
                .endCell()
        );
    }

    return beginCell()
        .storeBuffer(bytes(data.aggregate_pubkey))
        .storeRef(beginCell().storeDict(CommitteeContent).endCell())
        .endCell();
}

function syncAggregateToCell(data: (typeof UpdatesJson)[0]['data']['sync_aggregate']) {
    return beginCell()
        .storeBuffer(bytes(data.sync_committee_bits))
        .storeRef(beginCell().storeBuffer(bytes(data.sync_committee_signature)).endCell())
        .endCell();
}

const domain = '0x07000000d31f6191ca65c836e170318c55fcf34b7e308f8fbca8e663bf565808';
const originalTopicId = '0x09a9af46918f2e52460329a694cdd4cd6d55354ea9b336b88b4dea59914a9a83';
const mint_topic = '0x6888ec7969c035bf2b2a4f1c3d41fd8e393fee76a9fa186e4c9405c1a01f9b72';
const burn_topic = '0x09a9af46918f2e52460329a694cdd4cd6d55354ea9b336b88b4dea59914a9a83';

const initialCommittee = UpdatesJson[0].data.next_sync_committee;
const firstUpdate = UpdatesJson[1];
const firstUpdateBeacon = firstUpdate.data.attested_header.beacon;
const firstUpdateBeaconSignature = BeaconBlockHeader.hashTreeRoot({
    slot: +firstUpdateBeacon.slot,
    proposerIndex: +firstUpdateBeacon.proposer_index,
    parentRoot: bytes(firstUpdateBeacon.parent_root),
    stateRoot: bytes(firstUpdateBeacon.state_root),
    bodyRoot: bytes(firstUpdateBeacon.body_root),
});
const firstUpdateExecution = firstUpdate.data.attested_header;

const t1initialCommittee = AllCommittees[0].data.next_sync_committee;
const t1firstUpdateBeacon = J3905472.data.attestedHeader.beacon;
const a = J3905472F;

const t1Hash = BeaconBlockHeader.hashTreeRoot({
    slot: J3905472.data.attestedHeader.beacon.slot,
    proposerIndex: J3905472.data.attestedHeader.beacon.proposerIndex,
    parentRoot: bytes('0x' + J3905472.data.attestedHeader.beacon.parentRoot),
    stateRoot: bytes('0x' + J3905472.data.attestedHeader.beacon.stateRoot),
    bodyRoot: bytes('0x' + J3905472.data.attestedHeader.beacon.bodyRoot),
});

const t2Hash = BeaconBlockHeader.hashTreeRoot({
    slot: J3905473.data.attestedHeader.beacon.slot,
    proposerIndex: J3905473.data.attestedHeader.beacon.proposerIndex,
    parentRoot: bytes('0x' + J3905473.data.attestedHeader.beacon.parentRoot),
    stateRoot: bytes('0x' + J3905473.data.attestedHeader.beacon.stateRoot),
    bodyRoot: bytes('0x' + J3905473.data.attestedHeader.beacon.bodyRoot),
});
const t3Hash = BeaconBlockHeader.hashTreeRoot({
    slot: J3905474.data.attestedHeader.beacon.slot,
    proposerIndex: J3905474.data.attestedHeader.beacon.proposerIndex,
    parentRoot: bytes('0x' + J3905474.data.attestedHeader.beacon.parentRoot),
    stateRoot: bytes('0x' + J3905474.data.attestedHeader.beacon.stateRoot),
    bodyRoot: bytes('0x' + J3905474.data.attestedHeader.beacon.bodyRoot),
});
const t4Hash = BeaconBlockHeader.hashTreeRoot({
    slot: J3905475.data.attestedHeader.beacon.slot,
    proposerIndex: J3905475.data.attestedHeader.beacon.proposerIndex,
    parentRoot: bytes('0x' + J3905475.data.attestedHeader.beacon.parentRoot),
    stateRoot: bytes('0x' + J3905475.data.attestedHeader.beacon.stateRoot),
    bodyRoot: bytes('0x' + J3905475.data.attestedHeader.beacon.bodyRoot),
});

describe('LightClient', () => {
    let code: Cell;
    let adapterCode: Cell;
    let minterCode: Cell;
    let walletCode: Cell;

    beforeAll(async () => {
        code = await compile('LightClient');
        adapterCode = await compile('Adapter');
        minterCode = await compile('JettonMinter');
        walletCode = await compile('JettonWallet');
    });

    let blockchain: Blockchain;
    let lightClient: SandboxContract<LightClient>;

    beforeAll(async () => {
        // blockchain = await Blockchain.create({ config: getConfig() });
        blockchain = await Blockchain.create();

        lightClient = blockchain.openContract(LightClient.createFromConfig({}, code));

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
    });

    it('should init pubkeys', async () => {
        const user = await blockchain.treasury('user');

        const initResult = await lightClient.sendInitCommittee(user.getSender(), {
            value: toNano('15.05'),
            committee: committeeToCell(initialCommittee),
        });

        const externalOutBodySlice = initResult.externals.map((ex) => ex.body.asSlice());
        console.log(initResult.transactions.map((t) => t.totalFees));

        expect(initResult.transactions).toHaveTransaction({
            from: user.address,
            to: lightClient.address,
            success: true,
        });
    });

    it('should store beacon', async () => {
        const user = await blockchain.treasury('user');

        const beaconContainerCell = SSZRootToCell(firstUpdateBeacon.body_root)
            .toSSZRoot(firstUpdateBeacon.state_root)
            .toSSZRoot(firstUpdateBeacon.parent_root)
            .toSSZUint({ value: +firstUpdateBeacon.proposer_index, size: 8, isInf: false })
            .toSSZUint({ value: +firstUpdateBeacon.slot, size: 8, isInf: true })
            .toSSZContainer();

        const initResult = await lightClient.sendAddOptimisticUpdate(user.getSender(), {
            value: toNano('15.05'),
            beacon: beaconContainerCell,
        });

        const externalOutBodySlice = initResult.externals.map((ex) => ex.body.asSlice());
        console.log(initResult.transactions.map((t) => t.totalFees));

        expect(initResult.transactions).toHaveTransaction({
            from: user.address,
            to: lightClient.address,
            success: true,
        });
    });

    it('should store execution', async () => {
        const user = await blockchain.treasury('user');

        const executionCell = getExecutionContainerCell(firstUpdateExecution.execution);
        let execution_branch_cell!: Cell;
        for (const branch_item of  firstUpdateExecution.execution_branch) {
            const builder = beginCell().storeBuffer(bytes(branch_item));
            if (execution_branch_cell) {
                builder.storeRef(execution_branch_cell);
            }
            execution_branch_cell = builder.endCell();
        }

        const initResult = await lightClient.sendUpdateReceipt(user.getSender(), {
            value: toNano('15.05'),
            execution: executionCell,
            execution_branch: execution_branch_cell,
            beacon_hash: beginCell().storeBuffer(Buffer.from(firstUpdateBeaconSignature)).endCell(),
        });

        // const externalOutBodySlice = initResult.externals.map(ex => ex.body.asSlice());
        // console.log(initResult.transactions.map(t => t.vmLogs));
        // console.log(externalOutBodySlice);
        const externalOutBodySlice = initResult.externals.map((ex) => ex.body.asSlice());
        console.log(initResult.transactions.map((t) => t.totalFees));
        console.log('hash:', Buffer.from(t1Hash).toString('hex'));

        const event = initResult.events.find((e)=>e.type === 'message_sent' && user.address.equals(e.from)  && lightClient.address.equals(e.to)) as EventMessageSent;
        expect(event.from.toString()).toEqual(user.address.toString());
    });

    it('should store next sync committee', async () => {
        const user = await blockchain.treasury('user');

        let committee_branch_cell!: Cell;
        for (let i = 0; i < UpdatesJson[1].data.next_sync_committee_branch.length; i++) {
            const branch_item = UpdatesJson[1].data.next_sync_committee_branch[i];
            if (!committee_branch_cell) {
                committee_branch_cell = beginCell().storeBuffer(bytes(branch_item)).endCell();
            } else {
                committee_branch_cell = beginCell()
                    .storeBuffer(bytes(branch_item))
                    .storeRef(committee_branch_cell)
                    .endCell();
            }
        }

        const results = [];

        const initResult = await lightClient.sendNextCommittee(user.getSender(), {
            value: toNano('11.05'),
            committee: committeeToCell(UpdatesJson[1].data.next_sync_committee),
            // committee_branch: committee_branch_cell,
            beacon_hash: beginCell().storeBuffer(Buffer.from(firstUpdateBeaconSignature)).endCell(),
        });

        for (let i = 0; i < 16; i++) {
            const initResult2 = await lightClient.sendCalcNextCommitteeHash(user.getSender(), {
                value: toNano('11.05'),
                // committee: committeeToCell(UpdatesJson[1].data.next_sync_committee),
                // committee_branch: committee_branch_cell,
                beacon_hash: beginCell().storeBuffer(Buffer.from(firstUpdateBeaconSignature)).endCell(),
            });
            results.push(initResult2);
        }

        const initResult3 = await lightClient.sendVerifyNextCommittee(user.getSender(), {
            value: toNano('11.05'),
            committee: committeeToCell(UpdatesJson[1].data.next_sync_committee, true),
            committee_branch: committee_branch_cell,
            beacon_hash: beginCell().storeBuffer(Buffer.from(firstUpdateBeaconSignature)).endCell(),
        });
        // const externalOutBodySlice = initResult.externals.map(ex => ex.body.asSlice());
        console.log(
            'sendNextCommittee',
            initResult.transactions.map((t) => t.totalFees)
        );
        console.log(
            'sendCalcNextCommitteeHash',
            results.map((initResult) => initResult.transactions.map((t) => t.totalFees))
        );
        console.log(
            'sendVerifyNextCommittee',
            initResult3.transactions.map((t) => t.totalFees)
        );
        // const externalOutBodySlice = results[15].externals.map(ex => ex.body.asSlice());
        // console.log(initResult3.transactions.map(t => t.vmLogs));
        // const externalOutBodySlice = initResult3.externals.map(ex => ex.body.asSlice());
        // console.log(externalOutBodySlice);

        expect(initResult.transactions).toHaveTransaction({
            from: user.address,
            to: lightClient.address,
            success: true,
        });

        for (let i = 0; i < 16; i++) {
            const initResult = results[i];
            expect(initResult.transactions).toHaveTransaction({
                from: user.address,
                to: lightClient.address,
                success: true,
            });
        }

        expect(initResult3.transactions).toHaveTransaction({
            from: user.address,
            to: lightClient.address,
            success: true,
        });
    });

    it('should verify signature and update committee', async () => {
        const user = await blockchain.treasury('user');

        let fixedCommitteeBits = '';

        bytes(UpdatesJson[1].data.sync_aggregate.sync_committee_bits).forEach((el) => {
            const a = getUint8ByteToBitBooleanArray(el);
            fixedCommitteeBits += parseInt(a.map((el) => (el ? 1 : 0)).join(''), 2).toString(16);
        });

        const results = [];
        for (let i = 0; i < 4; i++) {
            const initResult2 = await lightClient.sendAggregatePubkey(user.getSender(), {
                value: toNano('11.05'),
                aggregate: syncAggregateToCell({
                    ...UpdatesJson[1].data.sync_aggregate,
                    sync_committee_bits: '0x' + fixedCommitteeBits,
                }),
                beacon_hash: beginCell().storeBuffer(Buffer.from(firstUpdateBeaconSignature)).endCell(),
            });
            results.push(initResult2);
        }

        const initResult = await lightClient.sendFinalityUpdate(user.getSender(), {
            value: toNano('15.00'),
            aggregate: syncAggregateToCell({
                ...UpdatesJson[1].data.sync_aggregate,
                sync_committee_bits: '0x' + fixedCommitteeBits,
            }),
            beacon_hash: beginCell().storeBuffer(Buffer.from(firstUpdateBeaconSignature)).endCell(),
        });

        // const externalOutBodySlice = initResult.externals.map(ex => ex.body.asSlice());
        // console.log(initResult.transactions.map(t => t.vmLogs));
        console.log(
            'sendAggregatePubkeys',
            results.map((initResult) => initResult.transactions.map((t) => t.totalFees))
        );
        console.log(initResult.transactions.map((t) => t.totalFees));
        // return;
        console.log('get data from contract:');
        // console.log(await lightClient.getBeaconValidationStatus(Buffer.from(firstUpdateBeaconSignature).toString('hex')))
        // console.log(await lightClient.getLastFinalityHash());

        for (let i = 0; i < 4; i++) {
            const initResult = results[i];
            expect(initResult.transactions).toHaveTransaction({
                from: user.address,
                to: lightClient.address,
                success: true,
            });
        }

        // expect(initResult.transactions).toHaveTransaction({
        //     from: user.address,
        //     to: lightClient.address,
        //     success: true,
        // });
    });

    it('should verify and try run receipt', async () => {
        const beaconContainerCell = SSZRootToCell(testUpdate.bodyRoot)
            .toSSZRoot(testUpdate.stateRoot)
            .toSSZRoot(testUpdate.parentRoot)
            .toSSZUint({ value: +testUpdate.proposerIndex, size: 8, isInf: false })
            .toSSZUint({ value: +testUpdate.slot, size: 8, isInf: true })
            .toSSZContainer();

        const executionCell = getExecutionContainerCell2(execution);
        let execution_branch_cell!: Cell;
        for (let i = 0; i < execution_branch.length; i++) {
            const branch_item = execution_branch[i];
            if (!execution_branch_cell) {
                execution_branch_cell = beginCell().storeBuffer(bytes(branch_item)).endCell();
            } else {
                execution_branch_cell = beginCell()
                    .storeBuffer(bytes(branch_item))
                    .storeRef(execution_branch_cell)
                    .endCell();
            }
        }

        // blockchain = await Blockchain.create({ config: getConfig() });
        blockchain = await Blockchain.create();

        lightClient = blockchain.openContract(
            LightClient.createFromConfig(
                {
                    // key: firstUpdateBeaconSignature,
                    // initialBeacon: beginCell()
                    //     .storeUint(0x1111, 16)
                    //     .storeRef(beaconContainerCell)
                    //     .storeRef(executionCell)
                    //     .endCell(),
                },
                code
            )
        );

        const deployer = await blockchain.treasury('deployer');
        const admin = await blockchain.treasury('admin');

        const deployResult = await lightClient.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: lightClient.address,
            deploy: true,
            success: true,
        });

        const adapter = blockchain.openContract(
            Adapter.createFromConfig(
                {
                    // jminter_addr: jettonMinter.address,
                    // topic_mint_id: originalTopicId,
                    topic_mint_id: mint_topic,
                    topic_burn_id: burn_topic,
                    light_client_addr: lightClient.address,
                },
                adapterCode
            )
        );

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

        const jettonMinter = blockchain.openContract(
            JettonMinter.createFromConfig(
                {
                    adminAddress: adapter.address,
                    content: beginCell().storeInt(0x00, 8).storeDict(jETHContent).endCell(),
                    jettonWalletCode: walletCode,
                },
                minterCode
            )
        );

        const minterDeployRes = await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.05'));

        const adapterDeployRes = await adapter.sendDeploy(admin.getSender(), toNano('0.05'));

        await adapter.sendJminterAddr(admin.getSender(), {
            value: toNano('0.05'),
            jminterAddr: jettonMinter.address,
        });

        expect(adapterDeployRes.transactions).toHaveTransaction({
            from: admin.address,
            to: adapter.address,
            deploy: true,
            success: true,
        });

        expect(minterDeployRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            deploy: true,
            success: true,
        });

        const { receipt, receiptProof, blockHeader } = receiptData;
        const r = Receipt.fromJSON(receipt as unknown as IReceiptJSON);
        const block = BlockHeader.fromHex(blockHeader);
        const cell = r.toCell();

        const increaser = await blockchain.treasury('increaser');

        const cells = receiptProof
            .map(bytes)
            .map((pr) => rlp.decode(pr) as any as Buffer[])
            .map((prb) => {
                // const data:node_leaf = "data:node_leaf"c; ;; b95a0273
                // const data:node_branch = "data:node_branch"c; ;; 40a54ae8
                // const data:empty_branch = "data:empty_branch"c; ;; e28eb9cc
                // TODO: split big data
                let cells: Builder[] = [];
                if (prb.length === 17) {
                    cells = [beginCell().storeUint(0x40a54ae8, 32)];
                    cells = [...cells, ...prb.map((proofPart) => beginCell().storeBuffer(proofPart, proofPart.length))];
                }
                if (prb.length === 2) {
                    let proof_receipt_part = prb[1];
                    const proof_receipt_part_builders: Builder[] = [];
                    while (proof_receipt_part.length) {
                        const part = proof_receipt_part.subarray(0, 32);
                        proof_receipt_part_builders.push(beginCell().storeBuffer(part, Math.min(part.length, 32)));
                        proof_receipt_part = proof_receipt_part.subarray(32);
                    }
                    cells = [beginCell().storeUint(0xb95a0273, 32)];
                    cells = [...cells, beginCell().storeBuffer(prb[0], prb[0].length), ...proof_receipt_part_builders];
                }
                if (prb.length === 0) {
                    cells = [beginCell().storeUint(0xe28eb9cc, 32)];
                }
                // cells = prb.map((proofPart) =>
                //     beginCell().storeBuffer(proofPart.subarray(0, 32), Math.min(proofPart.length, 32))
                // );

                for (let i = cells.length - 1; i > 0; i--) {
                    if (i < cells.length - 1) {
                        cells[i] = cells[i].storeRef(cells[i + 1]);
                    }
                    cells[i].endCell();
                }
                return cells[0].storeRef(cells[1]);
            });

        for (let i = cells.length - 1; i > 0; i--) {
            if (i < cells.length - 1) {
                cells[i] = cells[i].storeRef(cells[i + 1]);
            }
            cells[i].endCell();
        }
        const proofBoc = cells[0].storeRef(cells[1]).endCell();
        // console.log(proofBoc.refs.length);

        const initResult2 = await lightClient.sendInitOptimisticUpdate(increaser.getSender(), {
            value: toNano('15.05'),
            beacon: beaconContainerCell,
        });

        const initResult = await lightClient.sendUpdateReceipt(increaser.getSender(), {
            value: toNano('15.05'),
            execution: executionCell,
            execution_branch: execution_branch_cell,
            beacon_hash: beginCell()
                .storeBuffer(Buffer.from(testUpdate.selfHash.slice(2), 'hex'))
                .endCell(),
        });

        const callback = await lightClient.sendVerifyProof(increaser.getSender(), {
            value: toNano('5.5'),
            receipt: cell,
            adapterAddr: adapter.address,
            // rootHash: beginCell().storeBuffer(block.receiptTrie).endCell(),
            path: beginCell()
                .storeBuffer(rlp.encode(toNumber(receipt.transactionIndex)))
                .endCell(),
            receiptProof: proofBoc,
            beacon_hash: beginCell()
                .storeBuffer(Buffer.from(testUpdate.selfHash.slice(2), 'hex'))
                .endCell(),
        });

        console.log(cell);

        // console.log(callback.transactions.map((t) => t.totalFees));
        // console.log(callback.transactions.filter(t => t.outMessages).map((t) => t.blockchainLogs));
        const externalOutBodySlice = callback.externals.map((ex) => ex.body.asSlice());
        console.log(externalOutBodySlice);

        expect(initResult2.transactions).toHaveTransaction({
            from: increaser.address,
            to: lightClient.address,
            success: true,
        });

        expect(initResult.transactions).toHaveTransaction({
            from: increaser.address,
            to: lightClient.address,
            success: true,
        });

        expect(callback.transactions).toHaveTransaction({
            from: increaser.address,
            to: lightClient.address,
            success: true,
        });

        expect(callback.transactions).toHaveTransaction({
            from: lightClient.address,
            to: adapter.address,
            success: true,
        });

        expect(callback.transactions).toHaveTransaction({
            from: adapter.address,
            to: jettonMinter.address,
            success: true,
        });
    });

    it('should verify optimistic update', async () => {
        blockchain = await Blockchain.create();

        lightClient = blockchain.openContract(LightClient.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');
        const admin = await blockchain.treasury('admin');
        const user = await blockchain.treasury('user');

        const deployResult = await lightClient.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: lightClient.address,
            deploy: true,
            success: true,
        });

        const initResult = await lightClient.sendInitCommittee(user.getSender(), {
            value: toNano('15.05'),
            committee: committeeToCell(t1initialCommittee),
        });

        const beaconContainerCell = SSZRootToCell('0x' + t1firstUpdateBeacon.bodyRoot)
            .toSSZRoot('0x' + t1firstUpdateBeacon.stateRoot)
            .toSSZRoot('0x' + t1firstUpdateBeacon.parentRoot)
            .toSSZUint({ value: +t1firstUpdateBeacon.proposerIndex, size: 8, isInf: false })
            .toSSZUint({ value: +t1firstUpdateBeacon.slot, size: 8, isInf: true })
            .toSSZContainer();

        const initResult2 = await lightClient.sendAddOptimisticUpdate(user.getSender(), {
            value: toNano('15.05'),
            beacon: beaconContainerCell,
        });

        expect(initResult2.transactions).toHaveTransaction({
            from: user.address,
            to: lightClient.address,
            success: true,
        });
    });

    it('should store beacon 2', async () => {
        const user = await blockchain.treasury('user');

        const secondUpdateBeacon = {
            slot: 4332576,
            proposerIndex: 439,
            parentRoot: '0x00c4f2062883b2bab0c8d9ab4e3908bdabda50016066c31de1afae6f0dbf72fe',
            stateRoot: '0xf911140bdf71cd55f9a23a1269730b60349c8c51057b8bf79f19cd1f46466fee',
            bodyRoot: '0x105109efd5676f1e91d4838c723b9e61204d95d60bb7a5016fa50bfc8beb0b64',
            selfHash: '0xf15f8da67b5fe0660319c05ebc9cc85cfc92de41f6bebf778bf661817f6da5fb',
        };

        const beaconContainerCell = SSZRootToCell(secondUpdateBeacon.bodyRoot)
            .toSSZRoot(secondUpdateBeacon.parentRoot)
            .toSSZUint({ value: +secondUpdateBeacon.proposerIndex, size: 8, isInf: false })
            .toSSZUint({ value: +secondUpdateBeacon.slot, size: 8, isInf: true })
            .toSSZContainer();

        // console.log(beaconContainerCell);

        const initResult = await lightClient.sendInitOptimisticUpdate(user.getSender(), {
            value: toNano('0.07'),
            beacon: beaconContainerCell,
        });

        const externalOutBodySlice = initResult.externals.map((ex) => ex.body.asSlice());
        console.log(initResult.transactions.map((t) => t.totalFees));

        expect(initResult.transactions).toHaveTransaction({
            from: user.address,
            to: lightClient.address,
            success: true,
        });
    });

    it('should check optimistics', async () => {
        const user = await blockchain.treasury('user4');

        const firstUpdateBeacon = {
            id: 366,
            slot: 4332192,
            proposerIndex: 1028,
            parentRoot: '0x921eb3e1d8bdb0bbb4b8b95bb03de6846e6f88314018303d09786490c9e5dfc4',
            stateRoot: '0xa4b069ddd65e8119df1713a4137f2c69cf6ec9c423a6f6cb597c5c118efc1d94',
            bodyRoot: '0x184b55cba5f1fbffe11151ae8c2517f763d5f831c616d79145a595f49c88519b',
            selfHash: '0x850331c820759287b3ddcf1d83ddeef21bfa7f8cc5ed367f0cdc6315e5241ae8',
            isFinality: true,
            ParentBeaconId: 365,
        };

        const secondUpdateBeacon = {
            id: 365,
            slot: 4332191,
            proposerIndex: 46,
            parentRoot: '0xdda2b23b9d12195ed50688a7adc36e361225c7ce73468d0edbf398ef6115f6d4',
            stateRoot: '0x2a2e3326e14d23bc338189de68f6792e2e5e55b35092456f80ddeececa58b7fc',
            bodyRoot: '0x29eba33559030317dff3c76e09852aaae1cbe262cdf577968a04a101dd0820db',
            selfHash: '0x921eb3e1d8bdb0bbb4b8b95bb03de6846e6f88314018303d09786490c9e5dfc4',
            isFinality: false,
            ParentBeaconId: 364,
        };

        const beaconContainerCell = SSZRootToCell(secondUpdateBeacon.bodyRoot)
            .toSSZRoot(secondUpdateBeacon.stateRoot)
            .toSSZRoot(secondUpdateBeacon.parentRoot)
            .toSSZUint({ value: +secondUpdateBeacon.proposerIndex, size: 8, isInf: false })
            .toSSZUint({ value: +secondUpdateBeacon.slot, size: 8, isInf: true })
            .toSSZContainer();

        const beaconFirstContainerCell = SSZRootToCell(firstUpdateBeacon.bodyRoot)
            .toSSZRoot(firstUpdateBeacon.stateRoot)
            .toSSZRoot(firstUpdateBeacon.parentRoot)
            .toSSZUint({ value: +firstUpdateBeacon.proposerIndex, size: 8, isInf: false })
            .toSSZUint({ value: +firstUpdateBeacon.slot, size: 8, isInf: true })
            .toSSZContainer();

        // console.log(beaconContainerCell);

        const initResult = await lightClient.sendInitOptimisticUpdate(user.getSender(), {
            value: toNano('0.07'),
            beacon: beaconContainerCell,
        });

        const result = await lightClient.sendVerifyOptimisticUpdate(user.getSender(), {
            value: toNano('0.07'),
            beacon: beaconFirstContainerCell,
            nextHash: secondUpdateBeacon.selfHash,
        });

        expect(initResult.transactions).toHaveTransaction({
            from: user.address,
            to: lightClient.address,
            success: true,
        });

        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: lightClient.address,
            success: true,
        });
    });
});

const json = {
    receipt: {
        transactionHash: '0x3df5876a57f0dde7527411b7ae6c3d4209c4952b28133d8405e8be2cee5e8175',
        transactionIndex: '0x44',
        blockHash: '0xd000be63d2a4c80468f83c03981f7eeabff2336327b2e9058770cdf904a99ff2',
        blockNumber: '0x3887a6',
        cumulativeGasUsed: '0x10147a5',
        gasUsed: '0x80b4',
        effectiveGasPrice: '0xa3',
        from: '0xc7296d50ddb12de4d2cd8c889a73b98538624f61',
        to: '0xd0df3e320aade6f44fc7adcb2308f90331dbd30b',
        contractAddress: null,
        logs: [
            {
                removed: false,
                logIndex: '0xbfc',
                transactionIndex: '0x44',
                transactionHash: '0x3df5876a57f0dde7527411b7ae6c3d4209c4952b28133d8405e8be2cee5e8175',
                blockHash: '0xd000be63d2a4c80468f83c03981f7eeabff2336327b2e9058770cdf904a99ff2',
                blockNumber: '0x3887a6',
                address: '0x8a59de294816a1d218fd97a4aa6dfd6a2fa65b93',
                data: '0x00000000000000000000000000000000000000000000000000000000000003e8',
                topics: [
                    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                    '0x000000000000000000000000c7296d50ddb12de4d2cd8c889a73b98538624f61',
                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                ],
            },
            {
                removed: false,
                logIndex: '0xbfd',
                transactionIndex: '0x44',
                transactionHash: '0x3df5876a57f0dde7527411b7ae6c3d4209c4952b28133d8405e8be2cee5e8175',
                blockHash: '0xd000be63d2a4c80468f83c03981f7eeabff2336327b2e9058770cdf904a99ff2',
                blockNumber: '0x3887a6',
                address: '0xd0df3e320aade6f44fc7adcb2308f90331dbd30b',
                data: '0x0112aeb9f1d2e0d4ac4f8576718f4bdaa5930d61ebe8b6a788347efcea5a70c100000000000000000000000000000000000000000000000000000000000003e8',
                topics: ['0x09a9af46918f2e52460329a694cdd4cd6d55354ea9b336b88b4dea59914a9a83'],
            },
        ],
        logsBloom:
            '0x00000000000000000800000000000000000000000000800000000000000008000000000000000000000000000008000000000000000000000000000000000000000000000000000000000008000000000002000000000000000000000000000000000000020000000000000000000800000000000000000000000010000000000000000000000000000000000000000000000000000000000000000800000000008000200000100008000000000000000000000000000000000000000200000000800002000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000',
        status: '0x1',
        type: '0x2',
    },
    txProof: [
        '0xf8d1a04e6c5cc1d07d310d9680ccafbdce6ba2a6a9befb438944e7e16d59e0e0a72aa4a08601ceaa2651e50c4617b3ed9a979a22e21f0f3fcea50cd063ac8d5a3850c115a0357c44d86d83c51275e555130ca4ebf2fbe14cf29a9d15f4331ece04aa911f57a0590049768a9771145a4b6fb9e36fc08a8c45be11eea0d7622c47e489b50b1cb1a045b3ab97e2157b9f5d9afb1584de7069ef539c4e2ae736d5abe0789584b19aa3808080a0df5539716b59d1793e728ce1ad7b5c9e640c38da812d8e1df9348afcdbc897e08080808080808080',
        '0xf8d1a0abf42c389f286b178929e9c3a9610c6be4f8f5fee8ceafeb52635b9dcef025b0a0948a1ee02e6e4c0e58d3ed494ca368feb2ff45ad07c45dcdd6b09a2f1c4203c1a0d101acc689aa3ca780f5c79a3026bcc030646f9dd73d25f681a2ee2b88ac9388a0795e5b55cf24abe3b11e0a6fb25eaf06418ebd35da21910f5c3a9b7869663514a04df453f3a8c4f560d48f6f036fab2287e810818f051f7838ccf64980b550ae96a0b4135e0e328f0900f9923d704ced05b1f2788311b64966ffa98395c16a3752368080808080808080808080',
        '0xf8d320b8d002f8cd83aa36a782019a6e81a382a0e094d0df3e320aade6f44fc7adcb2308f90331dbd30b80b86472618aac000000000000000000000000c7296d50ddb12de4d2cd8c889a73b98538624f6100000000000000000000000000000000000000000000000000000000000003e80112aeb9f1d2e0d4ac4f8576718f4bdaa5930d61ebe8b6a788347efcea5a70c1c001a0eac68ebec5bb7b0889df7357e1548fdab5dceb4972210c951fa4dc1d527d2d61a02fa2378652bb2da91ee3111352368d6d725b65f28f8715fb897d0cfb148b82cb',
    ],
    receiptProof: [
        '0xf8d1a07b16c1c291fe06c315b1d32709790635534fa0dea082a5d680a13baa77f40982a08336335480b7944a84e8c5844cf84ebbd81061aa61edfaa66db5354ddbe0dc17a0514c903e6e9639e2311e7ed7e1f9010a1bc49448511e9f76c25cec5551e72722a012ea38f5484909af90d40a4e25a9bae64682e6e0368a54a628893c99268cc99aa0eed7a377baac3ddf92599e4959c4c329f0f2030da76e8ff2da9cebfffb1b196d808080a089a6549d48578c99dec2d535ab10314bb6ac508e07e4730702c62eb4096685858080808080808080',
        '0xf8d1a0dfa6a726e2c7313c0423b7f1cbd386c76f9c6696d37815e06409abea50333100a04c8f9d273e3df506693d39a0c166677051a42bfe99313e172ffdba4a644d8ec0a0bbdfa247b521eb01783b295a99ffb281918179c0f05a548df2f80f976682d6e6a043b10e7ef999b7cc5c83b81cd648e781f86fb9b5180d6e9b35af04d30361b9a2a06ca404a17566a3aa682843948ed3d3c7227cef5c4baa8306593139d16d743281a0a95136db17b234323c96cf46460e00f935c858a08581531850e6bd63b5bc9fdd8080808080808080808080',
        '0xf9022c20b9022802f902240184010147a5b9010000000000000000000800000000000000000000000000800000000000000008000000000000000000000000000008000000000000000000000000000000000000000000000000000000000008000000000002000000000000000000000000000000000000020000000000000000000800000000000000000000000010000000000000000000000000000000000000000000000000000000000000000800000000008000200000100008000000000000000000000000000000000000000200000000800002000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000f90118f89b948a59de294816a1d218fd97a4aa6dfd6a2fa65b93f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000c7296d50ddb12de4d2cd8c889a73b98538624f61a00000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000003e8f87994d0df3e320aade6f44fc7adcb2308f90331dbd30be1a009a9af46918f2e52460329a694cdd4cd6d55354ea9b336b88b4dea59914a9a83b8400112aeb9f1d2e0d4ac4f8576718f4bdaa5930d61ebe8b6a788347efcea5a70c100000000000000000000000000000000000000000000000000000000000003e8',
    ],
    blockHeader:
        '0xf90238a034008f8f2cec507d296d0d61ff72bad962ffcdee491e5365204d1bf7e5102981a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347940000000000000000000000000000000000000000a000ace191c324185bef452ad7f15b2076890d5a03a079e8d467b6dc4d3466d4e1a03cc845844e6845dcf2d2624e23648655b5b30fad3b6d4e8fb0111cfa542a77f3a04b2e05690d998be6abae4365125e9703a1b4c71b6e05df4deccbf1cddf284405b90100ffffffdffffffffdfffffffffffffffffffffffffeffffffffffffffffffffffeffffffffffffffffffffffffffdffffffffffffffffffffffffffffffffffffffffffffffffffdffffffdfffffffefffffffffffffffffffffffffffffffffffffffffbfffffffffffffffffffffffffffffffffffffffffffffffaffffffddffffffefffffffbfefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffbffffffffffffffffffffffeffffffffffffffffffffffffffffffffffff7ffffffffffffffffbffffffffffbfffffffff7ffffeffbfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff80833887a68401c9c380840105129684648c754899d883010b04846765746888676f312e32302e32856c696e7578a0e6eb93040a9b34caaec790da7d17b0b84770aeba37fb46e3bc107d62984c4df48800000000000000008181a057c430fd9cceda34a5ce1f0e39fcbc9805b548a18ba3e789750b4a1c63ccd97f',
};
