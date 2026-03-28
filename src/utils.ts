/** kordoc 공용 유틸리티 */

/** 빌드 타임에 tsup define으로 주입되는 버전 */
declare const __KORDOC_VERSION__: string
export const VERSION: string = typeof __KORDOC_VERSION__ !== "undefined" ? __KORDOC_VERSION__ : "0.0.0-dev"

/**
 * Node.js Buffer → ArrayBuffer 안전 변환
 * Buffer.buffer는 pool에서 할당된 공유 ArrayBuffer이므로 반드시 slice 필요
 */
export function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}
