const db = require("../config/db");

class LocationModel {
  static async findAll() {
    const [rows] = await db.execute("SELECT id, name, note FROM locations ORDER BY name");
    return rows;
  }

  static async create(data) {
    const sql = "INSERT INTO locations (name, note) VALUES (?, ?)";
    const values = [data.name ?? null, data.note ?? null];
    const [result] = await db.execute(sql, values);
    return { id: result.insertId, ...data };
  }
}

module.exports = LocationModel;