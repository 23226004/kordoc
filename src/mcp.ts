/** kordoc MCP 서버 — Claude/Cursor에서 문서 파싱 도구로 사용 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { readFileSync, realpathSync } from "fs"
import { resolve, isAbsolute } from "path"
import { parse, detectFormat } from "./index.js"
import { VERSION, toArrayBuffer } from "./utils.js"

/** 경로 정규화 및 기본 검증 */
function safePath(filePath: string): string {
  const resolved = resolve(filePath)
  // 심볼릭 링크 해석하여 실제 경로 확인
  const real = realpathSync(resolved)
  if (!isAbsolute(real)) throw new Error("절대 경로만 허용됩니다")
  return real
}

const server = new McpServer({
  name: "kordoc",
  version: VERSION,
})

// ─── 도구: parse_document ────────────────────────────

server.tool(
  "parse_document",
  "한국 문서 파일(HWP, HWPX, PDF)을 마크다운으로 변환합니다. 파일 경로를 입력하면 포맷을 자동 감지하여 텍스트를 추출합니다.",
  {
    file_path: z.string().describe("파싱할 문서 파일의 절대 경로 (HWP, HWPX, PDF)"),
  },
  async ({ file_path }) => {
    try {
      const resolved = safePath(file_path)
      const buffer = readFileSync(resolved)
      const arrayBuffer = toArrayBuffer(buffer)
      const format = detectFormat(arrayBuffer)

      if (format === "unknown") {
        return {
          content: [{ type: "text", text: `지원하지 않는 파일 형식입니다: ${file_path}` }],
          isError: true,
        }
      }

      const result = await parse(arrayBuffer)

      if (!result.success) {
        return {
          content: [{ type: "text", text: `파싱 실패 (${result.fileType}): ${result.error}` }],
          isError: true,
        }
      }

      const meta = [
        `포맷: ${result.fileType.toUpperCase()}`,
        result.pageCount ? `페이지: ${result.pageCount}` : null,
        result.isImageBased ? "이미지 기반 PDF (텍스트 추출 불가)" : null,
      ].filter(Boolean).join(" | ")

      return {
        content: [{ type: "text", text: `[${meta}]\n\n${result.markdown}` }],
      }
    } catch (err) {
      return {
        content: [{ type: "text", text: `오류: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      }
    }
  }
)

// ─── 도구: detect_format ─────────────────────────────

server.tool(
  "detect_format",
  "파일의 포맷을 매직 바이트로 감지합니다 (hwpx, hwp, pdf, unknown).",
  {
    file_path: z.string().describe("감지할 파일의 절대 경로"),
  },
  async ({ file_path }) => {
    try {
      const resolved = safePath(file_path)
      const buffer = readFileSync(resolved, { flag: "r" })
      const header = toArrayBuffer(buffer.subarray(0, 16))
      const format = detectFormat(header)
      return {
        content: [{ type: "text", text: `${file_path}: ${format}` }],
      }
    } catch (err) {
      return {
        content: [{ type: "text", text: `오류: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      }
    }
  }
)

// ─── 서버 시작 ───────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
