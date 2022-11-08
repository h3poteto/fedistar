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

pub(crate) async fn list_servers(pool: &SqlitePool) -> DBResult<Vec<entities::Server>> {
    let servers = query_as::<_, entities::Server>("select * from servers")
        .fetch_all(pool)
        .await?;

    Ok(servers)
}

pub(crate) async fn add_server(
    pool: &SqlitePool,
    server: entities::Server,
) -> DBResult<entities::Server> {
    let mut tx = pool.begin().await?;
    let mut created = server.clone();

    let res = sqlx::query("INSERT INTO servers (domain, base_url, thumbnail) VALUES (?, ?, ?)")
        .bind(server.domain)
        .bind(server.base_url)
        .bind(server.thumbnail)
        .execute(&mut tx)
        .await?;

    tx.commit().await?;
    let id = res.last_insert_rowid();
    created.id = id;
    Ok(created)
}

pub(crate) async fn add_account(
    pool: &SqlitePool,
    server: entities::Server,
    account: entities::Account,
) -> DBResult<entities::Account> {
    let mut tx = pool.begin().await?;
    let mut created = account.clone();

    let res = sqlx::query("INSERT INTO accounts (username, account_id, avatar, client_id, client_secret, access_token, refresh_token) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(account.username)
        .bind(account.account_id)
        .bind(account.avatar)
        .bind(account.client_id)
        .bind(account.client_secret)
        .bind(account.access_token)
        .bind(account.refresh_token)
        .execute(&mut tx)
        .await?;
    let id = res.last_insert_rowid();
    created.id = id;

    sqlx::query("UPDATE servers SET account_id = ? WHERE id = ?")
        .bind(id)
        .bind(server.id)
        .execute(&mut tx)
        .await?;

    tx.commit().await?;
    Ok(created)
}

pub(crate) async fn list_timelines(
    pool: &SqlitePool,
) -> DBResult<Vec<(entities::Timeline, entities::Server)>> {
    let timelines = sqlx::query(
        r#"
SELECT timelines.id, timelines.server_id, timelines.timeline, timelines.sort,
       servers.id, servers.domain, servers.base_url, servers.thumbnail, servers.account_id
FROM timelines INNER JOIN servers ON servers.id = timelines.server_id ORDER BY timelines.sort"#,
    )
    .map(|row: SqliteRow| {
        (
            entities::Timeline {
                id: row.get(0),
                server_id: row.get(1),
                timeline: row.get(2),
                sort: row.get(3),
            },
            entities::Server {
                id: row.get(4),
                domain: row.get(5),
                base_url: row.get(6),
                thumbnail: row.get(7),
                account_id: row.get(8),
            },
        )
    })
    .fetch_all(pool)
    .await?;

    Ok(timelines)
}

pub(crate) async fn add_timeline(
    pool: &SqlitePool,
    server: entities::Server,
    name: &str,
) -> DBResult<entities::Timeline> {
    let mut tx = pool.begin().await?;

    let exists = query_as::<_, entities::Timeline>("SELECT * FROM timelines ORDER BY sort DESC")
        .fetch_all(&mut tx)
        .await?;

    let mut sort = 1;
    if exists.len() > 0 {
        sort = exists[0].sort + 1;
    }
    let res = sqlx::query("INSERT INTO timelines (server_id, timeline, sort) VALUES (?, ?, ?)")
        .bind(server.id)
        .bind(name)
        .bind::<i64>(sort)
        .execute(&mut tx)
        .await?;
    let id = res.last_insert_rowid();
    tx.commit().await?;

    let created = entities::Timeline::new(id, server.id, name.to_string(), 1);
    Ok(created)
}

pub(crate) async fn get_account(pool: &SqlitePool, id: i64) -> DBResult<entities::Account> {
    let account = query_as::<_, entities::Account>("SELECT * FROM accounts WHERE id = ?")
        .bind(id)
        .fetch_one(pool)
        .await?;

    Ok(account)
}
