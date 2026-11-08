import sqlite3
import os

db_path = r"d:\SIH\backend\crimegraph.db"
print(f"Checking DB at {db_path}")

try:
    if not os.path.exists(db_path):
        print("Database file does not exist!")
    else:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("Tables in database:")
        for table in tables:
            print(table[0])
        conn.close()
        print("Database is working correctly.")
except Exception as e:
    print(f"Error: {e}")
