import {getUint8ByteToBitBooleanArray} from '@chainsafe/ssz';
import {compile} from '@ton-community/blueprint';
import {Blockchain, SandboxContract} from '@ton-community/sandbox';
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
import {BeaconBlockHeader} from './ssz/ssz-beacon-type';
import {SSZRootToCell, SSZUintToCell, getSSZContainer} from './ssz/ssz-to-cell';

function committeeToCell(data: (typeof UpdatesJson)[0]['data']['next_sync_committee'], skip = false) {
    const CommitteeContent = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Buffer(48));
    data.pubkeys.forEach((item, i) => {
        CommitteeContent.set(i, bytes(item));
    });

    if (skip) {
        return beginCell()
        .storeBuffer(bytes(data.aggregate_pubkey))
        // .storeRef(beginCell().storeDict(CommitteeContent).endCell())
        .endCell();
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

const domain = '0x0700000047eb72b3be36f08feffcaba760f0a2ed78c1a85f0654941a0d19d0fa';
const originalTopicId = '0x09a9af46918f2e52460329a694cdd4cd6d55354ea9b336b88b4dea59914a9a83';

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

        const beaconContainerCell = getSSZContainer(
            SSZUintToCell(
                { value: +firstUpdateBeacon.slot, size: 8, isInf: true },
                SSZUintToCell(
                    { value: +firstUpdateBeacon.proposer_index, size: 8, isInf: false },
                    SSZRootToCell(
                        firstUpdateBeacon.parent_root,
                        SSZRootToCell(firstUpdateBeacon.state_root, SSZRootToCell(firstUpdateBeacon.body_root))
                    )
                )
            )
        );

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
        for (let i = 0; i < firstUpdateExecution.execution_branch.length; i++) {
            const branch_item = firstUpdateExecution.execution_branch[i];
            if (!execution_branch_cell) {
                execution_branch_cell = beginCell().storeBuffer(bytes(branch_item)).endCell();
            } else {
                execution_branch_cell = beginCell()
                    .storeBuffer(bytes(branch_item))
                    .storeRef(execution_branch_cell)
                    .endCell();
            }
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

        expect(initResult.transactions).toHaveTransaction({
            from: user.address,
            to: lightClient.address,
            success: true,
        });
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

        expect(initResult.transactions).toHaveTransaction({
            from: user.address,
            to: lightClient.address,
            success: true,
        });
    });

    it('should verify and try run receipt', async () => {
        const beaconContainerCell = getSSZContainer(
            SSZUintToCell(
                { value: +firstUpdateBeacon.slot, size: 8, isInf: true },
                SSZUintToCell(
                    { value: +firstUpdateBeacon.proposer_index, size: 8, isInf: false },
                    SSZRootToCell(
                        firstUpdateBeacon.parent_root,
                        SSZRootToCell(firstUpdateBeacon.state_root, SSZRootToCell(firstUpdateBeacon.body_root))
                    )
                )
            )
        );

        const executionCell = getExecutionContainerCell(firstUpdateExecution.execution);
        let execution_branch_cell!: Cell;
        for (let i = 0; i < firstUpdateExecution.execution_branch.length; i++) {
            const branch_item = firstUpdateExecution.execution_branch[i];
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
                    key: firstUpdateBeaconSignature,
                    initialBeacon: beginCell()
                        .storeUint(0x1111, 16)
                        .storeRef(beaconContainerCell)
                        .storeRef(executionCell)
                        .endCell(),
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
                    topic_mint_id: originalTopicId,
                    light_client_addr: lightClient.address,
                },
                code
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

        const { receipt, receiptProof, blockHeader } = json;
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

        const callback = await lightClient.sendVerifyProof(increaser.getSender(), {
            value: toNano('5.5'),
            receipt: cell,
            adapterAddr: adapter.address,
            // rootHash: beginCell().storeBuffer(block.receiptTrie).endCell(),
            path: beginCell()
                .storeBuffer(rlp.encode(toNumber(receipt.transactionIndex)))
                .endCell(),
            receiptProof: proofBoc,
            beacon_hash: beginCell().storeBuffer(Buffer.from(firstUpdateBeaconSignature)).endCell(),
        });

        console.log(callback.transactions.map((t) => t.totalFees));

        expect(callback.transactions).toHaveTransaction({
            from: increaser.address,
            to: lightClient.address,
            success: false,
        });
    });

    it('should verify optimistic updata', async () => {
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

        const beaconContainerCell = getSSZContainer(
            SSZUintToCell(
                { value: +t1firstUpdateBeacon.slot, size: 8, isInf: true },
                SSZUintToCell(
                    { value: +t1firstUpdateBeacon.proposerIndex, size: 8, isInf: false },
                    SSZRootToCell(
                        '0x' + t1firstUpdateBeacon.parentRoot,
                        SSZRootToCell(
                            '0x' + t1firstUpdateBeacon.stateRoot,
                            SSZRootToCell('0x' + t1firstUpdateBeacon.bodyRoot)
                        )
                    )
                )
            )
        );

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
