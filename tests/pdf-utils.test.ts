import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { cleanPdfText } from "../src/pdf/parser.js"

describe("cleanPdfText", () => {
  it("페이지 번호 패턴 제거: - 1 -", () => {
    const input = "본문 텍스트\n- 1 -\n다음 텍스트"
    const result = cleanPdfText(input)
    assert.ok(!result.includes("- 1 -"))
    assert.ok(result.includes("본문 텍스트"))
    assert.ok(result.includes("다음 텍스트"))
  })

  it("페이지 번호 패턴 제거: — 25 —", () => {
    const result = cleanPdfText("텍스트\n— 25 —\n끝")
    assert.ok(!result.includes("25"))
  })

  it("페이지 번호 패턴 제거: 3 / 10", () => {
    const result = cleanPdfText("텍스트\n3 / 10\n다음")
    assert.ok(!result.includes("3 / 10"))
  })

  it("한국어 줄바꿈 병합", () => {
    const input = "대한민국\n헌법"
    const result = cleanPdfText(input)
    assert.equal(result, "대한민국 헌법")
  })

  it("영어-한글 줄바꿈은 병합 안 함", () => {
    const input = "English\n한글"
    const result = cleanPdfText(input)
    assert.ok(result.includes("English\n한글"))
  })

  it("3줄 이상 연속 빈 줄을 2줄로 축소", () => {
    const input = "A\n\n\n\n\nB"
    const result = cleanPdfText(input)
    assert.ok(!result.includes("\n\n\n"))
    assert.ok(result.includes("A\n\nB"))
  })

  it("앞뒤 공백 제거", () => {
    const result = cleanPdfText("  hello  ")
    assert.equal(result, "hello")
  })

  it("빈 문자열 입력", () => {
    assert.equal(cleanPdfText(""), "")
  })
})
