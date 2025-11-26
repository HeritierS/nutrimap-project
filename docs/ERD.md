**Entity Relationship Diagram (ERD)**

This file contains a Mermaid ER diagram for the NutriMap backend data model (derived from `prisma/schema.prisma`). You can preview this in VS Code with a Mermaid extension or paste the diagram into https://mermaid.live to render an image.

```mermaid
erDiagram
  USER {
    String id PK
    String name
    String email
    String password
    Role role
    Boolean isActive
    String region
    String district
    DateTime createdAt
  }

  CHILD {
    String id PK
    String localId
    String name
    String motherName
    DateTime dob
    Sex sex
    String address
    Float latitude
    Float longitude
    String complications
    String createdById FK
    DateTime initialRecordedAt
    Float initialWeightKg
    Float initialHeightCm
    Float initialHeadCircCm
    DateTime createdAt
  }

  CONVERSATION {
    String id PK
    String childId FK
    String title
    String createdById FK
    DateTime createdAt
  }

  MESSAGE {
    String id PK
    String conversationId FK
    String authorId FK
    String text
    DateTime createdAt
  }

  FOLLOWUP {
    String id PK
    String childId FK
    DateTime recordedAt
    Float weightKg
    Float heightCm
    Float headCircCm
    String collectorId FK
  }

  USER ||--o{ CHILD : "creates"
  CHILD ||--o{ FOLLOWUP : "has"
  USER ||--o{ FOLLOWUP : "collects"
  CHILD ||--o{ CONVERSATION : "may have"
  CONVERSATION ||--o{ MESSAGE : "contains"
  USER ||--o{ CONVERSATION : "creates"
  USER ||--o{ MESSAGE : "authors"
```

**Notes**
- `User` has roles: `admin`, `chw`, `nutritionist`. Role controls access in middleware.
- `Child` records belong to a `User` (creator) via `createdById` and can have many `FollowUp` records.
- `Conversation` optionally links to a `Child` and contains `Message` entries authored by `User`.
- `FollowUp` points to `Child` and to the collecting `User` as `collectorId`.

How to render
- In VS Code: install a Mermaid preview extension, open `docs/ERD.md` and toggle preview.
- Online: paste the Mermaid block into https://mermaid.live to export PNG/SVG.
