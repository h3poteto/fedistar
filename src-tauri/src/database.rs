use std::str::FromStr;

use sqlx::{
    query_as,
    sqlite::{SqliteConnectOptions, SqlitePoolOptions, SqliteRow},
    Row, SqlitePool,
};

use crate::entities;

type DBResult<T> = Result<T, Box<dyn std::error::Error>>;

pub(crate) async fn create_sqlite_pool(database_url: &str) -> DBResult<SqlitePool> {
    let connect_options = SqliteConnectOptions::from_str(database_url)?
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .synchronous(sqlx::sqlite::SqliteSynchronous::Normal);

    let sqlite_pool = SqlitePoolOptions::new()
        .connect_with(connect_options)
        .await?;

    Ok(sqlite_pool)
}

pub(crate) async fn migrate_database(pool: &SqlitePool) -> DBResult<()> {
    sqlx::migrate!("./db").run(pool).await?;
    Ok(())
}

pub(crate) async fn list_servers(
    pool: &SqlitePool,
) -> DBResult<Vec<(entities::Server, Option<entities::Account>)>> {
    let servers = sqlx::query(
        r#"
SELECT servers.id, servers.domain, servers.base_url, servers.sns, servers.favicon, servers.account_id,
       accounts.id, accounts.username, accounts.account_id, accounts.avatar, accounts.client_id, accounts.client_secret,
       accounts.access_token, accounts.refresh_token, accounts.usual
FROM servers LEFT JOIN accounts ON servers.account_id = accounts.id"#,
    ).map(|row: SqliteRow| {
        let server = entities::Server {
                id: row.get(0),
                domain: row.get(1),
                base_url: row.get(2),
                sns: row.get(3),
                favicon: row.get(4),
                account_id: row.get(5),
        };
        if row.get(6) {
            (server, Some(entities::Account {
                    id: row.get(6),
                    username: row.get(7),
                    account_id: row.get(8),
                    avatar: row.get(9),
                    client_id: row.get(10),
                    client_secret: row.get(11),
                    access_token: row.get(12),
                    refresh_token: row.get(13),
                    usual: row.get(14),
            }))
        } else {
            (server, None)
        }
        })
        .fetch_all(pool)
        .await?;

    Ok(servers)
}

pub(crate) async fn get_server(pool: &SqlitePool, id: i64) -> DBResult<entities::Server> {
    let server = query_as::<_, entities::Server>("SELECT * FROM servers WHERE id = ?")
        .bind(id)
        .fetch_one(pool)
        .await?;

    Ok(server)
}

pub(crate) async fn add_server(
    pool: &SqlitePool,
    server: entities::Server,
) -> DBResult<entities::Server> {
    let mut tx = pool.begin().await?;
    let mut created = server.clone();

    let res =
        sqlx::query("INSERT INTO servers (domain, base_url, sns, favicon) VALUES (?, ?, ?, ?)")
            .bind(server.domain)
            .bind(server.base_url)
            .bind(server.sns)
            .bind(server.favicon)
            .execute(&mut *tx)
            .await?;

    tx.commit().await?;
    let id = res.last_insert_rowid();
    created.id = id;
    Ok(created)
}

