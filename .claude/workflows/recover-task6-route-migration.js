export const meta = {
  name: 'recover-task6-route-migration',
  description: 'Recover the partial route migration, repair diagnostics, review behavior, and verify Task 6',
  phases: [
    { title: 'Type Repair', detail: 'fix the partial migration model and component type errors', model: 'sonnet' },
    { title: 'Integration', detail: 'finish route and feature integration with focused tests', model: 'opus' },
    { title: 'Review', detail: 'independently audit routing, data contracts, and product behavior', model: 'opus' },
    { title: 'Repair', detail: 'fix confirmed review findings', model: 'opus' },
    { title: 'Verify', detail: 'run the final Task 6 quality gate', model: 'opus' }
  ]
}

const REPO = '/home/stonelukas/Projects/nextjs-pack-list'
const BRIEF = '/home/stonelukas/Projects/nextjs-pack-list/.superpowers/sdd/task-6-brief.md'
const REPORT = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['DONE','DONE_WITH_CONCERNS','BLOCKED'] },
    summary: { type: 'string' },
    commands: { type: 'array', items: { type: 'object', properties: { command: { type: 'string' }, outcome: { type: 'string' } }, required: ['command','outcome'] } },
    concerns: { type: 'array', items: { type: 'string' } }
  },
  required: ['status','summary','commands','concerns']
}
const REVIEW = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['APPROVED','CHANGES_REQUIRED'] },
    findings: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string', enum: ['Critical','Important','Minor'] }, file: { type: 'string' }, line: { type: 'number' }, summary: { type: 'string' }, fix: { type: 'string' } }, required: ['severity','file','summary','fix'] } }
  },
  required: ['verdict','findings']
}

phase('Type Repair')
log('Recovering the partial migration by fixing its current model and component diagnostics.')
const typeRepair = await agent(`Work in ${REPO}. Task 6 was partially implemented before an agent context overflow. Read ${BRIEF}, but focus only on repairing the CURRENT working tree. Do not restart or revert. Run bun run typecheck, fix all diagnostics in the newly migrated feature models/pages and their direct components, especially list-model, template-model, list-overview, category-section, template-library, and typed Convex Id/action return mismatches. Keep React Router and typed hooks; never restore Next imports or use-convex-store. Do not delete any additional pre-existing files. Do not commit/push/deploy. Run typecheck and focused tests after fixes.`, {label: 'repair:types', phase: 'Type Repair', model: 'sonnet', effort: 'xhigh', agentType: 'task-executor', schema: REPORT})
if (!typeRepair || typeRepair.status === 'BLOCKED') return {typeRepair}

phase('Integration')
log('Finishing functional route integration and preserving core packing workflows.')
const integration = await agent(`Work in ${REPO}. Read ${BRIEF}. Continue from the repaired partial Task 6 tree. Audit and finish only Task 6 integration: router lazy imports, retained route exports, auth/admin mounting, list CRUD and detail actions, categories/items packing/reorder/move, templates browse/apply/save, consolidated settings, categories/tags aggregates, export/import/print/QR entry points, navigation components, loading/error states, and absence of calls to internalized Convex APIs. Add focused regression tests for route/model adapters and any defects you fix. Do not perform the Task 8 visual redesign. Do not delete additional pre-existing files. Do not commit/push/deploy. Run focused tests, typecheck, lint, vite build, and diff check.`, {label: 'integrate:routes', phase: 'Integration', model: 'opus', effort: 'xhigh', agentType: 'task-executor', schema: REPORT})
if (!integration || integration.status === 'BLOCKED') return {typeRepair, integration}

phase('Review')
const reviews = await parallel([
  () => agent(`Read ${BRIEF}. Review the current Task 6 tree in ${REPO} for React Router route coverage, Clerk splats, params/search params, lazy loading, direct navigation, not-found behavior, and complete removal of Next imports and obsolete route conventions. Do not edit.`, {label: 'review:routing', phase: 'Review', model: 'opus', effort: 'xhigh', agentType: 'feature-dev:code-reviewer', schema: REVIEW}),
  () => agent(`Read ${BRIEF}. Review Task 6 in ${REPO} for Clerk/Convex data correctness: typed Ids, adapters, no client identity injection, no stale internal API calls, admin mounting, loading/error states, and mutation sequencing. Do not edit.`, {label: 'review:data', phase: 'Review', model: 'opus', effort: 'xhigh', agentType: 'feature-dev:code-reviewer', schema: REVIEW}),
  () => agent(`Read ${BRIEF}. Review Task 6 in ${REPO} for preserved product behavior and accessibility: list/category/item/template/settings/export/import/print/QR/navigation flows, responsive interactions, tests, and full type/lint/build status. Do not edit.`, {label: 'review:product', phase: 'Review', model: 'opus', effort: 'xhigh', agentType: 'feature-dev:code-reviewer', schema: REVIEW})
])
const findings = reviews.filter(Boolean).flatMap(r => r.findings).filter(f => f.severity !== 'Minor')

phase('Repair')
let repair = null
if (findings.length) {
  repair = await agent(`Work in ${REPO}. Read ${BRIEF}. Fix all verified Task 6 findings below with regression tests. Do not delete additional pre-existing files, restore Next compatibility, or redesign UI. Do not commit/push/deploy. Findings:\n${JSON.stringify(findings, null, 2)}\nRun covering tests, typecheck, lint, Vite build, and diff check.`, {label: 'repair:review-findings', phase: 'Repair', model: 'opus', effort: 'xhigh', agentType: 'task-executor', schema: REPORT})
}

phase('Verify')
const verification = await agent(`Verify Task 6 in ${REPO} against ${BRIEF}. Run repository searches for Next imports/conventions, use-convex-store, stale public calls to internal APIs, and plain-string Convex ID adapters. Run focused Task 6 tests, full typecheck, lint, direct Vite build, Convex regression tests, and git diff --check. Inspect the React Router tree and confirm every approved route is wired to a real feature module, not placeholders. Fix only small Task 6 defects discovered during verification. Do not delete additional pre-existing files or commit/push/deploy.`, {label: 'verify:task6', phase: 'Verify', model: 'opus', effort: 'xhigh', agentType: 'task-executor', schema: REPORT})
return {typeRepair, integration, reviews, repair, verification}
