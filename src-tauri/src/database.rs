use std::str::FromStr;

use sqlx::{
    query_as,
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    SqlitePool,
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
