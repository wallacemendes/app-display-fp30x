# Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| A1 | Bootstrap Integration | CRITICAL | [src/hooks/useConnection.ts](src/hooks/useConnection.ts#L15), [src/hooks/useConnection.ts](src/hooks/useConnection.ts#L30), [src/hooks/usePiano.ts](src/hooks/usePiano.ts#L16), [src/hooks/usePiano.ts](src/hooks/usePiano.ts#L47), [App.tsx](App.tsx#L1) | Connection and piano services are nullable singletons with early returns, and there is no bootstrap wiring in app root. Core actions can no-op at runtime. | Initialize transport/services in app startup and register them through the hook setters before rendering feature screens. |
| A2 | Engine Wiring | CRITICAL | [src/services/PianoService.ts](src/services/PianoService.ts#L29), [src/services/PianoService.ts](src/services/PianoService.ts#L117), [src/services/ConnectionService.ts](src/services/ConnectionService.ts#L87), [src/services/ConnectionService.ts](src/services/ConnectionService.ts#L42) | PianoService engine is never set from ConnectionService; command methods early-return when engine is null. Notification handler setter exists but has no call site. | On successful connect, call pianoService.setEngine(resolvedEngine) and wire connection notifications to pianoService.handleNotification. |
| A3 | Bidirectional State Sync | CRITICAL | [specs/002-fp30x-controller-v2/spec.md](specs/002-fp30x-controller-v2/spec.md#L321), [.specify/memory/constitution.md](.specify/memory/constitution.md#L63), [src/services/ConnectionService.ts](src/services/ConnectionService.ts#L97), [src/services/ConnectionService.ts](src/services/ConnectionService.ts#L175), [src/engine/fp30x/parser.ts](src/engine/fp30x/parser.ts#L265), [src/engine/fp30x/FP30XEngine.ts](src/engine/fp30x/FP30XEngine.ts#L114) | RQ1 reads are sent, but responses are routed through parseNotification only; parseStateResponse exists but is never used. Initial bulk state is not reliably decomposed/populated. | Detect RQ1 DT1 block responses and route through parseStateResponse, then dispatch each event into stores. |
| A4 | Constitution Layering | CRITICAL | [.specify/memory/constitution.md](.specify/memory/constitution.md#L186), [.specify/memory/constitution.md](.specify/memory/constitution.md#L190), [src/screens/presets/PresetCard.tsx](src/screens/presets/PresetCard.tsx#L17), [src/screens/display/QuickToneSlots.tsx](src/screens/display/QuickToneSlots.tsx#L14), [src/services/PianoService.ts](src/services/PianoService.ts#L14) | Presentation imports engine directly, and service imports a hook. This breaks required dependency direction. | Move engine-dependent resolution to hooks/services and keep screens/components dependent on hooks/services only. |
| A5 | Constitution UI Stack | CRITICAL | [.specify/memory/constitution.md](.specify/memory/constitution.md#L238), [.specify/memory/constitution.md](.specify/memory/constitution.md#L240), [specs/002-fp30x-controller-v2/tasks.md](specs/002-fp30x-controller-v2/tasks.md#L23), [src/screens/display/StatusBar.tsx](src/screens/display/StatusBar.tsx#L108), [package.json](package.json#L21) | Constitution requires NativeWind and React Native Reusables as foundation. Code is inline-style based and reusables dependency is not present. | Either implement the mandated stack or explicitly amend constitution/plan before proceeding. |
| A6 | BLE Characteristic Discovery | HIGH | [specs/002-fp30x-controller-v2/spec.md](specs/002-fp30x-controller-v2/spec.md#L313), [src/transport/ble/BleTransport.ts](src/transport/ble/BleTransport.ts#L23), [src/transport/ble/BleTransport.ts](src/transport/ble/BleTransport.ts#L116), [src/transport/ble/BleTransport.ts](src/transport/ble/BleTransport.ts#L144), [src/transport/ble/scanner.ts](src/transport/ble/scanner.ts#L100) | FR-001 requires dynamic writable+notifiable characteristic discovery. Implementation uses fixed UUIDs and does not validate characteristic properties. | Discover and select MIDI characteristic by capabilities after service discovery. |
| A7 | Parser Fidelity | HIGH | [specs/002-fp30x-controller-v2/tasks.md](specs/002-fp30x-controller-v2/tasks.md#L45), [.specify/memory/constitution.md](.specify/memory/constitution.md#L133), [src/engine/fp30x/parser.ts](src/engine/fp30x/parser.ts#L6), [src/engine/fp30x/parser.ts](src/engine/fp30x/parser.ts#L253), [src/transport/ble/framing.ts](src/transport/ble/framing.ts#L140) | Tasks/constitution require running-status and CC/PC echo handling; parser currently ignores non-note channel messages and framing drops running status. | Implement running-status reconstruction and parse relevant CC/PC echoes. |
| A8 | Pending Tone Queue | HIGH | [specs/002-fp30x-controller-v2/spec.md](specs/002-fp30x-controller-v2/spec.md#L331), [.specify/memory/constitution.md](.specify/memory/constitution.md#L74), [src/store/performanceStore.ts](src/store/performanceStore.ts#L177), [src/hooks/useTones.ts](src/hooks/useTones.ts#L86) | Pending queue is defined but not used by command flow. UI can optimistically show tone changes even when command is not sent. | Gate sends by connection status, enqueue last selection while disconnected, and auto-flush on reconnect with pending indicator. |
| A9 | Tone Selector Requirement Drift | HIGH | [specs/002-fp30x-controller-v2/spec.md](specs/002-fp30x-controller-v2/spec.md#L324), [specs/002-fp30x-controller-v2/spec.md](specs/002-fp30x-controller-v2/spec.md#L326), [src/hooks/useTones.ts](src/hooks/useTones.ts#L39), [src/screens/display/ToneSelector.tsx](src/screens/display/ToneSelector.tsx#L83), [src/components/modals/TonePickerModal.tsx](src/components/modals/TonePickerModal.tsx#L80), [src/components/modals/TonePickerModal.tsx](src/components/modals/TonePickerModal.tsx#L51) | Category +/- only changes category index (does not reset/apply first tone). Set default tone is placeholder. Number search is not cross-category as specified. | Implement FR-012 behavior fully: category step applies first tone, complete default-tone action, implement cross-category number search. |
| A10 | Import/Export Completion Gap | HIGH | [specs/002-fp30x-controller-v2/spec.md](specs/002-fp30x-controller-v2/spec.md#L357), [specs/002-fp30x-controller-v2/spec.md](specs/002-fp30x-controller-v2/spec.md#L358), [specs/002-fp30x-controller-v2/tasks.md](specs/002-fp30x-controller-v2/tasks.md#L279), [src/screens/presets/PresetsScreen.tsx](src/screens/presets/PresetsScreen.tsx#L50), [src/services/PresetService.ts](src/services/PresetService.ts#L189) | Import button is a future-update stub. Conflict resolution is fixed suffixing, not rename/replace/skip prompt. Export uses share message flow, not file-based flow from story wording. | Add real file import flow and explicit conflict dialog policy; align export to shareable file workflow. |
| A11 | Preset Reordering Missing | HIGH | [specs/002-fp30x-controller-v2/spec.md](specs/002-fp30x-controller-v2/spec.md#L340), [specs/002-fp30x-controller-v2/tasks.md](specs/002-fp30x-controller-v2/tasks.md#L189), [src/hooks/usePresets.ts](src/hooks/usePresets.ts#L93), [src/screens/presets/PresetsScreen.tsx](src/screens/presets/PresetsScreen.tsx#L1) | FR-022 and T064 require reorder management in PRESETS, but hook/screen expose no reorder interaction. | Expose reorder action in hook and add reorder UI interaction in PresetsScreen. |
| A12 | Test Coverage Claim Mismatch | HIGH | [specs/002-fp30x-controller-v2/tasks.md](specs/002-fp30x-controller-v2/tasks.md#L87), [__tests__/services/ChordService.test.ts](__tests__/services/ChordService.test.ts#L1), [__tests__/services/PresetService.test.ts](__tests__/services/PresetService.test.ts#L1), [.specify/memory/constitution.md](.specify/memory/constitution.md#L290) | T030 is marked complete, but no ConnectionService test artifact is present; service tests currently cover chord/preset only. | Add missing ConnectionService tests before keeping T030 marked complete. |
| A13 | Reconnect Monitor Lifecycle | MEDIUM | [src/services/ConnectionService.ts](src/services/ConnectionService.ts#L198), [src/services/ConnectionService.ts](src/services/ConnectionService.ts#L223) | Connection monitor interval handle is local; cleanup path only manages reconnect timeout handle. Repeated connect cycles can accumulate active intervals. | Persist interval handle on class and clear in disconnect/destroy paths. |
| A14 | Spec Ambiguity | LOW | [specs/002-fp30x-controller-v2/spec.md](specs/002-fp30x-controller-v2/spec.md#L25), [specs/002-fp30x-controller-v2/spec.md](specs/002-fp30x-controller-v2/spec.md#L293) | TODO placeholders remain in shipped Phase 5 wording. | Replace TODO with concrete acceptance details or explicit out-of-scope note. |

## Coverage Summary Table

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T031, T032, T033 | Implemented partially; dynamic characteristic capability selection missing. |
| FR-009 | Yes | T033 | RQ1 sent, but response decomposition not wired. |
| FR-012 | Yes | T038-T044 | Partially implemented; category +/- behavior and default tone action incomplete. |
| FR-016 | Yes | T022, T034 | Pending queue modeled in store only; not executed in runtime flow. |
| FR-022 | Yes | T059, T062, T064 | Reordering not exposed in hook/screen UX. |
| FR-030 | Yes | T082, T083, T085 | Export exists, but workflow is message share rather than explicit file pipeline. |
| FR-031 | Yes | T084, T085 | Import UI is stub; required rename/replace/skip interaction missing. |
| SC-003 | Yes | T031, T033 | Not verifiable from static code alone; no benchmark/test evidence in repo. |
| SC-008 | Yes | T061, T089 | Not verifiable from static code alone; profiling task marked done but no evidence artifact. |
| SC-009 | Yes | T065 | Logic exists, but depends on missing service bootstrap/engine wiring. |

## Constitution Alignment Issues

- Layer dependency rule violation: presentation directly imports engine and service imports hooks. See [constitution](.specify/memory/constitution.md#L186), [constitution](.specify/memory/constitution.md#L190), [PresetCard](src/screens/presets/PresetCard.tsx#L17), [QuickToneSlots](src/screens/display/QuickToneSlots.tsx#L14), [PianoService](src/services/PianoService.ts#L14).
- NativeWind and Reusables mandates are not followed in current implementation style/dependencies. See [constitution](.specify/memory/constitution.md#L238), [constitution](.specify/memory/constitution.md#L240), [tasks](specs/002-fp30x-controller-v2/tasks.md#L23), [StatusBar](src/screens/display/StatusBar.tsx#L108), [package.json](package.json#L21).
- Hardware-authoritative initial read requirement is not fully implemented due missing RQ1 response decomposition wiring. See [constitution](.specify/memory/constitution.md#L63), [ConnectionService](src/services/ConnectionService.ts#L97), [parser](src/engine/fp30x/parser.ts#L265).
- TDD governance mismatch: task marked done without corresponding test artifact. See [constitution](.specify/memory/constitution.md#L290), [tasks](specs/002-fp30x-controller-v2/tasks.md#L87).

## Unmapped Tasks

- No critical unmapped functional tasks detected.
- Quality tasks marked complete without verifiable artifacts in repo: [tasks](specs/002-fp30x-controller-v2/tasks.md#L290), [tasks](specs/002-fp30x-controller-v2/tasks.md#L291), [tasks](specs/002-fp30x-controller-v2/tasks.md#L292), [tasks](specs/002-fp30x-controller-v2/tasks.md#L293).

## Metrics

- Total Requirements Reviewed: 47 (FR + SC)
- Total Tasks Reviewed: 89
- Spec-to-Task Coverage: 100%
- Estimated Code-Verified Coverage: about 70% (major blockers on bootstrap, state sync, and import flow)
- Ambiguity Count: 1
- Duplication Count: 0
- Critical Issues Count: 5

## Open Questions / Assumptions

- This review is read-only and static; I could not execute runtime BLE flows or run profiling benchmarks in this pass.
- I could not run the prerequisites shell script from the skill instructions in this environment, so artifact paths were derived directly from repository structure and files.
- If there is external bootstrap wiring outside this workspace scope, A1 and A2 severity would need revalidation.

## Next Actions

1. Resolve all CRITICAL findings before continuing implementation work.
2. Reconcile tasks status with reality, especially T030 and T084-T085.
3. Update architecture wiring first (bootstrap, engine binding, notification routing), then protocol fidelity fixes, then feature gaps.
4. Re-run planning alignment using speckit plan/tasks updates only after constitution conflicts are corrected.
