import {BN, keccak, rlp} from 'ethereumjs-util';
import {Cell, beginCell} from 'ton-core';


const fixLength = (hex: string) => hex.length % 2 ? '0' + hex : hex

/**
 * converts any value as Buffer
 *  if len === 0 it will return an empty Buffer if the value is 0 or '0x00', since this is the way rlpencode works wit 0-values.
 */
export function toBuffer(val: unknown, len = -1) {
  // @ts-ignore
  if (val && val._isBigNumber) val = val.toHexString()
  if (typeof val == 'string')
    val = val.startsWith('0x')
      ? Buffer.from((val.length % 2 ? '0' : '') + val.substr(2), 'hex')
      : val.length && (parseInt(val) || val == '0')
        ? new BN(val).toArrayLike(Buffer)
        : Buffer.from(val, 'utf8')
  else if (typeof val == 'number')
    val = val === 0 && len === 0 ? Buffer.allocUnsafe(0) : Buffer.from(fixLength(val.toString(16)), 'hex')
  else if (BN.isBN(val))
    val = val.toArrayLike(Buffer)

  if (!val) val = Buffer.allocUnsafe(0)

  // remove leading zeros
  // @ts-ignore
  while (len == 0 && val[0] === 0) val = val.slice(1)

  // since rlp encodes an empty array for a 0 -value we create one if the required len===0
  // @ts-ignore
  if (len == 0 && val.length == 1 && val[0] === 0)
    return Buffer.allocUnsafe(0)



  // if we have a defined length, we should padLeft 00 or cut the left content to ensure length
  if (len > 0 && Buffer.isBuffer(val) && val.length !== len)
    return val.length < len
      ? Buffer.concat([Buffer.alloc(len - val.length), val])
      : val.slice(val.length - len)

  return val as Buffer

}

/** converts it to a Buffer with 256 bytes length */
// @ts-ignore
export const bytes256 = val => toBuffer(val, 256)
/** converts it to a Buffer with 32 bytes length */
// @ts-ignore
export const bytes32 = val => toBuffer(val, 32)
/** converts it to a Buffer with 8 bytes length */
// @ts-ignore
export const bytes8 = val => toBuffer(val, 8)
/** converts it to a Buffer  */
// @ts-ignore
export const bytes = val => toBuffer(val)
/** converts it to a Buffer with 20 bytes length */
// @ts-ignore
export const address = val => toBuffer(val, 20)
/** converts it to a Buffer with a variable length. 0 = length 0*/
// @ts-ignore
export const uint = val => toBuffer(val, 0)


export interface ILog {
  removed: boolean // true when the log was removed, due to a chain reorganization. false if its a valid log.
  logIndex: string //  integer of the log index position in the block. null when its pending log.
  transactionLogIndex: string //  integer of the log index position in the transaction. null when its pending log.
  transactionIndex: string // of the transactions index position log was created from. null when its pending log.
  transactionHash: string // 32 Bytes - hash of the transactions this log was created from. null when its pending log.
  blockHash: string // 32 Bytes - hash of the block where this log was in. null when its pending. null when its pending log.
  blockNumber: string // - the block number where this log was in. null when its pending. null when its pending log.
  address: string //, 20 Bytes - address from which this log originated.
  data: string // contains one or more 32 Bytes non-indexed arguments of the log.
  topics: string[] //Array of DATA - Array of 0 to 4 32 Bytes DATA of indexed log arguments. (In solidity: The first topic is the hash of the signature of the event (e.g. Deposit(address,bytes32,uint256)), except you declared the event with the anonymous specifier.)
}

export interface IReceiptJSON {
  type?: string
  transactionHash?: string
  transactionIndex?: number
  blockNumber?: string | number
  blockHash?: string
  status?: string | boolean
  root?: string
  cumulativeGasUsed?: string | number
  gasUsed?: string | number
  logsBloom?: string
  logs: ILog[]
}

export class Receipt {
  // private jsonData: IReceipt;

  public static fromJSON(jsonData: IReceiptJSON) {
    return new Receipt(jsonData);
  }

  private constructor(
    private jsonData: IReceiptJSON,
  ) {
    //
  }

  private serialize() {
    // type TReceiptBinary = [Buffer, Buffer, Buffer, [Buffer, Buffer[], Buffer][]];

    /*
      EIP-658: Embedding transaction status code in receipts
      https://eips.ethereum.org/EIPS/eip-658

      For blocks where block.number >= BYZANTIUM_FORK_BLKNUM,
      the intermediate state root is replaced by a status code,
      0 indicating failure (due to any operation that can cause
        the transaction or top-level call to revert) and
      1 indicating success.
    */
    const receiptBinary /* : TReceiptBinary */ = [
      uint(this.jsonData.status || this.jsonData.root),
      uint(this.jsonData.cumulativeGasUsed),
      bytes256(this.jsonData.logsBloom),
      this.jsonData.logs.map(l => [
        address(l.address),
        l.topics.map(bytes32),
        bytes(l.data)
      ])
    ].slice(this.jsonData.status === null && this.jsonData.root === null ? 1 : 0); // as Receipt;

    const type = parseInt(this.jsonData.type || "0");
    const data = rlp.encode(receiptBinary) as Buffer;
    return type ? Buffer.concat([Buffer.from([type]), data]) : data;
  }

  public hash() {
    const bufData = this.serialize();
    const bufHash = keccak(bufData);
    return bufHash;
  }

  public hashHex() {
    return this.hash().toString('hex');
  }

  public toCell(): Cell {
    const DATA_SLICE_LENGTH = 3 * 256 / 8;

    const buildBufs = (buf: Buffer): Cell => {
      const b = buf.subarray(0, DATA_SLICE_LENGTH);
      const c = beginCell().storeBuffer(b);

      if (buf.length > b.length) {
        c.storeRef(buildBufs(buf.subarray(b.length + 1)));
      }

      return c.endCell();
    };

    const buildTopics = (tpcs: Buffer[]): Cell => {
      const bldTopic = beginCell();
      const tpc = tpcs.shift();
      if (tpc) {
        bldTopic.storeBuffer(tpc);
      }
      if (tpcs.length) {
        bldTopic.storeRef(buildTopics(tpcs));
      }
      return bldTopic.endCell();
    };

    const buildLogs = (lgs: ILog[]): Cell | null => {
      const lg = lgs.shift();
      if (!lg) {
        return null;
      }

      const bldLg = beginCell()
        .storeBuffer(address(lg.address))
        .storeRef(buildTopics(lg.topics.map(bytes32)))
        .storeRef(buildBufs(bytes(lg.data)));

      if (lgs.length) {
        const c = buildLogs(lgs);
        if (c) {
          bldLg.storeRef(c);
        }
      }
      return bldLg.endCell();
    };

    const cellLogs = buildLogs(this.jsonData.logs);

    const res = beginCell()
      .storeBuffer(uint(this.jsonData.status || this.jsonData.root))
      .storeBuffer(uint(this.jsonData.cumulativeGasUsed))
      .storeRef(buildBufs(bytes256(this.jsonData.logsBloom)));
    if (cellLogs) {
      res.storeRef(cellLogs);
    }
    return res.endCell();
  }
}
