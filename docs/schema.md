# Database schema

Postgres on Supabase. Every app table belongs to a household, which is what Row Level Security filters on. Users live in Supabase Auth (`auth.users`) and are linked to households through `members`.

```mermaid
erDiagram
    households ||--o{ members : "has"
    auth_users ||--o{ members : "is"
    households ||--o{ shopping_items : "owns"
    households ||--o{ events : "owns"
    households ||--o{ todos : "owns"
    households ||--o{ medicine_logs : "owns"
    auth_users |o--o{ events : "assigned to"
    auth_users |o--o{ todos : "assigned to"
    auth_users |o--o{ medicine_logs : "given by"

    households {
        uuid id PK
        text name
        timestamptz created_at
    }
    members {
        uuid household_id PK, FK
        uuid user_id PK, FK
        timestamptz created_at
    }
    auth_users {
        uuid id PK "managed by Supabase Auth"
    }
    shopping_items {
        uuid id PK
        uuid household_id FK
        text name
        numeric amount "optional"
        text unit "optional"
        text category "optional"
        boolean done "default false"
        timestamptz created_at
    }
    events {
        uuid id PK
        uuid household_id FK
        text title
        date date
        time time "optional"
        uuid assigned_to FK "null = everyone"
        timestamptz created_at
    }
    todos {
        uuid id PK
        uuid household_id FK
        text title
        boolean done "default false"
        uuid assigned_to FK "null = everyone"
        timestamptz created_at
    }
    medicine_logs {
        uuid id PK
        uuid household_id FK
        text medicine "alvedon or ipren"
        timestamptz given_at
        uuid given_by FK "optional"
    }
```

## Delete behaviour

| Relation | On delete | Why |
|---|---|---|
| Household → members and all app tables | `cascade` | Deleting a household removes all of its data. |
| User → members | `cascade` | A deleted user leaves every household. |
| User → `assigned_to`, `given_by` | `set null` | The event, to-do or dose stays; it just loses who it belonged to. |

## Design notes

- `members` uses a composite primary key (`household_id`, `user_id`), so a user can only join a household once.
- `assigned_to` replaces the old app's hardcoded names ("Alexander", "Alexandra", "Båda"), so any household, including the demo household, can use it. `null` means everyone.
- `medicine_logs` stores one row per dose instead of only the latest one, which gives a full history. Allowed medicines are enforced with a check constraint.
