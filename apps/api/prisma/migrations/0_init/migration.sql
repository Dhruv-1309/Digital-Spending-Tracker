-- CreateEnums
CREATE TYPE txn_type AS ENUM ('income', 'expense');
CREATE TYPE pay_method AS ENUM ('cash', 'credit_card', 'debit_card', 'upi', 'net_banking', 'bank_transfer');
CREATE TYPE anomaly_state AS ENUM ('none', 'flagged', 'approved');

-- CreateTable users
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid  text NOT NULL UNIQUE,
  email         text,
  display_name  text,
  auth_method   text NOT NULL,
  timezone      text NOT NULL DEFAULT 'Asia/Kolkata',
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_sign_in  timestamptz
);

-- CreateTable categories
CREATE TABLE categories (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type     txn_type NOT NULL,
  name     text NOT NULL,
  UNIQUE (user_id, type, name)
);

-- CreateTable autopay_plans
CREATE TABLE autopay_plans (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  type                  txn_type NOT NULL,
  amount_paise          bigint NOT NULL CHECK (amount_paise > 0),
  currency              char(3) NOT NULL DEFAULT 'INR',
  category              text NOT NULL,
  day                   smallint NOT NULL CHECK (day BETWEEN 1 AND 31),
  description           text,
  active                boolean NOT NULL DEFAULT true,
  last_processed_month  char(7),
  legacy_id             text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz
);

-- CreateTable transactions
CREATE TABLE transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            txn_type NOT NULL,
  amount_paise    bigint NOT NULL CHECK (amount_paise > 0),
  currency        char(3) NOT NULL DEFAULT 'INR',
  category        text NOT NULL,
  payment_method  pay_method NOT NULL,
  description     text,
  txn_date        date NOT NULL,
  anomaly         anomaly_state NOT NULL DEFAULT 'none',
  anomaly_z       numeric(6,2),
  autopay_id      uuid REFERENCES autopay_plans(id) ON DELETE SET NULL,
  autopay_period  char(7),
  import_hash     text,
  legacy_id       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

-- CreateIndexes on transactions
CREATE UNIQUE INDEX uq_txn_autopay_period ON transactions (autopay_id, autopay_period)
  WHERE autopay_id IS NOT NULL;
CREATE UNIQUE INDEX uq_txn_import_hash ON transactions (user_id, import_hash)
  WHERE import_hash IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_txn_legacy ON transactions (user_id, legacy_id)
  WHERE legacy_id IS NOT NULL;
CREATE INDEX ix_txn_user_date ON transactions (user_id, txn_date DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX ix_txn_user_cat ON transactions (user_id, type, category)
  WHERE deleted_at IS NULL;
CREATE INDEX ix_txn_user_updated ON transactions (user_id, updated_at);

-- CreateTable budget_goals
CREATE TABLE budget_goals (
  user_id                      uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  monthly_expense_limit_paise  bigint NOT NULL CHECK (monthly_expense_limit_paise >= 0),
  threshold_percent            smallint NOT NULL DEFAULT 80 CHECK (threshold_percent BETWEEN 1 AND 100),
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

-- CreateTable idempotency_keys
CREATE TABLE idempotency_keys (
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key              text NOT NULL,
  request_hash     text NOT NULL,
  response_status  smallint NOT NULL,
  response_body    jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);
