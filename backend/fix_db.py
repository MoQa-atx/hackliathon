import sqlite3

conn = sqlite3.connect('complaints.db')
c = conn.cursor()

# Get all complaints
c.execute("SELECT id, status FROM complaints")
rows = c.fetchall()

for row in rows:
    c_id, status = row
    if not status: continue
    
    status_lower = status.lower()
    new_status = status
    
    if status_lower in ["çözüldü", "cozuldu"]:
        new_status = "Çözüldü"
    elif status_lower == "bekliyor":
        new_status = "Bekliyor"
    elif status_lower in ["işleme alındı", "isleme alindi"]:
        new_status = "İşleme Alındı"
    elif status_lower in ["çözülemedi", "cozulemedi"]:
        new_status = "Çözülemedi"
        
    if new_status != status:
        c.execute("UPDATE complaints SET status = ? WHERE id = ?", (new_status, c_id))

conn.commit()
conn.close()
print("DB statuses fixed!")
