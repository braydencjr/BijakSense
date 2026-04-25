import pandas as pd
import os
import glob
import io
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get DB URL and convert asyncpg to sync psycopg2
db_url = os.getenv("DATABASE_URL")
if db_url and "asyncpg" in db_url:
    db_url = db_url.replace("asyncpg", "psycopg2")

if not db_url:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

engine = create_engine(db_url)

def psql_insert_copy(table, conn, keys, data_iter):
    """
    Optimized copy method for pandas to_sql
    """
    # gets a actually connection from the sqlalchemy connection
    dbapi_conn = conn.connection
    with dbapi_conn.cursor() as cur:
        s_buf = io.StringIO()
        writer = pd.DataFrame(data_iter, columns=keys)
        writer.to_csv(s_buf, index=False, header=False)
        s_buf.seek(0)
        
        columns = ', '.join(['"{}"'.format(k) for k in keys])
        if table.schema:
            table_name = '{}."{}"'.format(table.schema, table.name)
        else:
            table_name = '"{}"'.format(table.name)
            
        sql = 'COPY {} ({}) FROM STDIN WITH CSV'.format(table_name, columns)
        cur.copy_expert(sql=sql, file=s_buf)

def import_parquet_files(directory, table_name):
    files = glob.glob(os.path.join(directory, "*.parquet"))
    files.sort()
    
    if not files:
        print(f"No parquet files found in {directory}")
        return

    print(f"Importing {len(files)} files into table '{table_name}' using COPY method...")
    
    for i, file_path in enumerate(files):
        print(f"[{i+1}/{len(files)}] Processing {os.path.basename(file_path)}...")
        try:
            df = pd.read_parquet(file_path)
            # Write to SQL using optimized COPY method
            df.to_sql(table_name, engine, if_exists='append', index=False, method=psql_insert_copy)
            
        except Exception as e:
            print(f"Error importing {file_path}: {e}")

def main():
    # Import lookups
    print("Importing lookups...")
    lookup_item = "lookups/lookup_item.parquet"
    lookup_premise = "lookups/lookup_premise.parquet"
    
    if os.path.exists(lookup_item):
        print(f"Reading {lookup_item}...")
        pd.read_parquet(lookup_item).to_sql('item', engine, if_exists='replace', index=False, method=psql_insert_copy)
        print("Imported item lookup.")
    
    if os.path.exists(lookup_premise):
        print(f"Reading {lookup_premise}...")
        pd.read_parquet(lookup_premise).to_sql('premise', engine, if_exists='replace', index=False, method=psql_insert_copy)
        print("Imported premise lookup.")

    # Import main datasets
    import_parquet_files("dataset", "price")

if __name__ == "__main__":
    main()
