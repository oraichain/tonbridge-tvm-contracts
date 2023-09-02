import {splitIntoRootChunks} from '@chainsafe/ssz/lib/util/merkleize';
import {Cell, beginCell} from 'ton-core';
import {Opcodes} from '../../wrappers/SSZ';
import {BLSSignature, Root} from './ssz-beacon-type';

export function getSSZContainer(body: Cell, tail?: Cell) {
  const builder = beginCell()
  .storeUint(Opcodes.type__container, 32)
  .storeRef(body);

  if (tail) {
    builder.storeRef(tail);
  }

  return builder.endCell();
}


export function SSZUintToCell({value, size, isInf = false}: {value: number; size: number; isInf?: boolean}, tail?: Cell) {
  let builder = beginCell()
      .storeUint(Opcodes.type__uint, 32)
      .storeBit(isInf)
      .storeUint(size, 16)
      .storeUint(value, size * 8);

  if (tail) {
      builder = builder.storeRef(tail);
  }

  return builder.endCell();
}

export function SSZBitVectorToCell(value: string, bitLimit: number, tail?: Cell) {
  const bitString = value.startsWith('0x') ? value.replace('0x', '') : value;
    const uint8Arr = Uint8Array.from(Buffer.from(bitString, 'hex'));

    const chunks = splitIntoRootChunks(uint8Arr)
        .reverse()
        .map((chunk: any) => beginCell().storeBuffer(Buffer.from(chunk)))
        .reduce((acc, memo, index) => {
            if (index === 0) {
                return memo.endCell();
            }

            return memo.storeRef(acc).endCell();
        }, undefined as any as Cell);

  let builder = beginCell()
  .storeUint(Opcodes.type__bitVector, 32)
  .storeUint(bitLimit, 128)
  // .storeUint(stringToBitArray(value).bitLen, 256)
  .storeRef(chunks)


  if(tail) {
    builder = builder.storeRef(tail);
  }

  return builder.endCell();
}

export function BLSSignatureToCell(value: string, tail?: Cell) {
  return SSZByteVectorTypeToCell(value, 96, BLSSignature.maxChunkCount, tail);
}

export function SSZRootToCell(value: string, tail?: Cell) {
  return SSZByteVectorTypeToCell(value, 32, Root.maxChunkCount, tail);
}

export function SSZByteVectorTypeToCell(value: string, size: number, maxChunks: number, tail?: Cell) {
  const signatureString = value.startsWith('0x') ? value.replace('0x', '') : value;
  const uint8Arr = Uint8Array.from(Buffer.from(signatureString, 'hex'));

  const chunks = splitIntoRootChunks(uint8Arr)
      .reverse()
      .map((chunk: any) => beginCell().storeBuffer(Buffer.from(chunk)))
      .reduce((acc, memo, index) => {
          if (index === 0) {
              return memo.endCell();
          }

          return memo.storeRef(acc).endCell();
      }, undefined as any as Cell);

      console.log('value', value);
      console.log('uint8arr', uint8Arr);
      console.log('chunks:',chunks);

  let builder = beginCell()
      .storeUint(Opcodes.type__byteVector, 32)
      .storeUint(maxChunks, 32)
      .storeUint(size, 64)
      .storeRef(chunks);

  if (tail) {
      builder = builder.storeRef(tail);
  }

  return builder.endCell();
}

export function SSZVectorToCell(body: Cell, chunkLength: number, tail?: Cell) {
  let builder = beginCell()
  .storeUint(Opcodes.type__vector, 32)
  .storeUint(chunkLength, 64)
  .storeBit(false)
  .storeRef(
      body
  )

  if (tail) {
    builder = builder.storeRef(tail);
}

return builder.endCell();
}
