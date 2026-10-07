const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require(process.env.PGLITE_MODULE || "@electric-sql/pglite");
const userA = "00000000-0000-0000-0000-000000000001";
const userB = "00000000-0000-0000-0000-000000000002";
const eventA = "00000000-0000-0000-0000-000000000011";
const eventB = "00000000-0000-0000-0000-000000000012";
const expenseA = "00000000-0000-0000-0000-000000000021";
const expenseB = "00000000-0000-0000-0000-000000000022";
const bookingB = "00000000-0000-0000-0000-000000000032";
test("budget migration enforces owner isolation and same-event invoice attachments", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
 create role authenticated;
 create schema auth; create schema storage;
 create function auth.uid() returns uuid language sql stable as $$select current_setting('test.uid',true)::uuid$$;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
 create table public.events(id uuid primary key,client_id uuid);
 create table public.bookings(id uuid primary key,event_id uuid references events(id));
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 insert into events values ('${eventA}','${userA}'),('${eventB}','${userB}');
 insert into bookings values ('${bookingB}','${eventB}');
 `);
    await db.exec(
      fs.readFileSync(
        path.resolve(
          __dirname,
          "../supabase/migrations/0016_event_budget_invoices.sql",
        ),
        "utf8",
      ),
    );
    await db.exec(`grant usage on schema public,auth,storage to authenticated; grant select,insert,update,delete on all tables in schema public,storage to authenticated;
 insert into event_budget_expenses(id,event_id,description,amount) values ('${expenseA}','${eventA}','Cake',300),('${expenseB}','${eventB}','Flowers',100);
 set role authenticated; set test.uid='${userA}';`);
    assert.equal(
      (await db.query("select * from event_budget_expenses")).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query(
          `update event_budget_expenses set amount=5 where id='${expenseB}' returning id`,
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.exec(
        `insert into event_budget_expenses(event_id,description,amount) values ('${eventB}','Unauthorized',5)`,
      ),
    );
    await assert.rejects(
      db.exec(
        `update event_budget_expenses set event_id='${eventB}' where id='${expenseA}'`,
      ),
    );
    await assert.rejects(
      db.exec(
        `update event_budget_expenses set paid_amount=301 where id='${expenseA}'`,
      ),
    );
    const invoice = "00000000-0000-0000-0000-000000000041";
    const storagePath = `${userA}/${eventA}/${invoice}`;
    await assert.rejects(
      db.exec(
        `insert into event_budget_invoices(id,event_id,expense_id,filename,storage_path) values ('${invoice}','${eventA}','${expenseB}','bad.pdf','${storagePath}')`,
      ),
    );
    await assert.rejects(
      db.exec(
        `insert into event_budget_invoices(id,event_id,booking_id,filename,storage_path) values ('${invoice}','${eventA}','${bookingB}','bad.pdf','${storagePath}')`,
      ),
    );
    await db.exec(`insert into storage.objects(bucket_id,name) values ('event-invoices','${storagePath}');
 insert into event_budget_invoices(id,event_id,expense_id,filename,storage_path) values ('${invoice}','${eventA}','${expenseA}','cake.pdf','${storagePath}');`);
    assert.equal(
      (await db.query("select * from event_budget_invoices")).rows.length,
      1,
    );
    await assert.rejects(
      db.exec(
        `insert into storage.objects(bucket_id,name) values ('event-invoices','${userA}/${eventB}/bad')`,
      ),
    );
    await db.exec(`set test.uid='${userB}'`);
    assert.equal(
      (await db.query("select * from event_budget_invoices")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          `delete from event_budget_expenses where id='${expenseA}' returning id`,
        )
      ).rows.length,
      0,
    );
    await db.exec(`reset role;`);
    assert.equal(
      (
        await db.query(
          "select public from storage.buckets where id='event-invoices'",
        )
      ).rows[0].public,
      false,
    );
  } finally {
    await db.close();
  }
});
