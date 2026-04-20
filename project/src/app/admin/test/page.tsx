"use client"

import { useState } from "react"

export default function TestPage() {
  const [info, setInfo] = useState("아직 파일 없음")

  return (
    <div style={{ padding: 40 }}>
      <h1>파일 업로드 테스트</h1>
      <br />

      <h3>테스트 1: 네이티브 input</h3>
      <input
        type="file"
        onChange={(e) => {
          const f = e.target.files?.[0]
          setInfo(f ? `선택됨: ${f.name} (${f.size} bytes)` : "파일 없음")
        }}
      />
      <p>{info}</p>

      <br />
      <h3>테스트 2: 버튼 + 숨김 input</h3>
      <input
        id="hidden-input"
        type="file"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          setInfo(f ? `숨김input 선택됨: ${f.name} (${f.size} bytes)` : "파일 없음")
        }}
      />
      <button onClick={() => document.getElementById("hidden-input")?.click()}>
        숨김 input 클릭
      </button>
      <p>{info}</p>
    </div>
  )
}
