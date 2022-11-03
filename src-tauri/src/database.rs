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

pub(crate) async fn list_accounts(pool: &SqlitePool) -> DBResult<Vec<entities::Account>> {
    let users = query_as::<_, entities::Account>("select * from accounts")
        .fetch_all(pool)
        .await?;

    Ok(users)
}
