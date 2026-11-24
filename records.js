const router = require("express").Router();
const pool = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];
const COLUMNS = "id, title, category, description, status";
const MAX_ID = 2147483647;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function parseId(value) {
  if (!/^\d+$/.test(value)) throw new HttpError(400, "Id must be a positive whole number.");
  const id = Number(value);
  if (id < 1) throw new HttpError(400, "Id must be a positive whole number.");
  return id;
}

function validateBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object.");
  }
  for (const field of ["title", "category", "description", "status"]) {
    if (typeof body[field] !== "string") throw new HttpError(400, `${field[0].toUpperCase() + field.slice(1)} is required and must be text.`);
  }
  const rec = {
    title: body.title.trim(),
    category: body.category.trim(),
    description: body.description.trim(),
    status: body.status.trim()
  };
  if (rec.title.length < 3 || rec.title.length > 80) throw new HttpError(400, "Title must have 3 to 80 characters.");
  if (rec.category.length < 2 || rec.category.length > 40) throw new HttpError(400, "Category must have 2 to 40 characters.");
  if (rec.description.length < 5 || rec.description.length > 300) throw new HttpError(400, "Description must have 5 to 300 characters.");
  if (!STATUSES.includes(rec.status)) throw new HttpError(400, "Status must be Pending, In progress or Completed.");
  return rec; // any client-supplied id is ignored
}

const notFound = () => new HttpError(404, "Record not found.");

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT ${COLUMNS} FROM records ORDER BY id`);
    res.status(200).json(result.rows);
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id > MAX_ID) throw notFound();
    const result = await pool.query(`SELECT ${COLUMNS} FROM records WHERE id = $1`, [id]);
    if (result.rowCount === 0) throw notFound();
    res.status(200).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const r = validateBody(req.body);
    const result = await pool.query(
      `INSERT INTO records (title, category, description, status)
       VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [r.title, r.category, r.description, r.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const r = validateBody(req.body);
    if (id > MAX_ID) throw notFound();
    const result = await pool.query(
      `UPDATE records SET title = $1, category = $2, description = $3, status = $4
       WHERE id = $5 RETURNING ${COLUMNS}`,
      [r.title, r.category, r.description, r.status, id]
    );
    if (result.rowCount === 0) throw notFound();
    res.status(200).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id > MAX_ID) throw notFound();
    const result = await pool.query("DELETE FROM records WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) throw notFound();
    res.status(200).json({ message: "Record deleted." });
  } catch (error) { next(error); }
});

module.exports = router;
