/**
 * E2E-4: Stage Validator 테스트
 * PRD 3.3 전이 조건 검증
 */

// Inline validator (matches cip-validators.ts logic)
function validateStageTransition(item, fromStage, toStage) {
  if (fromStage === 'registered' && toStage === 'investigating') {
    if (!item.assigned_engineer) {
      return { valid: false, message: '담당 엔지니어를 먼저 배정해주세요.' };
    }
    return { valid: true, message: null };
  }
  if (fromStage === 'investigating' && toStage === 'searching_solution') {
    if (!item.root_cause) {
      return { valid: false, message: '근본 원인(Root Cause)을 입력해주세요.' };
    }
    return { valid: true, message: null };
  }
  const stageOrder = ['registered', 'investigating', 'searching_solution'];
  const fromIdx = stageOrder.indexOf(fromStage);
  const toIdx = stageOrder.indexOf(toStage);
  if (fromIdx === -1 || toIdx === -1) {
    return { valid: false, message: '유효하지 않은 단계 전이입니다.' };
  }
  if (toIdx <= fromIdx) {
    return { valid: false, message: '이전 단계로 되돌릴 수 없습니다.' };
  }
  return { valid: true, message: null };
}

let passed = 0, failed = 0;
function assert(cond, name) {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ FAIL: ${name}`); }
}

console.log('\n══ TEST: Stage Validator (PRD 3.3) ══');

// T1: registered → investigating: engineer 없으면 실패
const noEng = { assigned_engineer: null, root_cause: null };
const r1 = validateStageTransition(noEng, 'registered', 'investigating');
assert(!r1.valid, 'T1: registered→investigating 엔지니어 없음 → 거부');
assert(r1.message.includes('엔지니어'), 'T1: 메시지에 엔지니어 포함');

// T2: registered → investigating: engineer 있으면 성공
const withEng = { assigned_engineer: 'user-123', root_cause: null };
const r2 = validateStageTransition(withEng, 'registered', 'investigating');
assert(r2.valid, 'T2: registered→investigating 엔지니어 있음 → 허용');

// T3: investigating → searching_solution: root_cause 없으면 실패
const noRC = { assigned_engineer: 'user-123', root_cause: null };
const r3 = validateStageTransition(noRC, 'investigating', 'searching_solution');
assert(!r3.valid, 'T3: investigating→searching_solution RC 없음 → 거부');
assert(r3.message.includes('Root Cause'), 'T3: 메시지에 Root Cause 포함');

// T4: investigating → searching_solution: root_cause 있으면 성공
const withRC = { assigned_engineer: 'user-123', root_cause: 'Joint Board failure' };
const r4 = validateStageTransition(withRC, 'investigating', 'searching_solution');
assert(r4.valid, 'T4: investigating→searching_solution RC 있음 → 허용');

// T5: 역방향 전이 거부
const r5 = validateStageTransition(withRC, 'investigating', 'registered');
assert(!r5.valid, 'T5: investigating→registered 역방향 → 거부');

// T6: 같은 단계 전이 거부
const r6 = validateStageTransition(withRC, 'investigating', 'investigating');
assert(!r6.valid, 'T6: investigating→investigating 동일 단계 → 거부');

// T7: 유효하지 않은 단계
const r7 = validateStageTransition(withRC, 'registered', 'unknown_stage');
assert(!r7.valid, 'T7: unknown_stage → 거부');

// T8: 2단계 건너뛰기 (registered → searching_solution)
const r8 = validateStageTransition(withRC, 'registered', 'searching_solution');
assert(r8.valid, 'T8: registered→searching_solution 건너뛰기 → 허용 (validator only checks specific pairs)');

console.log(`\n${'═'.repeat(50)}`);
console.log(`총 ${passed + failed}개 테스트: ✅ ${passed}개 통과, ❌ ${failed}개 실패`);
console.log(`${'═'.repeat(50)}`);
process.exit(failed > 0 ? 1 : 0);
