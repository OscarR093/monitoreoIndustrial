## ADDED Requirements

### Requirement: Alarm limits can be cleared to "Sin límite"
The sensor detail modal SHALL allow the user to clear an existing alarm limit (rangoMin or rangoMax) and SHALL reflect the cleared state after saving.

#### Scenario: User clears an existing limit
- **WHEN** a sensor has `rangoMinimo = 10` and the user clears the input
- **AND** clicks "Guardar configuración"
- **THEN** the API receives `rangoMinimo: null`
- **AND** the modal displays the input as empty with placeholder "Sin límite"
- **AND** a success toast appears: "Configuración guardada"

#### Scenario: User clears limit without saving
- **WHEN** a sensor has `rangoMinimo = 10` and the user clears the input
- **AND** closes the modal without saving
- **THEN** on reopening the modal, `rangoMinimo = 10` is shown (no changes persisted)

#### Scenario: Explicit clear button
- **WHEN** a sensor has `rangoMinimo = 10` and the input shows "10"
- **AND** the user clicks the "×" clear button next to the input
- **THEN** the input value is set to empty string
- **AND** the placeholder "Sin límite" is visible

### Requirement: Post-save state syncs with prop
The modal's local state for alarm limits SHALL synchronize with the sensor prop after a successful save.

#### Scenario: Prop updates after save
- **WHEN** `handleSaveAlarm` completes successfully
- **AND** `onSensorUpdate` propagates `rangoMinimo: null` to the parent
- **AND** the sensor prop's `rangoMinimo` changes from `10` to `null`
- **THEN** the modal's local `rangoMin` state updates to `""`