pub(crate) async fn remove_server(pool: &SqlitePool, id: i64) -> DBResult<()> {
    let mut tx = pool.begin().await?;

    sqlx::query("DELETE FROM servers WHERE id = ?")
        .bind(id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    Ok(())
}

pub(crate) async fn add_account(
    pool: &SqlitePool,
    server: &entities::Server,
    account: &entities::Account,
) -> DBResult<entities::Account> {
    let mut tx = pool.begin().await?;
    let mut created = account.clone();

    let res = sqlx::query("INSERT INTO accounts (username, account_id, avatar, client_id, client_secret, access_token, refresh_token, usual) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(account.username.clone())
        .bind(account.account_id.clone())
        .bind(account.avatar.clone())
        .bind(account.client_id.clone())
        .bind(account.client_secret.clone())
        .bind(account.access_token.clone())
        .bind(account.refresh_token.clone())
        .bind(account.usual.clone())
        .execute(&mut *tx)
        .await?;
    let id = res.last_insert_rowid();
    created.id = id;

    sqlx::query("UPDATE servers SET account_id = ? WHERE id = ?")
        .bind(id)
        .bind(server.id.clone())
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(created)
}

pub(crate) async fn list_timelines(
    pool: &SqlitePool,
) -> DBResult<Vec<(entities::Timeline, entities::Server)>> {
    let timelines = sqlx::query(
        r#"
SELECT timelines.id, timelines.server_id, timelines.kind, timelines.name, timelines.sort, timelines.list_id, timelines.column_width,
       servers.id, servers.domain, servers.base_url, servers.sns, servers.favicon, servers.account_id
FROM timelines INNER JOIN servers ON servers.id = timelines.server_id ORDER BY timelines.sort"#,
    )
    .map(|row: SqliteRow| {
        (
            entities::Timeline {
                id: row.get(0),
                server_id: row.get(1),
                kind: row.get(2),
                name: row.get(3),
                sort: row.get(4),
                list_id: row.get(5),
                column_width: row.get(6),
            },
            entities::Server {
                id: row.get(7),
                domain: row.get(8),
                base_url: row.get(9),
                sns: row.get(10),
                favicon: row.get(11),
                account_id: row.get(12),
            },
        )
    })
    .fetch_all(pool)
    .await?;

    Ok(timelines)
}

pub(crate) async fn add_timeline(
    pool: &SqlitePool,
    server: &entities::Server,
    kind: &entities::timeline::Kind,
    name: &str,
    list_id: Option<&str>,
    column_width: &entities::timeline::ColumnWidth,
) -> DBResult<entities::Timeline> {
    let mut tx = pool.begin().await?;

    let exists = query_as::<_, entities::Timeline>("SELECT * FROM timelines ORDER BY sort DESC")
        .fetch_all(&mut *tx)
        .await?;

    let mut sort = 1;
    if exists.len() > 0 {
        sort = exists[0].sort + 1;
    }
    let res = sqlx::query(
        "INSERT INTO timelines (server_id, kind, name, sort, list_id) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(server.id)
    .bind(kind)
    .bind(name)
    .bind::<i64>(sort)
    .bind(list_id)
    .execute(&mut *tx)
    .await?;
    let id = res.last_insert_rowid();
    tx.commit().await?;

    let created = entities::Timeline::new(
        id,
        server.id,
        kind.clone(),
        name.to_string(),
        1,
        list_id.map(|i| i.to_string()),
        column_width.clone(),
    );
    Ok(created)
}

pub(crate) async fn remove_timeline(pool: &SqlitePool, id: i64) -> DBResult<()> {
    let mut tx = pool.begin().await?;

    sqlx::query("DELETE FROM timelines WHERE id = ?")
        .bind(id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    Ok(())
}

pub(crate) async fn switch_left_timeline(pool: &SqlitePool, id: i64) -> DBResult<()> {
    let mut tx = pool.begin().await?;

    let exists = query_as::<_, entities::Timeline>("SELECT * FROM timelines ORDER BY sort")
        .fetch_all(&mut *tx)
        .await?;

    let find = exists.iter().position(|e| e.id == id);
    if let Some(index) = find {
        if index <= 0 {
            return Ok(());
        }
        let target = &exists[index - 1];
        let base = &exists[index];

        sqlx::query("UPDATE timelines SET sort = ? WHERE id = ?")
            .bind(-100)
            .bind(base.id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("UPDATE timelines SET sort = ? WHERE id = ?")
            .bind(base.sort)
            .bind(target.id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("UPDATE timelines SET sort = ? WHERE id = ?")
            .bind(target.sort)
            .bind(base.id)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;

    Ok(())
}

pub(crate) async fn switch_right_timeline(pool: &SqlitePool, id: i64) -> DBResult<()> {
    let mut tx = pool.begin().await?;

    let exists = query_as::<_, entities::Timeline>("SELECT * FROM timelines ORDER BY sort")
        .fetch_all(&mut *tx)
        .await?;

    let find = exists.iter().position(|e| e.id == id);
    if let Some(index) = find {
        if index >= exists.len() - 1 {
            return Ok(());
        }
        let target = &exists[index + 1];
        let base = &exists[index];

        sqlx::query("UPDATE timelines SET sort = ? WHERE id = ?")
            .bind(-100)
            .bind(base.id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("UPDATE timelines SET sort = ? WHERE id = ?")
            .bind(base.sort)
            .bind(target.id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("UPDATE timelines SET sort = ? WHERE id = ?")
            .bind(target.sort)
            .bind(base.id)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;

    Ok(())
}

pub(crate) async fn update_column_width(
    pool: &SqlitePool,
    id: i64,
    column_width: &entities::timeline::ColumnWidth,
) -> DBResult<()> {
    let mut tx = pool.begin().await?;

    sqlx::query("UPDATE timelines SET column_width = ? WHERE id = ?")
        .bind(column_width.clone())
        .bind(id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    Ok(())
}

pub(crate) async fn get_account(
    pool: &SqlitePool,
    id: i64,
) -> DBResult<(entities::Account, entities::Server)> {
    let account = sqlx::query(
        r#"
SELECT accounts.id, accounts.username, accounts.account_id, accounts.avatar, accounts.client_id, accounts.client_secret,
       accounts.access_token, accounts.refresh_token, accounts.usual, servers.id, servers.domain, servers.base_url, servers.sns,
       servers.favicon, servers.account_id
FROM accounts INNER JOIN servers ON accounts.id = servers.account_id WHERE accounts.id = ?"#
        )
        .bind(id)
        .map(|row: SqliteRow| {
            (
                entities::Account {
                    id: row.get(0),
                    username: row.get(1),
                    account_id: row.get(2),
                    avatar: row.get(3),
                    client_id: row.get(4),
                    client_secret: row.get(5),
                    access_token: row.get(6),
                    refresh_token: row.get(7),
                    usual: row.get(8),
                },
                entities::Server {
                    id: row.get(9),
                    domain: row.get(10),
                    base_url: row.get(11),
                    sns: row.get(12),
                    favicon: row.get(13),
                    account_id: row.get(14),
                },
            )
        }).fetch_one(pool)
        .await?;

    Ok(account)
}

pub(crate) async fn list_account(
    pool: &SqlitePool,
) -> DBResult<Vec<(entities::Account, entities::Server)>> {
    let accounts = sqlx::query(
        r#"
SELECT accounts.id, accounts.username, accounts.account_id, accounts.avatar, accounts.client_id, accounts.client_secret,
       accounts.access_token, accounts.refresh_token, accounts.usual, servers.id, servers.domain, servers.base_url, servers.sns,
       servers.favicon, servers.account_id
FROM accounts INNER JOIN servers ON accounts.id = servers.account_id"#
        ).map(|row: SqliteRow| {
            (
                entities::Account {
                    id: row.get(0),
                    username: row.get(1),
                    account_id: row.get(2),
                    avatar: row.get(3),
                    client_id: row.get(4),
                    client_secret: row.get(5),
                    access_token: row.get(6),
                    refresh_token: row.get(7),
                    usual: row.get(8),
                },
                entities::Server {
                    id: row.get(9),
                    domain: row.get(10),
                    base_url: row.get(11),
                    sns: row.get(12),
                    favicon: row.get(13),
                    account_id: row.get(14),
                },
            )
        }).fetch_all(pool)
        .await?;

    Ok(accounts)
}

pub(crate) async fn set_usual_account(pool: &SqlitePool, id: i64) -> DBResult<entities::Account> {
    let mut tx = pool.begin().await?;

    sqlx::query("UPDATE accounts SET usual = ? WHERE id = ?")
        .bind(true)
        .bind(id)
        .execute(&mut *tx)
        .await?;
    sqlx::query("UPDATE accounts SET usual = ? WHERE id != ?")
        .bind(false)
        .bind(id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    let account = query_as::<_, entities::Account>("SELECT * FROM accounts WHERE id = ?")
        .bind(id)
        .fetch_one(pool)
        .await?;

    Ok(account)
}

pub(crate) async fn get_instruction(pool: &SqlitePool) -> DBResult<entities::Instruction> {
    let instruction = query_as::<_, entities::Instruction>("SELECT * FROM instructions")
        .fetch_one(pool)
        .await?;

    Ok(instruction)
}

pub(crate) async fn init_instruction(pool: &SqlitePool) -> DBResult<entities::Instruction> {
    let mut tx = pool.begin().await?;

    let exists = query_as::<_, entities::Instruction>("SELECT * FROM instructions")
        .fetch_one(&mut *tx)
        .await;
    match exists {
        Ok(instruction) => {
            tx.commit().await?;
            Ok(instruction)
        }
        Err(_) => {
            let _ = sqlx::query("INSERT INTO instructions (instruction) VALUES (?)")
                .bind(0)
                .execute(&mut *tx)
                .await?;
            let instruction = query_as::<_, entities::Instruction>("SELECT * FROM instructions")
                .fetch_one(&mut *tx)
                .await?;
            tx.commit().await?;
            Ok(instruction)
        }
    }
}

pub(crate) async fn update_instruction(
    pool: &SqlitePool,
    step: u32,
) -> DBResult<entities::Instruction> {
    let mut tx = pool.begin().await?;

    let exists = query_as::<_, entities::Instruction>("SELECT * FROM instructions")
        .fetch_one(&mut *tx)
        .await?;
    if exists.instruction >= step {
        return Ok(exists);
    }

    sqlx::query("UPDATE instructions SET instruction = ?")
        .bind(step)
        .execute(&mut *tx)
        .await?;
    let instruction = query_as::<_, entities::Instruction>("SELECT * FROM instructions")
        .fetch_one(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(instruction)
}
